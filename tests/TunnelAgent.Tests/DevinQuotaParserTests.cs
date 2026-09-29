using System.Text.Json.Nodes;
using TunnelAgent.Services;

namespace TunnelAgent.Tests;

public sealed class DevinQuotaParserTests
{
    [Fact]
    public void ParseDevinUserStatus_FlipsRemainingAndReadsStringInt64()
    {
        var doc = JsonNode.Parse("""
            { "userStatus": { "planStatus": {
                "planInfo": { "planName": "Max" },
                "dailyQuotaRemainingPercent": 70,
                "weeklyQuotaRemainingPercent": 25,
                "dailyQuotaResetAtUnix": "1790668800",
                "weeklyQuotaResetAtUnix": "1791100800",
                "overageBalanceMicros": "12500000"
            } } }
            """);

        var (plan, bars, extra) = QuotaFetchService.ParseDevinUserStatus(doc)!.Value;

        Assert.Equal("Max", plan);
        Assert.Equal([("Daily", 30d, (long?)1790668800), ("Weekly", 75d, (long?)1791100800)], bars);
        Assert.Equal(12.5, extra);
    }

    [Fact]
    public void ParseDevinUserStatus_DailyResetWithoutPercent_IsExhausted()
    {
        var doc = JsonNode.Parse("""
            { "userStatus": { "planStatus": {
                "planInfo": { "planName": "Core" },
                "dailyQuotaResetAtUnix": "1790668800",
                "weeklyQuotaRemainingPercent": 25,
                "weeklyQuotaResetAtUnix": "1791100800"
            } } }
            """);

        var (_, bars, _) = QuotaFetchService.ParseDevinUserStatus(doc)!.Value;

        Assert.Equal([("Daily", 100d, (long?)1790668800), ("Weekly", 75d, (long?)1791100800)], bars);
    }

    [Fact]
    public void ParseDevinUserStatus_HiddenDaily_WeeklyResetWithoutPercent_IsExhausted()
    {
        var doc = JsonNode.Parse("""
            { "userStatus": { "planStatus": {
                "planInfo": { "hideDailyQuota": true },
                "dailyQuotaRemainingPercent": 80,
                "weeklyQuotaResetAtUnix": "1791100800"
            } } }
            """);

        var (_, bars, extra) = QuotaFetchService.ParseDevinUserStatus(doc)!.Value;

        Assert.Equal([("Weekly", 100d, (long?)1791100800)], bars);
        Assert.Null(extra);
    }

    [Fact]
    public void ParseDevinUserStatus_HiddenDaily_NoWeekly_ShowsDailyAsWeekly()
    {
        var doc = JsonNode.Parse("""
            { "userStatus": { "planStatus": {
                "planInfo": { "hideDailyQuota": true },
                "dailyQuotaRemainingPercent": 40
            } } }
            """);

        var (_, bars, _) = QuotaFetchService.ParseDevinUserStatus(doc)!.Value;

        Assert.Equal([("Weekly", 60d, (long?)null)], bars);
    }

    [Fact]
    public void ParseDevinUserStatus_NoPlanStatus_ReturnsNull() =>
        Assert.Null(QuotaFetchService.ParseDevinUserStatus(JsonNode.Parse("{}")));
}
