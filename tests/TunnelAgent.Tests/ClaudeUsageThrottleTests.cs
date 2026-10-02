using System;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using TunnelAgent.Services;
using Throttle = TunnelAgent.Services.QuotaFetchService.ClaudeUsageThrottle;

namespace TunnelAgent.Tests;

public sealed class ClaudeUsageThrottleTests
{
    private const string Account = "user@example.com";
    private const string Token = "sk-ant-oat01-token";
    private const string Body = """{ "five_hour": { "utilization": 42 } }""";

    private DateTimeOffset _now = DateTimeOffset.Parse("2026-10-02T12:00:00Z");

    private Throttle NewThrottle() => new(() => _now);

    [Fact]
    public void Check_FirstCall_Fetches()
    {
        var gate = NewThrottle().Check(Account, Token, force: false);

        Assert.Equal(Throttle.Decision.Fetch, gate.Decision);
        Assert.Null(gate.CachedBody);
    }

    [Fact]
    public void Check_WithinMinInterval_ReusesLastGoodBody()
    {
        var throttle = NewThrottle();
        throttle.RecordSuccess(Account, Token, Body);
        _now += TimeSpan.FromMinutes(4);

        var gate = throttle.Check(Account, Token, force: false);

        Assert.Equal(Throttle.Decision.UseCache, gate.Decision);
        Assert.Equal(Body, gate.CachedBody);
    }

    [Fact]
    public void Check_AfterMinInterval_FetchesAgain()
    {
        var throttle = NewThrottle();
        throttle.RecordSuccess(Account, Token, Body);
        _now += Throttle.MinInterval;

        Assert.Equal(Throttle.Decision.Fetch, throttle.Check(Account, Token, force: false).Decision);
    }

    [Fact]
    public void Check_Forced_BypassesMinInterval()
    {
        var throttle = NewThrottle();
        throttle.RecordSuccess(Account, Token, Body);

        Assert.Equal(Throttle.Decision.Fetch, throttle.Check(Account, Token, force: true).Decision);
    }

    [Fact]
    public void Check_IsPerAccount()
    {
        var throttle = NewThrottle();
        throttle.RecordSuccess(Account, Token, Body);
        throttle.RecordRateLimited(Account, null);

        Assert.Equal(Throttle.Decision.Fetch, throttle.Check("other@example.com", Token, force: false).Decision);
    }

    [Fact]
    public void RateLimited_WithoutRetryAfter_CoolsDownFiveMinutes_EvenWhenForced()
    {
        var throttle = NewThrottle();
        throttle.RecordSuccess(Account, Token, Body);
        _now += TimeSpan.FromMinutes(6);

        var (retryIn, cached) = throttle.RecordRateLimited(Account, null);
        Assert.Equal(Throttle.DefaultCooldown, retryIn);
        Assert.Equal(Body, cached);

        _now += TimeSpan.FromMinutes(2);
        var gate = throttle.Check(Account, Token, force: true);
        Assert.Equal(Throttle.Decision.RateLimited, gate.Decision);
        Assert.Equal(Body, gate.CachedBody);
        Assert.Equal(TimeSpan.FromMinutes(3), gate.RetryIn);

        _now += TimeSpan.FromMinutes(3);
        Assert.Equal(Throttle.Decision.Fetch, throttle.Check(Account, Token, force: false).Decision);
    }

    [Fact]
    public void RateLimited_HonoursRetryAfterSeconds()
    {
        var throttle = NewThrottle();

        var (retryIn, cached) = throttle.RecordRateLimited(Account, new RetryConditionHeaderValue(TimeSpan.FromSeconds(900)));

        Assert.Equal(TimeSpan.FromSeconds(900), retryIn);
        Assert.Null(cached);
        _now += TimeSpan.FromMinutes(10);
        Assert.Equal(Throttle.Decision.RateLimited, throttle.Check(Account, Token, force: false).Decision);
    }

    [Fact]
    public void RateLimited_RetryAfterZero_AllowsImmediateRetry()
    {
        var throttle = NewThrottle();

        var (retryIn, _) = throttle.RecordRateLimited(Account, new RetryConditionHeaderValue(TimeSpan.Zero));

        Assert.Equal(TimeSpan.Zero, retryIn);
        Assert.Equal(Throttle.Decision.Fetch, throttle.Check(Account, Token, force: false).Decision);
    }

