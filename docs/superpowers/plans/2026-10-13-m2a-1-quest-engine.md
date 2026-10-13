# M2a-1 Quest engine (server) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The emulator knows quests: their content, a per-player quest log saved in the database, objectives that progress from game signals, hand-in with rewards granted once, and the zone rules `StartQuest` / `QuestState` that work.

**Architecture:** Quest content is a new public content kind whose objectives, rewards and requirements are pieces, each piece type a plug-in (an objective kind, a reward kind, a zone condition). A new host module `Vortex.Rpg.Quests` owns the quest log grain (one per player), the shipped kinds, the signal producers (a bus handler for monster kills, a room listener for areas and decor, item handlers for held objectives) and the zone-rule pieces. Nothing in the engine names a kind.

**Tech Stack:** C# / .NET 10, Orleans grains, EF Core (MySQL; SQLite in tests), xUnit + FluentAssertions. Repository: `../vortex-rpg-emulator`.

**Spec:** `docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md` (§2.1, §2.3, §3.3, §3.4, §6, §7). This is plan 1 of 4: 2 is NPCs, dialogue and the wire; 3 the client; 4 the map editor and the demo zone.

## Global Constraints

- All work is in `D:\Developpment\Habbo\vortex-rpg-emulator`. Commit by explicit path only (`git commit -m "…" -- <paths>`), never `git add -A`/`.` (a hook blocks it). Commit messages in French, the repo's style: `Quêtes : …`.
- The owner's emulator may be running and locks `Vortex.Main/bin`: build and test with `--artifacts-path artifacts` (gitignored), e.g. `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`.
- `csharpier` reformats edited `.cs` files after each edit (post-edit hook): re-read a file before editing it again.
- One responsibility per class, one type per file; comments in English and say why; `dispose`-style rules from the client do not apply here.
- The schema is one migration, `InitialCreate`, regenerated (skill `.claude/skills/changing-the-schema`), plus a `scripts/sql/forward/009-…` for the owner's live database.
- Quest content ids start with `quest.`; quest state on the wire and in the database is `active`, `ready`, `done` (and `none` for a quest not in the log).
- At most 20 quests active or ready per player (`QuestLog.MaxActive`).
- Quest XP goes through `GainXpAsync(amount, "quest:<questId>")`, never `GrantXpAsync` (operator daily cap). Items go through `GrantItemsAsync("quest:<questId>:<playerId>:<n>", …)`.

## Review Focus

1. A hand-in clicked twice, or retried after a timeout, must grant the rewards once: the quest is written `done` before any grant (Task 6 test `CompletingTwice_GrantsOnce`).
2. A held `collect` objective whose items are sold must send the quest from `ready` back to `active`, and the hand-in must re-read the bag (Task 4 test `AHeldObjectiveDropping_SendsTheQuestBackToActive`, Task 6 test `Completing_ReReadsHeldObjectives`).
3. A signal must never push a counter past `count`, and must not touch a `done` quest (Task 4 tests `ACounter_StopsAtItsCount`, `ADoneQuest_IsNotCounted`).
4. A quest whose content was retired or removed after it was taken must not crash the log: it is kept as is, never counted, and refused at hand-in (Task 4 test `AQuestMissingFromTheContent_IsKeptAndIgnored`).
5. A piece with a misspelt field (`"mosnter"`) must be a load error naming the quest, not a silent never-matching objective (Task 1 test `AnUnknownFieldInAPiece_IsRefused`).

---

### Task 1: Quest content kind

**Files:**
- Create: `Vortex.Rpg/Content/Definitions/QuestDefinition.cs`
- Create: `Vortex.Rpg/Content/Definitions/QuestObjectiveDefinition.cs`
- Create: `Vortex.Rpg/Content/Definitions/QuestRewardDefinition.cs`
- Create: `Vortex.Rpg/Content/Rules/IQuestObjectiveRule.cs`
- Create: `Vortex.Rpg/Content/Rules/IQuestRewardRule.cs`
- Create: `Vortex.Rpg/Content/Rules/QuestFields.cs`
- Create: `Vortex.Rpg/Content/Kinds/QuestKind.cs`
- Test: `Vortex.Rpg.Tests/Content/QuestKindTests.cs`

**Interfaces:**
- Produces: `QuestDefinition { int Level; List<ZoneCondition> Requires; List<QuestObjectiveDefinition> Objectives; List<QuestRewardDefinition> Rewards }`; `QuestObjectiveDefinition { string Kind; int Count = 1; string? Text; Dictionary<string, JsonElement> Fields }`; `QuestRewardDefinition { string Kind; Dictionary<string, JsonElement> Fields }`; `IQuestObjectiveRule { string Kind; IEnumerable<string> Problems(QuestObjectiveDefinition, ContentCheck) }`; `IQuestRewardRule { string Kind; IEnumerable<string> Problems(QuestRewardDefinition, ContentCheck) }`; `QuestFields.Read<T>(IReadOnlyDictionary<string, JsonElement>) : T` (throws `JsonException`); `QuestFields.Problem<T>(fields) : string?`; `QuestKind(IEnumerable<IQuestObjectiveRule>, IEnumerable<IQuestRewardRule>)`.

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rpg.Tests/Content/QuestKindTests.cs
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using FluentAssertions;
using Vortex.Primitives.World.Rules;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Kinds;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;
using Xunit;

namespace Vortex.Rpg.Tests.Content;

/// <summary>The rules of a quest (spec M2a §2.1, §2.3): the engine names no piece kind, each kind checks its own fields.</summary>
public sealed class QuestKindTests
{
    private sealed record CountFields(string Monster);

    private sealed class TestObjective : IQuestObjectiveRule
    {
        public string Kind => "test_kill";

        public IEnumerable<string> Problems(QuestObjectiveDefinition objective, ContentCheck check) =>
            QuestFields.Problem<CountFields>(objective.Fields) is { } problem ? [problem] : [];
    }

    private sealed class TestReward : IQuestRewardRule
    {
        public string Kind => "test_xp";

        public IEnumerable<string> Problems(QuestRewardDefinition reward, ContentCheck check) => [];
    }

    private const string Json = """
        {
          "id": "quest.camp.wolves",
          "kind": "quest",
          "level": 1,
          "requires": [{"kind": "PlayerLevel", "min": 1, "max": 0}],
          "objectives": [{"kind": "test_kill", "monster": "monster.forest.wolf", "count": 3}],
          "rewards": [{"kind": "test_xp", "amount": 120}]
        }
        """;

    private static QuestKind Kind() => new([new TestObjective()], [new TestReward()]);

    private static string[] Codes(QuestDefinition quest) =>
        [
            .. Kind()
                .Check(quest, new ContentCheck(new Dictionary<string, ContentDefinition> { [quest.Id] = quest }, _ => false))
                .Select(f => f.Code),
        ];

    private static QuestDefinition Parse(string json) => (QuestDefinition)Kind().Parse(json);

    [Fact]
    public void AQuest_ParsesWithItsPiecesOwnFields()
    {
        QuestDefinition quest = Parse(Json);

        quest.Objectives.Single().Count.Should().Be(3);
        quest.Objectives.Single().Fields["monster"].GetString().Should().Be("monster.forest.wolf");
        quest.Rewards.Single().Fields["amount"].GetInt32().Should().Be(120);
        quest.Requires.Single().Should().BeOfType<PlayerLevelCondition>();
        Codes(quest).Should().BeEmpty();
    }

    [Fact]
    public void AnUnknownObjectiveKind_IsRefused() =>
        Codes(Parse(Json.Replace("\"test_kill\"", "\"fly\""))).Should().Equal("UnknownObjective");

    [Fact]
    public void AnUnknownRewardKind_IsRefused() =>
        Codes(Parse(Json.Replace("\"test_xp\"", "\"gold\""))).Should().Equal("UnknownReward");

    [Fact]
    public void ACountBelowOne_IsRefused() =>
        Codes(Parse(Json.Replace("\"count\": 3", "\"count\": 0"))).Should().Equal("BadCount");

    [Fact]
    public void AnUnknownFieldInAPiece_IsRefused() =>
        Codes(Parse(Json.Replace("\"monster\":", "\"mosnter\":"))).Should().Equal("BadObjective");

    [Fact]
    public void AQuestWithoutObjectives_IsRefused() =>
        Codes(Parse(Json.Replace("[{\"kind\": \"test_kill\", \"monster\": \"monster.forest.wolf\", \"count\": 3}]", "[]")))
            .Should()
            .Equal("NoObjective");

    [Fact]
    public void ARequirementOnAnUnknownQuest_IsRefused() =>
        Codes(Parse(Json.Replace("{\"kind\": \"PlayerLevel\", \"min\": 1, \"max\": 0}", "{\"kind\": \"QuestState\", \"quest\": \"quest.nope\", \"state\": \"done\"}")))
            .Should()
            .Equal("BrokenReference");

    [Fact]
    public void TheObjectiveTexts_AreTextKeys() =>
        Kind().TextKeys(Parse(Json)).Should().Equal("quest.camp.wolves.objective.0");

    [Fact]
    public void QuestFields_ReadsStrictly()
    {
        Dictionary<string, JsonElement> fields = new()
        {
            ["monster"] = JsonDocument.Parse("\"monster.forest.wolf\"").RootElement,
        };

        QuestFields.Read<CountFields>(fields).Monster.Should().Be("monster.forest.wolf");
        QuestFields.Problem<CountFields>(new Dictionary<string, JsonElement>()).Should().NotBeNull();
    }
}
```

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestKindTests"`
Expected: build FAIL, `QuestDefinition`, `QuestKind`, `IQuestObjectiveRule`… not found.

- [ ] **Step 3: Write the definitions**

```csharp
// Vortex.Rpg/Content/Definitions/QuestDefinition.cs
using System.Collections.Generic;
using Vortex.Primitives.World.Rules;

namespace Vortex.Rpg.Content.Definitions;

/// <summary>
/// A quest (spec M2a §2.1): what it asks (objectives), what it needs before it is offered
/// (requires, the zone rules' conditions) and what it gives (rewards). Each piece names a kind a
/// module declares; this record names none.
/// </summary>
public sealed record QuestDefinition : ContentDefinition
{
    /// <summary>The advised level, shown in the journal; it does not block.</summary>
    public required int Level { get; init; }

    public List<ZoneCondition> Requires { get; init; } = [];

    public required List<QuestObjectiveDefinition> Objectives { get; init; }

    public List<QuestRewardDefinition> Rewards { get; init; } = [];
}
```

```csharp
// Vortex.Rpg/Content/Definitions/QuestObjectiveDefinition.cs
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Vortex.Rpg.Content.Definitions;

/// <summary>
/// One objective of a quest (spec M2a §2.1): its kind, how many times, an optional text key, and the
/// kind's own fields, kept raw here and read strictly by the kind (<c>QuestFields.Read</c>).
/// </summary>
public sealed record QuestObjectiveDefinition
{
    public required string Kind { get; init; }

    public int Count { get; init; } = 1;

    /// <summary>The line's text key; by default <c>&lt;quest id&gt;.objective.&lt;index&gt;</c>.</summary>
    public string? Text { get; init; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement> Fields { get; init; } = [];
}
```

```csharp
// Vortex.Rpg/Content/Definitions/QuestRewardDefinition.cs
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Vortex.Rpg.Content.Definitions;

/// <summary>One reward of a quest (spec M2a §2.1): its kind and the kind's own fields, read by the kind.</summary>
public sealed record QuestRewardDefinition
{
    public required string Kind { get; init; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement> Fields { get; init; } = [];
}
```

- [ ] **Step 4: Write the rule interfaces and the field reader**

```csharp
// Vortex.Rpg/Content/Rules/IQuestObjectiveRule.cs
using System.Collections.Generic;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Content.Rules;

/// <summary>
/// What an objective kind requires of its fields (spec M2a §3.4). Declared by DI by the module that
/// runs the kind, so the import refuses a quest nobody could progress, and the core names no kind.
/// </summary>
public interface IQuestObjectiveRule
{
    /// <summary>The <see cref="QuestObjectiveDefinition.Kind"/> it answers to.</summary>
    public string Kind { get; }

    /// <summary>One sentence per field missing or wrong; empty when the objective is valid.</summary>
    public IEnumerable<string> Problems(QuestObjectiveDefinition objective, ContentCheck check);
}
```

```csharp
// Vortex.Rpg/Content/Rules/IQuestRewardRule.cs
using System.Collections.Generic;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Content.Rules;

/// <summary>What a reward kind requires of its fields (spec M2a §3.4), declared by the module that grants it.</summary>
public interface IQuestRewardRule
{
    public string Kind { get; }

    public IEnumerable<string> Problems(QuestRewardDefinition reward, ContentCheck check);
}
```

```csharp
// Vortex.Rpg/Content/Rules/QuestFields.cs
using System.Collections.Generic;
using System.Text.Json;

namespace Vortex.Rpg.Content.Rules;

/// <summary>
/// A quest piece's own fields, read into the kind's record with the content's strict options: a
/// missing required field, an unknown one or a wrong type is a <see cref="JsonException"/>.
/// </summary>
public static class QuestFields
{
    public static T Read<T>(IReadOnlyDictionary<string, JsonElement> fields) =>
        JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(fields, ContentJson.Options), ContentJson.Options)
        ?? throw new JsonException("The fields are null.");

    /// <summary>Why the fields do not read, or null when they do.</summary>
    public static string? Problem<T>(IReadOnlyDictionary<string, JsonElement> fields)
    {
        try
        {
            Read<T>(fields);

            return null;
        }
        catch (JsonException ex)
        {
            return ex.Message;
        }
    }
}
```

- [ ] **Step 5: Write the kind**

```csharp
// Vortex.Rpg/Content/Kinds/QuestKind.cs
using System.Collections.Generic;
using System.Linq;
using Vortex.Primitives.World.Rules;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Content.Kinds;

/// <summary>Quests (spec M2a §2.1, §2.3): public, the journal reads them; each piece checked by its own kind.</summary>
public sealed class QuestKind(IEnumerable<IQuestObjectiveRule> objectives, IEnumerable<IQuestRewardRule> rewards)
    : ContentKind<QuestDefinition>
{
    private readonly Dictionary<string, IQuestObjectiveRule> _objectives = objectives.ToDictionary(r => r.Kind);
    private readonly Dictionary<string, IQuestRewardRule> _rewards = rewards.ToDictionary(r => r.Kind);

    public override string Kind => "quest";

    public override bool Public => true;

    protected override IEnumerable<string> TextKeys(QuestDefinition q) =>
        q.Objectives.Select((o, i) => o.Text ?? $"{q.Id}.objective.{i}");

    protected override IEnumerable<ContentFinding> Check(QuestDefinition q, ContentCheck check)
    {
        if (q.Objectives.Count == 0)
        {
            yield return Error("NoObjective", q.Id, "A quest asks for at least one thing.");
        }

        for (int i = 0; i < q.Objectives.Count; i++)
        {
            QuestObjectiveDefinition o = q.Objectives[i];

            if (!_objectives.TryGetValue(o.Kind, out IQuestObjectiveRule? rule))
            {
                yield return Error("UnknownObjective", q.Id, $"objectives[{i}]: no module runs the kind '{o.Kind}'.");

                continue;
            }

            if (o.Count < 1)
            {
                yield return Error("BadCount", q.Id, $"objectives[{i}]: count {o.Count}, at least 1.");
            }

            foreach (string problem in rule.Problems(o, check))
            {
                yield return Error("BadObjective", q.Id, $"objectives[{i}] ({o.Kind}): {problem}");
            }
        }

        for (int i = 0; i < q.Rewards.Count; i++)
        {
            QuestRewardDefinition r = q.Rewards[i];

            if (!_rewards.TryGetValue(r.Kind, out IQuestRewardRule? rule))
            {
                yield return Error("UnknownReward", q.Id, $"rewards[{i}]: no module grants the kind '{r.Kind}'.");

                continue;
            }

            foreach (string problem in rule.Problems(r, check))
            {
                yield return Error("BadReward", q.Id, $"rewards[{i}] ({r.Kind}): {problem}");
            }
        }

        foreach (QuestStateCondition required in q.Requires.OfType<QuestStateCondition>())
        {
            if (!check.Is<QuestDefinition>(required.Quest))
            {
                yield return Error("BrokenReference", q.Id, $"requires: no quest '{required.Quest}'.");
            }
        }
    }
}
```

