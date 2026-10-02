using System;
using System.Text.Json.Nodes;
using TunnelAgent.Services;

namespace TunnelAgent.Tests;

public sealed class ClaudeResetGrantParserTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.Parse("2026-10-02T12:00:00Z");

    [Fact]
    public void ParseClaudeResetGrants_ReturnsRedeemableGrants()
    {
        var block = JsonNode.Parse("""
            { "eligible": true, "next_grant_id": "opus_55",
              "grants": [
                { "id": "opus_55", "label": "Get extra wiggle room to explore Opus 5.5", "resets_total": 1,
                  "resets_left": 1, "ends_at": "2026-10-22T07:00:00Z", "clears": ["five_hour"], "usable_now": true },
                { "id": "weekly", "label": "Weekly reset", "resets_left": 2, "usable_now": true }
              ] }
            """);

        var grants = QuotaFetchService.ParseClaudeResetGrants(block, Now);

        Assert.Equal(
            [
                new QuotaFetchService.ClaudeResetGrant("opus_55", "Get extra wiggle room to explore Opus 5.5", 1, "2026-10-22T07:00:00Z", true),
                new QuotaFetchService.ClaudeResetGrant("weekly", "Weekly reset", 2, null, false),
            ],
            grants);
    }

    [Fact]
    public void ParseClaudeResetGrants_SkipsSpentPausedAndExpiredGrants()
    {
        var block = JsonNode.Parse("""
            { "eligible": true,
              "grants": [
                { "id": "spent", "resets_left": 0, "usable_now": true },
                { "id": "paused", "resets_left": 1, "paused": true, "usable_now": true },
                { "id": "expired", "resets_left": 1, "ends_at": "2026-10-01T00:00:00Z", "usable_now": true },
                { "id": "at_limit_only", "resets_left": 1, "usable_now": false }
              ] }
            """);

        var grants = QuotaFetchService.ParseClaudeResetGrants(block, Now);

        Assert.Equal([new QuotaFetchService.ClaudeResetGrant("at_limit_only", "", 1, null, false)], grants);
    }

    [Fact]
    public void ParseClaudeResetGrants_MalformedGrant_KeepsOtherGrants()
    {
        var block = JsonNode.Parse("""
            { "eligible": true,
              "grants": [
                { "id": "bad", "resets_left": "lots", "usable_now": true },
                { "id": "good", "resets_left": 1, "usable_now": true }
              ] }
            """);

        var grants = QuotaFetchService.ParseClaudeResetGrants(block, Now);

        Assert.Equal([new QuotaFetchService.ClaudeResetGrant("good", "", 1, null, true)], grants);
    }

    [Theory]
    [InlineData("""{ "eligible": false, "grants": [{ "id": "a", "resets_left": 1, "usable_now": true }] }""")]
    [InlineData("""{ "eligible": true, "grants": "oops" }""")]
    [InlineData("null")]
    public void ParseClaudeResetGrants_IneligibleOrMalformed_ReturnsEmpty(string json)
    {
        Assert.Empty(QuotaFetchService.ParseClaudeResetGrants(JsonNode.Parse(json), Now));
    }
}
