# M2a-2 NPCs, dialogue and the quest wire (server) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A zone's NPCs stand in its room; talking to one opens its dialogue, walked by the server one node at a time; a choice accepts or hands in a quest; each player sees which NPC has a quest for them; the quest log reaches the client.

**Architecture:** Dialogues are a server-only content kind, walked by a pure `DialogueWalker`. The room (`Vortex.Rooms`) owns what is spatial: the NPC units (`RoomNpcAvatar`, serialized as Habbo bots), reach, one dialogue session per player, the markers. Everything about content and quests sits behind one interface, `INpcDialogues` (in `Vortex.Rpg`), implemented by the quests module (`QuestDialogues`). Eight new messages carry it, in the new style: three from the client, five to it.

**Tech Stack:** C# / .NET 10, Orleans, xUnit + FluentAssertions. Repository: `../vortex-rpg-emulator`, branch `rpg-quests-m2a` (plan M2a-1 is on it).

**Spec:** `docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md` (§2.2, §3.1–3.3, §6). Plan 2 of 4: 1 (quest engine) is done; 3 is the client; 4 the map editor and the demo zone.

## Global Constraints

- All work in `D:\Developpment\Habbo\vortex-rpg-emulator` on `rpg-quests-m2a`. Commit by explicit path (`git commit -m "…" -- <paths>`, new files `git add -- <paths>` first), messages in French (`PNJ : …`, `Quêtes : …`, `Réseau : …`).
- Build and test with `--artifacts-path artifacts`. Run `dotnet csharpier format <paths>` on every file written by a script before committing.
- Message ids: client → server `RpgNpcTalk` 9018, `RpgDialogueChoose` 9019, `RpgQuestAbandon` 9020; server → client `RpgNpcs` 9032, `RpgDialogue` 9033, `RpgDialogueClose` 9034, `RpgQuestLog` 9035, `RpgQuestResult` 9036. On the wire an int is 4 bytes big-endian, a string a 2-byte length then UTF-8, a list its count (int) then its items.
- Markers: `available`, `ready`, `active`, or an empty string. Choice kinds: `next`, `accept`, `complete`, `close`. Quest result actions: `accepted`, `completed`, `abandoned`, `talk`.
- Reach: talking needs the player within 1 tile (Chebyshev, diagonals count) of the NPC; a choice needs them within 2, else the dialogue closes.
- A choice index on the wire is the position in the list last sent to that player, not the index in the content.
- Every grain method a client can reach takes an `ActionContext` and guards its actor (a real player with an avatar in this room); `scripts/hooks/authorization-surface-baseline.json` records it.

## Review Focus

1. A stale or forged choice index (after the server moved on, or out of range) must change nothing (Task 5 test `AChoiceOutOfTheShownList_IsIgnored`).
2. A player who walked away must not accept a quest from across the map: the choice closes the dialogue (Task 5 test `AChoiceFromTooFar_ClosesTheDialogue`).
3. A quest whose requirements do not hold must not be offered, nor accepted by a crafted choose (Task 3 test `AnUnmetRequirement_HidesTheOffer`).
4. An NPC whose cell is out of the map or whose dialogue is missing must not break the room's activation (Task 4 test `AnNpcOutsideTheMap_IsSkipped`, Task 5 test `AnNpcWithoutDialogue_SaysNothing`).
5. Markers must follow the player's own quests, not another player's (Task 5 test `Markers_AreEachPlayersOwn`).

---

### Task 1: Dialogue content and its walker

**Files:**
- Create: `Vortex.Rpg/Content/Definitions/DialogueDefinition.cs`, `DialogueEntryDefinition.cs`, `DialogueNodeDefinition.cs`, `DialogueChoiceDefinition.cs`
- Create: `Vortex.Rpg/Content/Kinds/DialogueKind.cs`
- Create: `Vortex.Rpg/Dialogues/DialogueChoiceView.cs`, `DialogueNodeView.cs`, `DialogueWalker.cs`
- Modify: `Vortex.Rpg.Quests/QuestsModule.cs` (register the kind)
- Test: `Vortex.Rpg.Tests/Content/DialogueKindTests.cs`, `Vortex.Rpg.Tests/Dialogues/DialogueWalkerTests.cs`

**Interfaces:**
- Produces: `DialogueDefinition { List<DialogueEntryDefinition> Entries; Dictionary<string, DialogueNodeDefinition> Nodes }` (the speaker is the text `<id>.name`); `DialogueEntryDefinition { string Quest; string State; string Node }`; `DialogueNodeDefinition { string Text; List<DialogueChoiceDefinition> Choices }`; `DialogueChoiceDefinition { string Text; string? Next; string? Accept; string? Complete }` with `string Kind` (computed: next/accept/complete/close) and `string? Quest` (Accept ?? Complete); `DialogueChoiceView(int Index, string Text, string Kind)`; `DialogueNodeView(string NodeId, string Speaker, string Text, ImmutableArray<DialogueChoiceView> Choices)`; `DialogueWalker.OpeningNode(DialogueDefinition, Func<string, string> stateOf) : string`; `DialogueWalker.View(DialogueDefinition, string nodeId, Func<string, string> stateOf, Func<string, bool> offerable) : DialogueNodeView`; `DialogueKind` (`dialogue`, server-only).

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rpg.Tests/Content/DialogueKindTests.cs
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Kinds;
using Vortex.Rpg.Content.Validation;
using Xunit;

namespace Vortex.Rpg.Tests.Content;

/// <summary>The rules of a dialogue (spec M2a §2.2, §2.3): nodes reached, one action per choice, quests known.</summary>
public sealed class DialogueKindTests
{
    private const string Json = """
        {
          "id": "dialogue.camp.elder",
          "kind": "dialogue",
          "entries": [{"quest": "quest.camp.wolves", "state": "ready", "node": "thanks"}],
          "nodes": {
            "start": {"text": "dialogue.camp.elder.start", "choices": [
              {"text": "dialogue.camp.elder.ask", "next": "offer"},
              {"text": "dialogue.common.bye"}
            ]},
            "offer": {"text": "dialogue.camp.elder.offer", "choices": [{"text": "dialogue.common.accept", "accept": "quest.camp.wolves"}]},
            "thanks": {"text": "dialogue.camp.elder.thanks", "choices": [{"text": "dialogue.common.complete", "complete": "quest.camp.wolves"}]}
          }
        }
        """;

    private static readonly QuestDefinition Wolves = new() { Id = "quest.camp.wolves", Kind = "quest", Level = 1, Objectives = [] };

    private static DialogueDefinition Parse(string json) => (DialogueDefinition)new DialogueKind().Parse(json);

    private static string[] Codes(DialogueDefinition d) =>
        [
            .. new DialogueKind()
                .Check(d, new ContentCheck(new Dictionary<string, ContentDefinition> { [d.Id] = d, [Wolves.Id] = Wolves }, _ => false))
                .Select(f => f.Code),
        ];

    [Fact]
    public void AValidDialogue_HasNoFinding()
    {
        DialogueDefinition d = Parse(Json);

        Codes(d).Should().BeEmpty();
        d.Nodes["start"].Choices[1].Kind.Should().Be("close");
        d.Nodes["offer"].Choices[0].Quest.Should().Be("quest.camp.wolves");
    }

    [Fact]
    public void ANextToNowhere_IsRefused() => Codes(Parse(Json.Replace("\"next\": \"offer\"", "\"next\": \"nowhere\""))).Should().Equal("BrokenNext");

    [Fact]
    public void AChoiceWithTwoActions_IsRefused() =>
        Codes(Parse(Json.Replace("\"accept\": \"quest.camp.wolves\"", "\"accept\": \"quest.camp.wolves\", \"next\": \"start\""))).Should().Equal("TwoActions");

    [Fact]
    public void AnUnknownQuest_IsRefused() => Codes(Parse(Json.Replace("\"complete\": \"quest.camp.wolves\"", "\"complete\": \"quest.nope\""))).Should().Equal("BrokenReference");

    [Fact]
    public void AnEntryOnABadState_IsRefused() => Codes(Parse(Json.Replace("\"state\": \"ready\"", "\"state\": \"finished\""))).Should().Equal("BadState");

    [Fact]
    public void ADialogueWithoutStart_IsRefused() => Codes(Parse(Json.Replace("\"start\":", "\"begin\":"))).Should().Contain("NoStart");

    [Fact]
    public void EveryText_IsDeclared() =>
        new DialogueKind().TextKeys(Parse(Json)).Should().BeEquivalentTo(
            "dialogue.camp.elder.start", "dialogue.camp.elder.ask", "dialogue.common.bye", "dialogue.camp.elder.offer",
            "dialogue.common.accept", "dialogue.camp.elder.thanks", "dialogue.common.complete"
        );
}
```

```csharp
// Vortex.Rpg.Tests/Dialogues/DialogueWalkerTests.cs
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Kinds;
using Vortex.Rpg.Dialogues;
using Xunit;

namespace Vortex.Rpg.Tests.Dialogues;

/// <summary>Walking a dialogue (spec M2a §2.2): the opening node by quest state, the choices a player may see.</summary>
public sealed class DialogueWalkerTests
{
    private static readonly DialogueDefinition Elder = (DialogueDefinition)new DialogueKind().Parse("""
        {
          "id": "dialogue.camp.elder",
          "kind": "dialogue",
          "entries": [
            {"quest": "quest.camp.wolves", "state": "ready", "node": "thanks"},
            {"quest": "quest.camp.wolves", "state": "active", "node": "waiting"}
          ],
          "nodes": {
            "start": {"text": "t.start", "choices": [{"text": "t.ask", "next": "offer"}, {"text": "t.bye"}]},
            "offer": {"text": "t.offer", "choices": [{"text": "t.accept", "accept": "quest.camp.wolves"}, {"text": "t.later"}]},
            "waiting": {"text": "t.waiting", "choices": [{"text": "t.bye"}]},
            "thanks": {"text": "t.thanks", "choices": [{"text": "t.complete", "complete": "quest.camp.wolves"}, {"text": "t.bye"}]}
          }
        }
        """);

    private static System.Func<string, string> States(params (string Quest, string State)[] states)
    {
        Dictionary<string, string> map = states.ToDictionary(s => s.Quest, s => s.State);

        return quest => map.GetValueOrDefault(quest, "none");
    }

    [Fact]
    public void TheOpening_FollowsTheQuestState()
    {
        DialogueWalker.OpeningNode(Elder, States()).Should().Be("start");
        DialogueWalker.OpeningNode(Elder, States(("quest.camp.wolves", "active"))).Should().Be("waiting");
        DialogueWalker.OpeningNode(Elder, States(("quest.camp.wolves", "ready"))).Should().Be("thanks");
        DialogueWalker.OpeningNode(Elder, States(("quest.camp.wolves", "done"))).Should().Be("start");
    }

    [Fact]
    public void AnOfferThatCannotBeTaken_IsNotShown_AndIndexesStayTheContents()
    {
        DialogueNodeView offered = DialogueWalker.View(Elder, "offer", States(), _ => true);
        DialogueNodeView refused = DialogueWalker.View(Elder, "offer", States(), _ => false);

        offered.Choices.Select(c => (c.Index, c.Kind)).Should().Equal((0, "accept"), (1, "close"));
        refused.Choices.Select(c => (c.Index, c.Kind)).Should().Equal((1, "close"));
        offered.Speaker.Should().Be("dialogue.camp.elder.name");
        offered.Text.Should().Be("t.offer");
    }

    [Fact]
    public void AHandInIsShown_OnlyWhenTheQuestIsReady()
    {
        DialogueWalker.View(Elder, "thanks", States(("quest.camp.wolves", "active")), _ => true).Choices.Select(c => c.Kind).Should().Equal("close");
        DialogueWalker.View(Elder, "thanks", States(("quest.camp.wolves", "ready")), _ => true).Choices.Select(c => c.Kind).Should().Equal("complete", "close");
    }
}
```

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Tests --artifacts-path artifacts --filter "FullyQualifiedName~Dialogue"`
Expected: build FAIL, `DialogueKind`, `DialogueWalker` not found.

- [ ] **Step 3: Write the definitions**

```csharp
// Vortex.Rpg/Content/Definitions/DialogueDefinition.cs
using System.Collections.Generic;

namespace Vortex.Rpg.Content.Definitions;

/// <summary>
/// An NPC's dialogue (spec M2a §2.2): nodes of text and choices, opened at the first entry whose quest
/// is in that state for the player, else at "start". The speaker's name is the text &lt;id&gt;.name.
/// Server only: the client sees the node it is shown, never the rest.
/// </summary>
public sealed record DialogueDefinition : ContentDefinition
{
    public List<DialogueEntryDefinition> Entries { get; init; } = [];

    public required Dictionary<string, DialogueNodeDefinition> Nodes { get; init; }
}
```

```csharp
// Vortex.Rpg/Content/Definitions/DialogueEntryDefinition.cs
namespace Vortex.Rpg.Content.Definitions;

/// <summary>Open at <see cref="Node"/> when <see cref="Quest"/> is in <see cref="State"/> (none, active, ready, done).</summary>
public sealed record DialogueEntryDefinition
{
    public required string Quest { get; init; }

    public required string State { get; init; }

    public required string Node { get; init; }
}
```

```csharp
// Vortex.Rpg/Content/Definitions/DialogueNodeDefinition.cs
using System.Collections.Generic;

namespace Vortex.Rpg.Content.Definitions;

/// <summary>One thing the NPC says, and what the player may answer.</summary>
public sealed record DialogueNodeDefinition
{
    public required string Text { get; init; }

    public List<DialogueChoiceDefinition> Choices { get; init; } = [];
}
```

```csharp
// Vortex.Rpg/Content/Definitions/DialogueChoiceDefinition.cs
using System.Text.Json.Serialization;

namespace Vortex.Rpg.Content.Definitions;

/// <summary>An answer (spec M2a §2.2): it does one thing — another node, take a quest, hand one in — or closes.</summary>
public sealed record DialogueChoiceDefinition
{
    public required string Text { get; init; }

    public string? Next { get; init; }

    public string? Accept { get; init; }

    public string? Complete { get; init; }

    /// <summary>next, accept, complete or close: what the client's button looks like.</summary>
    [JsonIgnore]
    public string Kind =>
        Accept is not null ? "accept"
        : Complete is not null ? "complete"
        : Next is not null ? "next"
        : "close";

    /// <summary>The quest this choice takes or hands in.</summary>
    [JsonIgnore]
    public string? Quest => Accept ?? Complete;
}
```