- [ ] **Step 6: Run the tests**

Run: `dotnet test Vortex.Rpg.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestKindTests"`
Expected: PASS, 9 tests. If `AQuest_ParsesWithItsPiecesOwnFields` fails on `requires` because the condition's `kind` must come first, the JSON already writes it first: the failure is elsewhere, read it.

- [ ] **Step 7: Commit**

```bash
git add -- Vortex.Rpg/Content/Definitions/QuestDefinition.cs Vortex.Rpg/Content/Definitions/QuestObjectiveDefinition.cs Vortex.Rpg/Content/Definitions/QuestRewardDefinition.cs Vortex.Rpg/Content/Rules/IQuestObjectiveRule.cs Vortex.Rpg/Content/Rules/IQuestRewardRule.cs Vortex.Rpg/Content/Rules/QuestFields.cs Vortex.Rpg/Content/Kinds/QuestKind.cs Vortex.Rpg.Tests/Content/QuestKindTests.cs
git commit -m "Contenu : la sorte quest, ses objectifs, récompenses et conditions sont des pièces que chaque module vérifie" -- Vortex.Rpg/Content Vortex.Rpg.Tests/Content/QuestKindTests.cs
```

---

### Task 2: The quests module and its objective kinds

**Files:**
- Create: `Vortex.Rpg.Quests/Vortex.Rpg.Quests.csproj`, `Vortex.Rpg.Quests/QuestsModule.cs`
- Create: `Vortex.Primitives/Rpg/Quests/QuestSignal.cs`, `Vortex.Primitives/Rpg/Quests/QuestSignals.cs`
- Create: `Vortex.Rpg.Quests/Objectives/ICountedObjectiveKind.cs`, `IHeldObjectiveKind.cs`, `QuestHoldings.cs`
- Create: `Vortex.Rpg.Quests/Objectives/KillObjective.cs`, `KillFields.cs`, `ReachObjective.cs`, `ReachFields.cs`, `InteractObjective.cs`, `InteractFields.cs`, `TalkObjective.cs`, `TalkFields.cs`, `CollectObjective.cs`, `CollectFields.cs`
- Create: `Vortex.Rpg.Quests.Tests/Vortex.Rpg.Quests.Tests.csproj`, `Vortex.Rpg.Quests.Tests/Objectives/ObjectiveKindsTests.cs`, `Vortex.Rpg.Quests.Tests/Support/Pieces.cs`, `Vortex.Rpg.Quests.Tests/Support/TestContent.cs`
- Modify: `Vortex.Cloud.sln` (two projects), `Vortex.Main/Vortex.Main.csproj` (reference), `Vortex.Main/Program.cs:138` (one line after `MonstersModule`)

**Interfaces:**
- Consumes: Task 1's `QuestObjectiveDefinition`, `IQuestObjectiveRule`, `QuestFields`.
- Produces: `QuestSignal(string Name, string Zone, ImmutableDictionary<string, string> Subject, int Amount = 1)` (Orleans-serializable); `QuestSignals.MonsterKilled = "monster_killed"`, `AreaEntered = "area_entered"`, `DecorUsed = "decor_used"`, `NpcTalked = "npc_talked"`; `ICountedObjectiveKind : IQuestObjectiveRule { int Counts(QuestObjectiveDefinition, QuestSignal) }`; `IHeldObjectiveKind : IQuestObjectiveRule { int Current(QuestObjectiveDefinition, QuestHoldings) }`; `QuestHoldings(ImmutableDictionary<string, int> Items, int Level)`; kinds keyed `kill`, `reach`, `interact`, `talk`, `collect`.

- [ ] **Step 1: Create the projects**

```xml
<!-- Vortex.Rpg.Quests/Vortex.Rpg.Quests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <InternalsVisibleTo Include="Vortex.Rpg.Quests.Tests" />
    <InternalsVisibleTo Include="Vortex.Database.Tests" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Hosting" />
    <PackageReference Include="Microsoft.Orleans.Sdk" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\Vortex.Database\Vortex.Database.csproj" />
    <ProjectReference Include="..\Vortex.Events\Vortex.Events.csproj" />
    <ProjectReference Include="..\Vortex.Logging\Vortex.Logging.csproj" />
    <ProjectReference Include="..\Vortex.Primitives\Vortex.Primitives.csproj" />
    <ProjectReference Include="..\Vortex.Protocol\Vortex.Protocol.csproj" />
    <ProjectReference Include="..\Vortex.Rpg\Vortex.Rpg.csproj" />
  </ItemGroup>
</Project>
```

```xml
<!-- Vortex.Rpg.Quests.Tests/Vortex.Rpg.Quests.Tests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>disable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
    <PackageReference Include="xunit" />
    <PackageReference Include="xunit.runner.visualstudio" />
    <PackageReference Include="FluentAssertions" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\Vortex.Rpg.Quests\Vortex.Rpg.Quests.csproj" />
    <ProjectReference Include="..\Vortex.Tests.Support\Vortex.Tests.Support.csproj" />
  </ItemGroup>
</Project>
```

Run: `dotnet sln Vortex.Cloud.sln add Vortex.Rpg.Quests/Vortex.Rpg.Quests.csproj Vortex.Rpg.Quests.Tests/Vortex.Rpg.Quests.Tests.csproj`
Add `<ProjectReference Include="..\Vortex.Rpg.Quests\Vortex.Rpg.Quests.csproj" />` after the Skills line of `Vortex.Main/Vortex.Main.csproj`, and `<ProjectReference Include="..\Vortex.Rpg.Quests\Vortex.Rpg.Quests.csproj" />` to `Vortex.Database.Tests/Vortex.Database.Tests.csproj` (Task 6 tests the grain there).

- [ ] **Step 2: Write the failing tests**

```csharp
// Vortex.Rpg.Quests.Tests/Support/Pieces.cs
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text.Json;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;

namespace Vortex.Rpg.Quests.Tests.Support;

/// <summary>Objectives and signals written the way content and producers write them.</summary>
internal static class Pieces
{
    public static QuestObjectiveDefinition Objective(string kind, int count = 1, params (string Key, object Value)[] fields) =>
        new()
        {
            Kind = kind,
            Count = count,
            Fields = fields.ToDictionary(f => f.Key, f => JsonSerializer.SerializeToElement(f.Value)),
        };

    public static QuestSignal Signal(string name, string zone, params (string Key, string Value)[] subject) =>
        new(name, zone, subject.ToImmutableDictionary(s => s.Key, s => s.Value));
}
```

```csharp
// Vortex.Rpg.Quests.Tests/Objectives/ObjectiveKindsTests.cs
using System.Collections.Generic;
using System.Collections.Immutable;
using FluentAssertions;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Validation;
using Vortex.Rpg.Quests.Objectives;
using Vortex.Rpg.Quests.Tests.Support;
using Xunit;
using static Vortex.Rpg.Quests.Tests.Support.Pieces;

namespace Vortex.Rpg.Quests.Tests.Objectives;

/// <summary>Each shipped objective kind alone (spec M2a §2.1, §3.4): a signal and an objective in, an amount out.</summary>
public sealed class ObjectiveKindsTests
{
    private static readonly ContentCheck Content = new(
        new Dictionary<string, ContentDefinition>
        {
            ["monster.forest.wolf"] = TestContent.Wolf,
            ["item.material.amber_shard"] = TestContent.Shard,
        },
        _ => false
    );

    [Fact]
    public void Kill_MatchesItsMonster_ItsZone_AndItsRank()
    {
        KillObjective kill = new();
        QuestSignal wolf = Signal(QuestSignals.MonsterKilled, "camp", ("monster", "monster.forest.wolf"), ("rank", "normal"));

        kill.Counts(Objective("kill", 3, ("monster", "monster.forest.wolf")), wolf).Should().Be(1);
        kill.Counts(Objective("kill", 1, ("zone", "camp")), wolf).Should().Be(1);
        kill.Counts(Objective("kill", 1, ("zone", "forest")), wolf).Should().Be(0);
        kill.Counts(Objective("kill", 1, ("zone", "camp"), ("rank", "elite")), wolf).Should().Be(0);
        kill.Counts(Objective("kill", 1, ("monster", "monster.forest.wolf")), Signal(QuestSignals.AreaEntered, "camp", ("area", "x"))).Should().Be(0);
    }

    [Fact]
    public void Kill_NeedsAFilter_AKnownMonster_AndARank()
    {
        KillObjective kill = new();

        kill.Problems(Objective("kill"), Content).Should().NotBeEmpty();
        kill.Problems(Objective("kill", 1, ("monster", "monster.nope")), Content).Should().NotBeEmpty();
        kill.Problems(Objective("kill", 1, ("rank", "legendary")), Content).Should().NotBeEmpty();
        kill.Problems(Objective("kill", 1, ("monster", "monster.forest.wolf")), Content).Should().BeEmpty();
    }

    [Fact]
    public void Reach_Interact_AndTalk_MatchTheirPlace()
    {
        new ReachObjective().Counts(Objective("reach", 1, ("zone", "camp"), ("area", "clearing")), Signal(QuestSignals.AreaEntered, "camp", ("area", "clearing"))).Should().Be(1);
        new ReachObjective().Counts(Objective("reach", 1, ("zone", "camp"), ("area", "clearing")), Signal(QuestSignals.AreaEntered, "other", ("area", "clearing"))).Should().Be(0);
        new InteractObjective().Counts(Objective("interact", 1, ("zone", "camp"), ("object", "old_well")), Signal(QuestSignals.DecorUsed, "camp", ("object", "old_well"))).Should().Be(1);
        new TalkObjective().Counts(Objective("talk", 1, ("zone", "camp"), ("npc", "scout")), Signal(QuestSignals.NpcTalked, "camp", ("npc", "scout"))).Should().Be(1);
        new TalkObjective().Counts(Objective("talk", 1, ("zone", "camp"), ("npc", "scout")), Signal(QuestSignals.NpcTalked, "camp", ("npc", "elder"))).Should().Be(0);
        new ReachObjective().Problems(Objective("reach", 1, ("zone", "camp")), Content).Should().NotBeEmpty("area is required");
    }

    [Fact]
    public void Collect_CountsTheHoldings_AndNeedsAKnownItem()
    {
        CollectObjective collect = new();
        QuestHoldings holdings = new(ImmutableDictionary<string, int>.Empty.Add("item.material.amber_shard", 4), 2);

        collect.Current(Objective("collect", 5, ("item", "item.material.amber_shard")), holdings).Should().Be(4);
        collect.Problems(Objective("collect", 5, ("item", "item.nope")), Content).Should().NotBeEmpty();
        collect.Problems(Objective("collect", 5, ("item", "item.material.amber_shard"), ("consume", true)), Content).Should().BeEmpty();
    }
}
```

```csharp
// Vortex.Rpg.Quests.Tests/Support/TestContent.cs
using System.IO;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Tests.Support;

namespace Vortex.Rpg.Quests.Tests.Support;

/// <summary>A monster and an item of the shipped content, for the kinds' lookups.</summary>
internal static class TestContent
{
    public static readonly MonsterDefinition Wolf = Read<MonsterDefinition>("monster/forest_wolf.json");

    public static readonly ItemDefinition Shard = Read<ItemDefinition>("item/amber_shard.json");

    private static T Read<T>(string file) =>
        ContentJson.Deserialize<T>(File.ReadAllText(Path.Combine(RepositoryRoot(), "content", file)));

    private static string RepositoryRoot()
    {
        DirectoryInfo? at = new(System.AppContext.BaseDirectory);

        while (at is not null && !File.Exists(Path.Combine(at.FullName, "Vortex.Cloud.sln")))
        {
            at = at.Parent;
        }

        return at?.FullName ?? throw new DirectoryNotFoundException("Vortex.Cloud.sln not found above the test binaries.");
    }
}
```

(`ContentJson` refuses `$schema` only if the records lack it: the shipped files carry `"$schema"`, and `ContentSchemaTests.TheSchemaLine_IsAllowed` shows the records accept it.)

- [ ] **Step 3: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`
Expected: build FAIL, `KillObjective`, `QuestSignal`… not found.- [ ] **Step 3: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`
Expected: build FAIL, `KillObjective`, `QuestSignal`… not found.

- [ ] **Step 4: Write the signal and the two family interfaces**

```csharp
// Vortex.Primitives/Rpg/Quests/QuestSignal.cs
using System.Collections.Immutable;
using Orleans;

namespace Vortex.Primitives.Rpg.Quests;

/// <summary>
/// Something a player did that a quest may count (spec M2a §3.4): a name (<see cref="QuestSignals"/>),
/// the zone key it happened in, what it was about (monster, area, object, npc…) and how many.
/// A module that adds a signal sends it to the player's quest log; no quest code changes.
/// </summary>
[GenerateSerializer, Immutable]
public sealed record QuestSignal(
    [property: Id(0)] string Name,
    [property: Id(1)] string Zone,
    [property: Id(2)] ImmutableDictionary<string, string> Subject,
    [property: Id(3)] int Amount = 1
);
```

```csharp
// Vortex.Primitives/Rpg/Quests/QuestSignals.cs
namespace Vortex.Primitives.Rpg.Quests;

/// <summary>The signals shipped with M2a; a module adding one adds its constant where it lives.</summary>
public static class QuestSignals
{
    /// <summary>Subject: monster (content id), rank (normal, elite, boss).</summary>
    public const string MonsterKilled = "monster_killed";

    /// <summary>Subject: area (a zone area id).</summary>
    public const string AreaEntered = "area_entered";

    /// <summary>Subject: object (a zone decor id).</summary>
    public const string DecorUsed = "decor_used";

    /// <summary>Subject: npc (a zone npc id).</summary>
    public const string NpcTalked = "npc_talked";
}
```

```csharp
// Vortex.Rpg.Quests/Objectives/ICountedObjectiveKind.cs
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;

namespace Vortex.Rpg.Quests.Objectives;

/// <summary>An objective counted from signals (spec M2a §2.1): the counter only goes up.</summary>
public interface ICountedObjectiveKind : IQuestObjectiveRule
{
    /// <summary>What this signal adds to this objective; 0 when it does not match.</summary>
    public int Counts(QuestObjectiveDefinition objective, QuestSignal signal);
}
```

```csharp
// Vortex.Rpg.Quests/Objectives/IHeldObjectiveKind.cs
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;

namespace Vortex.Rpg.Quests.Objectives;

/// <summary>An objective read from what the player holds now (spec M2a §2.1): it can go down.</summary>
public interface IHeldObjectiveKind : IQuestObjectiveRule
{
    public int Current(QuestObjectiveDefinition objective, QuestHoldings holdings);
}
```

```csharp
// Vortex.Rpg.Quests/Objectives/QuestHoldings.cs
using System.Collections.Immutable;

namespace Vortex.Rpg.Quests.Objectives;

/// <summary>What a held objective reads: items by definition (bag and equipment) and the level.</summary>
public sealed record QuestHoldings(ImmutableDictionary<string, int> Items, int Level);
```

- [ ] **Step 5: Write the kinds**

```csharp
// Vortex.Rpg.Quests/Objectives/KillFields.cs
namespace Vortex.Rpg.Quests.Objectives;

/// <summary>kill's fields: at least one filter; all given must match.</summary>
public sealed record KillFields(string? Monster = null, string? Zone = null, string? Rank = null);
```