    [Fact]
    public void Success_ClearsCooldown()
    {
        var throttle = NewThrottle();
        throttle.RecordRateLimited(Account, null);
        _now += Throttle.DefaultCooldown;

        throttle.RecordSuccess(Account, Token, Body);

        Assert.Equal(Throttle.Decision.UseCache, throttle.Check(Account, Token, force: false).Decision);
    }

    [Fact]
    public void Check_NewToken_DropsCachedBody_ButKeepsCooldown()
    {
        var throttle = NewThrottle();
        throttle.RecordSuccess(Account, Token, Body);

        var gate = throttle.Check(Account, "sk-ant-oat01-other", force: false);
        Assert.Equal(Throttle.Decision.Fetch, gate.Decision);
        Assert.Null(gate.CachedBody);

        var (_, cached) = throttle.RecordRateLimited(Account, null);
        Assert.Null(cached);
        Assert.Equal(Throttle.Decision.RateLimited, throttle.Check(Account, Token, force: false).Decision);
    }

    [Fact]
    public void Invalidate_DropsCachedBody_DuringCooldown()
    {
        var throttle = NewThrottle();
        throttle.RecordSuccess(Account, Token, Body);
        throttle.RecordRateLimited(Account, null);

        throttle.Invalidate(Account);

        var gate = throttle.Check(Account, Token, force: true);
        Assert.Equal(Throttle.Decision.RateLimited, gate.Decision);
        Assert.Null(gate.CachedBody);
    }

    [Fact]
    public void Invalidate_WithinMinInterval_Fetches()
    {
        var throttle = NewThrottle();
        throttle.RecordSuccess(Account, Token, Body);

        throttle.Invalidate(Account);

        Assert.Equal(Throttle.Decision.Fetch, throttle.Check(Account, Token, force: false).Decision);
    }

    [Fact]
    public async Task LockFor_SerialisesOverlappingRefreshes_SoSecondReusesFirstResult()
    {
        var throttle = NewThrottle();
        var calls = 0;

        async Task Refresh()
        {
            var accountLock = throttle.LockFor(Account);
            await accountLock.WaitAsync();
            try
            {
                if (throttle.Check(Account, Token, force: false).Decision != Throttle.Decision.Fetch) return;
                Interlocked.Increment(ref calls);
                await Task.Delay(50);
                throttle.RecordSuccess(Account, Token, Body);
            }
            finally
            {
                accountLock.Release();
            }
        }

        await Task.WhenAll(Refresh(), Refresh());

        Assert.Equal(1, calls);
        Assert.Same(throttle.LockFor(Account), throttle.LockFor(Account.ToUpperInvariant()));
    }

    [Fact]
    public void ParseRetryAfter_Missing_ReturnsNull() =>
        Assert.Null(Throttle.ParseRetryAfter(null, _now));

    [Fact]
    public void ParseRetryAfter_HttpDate_ReturnsDelta() =>
        Assert.Equal(TimeSpan.FromSeconds(120),
            Throttle.ParseRetryAfter(new RetryConditionHeaderValue(_now.AddSeconds(120)), _now));

    [Fact]
    public void ParseRetryAfter_HttpDateInPast_ReturnsZero() =>
        Assert.Equal(TimeSpan.Zero,
            Throttle.ParseRetryAfter(new RetryConditionHeaderValue(_now.AddMinutes(-1)), _now));

    [Fact]
    public void ParseRetryAfter_FromRawHeaders()
    {
        Assert.True(RetryConditionHeaderValue.TryParse("90", out var seconds));
        Assert.Equal(TimeSpan.FromSeconds(90), Throttle.ParseRetryAfter(seconds, _now));

        Assert.True(RetryConditionHeaderValue.TryParse("Fri, 02 Oct 2026 12:05:00 GMT", out var date));
        Assert.Equal(TimeSpan.FromMinutes(5), Throttle.ParseRetryAfter(date, _now));
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(30, 1)]
    [InlineData(60, 1)]
    [InlineData(61, 2)]
    [InlineData(300, 5)]
    public void ToRetryMinutes_RoundsUpWithMinimumOfOne(int seconds, int expected) =>
        Assert.Equal(expected, Throttle.ToRetryMinutes(TimeSpan.FromSeconds(seconds)));
}