- [ ] **Step 4: Write the kind**

```csharp
// Vortex.Rpg/Content/Kinds/DialogueKind.cs
using System.Collections.Generic;
using System.Linq;
using Vortex.Primitives.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Validation;

namespace Vortex.Rpg.Content.Kinds;

/// <summary>Dialogues (spec M2a §2.2, §2.3): server only; every node reached, every quest known.</summary>
public sealed class DialogueKind : ContentKind<DialogueDefinition>
{
    private static readonly HashSet<string> States = ["none", "active", "ready", "done"];

    public override string Kind => "dialogue";

    protected override IEnumerable<string> TextKeys(DialogueDefinition d) =>
        d.Nodes.Values.SelectMany(n => n.Choices.Select(c => c.Text).Prepend(n.Text)).Distinct();

    protected override IEnumerable<ContentFinding> Check(DialogueDefinition d, ContentCheck check)
    {
        if (!d.Nodes.ContainsKey("start"))
        {
            yield return Error("NoStart", d.Id, "A dialogue opens at a node named \"start\".");
        }

        foreach (DialogueEntryDefinition entry in d.Entries)
        {
            if (!States.Contains(entry.State))
            {
                yield return Error("BadState", d.Id, $"entries: state '{entry.State}': none, active, ready or done.");
            }

            if (!d.Nodes.ContainsKey(entry.Node))
            {
                yield return Error("BrokenNext", d.Id, $"entries: no node '{entry.Node}'.");
            }

            if (!check.Is<QuestDefinition>(entry.Quest))
            {
                yield return Error("BrokenReference", d.Id, $"entries: no quest '{entry.Quest}'.");
            }
        }

        foreach ((string name, DialogueNodeDefinition node) in d.Nodes)
        {
            foreach (DialogueChoiceDefinition c in node.Choices)
            {
                if (new[] { c.Next, c.Accept, c.Complete }.Count(a => a is not null) > 1)
                {
                    yield return Error("TwoActions", d.Id, $"{name}: a choice does one thing ({c.Text}).");
                }

                if (c.Next is not null && !d.Nodes.ContainsKey(c.Next))
                {
                    yield return Error("BrokenNext", d.Id, $"{name}: no node '{c.Next}'.");
                }

                if (c.Quest is { } quest && !check.Is<QuestDefinition>(quest))
                {
                    yield return Error("BrokenReference", d.Id, $"{name}: no quest '{quest}'.");
                }
            }
        }
    }
}
```

In `QuestsModule.ConfigureServices`, after `services.AddSingleton<IContentKind, QuestKind>();`:

```csharp
        services.AddSingleton<IContentKind, DialogueKind>();
```

- [ ] **Step 5: Write the walker**

```csharp
// Vortex.Rpg/Dialogues/DialogueChoiceView.cs
namespace Vortex.Rpg.Dialogues;

/// <summary>A choice as a player may see it: its index in the content's node, its text key, its kind.</summary>
public sealed record DialogueChoiceView(int Index, string Text, string Kind);
```

```csharp
// Vortex.Rpg/Dialogues/DialogueNodeView.cs
using System.Collections.Immutable;

namespace Vortex.Rpg.Dialogues;

/// <summary>A node as one player sees it now: who speaks, what, and the choices open to them.</summary>
public sealed record DialogueNodeView(string NodeId, string Speaker, string Text, ImmutableArray<DialogueChoiceView> Choices);
```

```csharp
// Vortex.Rpg/Dialogues/DialogueWalker.cs
using System;
using System.Collections.Immutable;
using System.Linq;
using Vortex.Rpg.Content.Definitions;

namespace Vortex.Rpg.Dialogues;

/// <summary>
/// Where a dialogue opens and what a node shows (spec M2a §2.2), for one player: the quest states and
/// what is offerable are the caller's (the log, the room's rules). An offer that cannot be taken and
/// a hand-in that is not ready are not shown; indexes stay the content's.
/// </summary>
public static class DialogueWalker
{
    public static string OpeningNode(DialogueDefinition dialogue, Func<string, string> stateOf) =>
        dialogue.Entries.FirstOrDefault(e => stateOf(e.Quest) == e.State && dialogue.Nodes.ContainsKey(e.Node))?.Node ?? "start";

    public static DialogueNodeView View(DialogueDefinition dialogue, string nodeId, Func<string, string> stateOf, Func<string, bool> offerable)
    {
        DialogueNodeDefinition node = dialogue.Nodes[nodeId];

        return new DialogueNodeView(
            nodeId,
            $"{dialogue.Id}.name",
            node.Text,
            [
                .. node.Choices
                    .Select((c, i) => (Choice: c, Index: i))
                    .Where(x =>
                        x.Choice.Accept is not { } take || offerable(take))
                    .Where(x => x.Choice.Complete is not { } give || stateOf(give) == "ready")
                    .Select(x => new DialogueChoiceView(x.Index, x.Choice.Text, x.Choice.Kind)),
            ]
        );
    }
}
```

- [ ] **Step 6: Run the tests**

Run: `dotnet test Vortex.Rpg.Tests --artifacts-path artifacts --filter "FullyQualifiedName~Dialogue"`
Expected: PASS, 10 tests.

- [ ] **Step 7: Commit**

```bash
git add -- Vortex.Rpg/Content/Definitions/Dialogue*.cs Vortex.Rpg/Content/Kinds/DialogueKind.cs Vortex.Rpg/Dialogues Vortex.Rpg.Tests/Content/DialogueKindTests.cs Vortex.Rpg.Tests/Dialogues
git commit -m "Contenu : la sorte dialogue (côté serveur) et son parcours par état de quête" -- Vortex.Rpg Vortex.Rpg.Tests Vortex.Rpg.Quests/QuestsModule.cs
```

---

### Task 2: The eight messages

**Files:**
- Create (incoming, `Vortex.Protocol/Messages/Incoming/Rpg/Quests/`): `RpgNpcTalkMessage.cs`, `RpgDialogueChooseMessage.cs`, `RpgQuestAbandonMessage.cs`
- Create (outgoing, `Vortex.Protocol/Messages/Outgoing/Rpg/Quests/`): `RpgNpcsMessageComposer.cs`, `RpgNpcMarker.cs`, `RpgDialogueMessageComposer.cs`, `RpgDialogueChoice.cs`, `RpgDialogueCloseMessageComposer.cs`, `RpgQuestLogMessageComposer.cs`, `RpgQuestLogEntry.cs`, `RpgQuestObjectiveLine.cs`, `RpgQuestResultMessageComposer.cs`
- Create: `Vortex.Revisions/Revision20260701/Parsers/Rpg/Quests/` (three parsers), `Vortex.Revisions/Revision20260701/Serializers/Rpg/Quests/` (five serializers), `Vortex.Revisions/Revision20260701/Maps/RpgQuestMap.cs`
- Modify: `Vortex.Revisions/Revision20260701/Headers.cs` (8 ids), `Vortex.Revisions/Revision20260701/Revision20260701.cs` (one map)
- Test: `Vortex.Revisions.Tests/Rpg/RpgQuestWireTests.cs`

**Interfaces:**
- Produces: `RpgNpcTalkMessage { int ObjectId }`, `RpgDialogueChooseMessage { int Choice }`, `RpgQuestAbandonMessage { string QuestId }`; `RpgNpcsMessageComposer { ImmutableArray<RpgNpcMarker> Npcs }`, `RpgNpcMarker { int ObjectId; string Marker }`; `RpgDialogueMessageComposer { int NpcObjectId; string Speaker; string Text; ImmutableArray<RpgDialogueChoice> Choices }`, `RpgDialogueChoice { string Text; string Kind }`; `RpgDialogueCloseMessageComposer`; `RpgQuestLogMessageComposer { ImmutableArray<RpgQuestLogEntry> Quests }`, `RpgQuestLogEntry { string QuestId; string State; ImmutableArray<RpgQuestObjectiveLine> Objectives }`, `RpgQuestObjectiveLine { string Kind; int Current; int Required }`; `RpgQuestResultMessageComposer { string Action; string Code; string QuestId }`.

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Revisions.Tests/Rpg/RpgQuestWireTests.cs
using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.Text;
using FluentAssertions;
using Vortex.Networking.Packets;
using Vortex.Primitives.Networking;
using Vortex.Protocol.Messages.Incoming.Rpg.Quests;
using Vortex.Protocol.Messages.Outgoing.Rpg.Quests;
using Xunit;
using Rev = Vortex.Revisions.Revision20260701.Revision20260701;

namespace Vortex.Revisions.Tests.Rpg;

/// <summary>Spec M2a §3.1–3.2: the NPC, dialogue and quest messages, field by field in the client's order.</summary>
public sealed class RpgQuestWireTests
{
    private static readonly Rev Revision = new();

    private static (int Header, ClientPacket Body) Serialize(IComposer composer)
    {
        byte[] bytes = Revision.Serializers[composer.GetType()].Serialize(composer).ToArray();
        byte[] body = new byte[bytes.Length - 6];
        Array.Copy(bytes, 6, body, 0, body.Length);

        return (BinaryPrimitives.ReadInt16BigEndian(bytes.AsSpan(4)), new ClientPacket(0, body));
    }

    private static ClientPacket Body(int header, params object[] fields)
    {
        List<byte> bytes = [];

        foreach (object field in fields)
        {
            if (field is int i)
            {
                byte[] b = new byte[4];
                BinaryPrimitives.WriteInt32BigEndian(b, i);
                bytes.AddRange(b);
            }
            else if (field is string s)
            {
                byte[] text = Encoding.UTF8.GetBytes(s);
                byte[] length = new byte[2];
                BinaryPrimitives.WriteInt16BigEndian(length, (short)text.Length);
                bytes.AddRange(length);
                bytes.AddRange(text);
            }
        }

        return new ClientPacket(header, [.. bytes]);
    }

    [Fact]
    public void TheClientsThreeMessages_Parse()
    {
        ((RpgNpcTalkMessage)Revision.Parsers[9018].Parse(Body(9018, 42))).ObjectId.Should().Be(42);
        ((RpgDialogueChooseMessage)Revision.Parsers[9019].Parse(Body(9019, 1))).Choice.Should().Be(1);
        ((RpgQuestAbandonMessage)Revision.Parsers[9020].Parse(Body(9020, "quest.camp.wolves"))).QuestId.Should().Be("quest.camp.wolves");
    }

    [Fact]
    public void Npcs_AreObjectIdThenMarker()
    {
        (int header, ClientPacket p) = Serialize(new RpgNpcsMessageComposer
        {
            Npcs = [new RpgNpcMarker { ObjectId = 5, Marker = "available" }, new RpgNpcMarker { ObjectId = 6, Marker = "" }],
        });

        header.Should().Be(9032);
        p.PopInt().Should().Be(2);
        (p.PopInt(), p.PopString()).Should().Be((5, "available"));
        (p.PopInt(), p.PopString()).Should().Be((6, ""));
        p.Remaining.Should().Be(0);
    }

    [Fact]
    public void ADialogue_IsItsNpcSpeakerTextThenChoices()
    {
        (int header, ClientPacket p) = Serialize(new RpgDialogueMessageComposer
        {
            NpcObjectId = 5,
            Speaker = "dialogue.camp.elder.name",
            Text = "dialogue.camp.elder.offer",
            Choices = [new RpgDialogueChoice { Text = "dialogue.common.accept", Kind = "accept" }],
        });

        header.Should().Be(9033);
        (p.PopInt(), p.PopString(), p.PopString()).Should().Be((5, "dialogue.camp.elder.name", "dialogue.camp.elder.offer"));
        p.PopInt().Should().Be(1);
        (p.PopString(), p.PopString()).Should().Be(("dialogue.common.accept", "accept"));
        p.Remaining.Should().Be(0);

        (int close, ClientPacket empty) = Serialize(new RpgDialogueCloseMessageComposer());
        close.Should().Be(9034);
        empty.Remaining.Should().Be(0);
    }

    [Fact]
    public void TheQuestLog_IsEachQuestStateThenObjectives()
    {
        (int header, ClientPacket p) = Serialize(new RpgQuestLogMessageComposer
        {
            Quests =
            [
                new RpgQuestLogEntry
                {
                    QuestId = "quest.camp.wolves",
                    State = "active",
                    Objectives = [new RpgQuestObjectiveLine { Kind = "kill", Current = 1, Required = 3 }],
                },
            ],
        });

        header.Should().Be(9035);
        p.PopInt().Should().Be(1);
        (p.PopString(), p.PopString()).Should().Be(("quest.camp.wolves", "active"));
        p.PopInt().Should().Be(1);
        (p.PopString(), p.PopInt(), p.PopInt()).Should().Be(("kill", 1, 3));
        p.Remaining.Should().Be(0);
    }

    [Fact]
    public void AResult_IsActionCodeQuest()
    {
        (int header, ClientPacket p) = Serialize(new RpgQuestResultMessageComposer { Action = "accepted", Code = "ok", QuestId = "quest.camp.wolves" });

        header.Should().Be(9036);
        (p.PopString(), p.PopString(), p.PopString()).Should().Be(("accepted", "ok", "quest.camp.wolves"));
        p.Remaining.Should().Be(0);
    }
}
```

(Copy the `using` lines of `RpgCombatWireTests.cs` for `ClientPacket` and `IComposer` if their namespaces differ from the ones above; `PopInt`/`PopString`/`Remaining` are the ones that test uses.)

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Revisions.Tests --artifacts-path artifacts --filter "FullyQualifiedName~RpgQuestWireTests"`
Expected: build FAIL, the message types not found.

- [ ] **Step 3: Write the messages**

Incoming, each in its own file under `Vortex.Protocol/Messages/Incoming/Rpg/Quests/`, namespace `Vortex.Protocol.Messages.Incoming.Rpg.Quests`, with the `using` of `IMessageEvent` copied from `RpgDeathChoiceMessage.cs`:

```csharp
/// <summary>The player talks to an NPC (spec M2a §3.1, 9018).</summary>
public record RpgNpcTalkMessage : IMessageEvent
{
    public required int ObjectId { get; init; }
}
```

```csharp
/// <summary>A choice of the dialogue last shown to the player, by its position in that list (spec M2a §3.1, 9019).</summary>
public record RpgDialogueChooseMessage : IMessageEvent
{
    public required int Choice { get; init; }
}
```

```csharp
/// <summary>The player drops a quest under way (spec M2a §3.1, 9020).</summary>
public record RpgQuestAbandonMessage : IMessageEvent
{
    public required string QuestId { get; init; }
}
```

Outgoing, each in its own file under `Vortex.Protocol/Messages/Outgoing/Rpg/Quests/`, namespace `Vortex.Protocol.Messages.Outgoing.Rpg.Quests`, `using System.Collections.Immutable; using Orleans; using Vortex.Primitives.Networking;` as `RpgTargetsMessageComposer.cs` has:

```csharp
/// <summary>The zone's NPCs and what each one has for this player (spec M2a §3.2, 9032).</summary>
[GenerateSerializer, Immutable]
public sealed record RpgNpcsMessageComposer : IComposer
{
    [Id(0)]
    public required ImmutableArray<RpgNpcMarker> Npcs { get; init; }
}
```

```csharp
/// <summary>An NPC and its marker: available, ready, active, or empty.</summary>
[GenerateSerializer, Immutable]
public sealed record RpgNpcMarker
{
    public const string Available = "available";
    public const string Ready = "ready";
    public const string Active = "active";
    public const string None = "";

    [Id(0)]
    public required int ObjectId { get; init; }

    [Id(1)]
    public required string Marker { get; init; }
}
```

```csharp
/// <summary>The dialogue node to show (spec M2a §3.2, 9033): content text keys.</summary>
[GenerateSerializer, Immutable]
public sealed record RpgDialogueMessageComposer : IComposer
{
    [Id(0)]
    public required int NpcObjectId { get; init; }

    [Id(1)]
    public required string Speaker { get; init; }

    [Id(2)]
    public required string Text { get; init; }

    [Id(3)]
    public required ImmutableArray<RpgDialogueChoice> Choices { get; init; }
}
```

```csharp
/// <summary>A choice: its text key and kind (next, accept, complete, close).</summary>
[GenerateSerializer, Immutable]
public sealed record RpgDialogueChoice
{
    [Id(0)]
    public required string Text { get; init; }

    [Id(1)]
    public required string Kind { get; init; }
}
```

```csharp
/// <summary>The server ended the dialogue (spec M2a §3.2, 9034).</summary>
[GenerateSerializer, Immutable]
public sealed record RpgDialogueCloseMessageComposer : IComposer;
```

```csharp
/// <summary>The whole quest log (spec M2a §3.2, 9035): after sign-in and after every change.</summary>
[GenerateSerializer, Immutable]
public sealed record RpgQuestLogMessageComposer : IComposer
{
    [Id(0)]
    public required ImmutableArray<RpgQuestLogEntry> Quests { get; init; }
}
```

```csharp
/// <summary>A quest of the log: its state (active, ready, done) and its objective lines.</summary>
[GenerateSerializer, Immutable]
public sealed record RpgQuestLogEntry
{
    [Id(0)]
    public required string QuestId { get; init; }

    [Id(1)]
    public required string State { get; init; }

    [Id(2)]
    public required ImmutableArray<RpgQuestObjectiveLine> Objectives { get; init; }
}
```

```csharp
/// <summary>An objective's kind (for its icon) and its counter.</summary>
[GenerateSerializer, Immutable]
public sealed record RpgQuestObjectiveLine
{
    [Id(0)]
    public required string Kind { get; init; }

    [Id(1)]
    public required int Current { get; init; }

    [Id(2)]
    public required int Required { get; init; }
}
```

```csharp
/// <summary>A quest action's answer (spec M2a §3.2, 9036): accepted, completed, abandoned or talk, with ok or a refusal code.</summary>
[GenerateSerializer, Immutable]
public sealed record RpgQuestResultMessageComposer : IComposer
{
    [Id(0)]
    public required string Action { get; init; }

    [Id(1)]
    public required string Code { get; init; }

    [Id(2)]
    public required string QuestId { get; init; }
}
```

- [ ] **Step 4: Write the parsers, serializers, map and ids**

Parsers (namespace `Vortex.Revisions.Revision20260701.Parsers.Rpg.Quests`, usings copied from `RpgDeathChoiceMessageParser.cs`):

```csharp
internal class RpgNpcTalkMessageParser : IParser
{
    public IMessageEvent Parse(IClientPacket packet) => new RpgNpcTalkMessage { ObjectId = packet.PopInt() };
}
```

```csharp
internal class RpgDialogueChooseMessageParser : IParser
{
    public IMessageEvent Parse(IClientPacket packet) => new RpgDialogueChooseMessage { Choice = packet.PopInt() };
}
```

```csharp
internal class RpgQuestAbandonMessageParser : IParser
{
    public IMessageEvent Parse(IClientPacket packet) => new RpgQuestAbandonMessage { QuestId = packet.PopString() };
}
```

Serializers (namespace `Vortex.Revisions.Revision20260701.Serializers.Rpg.Quests`, usings copied from `RpgTargetsMessageComposerSerializer.cs`):

```csharp
internal class RpgNpcsMessageComposerSerializer(int header) : AbstractSerializer<RpgNpcsMessageComposer>(header)
{
    protected override void Serialize(IServerPacket packet, RpgNpcsMessageComposer message)
    {
        packet.WriteInteger(message.Npcs.Length);

        foreach (RpgNpcMarker npc in message.Npcs)
        {
            packet.WriteInteger(npc.ObjectId).WriteString(npc.Marker);
        }
    }
}
```

```csharp
internal class RpgDialogueMessageComposerSerializer(int header) : AbstractSerializer<RpgDialogueMessageComposer>(header)
{
    protected override void Serialize(IServerPacket packet, RpgDialogueMessageComposer message)
    {
        packet.WriteInteger(message.NpcObjectId).WriteString(message.Speaker).WriteString(message.Text).WriteInteger(message.Choices.Length);

        foreach (RpgDialogueChoice choice in message.Choices)
        {
            packet.WriteString(choice.Text).WriteString(choice.Kind);
        }
    }
}
```

```csharp
internal class RpgDialogueCloseMessageComposerSerializer(int header) : AbstractSerializer<RpgDialogueCloseMessageComposer>(header)
{
    protected override void Serialize(IServerPacket packet, RpgDialogueCloseMessageComposer message) { }
}
```

```csharp
internal class RpgQuestLogMessageComposerSerializer(int header) : AbstractSerializer<RpgQuestLogMessageComposer>(header)
{
    protected override void Serialize(IServerPacket packet, RpgQuestLogMessageComposer message)
    {
        packet.WriteInteger(message.Quests.Length);

        foreach (RpgQuestLogEntry quest in message.Quests)
        {
            packet.WriteString(quest.QuestId).WriteString(quest.State).WriteInteger(quest.Objectives.Length);

            foreach (RpgQuestObjectiveLine line in quest.Objectives)
            {
                packet.WriteString(line.Kind).WriteInteger(line.Current).WriteInteger(line.Required);
            }
        }
    }
}
```

```csharp
internal class RpgQuestResultMessageComposerSerializer(int header) : AbstractSerializer<RpgQuestResultMessageComposer>(header)
{
    protected override void Serialize(IServerPacket packet, RpgQuestResultMessageComposer message) =>
        packet.WriteString(message.Action).WriteString(message.Code).WriteString(message.QuestId);
}
```

(If `WriteString` returns `void` instead of the packet, write one statement per field as the other serializers do.)

`Headers.cs`: after `RpgDeathChoiceMessageEvent = 9017`, three lines in the `MessageEvent` class; after `RpgAutoAttackStateMessageComposer = 9031`, five lines in `MessageComposer`, each commented `// RPG (M2a §3.1)` / `// RPG (M2a §3.2)`:

```csharp
    public const int RpgNpcTalkMessageEvent = 9018; // RPG (M2a §3.1)
    public const int RpgDialogueChooseMessageEvent = 9019; // RPG (M2a §3.1)
    public const int RpgQuestAbandonMessageEvent = 9020; // RPG (M2a §3.1)
```

```csharp
    public const int RpgNpcsMessageComposer = 9032; // RPG (M2a §3.2)
    public const int RpgDialogueMessageComposer = 9033; // RPG (M2a §3.2)
    public const int RpgDialogueCloseMessageComposer = 9034; // RPG (M2a §3.2)
    public const int RpgQuestLogMessageComposer = 9035; // RPG (M2a §3.2)
    public const int RpgQuestResultMessageComposer = 9036; // RPG (M2a §3.2)
```

```csharp
// Vortex.Revisions/Revision20260701/Maps/RpgQuestMap.cs
namespace Vortex.Revisions.Revision20260701.Maps;

/// <summary>NPCs, dialogue and quests (spec M2a §3.1–3.2).</summary>
internal sealed class RpgQuestMap : IRevisionMap
{
    public void RegisterInto(IRevisionMapBuilder builder)
    {
        builder.MapParser(MessageEvent.RpgNpcTalkMessageEvent, new RpgNpcTalkMessageParser());
        builder.MapParser(MessageEvent.RpgDialogueChooseMessageEvent, new RpgDialogueChooseMessageParser());
        builder.MapParser(MessageEvent.RpgQuestAbandonMessageEvent, new RpgQuestAbandonMessageParser());
        builder.MapSerializer(typeof(RpgNpcsMessageComposer), new RpgNpcsMessageComposerSerializer(MessageComposer.RpgNpcsMessageComposer));
        builder.MapSerializer(typeof(RpgDialogueMessageComposer), new RpgDialogueMessageComposerSerializer(MessageComposer.RpgDialogueMessageComposer));
        builder.MapSerializer(typeof(RpgDialogueCloseMessageComposer), new RpgDialogueCloseMessageComposerSerializer(MessageComposer.RpgDialogueCloseMessageComposer));
        builder.MapSerializer(typeof(RpgQuestLogMessageComposer), new RpgQuestLogMessageComposerSerializer(MessageComposer.RpgQuestLogMessageComposer));
        builder.MapSerializer(typeof(RpgQuestResultMessageComposer), new RpgQuestResultMessageComposerSerializer(MessageComposer.RpgQuestResultMessageComposer));
    }
}
```