```csharp
// Vortex.Rpg.Quests/Objectives/KillObjective.cs
using System.Collections.Generic;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Quests.Objectives;

/// <summary>Kill monsters (spec M2a §2.1): one of a content id, of a zone, of a rank, or any mix.</summary>
public sealed class KillObjective : ICountedObjectiveKind
{
    private static readonly HashSet<string> Ranks = ["normal", "elite", "boss"];

    public string Kind => "kill";

    public int Counts(QuestObjectiveDefinition objective, QuestSignal signal)
    {
        if (signal.Name != QuestSignals.MonsterKilled)
        {
            return 0;
        }

        KillFields f = QuestFields.Read<KillFields>(objective.Fields);
        bool matches =
            (f.Monster is null || signal.Subject.GetValueOrDefault("monster") == f.Monster)
            && (f.Zone is null || signal.Zone == f.Zone)
            && (f.Rank is null || signal.Subject.GetValueOrDefault("rank") == f.Rank);

        return matches ? signal.Amount : 0;
    }

    public IEnumerable<string> Problems(QuestObjectiveDefinition objective, ContentCheck check)
    {
        if (QuestFields.Problem<KillFields>(objective.Fields) is { } problem)
        {
            yield return problem;

            yield break;
        }

        KillFields f = QuestFields.Read<KillFields>(objective.Fields);

        if (f.Monster is null && f.Zone is null && f.Rank is null)
        {
            yield return "names a monster, a zone or a rank.";
        }

        if (f.Monster is not null && !check.Is<MonsterDefinition>(f.Monster))
        {
            yield return $"no monster '{f.Monster}' in the content.";
        }

        if (f.Rank is not null && !Ranks.Contains(f.Rank))
        {
            yield return $"rank '{f.Rank}': normal, elite or boss.";
        }
    }
}
```

```csharp
// Vortex.Rpg.Quests/Objectives/ReachFields.cs
namespace Vortex.Rpg.Quests.Objectives;

public sealed record ReachFields(string Zone, string Area);
```

```csharp
// Vortex.Rpg.Quests/Objectives/ReachObjective.cs
using System.Collections.Generic;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Quests.Objectives;

/// <summary>Reach an area of a zone (spec M2a §2.1). The zone and area are the editor's ids: not content.</summary>
public sealed class ReachObjective : ICountedObjectiveKind
{
    public string Kind => "reach";

    public int Counts(QuestObjectiveDefinition objective, QuestSignal signal)
    {
        if (signal.Name != QuestSignals.AreaEntered)
        {
            return 0;
        }

        ReachFields f = QuestFields.Read<ReachFields>(objective.Fields);

        return signal.Zone == f.Zone && signal.Subject.GetValueOrDefault("area") == f.Area ? signal.Amount : 0;
    }

    public IEnumerable<string> Problems(QuestObjectiveDefinition objective, ContentCheck check) =>
        QuestFields.Problem<ReachFields>(objective.Fields) is { } problem ? [problem] : [];
}
```

```csharp
// Vortex.Rpg.Quests/Objectives/InteractFields.cs
namespace Vortex.Rpg.Quests.Objectives;

public sealed record InteractFields(string Zone, string Object);
```

```csharp
// Vortex.Rpg.Quests/Objectives/InteractObjective.cs
using System.Collections.Generic;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Quests.Objectives;

/// <summary>Use a decor object of a zone (spec M2a §2.1): a door, a lever, a well with an Interact trigger.</summary>
public sealed class InteractObjective : ICountedObjectiveKind
{
    public string Kind => "interact";

    public int Counts(QuestObjectiveDefinition objective, QuestSignal signal)
    {
        if (signal.Name != QuestSignals.DecorUsed)
        {
            return 0;
        }

        InteractFields f = QuestFields.Read<InteractFields>(objective.Fields);

        return signal.Zone == f.Zone && signal.Subject.GetValueOrDefault("object") == f.Object ? signal.Amount : 0;
    }

    public IEnumerable<string> Problems(QuestObjectiveDefinition objective, ContentCheck check) =>
        QuestFields.Problem<InteractFields>(objective.Fields) is { } problem ? [problem] : [];
}
```

```csharp
// Vortex.Rpg.Quests/Objectives/TalkFields.cs
namespace Vortex.Rpg.Quests.Objectives;

public sealed record TalkFields(string Zone, string Npc);
```

```csharp
// Vortex.Rpg.Quests/Objectives/TalkObjective.cs
using System.Collections.Generic;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Quests.Objectives;

/// <summary>Talk to an NPC of a zone (spec M2a §2.1); its signal comes with the NPCs (plan M2a-2).</summary>
public sealed class TalkObjective : ICountedObjectiveKind
{
    public string Kind => "talk";

    public int Counts(QuestObjectiveDefinition objective, QuestSignal signal)
    {
        if (signal.Name != QuestSignals.NpcTalked)
        {
            return 0;
        }

        TalkFields f = QuestFields.Read<TalkFields>(objective.Fields);

        return signal.Zone == f.Zone && signal.Subject.GetValueOrDefault("npc") == f.Npc ? signal.Amount : 0;
    }

    public IEnumerable<string> Problems(QuestObjectiveDefinition objective, ContentCheck check) =>
        QuestFields.Problem<TalkFields>(objective.Fields) is { } problem ? [problem] : [];
}
```

```csharp
// Vortex.Rpg.Quests/Objectives/CollectFields.cs
namespace Vortex.Rpg.Quests.Objectives;

/// <summary>collect's fields: the item, and whether the hand-in takes them.</summary>
public sealed record CollectFields(string Item, bool Consume = false);
```

```csharp
// Vortex.Rpg.Quests/Objectives/CollectObjective.cs
using System.Collections.Generic;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Quests.Objectives;

/// <summary>Have N of an item, bag and equipment (spec M2a §2.1); held, so selling them takes the quest back.</summary>
public sealed class CollectObjective : IHeldObjectiveKind
{
    public string Kind => "collect";

    public int Current(QuestObjectiveDefinition objective, QuestHoldings holdings) =>
        holdings.Items.GetValueOrDefault(QuestFields.Read<CollectFields>(objective.Fields).Item);

    public IEnumerable<string> Problems(QuestObjectiveDefinition objective, ContentCheck check)
    {
        if (QuestFields.Problem<CollectFields>(objective.Fields) is { } problem)
        {
            yield return problem;

            yield break;
        }

        string item = QuestFields.Read<CollectFields>(objective.Fields).Item;

        if (!check.Is<ItemDefinition>(item))
        {
            yield return $"no item '{item}' in the content.";
        }
    }
}
```

- [ ] **Step 6: Write the module**

```csharp
// Vortex.Rpg.Quests/QuestsModule.cs
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Vortex.Plugins.Abstractions;
using Vortex.Rpg.Content.Kinds;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Quests.Objectives;

namespace Vortex.Rpg.Quests;

/// <summary>
/// Quests (spec M2a): the content kind, the quest log grain, the kinds it ships. A module that brings
/// an objective or a reward kind declares one line, as here; the kind is both its content rule and
/// its runtime.
/// </summary>
public sealed class QuestsModule : IHostPluginModule
{
    public string Key => "vortex-rpg-quests";

    public void ConfigureServices(IServiceCollection services, HostApplicationBuilder builder)
    {
        services.AddSingleton<IContentKind, QuestKind>();

        AddObjective<KillObjective>(services);
        AddObjective<ReachObjective>(services);
        AddObjective<InteractObjective>(services);
        AddObjective<TalkObjective>(services);
        AddObjective<CollectObjective>(services);
    }

    private static void AddObjective<T>(IServiceCollection services)
        where T : class, IQuestObjectiveRule
    {
        services.AddSingleton<T>();
        services.AddSingleton<IQuestObjectiveRule>(sp => sp.GetRequiredService<T>());
    }
}
```

(Take the `using` of `IHostPluginModule` from `Vortex.Rpg.Monsters/MonstersModule.cs`, whose namespace is the one to copy.) Then `Vortex.Main/Program.cs`, after `builder.Services.AddHostPlugin<MonstersModule>(builder);`:

```csharp
        builder.Services.AddHostPlugin<QuestsModule>(builder);
```

with `using Vortex.Rpg.Quests;` at the top.

- [ ] **Step 7: Run the tests**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`
Expected: PASS, 4 tests. Then `dotnet build Vortex.Main/Vortex.Main.csproj --artifacts-path artifacts`: no error.

- [ ] **Step 8: Commit**

```bash
git add -- Vortex.Rpg.Quests Vortex.Rpg.Quests.Tests Vortex.Primitives/Rpg/Quests
git commit -m "Quêtes : le module, les signaux et les objectifs kill, reach, interact, talk et collect" -- Vortex.Rpg.Quests Vortex.Rpg.Quests.Tests Vortex.Primitives/Rpg/Quests Vortex.Cloud.sln Vortex.Main/Vortex.Main.csproj Vortex.Main/Program.cs Vortex.Database.Tests/Vortex.Database.Tests.csproj
```

---

### Task 3: Reward kinds

**Files:**
- Create: `Vortex.Rpg.Quests/Rewards/IQuestRewardKind.cs`, `QuestGrant.cs`, `XpReward.cs`, `XpFields.cs`, `ItemsReward.cs`, `ItemsFields.cs`, `ItemsLine.cs`
- Modify: `Vortex.Rpg.Quests/QuestsModule.cs`
- Test: `Vortex.Rpg.Quests.Tests/Rewards/RewardKindsTests.cs`

**Interfaces:**
- Consumes: `IQuestRewardRule`, `QuestFields`, `IPlayerCharacterGrain.GainXpAsync(int, string)`, `IPlayerCharacterGrain.GrantItemsAsync(string, ItemGrantLine[])`.
- Produces: `IQuestRewardKind : IQuestRewardRule { Task GrantAsync(QuestRewardDefinition reward, QuestGrant grant) }`; `QuestGrant(IPlayerCharacterGrain Character, string QuestId, string GrantKey)`; kinds `xp`, `items`.

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rpg.Quests.Tests/Rewards/RewardKindsTests.cs
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Vortex.Primitives.Rpg.Characters;
using Vortex.Primitives.Rpg.Characters.Grains;
using Vortex.Primitives.Rpg.Items;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Validation;
using Vortex.Rpg.Quests.Rewards;
using Vortex.Rpg.Quests.Tests.Support;
using Vortex.Tests.Support;
using Xunit;

namespace Vortex.Rpg.Quests.Tests.Rewards;

/// <summary>Each shipped reward kind alone (spec M2a §3.3): what it asks the character for.</summary>
public sealed class RewardKindsTests
{
    private readonly List<string> _calls = [];

    private IPlayerCharacterGrain Character() =>
        FakeProxy.Create<IPlayerCharacterGrain>(call =>
        {
            switch (call.Method.Name)
            {
                case nameof(IPlayerCharacterGrain.GainXpAsync):
                    _calls.Add($"xp {call.Args![0]} {call.Args[1]}");

                    return Task.FromResult(XpGrantOutcome.Granted);
                case nameof(IPlayerCharacterGrain.GrantItemsAsync):
                    ItemGrantLine[] lines = (ItemGrantLine[])call.Args![1]!;
                    _calls.Add($"items {call.Args[0]} {string.Join(",", lines.Select(l => $"{l.DefinitionId}x{l.Quantity}"))}");

                    return Task.FromResult<ItemGrantResult>(null!);
                default:
                    return null;
            }
        });

    private static QuestRewardDefinition Reward(string kind, params (string Key, object Value)[] fields) =>
        new() { Kind = kind, Fields = fields.ToDictionary(f => f.Key, f => JsonSerializer.SerializeToElement(f.Value)) };

    [Fact]
    public async Task Xp_GoesThroughTheGain_NotTheOperatorGrant()
    {
        await new XpReward().GrantAsync(Reward("xp", ("amount", 120)), new QuestGrant(Character(), "quest.camp.wolves", "quest:quest.camp.wolves:7:0"));

        _calls.Should().Equal("xp 120 quest:quest.camp.wolves");
    }

    [Fact]
    public async Task Items_GoWithTheGrantKey()
    {
        QuestRewardDefinition reward = Reward("items", ("items", new[] { new { item = "item.weapon.rusted_sword", quantity = 1 } }));

        await new ItemsReward().GrantAsync(reward, new QuestGrant(Character(), "quest.camp.wolves", "quest:quest.camp.wolves:7:1"));

        _calls.Should().Equal("items quest:quest.camp.wolves:7:1 item.weapon.rusted_swordx1");
    }

    [Fact]
    public void TheirFields_AreChecked()
    {
        ContentCheck check = new(new Dictionary<string, ContentDefinition> { ["item.material.amber_shard"] = TestContent.Shard }, _ => false);

        new XpReward().Problems(Reward("xp", ("amount", 0)), check).Should().NotBeEmpty();
        new XpReward().Problems(Reward("xp", ("amount", 50)), check).Should().BeEmpty();
        new ItemsReward().Problems(Reward("items", ("items", new[] { new { item = "item.nope", quantity = 1 } })), check).Should().NotBeEmpty();
        new ItemsReward().Problems(Reward("items", ("items", new[] { new { item = "item.material.amber_shard", quantity = 0 } })), check).Should().NotBeEmpty();
        new ItemsReward().Problems(Reward("items", ("items", new[] { new { item = "item.material.amber_shard", quantity = 2 } })), check).Should().BeEmpty();
    }
}
```

