# M2a-3 Quests on the client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The client speaks the eight quest messages and shows them: a click on an NPC talks to it, its dialogue opens in the owner's `vortex_npc_dialog`, « ! » and « ? » float over NPCs, the HUD tracker lists the quests, the journal (J) shows the active and done ones and abandons, results come as toasts.

**Architecture:** A new feature `features/quests/`, split by responsibility from the start: one session (the wire), two small models (the log, the NPC markers), a definitions loader, pure text helpers, and one class per view (dialogue window, choice rows, marker layer, journal and each of its parts). `feature.ts` only wires. The interaction feature stops targeting NPCs through `quests/IQuests.ts` (the feature wall). Messages follow the `rpg-message` skill: protocol files in `@ambreia/protocol`, one `MessageMap`.

**Tech Stack:** TypeScript, PixiJS v8 window system (`@ambreia/ui`), node:test via tsx. Repository: `vortex-rpg-client`, branch `engine-v2-baseline`.

**Spec:** `docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md` (§3.1–3.2, §4). Plan 3 of 4; the server side (plans 1–2) is on the emulator branch `rpg-quests-m2a`.

## Global Constraints

- One class per responsibility, one interface or type per file, `feature.ts` only wires (owner's rule, memory `no-god-classes`). A subfolder of the feature never imports a sibling subfolder except its `I*.ts` (the lint wall); shared pieces sit at `features/quests/` root.
- Commit by explicit path only (`git commit -m "…" -- <paths>`, `git add -- <new paths>` first). The owner keeps work in progress staged.
- Gate: `pnpm check` green, its last lines shown. One test file: `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/<file>` from `packages/ambreia-game` (or `packages/ambreia-protocol`).
- Message ids come from `Headers.generated.ts` (already regenerated: `Incoming.RpgNpcsMessageComposer` 9032 … `Outgoing.RpgQuestAbandonMessageEvent` 9020); never a literal id.
- Parser/serializer doc comments exactly `/** Reads <X> in the order of the server's <ServerFile>. */` / `/** Writes <X> in the order of the server's <ServerParser>. */` (wire-diff pairs them by that sentence).
- Content texts (`quest.<id>.name`, `.description`, `.objective.<n>` with `%current%`/`%required%`, `dialogue.<id>.name`/`.description`, node and choice keys) come from the server's content texts, loaded at zone entry by the inventory feature into the localization; the client's own texts go in `vortex-client/src/locales/{fr,en}/quest.json`.
- Logger names `habbo.features.quests.<Unit>`. `dispose()` last, early return on `_disposed`.
- Layouts are the owner's, used as they are: `vortex_npc_dialog_xml`, `vortex_npc_choice_row_xml`, `vortex_npc_marker_xml`, `vortex_quest_xml`, `vortex_quest_tab_active_xml`, `vortex_quest_tab_done_xml`, `vortex_quest_row_xml`, `vortex_quest_completed_row_xml`, `vortex_quest_detail_header_xml`, `vortex_quest_objective_row_xml`, `vortex_quest_reward_tile_xml`, `vortex_hud_quest_row_xml`. Parts with nothing on the wire yet are hidden, never left dead.

## Review Focus

1. Markers that arrive before the room knows the NPC unit (they come through the presence, apart from the entry burst) must still show once the unit exists (Task 5: the layer keeps markers by object id and shows each when an anchor exists).
2. A dialogue left open when the zone changes must close (Task 6: `RSE_ENDED` hides it).
3. A quest whose content texts are not loaded yet must read as its id made readable, never as a raw key with `%current%` (Task 3 test `AMissingObjectiveText_FallsBackToKindAndCount`).
4. A click on an NPC must not also target it (Task 7 test in `interaction`'s new guard).
5. A refusal with a code the client has no text for must still toast something readable (Task 3 test `AnUnknownCode_ToastsTheGenericRefusal`).

---

### Task 1: The eight messages in `@ambreia/protocol`

**Files** (all under `packages/ambreia-protocol/src/`):
- Create incoming: `incoming/rpg/quests/IRpgNpcMarker.ts`, `RpgNpcsMessage.ts`, `IRpgDialogueChoice.ts`, `RpgDialogueMessage.ts`, `RpgDialogueCloseMessage.ts`, `IRpgQuestObjectiveLine.ts`, `IRpgQuestLogEntry.ts`, `RpgQuestLogMessage.ts`, `RpgQuestResultMessage.ts`
- Create parsers: `parser/rpg/quests/RpgNpcsMessageParser.ts`, `RpgDialogueMessageParser.ts`, `RpgDialogueCloseMessageParser.ts`, `RpgQuestLogMessageParser.ts`, `RpgQuestResultMessageParser.ts`
- Create outgoing: `outgoing/rpg/quests/RpgNpcTalkMessage.ts`, `RpgDialogueChooseMessage.ts`, `RpgQuestAbandonMessage.ts`; serializers `serializer/rpg/quests/RpgNpcTalkMessageSerializer.ts`, `RpgDialogueChooseMessageSerializer.ts`, `RpgQuestAbandonMessageSerializer.ts`
- Modify: `NewStyleHeaders.ts` (5 incoming, 3 outgoing, under a `// M2a NPCs, dialogue, quests (features/quests).` comment); `Headers.generated.ts` (already regenerated by `pnpm gen:headers`, commit it here)
- Test: `packages/ambreia-protocol/test/rpg-quests.test.ts`

**Interfaces:**
- Produces: `IRpgNpcMarker { objectId: number; marker: string }`; `RpgNpcsMessage(npcs: readonly IRpgNpcMarker[])`; `IRpgDialogueChoice { text: string; kind: string }`; `RpgDialogueMessage(npcObjectId, speaker, text, choices: readonly IRpgDialogueChoice[])`; `RpgDialogueCloseMessage()`; `IRpgQuestObjectiveLine { kind: string; current: number; required: number }`; `IRpgQuestLogEntry { questId: string; state: string; objectives: readonly IRpgQuestObjectiveLine[] }`; `RpgQuestLogMessage(quests: readonly IRpgQuestLogEntry[])`; `RpgQuestResultMessage(action, code, questId)`; `RpgNpcTalkMessage(objectId)`, `RpgDialogueChooseMessage(choice)`, `RpgQuestAbandonMessage(questId)`; one parser/serializer each.

- [ ] **Step 1: Write the failing test**

```ts
// packages/ambreia-protocol/test/rpg-quests.test.ts
// M2a §3.1–3.2 (docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md): each parser reads the
// fields in the order of the server's Serializers/Rpg/Quests; each serializer writes what its Parsers/Rpg/Quests reads.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgNpcsMessageParser} from '../src/parser/rpg/quests/RpgNpcsMessageParser';
import {RpgDialogueMessageParser} from '../src/parser/rpg/quests/RpgDialogueMessageParser';
import {RpgDialogueCloseMessageParser} from '../src/parser/rpg/quests/RpgDialogueCloseMessageParser';
import {RpgQuestLogMessageParser} from '../src/parser/rpg/quests/RpgQuestLogMessageParser';
import {RpgQuestResultMessageParser} from '../src/parser/rpg/quests/RpgQuestResultMessageParser';
import {RpgNpcTalkMessage} from '../src/outgoing/rpg/quests/RpgNpcTalkMessage';
import {RpgDialogueChooseMessage} from '../src/outgoing/rpg/quests/RpgDialogueChooseMessage';
import {RpgQuestAbandonMessage} from '../src/outgoing/rpg/quests/RpgQuestAbandonMessage';
import {RpgNpcTalkMessageSerializer} from '../src/serializer/rpg/quests/RpgNpcTalkMessageSerializer';
import {RpgDialogueChooseMessageSerializer} from '../src/serializer/rpg/quests/RpgDialogueChooseMessageSerializer';
import {RpgQuestAbandonMessageSerializer} from '../src/serializer/rpg/quests/RpgQuestAbandonMessageSerializer';

function wire(...values: Array<number | string | boolean>): IMessageDataWrapper & {left: () => number}
{
    let at = 0;
    const next = <T>(type: string): T =>
    {
        if(at >= values.length) throw new Error('read past the end');
        if(typeof values[at] !== type) throw new Error(`expected a ${type} at ${at}, got ${typeof values[at]}`);

        return values[at++] as T;
    };

    return {readInt: () => next<number>('number'), readString: () => next<string>('string'), readBoolean: () => next<boolean>('boolean'), left: () => values.length - at} as unknown as IMessageDataWrapper & {left: () => number};
}

test('RpgNpcs: count, then object id and marker', () =>
{
    const data = wire(2, 5, 'available', 6, '');

    assert.deepEqual(new RpgNpcsMessageParser().parse(data).npcs, [{objectId: 5, marker: 'available'}, {objectId: 6, marker: ''}]);
    assert.equal(data.left(), 0);
});

test('RpgDialogue: npc, speaker, text, then each choice; RpgDialogueClose reads nothing', () =>
{
    const data = wire(5, 'dialogue.camp.elder.name', 'dialogue.camp.elder.offer', 1, 'dialogue.common.accept', 'accept');
    const message = new RpgDialogueMessageParser().parse(data);

    assert.equal(message.npcObjectId, 5);
    assert.equal(message.speaker, 'dialogue.camp.elder.name');
    assert.equal(message.text, 'dialogue.camp.elder.offer');
    assert.deepEqual(message.choices, [{text: 'dialogue.common.accept', kind: 'accept'}]);
    assert.equal(data.left(), 0);

    const empty = wire();

    new RpgDialogueCloseMessageParser().parse(empty);
    assert.equal(empty.left(), 0);
});

test('RpgQuestLog: count, then each quest, its state and objective lines', () =>
{
    const data = wire(1, 'quest.camp.wolves', 'active', 1, 'kill', 1, 3);

    assert.deepEqual(new RpgQuestLogMessageParser().parse(data).quests, [
        {questId: 'quest.camp.wolves', state: 'active', objectives: [{kind: 'kill', current: 1, required: 3}]}
    ]);
    assert.equal(data.left(), 0);
});

test('RpgQuestResult: action, code, quest', () =>
{
    const data = wire('accepted', 'ok', 'quest.camp.wolves');
    const result = new RpgQuestResultMessageParser().parse(data);

    assert.deepEqual([result.action, result.code, result.questId], ['accepted', 'ok', 'quest.camp.wolves']);
    assert.equal(data.left(), 0);
});

test('the three sends write what the server parsers read', () =>
{
    assert.deepEqual(new RpgNpcTalkMessageSerializer().serialize(new RpgNpcTalkMessage(42)), [42]);
    assert.deepEqual(new RpgDialogueChooseMessageSerializer().serialize(new RpgDialogueChooseMessage(1)), [1]);
    assert.deepEqual(new RpgQuestAbandonMessageSerializer().serialize(new RpgQuestAbandonMessage('quest.camp.wolves')), ['quest.camp.wolves']);
});
```

- [ ] **Step 2: Run it to see it fail**

Run (from `packages/ambreia-protocol`): `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/rpg-quests.test.ts`
Expected: FAIL, the parser modules not found.

- [ ] **Step 3: Write the incoming messages**

```ts
// incoming/rpg/quests/IRpgNpcMarker.ts
/** An NPC of the zone and what it has for this player: available, ready, active, or empty (M2a §3.2). */
export interface IRpgNpcMarker
{
    readonly objectId: number;
    /** available (« ! »), ready (« ? »), active (grey « ? »), or empty. */
    readonly marker: string;
}
```

```ts
// incoming/rpg/quests/RpgNpcsMessage.ts
import type {IRpgNpcMarker} from './IRpgNpcMarker';

/** The zone's NPCs and their markers for this player: on entry, then on each quest change (M2a §3.2). */
export class RpgNpcsMessage
{
    constructor(
        readonly npcs: readonly IRpgNpcMarker[]
    ) {}
}
```

```ts
// incoming/rpg/quests/IRpgDialogueChoice.ts
/** A dialogue choice: its content text key and kind (next, accept, complete, close). */
export interface IRpgDialogueChoice
{
    readonly text: string;
    readonly kind: string;
}
```

```ts
// incoming/rpg/quests/RpgDialogueMessage.ts
import type {IRpgDialogueChoice} from './IRpgDialogueChoice';

/** The dialogue node to show (M2a §3.2): content text keys; a choice is answered by its position. */
export class RpgDialogueMessage
{
    constructor(
        readonly npcObjectId: number,
        /** `dialogue.<id>.name`. */
        readonly speaker: string,
        readonly text: string,
        readonly choices: readonly IRpgDialogueChoice[]
    ) {}
}
```

```ts
// incoming/rpg/quests/RpgDialogueCloseMessage.ts
/** The server ended the dialogue (M2a §3.2): a quest taken or handed in, the player walked away. */
export class RpgDialogueCloseMessage {}
```

```ts
// incoming/rpg/quests/IRpgQuestObjectiveLine.ts
/** An objective of a quest in the log: its kind (for its icon) and its counter. */
export interface IRpgQuestObjectiveLine
{
    readonly kind: string;
    readonly current: number;
    readonly required: number;
}
```

```ts
// incoming/rpg/quests/IRpgQuestLogEntry.ts
import type {IRpgQuestObjectiveLine} from './IRpgQuestObjectiveLine';

/** A quest of the log: active, ready or done, and its objective lines. */
export interface IRpgQuestLogEntry
{
    readonly questId: string;
    readonly state: string;
    readonly objectives: readonly IRpgQuestObjectiveLine[];
}
```

```ts
// incoming/rpg/quests/RpgQuestLogMessage.ts
import type {IRpgQuestLogEntry} from './IRpgQuestLogEntry';

/** The whole quest log: after sign-in and after every change (M2a §3.2). */
export class RpgQuestLogMessage
{
    constructor(
        readonly quests: readonly IRpgQuestLogEntry[]
    ) {}
}
```

```ts
// incoming/rpg/quests/RpgQuestResultMessage.ts
/** A quest action's answer (M2a §3.2): accepted, completed, abandoned or talk, with ok or a refusal code. */
export class RpgQuestResultMessage
{
    constructor(
        readonly action: string,
        /** `ok`, `quest.log_full`, `npc.too_far`… */
        readonly code: string,
        readonly questId: string
    ) {}
}
```

- [ ] **Step 4: Write the parsers**

```ts
// parser/rpg/quests/RpgNpcsMessageParser.ts
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgNpcMarker} from '../../../incoming/rpg/quests/IRpgNpcMarker';
import {RpgNpcsMessage} from '../../../incoming/rpg/quests/RpgNpcsMessage';
import {readCount} from '../../readCount';

/** Reads RpgNpcsMessage in the order of the server's RpgNpcsMessageComposerSerializer. */
export class RpgNpcsMessageParser implements IIncomingParser<RpgNpcsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgNpcsMessage
    {
        const count = readCount(wrapper, 6);
        const npcs: IRpgNpcMarker[] = [];

        for(let i = 0; i < count; i++) npcs.push({objectId: wrapper.readInt(), marker: wrapper.readString()});

        return new RpgNpcsMessage(npcs);
    }
}
```

```ts
// parser/rpg/quests/RpgDialogueMessageParser.ts
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgDialogueChoice} from '../../../incoming/rpg/quests/IRpgDialogueChoice';
import {RpgDialogueMessage} from '../../../incoming/rpg/quests/RpgDialogueMessage';
import {readCount} from '../../readCount';

/** Reads RpgDialogueMessage in the order of the server's RpgDialogueMessageComposerSerializer. */
export class RpgDialogueMessageParser implements IIncomingParser<RpgDialogueMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgDialogueMessage
    {
        const npcObjectId = wrapper.readInt();
        const speaker = wrapper.readString();
        const text = wrapper.readString();
        const count = readCount(wrapper, 4);
        const choices: IRpgDialogueChoice[] = [];

        for(let i = 0; i < count; i++) choices.push({text: wrapper.readString(), kind: wrapper.readString()});

        return new RpgDialogueMessage(npcObjectId, speaker, text, choices);
    }
}
```

```ts
// parser/rpg/quests/RpgDialogueCloseMessageParser.ts
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgDialogueCloseMessage} from '../../../incoming/rpg/quests/RpgDialogueCloseMessage';

/** Reads RpgDialogueCloseMessage in the order of the server's RpgDialogueCloseMessageComposerSerializer. */
export class RpgDialogueCloseMessageParser implements IIncomingParser<RpgDialogueCloseMessage>
{
    parse(_wrapper: IMessageDataWrapper): RpgDialogueCloseMessage
    {
        return new RpgDialogueCloseMessage();
    }
}
```

```ts
// parser/rpg/quests/RpgQuestLogMessageParser.ts
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgQuestLogEntry} from '../../../incoming/rpg/quests/IRpgQuestLogEntry';
import type {IRpgQuestObjectiveLine} from '../../../incoming/rpg/quests/IRpgQuestObjectiveLine';
import {RpgQuestLogMessage} from '../../../incoming/rpg/quests/RpgQuestLogMessage';
import {readCount} from '../../readCount';

/** Reads RpgQuestLogMessage in the order of the server's RpgQuestLogMessageComposerSerializer. */
export class RpgQuestLogMessageParser implements IIncomingParser<RpgQuestLogMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgQuestLogMessage
    {
        const count = readCount(wrapper, 8);
        const quests: IRpgQuestLogEntry[] = [];

        for(let i = 0; i < count; i++)
        {
            const questId = wrapper.readString();
            const state = wrapper.readString();
            const lines = readCount(wrapper, 10);
            const objectives: IRpgQuestObjectiveLine[] = [];

            for(let j = 0; j < lines; j++) objectives.push({kind: wrapper.readString(), current: wrapper.readInt(), required: wrapper.readInt()});

            quests.push({questId, state, objectives});
        }

        return new RpgQuestLogMessage(quests);
    }
}
```

```ts
// parser/rpg/quests/RpgQuestResultMessageParser.ts
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgQuestResultMessage} from '../../../incoming/rpg/quests/RpgQuestResultMessage';

/** Reads RpgQuestResultMessage in the order of the server's RpgQuestResultMessageComposerSerializer. */
export class RpgQuestResultMessageParser implements IIncomingParser<RpgQuestResultMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgQuestResultMessage
    {
        return new RpgQuestResultMessage(wrapper.readString(), wrapper.readString(), wrapper.readString());
    }
}
```

(`RpgQuestResultMessage`'s arguments are evaluated left to right: action, code, quest — the server's order.)

- [ ] **Step 5: Write the outgoing messages and serializers**

```ts
// outgoing/rpg/quests/RpgNpcTalkMessage.ts
/** Talks to an NPC (M2a §3.1): the server opens its dialogue, walking the player up first. */
export class RpgNpcTalkMessage
{
    constructor(
        readonly objectId: number
    ) {}
}
```

```ts
// outgoing/rpg/quests/RpgDialogueChooseMessage.ts
/** A choice of the dialogue last shown, by its position in that list (M2a §3.1). */
export class RpgDialogueChooseMessage
{
    constructor(
        readonly choice: number
    ) {}
}
```

```ts
// outgoing/rpg/quests/RpgQuestAbandonMessage.ts
/** Drops a quest under way (M2a §3.1). */
export class RpgQuestAbandonMessage
{
    constructor(
        readonly questId: string
    ) {}
}
```

```ts
// serializer/rpg/quests/RpgNpcTalkMessageSerializer.ts
import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgNpcTalkMessage} from '../../../outgoing/rpg/quests/RpgNpcTalkMessage';

/** Writes RpgNpcTalkMessage in the order of the server's RpgNpcTalkMessageParser. */
export class RpgNpcTalkMessageSerializer implements IOutgoingSerializer<RpgNpcTalkMessage>
{
    serialize(message: RpgNpcTalkMessage): unknown[]
    {
        return [message.objectId];
    }
}
```

```ts
// serializer/rpg/quests/RpgDialogueChooseMessageSerializer.ts
import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgDialogueChooseMessage} from '../../../outgoing/rpg/quests/RpgDialogueChooseMessage';

/** Writes RpgDialogueChooseMessage in the order of the server's RpgDialogueChooseMessageParser. */
export class RpgDialogueChooseMessageSerializer implements IOutgoingSerializer<RpgDialogueChooseMessage>
{
    serialize(message: RpgDialogueChooseMessage): unknown[]
    {
        return [message.choice];
    }
}
```

```ts
// serializer/rpg/quests/RpgQuestAbandonMessageSerializer.ts
import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgQuestAbandonMessage} from '../../../outgoing/rpg/quests/RpgQuestAbandonMessage';

/** Writes RpgQuestAbandonMessage in the order of the server's RpgQuestAbandonMessageParser. */
export class RpgQuestAbandonMessageSerializer implements IOutgoingSerializer<RpgQuestAbandonMessage>
{
    serialize(message: RpgQuestAbandonMessage): unknown[]
    {
        return [message.questId];
    }
}
```

`NewStyleHeaders.ts`: at the end of `incoming`, after `Incoming.RpgLevelUpMessageComposer` (add the comma), and at the end of `outgoing`:

```ts
        // M2a NPCs, dialogue, quests (features/quests).
        Incoming.RpgNpcsMessageComposer,
        Incoming.RpgDialogueMessageComposer,
        Incoming.RpgDialogueCloseMessageComposer,
        Incoming.RpgQuestLogMessageComposer,
        Incoming.RpgQuestResultMessageComposer
```

```ts
        // M2a NPCs, dialogue, quests (features/quests).
        Outgoing.RpgNpcTalkMessageEvent,
        Outgoing.RpgDialogueChooseMessageEvent,
        Outgoing.RpgQuestAbandonMessageEvent
```

- [ ] **Step 6: Run the test and the wire diff**

Run: `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/rpg-quests.test.ts` (from `packages/ambreia-protocol`), then from the root `node .claude/scripts/wire-diff.mjs | grep -E "Npc|Dialogue|Quest"`
Expected: PASS, 5 tests; the eight rows OK (no UNPAIRED). `served-headers` and `incoming-registered` tests will pass only once Task 2 installs the map: that is the gate at Task 2's end.

- [ ] **Step 7: Commit**

```bash
git add -- packages/ambreia-protocol/src/incoming/rpg/quests packages/ambreia-protocol/src/parser/rpg/quests packages/ambreia-protocol/src/outgoing/rpg/quests packages/ambreia-protocol/src/serializer/rpg/quests packages/ambreia-protocol/test/rpg-quests.test.ts
git commit -m "feat(protocol): the eight M2a messages, NPC markers, dialogue, quest log and results" -- packages/ambreia-protocol
```

---

### Task 2: The quests session and the feature's skeleton

**Files:**
- Create: `packages/ambreia-game/src/features/quests/IRpgQuestSessionEvents.ts`, `RpgQuestSession.ts`, `IQuests.ts`, `feature.ts`
- Modify: `packages/ambreia-game/src/features/EngineHost.ts` (slot `quests`), `features/index.ts` (import, `quests: null`, the line in `GAME_FEATURES` after `SkillsFeature`)
- Test: `packages/ambreia-game/test/quests-session.test.ts`

**Interfaces:**
- Consumes: Task 1's messages, parsers, serializers.
- Produces: `IRpgQuestSessionEvents { npcs: [RpgNpcsMessage]; dialogue: [RpgDialogueMessage]; dialogueClose: []; log: [RpgQuestLogMessage]; result: [RpgQuestResultMessage] }`; `rpgQuestMap(events)`; `RpgQuestSession { events; install(connection); talk(objectId); choose(position); abandon(questId); dispose() }`; `IQuests { isNpc(objectId: number): boolean }` (what the interaction feature reads); `host.made.quests: IQuests | null`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/ambreia-game/test/quests-session.test.ts
// M2a §3.1–3.2: the quests session installed on a fake connection, fed the server's bytes; what it announces and sends.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgQuestSession} from '../src/features/quests/RpgQuestSession';

function wire(...values: Array<number | string>): IMessageDataWrapper
{
    let at = 0;

    return {readInt: () => values[at++] as number, readString: () => values[at++] as string} as unknown as IMessageDataWrapper;
}

function connection(): {connection: IConnection; receive: (header: number, ...values: Array<number | string>) => void; sent: Array<[number, unknown[]]>}
{
    const handlers = new Map<number, (wrapper: IMessageDataWrapper) => void>();
    const sent: Array<[number, unknown[]]> = [];
    const fake = {
        handleIncoming: (header: number, _name: string, read: (wrapper: IMessageDataWrapper) => void) =>
        {
            handlers.set(header, read);

            return () => handlers.delete(header);
        },
        sendValues: (header: number, _name: string, values: unknown[]) =>
        {
            sent.push([header, values]);

            return true;
        }
    } as unknown as IConnection;

    return {connection: fake, receive: (header, ...values) => handlers.get(header)!(wire(...values)), sent};
}

test('the session announces each of the five messages', () =>
{
    const session = new RpgQuestSession();
    const net = connection();
    const heard: string[] = [];

    session.install(net.connection);
    session.events.on('npcs', m => heard.push(`npcs ${m.npcs.length}`));
    session.events.on('dialogue', m => heard.push(`dialogue ${m.text}`));
    session.events.on('dialogueClose', () => heard.push('close'));
    session.events.on('log', m => heard.push(`log ${m.quests[0].questId}`));
    session.events.on('result', m => heard.push(`result ${m.action} ${m.code}`));

    net.receive(Incoming.RpgNpcsMessageComposer, 1, 5, 'available');
    net.receive(Incoming.RpgDialogueMessageComposer, 5, 'dialogue.camp.elder.name', 't.start', 0);
    net.receive(Incoming.RpgDialogueCloseMessageComposer);
    net.receive(Incoming.RpgQuestLogMessageComposer, 1, 'quest.camp.wolves', 'active', 0);
    net.receive(Incoming.RpgQuestResultMessageComposer, 'accepted', 'ok', 'quest.camp.wolves');

    assert.deepEqual(heard, ['npcs 1', 'dialogue t.start', 'close', 'log quest.camp.wolves', 'result accepted ok']);
});

test('talk, choose and abandon go out under their headers', () =>
{
    const session = new RpgQuestSession();
    const net = connection();

    session.install(net.connection);
    session.talk(42);
    session.choose(1);
    session.abandon('quest.camp.wolves');

    assert.deepEqual(net.sent, [
        [Outgoing.RpgNpcTalkMessageEvent, [42]],
        [Outgoing.RpgDialogueChooseMessageEvent, [1]],
        [Outgoing.RpgQuestAbandonMessageEvent, ['quest.camp.wolves']]
    ]);
});
```

(If `MessageMap.send` calls another connection method than `sendValues`, copy the fake of `test/combat-sessions.test.ts`, which already works with it.)

- [ ] **Step 2: Run it to see it fail**

Run (from `packages/ambreia-game`): `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/quests-session.test.ts`
Expected: FAIL, `RpgQuestSession` not found.

- [ ] **Step 3: Write the session**

```ts
// features/quests/IRpgQuestSessionEvents.ts
import type {RpgDialogueMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgDialogueMessage';
import type {RpgNpcsMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgNpcsMessage';
import type {RpgQuestLogMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgQuestLogMessage';
import type {RpgQuestResultMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgQuestResultMessage';

/** What the quests session announces: one event per message the server sends (M2a §3.2). */
export interface IRpgQuestSessionEvents
{
    npcs: [RpgNpcsMessage];
    dialogue: [RpgDialogueMessage];
    dialogueClose: [];
    log: [RpgQuestLogMessage];
    result: [RpgQuestResultMessage];
}
```

```ts
// features/quests/RpgQuestSession.ts
import {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {Incoming, Outgoing} from '@ambreia/protocol/Headers.generated';
import {RpgNpcsMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgNpcsMessageParser';
import {RpgDialogueMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgDialogueMessageParser';
import {RpgDialogueCloseMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgDialogueCloseMessageParser';
import {RpgQuestLogMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgQuestLogMessageParser';
import {RpgQuestResultMessageParser} from '@ambreia/protocol/parser/rpg/quests/RpgQuestResultMessageParser';
import {RpgNpcTalkMessage} from '@ambreia/protocol/outgoing/rpg/quests/RpgNpcTalkMessage';
import {RpgDialogueChooseMessage} from '@ambreia/protocol/outgoing/rpg/quests/RpgDialogueChooseMessage';
import {RpgQuestAbandonMessage} from '@ambreia/protocol/outgoing/rpg/quests/RpgQuestAbandonMessage';
import {RpgNpcTalkMessageSerializer} from '@ambreia/protocol/serializer/rpg/quests/RpgNpcTalkMessageSerializer';
import {RpgDialogueChooseMessageSerializer} from '@ambreia/protocol/serializer/rpg/quests/RpgDialogueChooseMessageSerializer';
import {RpgQuestAbandonMessageSerializer} from '@ambreia/protocol/serializer/rpg/quests/RpgQuestAbandonMessageSerializer';
import type {IRpgQuestSessionEvents} from './IRpgQuestSessionEvents';

/** NPCs, dialogue and quests on the wire (M2a §3.1–3.2): each message announced, three acts sent. */
export function rpgQuestMap(events: EventEmitter<IRpgQuestSessionEvents>): MessageMap
{
    return new MessageMap()
        .incoming(Incoming.RpgNpcsMessageComposer, new RpgNpcsMessageParser(), {handle: message => events.emit('npcs', message)})
        .incoming(Incoming.RpgDialogueMessageComposer, new RpgDialogueMessageParser(), {handle: message => events.emit('dialogue', message)})
        .incoming(Incoming.RpgDialogueCloseMessageComposer, new RpgDialogueCloseMessageParser(), {handle: () => events.emit('dialogueClose')})
        .incoming(Incoming.RpgQuestLogMessageComposer, new RpgQuestLogMessageParser(), {handle: message => events.emit('log', message)})
        .incoming(Incoming.RpgQuestResultMessageComposer, new RpgQuestResultMessageParser(), {handle: message => events.emit('result', message)})
        .outgoing(RpgNpcTalkMessage, Outgoing.RpgNpcTalkMessageEvent, new RpgNpcTalkMessageSerializer())
        .outgoing(RpgDialogueChooseMessage, Outgoing.RpgDialogueChooseMessageEvent, new RpgDialogueChooseMessageSerializer())
        .outgoing(RpgQuestAbandonMessage, Outgoing.RpgQuestAbandonMessageEvent, new RpgQuestAbandonMessageSerializer());
}

/** The quests' wire: what the server says, announced; talking, choosing, abandoning, sent. */
export class RpgQuestSession
{
    readonly events = new EventEmitter<IRpgQuestSessionEvents>();
    private readonly _map: MessageMap = rpgQuestMap(this.events);
    private _connection: IConnection | null = null;
    private _uninstall: (() => void) | null = null;
    private _disposed = false;

    install(connection: IConnection): void
    {
        if(this._connection === connection) return;

        this._uninstall?.();
        this._uninstall = this._map.install(connection);
        this._connection = connection;
    }

    talk(objectId: number): void
    {
        this.send(new RpgNpcTalkMessage(objectId));
    }

    /** The position of the choice in the list last shown. */
    choose(position: number): void
    {
        this.send(new RpgDialogueChooseMessage(position));
    }

    abandon(questId: string): void
    {
        this.send(new RpgQuestAbandonMessage(questId));
    }

    private send(message: object): void
    {
        if(this._connection !== null) this._map.send(this._connection, message);
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._uninstall?.();
        this._uninstall = null;
        this._connection = null;
        this.events.removeAllListeners();
    }
}
```

```ts
// features/quests/IQuests.ts
/** What another feature reads of the quests (host.made.quests): the feature wall's one door. */
export interface IQuests
{
    /** Whether this room object is an NPC of the zone: a click talks to it instead of targeting it. */
    isNpc(objectId: number): boolean;
}
```

- [ ] **Step 4: The feature skeleton and its slot**

```ts
// features/quests/feature.ts
import {Logger} from '@ambreia/common/utils/Logger';
import type {IGameFeature} from '../GameFeature';
import {RpgQuestSession} from './RpgQuestSession';

const log = Logger.getLogger('habbo.features.quests');

/**
 * NPCs, dialogue and quests (M2a, docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md §4):
 * the session, the models and the views, wired here and nowhere else.
 */
export const QuestsFeature: IGameFeature = {
    id: 'quests',
    create: ({scope}) =>
    {
        const session = new RpgQuestSession();

        scope.own(session);

        return session;
    },
    afterAttach: async (session, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) (session as RpgQuestSession).install(connection);
        else log.warn('no game connection to serve the quests on — NPCs will not talk');
    }
};
```

(Check `chat/feature.ts` for how its `create` returns the session and `afterAttach` reads it — copy that exact shape, including how `scope.own` and the returned product interact; if `create` returning the session makes the kernel dispose it twice, return `null` and keep the session in a closure as `combat/feature.ts` does with `host.made.combat`.)

`EngineHost.ts`: `import type {IQuests} from './quests/IQuests';` and in `IEngineManagers`, after `skills`:

```ts
    /** Which room objects are NPCs (features/quests, M2a): the interaction feature does not target them. */
    quests: IQuests | null;
```

`features/index.ts`: `import {QuestsFeature} from './quests/feature';`, `quests: null` in `emptyManagers()`, and `QuestsFeature` after `SkillsFeature` in `GAME_FEATURES`.

- [ ] **Step 5: Run the test and the gate**

Run: `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/quests-session.test.ts`, then from the root `pnpm check`
Expected: PASS, 2 tests; the gate green (the protocol's served-headers test now finds the five incoming and three outgoing headers served).

- [ ] **Step 6: Commit**

```bash
git add -- packages/ambreia-game/src/features/quests packages/ambreia-game/test/quests-session.test.ts
git commit -m "feat(quests): the quests session on the wire and the feature's slot" -- packages/ambreia-game/src/features/quests packages/ambreia-game/src/features/EngineHost.ts packages/ambreia-game/src/features/index.ts packages/ambreia-game/test/quests-session.test.ts packages/ambreia-protocol/src/NewStyleHeaders.ts packages/ambreia-protocol/src/Headers.generated.ts
```

---

### Task 3: Models, definitions and texts

**Files** (under `packages/ambreia-game/src/features/quests/`):
- Create: `model/QuestLogModel.ts`, `model/NpcMarkers.ts`, `IQuestTexts.ts`, `questTexts.ts`, `objectiveIcons.ts`, `tracker/trackerLines.ts`, `results/resultToast.ts`, `definitions/IQuestDefinition.ts`, `definitions/IQuestObjectiveDefinition.ts`, `definitions/IQuestRewardDefinition.ts`, `definitions/QuestDefinitions.ts`
- Modify: `vortex-client/src/locales/fr/quest.json`, `vortex-client/src/locales/en/quest.json`
- Test: `packages/ambreia-game/test/quests-parts.test.ts`

**Interfaces:**
- Produces: `QuestLogModel { events: EventEmitter<{changed: []}>; set(entries): void; clear(): void; get entries(); active(); done(); of(questId) }`; `NpcMarkers implements IQuests { events: EventEmitter<{changed: []}>; set(npcs: readonly IRpgNpcMarker[]): void; markerOf(objectId): string | null; isNpc(objectId): boolean; get all(): ReadonlyMap<number, string>; clear() }`; `IQuestTexts = Pick<WindowBits, 'text' | 'textOr' | 'contentName'>`; `questTitle(texts, questId)`, `questDescription(texts, questId)`, `objectiveLine(texts, questId, index, line)`; `objectiveIcon(kind)`, `QUEST_READY_ICON`; `trackerLines(entries, texts): IQuestLine[]` (at most 5); `resultToast(texts, result): IToast | null`; `QuestDefinitions(fetchKind: () => Promise<unknown[]>) { load(): Promise<void>; of(questId): IQuestDefinition | null }`.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/ambreia-game/test/quests-parts.test.ts
// The quests feature's parts (features/quests/): the log, the markers, the texts, the tracker, the toasts, the definitions.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import {RpgQuestResultMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgQuestResultMessage';
import {QuestLogModel} from '../src/features/quests/model/QuestLogModel';
import {NpcMarkers} from '../src/features/quests/model/NpcMarkers';
import {objectiveLine, questTitle} from '../src/features/quests/questTexts';
import {objectiveIcon, QUEST_READY_ICON} from '../src/features/quests/objectiveIcons';
import {trackerLines} from '../src/features/quests/tracker/trackerLines';
import {resultToast} from '../src/features/quests/results/resultToast';
import {QuestDefinitions} from '../src/features/quests/definitions/QuestDefinitions';

const known: Record<string, string> = {
    'quest.camp.wolves.name': 'Les loups du bosquet',
    'quest.camp.wolves.objective.0': 'Loups des bois tués : %current%/%required%',
    'vortex.quest.ready': 'À rendre',
    'vortex.quest.result.accepted': 'Quête acceptée',
    'vortex.quest.done.banner': 'Quête terminée',
    'vortex.quest.error.quest.log_full': 'Journal plein',
    'vortex.quest.error.failed': 'Impossible'
};

const texts = {
    text: (key: string) => known[key] ?? key,
    textOr: (key: string, fallback: string) => known[key] ?? fallback,
    contentName: (key: string, id: string) => known[key] ?? id
};

const wolves = (state: string, current = 1): IRpgQuestLogEntry => ({questId: 'quest.camp.wolves', state, objectives: [{kind: 'kill', current, required: 3}]});

test('the log splits active and done, and tells its listeners', () =>
{
    const log = new QuestLogModel();
    let changes = 0;

    log.events.on('changed', () => changes++);
    log.set([wolves('active'), {questId: 'quest.old', state: 'done', objectives: []}]);

    assert.deepEqual(log.active().map(q => q.questId), ['quest.camp.wolves']);
    assert.deepEqual(log.done().map(q => q.questId), ['quest.old']);
    assert.equal(log.of('quest.old')?.state, 'done');
    assert.equal(changes, 1);
    log.clear();
    assert.equal(log.entries.length, 0);
});

test('the markers replace each other, and an NPC with an empty marker is still an NPC', () =>
{
    const markers = new NpcMarkers();

    markers.set([{objectId: 5, marker: 'available'}, {objectId: 6, marker: ''}]);
    assert.equal(markers.markerOf(5), 'available');
    assert.equal(markers.isNpc(6), true);
    assert.equal(markers.isNpc(7), false);

    markers.set([{objectId: 5, marker: 'ready'}]);
    assert.equal(markers.markerOf(5), 'ready');
    assert.equal(markers.isNpc(6), false);
});

test('an objective line fills its counts; a quest title is its content name', () =>
{
    assert.equal(objectiveLine(texts, 'quest.camp.wolves', 0, {kind: 'kill', current: 1, required: 3}), 'Loups des bois tués : 1/3');
    assert.equal(questTitle(texts, 'quest.camp.wolves'), 'Les loups du bosquet');
});

test('AMissingObjectiveText_FallsBackToKindAndCount', () =>
{
    assert.equal(objectiveLine(texts, 'quest.nope', 0, {kind: 'reach', current: 0, required: 1}), 'reach 0/1');
});

test('each kind has its icon, an unknown kind the default', () =>
{
    assert.notEqual(objectiveIcon('kill'), objectiveIcon('nope'));
    assert.ok(QUEST_READY_ICON.length > 0);
});

test('the tracker shows the first unmet objective, or « à rendre » when ready; done quests are not tracked', () =>
{
    const lines = trackerLines([wolves('active'), wolves('ready', 3), {questId: 'quest.old', state: 'done', objectives: []}], texts);

    assert.equal(lines.length, 2);
    assert.deepEqual(lines[0], {icon: objectiveIcon('kill'), title: 'Les loups du bosquet', objective: 'Loups des bois tués : 1/3', count: '1 / 3'});
    assert.deepEqual(lines[1], {icon: QUEST_READY_ICON, title: 'Les loups du bosquet', objective: 'À rendre', count: ''});
});

test('a result is a toast: success for ok, the code\'s text for a refusal', () =>
{
    assert.deepEqual(resultToast(texts, new RpgQuestResultMessage('accepted', 'ok', 'quest.camp.wolves')), {kind: 'success', title: 'Quête acceptée', text: 'Les loups du bosquet', ms: 3000});
    assert.deepEqual(resultToast(texts, new RpgQuestResultMessage('completed', 'ok', 'quest.camp.wolves'))?.title, 'Quête terminée');
    assert.deepEqual(resultToast(texts, new RpgQuestResultMessage('accepted', 'quest.log_full', 'quest.camp.wolves')), {kind: 'error', title: 'Journal plein', text: 'Les loups du bosquet', ms: 3000});
});

test('AnUnknownCode_ToastsTheGenericRefusal', () =>
{
    assert.equal(resultToast(texts, new RpgQuestResultMessage('talk', 'npc.weird', ''))?.title, 'Impossible');
});

test('the definitions load once, and a failed load is tried again', async () =>
{
    let calls = 0;
    let fail = true;
    const definitions = new QuestDefinitions(async () =>
    {
        calls++;
        if(fail) throw new Error('offline');

        return [{id: 'quest.camp.wolves', kind: 'quest', level: 2, objectives: [{kind: 'kill', count: 3}], rewards: [{kind: 'xp', amount: 120}]}];
    });

    await definitions.load();
    assert.equal(definitions.of('quest.camp.wolves'), null);
    fail = false;
    await definitions.load();
    await definitions.load();

    assert.equal(definitions.of('quest.camp.wolves')?.level, 2);
    assert.equal(calls, 2);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/quests-parts.test.ts`
Expected: FAIL, the modules not found.

- [ ] **Step 3: Write the models**

```ts
// features/quests/model/QuestLogModel.ts
import {EventEmitter} from 'eventemitter3';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';

/** The player's quest log as the server last sent it (RpgQuestLog, M2a §3.2): the whole log each time. */
export class QuestLogModel
{
    readonly events = new EventEmitter<{changed: []}>();
    private _entries: readonly IRpgQuestLogEntry[] = [];

    get entries(): readonly IRpgQuestLogEntry[]
    {
        return this._entries;
    }

    set(entries: readonly IRpgQuestLogEntry[]): void
    {
        this._entries = entries;
        this.events.emit('changed');
    }

    /** Under way: active or ready to hand in. */
    active(): IRpgQuestLogEntry[]
    {
        return this._entries.filter(entry => entry.state !== 'done');
    }

    done(): IRpgQuestLogEntry[]
    {
        return this._entries.filter(entry => entry.state === 'done');
    }

    of(questId: string): IRpgQuestLogEntry | null
    {
        return this._entries.find(entry => entry.questId === questId) ?? null;
    }

    /** A zone left: the next entry pushes the log again. */
    clear(): void
    {
        this.set([]);
    }
}
```

```ts
// features/quests/model/NpcMarkers.ts
import {EventEmitter} from 'eventemitter3';
import type {IRpgNpcMarker} from '@ambreia/protocol/incoming/rpg/quests/IRpgNpcMarker';
import type {IQuests} from '../IQuests';

/**
 * The zone's NPCs and their markers for this player (RpgNpcs, M2a §3.2), by room object id: the whole
 * list each time. Kept by id even before the room knows the unit — they come apart from its entry.
 */
export class NpcMarkers implements IQuests
{
    readonly events = new EventEmitter<{changed: []}>();
    private _byObject = new Map<number, string>();

    get all(): ReadonlyMap<number, string>
    {
        return this._byObject;
    }

    set(npcs: readonly IRpgNpcMarker[]): void
    {
        this._byObject = new Map(npcs.map(npc => [npc.objectId, npc.marker]));
        this.events.emit('changed');
    }

    markerOf(objectId: number): string | null
    {
        return this._byObject.get(objectId) ?? null;
    }

    isNpc(objectId: number): boolean
    {
        return this._byObject.has(objectId);
    }

    clear(): void
    {
        this.set([]);
    }
}
```

- [ ] **Step 4: Write the texts, icons, tracker and toasts**

```ts
// features/quests/IQuestTexts.ts
import type {WindowBits} from '../../ui/kit/WindowBits';

/** The texts the quest pieces read (WindowBits in the feature, a fake in the tests). */
export type IQuestTexts = Pick<WindowBits, 'text' | 'textOr' | 'contentName'>;
```

```ts
// features/quests/questTexts.ts
import type {IRpgQuestObjectiveLine} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestObjectiveLine';
import type {IQuestTexts} from './IQuestTexts';

/** A quest's name from the content texts, or its id made readable until they arrive. */
export function questTitle(texts: IQuestTexts, questId: string): string
{
    return texts.contentName(`${questId}.name`, questId);
}

export function questDescription(texts: IQuestTexts, questId: string): string
{
    return texts.textOr(`${questId}.description`, '');
}

/** `Loups des bois tués : 1/3`; without its text, the kind and the count. */
export function objectiveLine(texts: IQuestTexts, questId: string, index: number, line: IRpgQuestObjectiveLine): string
{
    const template = texts.textOr(`${questId}.objective.${index}`, '');

    return template.length > 0
        ? template.replace('%current%', String(line.current)).replace('%required%', String(line.required))
        : `${line.kind} ${line.current}/${line.required}`;
}
```

```ts
// features/quests/objectiveIcons.ts
const UI = 'rpg/ui-icons/';

/** A quest ready to hand in. */
export const QUEST_READY_ICON = `${UI}software_speech_bubble_question_mark_quest_return_finished_icon`;

const DEFAULT_ICON = `${UI}tools_crafting_writing_parchment_scroll_document_icon`;

const BY_KIND: Readonly<Record<string, string>> = {
    kill: `${UI}rpg_crossed_swords_duel_pvp_combat_battle_war_icon`,
    talk: `${UI}software_speech_bubble_three_dots_dialogue_icon`,
    reach: `${UI}map_markers_location_pin_big_icon`,
    interact: `${UI}emoji_hand_pointer_cursor_link_index_finger_icon`,
    collect: `${UI}map_markers_building_treasure_pot_of_gold_luck_icon`
};

/** An objective's icon by its kind; a kind the client does not know yet has the scroll. */
export function objectiveIcon(kind: string): string
{
    return BY_KIND[kind] ?? DEFAULT_ICON;
}
```

```ts
// features/quests/tracker/trackerLines.ts
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IQuestLine} from '../../hud/IHud';
import type {IQuestTexts} from '../IQuestTexts';
import {objectiveIcon, QUEST_READY_ICON} from '../objectiveIcons';
import {objectiveLine, questTitle} from '../questTexts';

const MAX_TRACKED = 5;

/** The HUD tracker's lines (M2a §4.3): the quests under way, each at its first objective not met, or « à rendre ». */
export function trackerLines(entries: readonly IRpgQuestLogEntry[], texts: IQuestTexts): IQuestLine[]
{
    return entries
        .filter(entry => entry.state !== 'done')
        .slice(0, MAX_TRACKED)
        .map(entry =>
        {
            const title = questTitle(texts, entry.questId);
            const next = entry.objectives.findIndex(line => line.current < line.required);

            if(entry.state === 'ready' || next < 0) return {icon: QUEST_READY_ICON, title, objective: texts.text('vortex.quest.ready'), count: ''};

            const line = entry.objectives[next];

            return {icon: objectiveIcon(line.kind), title, objective: objectiveLine(texts, entry.questId, next, line), count: `${line.current} / ${line.required}`};
        });
}
```

```ts
// features/quests/results/resultToast.ts
import type {RpgQuestResultMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgQuestResultMessage';
import type {IToast} from '../../hud/IToast';
import type {IQuestTexts} from '../IQuestTexts';
import {questTitle} from '../questTexts';

const TOAST_MS = 3000;

/** A quest action's answer as a toast (M2a §4.3): taken, handed in, dropped, or why not. */
export function resultToast(texts: IQuestTexts, result: RpgQuestResultMessage): IToast | null
{
    const text = result.questId.length > 0 ? questTitle(texts, result.questId) : '';

    if(result.code !== 'ok')
    {
        return {kind: 'error', title: texts.textOr(`vortex.quest.error.${result.code}`, texts.text('vortex.quest.error.failed')), text, ms: TOAST_MS};
    }

    switch(result.action)
    {
        case 'accepted': return {kind: 'success', title: texts.text('vortex.quest.result.accepted'), text, ms: TOAST_MS};
        case 'completed': return {kind: 'success', title: texts.text('vortex.quest.done.banner'), text, ms: TOAST_MS};
        case 'abandoned': return {kind: 'info', title: texts.text('vortex.quest.result.abandoned'), text, ms: TOAST_MS};
        default: return null;
    }
}
```

- [ ] **Step 5: Write the definitions**

```ts
// features/quests/definitions/IQuestObjectiveDefinition.ts
/** An objective of a quest's public definition: its kind and how many. */
export interface IQuestObjectiveDefinition
{
    readonly kind: string;
    readonly count?: number;
}
```

```ts
// features/quests/definitions/IQuestRewardDefinition.ts
/** A reward of a quest's public definition: xp {amount}, items {items: [{item, quantity}]}, or a kind the client does not draw yet. */
export interface IQuestRewardDefinition
{
    readonly kind: string;
    readonly amount?: number;
    readonly items?: readonly {item: string; quantity: number}[];
}
```

```ts
// features/quests/definitions/IQuestDefinition.ts
import type {IQuestObjectiveDefinition} from './IQuestObjectiveDefinition';
import type {IQuestRewardDefinition} from './IQuestRewardDefinition';

/** A quest as the server serves it to anyone (/api/public/content/definitions/quest, M2a §2.1). */
export interface IQuestDefinition
{
    readonly id: string;
    readonly level: number;
    readonly objectives: readonly IQuestObjectiveDefinition[];
    readonly rewards: readonly IQuestRewardDefinition[];
}
```

```ts
// features/quests/definitions/QuestDefinitions.ts
import {Logger} from '@ambreia/common/utils/Logger';
import type {IQuestDefinition} from './IQuestDefinition';

const log = Logger.getLogger('habbo.features.quests.QuestDefinitions');

/** The quests' public definitions (level, rewards), loaded once; a load that failed is tried again next time. */
export class QuestDefinitions
{
    private _byId = new Map<string, IQuestDefinition>();
    private _loading: Promise<void> | null = null;

    constructor(private readonly _fetch: () => Promise<unknown[]>) {}

    load(): Promise<void>
    {
        return this._loading ??= (async () =>
        {
            try
            {
                const quests = await this._fetch() as IQuestDefinition[];

                this._byId = new Map(quests.map(quest => [quest.id, quest]));
            }
            catch (error)
            {
                this._loading = null;
                log.warn('the quest definitions did not load — the journal shows no level nor rewards', error);
            }
        })();
    }

    of(questId: string): IQuestDefinition | null
    {
        return this._byId.get(questId) ?? null;
    }
}
```

- [ ] **Step 6: The client's texts**

Add to `vortex-client/src/locales/fr/quest.json` (keep the file's alphabetical order):

```json
  "vortex.quest.error.failed": "Impossible pour le moment.",
  "vortex.quest.error.npc.too_far": "Ce personnage est trop loin.",
  "vortex.quest.error.npc.unknown": "Ce personnage ne répond pas.",
  "vortex.quest.error.quest.log_full": "Votre journal de quêtes est plein.",
  "vortex.quest.error.quest.not_in_log": "Cette quête n'est plus dans votre journal.",
  "vortex.quest.error.quest.not_offerable": "Cette quête ne vous est pas proposée.",
  "vortex.quest.error.quest.not_ready": "Cette quête n'est pas terminée.",
  "vortex.quest.level": "Niveau conseillé : %level%",
  "vortex.quest.result.abandoned": "Quête abandonnée",
  "vortex.quest.result.accepted": "Quête acceptée",
  "vortex.quest.reward.xp": "Expérience",
```

and to `en/quest.json`:

```json
  "vortex.quest.error.failed": "Not possible right now.",
  "vortex.quest.error.npc.too_far": "This character is too far away.",
  "vortex.quest.error.npc.unknown": "This character does not answer.",
  "vortex.quest.error.quest.log_full": "Your quest log is full.",
  "vortex.quest.error.quest.not_in_log": "This quest is no longer in your log.",
  "vortex.quest.error.quest.not_offerable": "This quest is not offered to you.",
  "vortex.quest.error.quest.not_ready": "This quest is not finished.",
  "vortex.quest.level": "Recommended level: %level%",
  "vortex.quest.result.abandoned": "Quest abandoned",
  "vortex.quest.result.accepted": "Quest accepted",
  "vortex.quest.reward.xp": "Experience",
```

(Check `vortex.quest.ready` exists in both files — it does in fr; add it to en if missing: `"Ready to hand in"`.)

- [ ] **Step 7: Run the tests**

Run: `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/quests-parts.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 8: Commit**

```bash
git add -- packages/ambreia-game/src/features/quests/model packages/ambreia-game/src/features/quests/IQuestTexts.ts packages/ambreia-game/src/features/quests/questTexts.ts packages/ambreia-game/src/features/quests/objectiveIcons.ts packages/ambreia-game/src/features/quests/tracker packages/ambreia-game/src/features/quests/results packages/ambreia-game/src/features/quests/definitions packages/ambreia-game/test/quests-parts.test.ts
git commit -m "feat(quests): the log and marker models, the quest texts and icons, the tracker lines, the result toasts, the definitions" -- packages/ambreia-game/src/features/quests packages/ambreia-game/test/quests-parts.test.ts packages/vortex-client/src/locales/fr/quest.json packages/vortex-client/src/locales/en/quest.json
```

---

### Task 4: The dialogue window

**Files:**
- Create: `features/quests/dialogue/choiceIcons.ts`, `dialogue/ChoiceRows.ts`, `dialogue/DialogueWindow.ts`
- Test: add to `packages/ambreia-game/test/quests-parts.test.ts`

**Interfaces:**
- Consumes: Task 1's `RpgDialogueMessage`; `buildFrame`, `WindowBits`.
- Produces: `choiceIcon(kind): string`; `ChoiceRows(windows, bits) { fill(list: IItemListWindow, choices: readonly IRpgDialogueChoice[], procedure): void }` (row `id` = position); `DialogueWindow(windows, bits, figureOf: (objectId) => string | null, actions: {choose(position): void; closed(): void}) { get visible; show(message); hide(); dispose() }`.

- [ ] **Step 1: Write the failing test** (append to `quests-parts.test.ts`)

```ts
import {choiceIcon} from '../src/features/quests/dialogue/choiceIcons';

test('a choice\'s icon says what it does', () =>
{
    assert.notEqual(choiceIcon('accept'), choiceIcon('next'));
    assert.notEqual(choiceIcon('complete'), choiceIcon('accept'));
    assert.equal(choiceIcon('close'), choiceIcon('next'));
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/quests-parts.test.ts`
Expected: FAIL, `choiceIcons` not found.

- [ ] **Step 3: Write the icons, the rows and the window**

```ts
// features/quests/dialogue/choiceIcons.ts
const UI = 'rpg/ui-icons/';

const TALK = `${UI}software_speech_bubble_three_dots_dialogue_icon`;

const BY_KIND: Readonly<Record<string, string>> = {
    accept: `${UI}software_speech_bubble_exclaimation_mark_quest_new_icon`,
    complete: `${UI}software_speech_bubble_question_mark_quest_return_finished_icon`
};

/** A choice's icon in the dialogue (vortex_npc_choice_row_xml): a quest taken, handed in, or plain talk. */
export function choiceIcon(kind: string): string
{
    return BY_KIND[kind] ?? TALK;
}
```

```ts
// features/quests/dialogue/ChoiceRows.ts
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IRpgDialogueChoice} from '@ambreia/protocol/incoming/rpg/quests/IRpgDialogueChoice';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {choiceIcon} from './choiceIcons';

/** The dialogue's choices (choice_list), one vortex_npc_choice_row_xml each, its id its position. */
export class ChoiceRows
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    fill(list: IItemListWindow, choices: readonly IRpgDialogueChoice[], procedure: (event: WindowEvent, window: IWindow) => void): void
    {
        list.destroyListItems();

        choices.forEach((choice, position) =>
        {
            const row = this._windows.buildWidgetLayout('vortex_npc_choice_row_xml') as IWindowContainer | null;

            if(!row) return;

            row.id = position;
            this._bits.setText(row, 'choice_txt', this._bits.textOr(choice.text, choice.text));
            this._bits.setVisible(row, false, 'selected');

            const icon = row.findChildByName('choice_icon') as IStaticBitmapWrapperWindow | null;

            if(icon) icon.assetUri = choiceIcon(choice.kind);
            // A list answers its items' events itself: the row carries the window's.
            row.procedure = procedure;
            list.addListItem(row);
        });
    }
}
```

```ts
// features/quests/dialogue/DialogueWindow.ts
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {RpgDialogueMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgDialogueMessage';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {buildFrame} from '../../../ui/kit/buildFrame';
import {ChoiceRows} from './ChoiceRows';

/**
 * An NPC's dialogue (vortex_npc_dialog_xml, M2a §4.2): its portrait, name and role, what it says, the
 * choices. A choice is sent by its position; the server answers with the next node or closes it.
 * The quest box, rewards and the action button have nothing on the wire yet: hidden.
 */
export class DialogueWindow
{
    private _window: IWindowContainer | null = null;
    private readonly _rows: ChoiceRows;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _figureOf: (objectId: number) => string | null,
        private readonly _actions: {choose(position: number): void; closed(): void}
    )
    {
        this._rows = new ChoiceRows(_windows, _bits);
    }

    get visible(): boolean
    {
        return this._window?.visible ?? false;
    }

    show(message: RpgDialogueMessage): void
    {
        if(this._disposed || !this.build()) return;

        const window = this._window!;
        const figure = this._figureOf(message.npcObjectId);
        const list = window.findChildByName('choice_list') as IItemListWindow | null;

        this._bits.setText(window, 'npc_name', this._bits.textOr(message.speaker, ''));
        this._bits.setText(window, 'npc_role', this._bits.textOr(message.speaker.replace(/\.name$/, '.description'), ''));
        this._bits.setText(window, 'dialog_txt', this._bits.textOr(message.text, message.text));
        this._bits.setVisible(window, figure !== null, 'npc_image');
        if(figure) this._bits.avatar(window, 'npc_image', figure, 2, true);
        if(list) this._rows.fill(list, message.choices, this._onEvent);

        window.visible = true;
        window.activate();
    }

    hide(): void
    {
        if(this._window) this._window.visible = false;
    }

    private build(): boolean
    {
        if(this._window) return true;

        this._window = buildFrame(this._windows, 'vortex_npc_dialog_xml', this._onEvent);

        if(!this._window) return false;

        this._bits.setVisible(this._window, false, 'status_badge', 'objective_box', 'reward_list', 'action_button');

        return true;
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        if(window.name === 'header_button_close')
        {
            this.hide();
            this._actions.closed();

            return;
        }

        const row = WindowBits.ancestor(window, 'npc_choice');

        if(row) this._actions.choose(row.id);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._window?.destroy();
        this._window = null;
    }
}
```

- [ ] **Step 4: Run the tests and lint**

Run: `pnpm exec tsx --tsconfig ../vortex-engine/tsconfig.json --test test/quests-parts.test.ts`, then from the root `node node_modules/eslint/bin/eslint.js packages/ambreia-game/src/features/quests`
Expected: PASS, 10 tests; no lint error.

- [ ] **Step 5: Commit**

```bash
git add -- packages/ambreia-game/src/features/quests/dialogue
git commit -m "feat(quests): the NPC dialogue window and its choice rows" -- packages/ambreia-game/src/features/quests/dialogue packages/ambreia-game/test/quests-parts.test.ts
```

---

### Task 5: The NPC markers over the room

**Files:**
- Create: `features/quests/markers/IAnchors.ts`, `markers/markerLook.ts`, `markers/NpcMarkerLayer.ts`
- Test: add to `quests-parts.test.ts`

**Interfaces:**
- Consumes: `NpcMarkers.all`; `RoomEngine.getRpgAnchor(objectId, out)`.
- Produces: `IAnchors { getRpgAnchor(objectId: number, out: {x: number; y: number}): boolean }`; `markerLook(marker): {icon: string; dim: boolean} | null`; `NpcMarkerLayer(build: () => IWindowContainer | null, anchors: () => IAnchors | null) { set(markers: ReadonlyMap<number, string>): void; clear(); dispose() }`.

- [ ] **Step 1: Write the failing test** (append)

```ts
import {markerLook} from '../src/features/quests/markers/markerLook';

test('a marker\'s look: « ! » for a quest offered, « ? » to hand in, a dim « ? » under way, nothing otherwise', () =>
{
    assert.equal(markerLook('available')?.dim, false);
    assert.equal(markerLook('ready')?.dim, false);
    assert.equal(markerLook('active')?.dim, true);
    assert.equal(markerLook('ready')?.icon, markerLook('active')?.icon);
    assert.notEqual(markerLook('available')?.icon, markerLook('ready')?.icon);
    assert.equal(markerLook(''), null);
});
```

- [ ] **Step 2: Run it to see it fail**

Expected: FAIL, `markerLook` not found.

- [ ] **Step 3: Write the layer**

```ts
// features/quests/markers/IAnchors.ts
/** Where above a room object to draw (RoomEngine.getRpgAnchor()): false when it is not on screen. */
export interface IAnchors
{
    getRpgAnchor(objectId: number, out: {x: number; y: number}): boolean;
}
```

```ts
// features/quests/markers/markerLook.ts
const UI = 'rpg/ui-icons/';
const OFFERED = `${UI}software_speech_bubble_exclaimation_mark_quest_new_icon`;
const RETURN = `${UI}software_speech_bubble_question_mark_quest_return_finished_icon`;

/** What a marker looks like over its NPC (M2a §4.4); null: no marker. */
export function markerLook(marker: string): {icon: string; dim: boolean} | null
{
    switch(marker)
    {
        case 'available': return {icon: OFFERED, dim: false};
        case 'ready': return {icon: RETURN, dim: false};
        case 'active': return {icon: RETURN, dim: true};
        default: return null;
    }
}
```

```ts
// features/quests/markers/NpcMarkerLayer.ts
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IAnchors} from './IAnchors';
import {markerLook} from './markerLook';

/** Half the marker's width, and how far above the head anchor it floats. */
const HALF = 12;
const ABOVE = 34;
const DIM = 0.45;

/**
 * « ! » and « ? » over the zone's NPCs (vortex_npc_marker_xml, M2a §4.4), following the camera while
 * any is shown. A marker for a unit the room does not know yet waits hidden until it has an anchor.
 */
export class NpcMarkerLayer
{
    private readonly _marks = new Map<number, IWindowContainer>();
    private readonly _point = {x: 0, y: 0};
    private _frame: number | null = null;
    private _disposed = false;

    constructor(private readonly _build: () => IWindowContainer | null, private readonly _anchors: () => IAnchors | null) {}

    set(markers: ReadonlyMap<number, string>): void
    {
        for(const [objectId, mark] of this._marks)
        {
            if(markerLook(markers.get(objectId) ?? '') === null)
            {
                mark.destroy();
                this._marks.delete(objectId);
            }
        }

        for(const [objectId, marker] of markers)
        {
            const look = markerLook(marker);

            if(!look) continue;

            let mark = this._marks.get(objectId);

            if(!mark)
            {
                const built = this._build();

                if(!built) return;

                mark = built;
                mark.visible = false;
                this._marks.set(objectId, mark);
            }

            const icon = mark.findChildByName('marker_icon') as IStaticBitmapWrapperWindow | null;

            if(icon && icon.assetUri !== look.icon) icon.assetUri = look.icon;
            const talk = mark.findChildByName('talk_icon');

            if(talk) talk.visible = false;
            mark.blend = look.dim ? DIM : 1;
        }

        this.run();
    }

    clear(): void
    {
        for(const mark of this._marks.values()) mark.destroy();
        this._marks.clear();
    }

    private run(): void
    {
        if(this._frame !== null || this._disposed || this._marks.size === 0 || typeof requestAnimationFrame === 'undefined') return;

        this._frame = requestAnimationFrame(this._tick);
    }

    private readonly _tick = (): void =>
    {
        this._frame = null;

        const anchors = this._anchors();

        for(const [objectId, mark] of this._marks)
        {
            const shown = anchors !== null && anchors.getRpgAnchor(objectId, this._point);

            mark.visible = shown;
            if(!shown) continue;

            mark.x = Math.round(this._point.x - HALF);
            mark.y = Math.round(this._point.y - ABOVE);
        }

        this.run();
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        if(this._frame !== null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._frame);
        this.clear();
    }
}
```

- [ ] **Step 4: Run the tests and lint**

Run: the parts test (PASS, 11 tests) and eslint on `packages/ambreia-game/src/features/quests`.

- [ ] **Step 5: Commit**

```bash
git add -- packages/ambreia-game/src/features/quests/markers
git commit -m "feat(quests): « ! » and « ? » over the zone's NPCs, following the camera" -- packages/ambreia-game/src/features/quests/markers packages/ambreia-game/test/quests-parts.test.ts
```

---

### Task 6: Wiring the dialogue, markers, tracker, toasts and NPC clicks

**Files:**
- Modify: `features/quests/feature.ts`
- Modify: `features/interaction/feature.ts` (the NPC guard)
- Create: `features/quests/npc/NpcClicks.ts`
- Test: add to `quests-parts.test.ts`

**Interfaces:**
- Consumes: everything above; `host.made.roomEngine` (events `REOE_SELECTED`, `getRpgAnchor`), `host.made.roomSession?.sessionEvents` (`RSE_STARTED`, `RSE_ENDED`), `host.made.hud` (`update`, `toast`, events `nav`), `host.made.input` (`bind`, `onEscape`), `host.made.windowManager`, `host.made.localization`.
- Produces: `NpcClicks(isNpc, talk) { selected(objectId: number, category: number): boolean }` (true when it talked); `host.made.quests` = the `NpcMarkers`; dev hook `__ambreia.quests = {session, log, markers}`.

- [ ] **Step 1: Write the failing test** (append)

```ts
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {NpcClicks} from '../src/features/quests/npc/NpcClicks';

test('a click on an NPC talks to it; on anyone else it does nothing', () =>
{
    const talked: number[] = [];
    const clicks = new NpcClicks(id => id === 5, id => talked.push(id));

    assert.equal(clicks.selected(5, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER), true);
    assert.equal(clicks.selected(6, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER), false);
    assert.equal(clicks.selected(5, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE), false);
    assert.deepEqual(talked, [5]);
});
```

(Check the enum's member names in `@ambreia/iso/scene/object/RoomObjectCategoryEnum`; the interaction feature uses `OBJECT_CATEGORY_USER`.)

- [ ] **Step 2: Run it to see it fail**

Expected: FAIL, `NpcClicks` not found.

- [ ] **Step 3: Write `NpcClicks`**

```ts
// features/quests/npc/NpcClicks.ts
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';

/** A click on an NPC of the zone talks to it (M2a §4.2); the interaction feature does not target it. */
export class NpcClicks
{
    constructor(private readonly _isNpc: (objectId: number) => boolean, private readonly _talk: (objectId: number) => void) {}

    /** True when the click was an NPC's and it was talked to. */
    selected(objectId: number, category: number): boolean
    {
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER || !this._isNpc(objectId)) return false;

        this._talk(objectId);

        return true;
    }
}
```

- [ ] **Step 4: Wire the feature**

Replace `features/quests/feature.ts` with the wiring (no logic beyond calls and one-line callbacks):

```ts
import {Logger} from '@ambreia/common/utils/Logger';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import {WindowBits} from '../../ui/kit/WindowBits';
import type {IGameFeature} from '../GameFeature';
import {QuestDefinitions} from './definitions/QuestDefinitions';
import {DialogueWindow} from './dialogue/DialogueWindow';
import {NpcMarkerLayer} from './markers/NpcMarkerLayer';
import {NpcMarkers} from './model/NpcMarkers';
import {QuestLogModel} from './model/QuestLogModel';
import {NpcClicks} from './npc/NpcClicks';
import {resultToast} from './results/resultToast';
import {RpgQuestSession} from './RpgQuestSession';
import {trackerLines} from './tracker/trackerLines';

const log = Logger.getLogger('habbo.features.quests');

/** The room's overlay layer, under the HUD (the combat overlay's). */
const LAYER = 1;

/**
 * NPCs, dialogue and quests (M2a, docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md §4):
 * the session feeds the log and the markers; the dialogue, the markers, the tracker and the toasts
 * follow them; a click on an NPC talks to it. Wiring only: each piece is its own unit.
 */
export const QuestsFeature: IGameFeature = {
    id: 'quests',
    create: ({host, scope}) =>
    {
        const session = new RpgQuestSession();
        const questLog = new QuestLogModel();
        const markers = new NpcMarkers();
        const bits = (): WindowBits => new WindowBits(host.made.localization);
        const definitions = new QuestDefinitions(async () =>
        {
            const response = await fetch('/webapi/api/public/content/definitions/quest');

            if(!response.ok) throw new Error(`HTTP ${response.status}`);

            return await response.json() as unknown[];
        });
        let room: IRoomSession | null = null;

        host.made.quests = markers;
        scope.own(session);

        const dialogue = new DialogueWindow(host.made.windowManager!, bits(), objectId => room?.userDataManager.getUserDataByIndex(objectId)?.figure ?? null, {
            choose: position => session.choose(position),
            closed: () => log.debug('dialogue closed by the player')
        });

        scope.own(dialogue);

        const layer = new NpcMarkerLayer(() =>
        {
            const windows = host.made.windowManager;
            const desktop = windows?.getDesktop(LAYER) as IWindowContainer | null;
            const window = windows?.buildWidgetLayout('vortex_npc_marker_xml', LAYER) as IWindowContainer | null;

            if(!window || !desktop) return null;

            desktop.addChildAt(window, 0);

            return window;
        }, () => host.made.roomEngine);

        scope.own(layer);

        const on = scope.bind(session.events);

        on('log', message => questLog.set(message.quests));
        on('npcs', message => markers.set(message.npcs));
        on('dialogue', message => dialogue.show(message));
        on('dialogueClose', () => dialogue.hide());
        on('result', result =>
        {
            const toast = resultToast(bits(), result);

            if(toast) host.made.hud?.toast(toast);
        });

        scope.bind(markers.events)('changed', () => layer.set(markers.all));
        scope.bind(questLog.events)('changed', () => host.made.hud?.update({
            quests: trackerLines(questLog.entries, bits()),
            questAlert: questLog.active().some(entry => entry.state === 'ready')
        }));

        const clicks = new NpcClicks(objectId => markers.isNpc(objectId), objectId => session.talk(objectId));

        scope.bind(host.made.roomEngine?.events)(RoomEngineObjectEvent.REOE_SELECTED, (event: RoomEngineObjectEvent) => void clicks.selected(event.objectId, event.category));

        if(host.made.input) scope.add(host.made.input.onEscape('quests', () =>
        {
            if(!dialogue.visible) return false;

            dialogue.hide();

            return true;
        }));

        const sessionOn = scope.bind(host.made.roomSession?.sessionEvents);

        sessionOn(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) =>
        {
            room = event.session;
            void definitions.load();
        });
        sessionOn(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            dialogue.hide();
            markers.clear();
            layer.clear();
        });

        const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

        root.__ambreia = {...root.__ambreia, quests: {session, log: questLog, markers}};

        return session;
    },
    afterAttach: async (session, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) (session as RpgQuestSession).install(connection);
        else log.warn('no game connection to serve the quests on — NPCs will not talk');
    }
};
```

(The dev hook: copy how other features publish theirs — `scope.hook('quests', {...})` if that is the kernel's way, as `interaction` does with `scope.own(session).hook('interaction', {session})`; use that rather than writing `globalThis` by hand. `host.made.windowManager!` may be null when the feature is created: if so, build the `DialogueWindow` lazily the way `combat`'s `OverlaySlot` does, through a small slot at the feature root.)

In `features/interaction/feature.ts`, the selection handler:

```ts
        engineOn(RoomEngineObjectEvent.REOE_SELECTED, (event: RoomEngineObjectEvent) =>
        {
            // An NPC is talked to (features/quests), not targeted.
            if(event.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER && !host.made.quests?.isNpc(event.objectId)) session.select(event.objectId);
        });
```

- [ ] **Step 5: Run the tests, lint and gate**

Run: the parts test (PASS, 12 tests), eslint on `packages/ambreia-game/src/features/quests packages/ambreia-game/src/features/interaction`, then `pnpm check`.
Expected: PASS; no lint error; the gate green.

- [ ] **Step 6: Commit**

```bash
git add -- packages/ambreia-game/src/features/quests/npc
git commit -m "feat(quests): the dialogue, markers, tracker and toasts wired; a click on an NPC talks to it" -- packages/ambreia-game/src/features/quests packages/ambreia-game/src/features/interaction/feature.ts packages/ambreia-game/test/quests-parts.test.ts
```

---

### Task 7: The journal

**Files:**
- Create: `features/quests/journal/JournalTab.ts`, `journal/QuestRowsView.ts`, `journal/ObjectiveRowsView.ts`, `journal/RewardTilesView.ts`, `journal/QuestDetailView.ts`, `journal/QuestJournal.ts`
- Modify: `features/quests/feature.ts` (J, the HUD's quests button, `navOpen`, re-render on log change)
- Test: add to `quests-parts.test.ts`

**Interfaces:**
- Consumes: `QuestLogModel`, `QuestDefinitions`, the text helpers, `objectiveIcon`.
- Produces: `JournalTab = 'tab_main' | 'tab_done'`; `QuestRowsView(windows, texts) { renderActive(list, entries, selectedId, procedure); renderDone(list, entries, selectedId, procedure) }` (row `id` = index in the entries given); `ObjectiveRowsView(windows, texts) { render(list, entry) }`; `RewardTilesView(windows, texts) { render(list, definition) }`; `rewardLines(texts, definition): {name: string; value: string}[]` (pure, tested); `QuestDetailView(windows, bits) { render(tab, entry, definition, canAbandon) }`; `QuestJournal(windows, bits, log, definitions, abandon: (questId) => void) { get visible; toggle(); show(); hide(); render(); dispose() }`.

- [ ] **Step 1: Write the failing test** (append)

```ts
import {rewardLines} from '../src/features/quests/journal/RewardTilesView';

test('the rewards read as lines: experience, then each item with its quantity', () =>
{
    assert.deepEqual(rewardLines({...texts, text: (key: string) => key === 'vortex.quest.reward.xp' ? 'Expérience' : key, contentName: (_key: string, id: string) => id === 'item.weapon.rusted_sword' ? 'Épée rouillée' : id}, {
        id: 'quest.camp.wolves',
        level: 1,
        objectives: [],
        rewards: [{kind: 'xp', amount: 120}, {kind: 'items', items: [{item: 'item.weapon.rusted_sword', quantity: 1}]}, {kind: 'gold', amount: 5}]
    }), [{name: 'Expérience', value: '120'}, {name: 'Épée rouillée', value: '×1'}]);
});
```

- [ ] **Step 2: Run it to see it fail**

Expected: FAIL, `RewardTilesView` not found.

- [ ] **Step 3: Write the journal's parts**

```ts
// features/quests/journal/JournalTab.ts
/** The journal's tabs in use (M2a): the quests under way, the quests done. The side and daily tabs are hidden. */
export type JournalTab = 'tab_main' | 'tab_done';
```

```ts
// features/quests/journal/QuestRowsView.ts
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {objectiveIcon, QUEST_READY_ICON} from '../objectiveIcons';
import {questTitle} from '../questTexts';

const SELECTED = 0xffcfe3f4;
const IDLE = 0xfff2f2ec;

/** The journal's quest lists: a vortex_quest_row_xml per quest under way, a vortex_quest_completed_row_xml per quest done; a row's id is its index. */
export class QuestRowsView
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    renderActive(list: IItemListWindow, entries: readonly IRpgQuestLogEntry[], selectedId: string | null, procedure: (event: WindowEvent, window: IWindow) => void): void
    {
        list.destroyListItems();

        entries.forEach((entry, index) =>
        {
            const row = this._windows.buildWidgetLayout('vortex_quest_row_xml') as IWindowContainer | null;

            if(!row) return;

            const ready = entry.state === 'ready';
            const icon = row.findChildByName('quest_icon') as IStaticBitmapWrapperWindow | null;

            row.id = index;
            row.color = entry.questId === selectedId ? SELECTED : IDLE;
            if(icon) icon.assetUri = ready ? QUEST_READY_ICON : objectiveIcon(entry.objectives.find(o => o.current < o.required)?.kind ?? '');
            this._bits.setText(row, 'quest_title', questTitle(this._bits, entry.questId));
            this._bits.setText(row, 'quest_subtitle', ready ? this._bits.text('vortex.quest.ready') : '');
            this._bits.setVisible(row, false, 'selected', 'lock_icon', 'track_button');
            this._bits.setVisible(row, ready, 'turn_in_badge');
            row.procedure = procedure;
            list.addListItem(row);
        });
    }

    renderDone(list: IItemListWindow, entries: readonly IRpgQuestLogEntry[], selectedId: string | null, procedure: (event: WindowEvent, window: IWindow) => void): void
    {
        list.destroyListItems();

        entries.forEach((entry, index) =>
        {
            const row = this._windows.buildWidgetLayout('vortex_quest_completed_row_xml') as IWindowContainer | null;

            if(!row) return;

            row.id = index;
            row.color = entry.questId === selectedId ? SELECTED : IDLE;
            this._bits.setText(row, 'quest_title', questTitle(this._bits, entry.questId));
            // No region nor date on the wire yet.
            this._bits.setText(row, 'quest_region', '');
            this._bits.setText(row, 'completed_date', '');
            this._bits.setVisible(row, false, 'selected');
            row.procedure = procedure;
            list.addListItem(row);
        });
    }
}
```

```ts
// features/quests/journal/ObjectiveRowsView.ts
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {objectiveLine} from '../questTexts';

/** A quest's objectives (objective_list), one vortex_quest_objective_row_xml each, checked when met. */
export class ObjectiveRowsView
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    render(list: IItemListWindow, entry: IRpgQuestLogEntry): void
    {
        list.destroyListItems();

        entry.objectives.forEach((line, index) =>
        {
            const row = this._windows.buildWidgetLayout('vortex_quest_objective_row_xml') as IWindowContainer | null;

            if(!row) return;

            this._bits.setText(row, 'label', objectiveLine(this._bits, entry.questId, index, line));
            this._bits.setText(row, 'count', `${line.current}/${line.required}`);
            this._bits.setVisible(row, line.current >= line.required || entry.state === 'done', 'check_icon');
            // No points nor bar on the wire for an objective.
            this._bits.setVisible(row, false, 'progress_slot', 'points');
            list.addListItem(row);
        });
    }
}
```

```ts
// features/quests/journal/RewardTilesView.ts
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {IQuestDefinition} from '../definitions/IQuestDefinition';
import type {IQuestTexts} from '../IQuestTexts';

/** A quest's rewards as lines: experience, then each item; a kind the client does not draw yet is left out. */
export function rewardLines(texts: IQuestTexts, definition: IQuestDefinition): {name: string; value: string}[]
{
    return definition.rewards.flatMap(reward =>
    {
        if(reward.kind === 'xp') return [{name: texts.text('vortex.quest.reward.xp'), value: String(reward.amount ?? 0)}];
        if(reward.kind === 'items') return (reward.items ?? []).map(line => ({name: texts.contentName(`${line.item}.name`, line.item), value: `×${line.quantity}`}));

        return [];
    });
}

/** The rewards (reward_list), one vortex_quest_reward_tile_xml each. */
export class RewardTilesView
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    render(list: IItemListWindow, definition: IQuestDefinition | null): void
    {
        list.destroyListItems();

        for(const line of definition ? rewardLines(this._bits, definition) : [])
        {
            const tile = this._windows.buildWidgetLayout('vortex_quest_reward_tile_xml') as IWindowContainer | null;

            if(!tile) return;

            this._bits.setText(tile, 'reward_name', line.name);
            this._bits.setText(tile, 'reward_value', line.value);
            list.addListItem(tile);
        }
    }
}
```

```ts
// features/quests/journal/QuestDetailView.ts
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {IQuestDefinition} from '../definitions/IQuestDefinition';
import {questDescription, questTitle} from '../questTexts';
import {ObjectiveRowsView} from './ObjectiveRowsView';
import {RewardTilesView} from './RewardTilesView';

/**
 * The selected quest in a journal tab (detail): its header (vortex_quest_detail_header_xml, built once
 * into detail_header), objectives, rewards, and Abandon for a quest under way. Tracking, handing in
 * from the journal and the progression have nothing on the wire yet: hidden.
 */
export class QuestDetailView
{
    private readonly _objectives: ObjectiveRowsView;
    private readonly _rewards: RewardTilesView;
    private readonly _headers = new Map<IWindowContainer, IWindowContainer>();

    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits)
    {
        this._objectives = new ObjectiveRowsView(_windows, _bits);
        this._rewards = new RewardTilesView(_windows, _bits);
    }

    render(tab: IWindowContainer, entry: IRpgQuestLogEntry | null, definition: IQuestDefinition | null, canAbandon: boolean): void
    {
        this._bits.setVisible(tab, entry !== null, 'detail');
        this._bits.setVisible(tab, false, 'track_button', 'turn_in_button', 'progression_slot', 'region_filter', 'sort_menu', 'done_date');
        this._bits.setVisible(tab, entry !== null && canAbandon, 'abandon_button');

        if(!entry) return;

        const header = this.header(tab);

        if(header)
        {
            this._bits.setText(header, 'quest_title', questTitle(this._bits, entry.questId));
            this._bits.setText(header, 'quest_subtitle', definition ? this._bits.text('vortex.quest.level', 'level', String(definition.level)) : '');
            this._bits.setText(header, 'quest_desc', questDescription(this._bits, entry.questId));
            this._bits.setVisible(header, false, 'repeatable_pill', 'giver');
        }

        this._bits.setText(tab, 'summary_txt', questDescription(this._bits, entry.questId));
        this._bits.setText(tab, 'done_title', this._bits.text('vortex.quest.done.banner'));

        const objectives = tab.findChildByName('objective_list') as IItemListWindow | null;
        const rewards = tab.findChildByName('reward_list') as IItemListWindow | null;

        if(objectives) this._objectives.render(objectives, entry);
        if(rewards) this._rewards.render(rewards, definition);
    }

    private header(tab: IWindowContainer): IWindowContainer | null
    {
        const known = this._headers.get(tab);

        if(known) return known;

        const slot = tab.findChildByName('detail_header') as IWindowContainer | null;
        const header = slot ? this._windows.buildWidgetLayout('vortex_quest_detail_header_xml') as IWindowContainer | null : null;

        if(!slot || !header) return null;

        slot.addChild(header);
        this._headers.set(tab, header);

        return header;
    }
}
```

```ts
// features/quests/journal/QuestJournal.ts
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {buildFrame} from '../../../ui/kit/buildFrame';
import type {QuestDefinitions} from '../definitions/QuestDefinitions';
import type {QuestLogModel} from '../model/QuestLogModel';
import {questTitle} from '../questTexts';
import type {JournalTab} from './JournalTab';
import {QuestDetailView} from './QuestDetailView';
import {QuestRowsView} from './QuestRowsView';

const TAB_LAYOUTS: Readonly<Record<JournalTab, string>> = {
    tab_main: 'vortex_quest_tab_active_xml',
    tab_done: 'vortex_quest_tab_done_xml'
};

/**
 * The quest journal (J, vortex_quest_xml, M2a §4.3): the quests under way and the quests done, the
 * selected one in detail, Abandon after a confirmation. This one builds the tabs, keeps the tab and
 * the selection, and routes the events; the rows and the detail are their own units.
 */
export class QuestJournal
{
    private _window: IWindowContainer | null = null;
    private readonly _tabs = new Map<JournalTab, IWindowContainer>();
    private _tab: JournalTab = 'tab_main';
    private _selected: string | null = null;
    private _shown: readonly IRpgQuestLogEntry[] = [];
    private readonly _rows: QuestRowsView;
    private readonly _detail: QuestDetailView;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _log: QuestLogModel,
        private readonly _definitions: QuestDefinitions,
        private readonly _abandon: (questId: string) => void
    )
    {
        this._rows = new QuestRowsView(_windows, _bits);
        this._detail = new QuestDetailView(_windows, _bits);
    }

    get visible(): boolean
    {
        return this._window?.visible ?? false;
    }

    toggle(): void
    {
        if(this.visible) this.hide();
        else this.show();
    }

    show(): void
    {
        if(this._disposed || !this.build()) return;

        this._window!.visible = true;
        this._window!.activate();
        this.render();
    }

    hide(): void
    {
        if(this._window) this._window.visible = false;
    }

    /** The log changed (or the definitions arrived): what is shown follows. */
    render(): void
    {
        if(!this._window?.visible) return;

        const tab = this._tabs.get(this._tab)!;
        const done = this._tab === 'tab_done';

        this._shown = done ? this._log.done() : this._log.active();
        if(!this._shown.some(entry => entry.questId === this._selected)) this._selected = this._shown[0]?.questId ?? null;

        const list = tab.findChildByName('quest_list') as IItemListWindow | null;

        if(list)
        {
            if(done) this._rows.renderDone(list, this._shown, this._selected, this._onEvent);
            else this._rows.renderActive(list, this._shown, this._selected, this._onEvent);
        }

        if(done) this._bits.setText(tab, 'done_count', String(this._shown.length));

        const selected = this._shown.find(entry => entry.questId === this._selected) ?? null;

        this._detail.render(tab, selected, selected ? this._definitions.of(selected.questId) : null, !done);
    }

    private build(): boolean
    {
        if(this._window) return true;

        const window = buildFrame(this._windows, 'vortex_quest_xml', this._onEvent);
        const content = window?.findChildByName('tab_content') as IWindowContainer | null;

        if(!window || !content) return false;

        for(const [tab, layout] of Object.entries(TAB_LAYOUTS) as [JournalTab, string][])
        {
            const built = this._windows.buildWidgetLayout(layout) as IWindowContainer | null;

            if(!built)
            {
                window.destroy();
                this._tabs.clear();

                return false;
            }

            this._tabs.set(tab, built);
            content.addChild(built);
        }

        this._window = window;
        // No side or daily quests yet (M2a): their tabs are hidden.
        this._bits.setVisible(window, false, 'tab_side', 'tab_daily');

        const tabs = window.findChildByName('tab_context') as ITabContextWindow | null;
        const first = tabs?.getTabItemByName(this._tab);

        if(tabs?.selector && first) tabs.selector.setSelected(first);
        this.showTab();

        return true;
    }

    private showTab(): void
    {
        for(const [name, tab] of this._tabs) tab.visible = name === this._tab;
    }

    private confirmAbandon(questId: string): void
    {
        const title = questTitle(this._bits, questId);

        this._windows.confirm(this._bits.text('vortex.quest.abandon'), this._bits.text('vortex.quest.abandon.confirm', 'quest', title), 0, (dialog, event) =>
        {
            dialog.dispose();
            if(event.type === 'WE_OK') this._abandon(questId);
        });
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_SELECTED')
        {
            const name = window.name === 'tab_context' ? (window as ITabContextWindow).selector?.getSelected()?.name ?? '' : window.name;

            if((name !== 'tab_main' && name !== 'tab_done') || name === this._tab) return;

            this._tab = name;
            this._selected = null;
            this.showTab();
            this.render();

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        const row = WindowBits.ancestor(window, 'quest_row') ?? WindowBits.ancestor(window, 'completed_row');

        if(row)
        {
            this._selected = this._shown[row.id]?.questId ?? this._selected;
            this.render();

            return;
        }

        if(window.name === 'header_button_close') this.hide();
        else if(window.name === 'abandon_button' && this._selected) this.confirmAbandon(this._selected);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._window?.destroy();
        this._window = null;
        this._tabs.clear();
    }
}
```

(`vortex.quest.abandon.confirm` uses `%quest%`: check the fr text — `Voulez-vous vraiment abandonner la quête "%quest%" ?` — so the parameter is `quest`.)

- [ ] **Step 4: Wire the journal in `feature.ts`**

After the dialogue:

```ts
        const journal = new QuestJournal(host.made.windowManager!, bits(), questLog, definitions, questId => session.abandon(questId));

        scope.own(journal);

        const openJournal = (): void =>
        {
            journal.toggle();
            host.made.hud?.update({navOpen: journal.visible ? 'nav_quests' : null});
        };

        scope.bind(host.made.hud?.events)('nav', name =>
        {
            if(name === 'nav_quests') openJournal();
        });
        if(host.made.input) scope.add(host.made.input.bind('quests', 'j', openJournal, {when: () => room !== null}));
```

and in the `questLog` `changed` handler, also `journal.render();`; after `void definitions.load();` in `RSE_STARTED`, `.then(() => journal.render())`; in `RSE_ENDED`, `journal.hide();`.

- [ ] **Step 5: Run the tests, lint and gate**

Run: the parts test (PASS, 13 tests), eslint on the feature, `pnpm check`.
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add -- packages/ambreia-game/src/features/quests/journal
git commit -m "feat(quests): the quest journal (J), quests under way and done, detail, rewards, abandon" -- packages/ambreia-game/src/features/quests packages/ambreia-game/test/quests-parts.test.ts
```

---

### Task 8: Seen on screen

**Files:** none (verification); screenshots under `.claude/skills/run-vortex-client/shots/`.

- [ ] **Step 1: With the dev hook, without the server's zone**

Start `pnpm dev` (and the emulator from branch `rpg-quests-m2a` if it is not running — ask before restarting the owner's), log in with the mage test account, enter the world, then drive with `node .claude/skills/run-vortex-client/driver.mjs`:

- `eval __ambreia.quests.session.events.emit('dialogue', {npcObjectId: 0, speaker: 'dialogue.camp.elder.name', text: 'dialogue.camp.elder.start', choices: [{text: 'dialogue.camp.elder.ask', kind: 'next'}, {text: 'dialogue.common.accept', kind: 'accept'}, {text: 'dialogue.common.bye', kind: 'close'}]})`, screenshot `quests-dialog`;
- `eval __ambreia.quests.session.events.emit('log', {quests: [{questId: 'quest.camp.wolves', state: 'active', objectives: [{kind: 'kill', current: 1, required: 3}]}, {questId: 'quest.camp.report', state: 'ready', objectives: [{kind: 'talk', current: 1, required: 1}]}]})`, screenshot `quests-tracker` (the HUD tracker, the « ! » on the quests button);
- `key j`, screenshot `quests-journal`; click the done tab, screenshot;
- `eval __ambreia.quests.session.events.emit('result', {action: 'accepted', code: 'ok', questId: 'quest.camp.wolves'})`, screenshot `quests-toast`.

Expected: the owner's layouts filled, no empty slot left showing a raw key, `errors` none.

- [ ] **Step 2: Report**

Say what was seen, with the screenshot names, and what was not: the real NPC, its marker and a quest done end to end need the demo zone of plan M2a-4.