(Usings: copy `RpgCombatMap.cs`'s, replacing `.Combat` namespaces with `.Quests`.) In `Revision20260701.cs`, add `new RpgQuestMap(),` after `new RpgCombatMap(),`.

- [ ] **Step 5: Run the tests**

Run: `dotnet test Vortex.Revisions.Tests --artifacts-path artifacts`
Expected: PASS, the 5 new tests and every existing one (a header id used twice fails the revision's own checks).

- [ ] **Step 6: Commit**

```bash
git add -- Vortex.Protocol/Messages/Incoming/Rpg/Quests Vortex.Protocol/Messages/Outgoing/Rpg/Quests Vortex.Revisions/Revision20260701/Parsers/Rpg/Quests Vortex.Revisions/Revision20260701/Serializers/Rpg/Quests Vortex.Revisions/Revision20260701/Maps/RpgQuestMap.cs Vortex.Revisions.Tests/Rpg/RpgQuestWireTests.cs
git commit -m "Réseau : les huit messages des PNJ, du dialogue et des quêtes (9018–9020, 9032–9036)" -- Vortex.Protocol Vortex.Revisions Vortex.Revisions.Tests
```

---

### Task 3: The dialogue service

**Files:**
- Create: `Vortex.Rpg/Npcs/INpcDialogues.cs`, `NpcConversation.cs`, `DialogueStep.cs`
- Create: `Vortex.Rpg.Quests/Npcs/QuestDialogues.cs`
- Modify: `Vortex.Rpg.Quests/QuestsModule.cs` (register it)
- Test: `Vortex.Rpg.Quests.Tests/Npcs/QuestDialoguesTests.cs`

**Interfaces:**
- Consumes: Task 1's `DialogueDefinition`, `DialogueWalker`, `DialogueNodeView`; plan 1's `IQuestLogGrain` (`AcceptAsync`, `CompleteAsync`, `CountAsync`), `QuestSignals.NpcTalked`, `QuestCodes`.
- Produces: `NpcConversation(PlayerId Player, string Zone, string NpcId, string DialogueId, IReadOnlyDictionary<string, string> QuestStates, Func<IReadOnlyList<ZoneCondition>, bool> AllHold)`; `DialogueStep` with `static Ignored`, `static Show(DialogueNodeView)`, `static Close(string? action, string code, string questId)` and properties `bool IsIgnored`, `DialogueNodeView? Next`, `string? Action`, `string Code`, `string QuestId`; `INpcDialogues { Task<DialogueNodeView?> OpenAsync(NpcConversation); Task<DialogueStep> ChooseAsync(NpcConversation, string nodeId, int choiceIndex); string Marker(NpcConversation) }`.

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rpg.Quests.Tests/Npcs/QuestDialoguesTests.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Orleans;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.Rpg.Quests.Grains;
using Vortex.Primitives.World.Rules;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Content.Kinds;
using Vortex.Rpg.Dialogues;
using Vortex.Rpg.Npcs;
using Vortex.Rpg.Quests.Npcs;
using Vortex.Tests.Support;
using Xunit;

namespace Vortex.Rpg.Quests.Tests.Npcs;

/// <summary>The dialogue service (spec M2a §2.2, §3.3): what a node shows, what a choice does, which marker.</summary>
public sealed class QuestDialoguesTests
{
    private static readonly DialogueDefinition Elder = (DialogueDefinition)new DialogueKind().Parse("""
        {
          "id": "dialogue.camp.elder",
          "kind": "dialogue",
          "entries": [{"quest": "quest.camp.wolves", "state": "ready", "node": "thanks"}],
          "nodes": {
            "start": {"text": "t.start", "choices": [{"text": "t.ask", "next": "offer"}, {"text": "t.bye"}]},
            "offer": {"text": "t.offer", "choices": [{"text": "t.accept", "accept": "quest.camp.wolves"}, {"text": "t.later"}]},
            "thanks": {"text": "t.thanks", "choices": [{"text": "t.complete", "complete": "quest.camp.wolves"}]}
          }
        }
        """);

    private static readonly QuestDefinition Wolves = new()
    {
        Id = "quest.camp.wolves",
        Kind = "quest",
        Level = 1,
        Objectives = [],
        Requires = [new PlayerLevelCondition(1, 0)],
    };

    private readonly List<string> _log = [];

    private QuestDialogues Service() =>
        new(
            FakeProxy.Create<IRpgContent>(call =>
                call.Method.Name == nameof(IRpgContent.Get)
                    ? (string)call.Args![0]! switch
                    {
                        "dialogue.camp.elder" => Elder,
                        "quest.camp.wolves" => Wolves,
                        _ => null,
                    }
                    : null
            ),
            FakeProxy.Create<IGrainFactory>(_ =>
                FakeProxy.Create<IQuestLogGrain>(call =>
                {
                    switch (call.Method.Name)
                    {
                        case nameof(IQuestLogGrain.CountAsync):
                            QuestSignal s = (QuestSignal)call.Args![0]!;
                            _log.Add($"signal {s.Name} {s.Zone} {s.Subject["npc"]}");

                            return Task.CompletedTask;
                        case nameof(IQuestLogGrain.AcceptAsync):
                            _log.Add($"accept {call.Args![0]}");

                            return Task.FromResult(QuestCodes.Ok);
                        case nameof(IQuestLogGrain.CompleteAsync):
                            _log.Add($"complete {call.Args![0]}");

                            return Task.FromResult(QuestCodes.Ok);
                        default:
                            return null;
                    }
                })
            )
        );

    private static NpcConversation Talk(bool requirementsHold = true, params (string Quest, string State)[] states) =>
        new(new PlayerId(7), "camp", "elder", "dialogue.camp.elder", states.ToDictionary(s => s.Quest, s => s.State), _ => requirementsHold);

    [Fact]
    public async Task Opening_ShowsTheNode_AndCountsTheTalk()
    {
        DialogueNodeView? view = await Service().OpenAsync(Talk());

        view!.NodeId.Should().Be("start");
        view.Choices.Select(c => c.Kind).Should().Equal("next", "close");
        _log.Should().Equal("signal npc_talked camp elder");
    }

    [Fact]
    public async Task AnUnknownDialogue_OpensNothing() =>
        (await Service().OpenAsync(Talk() with { DialogueId = "dialogue.nope" })).Should().BeNull();

    [Fact]
    public async Task Next_ShowsTheNextNode_AndAccept_TakesTheQuestThenCloses()
    {
        QuestDialogues service = Service();

        DialogueStep next = await service.ChooseAsync(Talk(), "start", 0);
        next.Next!.NodeId.Should().Be("offer");

        DialogueStep accept = await service.ChooseAsync(Talk(), "offer", 0);
        (accept.Next, accept.Action, accept.Code, accept.QuestId).Should().Be((null, "accepted", QuestCodes.Ok, "quest.camp.wolves"));
        _log.Should().Equal("accept quest.camp.wolves");
    }

    [Fact]
    public async Task AnUnmetRequirement_HidesTheOffer()
    {
        QuestDialogues service = Service();

        (await service.ChooseAsync(Talk(requirementsHold: false), "start", 0)).Next!.Choices.Select(c => c.Kind).Should().Equal("close");
        (await service.ChooseAsync(Talk(requirementsHold: false), "offer", 0)).IsIgnored.Should().BeTrue("a crafted choose of a hidden offer");
        _log.Should().BeEmpty();
    }

    [Fact]
    public async Task HandingIn_CompletesThenCloses()
    {
        DialogueStep step = await Service().ChooseAsync(Talk(true, ("quest.camp.wolves", "ready")), "thanks", 0);

        (step.Action, step.Code).Should().Be(("completed", QuestCodes.Ok));
        _log.Should().Equal("complete quest.camp.wolves");
    }

    [Fact]
    public async Task APlainClose_ClosesWithoutAction()
    {
        DialogueStep step = await Service().ChooseAsync(Talk(), "start", 1);

        (step.IsIgnored, step.Next, step.Action).Should().Be((false, null, null));
    }

    [Fact]
    public void TheMarker_SaysWhatTheNpcHasForThisPlayer()
    {
        QuestDialogues service = Service();

        service.Marker(Talk()).Should().Be("available");
        service.Marker(Talk(requirementsHold: false)).Should().Be("");
        service.Marker(Talk(true, ("quest.camp.wolves", "active"))).Should().Be("active");
        service.Marker(Talk(true, ("quest.camp.wolves", "ready"))).Should().Be("ready");
        service.Marker(Talk(true, ("quest.camp.wolves", "done"))).Should().Be("");
    }
}
```

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestDialoguesTests"`
Expected: build FAIL, `QuestDialogues`, `NpcConversation` not found.

- [ ] **Step 3: Write the contract**

```csharp
// Vortex.Rpg/Npcs/NpcConversation.cs
using System;
using System.Collections.Generic;
using Vortex.Primitives.Players;
using Vortex.Primitives.World.Rules;

namespace Vortex.Rpg.Npcs;

/// <summary>
/// One player talking to one NPC (spec M2a §3.3), as the room hands it over: who, in which zone (its
/// key), which NPC (its zone id) and dialogue, the player's quest states (quest id → none, active,
/// ready, done; a quest absent is none), and the room's rules for a quest's requirements.
/// </summary>
public sealed record NpcConversation(
    PlayerId Player,
    string Zone,
    string NpcId,
    string DialogueId,
    IReadOnlyDictionary<string, string> QuestStates,
    Func<IReadOnlyList<ZoneCondition>, bool> AllHold
);
```

```csharp
// Vortex.Rpg/Npcs/DialogueStep.cs
using Vortex.Rpg.Dialogues;

namespace Vortex.Rpg.Npcs;

/// <summary>What a choice did (spec M2a §3.3): nothing (a stale or hidden choice), a node to show, or the end, with a quest result.</summary>
public sealed record DialogueStep
{
    public static readonly DialogueStep Ignored = new() { IsIgnored = true };

    public bool IsIgnored { get; private init; }

    public DialogueNodeView? Next { get; private init; }

    /// <summary>accepted or completed; null for a plain close.</summary>
    public string? Action { get; private init; }

    public string Code { get; private init; } = string.Empty;

    public string QuestId { get; private init; } = string.Empty;

    public static DialogueStep Show(DialogueNodeView next) => new() { Next = next };

    public static DialogueStep Close(string? action, string code, string questId) => new() { Action = action, Code = code, QuestId = questId };
}
```

```csharp
// Vortex.Rpg/Npcs/INpcDialogues.cs
using System.Threading.Tasks;
using Vortex.Rpg.Dialogues;

namespace Vortex.Rpg.Npcs;

/// <summary>
/// What an NPC's dialogue says and does (spec M2a §3.3), behind which the room needs to know nothing of
/// content or quests: the room keeps the NPC, the reach and the session; this answers. Declared by the
/// quests module.
/// </summary>
public interface INpcDialogues
{
    /// <summary>The node the dialogue opens at for this player, or null when it has none; the talk is counted for quests.</summary>
    public Task<DialogueNodeView?> OpenAsync(NpcConversation conversation);

    /// <summary>The choice at <paramref name="choiceIndex"/> of the content's node, if this player may make it.</summary>
    public Task<DialogueStep> ChooseAsync(NpcConversation conversation, string nodeId, int choiceIndex);

    /// <summary>available, ready, active or empty: what this NPC has for this player.</summary>
    public string Marker(NpcConversation conversation);
}
```

- [ ] **Step 4: Write the service**

```csharp
// Vortex.Rpg.Quests/Npcs/QuestDialogues.cs
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using Orleans;
using Vortex.Primitives.Orleans;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Protocol.Messages.Outgoing.Rpg.Quests;
using Vortex.Rpg.Content;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Dialogues;
using Vortex.Rpg.Npcs;

namespace Vortex.Rpg.Quests.Npcs;

/// <summary>
/// The dialogues of the content, walked for one player (spec M2a §2.2, §3.3): an offer is shown when
/// the quest is not in the log, not retired and its requirements hold; a hand-in when it is ready. A
/// choice not shown is ignored, whoever sends it.
/// </summary>
public sealed class QuestDialogues(IRpgContent content, IGrainFactory grains) : INpcDialogues
{
    public async Task<DialogueNodeView?> OpenAsync(NpcConversation c)
    {
        if (content.Get<DialogueDefinition>(c.DialogueId) is not { } dialogue || !dialogue.Nodes.ContainsKey("start"))
        {
            return null;
        }

        await grains
            .GetQuestLogGrain(c.Player)
            .CountAsync(new QuestSignal(QuestSignals.NpcTalked, c.Zone, ImmutableDictionary<string, string>.Empty.Add("npc", c.NpcId)));

        return DialogueWalker.View(dialogue, DialogueWalker.OpeningNode(dialogue, q => StateOf(c, q)), q => StateOf(c, q), q => Offerable(c, q));
    }

    public async Task<DialogueStep> ChooseAsync(NpcConversation c, string nodeId, int choiceIndex)
    {
        if (content.Get<DialogueDefinition>(c.DialogueId) is not { } dialogue || !dialogue.Nodes.TryGetValue(nodeId, out DialogueNodeDefinition? node))
        {
            return DialogueStep.Ignored;
        }

        DialogueNodeView shown = DialogueWalker.View(dialogue, nodeId, q => StateOf(c, q), q => Offerable(c, q));

        if (!shown.Choices.Any(v => v.Index == choiceIndex))
        {
            return DialogueStep.Ignored;
        }

        DialogueChoiceDefinition choice = node.Choices[choiceIndex];

        if (choice.Accept is { } take)
        {
            return DialogueStep.Close("accepted", await grains.GetQuestLogGrain(c.Player).AcceptAsync(take), take);
        }

        if (choice.Complete is { } give)
        {
            return DialogueStep.Close("completed", await grains.GetQuestLogGrain(c.Player).CompleteAsync(give), give);
        }

        return choice.Next is { } next
            ? DialogueStep.Show(DialogueWalker.View(dialogue, next, q => StateOf(c, q), q => Offerable(c, q)))
            : DialogueStep.Close(null, QuestCodes.Ok, string.Empty);
    }

    public string Marker(NpcConversation c)
    {
        if (content.Get<DialogueDefinition>(c.DialogueId) is not { } dialogue)
        {
            return RpgNpcMarker.None;
        }

        List<DialogueChoiceDefinition> choices = [.. dialogue.Nodes.Values.SelectMany(n => n.Choices)];

        if (choices.Any(ch => ch.Complete is { } q && StateOf(c, q) == "ready"))
        {
            return RpgNpcMarker.Ready;
        }

        if (choices.Any(ch => ch.Accept is { } q && Offerable(c, q)))
        {
            return RpgNpcMarker.Available;
        }

        return choices.Any(ch => ch.Complete is { } q && StateOf(c, q) == "active") ? RpgNpcMarker.Active : RpgNpcMarker.None;
    }

    private static string StateOf(NpcConversation c, string quest) =>
        c.QuestStates.GetValueOrDefault(quest) ?? QuestCodes.Name(QuestStatus.None);

    private bool Offerable(NpcConversation c, string quest) =>
        StateOf(c, quest) == QuestCodes.Name(QuestStatus.None)
        && content.Get<QuestDefinition>(quest) is { Retired: false } definition
        && c.AllHold(definition.Requires);
}
```

In `QuestsModule.ConfigureServices`:

```csharp
        // Spec M2a §3.3: what an NPC's dialogue says; the room keeps the NPC and the session.
        services.AddSingleton<INpcDialogues, QuestDialogues>();
```

- [ ] **Step 5: Run the tests**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`
Expected: PASS, 31 tests (24 + 7).

- [ ] **Step 6: Commit**

```bash
git add -- Vortex.Rpg/Npcs Vortex.Rpg.Quests/Npcs Vortex.Rpg.Quests.Tests/Npcs
git commit -m "Quêtes : le service de dialogue, ce qu'un nœud montre, ce qu'un choix fait, le marqueur d'un PNJ" -- Vortex.Rpg/Npcs Vortex.Rpg.Quests Vortex.Rpg.Quests.Tests
```

---

### Task 4: NPCs stand in the room

**Files:**
- Create: `Vortex.Primitives/Rooms/Object/Avatars/IRoomNpc.cs`, `IRoomNpcContext.cs`, `Vortex.Primitives/Rooms/Object/Logic/Avatars/IRoomNpcLogic.cs`
- Create: `Vortex.Rooms/Object/Avatars/Npc/RoomNpcAvatar.cs`
- Create: `Vortex.Rooms/Grains/Modules/RoomNpcModule.cs`
- Modify: `Vortex.Rooms/Grains/RoomGrain.cs` (constructor parameter `INpcDialogues npcDialogues` last, field, `NpcModule` built in the constructor; `EnsureRoomActiveAsync` spawns)
- Modify: `Vortex.Rooms.Tests/Support/RoomHarness.cs`, `Vortex.Rooms.Tests/Grains/TickBoundaryTests.cs`, `Vortex.Rooms.Tests/Zones/ZoneInstanceEntryTests.cs` (the new argument)
- Test: `Vortex.Rooms.Tests/Zones/RoomNpcTests.cs`

**Interfaces:**
- Consumes: `ZoneNpc` (`Id`, `Name`, `Look`, `Cell`, `Rotation`, `Dialogue`), `INpcDialogues`.
- Produces: `IRoomNpc : IRoomAvatar<IRoomNpc, IRoomNpcLogic, IRoomNpcContext> { string NpcId; string? Dialogue }`; `RoomNpcAvatar` (bot snapshot: `WebId = -ObjectId`, `Name = ZoneNpc.Name ?? ZoneNpc.Id`, `Figure = Look ?? DefaultFigure`, gender male, owner 0/""); `RoomNpcModule(RoomGrain)` with `void EnsureSpawned()`, `IRoomNpc? NpcAt(int objectId)`, `IReadOnlyCollection<IRoomNpc> Npcs`; `RoomGrain.NpcModule`; harness property `NpcDialogues` (`Func<ProxyCall, object?>`).

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rooms.Tests/Zones/RoomNpcTests.cs
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Vortex.Primitives.Rooms.Enums;
using Vortex.Primitives.Rooms.Object.Avatars;
using Vortex.Primitives.Rooms.Snapshots.Avatars;
using Vortex.Primitives.World;
using Vortex.Primitives.World.Layers;
using Vortex.Rooms.Tests.Support;
using Vortex.Tests.Support.World;
using Xunit;

namespace Vortex.Rooms.Tests.Zones;

/// <summary>Spec M2a §3.3: a zone's NPCs stand in its room, as Habbo bots, and never walk.</summary>
public sealed class RoomNpcTests
{
    private static ZoneDocument WithNpcs(params ZoneNpc[] npcs) => ZoneSamples.Minimal() with { Npcs = [.. npcs] };

    private static ZoneNpc Elder(int x = 2, int y = 2) =>
        new() { Id = "elder", Template = "npc.elder", Name = "Ancien du camp", Look = "hd-180-1.ch-210-66", Cell = new ZoneCell(x, y), Rotation = 4, Dialogue = "dialogue.camp.elder" };

    [Fact]
    public async Task AZonesNpcs_AreSpawned_Once_AsBots()
    {
        RoomHarness harness = await RoomHarness.CreateZoneAsync(WithNpcs(Elder()));

        harness.Grain.NpcModule.EnsureSpawned();
        harness.Grain.NpcModule.EnsureSpawned();

        IRoomNpc npc = harness.Grain.NpcModule.Npcs.Should().ContainSingle().Subject;
        (npc.NpcId, npc.X, npc.Y, npc.Dialogue).Should().Be(("elder", 2, 2, "dialogue.camp.elder"));
        RoomBotAvatarSnapshot snapshot = npc.GetSnapshot().Should().BeOfType<RoomBotAvatarSnapshot>().Subject;
        (snapshot.AvatarType, snapshot.Name, snapshot.Figure, snapshot.WebId).Should().Be((RoomObjectType.Bot, "Ancien du camp", "hd-180-1.ch-210-66", -npc.ObjectId.Value));
        harness.Grain.NpcModule.NpcAt(npc.ObjectId.Value).Should().BeSameAs(npc);
    }

    [Fact]
    public async Task AnNpcOutsideTheMap_IsSkipped()
    {
        RoomHarness harness = await RoomHarness.CreateZoneAsync(WithNpcs(Elder(), Elder(99, 99) with { Id = "lost" }));

        harness.Grain.NpcModule.EnsureSpawned();

        harness.Grain.NpcModule.Npcs.Select(n => n.NpcId).Should().Equal("elder");
    }

    [Fact]
    public async Task AnOrdinaryRoom_HasNoNpc()
    {
        RoomHarness harness = await RoomHarness.CreateAsync();

        harness.Grain.NpcModule.EnsureSpawned();

        harness.Grain.NpcModule.Npcs.Should().BeEmpty();
    }
}
```

(Fill `ZoneNpc`'s required members as the record declares them; `ZoneSamples.Minimal()` is 6×6, so (2, 2) is inside and (99, 99) outside.)

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rooms.Tests --artifacts-path artifacts --filter "FullyQualifiedName~RoomNpcTests"`
Expected: build FAIL, `NpcModule` not found.

- [ ] **Step 3: Write the NPC avatar types**

```csharp
// Vortex.Primitives/Rooms/Object/Avatars/IRoomNpc.cs
using Vortex.Primitives.Rooms.Object.Logic.Avatars;

namespace Vortex.Primitives.Rooms.Object.Avatars;

/// <summary>A zone's NPC in its room (spec M2a §3.3): a Habbo bot that never walks and is no combatant.</summary>
public interface IRoomNpc : IRoomAvatar<IRoomNpc, IRoomNpcLogic, IRoomNpcContext>
{
    new IRoomNpcLogic Logic { get; }

    /// <summary>Its id in the zone document (<c>elder</c>).</summary>
    public string NpcId { get; }

    /// <summary>The dialogue it opens, or null.</summary>
    public string? Dialogue { get; }
}
```

```csharp
// Vortex.Primitives/Rooms/Object/Avatars/IRoomNpcContext.cs
using Vortex.Primitives.Rooms.Object.Logic.Avatars;

namespace Vortex.Primitives.Rooms.Object.Avatars;

public interface IRoomNpcContext : IRoomAvatarContext<IRoomNpc, IRoomNpcLogic, IRoomNpcContext>
{
    new IRoomNpc RoomObject { get; }
}
```

```csharp
// Vortex.Primitives/Rooms/Object/Logic/Avatars/IRoomNpcLogic.cs
using Vortex.Primitives.Rooms.Object.Avatars;

namespace Vortex.Primitives.Rooms.Object.Logic.Avatars;

public interface IRoomNpcLogic : IRoomAvatarLogic<IRoomNpc, IRoomNpcLogic, IRoomNpcContext> { }
```

(Match `IRoomMonster`, `IRoomMonsterContext`, `IRoomMonsterLogic` exactly: open them and copy their `using` lines and any member they declare that the NPC needs too.)

```csharp
// Vortex.Rooms/Object/Avatars/Npc/RoomNpcAvatar.cs
using System.Text;
using Vortex.Primitives.Rooms.Enums;
using Vortex.Primitives.Rooms.Object.Avatars;
using Vortex.Primitives.Rooms.Object.Logic.Avatars;
using Vortex.Primitives.Rooms.Snapshots.Avatars;

namespace Vortex.Rooms.Object.Avatars.Npc;

/// <summary>
/// A zone's NPC (spec M2a §3.3), shown as a Habbo bot: its web id its object id negated (it is nobody),
/// its name the editor's, its figure the editor's look. It has no object logic and never walks.
/// </summary>
public sealed class RoomNpcAvatar : RoomAvatar<IRoomNpc, IRoomNpcLogic, IRoomNpcContext>, IRoomNpc
{
    /// <summary>The look of an NPC the editor gave none.</summary>
    public const string DefaultFigure = "hd-180-1.ch-210-66.lg-270-82.sh-290-81";

    public override RoomObjectType AvatarType { get; } = RoomObjectType.Bot;

    public required string NpcId { get; init; }

    public string? Dialogue { get; init; }

    public required string Name { get; init; }

    public required string Look
    {
        init => Figure = value;
    }

    protected override RoomBotAvatarSnapshot BuildSnapshot()
    {
        StringBuilder statusString = new("/");

        foreach ((AvatarStatusType type, string value) in Statuses)
        {
            statusString.Append($"{type.ToLegacyString()} {value}/");
        }

        return new RoomBotAvatarSnapshot
        {
            AvatarType = AvatarType,
            WebId = -ObjectId.Value,
            Name = Name,
            Motto = string.Empty,
            Figure = Figure,
            ObjectId = ObjectId,
            X = X,
            Y = Y,
            Z = Z,
            BodyRotation = Rotation,
            HeadRotation = HeadRotation,
            Status = statusString.ToString(),
            Gender = AvatarGenderType.Male,
            OwnerId = 0,
            OwnerName = string.Empty,
        };
    }
}
```

(Copy `RoomMonsterAvatar.cs`'s `using` for `ToLegacyString` and `AvatarGenderType`'s namespace from `RoomBotAvatarSnapshot.cs`. If `RoomAvatar<…>` already declares a `Name` member, drop the one here and set the base's in `RoomNpcModule`.)

- [ ] **Step 4: Write the module and wire it into the grain**

```csharp
// Vortex.Rooms/Grains/Modules/RoomNpcModule.cs
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using Vortex.Primitives.Rooms.Object;
using Vortex.Primitives.Rooms.Object.Avatars;
using Vortex.Primitives.World.Layers;
using Vortex.Rooms.Object.Avatars.Npc;

namespace Vortex.Rooms.Grains.Modules;

/// <summary>
/// A zone's NPCs in its room (spec M2a §3.3): put on their cells once, when the room is made ready.
/// An NPC whose cell is not on the map is left out and said so: the room still opens.
/// </summary>
public sealed class RoomNpcModule(RoomGrain roomGrain)
{
    private readonly Dictionary<int, IRoomNpc> _byObjectId = [];
    private bool _spawned;

    public IReadOnlyCollection<IRoomNpc> Npcs => _byObjectId.Values;

    public IRoomNpc? NpcAt(int objectId) => _byObjectId.GetValueOrDefault(objectId);

    public void EnsureSpawned()
    {
        if (_spawned || roomGrain._state.Zone is not { } zone)
        {
            return;
        }

        _spawned = true;

        foreach (ZoneNpc npc in zone.Npcs)
        {
            if (!roomGrain.MapModule.InBounds(npc.Cell.X, npc.Cell.Y))
            {
                roomGrain._logger.LogWarning(
                    "NPC {NpcId} of room {RoomId} stands at ({X}, {Y}), outside the map: left out",
                    npc.Id,
                    roomGrain.RoomId.Value,
                    npc.Cell.X,
                    npc.Cell.Y
                );

                continue;
            }

            RoomNpcAvatar avatar = new()
            {
                ObjectId = new RoomObjectId(roomGrain.AvatarModule.NextObjectId()),
                NpcId = npc.Id,
                Dialogue = npc.Dialogue,
                Name = npc.Name ?? npc.Id,
                Look = string.IsNullOrWhiteSpace(npc.Look) ? RoomNpcAvatar.DefaultFigure : npc.Look,
            };

            roomGrain._state.AvatarsByObjectId[avatar.ObjectId] = avatar;
            int idx = roomGrain.MapModule.ToIdx(npc.Cell.X, npc.Cell.Y);
            roomGrain.MapModule.RollAvatar(avatar, idx, roomGrain.MapModule.GetTileHeightForAvatar(idx));
            avatar.SetRotation((Rotation)npc.Rotation);
            _byObjectId[avatar.ObjectId.Value] = avatar;
        }
    }
}
```

(Take the `Rotation` enum and `SetRotation` call from `RoomAvatarModule.cs`, which does `avatar.SetRotation(startRot)` on entry; if `Rotation` is not castable from int, use the conversion it uses.)

In `RoomGrain.cs`:
- constructor: add `INpcDialogues npcDialogues` as the last parameter, keep it in `internal readonly INpcDialogues _npcDialogues;`;
- with the other modules: `public readonly RoomNpcModule NpcModule;` and `NpcModule = new RoomNpcModule(this);` beside `ZoneTriggers = new ZoneTriggerModule(this);`;
- `EnsureRoomActiveAsync`, after `await FurniModule.EnsureFurniLoadedAsync(ct);`: `NpcModule.EnsureSpawned();`.

In the three test files, add as the last constructor argument (after the `ZoneRuleRegistry`):
- `RoomHarness.cs`: `FakeProxy.Create<INpcDialogues>(call => NpcDialogues?.Invoke(call)),` and the property

```csharp
    /// <summary>What the room's dialogue service answers (spec M2a §3.3); nothing by default.</summary>
    public Func<ProxyCall, object?>? NpcDialogues { get; set; }
```

- `TickBoundaryTests.cs` and `ZoneInstanceEntryTests.cs`: `FakeProxy.Create<INpcDialogues>(_ => null),`.

- [ ] **Step 5: Run the tests**

Run: `dotnet test Vortex.Rooms.Tests --artifacts-path artifacts`
Expected: PASS, the 3 new tests and the 417 others. Then `dotnet build Vortex.Main/Vortex.Main.csproj --artifacts-path artifacts`: the host resolves `INpcDialogues` from `QuestsModule` (Task 3).

- [ ] **Step 6: Commit**

```bash
git add -- Vortex.Primitives/Rooms/Object/Avatars/IRoomNpc.cs Vortex.Primitives/Rooms/Object/Avatars/IRoomNpcContext.cs Vortex.Primitives/Rooms/Object/Logic/Avatars/IRoomNpcLogic.cs Vortex.Rooms/Object/Avatars/Npc Vortex.Rooms/Grains/Modules/RoomNpcModule.cs Vortex.Rooms.Tests/Zones/RoomNpcTests.cs
git commit -m "PNJ : les PNJ d'une zone se tiennent dans sa salle, en bots Habbo, une seule fois" -- Vortex.Primitives/Rooms Vortex.Rooms Vortex.Rooms.Tests
```

---

### Task 5: Talking, choosing, markers

**Files:**
- Create: `Vortex.Primitives/Rooms/Grains/IRoomNpcs.cs`
- Modify: `Vortex.Primitives/Rooms/Grains/IRoomGrain.cs` (add `IRoomNpcs` to its list), `Vortex.Primitives/Orleans/GrainFactoryExtensions.cs` (`GetRoomNpcs`)
- Create: `Vortex.Rooms/Grains/RoomGrain.Npcs.cs`, `Vortex.Rooms/Grains/Modules/RoomDialogueModule.cs`, `Vortex.Rooms/Grains/Modules/DialogueSession.cs`
- Modify: `Vortex.Rooms/Grains/RoomGrain.Facts.cs` (markers when the quest part changes), `Vortex.Rooms/Grains/Modules/RoomAvatarModule.cs` (markers after joining the fights), `Vortex.Rooms/Grains/RoomGrain.cs` (build and register the dialogue module)
- Create: `Vortex.PacketHandlers/Rpg/Quests/RpgNpcTalkMessageHandler.cs`, `RpgDialogueChooseMessageHandler.cs`
- Modify: `scripts/hooks/authorization-surface-baseline.json` (two lines)
- Test: `Vortex.Rooms.Tests/Zones/RoomDialogueTests.cs`, `Vortex.PacketHandlers.Tests/Rpg/NpcHandlersTests.cs`

**Interfaces:**
- Consumes: Task 3's `INpcDialogues`, `NpcConversation`, `DialogueStep`; Task 4's `RoomNpcModule`; Task 2's composers; `RoomAvatarModule.WalkAvatarToThenAsync(player, x, y, Func<CancellationToken, Task> then, ct)`; `ZoneTriggers.ConditionsHold(conditions, player)`; the room facts `PartsOf(zone.Facts, player)`.
- Produces: `IRoomNpcs : IGrainWithIntegerKey { Task TalkToNpcAsync(ActionContext ctx, int objectId, CancellationToken ct); Task ChooseDialogueAsync(ActionContext ctx, int choice, CancellationToken ct) }`; `factory.GetRoomNpcs(RoomId)`; `RoomDialogueModule` with `TalkAsync(PlayerId, int objectId, CancellationToken)`, `ChooseAsync(PlayerId, int choice, CancellationToken)`, `SendMarkersAsync(PlayerId)`, and as a room event listener it forgets a player who left.

- [ ] **Step 1: Write the failing room tests**

```csharp
// Vortex.Rooms.Tests/Zones/RoomDialogueTests.cs
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Vortex.Primitives.Orleans.Snapshots.Players;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rooms.Enums;
using Vortex.Primitives.Rooms.Object.Logic.Avatars;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.World;
using Vortex.Primitives.World.Layers;
using Vortex.Protocol.Messages.Outgoing.Rpg.Quests;
using Vortex.Rooms.Tests.Support;
using Vortex.Rpg.Dialogues;
using Vortex.Rpg.Npcs;
using Vortex.Tests.Support;
using Vortex.Tests.Support.World;
using Xunit;

namespace Vortex.Rooms.Tests.Zones;

/// <summary>Spec M2a §3.3: talking to an NPC opens its dialogue; a choice moves it on, from close enough only.</summary>
public sealed class RoomDialogueTests
{
    private static readonly DialogueNodeView Start = new(
        "start",
        "dialogue.camp.elder.name",
        "t.start",
        [new DialogueChoiceView(0, "t.ask", "next"), new DialogueChoiceView(2, "t.bye", "close")]
    );

    private static readonly DialogueNodeView Offer = new("offer", "dialogue.camp.elder.name", "t.offer", [new DialogueChoiceView(0, "t.accept", "accept")]);

    private readonly List<string> _calls = [];
    private RoomHarness _harness = null!;
    private int _elder;

    private async Task ZoneAsync(string? dialogue = "dialogue.camp.elder")
    {
        ZoneDocument zone = ZoneSamples.Minimal("camp") with
        {
            Npcs = [new ZoneNpc { Id = "elder", Template = "npc.elder", Name = "Ancien", Cell = new ZoneCell(2, 2), Dialogue = dialogue }],
        };
        _harness = await RoomHarness.CreateZoneAsync(zone);
        _harness.LogicFactory = () => FakeProxy.Create<IRoomPlayerLogic>(_ => null);
        _harness.NpcDialogues = call =>
        {
            NpcConversation c = (NpcConversation)call.Args![0]!;

            switch (call.Method.Name)
            {
                case nameof(INpcDialogues.OpenAsync):
                    _calls.Add($"open {c.Player.Value} {c.Zone} {c.NpcId} {c.DialogueId}");

                    return Task.FromResult<DialogueNodeView?>(Start);
                case nameof(INpcDialogues.ChooseAsync):
                    _calls.Add($"choose {call.Args[1]} {call.Args[2]}");

                    return Task.FromResult(
                        (int)call.Args[2]! == 0 && (string)call.Args[1]! == "start" ? DialogueStep.Show(Offer)
                        : (string)call.Args[1]! == "offer" ? DialogueStep.Close("accepted", QuestCodes.Ok, "quest.camp.wolves")
                        : DialogueStep.Close(null, QuestCodes.Ok, string.Empty)
                    );
                case nameof(INpcDialogues.Marker):
                    return c.QuestStates.GetValueOrDefault("quest.camp.wolves") == "ready" ? "ready" : "available";
                default:
                    return null;
            }
        };
        _harness.Grain.NpcModule.EnsureSpawned();
        _elder = _harness.Grain.NpcModule.Npcs.Single().ObjectId.Value;
    }

    private async Task EnterAtAsync(PlayerId player, int x, int y)
    {
        await _harness.Grain.CreateAvatarFromPlayerAsync(
            _harness.ContextFor(player),
            new PlayerSummarySnapshot
            {
                PlayerId = player,
                Name = "P" + player.Value,
                Motto = string.Empty,
                Figure = "hd-180-1",
                Gender = AvatarGenderType.Male,
                AchievementScore = 0,
                CreatedAt = DateTime.UtcNow,
            },
            CancellationToken.None
        );
        _harness.TeleportPlayer(player, x, y);
    }

    private T[] Sent<T>(PlayerId player) => [.. _harness.ComposersSent.Where(s => s.Target == player).Select(s => s.Composer).OfType<T>()];

    [Fact]
    public async Task TalkingFromNextToTheNpc_OpensItsDialogue()
    {
        await ZoneAsync();
        await EnterAtAsync(RoomHarness.Owner, 3, 2);

        await _harness.Grain.TalkToNpcAsync(_harness.ContextFor(RoomHarness.Owner), _elder, CancellationToken.None);

        _calls.Should().Equal($"open {RoomHarness.Owner.Value} camp elder dialogue.camp.elder");
        RpgDialogueMessageComposer shown = Sent<RpgDialogueMessageComposer>(RoomHarness.Owner).Single();
        (shown.NpcObjectId, shown.Text).Should().Be((_elder, "t.start"));
        shown.Choices.Select(c => c.Kind).Should().Equal("next", "close");
    }

    [Fact]
    public async Task AChoice_IsThePositionInTheShownList_AndAnAcceptClosesWithItsResult()
    {
        await ZoneAsync();
        await EnterAtAsync(RoomHarness.Owner, 3, 2);
        await _harness.Grain.TalkToNpcAsync(_harness.ContextFor(RoomHarness.Owner), _elder, CancellationToken.None);

        await _harness.Grain.ChooseDialogueAsync(_harness.ContextFor(RoomHarness.Owner), 0, CancellationToken.None);
        await _harness.Grain.ChooseDialogueAsync(_harness.ContextFor(RoomHarness.Owner), 0, CancellationToken.None);

        _calls.Skip(1).Should().Equal("choose start 0", "choose offer 0");
        Sent<RpgDialogueCloseMessageComposer>(RoomHarness.Owner).Should().ContainSingle();
        RpgQuestResultMessageComposer result = Sent<RpgQuestResultMessageComposer>(RoomHarness.Owner).Single();
        (result.Action, result.Code, result.QuestId).Should().Be(("accepted", "ok", "quest.camp.wolves"));
    }

    [Fact]
    public async Task ThePositionMapsToTheContentsIndex()
    {
        await ZoneAsync();
        await EnterAtAsync(RoomHarness.Owner, 3, 2);
        await _harness.Grain.TalkToNpcAsync(_harness.ContextFor(RoomHarness.Owner), _elder, CancellationToken.None);

        await _harness.Grain.ChooseDialogueAsync(_harness.ContextFor(RoomHarness.Owner), 1, CancellationToken.None);

        _calls.Last().Should().Be("choose start 2", "position 1 shows the content's choice 2");
    }

    [Fact]
    public async Task AChoiceOutOfTheShownList_IsIgnored()
    {
        await ZoneAsync();
        await EnterAtAsync(RoomHarness.Owner, 3, 2);
        await _harness.Grain.TalkToNpcAsync(_harness.ContextFor(RoomHarness.Owner), _elder, CancellationToken.None);

        await _harness.Grain.ChooseDialogueAsync(_harness.ContextFor(RoomHarness.Owner), 5, CancellationToken.None);
        await _harness.Grain.ChooseDialogueAsync(_harness.ContextFor(RoomHarness.Stranger), 0, CancellationToken.None);

        _calls.Should().ContainSingle("only the open");
    }

    [Fact]
    public async Task AChoiceFromTooFar_ClosesTheDialogue()
    {
        await ZoneAsync();
        await EnterAtAsync(RoomHarness.Owner, 3, 2);
        await _harness.Grain.TalkToNpcAsync(_harness.ContextFor(RoomHarness.Owner), _elder, CancellationToken.None);
        _harness.TeleportPlayer(RoomHarness.Owner, 5, 5);

        await _harness.Grain.ChooseDialogueAsync(_harness.ContextFor(RoomHarness.Owner), 0, CancellationToken.None);

        _calls.Should().ContainSingle("no choice reaches the dialogue service");
        Sent<RpgDialogueCloseMessageComposer>(RoomHarness.Owner).Should().ContainSingle();
    }

    [Fact]
    public async Task TalkingFromAfar_WalksUpFirst()
    {
        await ZoneAsync();
        await EnterAtAsync(RoomHarness.Owner, 5, 5);

        await _harness.Grain.TalkToNpcAsync(_harness.ContextFor(RoomHarness.Owner), _elder, CancellationToken.None);

        _calls.Should().BeEmpty("not yet: the player walks");
        await _harness.TickUntilIdleAsync();
        _calls.Should().ContainSingle().Which.Should().StartWith("open");
    }

    [Fact]
    public async Task AnNpcWithoutDialogue_SaysNothing()
    {
        await ZoneAsync(dialogue: null);
        await EnterAtAsync(RoomHarness.Owner, 3, 2);

        await _harness.Grain.TalkToNpcAsync(_harness.ContextFor(RoomHarness.Owner), _elder, CancellationToken.None);

        _calls.Should().BeEmpty();
        Sent<RpgDialogueMessageComposer>(RoomHarness.Owner).Should().BeEmpty();
    }

    [Fact]
    public async Task Markers_AreEachPlayersOwn()
    {
        await ZoneAsync();
        await EnterAtAsync(RoomHarness.Owner, 3, 2);
        await EnterAtAsync(RoomHarness.Stranger, 4, 4);

        await _harness.Grain.UpdatePlayerFactsAsync(
            RoomHarness.Owner,
            new QuestZoneFacts { Sequence = 99, States = ImmutableDictionary<string, string>.Empty.Add("quest.camp.wolves", "ready") }
        );

        Sent<RpgNpcsMessageComposer>(RoomHarness.Owner).Last().Npcs.Single().Should().Be(new RpgNpcMarker { ObjectId = _elder, Marker = "ready" });
        Sent<RpgNpcsMessageComposer>(RoomHarness.Stranger).Last().Npcs.Single().Marker.Should().Be("available");
    }
}
```

Two harness helpers this needs, added to `RoomHarness` if they do not exist yet (look first: a test may already move an avatar or tick the room):

```csharp
    /// <summary>Puts the player's avatar on (x, y) at once, as a teleport does.</summary>
    public void TeleportPlayer(PlayerId player, int x, int y)
    {
        IRoomAvatar avatar = Grain._state.AvatarsByObjectId[Grain._state.AvatarsByPlayerId[player]];
        Grain.AvatarModule.Teleport(avatar, x, y);
    }

    /// <summary>Ticks the room until nobody walks (at most 200 ticks).</summary>
    public async Task TickUntilIdleAsync()
    {
        for (int i = 0; i < 200 && Grain._state.AvatarsByObjectId.Values.Any(a => a.IsWalking); i++)
        {
            await TickAsync();
        }
    }
```

(`TickAsync` is whatever the harness already uses to advance the room clock — look for the method the walking tests call, e.g. in `RoomCombatTests.WalkingByHand_StopsTheAttack` or the walk tests, and use it.)

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rooms.Tests --artifacts-path artifacts --filter "FullyQualifiedName~RoomDialogueTests"`
Expected: build FAIL, `TalkToNpcAsync`, `ChooseDialogueAsync` not found.

- [ ] **Step 3: Write the grain surface**

```csharp
// Vortex.Primitives/Rooms/Grains/IRoomNpcs.cs
using System.Threading;
using System.Threading.Tasks;
using Orleans;
using Vortex.Primitives.Action;

namespace Vortex.Primitives.Rooms.Grains;

/// <summary>A zone room's NPCs, as a player reaches them (spec M2a §3.1, §3.3).</summary>
[Alias("Vortex.Primitives.Rooms.Grains.IRoomNpcs")]
public interface IRoomNpcs : IGrainWithIntegerKey
{
    /// <summary>The player talks to this NPC: from next to it, else after walking up to it.</summary>
    public Task TalkToNpcAsync(ActionContext ctx, int objectId, CancellationToken ct);

    /// <summary>A choice of the dialogue last shown to the player, by its position in that list.</summary>
    public Task ChooseDialogueAsync(ActionContext ctx, int choice, CancellationToken ct);
}
```

Add `IRoomNpcs,` to `IRoomGrain`'s interface list, and to `GrainFactoryExtensions`:

```csharp
    public static IRoomNpcs GetRoomNpcs(this IGrainFactory factory, RoomId roomId) =>
        factory.GetGrain<IRoomNpcs>((long)roomId.Value);
```

(Check `ActionContext`'s namespace in `IRoomCombat.cs` and copy it.)

```csharp
// Vortex.Rooms/Grains/RoomGrain.Npcs.cs
using System.Threading;
using System.Threading.Tasks;
using Vortex.Primitives.Action;

namespace Vortex.Rooms.Grains;

/// <summary>The zone's NPCs, as players reach them (spec M2a §3.3): the dialogue module does the work.</summary>
public sealed partial class RoomGrain
{
    public Task TalkToNpcAsync(ActionContext ctx, int objectId, CancellationToken ct)
    {
        // Actor guard: a real player with an avatar in this room.
        if (ctx.PlayerId <= 0 || !_state.AvatarsByPlayerId.ContainsKey(ctx.PlayerId))
        {
            return Task.CompletedTask;
        }

        return DialogueModule.TalkAsync(ctx.PlayerId, objectId, ct);
    }

    public Task ChooseDialogueAsync(ActionContext ctx, int choice, CancellationToken ct)
    {
        // Actor guard: a real player with an avatar in this room.
        if (ctx.PlayerId <= 0 || !_state.AvatarsByPlayerId.ContainsKey(ctx.PlayerId))
        {
            return Task.CompletedTask;
        }

        return DialogueModule.ChooseAsync(ctx.PlayerId, choice, ct);
    }
}
```

- [ ] **Step 4: Write the dialogue module**

```csharp
// Vortex.Rooms/Grains/Modules/DialogueSession.cs
using Vortex.Rpg.Dialogues;

namespace Vortex.Rooms.Grains.Modules;

/// <summary>A player's open dialogue: with which NPC, and the node last shown (its choices are what positions map to).</summary>
internal sealed record DialogueSession(int NpcObjectId, string NpcId, string DialogueId, DialogueNodeView Shown);
```

```csharp
// Vortex.Rooms/Grains/Modules/RoomDialogueModule.cs
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Vortex.Logging.Extensions;
using Vortex.Primitives.Networking;
using Vortex.Primitives.Orleans;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rooms;
using Vortex.Primitives.Rooms.Events;
using Vortex.Primitives.Rooms.Events.Player;
using Vortex.Primitives.Rooms.Object;
using Vortex.Primitives.Rooms.Object.Avatars;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Primitives.World.Rules;
using Vortex.Protocol.Messages.Outgoing.Rpg.Quests;
using Vortex.Rpg.Dialogues;
using Vortex.Rpg.Npcs;

namespace Vortex.Rooms.Grains.Modules;

/// <summary>
/// Talking to the zone's NPCs (spec M2a §3.3): reach (1 tile to open, 2 to choose), one dialogue per
/// player, the choice's position mapped to the content's index, the markers. What the dialogue says
/// and does is <see cref="INpcDialogues"/>'s: the room knows no content and no quest.
/// </summary>
public sealed class RoomDialogueModule(RoomGrain roomGrain, INpcDialogues dialogues) : IRoomEventListener
{
    private const int OpenReach = 1;
    private const int ChooseReach = 2;

    private readonly Dictionary<PlayerId, DialogueSession> _sessions = [];

    public async Task TalkAsync(PlayerId player, int objectId, CancellationToken ct)
    {
        if (roomGrain.NpcModule.NpcAt(objectId) is not { } npc || Avatar(player) is not { } avatar)
        {
            await SendAsync(player, new RpgQuestResultMessageComposer { Action = "talk", Code = "npc.unknown", QuestId = string.Empty });

            return;
        }

        if (npc.Dialogue is not { } dialogueId)
        {
            return;
        }

        if (Distance(avatar, npc) <= OpenReach)
        {
            await OpenAsync(player, npc, dialogueId);

            return;
        }

        if (Approach(avatar, npc) is not { } cell)
        {
            await SendAsync(player, new RpgQuestResultMessageComposer { Action = "talk", Code = "npc.too_far", QuestId = string.Empty });

            return;
        }

        await roomGrain.AvatarModule.WalkAvatarToThenAsync(
            avatar,
            cell.X,
            cell.Y,
            _ => Avatar(player) is { } there && Distance(there, npc) <= OpenReach ? OpenAsync(player, npc, dialogueId) : Task.CompletedTask,
            ct
        );
    }

    public async Task ChooseAsync(PlayerId player, int position, CancellationToken ct)
    {
        if (!_sessions.TryGetValue(player, out DialogueSession? session))
        {
            return;
        }

        if (roomGrain.NpcModule.NpcAt(session.NpcObjectId) is not { } npc || Avatar(player) is not { } avatar || Distance(avatar, npc) > ChooseReach)
        {
            _sessions.Remove(player);
            await SendAsync(player, new RpgDialogueCloseMessageComposer());

            return;
        }

        if (position < 0 || position >= session.Shown.Choices.Length)
        {
            return;
        }

        DialogueStep step = await dialogues.ChooseAsync(Conversation(player, session.NpcId, session.DialogueId), session.Shown.NodeId, session.Shown.Choices[position].Index);

        if (step.IsIgnored)
        {
            return;
        }

        if (step.Next is { } next)
        {
            _sessions[player] = session with { Shown = next };
            await SendAsync(player, Shown(session.NpcObjectId, next));

            return;
        }

        _sessions.Remove(player);
        await SendAsync(player, new RpgDialogueCloseMessageComposer());

        if (step.Action is { } action)
        {
            await SendAsync(player, new RpgQuestResultMessageComposer { Action = action, Code = step.Code, QuestId = step.QuestId });
        }
    }

    /// <summary>What each NPC has for this player; sent on entry and whenever their quest part changes.</summary>
    public async Task SendMarkersAsync(PlayerId player)
    {
        if (roomGrain.NpcModule.Npcs.Count == 0)
        {
            return;
        }

        await SendAsync(
            player,
            new RpgNpcsMessageComposer
            {
                Npcs =
                [
                    .. roomGrain.NpcModule.Npcs.Select(npc => new RpgNpcMarker
                    {
                        ObjectId = npc.ObjectId.Value,
                        Marker = npc.Dialogue is { } d ? dialogues.Marker(Conversation(player, npc.NpcId, d)) : RpgNpcMarker.None,
                    }),
                ],
            }
        );
    }

    public Task OnRoomEventAsync(RoomEvent evt, CancellationToken ct)
    {
        if (evt is PlayerLeftEvent left)
        {
            _sessions.Remove(left.PlayerId);
        }

        return Task.CompletedTask;
    }

    private async Task OpenAsync(PlayerId player, IRoomNpc npc, string dialogueId)
    {
        if (await dialogues.OpenAsync(Conversation(player, npc.NpcId, dialogueId)) is not { } view)
        {
            return;
        }

        _sessions[player] = new DialogueSession(npc.ObjectId.Value, npc.NpcId, dialogueId, view);
        await SendAsync(player, Shown(npc.ObjectId.Value, view));
    }

    private NpcConversation Conversation(PlayerId player, string npcId, string dialogueId) =>
        new(
            player,
            roomGrain._state.Zone?.Settings.Id ?? string.Empty,
            npcId,
            dialogueId,
            QuestStates(player),
            conditions => roomGrain.ZoneTriggers.ConditionsHold(conditions, player)
        );

    private IReadOnlyDictionary<string, string> QuestStates(PlayerId player) =>
        roomGrain._state.ZoneRuntime is { } zone && RoomGrain.PartsOf(zone.Facts, player).TryGetValue(typeof(QuestZoneFacts), out ZoneFacts? part)
            ? ((QuestZoneFacts)part).States
            : ImmutableDictionary<string, string>.Empty;

    private static RpgDialogueMessageComposer Shown(int npcObjectId, DialogueNodeView view) =>
        new()
        {
            NpcObjectId = npcObjectId,
            Speaker = view.Speaker,
            Text = view.Text,
            Choices = [.. view.Choices.Select(c => new RpgDialogueChoice { Text = c.Text, Kind = c.Kind })],
        };

    private IRoomPlayer? Avatar(PlayerId player) =>
        roomGrain._state.AvatarsByPlayerId.TryGetValue(player, out RoomObjectId id)
        && roomGrain._state.AvatarsByObjectId.TryGetValue(id, out IRoomAvatar? avatar)
            ? avatar as IRoomPlayer
            : null;

    private static int Distance(IRoomAvatar a, IRoomAvatar b) => Math.Max(Math.Abs(a.X - b.X), Math.Abs(a.Y - b.Y));

    /// <summary>The free cell next to the NPC nearest the player.</summary>
    private (int X, int Y)? Approach(IRoomAvatar player, IRoomNpc npc)
    {
        RoomMapModule map = roomGrain.MapModule;

        return Enumerable
            .Range(-1, 3)
            .SelectMany(dx => Enumerable.Range(-1, 3).Select(dy => (X: npc.X + dx, Y: npc.Y + dy)))
            .Where(c => (c.X, c.Y) != (npc.X, npc.Y) && map.InBounds(c.X, c.Y) && map.IsSpawnable(map.ToIdx(c.X, c.Y)))
            .OrderBy(c => Math.Abs(c.X - player.X) + Math.Abs(c.Y - player.Y))
            .Select(c => ((int X, int Y)?)c)
            .FirstOrDefault();
    }

    private Task SendAsync(PlayerId player, IComposer composer) =>
        roomGrain._grainFactory.GetPlayerPresenceGrain(player).SendComposerAsync(composer);
}
```

(Take the namespaces of `IRoomPlayer`, `PlayerLeftEvent` and `IComposer` from `RoomTargetModule.cs`, which uses all three. If `RoomGrain.PartsOf` is private, make it `internal static`; if `ZoneTriggers.ConditionsHold` takes another list type, convert.)

In `RoomGrain.cs`: `public readonly RoomDialogueModule DialogueModule;`, built after `NpcModule` with `DialogueModule = new RoomDialogueModule(this, npcDialogues);` and registered `EventModule.Register(DialogueModule);` as `ZoneTriggers` is.

In `RoomGrain.Facts.cs`, `UpdatePlayerFactsAsync`, right after `parts[type] = facts;`:

```csharp
        // The NPC markers follow the player's own quests (spec M2a §3.3).
        if (facts is QuestZoneFacts)
        {
            await DialogueModule.SendMarkersAsync(player);
        }
```

In `RoomAvatarModule.cs`, after `await JoinFightsAsync(snapshot.PlayerId, objectId, ct);`:

```csharp
        await _roomGrain.DialogueModule.SendMarkersAsync(snapshot.PlayerId);
```

- [ ] **Step 5: Write the two handlers and their tests**

```csharp
// Vortex.PacketHandlers/Rpg/Quests/RpgNpcTalkMessageHandler.cs
/// <summary>The player talks to an NPC (spec M2a §3.1); his room answers.</summary>
public class RpgNpcTalkMessageHandler(IGrainFactory grainFactory) : IMessageHandler<RpgNpcTalkMessage>
{
    public async ValueTask HandleAsync(RpgNpcTalkMessage message, MessageContext ctx, CancellationToken ct)
    {
        if (ctx.PlayerId <= 0 || ctx.RoomId <= 0)
        {
            return;
        }

        await grainFactory.GetRoomNpcs(ctx.RoomId).TalkToNpcAsync(ctx.AsActionContext(), message.ObjectId, ct).ConfigureAwait(false);
    }
}
```

```csharp
// Vortex.PacketHandlers/Rpg/Quests/RpgDialogueChooseMessageHandler.cs
/// <summary>A dialogue choice (spec M2a §3.1); his room answers.</summary>
public class RpgDialogueChooseMessageHandler(IGrainFactory grainFactory) : IMessageHandler<RpgDialogueChooseMessage>
{
    public async ValueTask HandleAsync(RpgDialogueChooseMessage message, MessageContext ctx, CancellationToken ct)
    {
        if (ctx.PlayerId <= 0 || ctx.RoomId <= 0)
        {
            return;
        }

        await grainFactory.GetRoomNpcs(ctx.RoomId).ChooseDialogueAsync(ctx.AsActionContext(), message.Choice, ct).ConfigureAwait(false);
    }
}
```

(Usings and namespace `Vortex.PacketHandlers.Rpg.Quests` copied from `RpgDeathChoiceMessageHandler.cs`, with `Vortex.Protocol.Messages.Incoming.Rpg.Quests`.)

`Vortex.PacketHandlers.Tests/Rpg/NpcHandlersTests.cs`: copy `AutoAttackHandlerTests.cs`'s shape (its fake grain factory and `MessageContext` builder) and assert, for each handler, that a player in a room reaches `IRoomNpcs.TalkToNpcAsync` / `ChooseDialogueAsync` with the message's value, and that a context without a room (RoomId 0) reaches nothing — four facts.

`scripts/hooks/authorization-surface-baseline.json`, in alphabetical place beside the `IRoomCombat` lines:

```json
    "grain:Rooms/IRoomNpcs.cs::ChooseDialogueAsync": "actor-guard",
    "grain:Rooms/IRoomNpcs.cs::TalkToNpcAsync": "actor-guard",
```

- [ ] **Step 6: Run the tests**

Run: `dotnet test Vortex.Rooms.Tests --artifacts-path artifacts`, then `dotnet test Vortex.PacketHandlers.Tests --artifacts-path artifacts`, then `node scripts/hooks/check-authorization-surface.mjs | grep -v .worktrees`
Expected: PASS (8 new room tests, 4 new handler tests, the others unchanged); the surface check lists no `IRoomNpcs` line as NEW.

- [ ] **Step 7: Commit**

```bash
git add -- Vortex.Primitives/Rooms/Grains/IRoomNpcs.cs Vortex.Rooms/Grains/RoomGrain.Npcs.cs Vortex.Rooms/Grains/Modules/RoomDialogueModule.cs Vortex.Rooms/Grains/Modules/DialogueSession.cs Vortex.PacketHandlers/Rpg/Quests Vortex.Rooms.Tests/Zones/RoomDialogueTests.cs Vortex.PacketHandlers.Tests/Rpg/NpcHandlersTests.cs
git commit -m "PNJ : parler (en s'approchant), choisir (d'assez près), les marqueurs de chaque joueur" -- Vortex.Primitives Vortex.Rooms Vortex.Rooms.Tests Vortex.PacketHandlers Vortex.PacketHandlers.Tests scripts/hooks/authorization-surface-baseline.json
```

---

### Task 6: The quest log on the wire

**Files:**
- Create: `Vortex.Rpg.Quests/Wire/QuestLogComposer.cs`
- Modify: `Vortex.Primitives/Rpg/Quests/Grains/IQuestLogGrain.cs` (`PushLogAsync`), `Vortex.Rpg.Quests/Grains/QuestLogGrain.cs` (push on change, `PushLogAsync`)
- Create: `Vortex.Rpg.Quests/Signals/QuestLogOnEntry.cs` (bus handler), `Vortex.PacketHandlers/Rpg/Quests/RpgQuestAbandonMessageHandler.cs`
- Modify: `scripts/hooks/authorization-surface-baseline.json` if the check lists `IQuestLogGrain` methods
- Test: `Vortex.Rpg.Quests.Tests/Wire/QuestLogComposerTests.cs`, add facts to `Vortex.Database.Tests/Rpg/QuestLogGrainTests.cs`, `Vortex.PacketHandlers.Tests/Rpg/QuestAbandonHandlerTests.cs`

**Interfaces:**
- Consumes: Task 2's `RpgQuestLogMessageComposer`, `RpgQuestResultMessageComposer`; plan 1's `QuestLog` entries; `PlayerEnteredRoomEvent` (has `PlayerId`).
- Produces: `QuestLogComposer.Of(IEnumerable<QuestEntrySnapshot>, Func<string, QuestDefinition?>) : RpgQuestLogMessageComposer`; `IQuestLogGrain.PushLogAsync()`; the grain sends `RpgQuestLog` to the player after every change and on `PushLogAsync`.

- [ ] **Step 1: Write the failing tests**

```csharp
// Vortex.Rpg.Quests.Tests/Wire/QuestLogComposerTests.cs
using System.Collections.Immutable;
using System.Linq;
using FluentAssertions;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Protocol.Messages.Outgoing.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;
using Vortex.Rpg.Quests.Wire;
using Xunit;
using static Vortex.Rpg.Quests.Tests.Support.Pieces;

namespace Vortex.Rpg.Quests.Tests.Wire;

/// <summary>RpgQuestLog from the log (spec M2a §3.2): the state's name, each objective's kind and counter.</summary>
public sealed class QuestLogComposerTests
{
    private static readonly QuestDefinition Wolves = new()
    {
        Id = "quest.camp.wolves",
        Kind = "quest",
        Level = 1,
        Objectives = [Objective("kill", 3, ("monster", "monster.forest.wolf")), Objective("talk", 1, ("zone", "camp"), ("npc", "scout"))],
    };

    [Fact]
    public void AQuest_IsItsStateAndItsLines()
    {
        RpgQuestLogMessageComposer log = QuestLogComposer.Of(
            [new QuestEntrySnapshot("quest.camp.wolves", QuestStatus.Active, [2, 0])],
            id => id == Wolves.Id ? Wolves : null
        );

        RpgQuestLogEntry quest = log.Quests.Single();
        (quest.QuestId, quest.State).Should().Be(("quest.camp.wolves", "active"));
        quest.Objectives.Select(o => (o.Kind, o.Current, o.Required)).Should().Equal(("kill", 2, 3), ("talk", 0, 1));
    }

    [Fact]
    public void AQuestTheContentLost_KeepsItsCounters() =>
        QuestLogComposer.Of([new QuestEntrySnapshot("quest.gone", QuestStatus.Done, [1])], _ => null)
            .Quests.Single()
            .Objectives.Single()
            .Should()
            .Be(new RpgQuestObjectiveLine { Kind = string.Empty, Current = 1, Required = 1 });
}
```

In `QuestLogGrainTests`, the presence fake also records `SendComposerAsync` composers into a `List<object> _sent` (the args may be one composer or an array: unwrap as `RoomHarness` does), and add:

```csharp
    [Fact]
    public async Task EveryChange_SendsTheLog_AndPushSendsItOnDemand()
    {
        QuestLogGrain grain = await ActivateAsync();

        await grain.AcceptAsync(Wolves.Id);
        _sent.OfType<RpgQuestLogMessageComposer>().Should().ContainSingle().Which.Quests.Single().State.Should().Be("active");

        await grain.PushLogAsync();
        _sent.OfType<RpgQuestLogMessageComposer>().Should().HaveCount(2);
    }
```

`Vortex.PacketHandlers.Tests/Rpg/QuestAbandonHandlerTests.cs`, in the shape of `AutoAttackHandlerTests.cs`: a player's abandon reaches `IQuestLogGrain.AbandonAsync("quest.camp.wolves")` of his own player id and sends him `RpgQuestResultMessageComposer { Action = "abandoned", Code = <the grain's answer>, QuestId = "quest.camp.wolves" }` through his presence; player id 0 reaches nothing.

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts --filter "FullyQualifiedName~QuestLogComposerTests"`
Expected: build FAIL, `QuestLogComposer` not found.

- [ ] **Step 3: Write the composer builder**

```csharp
// Vortex.Rpg.Quests/Wire/QuestLogComposer.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Vortex.Primitives.Rpg.Quests;
using Vortex.Protocol.Messages.Outgoing.Rpg.Quests;
using Vortex.Rpg.Content.Definitions;

namespace Vortex.Rpg.Quests.Wire;

/// <summary>RpgQuestLog (spec M2a §3.2) from the log: a quest the content no longer has keeps its counters, kind unknown.</summary>
public static class QuestLogComposer
{
    public static RpgQuestLogMessageComposer Of(IEnumerable<QuestEntrySnapshot> entries, Func<string, QuestDefinition?> quest) =>
        new()
        {
            Quests =
            [
                .. entries.Select(e => new RpgQuestLogEntry
                {
                    QuestId = e.QuestId,
                    State = QuestCodes.Name(e.Status),
                    Objectives =
                    [
                        .. e.Progress.Select((current, i) =>
                            quest(e.QuestId)?.Objectives.ElementAtOrDefault(i) is { } o
                                ? new RpgQuestObjectiveLine { Kind = o.Kind, Current = current, Required = o.Count }
                                : new RpgQuestObjectiveLine { Kind = string.Empty, Current = current, Required = current }
                        ),
                    ],
                }),
            ],
        };
}
```

- [ ] **Step 4: Push it from the grain, on entry, and answer abandon**

`IQuestLogGrain`:

```csharp
    /// <summary>Sends the player the whole log (RpgQuestLog): on entering a zone, the client's copy is rebuilt.</summary>
    public Task PushLogAsync();
```

`QuestLogGrain`: a private `Task SendLogAsync()` that builds `QuestLogComposer.Of((await GetLogAsync()).Entries, id => content.Get<QuestDefinition>(id))` and sends it with `grains.GetPlayerPresenceGrain(_player).SendComposerAsync(…)` inside a `try`/`catch` that logs a warning (a view: its failure never undoes the change); `ChangedAsync` calls it after the save; `PushLogAsync() => SendLogAsync()`.

```csharp
// Vortex.Rpg.Quests/Signals/QuestLogOnEntry.cs
using System.Threading;
using System.Threading.Tasks;
using Orleans;
using Vortex.Events.Registry;
using Vortex.Primitives.Events;
using Vortex.Primitives.Orleans;
using Vortex.Primitives.Players;

namespace Vortex.Rpg.Quests.Signals;

/// <summary>A room entered: the player's client gets the whole quest log, as the character's state is pushed then.</summary>
public sealed class QuestLogOnEntry(IGrainFactory grains) : IEventHandler<PlayerEnteredRoomEvent>
{
    public async ValueTask HandleAsync(PlayerEnteredRoomEvent e, EventContext ctx, CancellationToken ct) =>
        await grains.GetQuestLogGrain(e.PlayerId).PushLogAsync();
}
```

(`PlayerEnteredRoomEvent.PlayerId` is what `LastZoneHandler` reads; copy its namespace.)

```csharp
// Vortex.PacketHandlers/Rpg/Quests/RpgQuestAbandonMessageHandler.cs
/// <summary>The player drops a quest (spec M2a §3.1): his own log answers, and he is told.</summary>
public class RpgQuestAbandonMessageHandler(IGrainFactory grainFactory) : IMessageHandler<RpgQuestAbandonMessage>
{
    public async ValueTask HandleAsync(RpgQuestAbandonMessage message, MessageContext ctx, CancellationToken ct)
    {
        if (ctx.PlayerId <= 0)
        {
            return;
        }

        string code = await grainFactory.GetQuestLogGrain(ctx.PlayerId).AbandonAsync(message.QuestId).ConfigureAwait(false);

        await grainFactory
            .GetPlayerPresenceGrain(ctx.PlayerId)
            .SendComposerAsync(new RpgQuestResultMessageComposer { Action = "abandoned", Code = code, QuestId = message.QuestId })
            .ConfigureAwait(false);
    }
}
```

(`ctx.PlayerId` may be an int: build the `PlayerId` the way other handlers that call `GetPlayerCharacterGrain` do — search `Vortex.PacketHandlers` for one.)

- [ ] **Step 5: Run the tests**

Run: `dotnet test Vortex.Rpg.Quests.Tests --artifacts-path artifacts`, `dotnet test Vortex.Database.Tests --artifacts-path artifacts`, `dotnet test Vortex.PacketHandlers.Tests --artifacts-path artifacts`, then `node scripts/hooks/check-authorization-surface.mjs | grep -v .worktrees`
Expected: PASS everywhere. If the surface check lists `IQuestLogGrain` methods as NEW, record them in the baseline with the gate each has: `PushLogAsync`, `CountAsync`, `RefreshHeldAsync`, `GetLogAsync`, `GetZoneFactsAsync`, `AcceptAsync`, `CompleteAsync` are server-side only ("NONE" is what the baseline writes for a grain no client reaches — look at how `IPlayerCharacterGrain` methods are recorded and do the same); `AbandonAsync` is reached by the handler with the player's own id: "controller-level".

- [ ] **Step 6: Commit**

```bash
git add -- Vortex.Rpg.Quests/Wire Vortex.Rpg.Quests/Signals/QuestLogOnEntry.cs Vortex.PacketHandlers/Rpg/Quests/RpgQuestAbandonMessageHandler.cs Vortex.Rpg.Quests.Tests/Wire Vortex.PacketHandlers.Tests/Rpg/QuestAbandonHandlerTests.cs
git commit -m "Quêtes : le journal part au client à chaque changement et à l'entrée en zone ; abandonner répond" -- Vortex.Primitives/Rpg/Quests Vortex.Rpg.Quests Vortex.Rpg.Quests.Tests Vortex.Database.Tests/Rpg/QuestLogGrainTests.cs Vortex.PacketHandlers Vortex.PacketHandlers.Tests scripts/hooks/authorization-surface-baseline.json
```

---

### Task 7: The camp's dialogues and the whole suite

**Files:**
- Create: `content/dialogue/camp_elder.json`, `content/dialogue/camp_scout.json`
- Modify: `content/texts/fr.txt`
- Modify: `Vortex.Hosting.Tests/Rpg/ContentPackInRepoTests.cs` (add `new DialogueKind()`)

- [ ] **Step 1: Write the dialogues**

```json
{
  "$schema": "../../schemas/content/dialogue.schema.json",
  "id": "dialogue.camp.elder",
  "kind": "dialogue",
  "entries": [
    {"quest": "quest.camp.wolves", "state": "ready", "node": "thanks"},
    {"quest": "quest.camp.wolves", "state": "active", "node": "waiting"},
    {"quest": "quest.camp.report", "state": "ready", "node": "report"}
  ],
  "nodes": {
    "start": {"text": "dialogue.camp.elder.start", "choices": [
      {"text": "dialogue.camp.elder.ask", "next": "offer"},
      {"text": "dialogue.camp.elder.ask_report", "next": "offer_report"},
      {"text": "dialogue.common.bye"}
    ]},
    "offer": {"text": "dialogue.camp.elder.offer", "choices": [
      {"text": "dialogue.common.accept", "accept": "quest.camp.wolves"},
      {"text": "dialogue.common.later"}
    ]},
    "waiting": {"text": "dialogue.camp.elder.waiting", "choices": [{"text": "dialogue.common.bye"}]},
    "thanks": {"text": "dialogue.camp.elder.thanks", "choices": [
      {"text": "dialogue.common.complete", "complete": "quest.camp.wolves"}
    ]},
    "offer_report": {"text": "dialogue.camp.elder.offer_report", "choices": [
      {"text": "dialogue.common.accept", "accept": "quest.camp.report"},
      {"text": "dialogue.common.later"}
    ]},
    "report": {"text": "dialogue.camp.elder.report", "choices": [
      {"text": "dialogue.common.complete", "complete": "quest.camp.report"}
    ]}
  }
}
```

```json
{
  "$schema": "../../schemas/content/dialogue.schema.json",
  "id": "dialogue.camp.scout",
  "kind": "dialogue",
  "nodes": {
    "start": {"text": "dialogue.camp.scout.start", "choices": [{"text": "dialogue.common.bye"}]}
  }
}
```

(The `ask_report` choice leads to an offer the walker hides until `quest.camp.report` is offerable — its requirement, the wolves done: the elder offers the second quest only after the first.)

Texts appended to `content/texts/fr.txt`:

```text
dialogue.camp.elder.name=Ancien du camp
dialogue.camp.elder.description=Il veille sur le camp depuis plus longtemps que quiconque.
dialogue.camp.elder.start=Bienvenue au camp, voyageur. Les temps sont durs, mais il y a toujours du travail pour qui sait se battre.
dialogue.camp.elder.ask=Avez-vous besoin d'aide ?
dialogue.camp.elder.ask_report=Et l'éclaireur ?
dialogue.camp.elder.offer=Les loups du bosquet s'approchent chaque nuit. Chassez-en trois et je saurai vous remercier.
dialogue.camp.elder.waiting=Les loups rôdent toujours. Revenez quand vous en aurez chassé trois.
dialogue.camp.elder.thanks=Vous êtes revenu, et entier. Le camp dormira mieux ce soir.
dialogue.camp.elder.offer_report=Notre éclaireur a vu quelque chose dans la clairière. Allez l'écouter, puis voyez par vous-même.
dialogue.camp.elder.report=Alors, ce puits ? Racontez-moi tout.
dialogue.camp.scout.name=Éclaireuse
dialogue.camp.scout.description=Elle connaît chaque sentier de la forêt.
dialogue.camp.scout.start=Il y a un vieux puits dans la clairière. Quelque chose y brille, au fond. Allez voir.
dialogue.common.bye=Au revoir.
dialogue.common.accept=J'accepte.
dialogue.common.later=Plus tard.
dialogue.common.complete=C'est fait.
```

- [ ] **Step 2: Extend the in-repo pack test and run the whole suite**

In `ContentPackInRepoTests.Validated()`, after the `QuestKind` entry: `new DialogueKind(),`.

Run: `dotnet test Vortex.Cloud.sln --artifacts-path artifacts`, then the hook checks `node scripts/hooks/check-architecture-walls.mjs`, `check-code-layout.mjs`, `check-inert-declarations.mjs`, and `node scripts/hooks/check-authorization-surface.mjs | grep -v .worktrees`
Expected: every test project green; the walls, layout and inert-declaration checks OK (every new composer is sent, every new message handled); no NEW authorization line of this plan.

- [ ] **Step 3: Commit**

```bash
git add -- content/dialogue
git commit -m "Contenu : les dialogues de l'Ancien et de l'éclaireuse du camp, et leurs textes" -- content Vortex.Hosting.Tests/Rpg/ContentPackInRepoTests.cs
```
