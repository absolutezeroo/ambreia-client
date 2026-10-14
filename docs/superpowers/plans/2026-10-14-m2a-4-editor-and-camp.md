# M2a-4 Map editor quest pieces and the `camp` demo zone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the map editor picks an NPC's dialogue and a quest rule's quest from the content, a zone
naming an unknown dialogue or quest does not publish, and the demo zone `camp` plays the first
quest loop end to end, on the socket and on screen.

**Architecture:** the server checks dialogue and quest references the way it already checks item
references (`ZoneRuleVocabulary` → `ZoneRuntimeRules`), and serves the dialogue ids on an editor route
beside `/api/editor/monsters`. The editor loads dialogues and quests with the monsters and offers them
in drop-down menus through one generic `contentOptions` helper. The `camp` zone is published by a new
`quests` command of the emulator's run driver, which then walks the whole loop on the game socket;
the client is checked on screen in that zone.

**Tech Stack:** C# / .NET 10 / xUnit + FluentAssertions (emulator, branch `rpg-quests-m2a`);
TypeScript / node:test (client, branch `engine-v2-baseline`); Node 24 driver (no dependency).

**Spec:** `docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md` §5, §6, §7.

## Global Constraints

- Commit by explicit path only: `git commit -m "…" -- <paths>`, after `git add -- <new paths>`; never a bare `git commit`, never `git add -A` (the owner keeps work in progress in both repositories).
- Emulator: tests with `dotnet test <project> --artifacts-path artifacts` (the owner's `Vortex.Main` may lock `bin/`); format with `dotnet csharpier format <paths>`; hooks `node scripts/hooks/check-authorization-surface.mjs`, `check-architecture-walls.mjs`, `check-code-layout.mjs`.
- Client: `pnpm check` green, its last lines shown; lint one file with `node node_modules/eslint/bin/eslint.js <file>`.
- One unit per file, one responsibility per class; `feature.ts`-style files only wire; no god class.
- Comments in English and say why; French for user-facing texts.
- The layout `vortex_map_editor_inspect_npc_xml` is the owner's: the only change is the dialogue row (approved 2026-10-14).
- No subagents: inline execution (the owner's choice).

## Review Focus

1. A zone saved while the server has no content loaded: a quest or dialogue reference is a warning (`UnresolvedReference`), never an error — Task 1 pins it.
2. A new quest rule added in the editor starts with an empty quest (`''`): the publish is refused with `UnknownQuest` until one is picked, and the editor's menu shows « — » for it — Task 1 (`''` is not in the content) and Task 3 (the menu's empty choice).
3. An NPC naming a dialogue the server no longer serves (retired or renamed): the editor still shows the id as `… (inconnu)` so it can be seen and changed — Task 3's `contentOptions` test.
4. An older server without `/api/editor/dialogues`: the editor still opens, the menus offer only the ids the zone already has — Task 3 (`loadContent` falls back to `[]`, covered by the `contentOptions` test with no served ids).
5. The driver run twice in a row: quests already done on its character would make the loop unplayable, so `quests` deletes and re-creates its own account at each run — Task 4.

---

### Task 1: The server checks dialogue and quest references (emulator)

**Files:**
- Modify: `Vortex.Primitives/Rpg/Content/IRpgContentService.cs`
- Modify: `Vortex.Rpg/Content/Import/RpgContentService.cs`
- Modify: `Vortex.WebApi.Tests/FakeRpgContentService.cs`
- Modify: `Vortex.World/ZoneRuleVocabulary.cs`
- Modify: `Vortex.World/ZoneValidator.cs:110-115`
- Modify: `Vortex.World/ZoneRuntimeRules.cs`
- Modify: `Vortex.Database.Tests/World/ShippedRules.cs`
- Test: `Vortex.Database.Tests/World/ZoneDeclaredRulesTests.cs`

**Interfaces:**
- Produces: `IRpgContentService.GetQuestIds(): IReadOnlyList<string>` and `GetDialogueIds(): IReadOnlyList<string>` (not retired); finding codes `UnknownQuest` and `UnknownDialogue` (errors).

- [ ] **Step 1: Write the failing tests** (append to `ZoneDeclaredRulesTests`; in its `Validate` helper's content proxy add the two lookups)

In `Validate`, inside the `call.Method.Name switch`, after the `GetItemIds` arm:

```csharp
                        nameof(IRpgContentService.GetQuestIds) => (IReadOnlyList<string>)
                            ["quest.camp.wolves"],
                        nameof(IRpgContentService.GetDialogueIds) => (IReadOnlyList<string>)
                            ["dialogue.camp.elder"],
```

Then the tests:

```csharp
    private static ZoneNpc Npc(string? dialogue) =>
        new()
        {
            Id = "elder",
            Template = "npc.villager",
            Cell = new ZoneCell(2, 3),
            Dialogue = dialogue,
        };

    [Fact]
    public void AQuestStateCondition_OnAnUnknownQuest_IsAnError() =>
        Codes(
                Validate(
                    Doc(
                        Trigger(ZoneTriggerType.Timer, "60") with
                        {
                            Conditions = [new QuestStateCondition("quest.nothing", "done")],
                        }
                    )
                )
            )
            .Should()
            .Equal("UnknownQuest");

    [Fact]
    public void AStartQuestAction_OnAnUnknownQuest_IsAnError() =>
        Codes(Validate(Doc(Trigger(ZoneTriggerType.Timer, "60", new StartQuestAction("quest.nothing")))))
            .Should()
            .Equal("UnknownQuest");

    [Fact]
    public void AnEmptyQuest_IsAnUnknownOne() =>
        Codes(Validate(Doc(Trigger(ZoneTriggerType.Timer, "60", new StartQuestAction("")))))
            .Should()
            .Equal("UnknownQuest");

    [Fact]
    public void AQuestStateTrigger_OnAnUnknownQuest_IsAnError() =>
        Codes(Validate(Doc(Trigger(ZoneTriggerType.QuestState, "quest.nothing"))))
            .Should()
            .Equal("UnknownQuest");

    [Fact]
    public void QuestRules_OnAKnownQuest_AreFine() =>
        Codes(
                Validate(
                    Doc(
                        Trigger(
                            ZoneTriggerType.QuestState,
                            "quest.camp.wolves",
                            new StartQuestAction("quest.camp.wolves")
                        ) with
                        {
                            Conditions = [new QuestStateCondition("quest.camp.wolves", "done")],
                        }
                    )
                )
            )
            .Should()
            .BeEmpty();

    [Fact]
    public void AQuestRule_WithoutContent_IsAWarning() =>
        Validate(
                Doc(Trigger(ZoneTriggerType.Timer, "60", new StartQuestAction("quest.camp.wolves"))),
                withContent: false
            )
            .Should()
            .Contain(f =>
                f.Code == "UnresolvedReference"
                && f.Severity == ZoneSeverity.Warning
                && f.Message.Contains("quest")
            );

    [Fact]
    public void AnNpc_WithAnUnknownDialogue_IsAnError() =>
        Validate(ZoneSamples.Minimal() with { Npcs = [Npc("dialogue.nothing")] })
            .Should()
            .ContainSingle(f =>
                f.Code == "UnknownDialogue"
                && f.Severity == ZoneSeverity.Error
                && f.ElementId == "elder"
            );

    [Fact]
    public void AnNpc_WithAKnownDialogue_OrNone_HasNoDialogueFinding() =>
        Codes(
                Validate(
                    ZoneSamples.Minimal() with
                    {
                        Npcs =
                        [
                            Npc("dialogue.camp.elder"),
                            Npc(null) with { Id = "scout", Cell = new ZoneCell(3, 3) },
                        ],
                    }
                )
            )
            .Should()
            .NotContain("UnknownDialogue");
```

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.Database.Tests --artifacts-path artifacts --filter "FullyQualifiedName~ZoneDeclaredRulesTests"`
Expected: build error — `GetQuestIds` / `GetDialogueIds` are not members of `IRpgContentService`.

- [ ] **Step 3: The content lookups**

`Vortex.Primitives/Rpg/Content/IRpgContentService.cs`, after `GetItemIds`:

```csharp
    /// <summary>The ids of the served quests, not retired: what a zone's quest rules may name.</summary>
    public IReadOnlyList<string> GetQuestIds();

    /// <summary>The ids of the served dialogues, not retired: what a zone's NPC may name, and the
    /// map editor's choice for it.</summary>
    public IReadOnlyList<string> GetDialogueIds();
```

`Vortex.Rpg/Content/Import/RpgContentService.cs`, after `GetItemIds`:

```csharp
    public IReadOnlyList<string> GetQuestIds() =>
        [.. registry.All<QuestDefinition>().Where(q => !q.Retired).Select(q => q.Id)];

    public IReadOnlyList<string> GetDialogueIds() =>
        [.. registry.All<DialogueDefinition>().Where(d => !d.Retired).Select(d => d.Id)];
```

(`QuestDefinition` and `DialogueDefinition` are in `Vortex.Rpg.Content.Definitions`, already imported for `ItemDefinition`.)

`Vortex.WebApi.Tests/FakeRpgContentService.cs`, after `GetItemIds` (read its current body first and keep it):

```csharp
    /// <summary>The wolves quest only.</summary>
    public IReadOnlyList<string> GetQuestIds() => ["quest.camp.wolves"];

    /// <summary>The elder's dialogue only: what the editor's dialogue route lists.</summary>
    public IReadOnlyList<string> GetDialogueIds() => ["dialogue.camp.elder"];
```

- [ ] **Step 4: The vocabulary and the checks**

`Vortex.World/ZoneRuleVocabulary.cs`:

```csharp
/// <summary>
/// What this server runs, as its modules declared it (spec Z1 §9): the condition and action types
/// answered, the trigger types raised beyond the room's own, and the content's items, quests and
/// dialogues — each null when no content is loaded, and its references are then not checked.
/// </summary>
internal sealed record ZoneRuleVocabulary(
    IReadOnlySet<Type> Declared,
    IReadOnlySet<ZoneTriggerType> Raised,
    IReadOnlySet<string>? Items,
    IReadOnlySet<string>? Quests,
    IReadOnlySet<string>? Dialogues
);
```

`Vortex.World/ZoneValidator.cs`, the vocabulary passed to `ZoneRuntimeRules.Check`:

```csharp
            new ZoneRuleVocabulary(
                _declared,
                _raised,
                content?.GetItemIds()?.ToHashSet(),
                content?.GetQuestIds()?.ToHashSet(),
                content?.GetDialogueIds()?.ToHashSet()
            ),
```

`Vortex.World/ZoneRuntimeRules.cs`:

1. Replace `CheckItem` with one helper for every content reference, and make the item calls use it:

```csharp
    /// <summary>An item, quest or dialogue a zone names is in the content; without content loaded
    /// it is not checked.</summary>
    private static void CheckContent(
        string owner,
        string what,
        string id,
        IReadOnlySet<string>? known,
        string code,
        List<ZoneFinding> f
    )
    {
        if (known is null)
        {
            f.Add(
                Warning(
                    "UnresolvedReference",
                    owner,
                    $"{what} '{id}' is not checked until its system exists."
                )
            );
        }
        else if (!known.Contains(id))
        {
            f.Add(Error(code, owner, $"No {what} '{id}' in the content."));
        }
    }
```

   - `case ZoneTriggerType.ItemOwned:` → `CheckContent(t.Id, "item", t.Target ?? string.Empty, v.Items, "UnknownItem", f);`
   - `case HasItemCondition item:` → `CheckContent(owner, "item", item.Item, v.Items, "UnknownItem", f);`

2. In `CheckTarget`'s switch, after the `ItemOwned` case:

```csharp
            case ZoneTriggerType.QuestState:
                CheckContent(t.Id, "quest", t.Target ?? string.Empty, v.Quests, "UnknownQuest", f);

                break;
```

3. In `CheckCondition`'s switch, after the `HasItemCondition` case:

```csharp
            case QuestStateCondition quest:
                CheckContent(owner, "quest", quest.Quest, v.Quests, "UnknownQuest", f);

                break;
```

4. In `CheckAction`'s switch, as its last case:

```csharp
            case StartQuestAction start:
                CheckContent(owner, "quest", start.Quest, v.Quests, "UnknownQuest", f);

                break;
```

5. In `Check`, after the decor interaction loop (`foreach (ZoneDecorObject o in d.Decor.Where(…))`):

```csharp
        // An NPC's dialogue is what it says when talked to (spec M2a §5): one the content does not
        // have leaves it mute, so the zone does not publish.
        foreach (ZoneNpc n in d.Npcs.Where(n => !string.IsNullOrEmpty(n.Dialogue)))
        {
            CheckContent(n.Id, "dialogue", n.Dialogue!, v.Dialogues, "UnknownDialogue", f);
        }
```

`Vortex.Database.Tests/World/ShippedRules.cs`: the quests module now ships its two rules and its
trigger — add `typeof(QuestStateCondition)` and `typeof(StartQuestAction)` to `Rules`, and
`ZoneTriggerType.QuestState` to `Triggers`. Then
`grep -rn "QuestState\|StartQuest" Vortex.Database.Tests` and update any existing test that expected
them to be inert with `ShippedRules` (they are not any more); a test that passes its own rules list
keeps its meaning.

- [ ] **Step 5: Run the tests**

Run: `dotnet test Vortex.Database.Tests --artifacts-path artifacts --filter "FullyQualifiedName~World"`
Expected: PASS, the eight new tests included.
Then `dotnet test Vortex.WebApi.Tests --artifacts-path artifacts` (the fake compiles) → PASS.

- [ ] **Step 6: Format, hooks, commit**

```bash
dotnet csharpier format Vortex.Primitives/Rpg/Content/IRpgContentService.cs Vortex.Rpg/Content/Import/RpgContentService.cs Vortex.WebApi.Tests/FakeRpgContentService.cs Vortex.World Vortex.Database.Tests/World
node scripts/hooks/check-architecture-walls.mjs && node scripts/hooks/check-code-layout.mjs
git commit -m "feat(world): a zone naming an unknown quest or dialogue does not publish" -- Vortex.Primitives/Rpg/Content/IRpgContentService.cs Vortex.Rpg/Content/Import/RpgContentService.cs Vortex.WebApi.Tests/FakeRpgContentService.cs Vortex.World/ZoneRuleVocabulary.cs Vortex.World/ZoneValidator.cs Vortex.World/ZoneRuntimeRules.cs Vortex.Database.Tests/World
```

---

### Task 2: The editor's dialogue route (emulator)

**Files:**
- Modify: `Vortex.WebApi/Hosting/WebApiEndpoints.Editor.cs` (after the `/monsters` route)
- Modify: `scripts/hooks/authorization-surface-baseline.json` (through `--update`)
- Test: `Vortex.WebApi.Tests/EditorEndpointsTests.cs`

**Interfaces:**
- Consumes: `IRpgContentService.GetDialogueIds()` (Task 1).
- Produces: `GET /api/editor/dialogues` → `["dialogue.camp.elder", …]` (JSON array of ids), capability `world.zone.edit`.

- [ ] **Step 1: Write the failing tests**

In `EveryEditorRoute_RequiresItsOwnCapability`, add the row:

```csharp
    [InlineData("GET", "/api/editor/dialogues", false)]
```

and after `TheMonsters_AreListed_WithoutTheRetiredOnes`:

```csharp
    [Fact]
    public async Task TheDialogues_AreListed_ByTheirIds()
    {
        await using WebApiTestFactory f = new();

        string body = await (
            await f.CreateAuthenticatedClient().GetAsync("/api/editor/dialogues")
        ).Content.ReadAsStringAsync();

        body.Should().Be("""["dialogue.camp.elder"]""");
    }
```

- [ ] **Step 2: Run them to see them fail**

Run: `dotnet test Vortex.WebApi.Tests --artifacts-path artifacts --filter "FullyQualifiedName~EditorEndpointsTests"`
Expected: FAIL — 404 for `/api/editor/dialogues`.

- [ ] **Step 3: The route**

After the `/monsters` route in `WebApiEndpoints.Editor.cs`:

```csharp
        // What an NPC can say (spec M2a §5): the served dialogues by id, the retired ones left out.
        // The editor names them by the content text <id>.name, as it names monsters.
        editor
            .MapGet("/dialogues", (IRpgContentService content) => TypedResults.Ok(content.GetDialogueIds()))
            .RequireCapability(Capabilities.World.ZoneEdit)
            .WithName("EditorDialoguePalette")
            .Produces<IReadOnlyList<string>>();
```

- [ ] **Step 4: Run the tests, then accept the new surface**

Run: `dotnet test Vortex.WebApi.Tests --artifacts-path artifacts --filter "FullyQualifiedName~EditorEndpointsTests"` → PASS.
Run: `node scripts/hooks/check-authorization-surface.mjs` → exit 2 naming `http:GET /dialogues … : capability`;
then `node scripts/hooks/check-authorization-surface.mjs --update` and check the baseline diff is that one line.

- [ ] **Step 5: Format and commit**

```bash
dotnet csharpier format Vortex.WebApi/Hosting/WebApiEndpoints.Editor.cs Vortex.WebApi.Tests/EditorEndpointsTests.cs
git commit -m "feat(editor): the dialogues an NPC can name, on an editor route" -- Vortex.WebApi/Hosting/WebApiEndpoints.Editor.cs Vortex.WebApi.Tests/EditorEndpointsTests.cs scripts/hooks/authorization-surface-baseline.json
```

---

### Task 3: The editor picks dialogues and quests (client)

**Files:**
- Modify: `packages/ambreia-map-editor-core/src/api/EditorApiClient.ts` (after `monsters()`)
- Create: `packages/ambreia-map-editor/src/ui/panels/contentLabels.ts`
- Create: `packages/ambreia-map-editor/src/ui/forms/QUEST_STATES.ts`
- Modify: `packages/ambreia-map-editor/src/app/EditorApp.ts` (two fields beside `monsters`)
- Modify: `packages/ambreia-map-editor/src/main.ts` (`loadBestiary` → `loadContent`)
- Modify: `packages/ambreia-map-editor/src/ui/forms/ruleFields.ts`, `ui/forms/RULE_KINDS.ts`
- Modify: `packages/ambreia-map-editor/src/ui/panels/TriggerInspectorUi.ts` (`targets()`)
- Modify: `packages/ambreia-map-editor/src/ui/panels/NpcInspectorUi.ts`
- Modify: `packages/vortex-client/src/vortex-layouts/vortex_map_editor_inspect_npc_xml.xml` (the dialogue row)
- Test: `packages/ambreia-map-editor-core/test/api.test.ts`, `packages/ambreia-map-editor/test/content-labels.test.ts`

**Interfaces:**
- Consumes: `GET /api/editor/dialogues` (Task 2); `GET /api/public/content/definitions/quest` (plan 1, objects with `id`).
- Produces: `EditorApiClient.dialogues(): Promise<string[]>`, `EditorApiClient.quests(): Promise<string[]>`; `EditorApp.dialogues`, `EditorApp.quests: readonly string[]`; `contentName(id, names): string`, `contentOptions(ids, used, names): [string, string][]`; `QUEST_STATES: readonly (readonly [string, string])[]`.

- [ ] **Step 1: Write the failing tests**

Append to `packages/ambreia-map-editor-core/test/api.test.ts`:

```ts
test('the dialogues come from the editor route, the quests from the public definitions', async () =>
{
    const seen: string[] = [];
    const api = new EditorApiClient('', async url =>
    {
        seen.push(url);

        return url.endsWith('/dialogues')
            ? new Response(JSON.stringify(['dialogue.camp.elder']))
            : new Response(JSON.stringify([{id: 'quest.camp.wolves', level: 1, objectives: [], rewards: []}]));
    });

    assert.deepEqual(await api.dialogues(), ['dialogue.camp.elder']);
    assert.deepEqual(await api.quests(), ['quest.camp.wolves']);
    assert.deepEqual(seen, ['/api/editor/dialogues', '/api/public/content/definitions/quest']);
});
```

Create `packages/ambreia-map-editor/test/content-labels.test.ts`:

```ts
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentName, contentOptions} from '../src/ui/panels/contentLabels';

const names = new Map([['quest.camp.wolves.name', 'Les loups du bosquet']]);

test('a menu names the served ids in French and keeps an id the zone still uses, flagged', () =>
{
    assert.deepEqual(contentOptions(['quest.camp.wolves', 'quest.camp.report'], ['quest.gone', '', 'quest.camp.wolves', 'quest.gone'], names), [
        ['quest.camp.wolves', 'Les loups du bosquet'],
        ['quest.camp.report', 'quest.camp.report'],
        ['quest.gone', 'quest.gone (inconnu)']
    ]);
});

test('without the server\'s list, only the ids the zone uses are offered', () =>
{
    assert.deepEqual(contentOptions([], ['dialogue.camp.elder'], names), [['dialogue.camp.elder', 'dialogue.camp.elder (inconnu)']]);
    assert.equal(contentName('quest.camp.wolves', names), 'Les loups du bosquet');
    assert.equal(contentName('quest.camp.report', names), 'quest.camp.report');
});
```

- [ ] **Step 2: Run them to see them fail**

Run (from the repo root):
`npx tsx --tsconfig packages/vortex-engine/tsconfig.json --test packages/ambreia-map-editor-core/test/api.test.ts packages/ambreia-map-editor/test/content-labels.test.ts`
Expected: FAIL — `api.dialogues is not a function`, `contentLabels` not found.

- [ ] **Step 3: The API and the labels**

`EditorApiClient.ts`, after `monsters()`:

```ts
    /** The dialogues an NPC can name, by id (M2a §5); a dialogue's name is the content text `<id>.name`. */
    dialogues(): Promise<string[]>
    {
        return this.json('GET', '/api/editor/dialogues');
    }

    /** The quests a quest rule can name: the ids of the public quest definitions (M2a §5). */
    async quests(): Promise<string[]>
    {
        return (await this.json<{id: string}[]>('GET', '/api/public/content/definitions/quest')).map(quest => quest.id);
    }
```

`packages/ambreia-map-editor/src/ui/panels/contentLabels.ts`:

```ts
/** A content id's French name (content text `<id>.name`), else its id. */
export function contentName(id: string, names: ReadonlyMap<string, string>): string
{
    return names.get(`${id}.name`) || id;
}

/**
 * A menu's choices (value, label) for content ids: the server's, by name, then any id the zone still
 * names that the server does not serve, so it can be seen and changed.
 */
export function contentOptions(ids: readonly string[], used: readonly string[], names: ReadonlyMap<string, string>): [string, string][]
{
    const served = new Set(ids);
    const options: [string, string][] = ids.map(id => [id, contentName(id, names)]);

    for(const id of new Set(used)) if(id && !served.has(id)) options.push([id, `${id} (inconnu)`]);

    return options;
}
```

`packages/ambreia-map-editor/src/ui/forms/QUEST_STATES.ts`:

```ts
/** The states a quest rule can test (the server's QuestStatus), as (value, label). */
export const QUEST_STATES: readonly (readonly [string, string])[] = [
    ['active', 'En cours'],
    ['ready', 'À rendre'],
    ['done', 'Terminée']
];
```

- [ ] **Step 4: Run the tests**

Same command as Step 2. Expected: PASS.

- [ ] **Step 5: Load them with the monsters**

`EditorApp.ts`, after `texts`:

```ts
    /** The dialogues an NPC can name (GET /api/editor/dialogues) and the quests a rule can name (M2a §5). */
    dialogues: readonly string[] = [];
    quests: readonly string[] = [];
```

`main.ts`: rename `loadBestiary` to `loadContent`, the variable `bestiary` to `content`, and load
the two lists the same way (a server without them leaves the menus to the ids the zone has):

```ts
/** What the editor names from the content, once per run: monsters, dialogues, quests, their texts. */
interface IEditorContent
{
    readonly monsters: IEditorMonster[];
    readonly texts: Map<string, string>;
    readonly dialogues: string[];
    readonly quests: string[];
}
```

```ts
/**
 * The monsters, dialogues and quests the zone can name, and their names, once per run. A server
 * without a route (or without texts) leaves its menu to the ids the zone already has, and the ids as names.
 */
async function loadContent(): Promise<IEditorContent>
{
    const missing = <T>(what: string) => (error: unknown): T[] =>
    {
        log.warn(`no ${what} list from the server — its menu offers only the ids the zone has`, error);

        return [];
    };
    const [monsters, texts, dialogues, quests] = await Promise.all([
        api.monsters().catch(missing<IEditorMonster>('monster')),
        api.texts().catch((error: unknown) =>
        {
            log.warn('no content texts — monsters, dialogues and quests show their ids', error);

            return new Map<string, string>();
        }),
        api.dialogues().catch(missing<string>('dialogue')),
        api.quests().catch(missing<string>('quest'))
    ]);

    return {monsters, texts, dialogues, quests};
}
```

and in `boot()`:

```ts
    let content: Promise<IEditorContent> | null = null;
```

```ts
            const loaded = await (content ??= loadContent());

            app.monsters = loaded.monsters;
            app.texts = loaded.texts;
            app.dialogues = loaded.dialogues;
            app.quests = loaded.quests;
```

(`IEditorContent` is declared in `main.ts` only if no other file needs it; if ESLint's one-type-per-file rule refuses it there, move it to `packages/ambreia-map-editor/src/app/IEditorContent.ts`.)

- [ ] **Step 6: The menus**

`RULE_KINDS.ts`: `QuestState` and `StartQuest` take `rpg: false` (the quests module runs them now).

`ruleFields.ts`: import `contentOptions` from `'../panels/contentLabels'` and `QUEST_STATES` from
`'./QUEST_STATES'`; beside `spawns`:

```ts
    const quests = contentOptions(app.quests, [String(r.quest ?? '')], app.texts);
```

and the two cases:

```ts
            case 'QuestState': return [choice('quest', 'Quête', quests), choice('state', 'État', QUEST_STATES)];
```

```ts
            case 'StartQuest': return [choice('quest', 'Quête', quests)];
```

`TriggerInspectorUi.ts`, `targets()`: import `contentOptions`, then before `default`:

```ts
            case 'QuestState': return [['', 'Quête ?'], ...contentOptions(this._app.quests, [this._app.world.current('triggers')?.target ?? ''], this._app.texts)];
```

`vortex_map_editor_inspect_npc_xml.xml`, the dialogue row (around line 345): replace the `<border>`
holding `<input name="npc_dialogue">` and the `<button name="npc_dialogue_choose">` by the drop-down
the animation row uses:

```xml
                    <dropmenu x="118" y="0" width="198" height="24" params="17" style="3" name="npc_dialogue" caption="${vortex.mapeditor.field.none}"/>
```

`NpcInspectorUi.ts`:
- import `ChoiceBinding` is already there; import `contentOptions` from `'./contentLabels'`;
- add a field `private readonly _dialogue: ChoiceBinding<string>;`, built in the constructor in place of the `TextBinding` for `npc_dialogue`:

```ts
        this._dialogue = new ChoiceBinding(_window, 'npc_dialogue', () => npc()?.dialogue ?? '', dialogue => set({dialogue: dialogue || null}));
```

  and pushed into `this._parts` where the `TextBinding` was;
- the loop that disables the choose buttons keeps `npc_template_choose` and `npc_look_choose` only;
- in `render()`, before `for(const part of this._parts) part.render();`:

```ts
        this._dialogue.options([['', 'Aucun'], ...contentOptions(this._app.dialogues, [npc?.dialogue ?? ''], this._app.texts)]);
```

- the class comment: dialogues are now chosen from the content; templates and looks stay typed ids.

- [ ] **Step 7: Lint, typecheck, gate**

```bash
node node_modules/eslint/bin/eslint.js packages/ambreia-map-editor/src packages/ambreia-map-editor-core/src packages/ambreia-map-editor/test packages/ambreia-map-editor-core/test
pnpm check
```

Expected: no lint error, `pnpm check` green.

- [ ] **Step 8: Commit**

```bash
git add -- packages/ambreia-map-editor/src/ui/panels/contentLabels.ts packages/ambreia-map-editor/src/ui/forms/QUEST_STATES.ts packages/ambreia-map-editor/test/content-labels.test.ts
git commit -m "feat(map-editor): an NPC's dialogue and a quest rule's quest picked from the content" -- packages/ambreia-map-editor-core/src/api/EditorApiClient.ts packages/ambreia-map-editor-core/test/api.test.ts packages/ambreia-map-editor/src packages/ambreia-map-editor/test/content-labels.test.ts packages/vortex-client/src/vortex-layouts/vortex_map_editor_inspect_npc_xml.xml
```

(If `IEditorContent.ts` was created, `git add --` it too.)

---

### Task 4: The `camp` zone and the quest loop on the socket (emulator driver)

**Files:**
- Modify: `.claude/skills/run-vortex-emulator/driver.mjs`
- Modify: `.claude/skills/run-vortex-emulator/SKILL.md` (the commands table)

**Interfaces:**
- Consumes: messages 9018–9020 out, 9032–9036 in (plan 2); `/api/editor/*` (zone save/publish); content `quest.camp.wolves`, `quest.camp.report`, `dialogue.camp.elder`, `dialogue.camp.scout`; furniture definition 3149 (`country_well`).
- Produces: `node .claude/skills/run-vortex-emulator/driver.mjs quests` (publishes `camp`, walks the loop, exit 1 on the first step that fails); `publishZone(key, doc): Promise<number>` (room id); `deleteAccount(account): string | null`.

- [ ] **Step 1: Headers, the sixth account, account deletion**

In `H`, after `rpgMonsterYell`:

```js
  // The quests (spec M2a §3): out, then in.
  rpgNpcTalk: 9018,
  rpgDialogueChoose: 9019,
  rpgQuestAbandon: 9020,
  rpgNpcs: 9032,
  rpgDialogue: 9033,
  rpgDialogueClose: 9034,
  rpgQuestLog: 9035,
  rpgQuestResult: 9036,
```

After `PLAYER_E`:

```js
// A sixth, for `quests`: deleted and made again at each run, so its character starts with no quest.
const PLAYER_F = { email: 'run-skill-f@vortex.local', password: 'RunSkill!2026' };
```

Replace `cmdCleanup` by:

```js
// Deletes a throwaway account and its players (their quests, items and grants go with them by the
// players' cascades). Answers the account id, or null when there was none.
function deleteAccount(account) {
  const id = sql(`SELECT id FROM player_accounts WHERE email='${account.email}' LIMIT 1;`);
  if (!id) return null;
  const players = `SELECT id FROM players WHERE account_id=${id}`;
  sql(`DELETE FROM security_tickets WHERE player_id IN (${players});`);
  sql(`DELETE FROM room_entry_logs WHERE player_id IN (${players});`);
  sql(`DELETE FROM players WHERE account_id=${id};`);
  sql(`DELETE FROM player_account_roles WHERE account_id=${id};`);
  sql(`DELETE FROM player_accounts WHERE id=${id};`);
  return id;
}

function cmdCleanup() {
  const id = deleteAccount(PLAYER);
  log(id ? `Deleted the throwaway account ${id} and its players.` : 'Nothing to clean up.');
}
```

- [ ] **Step 2: Publishing one zone, and the `camp` document**

After `publishCombatZones`:

```js
// Creates the zone when it is new, saves the document as a new version and publishes it; answers
// its room id. The account must hold world.zone.edit and world.zone.publish (the owner role).
async function publishZone(key, doc) {
  const base = `http://127.0.0.1:${WEBAPI}`;
  const headers = { cookie: (await webSession()).cookie };
  let r = await request(`${base}/api/editor/zones`, { method: 'POST', headers, body: JSON.stringify({ key, name: doc.settings.name }) });
  if (r.status !== 200 && r.status !== 409) die(`Zone creation ${key}: ${r.status} ${r.body}`);
  r = await request(`${base}/api/editor/zones/${key}/lock?force=true`, { method: 'POST', headers });
  if (r.status !== 200) die(`Lock ${key}: ${r.status} ${r.body}`);
  r = await request(`${base}/api/editor/zones/${key}/versions?comment=driver`, { method: 'POST', headers, body: JSON.stringify(doc) });
  if (r.status !== 200) die(`Save ${key}: ${r.status} ${r.body}`);
  const saved = JSON.parse(r.body);
  if (!saved.published) {
    r = await request(`${base}/api/editor/zones/${key}/publish/${saved.version}`, { method: 'POST', headers });
    if (r.status !== 200) die(`Publish ${key}: ${r.status} ${r.body}`);
  }
  await request(`${base}/api/editor/zones/${key}/lock`, { method: 'DELETE', headers });
  const zones = JSON.parse((await request(`${base}/api/editor/zones`, { headers })).body);
  return zones.find((z) => z.key === key).roomId;
}

// The quests' demo zone (spec M2a §6): a safe camp at the arrival with the elder, three lone wolves
// outside it, the clearing in the far corner with the scout and the old well. The well is clickable
// because an Interact trigger listens to it (CompiledZone.Interactives); being the first decor, it is
// room object 1.
function campZone() {
  const square = (x0, y0, x1, y1) => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  const wolf = (id, x, y) => ({ id, area: [{ x, y }], monster: 'monster.forest.wolf', min: 1, max: 1, respawnSeconds: 300, wanderRadius: 0, aggroRadius: 1 });
  return {
    schemaVersion: 1,
    settings: { id: 'camp', name: 'Camp' },
    floor: { width: 12, length: 12, tiles: Array.from({ length: 144 }, () => ({ height: 0, walkable: true, hole: false })), door: { x: 0, y: 6 }, doorDirection: 2 },
    entries: [
      { id: 'start', kind: 'arrival', cell: { x: 1, y: 6 } },
      { id: 'fire', kind: 'respawn', cell: { x: 2, y: 6 } },
    ],
    zones: [
      { id: 'camp', kind: 'Safe', name: 'Camp', polygon: square(0, 4, 3, 8) },
      { id: 'clearing', kind: 'Quest', name: 'Clairière', polygon: square(8, 8, 11, 11) },
    ],
    npcs: [
      { id: 'elder', template: 'npc.villager', name: 'Ancien du camp', cell: { x: 2, y: 4 }, rotation: 4, dialogue: 'dialogue.camp.elder' },
      { id: 'scout', template: 'npc.villager', name: 'Éclaireur', cell: { x: 9, y: 8 }, rotation: 6, dialogue: 'dialogue.camp.scout' },
    ],
    decor: [{ id: 'old_well', definition: 3149, class: 'country_well', x: 10, y: 10 }],
    spawns: [wolf('wolf_1', 6, 2), wolf('wolf_2', 7, 6), wolf('wolf_3', 5, 10)],
    triggers: [
      { id: 'well_look', type: 'Interact', target: 'old_well', actions: [{ kind: 'ShowDialogue', dialogue: 'Le puits est vide… mais quelque chose brille au fond.' }] },
    ],
  };
}
```

- [ ] **Step 3: The loop**

After `cmdBoss`:

```js
// The first quest loop (spec M2a §7) on the socket, in `camp`, with a fresh character: the elder's
// « ! », the wolves quest accepted, three wolves killed, signed out and back in (the log and the
// « ? » come back), handed in once; the report quest accepted, abandoned, taken again, the scout
// talked to, the clearing reached, the well looked into, handed in.
async function cmdQuests() {
  await cmdContent();
  await webSession(PLAYER);
  sql(`INSERT INTO player_account_roles (account_id, role_id)
       SELECT a.id, r.id FROM player_accounts a, roles r
       WHERE a.email='${PLAYER.email}' AND r.\`key\`='owner'
         AND NOT EXISTS (SELECT 1 FROM player_account_roles x WHERE x.account_id=a.id AND x.role_id=r.id);`);
  const room = await publishZone('camp', campZone());
  log(`Published camp (room ${room}).`);
  const gone = deleteAccount(PLAYER_F);
  if (gone) log(`Deleted the previous quests account ${gone}.`);

  let a = await enterWorld(PLAYER_F);
  let g = a.g;
  const fail = (m) => {
    g.close();
    die(m);
  };
  const until = async (test, ms) => {
    for (let t = 0; t < ms; t += 100) {
      const hit = test();
      if (hit) return hit;
      await sleep(100);
    }
    return null;
  };
  const after = (header, from) => g.frames.slice(from).filter((f) => f.header === header);
  const npcsOf = (f) => {
    const r = reader(f.body);
    return Array.from({ length: r.int() }, () => ({ objectId: r.int(), marker: r.str() }));
  };
  const dialogueOf = (f) => {
    const r = reader(f.body);
    const npc = r.int();
    const speaker = r.str();
    const text = r.str();
    return { npc, speaker, text, choices: Array.from({ length: r.int() }, () => ({ text: r.str(), kind: r.str() })) };
  };
  const logOf = (f) => {
    const r = reader(f.body);
    return Array.from({ length: r.int() }, () => {
      const questId = r.str();
      const state = r.str();
      return { questId, state, objectives: Array.from({ length: r.int() }, () => ({ kind: r.str(), current: r.int(), required: r.int() })) };
    });
  };
  const resultOf = (f) => {
    const r = reader(f.body);
    return { action: r.str(), code: r.str(), questId: r.str() };
  };
  const hitsAfter = (from) =>
    after(H.rpgCombatEvents, from).flatMap((f) => {
      const r = reader(f.body);
      return Array.from({ length: r.int() }, () => ({
        attacker: r.int(), target: r.int(), amount: r.int(), outcome: r.str(), health: r.int(), maxHealth: r.int(), killed: r.bool(),
      }));
    });
  // The quest as the latest RpgQuestLog since `from` has it, once it is in `state`.
  const questIn = (from, questId, state, ms = 8000) =>
    until(() => {
      const logs = after(H.rpgQuestLog, from);
      const q = logs.length ? logOf(logs[logs.length - 1]).find((x) => x.questId === questId) : null;
      return q && q.state === state ? q : null;
    }, ms);
  const markerOf = (from, npc, marker, ms = 8000) =>
    until(() => {
      const lists = after(H.rpgNpcs, from);
      return lists.length && npcsOf(lists[lists.length - 1]).some((n) => n.objectId === npc && n.marker === marker);
    }, ms);
  const resultFor = async (from, action) => {
    const hit = await until(() => after(H.rpgQuestResult, from).map(resultOf).find((x) => x.action === action || x.code !== 'ok'), 8000);
    if (!hit || hit.action !== action || hit.code !== 'ok') fail(`Expected ${action}/ok, got ${JSON.stringify(hit)}`);
    return hit;
  };
  const talk = async (npc) => {
    const from = g.frames.length;
    g.send(frame(H.rpgNpcTalk, npc));
    const f = await g.wait([H.rpgDialogue], from, 10000);
    if (!f) fail(`No RpgDialogue from NPC ${npc}.`);
    return dialogueOf(f);
  };
  // Picks a shown choice by its text key; answers the frame mark from before it was sent.
  const choose = (node, text) => {
    const at = node.choices.findIndex((c) => c.text === text);
    if (at < 0) fail(`No choice ${text} in ${JSON.stringify(node)}`);
    const from = g.frames.length;
    g.send(frame(H.rpgDialogueChoose, at));
    return from;
  };
  const enterCamp = async () => {
    const from = g.frames.length;
    g.send(frame(H.openFlat, room, '', -1));
    const all = await until(() => {
      const units = after(H.users, from).flatMap(usersOf);
      return units.some((u) => u.name === 'Ancien du camp') && units.some((u) => u.name === 'Éclaireur') ? units : null;
    }, 10000);
    if (!all) fail('The elder and the scout are not in the room.');
    return { from, units: all };
  };

  // 1. In the camp: two NPCs (bots), the elder offers a quest (« ! »), the log is empty.
  let { from, units } = await enterCamp();
  const elder = units.find((u) => u.name === 'Ancien du camp');
  const scout = units.find((u) => u.name === 'Éclaireur');
  if (elder.type !== 4 || scout.type !== 4) fail(`NPCs are not bots: ${JSON.stringify([elder, scout])}`);
  if (!(await markerOf(from, elder.objectId, 'available'))) fail('1. No « ! » over the elder.');
  log(`1. camp: elder ${elder.objectId} « ! », scout ${scout.objectId}`);

  // 2. The wolves quest, accepted through the dialogue.
  let node = await talk(elder.objectId);
  node = dialogueOf(await g.wait([H.rpgDialogue], choose(node, 'dialogue.camp.elder.ask'), 8000) ?? fail('2. No offer node.'));
  let mark = choose(node, 'dialogue.common.accept');
  await resultFor(mark, 'accepted');
  if (!(await g.wait([H.rpgDialogueClose], mark, 5000))) fail('2. The dialogue did not close on accept.');
  if (!(await questIn(mark, 'quest.camp.wolves', 'active'))) fail('2. The wolves quest is not active.');
  if (!(await markerOf(mark, elder.objectId, 'active'))) fail('2. The elder is not « ? » grey.');
  log('2. quest.camp.wolves accepted');

  // 3. Three wolves, one by one, from out of the camp (a death sends back to the camp: target again).
  const wolves = units.filter((u) => u.name === 'monster.forest.wolf');
  if (wolves.length !== 3) fail(`3. ${wolves.length} wolves in camp, 3 expected.`);
  for (const wolf of wolves) {
    let killed = null;
    for (let attempt = 0; attempt < 3 && !killed; attempt++) {
      g.send(frame(H.moveAvatar, 4, 6));
      await sleep(1500);
      mark = g.frames.length;
      g.send(frame(H.rpgTargetSelect, wolf.objectId));
      killed = await until(() => hitsAfter(mark).find((h) => h.target === wolf.objectId && h.killed), 45000);
    }
    if (!killed) fail(`3. Wolf ${wolf.objectId} did not die.`);
  }
  const ready = await questIn(0, 'quest.camp.wolves', 'ready', 10000);
  if (!ready || ready.objectives[0].current !== 3) fail(`3. Not ready at 3/3: ${JSON.stringify(ready)}`);
  log('3. three wolves killed, quest ready');

  // 4. Signed out and back in: the log and the elder's « ? » come back.
  g.close();
  await sleep(1500);
  a = await enterWorld(PLAYER_F);
  g = a.g;
  ({ from } = await enterCamp());
  if (!(await questIn(from, 'quest.camp.wolves', 'ready'))) fail('4. The log did not come back ready.');
  if (!(await markerOf(from, elder.objectId, 'ready'))) fail('4. No « ? » over the elder after signing in again.');
  log('4. signed in again: log and « ? » back');

  // 5. Handed in: completed once, XP, the quest done; the elder offers the report.
  g.send(frame(H.moveAvatar, 2, 5));
  await sleep(1500);
  node = await talk(elder.objectId);
  if (node.text !== 'dialogue.camp.elder.thanks') fail(`5. The elder said ${node.text}, not thanks.`);
  mark = choose(node, 'dialogue.common.complete');
  await resultFor(mark, 'completed');
  if (!(await g.wait([H.rpgProgress], mark, 5000))) fail('5. No XP after completing.');
  if (!(await questIn(mark, 'quest.camp.wolves', 'done'))) fail('5. The wolves quest is not done.');
  if (!(await markerOf(mark, elder.objectId, 'available'))) fail('5. No « ! » for the report.');
  log('5. wolves handed in: completed, XP, report offered');

  // 6. The report: accepted, abandoned, accepted again.
  const acceptReport = async () => {
    let n = await talk(elder.objectId);
    n = dialogueOf(await g.wait([H.rpgDialogue], choose(n, 'dialogue.camp.elder.ask_report'), 8000) ?? fail('6. No report offer.'));
    const m = choose(n, 'dialogue.common.accept');
    await resultFor(m, 'accepted');
    return m;
  };
  await acceptReport();
  mark = g.frames.length;
  g.send(frame(H.rpgQuestAbandon, 'quest.camp.report'));
  await resultFor(mark, 'abandoned');
  const dropped = await until(() => {
    const logs = after(H.rpgQuestLog, mark);
    return logs.length && !logOf(logs[logs.length - 1]).some((q) => q.questId === 'quest.camp.report');
  }, 5000);
  if (!dropped) fail('6. The report is still in the log after abandoning.');
  mark = await acceptReport();
  log('6. report accepted, abandoned, accepted again');

  // 7. Its three objectives: the scout, the clearing, the well.
  await talk(scout.objectId);
  g.send(frame(H.moveAvatar, 10, 9));
  await sleep(3000);
  g.send(frame(H.useFurniture, 1, 0));
  const met = await questIn(mark, 'quest.camp.report', 'ready', 10000);
  if (!met) fail(`7. The report is not ready: ${JSON.stringify(after(H.rpgQuestLog, mark).map(logOf).pop())}`);
  log('7. scout talked to, clearing reached, well looked into: report ready');

  // 8. Handed in.
  g.send(frame(H.moveAvatar, 2, 5));
  await sleep(4000);
  node = await talk(elder.objectId);
  mark = choose(node, 'dialogue.common.complete');
  await resultFor(mark, 'completed');
  if (!(await questIn(mark, 'quest.camp.report', 'done'))) fail('8. The report is not done.');
  log('8. report handed in. The first quest loop plays end to end.');
  g.close();
}
```

Register it in the commands map (`quests: cmdQuests,` after `boss`) and in the usage text
(`quests    publishes camp and plays the M2a quest loop on the socket`).

Note: if a step's wait comes back empty because the reach rule walks the player first (talking from
more than one tile away, spec §3.1), raise that step's wait before changing anything else; `talk`
already waits 10 s.

- [ ] **Step 4: Run it against a running emulator**

The emulator must run the branch `rpg-quests-m2a` with Task 1 and 2 built:
`node .claude/skills/run-vortex-emulator/driver.mjs start` (it reuses one already running), then
`node .claude/skills/run-vortex-emulator/driver.mjs quests` from PowerShell (or `MSYS_NO_PATHCONV=1` in Git Bash).
Expected: the eight numbered lines, exit 0. A failure names its step: fix the server when the server
is wrong (with a test in its project), the driver when the driver reads wrong.

- [ ] **Step 5: Document and commit**

`SKILL.md`, a row after `rules`:

```markdown
| `quests` | pushes the content, publishes `camp` (spec M2a §6: a safe camp with the elder, three lone wolves, the clearing with the scout and the old well), deletes and re-creates a sixth throwaway account (`run-skill-f@`) and plays the first quest loop (spec M2a §7): the elder's « ! », the wolves quest accepted through the dialogue, three wolves killed, signed out and back in (log and « ? » back), handed in once with XP; the report quest accepted, abandoned, taken again, the scout, the clearing and the well, handed in |
```

```bash
git commit -m "test(driver): the camp zone and the first quest loop on the socket" -- .claude/skills/run-vortex-emulator/driver.mjs .claude/skills/run-vortex-emulator/SKILL.md
```

---

### Task 5: Seen on screen (client and editor)

**Files:** none (verification); screenshots under `.claude/skills/run-vortex-client/shots/`.

- [ ] **Step 1: The editor**

With the emulator running (Task 4), `pnpm editor:web` in the background; open its URL with
`node .claude/skills/run-vortex-client/driver.mjs --url=<editor url>`; sign in as
`run-skill@vortex.local` / `RunSkill!2026` (owner role from Task 4); open `camp`:
- select the NPC `elder`: the dialogue menu shows « Ancien du camp » (or the id when the text is missing) — screenshot `editor-npc-dialogue`;
- select the trigger `well_look`, add an action « Démarrer une quête »: the menu lists the two quests by name, the sort shows no « (RPG) » — screenshot `editor-start-quest`;
- set the elder's dialogue to a typed unknown id is no longer possible; instead check a publish with an empty quest in the new action is refused with `UnknownQuest` in the findings panel — screenshot `editor-unknown-quest`; then remove the action and close without saving.

- [ ] **Step 2: The game**

`pnpm dev` in the background. A ticket that lands in `camp` (the editor's test route, as the owner account):

```bash
node -e "const b='http://127.0.0.1:8080';(async()=>{const r=await fetch(b+'/api/public/authentication/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'run-skill@vortex.local',password:'RunSkill!2026'})});const c=r.headers.get('set-cookie').split(';')[0];const t=await fetch(b+'/api/editor/zones/camp/test',{method:'POST',headers:{cookie:c}});console.log((await t.json()).ssoToken ?? '')})()"
```

Then `node .claude/skills/run-vortex-client/driver.mjs "goto http://localhost:5173/client/?sso=<ticket>" "wait 9000" "ss camp-markers" errors`
(choose the character if the character screen shows), and:
- the « ! » over the elder, the scout without a marker — `camp-markers`;
- click the elder: the dialogue with its portrait and the start choices — `camp-dialog`;
- « Avez-vous besoin d'aide ? » then « J'accepte. »: the toast and the tracker line « 0/3 », the elder's grey « ? » — `camp-accepted`;
- `key j`: the journal with the wolves quest, level and rewards — `camp-journal`.

Read every screenshot; run `errors` and `net` after each.

- [ ] **Step 3: Report and ledger**

Say what was seen, with the screenshot names, and what was not. Stop what was started for the
check (dev servers, browser; the emulator only if this session started it). Remind the owner that
the emulator branch `rpg-quests-m2a` is not merged and that the content pack was pushed to their
database by the driver.