(Take the exact name and namespace of the grant result type from `IPlayerCharacterGrain.GrantItemsAsync`'s signature: `ItemGrantResult` in `Vortex.Primitives.Rpg.Items`, or adjust the `using`.)

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts --filter "FullyQualifiedName~RewardKindsTests"`
Expected: build FAIL, `XpReward`, `QuestGrant` not found.

- [ ] **Step 3: Write the reward kinds**

```csharp
// Vortex.Rpg.Quests/Rewards/IQuestRewardKind.cs
using System.Threading.Tasks;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;

namespace Vortex.Rpg.Quests.Rewards;

/// <summary>A reward kind (spec M2a §3.4): its content rule and how it is given.</summary>
public interface IQuestRewardKind : IQuestRewardRule
{
    public Task GrantAsync(QuestRewardDefinition reward, QuestGrant grant);
}
```

```csharp
// Vortex.Rpg.Quests/Rewards/QuestGrant.cs
using Vortex.Primitives.Rpg.Characters.Grains;

namespace Vortex.Rpg.Quests.Rewards;

/// <summary>Who receives, for which quest, and the key that makes an items grant happen once.</summary>
public sealed record QuestGrant(IPlayerCharacterGrain Character, string QuestId, string GrantKey);
```

```csharp
// Vortex.Rpg.Quests/Rewards/XpFields.cs
namespace Vortex.Rpg.Quests.Rewards;

public sealed record XpFields(int Amount);
```

```csharp
// Vortex.Rpg.Quests/Rewards/XpReward.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Quests.Rewards;

/// <summary>
/// XP (spec M2a §3.3): through the character's gain, as a kill gives it — the operator grant has a
/// daily cap a quest must not hit. At most once: the log is written done before this runs.
/// </summary>
public sealed class XpReward : IQuestRewardKind
{
    public string Kind => "xp";

    public async Task GrantAsync(QuestRewardDefinition reward, QuestGrant grant) =>
        await grant.Character.GainXpAsync(QuestFields.Read<XpFields>(reward.Fields).Amount, $"quest:{grant.QuestId}");

    public IEnumerable<string> Problems(QuestRewardDefinition reward, ContentCheck check)
    {
        if (QuestFields.Problem<XpFields>(reward.Fields) is { } problem)
        {
            yield return problem;
        }
        else if (QuestFields.Read<XpFields>(reward.Fields).Amount < 1)
        {
            yield return "amount is at least 1.";
        }
    }
}
```

```csharp
// Vortex.Rpg.Quests/Rewards/ItemsLine.cs
namespace Vortex.Rpg.Quests.Rewards;

public sealed record ItemsLine(string Item, int Quantity);
```

```csharp
// Vortex.Rpg.Quests/Rewards/ItemsFields.cs
using System.Collections.Generic;

namespace Vortex.Rpg.Quests.Rewards;

public sealed record ItemsFields(List<ItemsLine> Items);
```

```csharp
// Vortex.Rpg.Quests/Rewards/ItemsReward.cs
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Vortex.Primitives.Rpg.Items;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Quests.Rewards;

/// <summary>Items (spec M2a §3.3): one grant under the quest's key, so a retry gives nothing twice; overflow goes to parcels.</summary>
public sealed class ItemsReward : IQuestRewardKind
{
    public string Kind => "items";

    public async Task GrantAsync(QuestRewardDefinition reward, QuestGrant grant) =>
        await grant.Character.GrantItemsAsync(
            grant.GrantKey,
            [.. QuestFields.Read<ItemsFields>(reward.Fields).Items.Select(l => new ItemGrantLine { DefinitionId = l.Item, Quantity = l.Quantity })]
        );

    public IEnumerable<string> Problems(QuestRewardDefinition reward, ContentCheck check)
    {
        if (QuestFields.Problem<ItemsFields>(reward.Fields) is { } problem)
        {
            yield return problem;

            yield break;
        }

        foreach (ItemsLine line in QuestFields.Read<ItemsFields>(reward.Fields).Items)
        {
            if (!check.Is<ItemDefinition>(line.Item))
            {
                yield return $"no item '{line.Item}' in the content.";
            }

            if (line.Quantity < 1)
            {
                yield return $"{line.Item}: quantity is at least 1.";
            }
        }
    }
}
```

In `QuestsModule.ConfigureServices`, after the objectives:

```csharp
        AddReward<XpReward>(services);
        AddReward<ItemsReward>(services);
```

```csharp
    private static void AddReward<T>(IServiceCollection services)
        where T : class, IQuestRewardKind
    {
        services.AddSingleton<T>();
        services.AddSingleton<IQuestRewardKind>(sp => sp.GetRequiredService<T>());
        services.AddSingleton<IQuestRewardRule>(sp => sp.GetRequiredService<T>());
    }
```

- [ ] **Step 4: Run the tests**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add -- Vortex.Rpg.Quests/Rewards Vortex.Rpg.Quests.Tests/Rewards
git commit -m "Quêtes : les récompenses xp (par le gain, sans plafond opérateur) et items (une fois, par clé)" -- Vortex.Rpg.Quests Vortex.Rpg.Quests.Tests
```

---

### Task 4: The quest log (pure)

**Files:**
- Create: `Vortex.Primitives/Rpg/Quests/QuestStatus.cs`, `Vortex.Primitives/Rpg/Quests/QuestCodes.cs`
- Create: `Vortex.Rpg.Quests/Log/QuestEntry.cs`, `Vortex.Rpg.Quests/Log/QuestLog.cs`, `Vortex.Rpg.Quests/Log/QuestBook.cs`
- Test: `Vortex.Rpg.Quests.Tests/Log/QuestLogTests.cs`

**Interfaces:**
- Consumes: Task 2's kinds and `QuestSignal`, `QuestHoldings`.
- Produces: `enum QuestStatus { None, Active, Ready, Done }` (Orleans-serializable) with `QuestStatusNames.Of(QuestStatus) : string` lower case; `QuestCodes.Ok = "ok"`, `LogFull = "quest.log_full"`, `NotOfferable = "quest.not_offerable"`, `NotReady = "quest.not_ready"`, `NotInLog = "quest.not_in_log"`; `QuestEntry { string QuestId; QuestStatus Status; int[] Progress; DateTime AcceptedAt; DateTime? CompletedAt }`; `QuestBook(Func<string, QuestDefinition?> quest, Func<string, IQuestObjectiveRule?> kind)` (the content and the kinds, by id); `QuestLog(QuestBook book, IEnumerable<QuestEntry> entries)` with `Accept(string questId, DateTime now) : string`, `Count(QuestSignal) : bool` (changed), `Hold(QuestHoldings) : bool`, `CanComplete(string) : string`, `MarkDone(string, DateTime)`, `Abandon(string) : string`, `StatusOf(string) : QuestStatus`, `Entries : IReadOnlyCollection<QuestEntry>`, `HasHeld : bool`, `const int MaxActive = 20`.

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rpg.Quests.Tests/Log/QuestLogTests.cs
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using FluentAssertions;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Quests.Log;
using Vortex.Rpg.Quests.Objectives;
using Xunit;
using static Vortex.Rpg.Quests.Tests.Support.Pieces;

namespace Vortex.Rpg.Quests.Tests.Log;

/// <summary>The log's rules (spec M2a §3.3): states, counters, the cap, and what it ignores.</summary>
public sealed class QuestLogTests
{
    private static readonly DateTime Now = new(2026, 10, 13, 12, 0, 0, DateTimeKind.Utc);

    private static QuestDefinition Quest(string id, params QuestObjectiveDefinition[] objectives) =>
        new() { Id = id, Kind = "quest", Level = 1, Objectives = [.. objectives] };

    private static readonly QuestDefinition Wolves = Quest("quest.wolves", Objective("kill", 3, ("monster", "monster.forest.wolf")));
    private static readonly QuestDefinition Shards = Quest("quest.shards", Objective("collect", 5, ("item", "item.material.amber_shard")));

    private static readonly Dictionary<string, QuestDefinition> Content = new() { [Wolves.Id] = Wolves, [Shards.Id] = Shards };

    private static readonly Dictionary<string, IQuestObjectiveRule> Kinds = new()
    {
        ["kill"] = new KillObjective(),
        ["collect"] = new CollectObjective(),
    };

    private static QuestLog Log(params QuestEntry[] entries) =>
        new(new QuestBook(id => Content.GetValueOrDefault(id), kind => Kinds.GetValueOrDefault(kind)), entries);

    private static QuestSignal Wolf() => Signal(QuestSignals.MonsterKilled, "camp", ("monster", "monster.forest.wolf"), ("rank", "normal"));

    private static QuestHoldings Holding(int shards) => new(ImmutableDictionary<string, int>.Empty.Add("item.material.amber_shard", shards), 1);

    [Fact]
    public void Accepting_PutsTheQuestActive_WithZeroProgress()
    {
        QuestLog log = Log();

        log.Accept(Wolves.Id, Now).Should().Be(QuestCodes.Ok);

        log.StatusOf(Wolves.Id).Should().Be(QuestStatus.Active);
        log.Entries.Single().Progress.Should().Equal(0);
    }

    [Fact]
    public void AQuestAlreadyTaken_OrUnknown_IsNotOfferable()
    {
        QuestLog log = Log();
        log.Accept(Wolves.Id, Now);

        log.Accept(Wolves.Id, Now).Should().Be(QuestCodes.NotOfferable);
        log.Accept("quest.nope", Now).Should().Be(QuestCodes.NotOfferable);
    }

    [Fact]
    public void TheLog_HoldsTwentyQuestsAtMost()
    {
        Dictionary<string, QuestDefinition> many = Enumerable.Range(0, 21).ToDictionary(i => $"quest.q{i}", i => Quest($"quest.q{i}", Objective("kill", 1, ("monster", "monster.forest.wolf"))));
        QuestLog log = new(new QuestBook(id => many.GetValueOrDefault(id), kind => Kinds.GetValueOrDefault(kind)), []);

        for (int i = 0; i < QuestLog.MaxActive; i++)
        {
            log.Accept($"quest.q{i}", Now).Should().Be(QuestCodes.Ok);
        }

        log.Accept("quest.q20", Now).Should().Be(QuestCodes.LogFull);
    }

    [Fact]
    public void ACounter_StopsAtItsCount_AndTheQuestTurnsReady()
    {
        QuestLog log = Log();
        log.Accept(Wolves.Id, Now);

        for (int i = 0; i < 5; i++)
        {
            log.Count(Wolf());
        }

        log.Entries.Single().Progress.Should().Equal(3);
        log.StatusOf(Wolves.Id).Should().Be(QuestStatus.Ready);
        log.CanComplete(Wolves.Id).Should().Be(QuestCodes.Ok);
    }

    [Fact]
    public void ASignalThatMatchesNothing_ChangesNothing() =>
        Log(new QuestEntry { QuestId = Wolves.Id, Status = QuestStatus.Active, Progress = [0], AcceptedAt = Now })
            .Count(Signal(QuestSignals.AreaEntered, "camp", ("area", "clearing")))
            .Should()
            .BeFalse();

    [Fact]
    public void ADoneQuest_IsNotCounted()
    {
        QuestLog log = Log(new QuestEntry { QuestId = Wolves.Id, Status = QuestStatus.Done, Progress = [3], AcceptedAt = Now, CompletedAt = Now });

        log.Count(Wolf()).Should().BeFalse();
        log.CanComplete(Wolves.Id).Should().Be(QuestCodes.NotReady);
    }

    [Fact]
    public void AHeldObjectiveDropping_SendsTheQuestBackToActive()
    {
        QuestLog log = Log();
        log.Accept(Shards.Id, Now);

        log.Hold(Holding(5)).Should().BeTrue();
        log.StatusOf(Shards.Id).Should().Be(QuestStatus.Ready);

        log.Hold(Holding(2)).Should().BeTrue();
        log.StatusOf(Shards.Id).Should().Be(QuestStatus.Active);
        log.Entries.Single().Progress.Should().Equal(2);
        log.HasHeld.Should().BeTrue();
    }

    [Fact]
    public void MarkingDone_ThenAbandoning()
    {
        QuestLog log = Log();
        log.Accept(Wolves.Id, Now);

        log.Abandon(Wolves.Id).Should().Be(QuestCodes.Ok);
        log.StatusOf(Wolves.Id).Should().Be(QuestStatus.None);
        log.Abandon(Wolves.Id).Should().Be(QuestCodes.NotInLog);

        log.Accept(Wolves.Id, Now);
        for (int i = 0; i < 3; i++)
        {
            log.Count(Wolf());
        }

        log.MarkDone(Wolves.Id, Now);
        log.StatusOf(Wolves.Id).Should().Be(QuestStatus.Done);
        log.Abandon(Wolves.Id).Should().Be(QuestCodes.NotInLog, "a done quest stays done");
        log.Accept(Wolves.Id, Now).Should().Be(QuestCodes.NotOfferable, "not repeatable in M2a");
    }

    [Fact]
    public void AQuestMissingFromTheContent_IsKeptAndIgnored()
    {
        QuestLog log = Log(new QuestEntry { QuestId = "quest.gone", Status = QuestStatus.Active, Progress = [1], AcceptedAt = Now });

        log.Count(Wolf()).Should().BeFalse();
        log.Hold(Holding(5)).Should().BeFalse();
        log.CanComplete("quest.gone").Should().Be(QuestCodes.NotReady);
        log.StatusOf("quest.gone").Should().Be(QuestStatus.Active);
    }

    [Fact]
    public void ProgressSavedWithFewerObjectives_IsWidenedToTheContent()
    {
        QuestLog log = Log(new QuestEntry { QuestId = Wolves.Id, Status = QuestStatus.Active, Progress = [], AcceptedAt = Now });

        log.Count(Wolf()).Should().BeTrue();
        log.Entries.Single().Progress.Should().Equal(1);
    }
}
```

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestLogTests"`
Expected: build FAIL, `QuestLog`, `QuestStatus` not found.

- [ ] **Step 3: Write the shared types**

```csharp
// Vortex.Primitives/Rpg/Quests/QuestStatus.cs
using Orleans;

namespace Vortex.Primitives.Rpg.Quests;

/// <summary>A quest for one player (spec M2a §2.2): not in the log, under way, all objectives met, handed in.</summary>
[GenerateSerializer]
public enum QuestStatus
{
    None = 0,
    Active = 1,
    Ready = 2,
    Done = 3,
}
```

```csharp
// Vortex.Primitives/Rpg/Quests/QuestCodes.cs
namespace Vortex.Primitives.Rpg.Quests;

/// <summary>A quest action's answer (spec M2a §3.2, RpgQuestResult): ok, or the refusal the client translates.</summary>
public static class QuestCodes
{
    public const string Ok = "ok";
    public const string LogFull = "quest.log_full";
    public const string NotOfferable = "quest.not_offerable";
    public const string NotReady = "quest.not_ready";
    public const string NotInLog = "quest.not_in_log";

    /// <summary>The wire and database spelling of a status: none, active, ready, done.</summary>
    public static string Name(QuestStatus status) => status.ToString().ToLowerInvariant();
}
```

- [ ] **Step 4: Write the entry, the book and the log**

```csharp
// Vortex.Rpg.Quests/Log/QuestEntry.cs
using System;
using Vortex.Primitives.Rpg.Quests;

namespace Vortex.Rpg.Quests.Log;

/// <summary>One quest of a player's log: its status and one counter per objective.</summary>
public sealed class QuestEntry
{
    public required string QuestId { get; init; }

    public required QuestStatus Status { get; set; }

    public required int[] Progress { get; set; }

    public required DateTime AcceptedAt { get; init; }

    public DateTime? CompletedAt { get; set; }
}
```

```csharp
// Vortex.Rpg.Quests/Log/QuestBook.cs
using System;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;

namespace Vortex.Rpg.Quests.Log;

/// <summary>What the log looks things up in: the quests of the content, the objective kinds of the host.</summary>
public sealed record QuestBook(Func<string, QuestDefinition?> Quest, Func<string, IQuestObjectiveRule?> Kind);
```

```csharp
// Vortex.Rpg.Quests/Log/QuestLog.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Quests.Objectives;

namespace Vortex.Rpg.Quests.Log;

/// <summary>
/// One player's quests (spec M2a §3.3), in memory: accept, count signals, read held objectives, hand
/// in, abandon. No clock, no store, no grain: the grain feeds it and saves what changed. A quest the
/// content no longer has is kept as it is and never moves (an import can bring it back).
/// </summary>
public sealed class QuestLog(QuestBook book, IEnumerable<QuestEntry> entries)
{
    public const int MaxActive = 20;

    private readonly Dictionary<string, QuestEntry> _entries = entries.ToDictionary(e => e.QuestId);

    public IReadOnlyCollection<QuestEntry> Entries => _entries.Values;

    /// <summary>Whether an active quest has an objective read from holdings: only then are they fetched.</summary>
    public bool HasHeld =>
        _entries.Values.Any(e => e.Status != QuestStatus.Done && book.Quest(e.QuestId) is { } q && q.Objectives.Any(o => book.Kind(o.Kind) is IHeldObjectiveKind));

    public QuestStatus StatusOf(string questId) => _entries.TryGetValue(questId, out QuestEntry? e) ? e.Status : QuestStatus.None;

    /// <summary>The quest's requirements are the caller's (the room's rules); here: known, not taken yet, room left.</summary>
    public string Accept(string questId, DateTime now)
    {
        if (_entries.ContainsKey(questId) || book.Quest(questId) is not { Retired: false } quest)
        {
            return QuestCodes.NotOfferable;
        }

        if (_entries.Values.Count(e => e.Status != QuestStatus.Done) >= MaxActive)
        {
            return QuestCodes.LogFull;
        }

        QuestEntry entry = new()
        {
            QuestId = questId,
            Status = QuestStatus.Active,
            Progress = new int[quest.Objectives.Count],
            AcceptedAt = now,
        };

        _entries[questId] = entry;
        Settle(entry, quest);

        return QuestCodes.Ok;
    }

    public bool Count(QuestSignal signal)
    {
        bool changed = false;

        foreach ((QuestEntry entry, QuestDefinition quest) in Open())
        {
            for (int i = 0; i < quest.Objectives.Count; i++)
            {
                QuestObjectiveDefinition o = quest.Objectives[i];

                if (book.Kind(o.Kind) is not ICountedObjectiveKind kind || entry.Progress[i] >= o.Count)
                {
                    continue;
                }

                int add = kind.Counts(o, signal);

                if (add > 0)
                {
                    entry.Progress[i] = Math.Min(o.Count, entry.Progress[i] + add);
                    changed = true;
                }
            }

            changed |= Settle(entry, quest);
        }

        return changed;
    }

    public bool Hold(QuestHoldings holdings)
    {
        bool changed = false;

        foreach ((QuestEntry entry, QuestDefinition quest) in Open())
        {
            for (int i = 0; i < quest.Objectives.Count; i++)
            {
                QuestObjectiveDefinition o = quest.Objectives[i];

                if (book.Kind(o.Kind) is not IHeldObjectiveKind kind)
                {
                    continue;
                }

                int now = Math.Min(o.Count, kind.Current(o, holdings));

                if (now != entry.Progress[i])
                {
                    entry.Progress[i] = now;
                    changed = true;
                }
            }

            changed |= Settle(entry, quest);
        }

        return changed;
    }

    public string CanComplete(string questId) =>
        _entries.TryGetValue(questId, out QuestEntry? e) && e.Status == QuestStatus.Ready && book.Quest(questId) is not null
            ? QuestCodes.Ok
            : QuestCodes.NotReady;

    public void MarkDone(string questId, DateTime now)
    {
        QuestEntry entry = _entries[questId];

        entry.Status = QuestStatus.Done;
        entry.CompletedAt = now;
    }

    public string Abandon(string questId)
    {
        if (!_entries.TryGetValue(questId, out QuestEntry? e) || e.Status == QuestStatus.Done)
        {
            return QuestCodes.NotInLog;
        }

        _entries.Remove(questId);

        return QuestCodes.Ok;
    }

    /// <summary>Quests under way whose content is known, their counters widened to the content's objectives.</summary>
    private IEnumerable<(QuestEntry, QuestDefinition)> Open()
    {
        foreach (QuestEntry entry in _entries.Values)
        {
            if (entry.Status == QuestStatus.Done || book.Quest(entry.QuestId) is not { } quest)
            {
                continue;
            }

            if (entry.Progress.Length != quest.Objectives.Count)
            {
                int[] widened = new int[quest.Objectives.Count];
                Array.Copy(entry.Progress, widened, Math.Min(entry.Progress.Length, widened.Length));
                entry.Progress = widened;
            }

            yield return (entry, quest);
        }
    }

    /// <summary>Ready when every counter is full, active otherwise; true when that changed.</summary>
    private static bool Settle(QuestEntry entry, QuestDefinition quest)
    {
        QuestStatus status = quest.Objectives.Select((o, i) => entry.Progress[i] >= o.Count).All(full => full)
            ? QuestStatus.Ready
            : QuestStatus.Active;

        if (status == entry.Status)
        {
            return false;
        }

        entry.Status = status;

        return true;
    }
}
```

- [ ] **Step 5: Run the tests**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`
Expected: PASS, 17 tests (4 + 3 + 10).

- [ ] **Step 6: Commit**

```bash
git add -- Vortex.Rpg.Quests/Log Vortex.Rpg.Quests.Tests/Log Vortex.Primitives/Rpg/Quests/QuestStatus.cs Vortex.Primitives/Rpg/Quests/QuestCodes.cs
git commit -m "Quêtes : le journal d'un joueur, ses états, compteurs plafonnés, objectifs possédés et limite de 20" -- Vortex.Rpg.Quests Vortex.Rpg.Quests.Tests Vortex.Primitives/Rpg/Quests
```

---

### Task 5: The quest table

**Files:**
- Create: `Vortex.Database/Entities/Rpg/RpgCharacterQuestEntity.cs`
- Modify: `Vortex.Database/Context/VortexDbContext.cs` (one DbSet after `RpgXpGrants`)
- Regenerate: `Vortex.Database/Migrations/*InitialCreate*`, `VortexDbContextModelSnapshot.cs`
- Create: `scripts/sql/forward/009-rpg-character-quests.sql`
- Create: `Vortex.Rpg.Quests/Persistence/QuestLogStore.cs`
- Test: `Vortex.Database.Tests/Rpg/QuestLogStoreTests.cs`

**Interfaces:**
- Consumes: `QuestEntry`, `QuestStatus`, `QuestCodes.Name`.
- Produces: table `rpg_character_quests` (id, created_at, updated_at, deleted_at from `VortexEntity`; `player_id`, `quest_id` varchar(64), `status` varchar(16), `progress` varchar(256) as comma-separated ints, `accepted_at`, `completed_at` nullable; unique index (player_id, quest_id)); `QuestLogStore(IDbContextFactory<VortexDbContext>)` with `Task<List<QuestEntry>> LoadAsync(PlayerId, CancellationToken)` and `Task SaveAsync(PlayerId, IReadOnlyCollection<QuestEntry>, CancellationToken)` (the rows become exactly the entries: insert, update, delete).

- [ ] **Step 1: Write the entity**

```csharp
// Vortex.Database/Entities/Rpg/RpgCharacterQuestEntity.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Vortex.Database.Entities.Rpg;

/// <summary>
/// One quest of a character's log (spec M2a §3.3): taken, under way or handed in. Owned by the quest
/// log grain, which reads them on activation and writes the log on each change; an abandoned quest's
/// row is deleted.
/// </summary>
[Table("rpg_character_quests")]
[Index(nameof(PlayerEntityId), nameof(QuestId), IsUnique = true)]
public class RpgCharacterQuestEntity : VortexEntity
{
    public const int StatusLength = 16;

    public const int ProgressLength = 256;

    [Column("player_id")]
    public required int PlayerEntityId { get; set; }

    [ForeignKey(nameof(PlayerEntityId))]
    public PlayerEntity? PlayerEntity { get; set; }

    [Column("quest_id")]
    [MaxLength(ContentIdLength)]
    public required string QuestId { get; set; }

    /// <summary>active, ready or done.</summary>
    [Column("status")]
    [MaxLength(StatusLength)]
    public required string Status { get; set; }

    /// <summary>One counter per objective, in order: "3,0,1".</summary>
    [Column("progress")]
    [MaxLength(ProgressLength)]
    public required string Progress { get; set; }

    [Column("accepted_at")]
    public required DateTime AcceptedAt { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }
}
```

In `VortexDbContext`, after the `RpgXpGrants` line:

```csharp
    public DbSet<RpgCharacterQuestEntity> RpgCharacterQuests { get; init; } = null!;
```

- [ ] **Step 2: Regenerate the migration and write the forward script**

Run: `node .claude/skills/changing-the-schema/scripts/regenerate-initialcreate.mjs`
Expected: `InitialCreate` regenerated; read its `Up()`: one new `CreateTable` `rpg_character_quests` with the columns above, the unique index, the foreign key to `players`; nothing else changed.

Write `scripts/sql/forward/009-rpg-character-quests.sql`: copy the `CREATE TABLE` of `rpg_character_quests` from `dotnet ef migrations script --artifacts-path artifacts` (the regenerated migration on an empty database) as `CREATE TABLE IF NOT EXISTS`, then move the `__EFMigrationsHistory` row from the previous `InitialCreate` id to the new one, the way `008-rpg-xp-grants.sql` does (open it and follow its two statements). Then:

Run: `pwsh .claude/skills/changing-the-schema/scripts/fresh-db.ps1 -Name vortex_schema_check`
Expected: the fresh database migrates and imports without error.

- [ ] **Step 3: Write the failing store tests**

```csharp
// Vortex.Database.Tests/Rpg/QuestLogStoreTests.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Vortex.Database.Context;
using Vortex.Database.Tests.Support;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Quests.Log;
using Vortex.Rpg.Quests.Persistence;
using Xunit;

namespace Vortex.Database.Tests.Rpg;

/// <summary>The quest log's rows (spec M2a §3.3): the table is exactly the log after each save.</summary>
public sealed class QuestLogStoreTests : IAsyncLifetime
{
    private static readonly PlayerId Player = new(7);
    private static readonly DateTime Now = new(2026, 10, 13, 12, 0, 0, DateTimeKind.Utc);

    private SqliteConnection _conn = null!;
    private DbContextOptions<VortexDbContext> _options = null!;

    public async Task InitializeAsync() => (_conn, _options) = await SqliteTestDb.OpenAsync();

    public async Task DisposeAsync() => await _conn.DisposeAsync();

    private QuestLogStore Store() => new(new OptionsDbContextFactory(_options));

    [Fact]
    public async Task ALog_RoundTrips()
    {
        await Store().SaveAsync(Player, [
            new QuestEntry { QuestId = "quest.a", Status = QuestStatus.Ready, Progress = [3, 1], AcceptedAt = Now },
            new QuestEntry { QuestId = "quest.b", Status = QuestStatus.Done, Progress = [1], AcceptedAt = Now, CompletedAt = Now },
        ], CancellationToken.None);

        List<QuestEntry> loaded = await Store().LoadAsync(Player, CancellationToken.None);

        loaded.Select(e => (e.QuestId, e.Status, string.Join(",", e.Progress), e.CompletedAt))
            .Should()
            .BeEquivalentTo([("quest.a", QuestStatus.Ready, "3,1", (DateTime?)null), ("quest.b", QuestStatus.Done, "1", (DateTime?)Now)]);
    }

    [Fact]
    public async Task ASave_UpdatesAndDeletesRows()
    {
        await Store().SaveAsync(Player, [
            new QuestEntry { QuestId = "quest.a", Status = QuestStatus.Active, Progress = [0], AcceptedAt = Now },
            new QuestEntry { QuestId = "quest.b", Status = QuestStatus.Active, Progress = [0], AcceptedAt = Now },
        ], CancellationToken.None);

        await Store().SaveAsync(Player, [
            new QuestEntry { QuestId = "quest.a", Status = QuestStatus.Ready, Progress = [2], AcceptedAt = Now },
        ], CancellationToken.None);

        List<QuestEntry> loaded = await Store().LoadAsync(Player, CancellationToken.None);

        loaded.Should().ContainSingle().Which.Progress.Should().Equal(2);
    }

    [Fact]
    public async Task AnotherPlayersRows_AreNotTouched()
    {
        await Store().SaveAsync(new PlayerId(8), [new QuestEntry { QuestId = "quest.a", Status = QuestStatus.Active, Progress = [0], AcceptedAt = Now }], CancellationToken.None);

        await Store().SaveAsync(Player, [], CancellationToken.None);

        (await Store().LoadAsync(new PlayerId(8), CancellationToken.None)).Should().ContainSingle();
    }
}
```

The `players` rows 7 and 8 must exist for the foreign key: if `SqliteTestDb.OpenAsync` does not seed players, add them at the start of each test the way `CharacterVitalsTests` stores its character (look at how `PlayerCharacterEntity` rows get a `PlayerEntityId` there; copy its player seeding if there is one, else enable it in the test with `db.Players.Add(...)` using the fields `PlayerEntity` requires).

- [ ] **Step 4: Run them to see them fail**

Run: `dotnet test Vortex.Database.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestLogStoreTests"`
Expected: build FAIL, `QuestLogStore` not found.

- [ ] **Step 5: Write the store**

```csharp
// Vortex.Rpg.Quests/Persistence/QuestLogStore.cs
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Vortex.Database.Context;
using Vortex.Database.Entities.Rpg;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Quests.Log;

namespace Vortex.Rpg.Quests.Persistence;

/// <summary>A player's quest rows (spec M2a §3.3): read once, then rewritten to match the log after each change.</summary>
public sealed class QuestLogStore(IDbContextFactory<VortexDbContext> dbFactory)
{
    public async Task<List<QuestEntry>> LoadAsync(PlayerId player, CancellationToken ct)
    {
        await using VortexDbContext db = await dbFactory.CreateDbContextAsync(ct);

        List<RpgCharacterQuestEntity> rows = await db
            .RpgCharacterQuests.AsNoTracking()
            .Where(r => r.PlayerEntityId == player.Value)
            .ToListAsync(ct);

        return [.. rows.Select(ToEntry)];
    }

    public async Task SaveAsync(PlayerId player, IReadOnlyCollection<QuestEntry> entries, CancellationToken ct)
    {
        await using VortexDbContext db = await dbFactory.CreateDbContextAsync(ct);

        Dictionary<string, RpgCharacterQuestEntity> rows = await db
            .RpgCharacterQuests.Where(r => r.PlayerEntityId == player.Value)
            .ToDictionaryAsync(r => r.QuestId, ct);

        foreach (QuestEntry entry in entries)
        {
            if (rows.Remove(entry.QuestId, out RpgCharacterQuestEntity? row))
            {
                row.Status = QuestCodes.Name(entry.Status);
                row.Progress = Join(entry.Progress);
                row.CompletedAt = entry.CompletedAt;
            }
            else
            {
                db.RpgCharacterQuests.Add(
                    new RpgCharacterQuestEntity
                    {
                        PlayerEntityId = player.Value,
                        QuestId = entry.QuestId,
                        Status = QuestCodes.Name(entry.Status),
                        Progress = Join(entry.Progress),
                        AcceptedAt = entry.AcceptedAt,
                        CompletedAt = entry.CompletedAt,
                    }
                );
            }
        }

        // What is left was abandoned.
        db.RpgCharacterQuests.RemoveRange(rows.Values);
        await db.SaveChangesAsync(ct);
    }

    private static QuestEntry ToEntry(RpgCharacterQuestEntity row) =>
        new()
        {
            QuestId = row.QuestId,
            Status = Enum.Parse<QuestStatus>(row.Status, ignoreCase: true),
            Progress = row.Progress.Length == 0 ? [] : [.. row.Progress.Split(',').Select(p => int.Parse(p, CultureInfo.InvariantCulture))],
            AcceptedAt = DateTime.SpecifyKind(row.AcceptedAt, DateTimeKind.Utc),
            CompletedAt = row.CompletedAt is { } done ? DateTime.SpecifyKind(done, DateTimeKind.Utc) : null,
        };

    private static string Join(int[] progress) => string.Join(',', progress.Select(p => p.ToString(CultureInfo.InvariantCulture)));
}
```

- [ ] **Step 6: Run the tests**

Run: `dotnet test Vortex.Database.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestLogStoreTests"`
Expected: PASS, 3 tests. Then `dotnet test Vortex.Database.Tests --artifacts-path artifacts`: all pass (`SeedCatalogTests` included).

- [ ] **Step 7: Commit**

```bash
git add -- Vortex.Database/Entities/Rpg/RpgCharacterQuestEntity.cs scripts/sql/forward/009-rpg-character-quests.sql Vortex.Rpg.Quests/Persistence Vortex.Database.Tests/Rpg/QuestLogStoreTests.cs
git commit -m "Quêtes : la table rpg_character_quests, InitialCreate régénérée, le script forward 009 et le stockage du journal" -- Vortex.Database Vortex.Rpg.Quests/Persistence Vortex.Database.Tests/Rpg/QuestLogStoreTests.cs scripts/sql/forward/009-rpg-character-quests.sql
```

---

### Task 6: The quest log grain

**Files:**
- Create: `Vortex.Primitives/Rpg/Quests/Grains/IQuestLogGrain.cs`, `Vortex.Primitives/Rpg/Quests/QuestEntrySnapshot.cs`, `Vortex.Primitives/Rpg/Quests/QuestLogSnapshot.cs`, `Vortex.Primitives/Rpg/Quests/QuestZoneFacts.cs`, `Vortex.Primitives/Events/Rpg/QuestLogChangedEvent.cs`
- Modify: `Vortex.Primitives/Orleans/GrainFactoryExtensions.cs` (one method after `GetPlayerCharacterGrain`)
- Create: `Vortex.Rpg.Quests/Grains/QuestLogGrain.cs`, `Vortex.Rpg.Quests/Grains/QuestHoldingsReader.cs`
- Test: `Vortex.Database.Tests/Rpg/QuestLogGrainTests.cs`

**Interfaces:**
- Consumes: `QuestLog`, `QuestBook`, `QuestLogStore`, the kinds (`IEnumerable<IQuestObjectiveRule>`, `IEnumerable<IQuestRewardKind>`), `IRpgContent.Get<QuestDefinition>`, `IPlayerCharacterGrain.GetItemsAsync()`, `GetSummaryAsync()`, `RemoveItemsAsync(string, int)`, `IPlayerPresenceGrain.OnZoneFactsChangedAsync(ZoneFacts, CancellationToken)`.
- Produces: `IQuestLogGrain : IGrainWithIntegerKey` with `Task<QuestLogSnapshot> GetLogAsync()`, `Task<string> AcceptAsync(string questId)`, `Task<string> CompleteAsync(string questId)`, `Task<string> AbandonAsync(string questId)`, `Task CountAsync(QuestSignal signal)`, `Task RefreshHeldAsync()`, `Task<QuestZoneFacts> GetZoneFactsAsync()`; `factory.GetQuestLogGrain(PlayerId)`; `QuestEntrySnapshot(string QuestId, QuestStatus Status, ImmutableArray<int> Progress)`; `QuestLogSnapshot(ImmutableArray<QuestEntrySnapshot> Entries)`; `QuestZoneFacts : ZoneFacts { ImmutableDictionary<string, string> States }` (quest id → status name, done included); `QuestLogChangedEvent(PlayerId PlayerId) : IEvent`, published after every change (plan M2a-2 pushes the wire from it).

- [ ] **Step 1: Write the shared types**

```csharp
// Vortex.Primitives/Rpg/Quests/Grains/IQuestLogGrain.cs
using System.Threading.Tasks;
using Orleans;

namespace Vortex.Primitives.Rpg.Quests.Grains;

/// <summary>
/// One player's quest log (spec M2a §3.3), keyed by player id. Every answer is a
/// <see cref="QuestCodes"/> value. Accept does not check the quest's requirements: they are zone
/// conditions, and the room that offers the quest checks them first.
/// </summary>
public interface IQuestLogGrain : IGrainWithIntegerKey
{
    public Task<QuestLogSnapshot> GetLogAsync();

    public Task<string> AcceptAsync(string questId);

    /// <summary>Hands the quest in: held objectives read again, items consumed, done written, then the rewards.</summary>
    public Task<string> CompleteAsync(string questId);

    public Task<string> AbandonAsync(string questId);

    public Task CountAsync(QuestSignal signal);

    /// <summary>What the player holds changed (an item, a level): held objectives are read again.</summary>
    public Task RefreshHeldAsync();

    public Task<QuestZoneFacts> GetZoneFactsAsync();
}
```

```csharp
// Vortex.Primitives/Rpg/Quests/QuestEntrySnapshot.cs
using System.Collections.Immutable;
using Orleans;

namespace Vortex.Primitives.Rpg.Quests;

[GenerateSerializer, Immutable]
public sealed record QuestEntrySnapshot(
    [property: Id(0)] string QuestId,
    [property: Id(1)] QuestStatus Status,
    [property: Id(2)] ImmutableArray<int> Progress
);
```

```csharp
// Vortex.Primitives/Rpg/Quests/QuestLogSnapshot.cs
using System.Collections.Immutable;
using Orleans;

namespace Vortex.Primitives.Rpg.Quests;

/// <summary>The whole log, as RpgQuestLog sends it (spec M2a §3.2).</summary>
[GenerateSerializer, Immutable]
public sealed record QuestLogSnapshot([property: Id(0)] ImmutableArray<QuestEntrySnapshot> Entries);
```

```csharp
// Vortex.Primitives/Rpg/Quests/QuestZoneFacts.cs
using System.Collections.Immutable;
using Orleans;
using Vortex.Primitives.World.Rules;

namespace Vortex.Primitives.Rpg.Quests;

/// <summary>
/// The quest log's part of what a zone knows of a player (spec M2a §3.3, Z1 §4.3): each quest in the
/// log by its status name (active, ready, done); a quest not there is "none". Pushed on each change.
/// </summary>
[GenerateSerializer, Immutable]
public sealed record QuestZoneFacts : ZoneFacts
{
    [Id(0)]
    public required ImmutableDictionary<string, string> States { get; init; }
}
```

```csharp
// Vortex.Primitives/Events/Rpg/QuestLogChangedEvent.cs
using Vortex.Primitives.Players;

namespace Vortex.Primitives.Events.Rpg;

/// <summary>A player's quest log changed (spec M2a §3.2): the wire and the markers follow it.</summary>
public sealed record QuestLogChangedEvent(PlayerId PlayerId) : IEvent;
```

In `GrainFactoryExtensions`, after `GetPlayerCharacterGrain`:

```csharp
    public static IQuestLogGrain GetQuestLogGrain(this IGrainFactory factory, PlayerId playerId) =>
        factory.GetGrain<IQuestLogGrain>((long)playerId.Value);
```

(Check that `IEvent` lives in `Vortex.Primitives.Events` as the other files of `Events/Rpg` use it; copy their `using`.)

- [ ] **Step 2: Write the failing grain tests**

```csharp
// Vortex.Database.Tests/Rpg/QuestLogGrainTests.cs
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Orleans;
using Vortex.Database.Context;
using Vortex.Database.Tests.Support;
using Vortex.Primitives.Events;
using Vortex.Primitives.Events.Rpg;
using Vortex.Primitives.Players.Grains;
using Vortex.Primitives.Rpg.Characters;
using Vortex.Primitives.Rpg.Characters.Grains;
using Vortex.Primitives.Rpg.Items;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.World.Rules;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Quests.Grains;
using Vortex.Rpg.Quests.Objectives;
using Vortex.Rpg.Quests.Rewards;
using Vortex.Tests.Support;
using Xunit;

namespace Vortex.Database.Tests.Rpg;

/// <summary>The quest log grain (spec M2a §3.3): saved on each change, rewards once, held objectives re-read.</summary>
public sealed class QuestLogGrainTests : IAsyncLifetime
{
    private const int Player = 7;

    private readonly List<string> _character = [];
    private readonly List<object> _published = [];
    private readonly List<ZoneFacts> _facts = [];
    private int _shards;

    private SqliteConnection _conn = null!;
    private DbContextOptions<VortexDbContext> _options = null!;

    public async Task InitializeAsync() => (_conn, _options) = await SqliteTestDb.OpenAsync();

    public async Task DisposeAsync() => await _conn.DisposeAsync();

    private static QuestObjectiveDefinition Objective(string kind, int count, params (string Key, object Value)[] fields) =>
        new() { Kind = kind, Count = count, Fields = fields.ToDictionary(f => f.Key, f => JsonSerializer.SerializeToElement(f.Value)) };

    private static QuestRewardDefinition Reward(string kind, params (string Key, object Value)[] fields) =>
        new() { Kind = kind, Fields = fields.ToDictionary(f => f.Key, f => JsonSerializer.SerializeToElement(f.Value)) };

    private static readonly QuestDefinition Wolves = new()
    {
        Id = "quest.wolves",
        Kind = "quest",
        Level = 1,
        Objectives = [Objective("kill", 2, ("monster", "monster.forest.wolf"))],
        Rewards = [Reward("xp", ("amount", 120)), Reward("items", ("items", new[] { new { item = "item.weapon.rusted_sword", quantity = 1 } }))],
    };

    private static readonly QuestDefinition Shards = new()
    {
        Id = "quest.shards",
        Kind = "quest",
        Level = 1,
        Objectives = [Objective("collect", 3, ("item", "item.material.amber_shard"), ("consume", true))],
    };

    private static QuestSignal Wolf() =>
        new(QuestSignals.MonsterKilled, "camp", ImmutableDictionary<string, string>.Empty.Add("monster", "monster.forest.wolf").Add("rank", "normal"));

    private IGrainFactory Grains() =>
        FakeProxy.Create<IGrainFactory>(call =>
        {
            Type grain = call.Method.GetGenericArguments()[0];

            if (grain == typeof(IPlayerCharacterGrain))
            {
                return FakeProxy.Create<IPlayerCharacterGrain>(inner =>
                {
                    switch (inner.Method.Name)
                    {
                        case nameof(IPlayerCharacterGrain.GainXpAsync):
                            _character.Add($"xp {inner.Args![0]}");

                            return Task.FromResult(XpGrantOutcome.Granted);
                        case nameof(IPlayerCharacterGrain.GrantItemsAsync):
                            _character.Add($"items {inner.Args![0]}");

                            return Task.FromResult<ItemGrantResult>(null!);
                        case nameof(IPlayerCharacterGrain.RemoveItemsAsync):
                            _character.Add($"remove {inner.Args![0]} {inner.Args[1]}");
                            _shards -= (int)inner.Args[1]!;

                            return Task.FromResult(ItemOutcome.Ok);
                        case nameof(IPlayerCharacterGrain.GetItemsAsync):
                            return Task.FromResult<CharacterItemSnapshot[]>(
                                _shards > 0 ? [new CharacterItemSnapshot { DefinitionId = "item.material.amber_shard", Quantity = _shards, Container = ItemContainer.Bag }] : []
                            );
                        case nameof(IPlayerCharacterGrain.GetSummaryAsync):
                            return Task.FromResult<CharacterSummary?>(new CharacterSummary { ClassId = "class.mage", SpecializationId = "spec.mage.fire", Level = 3, Xp = 0 });
                        default:
                            return null;
                    }
                });
            }

            return FakeProxy.Create<IPlayerPresenceGrain>(inner =>
            {
                if (inner.Method.Name == nameof(IPlayerPresenceGrain.OnZoneFactsChangedAsync))
                {
                    _facts.Add((ZoneFacts)inner.Args![0]!);
                }

                return Task.CompletedTask;
            });
        });

    private async Task<QuestLogGrain> ActivateAsync()
    {
        IRpgContent content = FakeProxy.Create<IRpgContent>(call =>
            call.Method.Name == nameof(IRpgContent.Get)
                ? (string)call.Args![0]! switch
                {
                    "quest.wolves" => Wolves,
                    "quest.shards" => Shards,
                    _ => null,
                }
                : null
        );

        QuestLogGrain grain = GrainActivationContext.CreateWithIntegerKey<QuestLogGrain>(
            Player,
            new OptionsDbContextFactory(_options),
            content,
            new IQuestObjectiveRule[] { new KillObjective(), new CollectObjective() },
            new IQuestRewardKind[] { new XpReward(), new ItemsReward() },
            Grains(),
            FakeProxy.Create<IEventPublisher>(call =>
            {
                _published.Add(call.Args![0]!);

                return null;
            }),
            NullLogger<QuestLogGrain>.Instance
        );

        await grain.OnActivateAsync(CancellationToken.None);

        return grain;
    }

    [Fact]
    public async Task Accepting_ThenCounting_IsSavedAndTold()
    {
        QuestLogGrain grain = await ActivateAsync();

        (await grain.AcceptAsync(Wolves.Id)).Should().Be(QuestCodes.Ok);
        await grain.CountAsync(Wolf());

        QuestLogGrain again = await ActivateAsync();
        QuestEntrySnapshot entry = (await again.GetLogAsync()).Entries.Single();

        (entry.QuestId, entry.Status, entry.Progress.Single()).Should().Be((Wolves.Id, QuestStatus.Active, 1));
        _published.OfType<QuestLogChangedEvent>().Should().HaveCount(2);
        ((QuestZoneFacts)_facts.Last()).States.Should().Contain(Wolves.Id, "active");
    }

    [Fact]
    public async Task CompletingTwice_GrantsOnce()
    {
        QuestLogGrain grain = await ActivateAsync();
        await grain.AcceptAsync(Wolves.Id);
        await grain.CountAsync(Wolf());
        await grain.CountAsync(Wolf());

        (await grain.CompleteAsync(Wolves.Id)).Should().Be(QuestCodes.Ok);
        (await grain.CompleteAsync(Wolves.Id)).Should().Be(QuestCodes.NotReady);

        _character.Should().Equal("xp 120", $"items quest:{Wolves.Id}:{Player}:1");
        (await (await ActivateAsync()).GetLogAsync()).Entries.Single().Status.Should().Be(QuestStatus.Done);
    }

    [Fact]
    public async Task CompletingAnActiveQuest_IsRefused()
    {
        QuestLogGrain grain = await ActivateAsync();
        await grain.AcceptAsync(Wolves.Id);

        (await grain.CompleteAsync(Wolves.Id)).Should().Be(QuestCodes.NotReady);
        _character.Should().BeEmpty();
    }

    [Fact]
    public async Task AcceptingACollectQuest_ReadsTheBagAtOnce()
    {
        _shards = 3;
        QuestLogGrain grain = await ActivateAsync();

        await grain.AcceptAsync(Shards.Id);

        (await grain.GetLogAsync()).Entries.Single().Status.Should().Be(QuestStatus.Ready);
    }

    [Fact]
    public async Task Completing_ReReadsHeldObjectives_AndConsumes()
    {
        _shards = 3;
        QuestLogGrain grain = await ActivateAsync();
        await grain.AcceptAsync(Shards.Id);

        _shards = 1;
        (await grain.CompleteAsync(Shards.Id)).Should().Be(QuestCodes.NotReady, "sold since: the bag is read again");

        _shards = 3;
        await grain.RefreshHeldAsync();
        (await grain.CompleteAsync(Shards.Id)).Should().Be(QuestCodes.Ok);
        _character.Should().Contain("remove item.material.amber_shard 3");
    }

    [Fact]
    public async Task Abandoning_RemovesTheRow()
    {
        QuestLogGrain grain = await ActivateAsync();
        await grain.AcceptAsync(Wolves.Id);

        (await grain.AbandonAsync(Wolves.Id)).Should().Be(QuestCodes.Ok);

        (await (await ActivateAsync()).GetLogAsync()).Entries.Should().BeEmpty();
    }
}
```

(Player 7's `players` row: seed it as `QuestLogStoreTests` does. The exact `CharacterSummary` and `CharacterItemSnapshot` required fields are in their records under `Vortex.Primitives/Rpg/`: fill every `required` one.)

- [ ] **Step 3: Run them to see them fail**

Run: `dotnet test Vortex.Database.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestLogGrainTests"`
Expected: build FAIL, `QuestLogGrain` not found.

- [ ] **Step 4: Write the holdings reader and the grain**

```csharp
// Vortex.Rpg.Quests/Grains/QuestHoldingsReader.cs
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using Vortex.Primitives.Rpg.Characters.Grains;
using Vortex.Primitives.Rpg.Items;
using Vortex.Rpg.Quests.Objectives;

namespace Vortex.Rpg.Quests.Grains;

/// <summary>What the character holds, for held objectives: bag and equipment by definition, and the level. Read only.</summary>
internal static class QuestHoldingsReader
{
    public static async Task<QuestHoldings> ReadAsync(IPlayerCharacterGrain character)
    {
        CharacterItemSnapshot[] items = await character.GetItemsAsync();
        int level = (await character.GetSummaryAsync())?.Level ?? 0;

        return new QuestHoldings(
            items
                .Where(i => i.Container is ItemContainer.Bag or ItemContainer.Equipment)
                .GroupBy(i => i.DefinitionId)
                .ToImmutableDictionary(g => g.Key, g => g.Sum(i => i.Quantity)),
            level
        );
    }
}
```

```csharp
// Vortex.Rpg.Quests/Grains/QuestLogGrain.cs
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Orleans;
using Vortex.Database.Context;
using Vortex.Logging.Extensions;
using Vortex.Primitives.Events;
using Vortex.Primitives.Events.Rpg;
using Vortex.Primitives.Orleans;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.Rpg.Quests.Grains;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Rules;
using Vortex.Rpg.Quests.Log;
using Vortex.Rpg.Quests.Objectives;
using Vortex.Rpg.Quests.Persistence;
using Vortex.Rpg.Quests.Rewards;

namespace Vortex.Rpg.Quests.Grains;

/// <summary>
/// One player's quest log (spec M2a §3.3): read from rpg_character_quests on activation, written on
/// every change, told to the zone (facts) and to the bus (QuestLogChangedEvent). The rules are
/// <see cref="QuestLog"/>'s; this one feeds it and grants. A hand-in writes done before granting, so
/// a retry finds it done: at most once.
/// </summary>
internal sealed class QuestLogGrain(
    IDbContextFactory<VortexDbContext> dbFactory,
    IRpgContent content,
    IEnumerable<IQuestObjectiveRule> objectives,
    IEnumerable<IQuestRewardKind> rewards,
    IGrainFactory grains,
    IEventPublisher events,
    ILogger<QuestLogGrain> logger
) : Grain, IQuestLogGrain
{
    private readonly Dictionary<string, IQuestObjectiveRule> _objectives = objectives.ToDictionary(k => k.Kind);
    private readonly Dictionary<string, IQuestRewardKind> _rewards = rewards.ToDictionary(k => k.Kind);
    private readonly QuestLogStore _store = new(dbFactory);

    // ponytail: monotonic for one process, as the character's zone facts; several silos need a stored sequence.
    private long _factsSequence = Stopwatch.GetTimestamp();

    private PlayerId _player;
    private QuestLog _log = null!;

    public TimeProvider Time { get; set; } = TimeProvider.System;

    public override async Task OnActivateAsync(CancellationToken ct)
    {
        _player = PlayerId.Parse((int)this.GetPrimaryKeyLong());
        _log = new QuestLog(
            new QuestBook(id => content.Get<QuestDefinition>(id), kind => _objectives.GetValueOrDefault(kind)),
            await _store.LoadAsync(_player, ct)
        );
    }

    public Task<QuestLogSnapshot> GetLogAsync() =>
        Task.FromResult(new QuestLogSnapshot([.. _log.Entries.Select(e => new QuestEntrySnapshot(e.QuestId, e.Status, [.. e.Progress]))]));

    public async Task<string> AcceptAsync(string questId)
    {
        string code = _log.Accept(questId, Now());

        if (code == QuestCodes.Ok)
        {
            await HoldAsync();
            await ChangedAsync();
        }

        return code;
    }

    public async Task<string> CompleteAsync(string questId)
    {
        // Held objectives are read again: shards sold since the last refresh make it active again.
        bool moved = await HoldAsync();

        if (_log.CanComplete(questId) != QuestCodes.Ok || content.Get<QuestDefinition>(questId) is not { } quest)
        {
            if (moved)
            {
                await ChangedAsync();
            }

            return QuestCodes.NotReady;
        }

        IPlayerCharacterGrain character = grains.GetPlayerCharacterGrain(_player);

        foreach (QuestObjectiveDefinition o in quest.Objectives.Where(o => o.Kind == "collect"))
        {
            CollectFields f = QuestFields.Read<CollectFields>(o.Fields);

            if (f.Consume)
            {
                await character.RemoveItemsAsync(f.Item, o.Count);
            }
        }

        _log.MarkDone(questId, Now());
        await ChangedAsync();

        for (int i = 0; i < quest.Rewards.Count; i++)
        {
            QuestRewardDefinition reward = quest.Rewards[i];

            try
            {
                await _rewards[reward.Kind].GrantAsync(reward, new QuestGrant(character, questId, $"quest:{questId}:{_player.Value}:{i}"));
            }
            catch (Exception ex)
            {
                // Done is written: the player keeps the quest handed in; the operator sees what was lost.
                logger.LogError(ex, "Quest {QuestId} of player {PlayerId}: reward {Index} ({Kind}) was not granted", questId, _player.Value, i, reward.Kind);
            }
        }

        return QuestCodes.Ok;
    }

    public async Task<string> AbandonAsync(string questId)
    {
        string code = _log.Abandon(questId);

        if (code == QuestCodes.Ok)
        {
            await ChangedAsync();
        }

        return code;
    }

    public async Task CountAsync(QuestSignal signal)
    {
        if (_log.Count(signal))
        {
            await ChangedAsync();
        }
    }

    public async Task RefreshHeldAsync()
    {
        if (await HoldAsync())
        {
            await ChangedAsync();
        }
    }

    public Task<QuestZoneFacts> GetZoneFactsAsync() => Task.FromResult(Facts());

    /// <summary>Reads holdings only when an open quest has a held objective; true when the log moved.</summary>
    private async Task<bool> HoldAsync() =>
        _log.HasHeld && _log.Hold(await QuestHoldingsReader.ReadAsync(grains.GetPlayerCharacterGrain(_player)));

    private async Task ChangedAsync()
    {
        await _store.SaveAsync(_player, _log.Entries, CancellationToken.None);

        events.PublishAsync(new QuestLogChangedEvent(_player)).LogAndForget(logger, "Publishing the quest log of {PlayerId}", _player.Value);

        try
        {
            grains
                .GetPlayerPresenceGrain(_player)
                .OnZoneFactsChangedAsync(Facts(), CancellationToken.None)
                .LogAndForget(logger, "Passing the quest facts of player {PlayerId} to its zone", _player.Value);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Quest facts of player {PlayerId} not sent", _player.Value);
        }
    }

    private QuestZoneFacts Facts() =>
        new()
        {
            Sequence = ++_factsSequence,
            States = _log.Entries.ToImmutableDictionary(e => e.QuestId, e => QuestCodes.Name(e.Status)),
        };

    private DateTime Now() => Time.GetUtcNow().UtcDateTime;
}
```

`events.PublishAsync(…).LogAndForget(…)` is the character grain's `Publish` (`PlayerCharacterGrain.cs`): if `PublishAsync` returns a `ValueTask`, call `.AsTask()` before `LogAndForget` exactly as that method does.

- [ ] **Step 5: Run the tests**

Run: `dotnet test Vortex.Database.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestLogGrainTests"`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add -- Vortex.Primitives/Rpg/Quests Vortex.Primitives/Events/Rpg/QuestLogChangedEvent.cs Vortex.Rpg.Quests/Grains Vortex.Database.Tests/Rpg/QuestLogGrainTests.cs
git commit -m "Quêtes : le grain du journal, enregistré à chaque changement, récompenses une seule fois, objectifs possédés relus" -- Vortex.Primitives Vortex.Rpg.Quests/Grains Vortex.Database.Tests/Rpg/QuestLogGrainTests.cs
```

---

### Task 7: The signal producers

**Files:**
- Create: `Vortex.Rpg.Quests/Signals/ZoneKeys.cs`, `MonsterKilledSignals.cs`, `ZoneRoomSignals.cs`, `ItemGrantedHoldings.cs`, `ItemRemovedHoldings.cs`, `ItemDestroyedHoldings.cs`, `LevelUpHoldings.cs`
- Modify: `Vortex.Rpg.Quests/QuestsModule.cs` (register `ZoneKeys` as singleton)
- Test: `Vortex.Rpg.Quests.Tests/Signals/SignalsTests.cs`

**Interfaces:**
- Consumes: `MonsterKilledEvent(MonsterId, Level, Zone, Participants)`, `ZoneAreaEnteredEvent { AreaId, PlayerId, RoomId }`, `ZoneDecorUsedEvent { DecorId, PlayerId, RoomId }`, `ItemGrantedEvent/ItemRemovedEvent/ItemDestroyedEvent/LevelUpEvent` (each has `PlayerId`), `IZoneRoomSource.GetPublishedAsync(RoomId, ct)`, `IRpgContent.Get<MonsterDefinition>`.
- Produces: `ZoneKeys(IZoneRoomSource)` with `Task<string?> KeyOfAsync(RoomId)` (cached per room id; null for an ordinary room); handlers that call `IQuestLogGrain.CountAsync` / `RefreshHeldAsync`.

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rpg.Quests.Tests/Signals/SignalsTests.cs
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Orleans;
using Vortex.Events.Registry;
using Vortex.Primitives.Events.Combat;
using Vortex.Primitives.Events.Rpg;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rooms;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.Rpg.Quests.Grains;
using Vortex.Primitives.World;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Quests.Signals;
using Vortex.Rpg.Quests.Tests.Support;
using Vortex.Tests.Support;
using Xunit;

namespace Vortex.Rpg.Quests.Tests.Signals;

/// <summary>What the game reports to quest logs (spec M2a §3.4): the producers, not the kinds.</summary>
public sealed class SignalsTests
{
    private readonly List<string> _calls = [];
    private int _zoneReads;

    private IGrainFactory Grains() =>
        FakeProxy.Create<IGrainFactory>(call =>
        {
            long player = (long)call.Args![0]!;

            return FakeProxy.Create<IQuestLogGrain>(inner =>
            {
                if (inner.Method.Name == nameof(IQuestLogGrain.CountAsync))
                {
                    QuestSignal s = (QuestSignal)inner.Args![0]!;
                    _calls.Add($"{player} {s.Name} {s.Zone} {string.Join(",", s.Subject)}");
                }
                else if (inner.Method.Name == nameof(IQuestLogGrain.RefreshHeldAsync))
                {
                    _calls.Add($"{player} held");
                }

                return Task.CompletedTask;
            });
        });

    private ZoneKeys Keys() =>
        new(FakeProxy.Create<IZoneRoomSource>(call =>
        {
            _zoneReads++;

            return call.Method.Name == nameof(IZoneRoomSource.GetPublishedAsync)
                ? Task.FromResult<ZoneDocument?>(((RoomId)call.Args![0]!).Value == 2 ? ZoneSample.Camp : null)
                : null;
        }));

    private static IRpgContent Content() =>
        FakeProxy.Create<IRpgContent>(call => call.Method.Name == nameof(IRpgContent.Get) ? TestContent.Wolf : null);

    [Fact]
    public async Task AKill_IsASignalForEachParticipant_WithItsZoneKeyAndRank()
    {
        MonsterKilledSignals handler = new(Grains(), Keys(), Content());

        await handler.HandleAsync(new MonsterKilledEvent("monster.forest.wolf", 2, new RoomId(2), [new PlayerId(7), new PlayerId(8)]), null!, CancellationToken.None);

        _calls.Should().Equal(
            "7 monster_killed camp [monster, monster.forest.wolf],[rank, normal]",
            "8 monster_killed camp [monster, monster.forest.wolf],[rank, normal]"
        );
    }

    [Fact]
    public async Task AKillInAnOrdinaryRoom_SignalsNothing()
    {
        MonsterKilledSignals handler = new(Grains(), Keys(), Content());

        await handler.HandleAsync(new MonsterKilledEvent("monster.forest.wolf", 2, new RoomId(1), [new PlayerId(7)]), null!, CancellationToken.None);

        _calls.Should().BeEmpty();
    }

    [Fact]
    public async Task ZoneKeys_AreReadOncePerRoom()
    {
        ZoneKeys keys = Keys();

        (await keys.KeyOfAsync(new RoomId(2))).Should().Be("camp");
        (await keys.KeyOfAsync(new RoomId(2))).Should().Be("camp");

        _zoneReads.Should().Be(1);
    }

    [Fact]
    public async Task AnItemOrALevel_RefreshesHeldObjectives()
    {
        await new ItemGrantedHoldings(Grains()).HandleAsync(new ItemGrantedEvent(new PlayerId(7), "k", 1, "item.material.amber_shard", 2, false), null!, CancellationToken.None);
        await new ItemRemovedHoldings(Grains()).HandleAsync(new ItemRemovedEvent(new PlayerId(7), 1, "item.material.amber_shard", 1), null!, CancellationToken.None);

        _calls.Should().Equal("7 held", "7 held");
    }
}
```

```csharp
// Vortex.Rpg.Quests.Tests/Support/ZoneSample.cs
using Vortex.Primitives.World;

namespace Vortex.Rpg.Quests.Tests.Support;

/// <summary>The smallest zone document with a key: settings only.</summary>
internal static class ZoneSample
{
    public static readonly ZoneDocument Camp = new()
    {
        Settings = new ZoneSettings { Id = "camp", Name = "Camp" },
        Floor = new ZoneFloor(),
    };
}
```

(Fill `ZoneFloor`'s required members from `Vortex.Primitives/World/ZoneFloor.cs`; if it has required members, `Vortex.Tests.Support/World/ZoneSamples.Minimal()` already builds a valid document: use `ZoneSamples.Minimal() with { Settings = … with { Id = "camp" } }` instead.)

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts --filter "FullyQualifiedName~SignalsTests"`
Expected: build FAIL, `MonsterKilledSignals`, `ZoneKeys` not found.

- [ ] **Step 3: Write the producers**

```csharp
// Vortex.Rpg.Quests/Signals/ZoneKeys.cs
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using Vortex.Primitives.Rooms;
using Vortex.Primitives.World;

namespace Vortex.Rpg.Quests.Signals;

/// <summary>
/// The zone key of a room, as quests name zones (spec M2a §2.1): read once per room and kept.
/// ponytail: kept for the process; a zone republished under another key keeps the old one until restart.
/// </summary>
public sealed class ZoneKeys(IZoneRoomSource zones)
{
    private readonly ConcurrentDictionary<int, string?> _keys = new();

    public async Task<string?> KeyOfAsync(RoomId room)
    {
        if (_keys.TryGetValue(room.Value, out string? key))
        {
            return key;
        }

        key = (await zones.GetPublishedAsync(room, CancellationToken.None))?.Settings.Id;
        _keys[room.Value] = key;

        return key;
    }
}
```

```csharp
// Vortex.Rpg.Quests/Signals/MonsterKilledSignals.cs
using System.Collections.Immutable;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Orleans;
using Vortex.Events.Registry;
using Vortex.Primitives.Events.Combat;
using Vortex.Primitives.Orleans;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;

namespace Vortex.Rpg.Quests.Signals;

/// <summary>A monster died (spec M2a §3.4): monster_killed, with its id and rank, to each participant's log.</summary>
public sealed class MonsterKilledSignals(IGrainFactory grains, ZoneKeys keys, IRpgContent content)
    : IEventHandler<MonsterKilledEvent>
{
    public async ValueTask HandleAsync(MonsterKilledEvent e, EventContext ctx, CancellationToken ct)
    {
        if (await keys.KeyOfAsync(e.Zone) is not { } zone)
        {
            return;
        }

        string rank = (content.Get<MonsterDefinition>(e.MonsterId)?.Rank ?? MonsterRank.Normal).ToString().ToLowerInvariant();
        QuestSignal signal = new(
            QuestSignals.MonsterKilled,
            zone,
            ImmutableDictionary<string, string>.Empty.Add("monster", e.MonsterId).Add("rank", rank)
        );

        // Different players' logs: told together.
        await Task.WhenAll(e.Participants.Select(p => grains.GetQuestLogGrain(p).CountAsync(signal)));
    }
}
```

```csharp
// Vortex.Rpg.Quests/Signals/ZoneRoomSignals.cs
using System.Collections.Immutable;
using System.Threading;
using System.Threading.Tasks;
using Orleans;
using Vortex.Primitives.Orleans;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rooms;
using Vortex.Primitives.Rooms.Events;
using Vortex.Primitives.Rooms.Events.Zone;
using Vortex.Primitives.Rooms.Grains;
using Vortex.Primitives.Rpg.Quests;

namespace Vortex.Rpg.Quests.Signals;

/// <summary>
/// The room's own happenings quests count (spec M2a §3.4): an area entered, a decor object used.
/// One per room, made by the room event listener extension point.
/// </summary>
[RoomEventListener]
public sealed class ZoneRoomSignals(IRoomGrain room, IGrainFactory grains, ZoneKeys keys) : IRoomEventListener
{
    public Task OnRoomEventAsync(RoomEvent evt, CancellationToken ct) =>
        evt switch
        {
            ZoneAreaEnteredEvent e => SignalAsync(e.RoomId, e.PlayerId, QuestSignals.AreaEntered, "area", e.AreaId),
            ZoneDecorUsedEvent e => SignalAsync(e.RoomId, e.PlayerId, QuestSignals.DecorUsed, "object", e.DecorId),
            _ => Task.CompletedTask,
        };

    private async Task SignalAsync(RoomId roomId, PlayerId player, string name, string subject, string value)
    {
        if (player.Value <= 0 || await keys.KeyOfAsync(roomId) is not { } zone)
        {
            return;
        }

        await grains.GetQuestLogGrain(player).CountAsync(new QuestSignal(name, zone, ImmutableDictionary<string, string>.Empty.Add(subject, value)));
    }
}
```

(Copy the exact members of `IRoomEventListener` from `Vortex.Primitives/Rooms/IRoomEventListener.cs`: if it has more than `OnRoomEventAsync`, implement them as no-ops. `room` is taken because the extension point passes it; it is unused. If the analyzers refuse an unused parameter, drop it only if `RoomEventListenerFeatureProcessor` builds with `ActivatorUtilities.CreateInstance(sp, type, roomGrain)`, which tolerates a constructor without it — keep it otherwise.)

```csharp
// Vortex.Rpg.Quests/Signals/ItemGrantedHoldings.cs
using System.Threading;
using System.Threading.Tasks;
using Orleans;
using Vortex.Events.Registry;
using Vortex.Primitives.Events.Rpg;
using Vortex.Primitives.Orleans;

namespace Vortex.Rpg.Quests.Signals;

/// <summary>An item came in: held objectives (collect) are read again.</summary>
public sealed class ItemGrantedHoldings(IGrainFactory grains) : IEventHandler<ItemGrantedEvent>
{
    public async ValueTask HandleAsync(ItemGrantedEvent e, EventContext ctx, CancellationToken ct) =>
        await grains.GetQuestLogGrain(e.PlayerId).RefreshHeldAsync();
}
```

Write `ItemRemovedHoldings` (`IEventHandler<ItemRemovedEvent>`), `ItemDestroyedHoldings` (`IEventHandler<ItemDestroyedEvent>`) and `LevelUpHoldings` (`IEventHandler<LevelUpEvent>`) the same way, each its own file, each with a one-line summary ("An item was taken by a server system…", "An item was destroyed by its owner…", "A level was gained: a level objective may be met."). Check that `ItemDestroyedEvent` and `LevelUpEvent` carry `PlayerId` as their first member (they are constructed with `_playerId` first in `PlayerCharacterGrain`).

In `QuestsModule.ConfigureServices`:

```csharp
        services.AddSingleton<ZoneKeys>();
```

- [ ] **Step 4: Run the tests**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`
Expected: PASS, 21 tests.

- [ ] **Step 5: Commit**

```bash
git add -- Vortex.Rpg.Quests/Signals Vortex.Rpg.Quests.Tests/Signals Vortex.Rpg.Quests.Tests/Support/ZoneSample.cs
git commit -m "Quêtes : les signaux monstre tué, aire atteinte, décor utilisé, et la relecture des objectifs possédés" -- Vortex.Rpg.Quests Vortex.Rpg.Quests.Tests
```

---

### Task 8: The zone rules

**Files:**
- Modify: `Vortex.Rpg/Zones/Rules/ZoneRuleContext.cs` (one init property), `Vortex.Rooms/Grains/Zones/Triggers/ZoneTriggerContext.cs:43` (set it)
- Create: `Vortex.Rpg.Quests/Zones/QuestFactsSource.cs`, `QuestStateEvaluator.cs`, `StartQuestExecutor.cs`
- Modify: `Vortex.Rpg.Quests/QuestsModule.cs` (three lines)
- Test: `Vortex.Rpg.Quests.Tests/Zones/QuestZoneRulesTests.cs`

**Interfaces:**
- Consumes: `QuestZoneFacts`, `IQuestLogGrain.AcceptAsync`, `IRpgContent.Get<QuestDefinition>`, `ZoneRuleContext`.
- Produces: `ZoneRuleContext.AllHold : Func<IReadOnlyList<ZoneCondition>, bool>` (default: false for a non-empty list; the room sets the real one); `QuestFactsSource` (raises `QuestState` with the quest id when its state changed); `QuestStateEvaluator` (state `none` when the quest is not in the facts); `StartQuestExecutor` (checks `requires` with `ctx.AllHold`, then `AcceptAsync`).

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rpg.Quests.Tests/Zones/QuestZoneRulesTests.cs
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Orleans;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.Rpg.Quests.Grains;
using Vortex.Primitives.World.Layers;
using Vortex.Primitives.World.Rules;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Quests.Zones;
using Vortex.Rpg.Zones.Rules;
using Vortex.Tests.Support;
using Xunit;

namespace Vortex.Rpg.Quests.Tests.Zones;

/// <summary>The rules engine's quest pieces (spec M2a §3.3): facts, the QuestState condition, the StartQuest action.</summary>
public sealed class QuestZoneRulesTests
{
    private static readonly PlayerId Player = new(7);

    private static QuestZoneFacts Facts(params (string Quest, string State)[] states) =>
        new() { States = states.ToImmutableDictionary(s => s.Quest, s => s.State) };

    private static ZoneRuleContext Context(QuestZoneFacts? facts, bool requirementsHold = true) =>
        new(
            Player,
            facts is null ? new Dictionary<Type, ZoneFacts>() : new Dictionary<Type, ZoneFacts> { [typeof(QuestZoneFacts)] = facts },
            DateTimeOffset.UnixEpoch,
            null!,
            null!
        )
        {
            AllHold = _ => requirementsHold,
        };

    [Fact]
    public void QuestState_ReadsTheFacts_AndNoneWhenAbsent()
    {
        QuestStateEvaluator evaluator = new();

        evaluator.Holds(new QuestStateCondition("quest.a", "ready"), Context(Facts(("quest.a", "ready")))).Should().BeTrue();
        evaluator.Holds(new QuestStateCondition("quest.a", "done"), Context(Facts(("quest.a", "ready")))).Should().BeFalse();
        evaluator.Holds(new QuestStateCondition("quest.b", "none"), Context(Facts(("quest.a", "ready")))).Should().BeTrue();
        evaluator.Holds(new QuestStateCondition("quest.b", "none"), Context(null)).Should().BeTrue();
    }

    [Fact]
    public void TheFactsSource_RaisesQuestState_ForEachQuestThatMoved()
    {
        QuestFactsSource source = new(null!);

        source.Changes(Facts(("quest.a", "active"), ("quest.b", "active")), Facts(("quest.a", "ready"), ("quest.b", "active"), ("quest.c", "active")))
            .Should()
            .Equal(new ZoneTriggerSignal(ZoneTriggerType.QuestState, "quest.a"), new ZoneTriggerSignal(ZoneTriggerType.QuestState, "quest.c"));
    }

    [Fact]
    public async Task StartQuest_ChecksTheRequirements_ThenAccepts()
    {
        List<string> accepted = [];
        IGrainFactory grains = FakeProxy.Create<IGrainFactory>(_ =>
            FakeProxy.Create<IQuestLogGrain>(inner =>
            {
                accepted.Add((string)inner.Args![0]!);

                return Task.FromResult(QuestCodes.Ok);
            })
        );
        QuestDefinition quest = new() { Id = "quest.a", Kind = "quest", Level = 1, Objectives = [], Requires = [new PlayerLevelCondition(5, 0)] };
        IRpgContent content = FakeProxy.Create<IRpgContent>(call => call.Method.Name == nameof(IRpgContent.Get) ? quest : null);
        StartQuestExecutor executor = new(grains, content);

        await executor.RunAsync(new StartQuestAction("quest.a"), Context(Facts(), requirementsHold: false), CancellationToken.None);
        accepted.Should().BeEmpty();

        await executor.RunAsync(new StartQuestAction("quest.a"), Context(Facts(), requirementsHold: true), CancellationToken.None);
        accepted.Should().Equal("quest.a");
    }
}
```

(`QuestStateEvaluator.Holds` and `StartQuestExecutor.RunAsync` are reached through `IZoneConditionEvaluator.Holds(ZoneCondition, ctx)` / `IZoneActionExecutor.RunAsync(ZoneAction, ctx, ct)`: if the typed overloads are `protected`, call the interface methods as above — `evaluator.Holds((ZoneCondition)…)` through a `IZoneConditionEvaluator` variable. Read `Vortex.Rpg/Zones/Rules/ZoneConditionEvaluator.cs` for the public method's name.)

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestZoneRulesTests"`
Expected: build FAIL, `AllHold`, `QuestStateEvaluator` not found.

- [ ] **Step 3: Give the rule context the room's conditions**

In `Vortex.Rpg/Zones/Rules/ZoneRuleContext.cs`, inside the record body:

```csharp
    /// <summary>Whether every condition holds for this player, by the room's rule registry (a quest's
    /// requirements, spec M2a §3.3). Outside a room nothing can say: a non-empty list does not hold.</summary>
    public Func<IReadOnlyList<ZoneCondition>, bool> AllHold { get; init; } = conditions => conditions.Count == 0;
```

In `ZoneTriggerContext.ToRuleContext()`:

```csharp
    public ZoneRuleContext ToRuleContext() =>
        _rule ??= new(
            PlayerId.Value > 0 ? PlayerId : PlayerId.Invalid,
            Facts,
            LocalNow,
            Room.CombatRuntime,
            Room.Simulation
        )
        {
            AllHold = conditions => Room._zoneRules.AllHold(conditions, this),
        };
```

- [ ] **Step 4: Write the three pieces**

```csharp
// Vortex.Rpg.Quests/Zones/QuestFactsSource.cs
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Orleans;
using Vortex.Primitives.Orleans;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.World.Layers;
using Vortex.Primitives.World.Rules;
using Vortex.Rpg.Zones.Rules;

namespace Vortex.Rpg.Quests.Zones;

/// <summary>
/// The quest log's part of a zone's facts (spec M2a §3.3, Z1 §4.3): read on entry, pushed by the log
/// on each change; a quest whose state moved raises QuestState on its id.
/// </summary>
public sealed class QuestFactsSource(IGrainFactory grains) : IZoneFactsSource
{
    public Type FactsType => typeof(QuestZoneFacts);

    public IReadOnlyCollection<ZoneTriggerType> Raises { get; } = [ZoneTriggerType.QuestState];

    public async Task<ZoneFacts?> ReadAsync(PlayerId player) => await grains.GetQuestLogGrain(player).GetZoneFactsAsync();

    public IEnumerable<ZoneTriggerSignal> Changes(ZoneFacts before, ZoneFacts after)
    {
        if (before is not QuestZoneFacts was || after is not QuestZoneFacts now)
        {
            yield break;
        }

        foreach ((string quest, string state) in now.States)
        {
            if (was.States.GetValueOrDefault(quest) != state)
            {
                yield return new ZoneTriggerSignal(ZoneTriggerType.QuestState, quest);
            }
        }
    }
}
```

```csharp
// Vortex.Rpg.Quests/Zones/QuestStateEvaluator.cs
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.World.Rules;
using Vortex.Rpg.Zones.Rules;

namespace Vortex.Rpg.Quests.Zones;

/// <summary>QuestState {quest, state} (spec M2a §2.2): none, active, ready or done; a quest not in the log is none.</summary>
public sealed class QuestStateEvaluator : ZoneConditionEvaluator<QuestStateCondition>
{
    protected override bool Holds(QuestStateCondition condition, ZoneRuleContext ctx) =>
        (ctx.FactsOf<QuestZoneFacts>()?.States.GetValueOrDefault(condition.Quest) ?? QuestCodes.Name(QuestStatus.None))
        == condition.State;
}
```

```csharp
// Vortex.Rpg.Quests/Zones/StartQuestExecutor.cs
using System.Threading;
using System.Threading.Tasks;
using Orleans;
using Vortex.Primitives.Orleans;
using Vortex.Primitives.World.Rules;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Zones.Rules;

namespace Vortex.Rpg.Quests.Zones;

/// <summary>
/// StartQuest {quest} (spec M2a §3.3): the quest's requirements by the room's rules, then the log's
/// own checks. Nobody set it off (a clock): nothing to start.
/// </summary>
public sealed class StartQuestExecutor(IGrainFactory grains, IRpgContent content) : ZoneActionExecutor<StartQuestAction>
{
    protected override async Task RunAsync(StartQuestAction action, ZoneRuleContext ctx, CancellationToken ct)
    {
        if (ctx.PlayerId.Value <= 0 || content.Get<QuestDefinition>(action.Quest) is not { } quest || !ctx.AllHold(quest.Requires))
        {
            return;
        }

        await grains.GetQuestLogGrain(ctx.PlayerId).AcceptAsync(action.Quest);
    }
}
```

In `QuestsModule.ConfigureServices`:

```csharp
        // Spec M2a §3.3: the log's part of a zone's facts, the condition reading it, the action starting a quest.
        services.AddZoneFactsSource<QuestFactsSource>();
        services.AddZoneCondition<QuestStateEvaluator>();
        services.AddZoneAction<StartQuestExecutor>();
```

(If `AddZoneTrigger(ZoneTriggerType.QuestState)` is how a module declares a trigger it raises — as `MonstersModule` does for `MonsterKilled` — check whether `AddZoneFactsSource` already declares the `Raises` triggers; if not, add `services.AddZoneTrigger(ZoneTriggerType.QuestState);` too, so the validator accepts QuestState triggers as declared.)

- [ ] **Step 5: Run the tests**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`, then `dotnet test Vortex.Rooms.Tests --artifacts-path artifacts`
Expected: PASS, 24 tests in the quests project; the room tests unchanged and green (the rule context only gained a property).

- [ ] **Step 6: Commit**

```bash
git add -- Vortex.Rpg.Quests/Zones Vortex.Rpg.Quests.Tests/Zones
git commit -m "Quêtes : les faits de zone du journal, la condition QuestState et l'action StartQuest qui vérifie les prérequis" -- Vortex.Rpg.Quests Vortex.Rpg.Quests.Tests Vortex.Rpg/Zones/Rules/ZoneRuleContext.cs Vortex.Rooms/Grains/Zones/Triggers/ZoneTriggerContext.cs
```

---

### Task 9: Shipped quests, schema and the whole suite

**Files:**
- Create: `content/quest/camp_wolves.json`, `content/quest/camp_report.json`
- Modify: `content/texts/fr.txt` (and `content/texts/en.txt` if it exists)
- Modify: `Vortex.Hosting.Tests/Rpg/ContentSchemaTests.cs` (add `quest`), `Vortex.Hosting.Tests/Rpg/ContentPackInRepoTests.cs` (add `QuestKind` with the shipped kinds)
- Create: `schemas/content/quest.schema.json` (generated)

**Interfaces:**
- Consumes: every kind of Tasks 2–3.

- [ ] **Step 1: Write the two quests**

```json
{
  "$schema": "../../schemas/content/quest.schema.json",
  "id": "quest.camp.wolves",
  "kind": "quest",
  "level": 1,
  "objectives": [
    {"kind": "kill", "monster": "monster.forest.wolf", "count": 3}
  ],
  "rewards": [
    {"kind": "xp", "amount": 120},
    {"kind": "items", "items": [{"item": "item.weapon.rusted_sword", "quantity": 1}]}
  ]
}
```

```json
{
  "$schema": "../../schemas/content/quest.schema.json",
  "id": "quest.camp.report",
  "kind": "quest",
  "level": 1,
  "requires": [
    {"kind": "QuestState", "quest": "quest.camp.wolves", "state": "done"}
  ],
  "objectives": [
    {"kind": "talk", "zone": "camp", "npc": "scout"},
    {"kind": "reach", "zone": "camp", "area": "clearing"},
    {"kind": "interact", "zone": "camp", "object": "old_well"}
  ],
  "rewards": [
    {"kind": "xp", "amount": 80},
    {"kind": "items", "items": [{"item": "item.consumable.minor_potion", "quantity": 3}]}
  ]
}
```

(Check the two item ids against `content/item/rusted_sword.json` and `minor_potion.json`'s `"id"`.)

Texts, appended to `content/texts/fr.txt` in its `key=value` format:

```text
quest.camp.wolves.name=Les loups du bosquet
quest.camp.wolves.description=Les loups rôdent autour du camp. L'Ancien vous demande d'en chasser trois.
quest.camp.wolves.objective.0=Loups des bois tués : %current%/%required%
quest.camp.report.name=Le rapport de l'éclaireur
quest.camp.report.description=L'éclaireur a vu quelque chose dans la clairière. Allez le voir, puis vérifiez par vous-même.
quest.camp.report.objective.0=Parler à l'éclaireur
quest.camp.report.objective.1=Atteindre la clairière
quest.camp.report.objective.2=Regarder dans le vieux puits
```

- [ ] **Step 2: Extend the two hosting tests**

In `ContentSchemaTests.Kinds()` add `"quest"`; in `ByName` add:

```csharp
        ["quest"] = new QuestKind([], []),
```

In `ContentPackInRepoTests.Validated()`, after `new StatusKind(),`:

```csharp
            // The objective and reward kinds QuestsModule declares: a new shipped kind is added here too.
            new QuestKind(
                [new KillObjective(), new ReachObjective(), new InteractObjective(), new TalkObjective(), new CollectObjective()],
                [new XpReward(), new ItemsReward()]
            ),
```

Add `<ProjectReference Include="..\Vortex.Rpg.Quests\Vortex.Rpg.Quests.csproj" />` to `Vortex.Hosting.Tests/Vortex.Hosting.Tests.csproj` if it does not reference it through `Vortex.Main`.

- [ ] **Step 3: Generate the schema**

Run: `UPDATE_CONTENT_SCHEMAS=1 dotnet test Vortex.Hosting.Tests --artifacts-path artifacts --filter "FullyQualifiedName~ContentSchemaTests"` then the same without the variable.
Expected: `schemas/content/quest.schema.json` written, then the test PASSES. Read it: `objectives` items have `kind`, `count`, `text` and open other properties.

- [ ] **Step 4: The whole suite**

Run: `dotnet test Vortex.Cloud.sln --artifacts-path artifacts`
Expected: every project green; `ContentPackInRepoTests` accepts the two quests (no `MissingText` warning for them).

- [ ] **Step 5: Commit**

```bash
git add -- content/quest schemas/content/quest.schema.json
git commit -m "Contenu : les deux quêtes du camp, leurs textes et le schéma quest" -- content schemas/content/quest.schema.json Vortex.Hosting.Tests
```
