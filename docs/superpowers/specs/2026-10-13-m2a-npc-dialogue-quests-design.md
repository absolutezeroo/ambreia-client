# M2a NPC, dialogue and quests: the first quest loop

Date: 2026-10-13. Status: draft for the owner's review. Roadmap milestone M2 of
`AMBREIA_PRO_ROADMAP_2026.md` ("World Interaction Loop"), first half. The owner chose the scope
« PNJ + quête simple » on 2026-10-13: the second half (M2b) is the world map, travel and discovery.

Scope: client, server and map editor. The server is `../vortex-rpg-emulator`; this spec adds to its
zone rules (`docs/superpowers/specs/2026-10-10-zone-rules-z1-design.md`), content
(`2026-10-08-rpg-content-design.md`) and interaction (`2026-10-09-rpg-interaction-design.md`) specs.

## 1. Goal

A player can do a quest from start to end, without a dev command:

> talk to an NPC → read its dialogue, choose → accept a quest → see it in the HUD tracker and the
> journal → kill the monsters it asks for (or talk to someone, or reach a place) → see the NPC's
> marker turn to « ? » → talk to it again → hand the quest in → receive XP and items.

And a level designer can place that NPC and wire that quest in the map editor, with every id picked
from a list and checked before the zone is published.

### 1.1 What already exists (measured 2026-10-13)

| Piece | Where | State |
|---|---|---|
| `ZoneNpc` layer: id, template, name, look, cell, rotation, services, icon, animation, `Dialogue` id, `AppearWhen` | `Vortex.Primitives/World/Layers/ZoneNpc.cs` | saved and validated (unique id, reachable cell); **never put in the room** |
| Map editor NPC inspector, with a typed dialogue id | `ambreia-map-editor/src/ui/panels/NpcInspectorUi.ts` | the template, look and dialogue pickers are disabled |
| Rules `StartQuest` (action), `QuestState` (condition and trigger), `MonsterKilled` (trigger) | `Vortex.Primitives/World/Rules/`, editor `RULE_KINDS.ts` | saved and validated; quest ones marked `rpg`: **no executor, no evaluator** |
| `ShowDialogue` action | `ShowDialogueExecutor` | a `zone.dialogue` notification bubble (a client toast since `a00e53a4`) |
| `MonsterKilledEvent` (monster id, level, zone, participants) | `CombatZone.Deaths` | published; nothing listens for quests |
| Idempotent grants: `GrantXpAsync(grantKey…)`, `GrantItemsAsync(grantKey…)` | `IPlayerCharacterGrain` | used by operators |
| Zone facts pushed by the character (`CharacterZoneFacts`: level, items), module evaluators (`PlayerLevelEvaluator`, `HasItemEvaluator`) | `Vortex.Rpg.Characters/Zones/` | the pattern a quest log follows |
| Owner layouts: `vortex_npc_dialog`, `npc_choice_row`, `npc_marker`, `npc_menu`, `npc_prompt`, `vortex_quest_xml` and its tabs and rows, `hud_quest_tracker` | `vortex-client/src/vortex-layouts/` | no view uses the NPC and journal ones; the HUD tracker exists (`hud/panels/QuestTrackerView`, `IHud.quests`) |

### 1.2 What M2a adds

| Gap | Side |
|---|---|
| Quest and dialogue definitions | emulator content + schemas |
| A character's quest log, saved | server (character grain, database) |
| NPCs in the room, clickable | server room + client |
| Dialogue: the server walks it, the client shows one node at a time | wire + server + client window |
| Objectives progress: kill, talk, reach | server event handlers |
| Hand-in: rewards once | server |
| `StartQuest` executor, `QuestState` evaluator | server rules |
| NPC markers « ! » and « ? » | wire + client overlay |
| Journal (active and done tabs), HUD tracker filled | client |
| Editor: dialogue and quest pickers, publish-time checks | map editor + server validator |

### 1.3 Out of scope, with where it goes

- Shop, bank, teleport and repair services of an NPC (`npc_menu` entries other than talk and
  quest): their own milestones (M5 economy for the shop). M2a's NPC only talks.
- Daily quests, reputation, faction, quest sharing, quest items that drop from monsters: later; the
  journal's daily tab and reputation rows stay hidden.
- Reward choice (« choose one of »), equipment comparison: later; M2a gives every listed reward.
- `ZoneNpc.AppearWhen` per player: a room unit is the same for everyone, so an NPC shown to some
  players only needs per-player units. M2a spawns every NPC; the editor keeps the field marked RPG.
- NPC templates as content (`ZoneNpc.Template` stays an unresolved reference, as today). The NPC is
  drawn from its `Look` and named from its `Name`.
- World map, travel, discovery, quest markers on a map: M2b.
- Escort, timed, group and repeatable quests.

## 2. Content

Two new content kinds in the emulator, each a JSON file under `content/<kind>/` with a schema under
`schemas/content/`, loaded and migrated like the existing kinds. Texts go in `content/texts/<lang>.txt`.

### 2.1 Quest (`content/quest/*.json`, public)

```json
{
  "$schema": "../../schemas/content/quest.schema.json",
  "id": "quest.camp.wolves",
  "kind": "quest",
  "level": 1,
  "requires": [],
  "objectives": [
    {"kind": "kill", "monster": "monster.forest.wolf", "count": 3},
    {"kind": "talk", "zone": "camp", "npc": "elder"},
    {"kind": "reach", "zone": "forest", "area": "clearing"}
  ],
  "rewards": {"xp": 120, "items": [{"item": "item.weapon.rusted_sword", "quantity": 1}]}
}
```

- `level`: the advised level, shown in the journal; it does not block. `requires`: quest ids that
  must be done before this one is offered.
- An objective `kill` counts the `MonsterKilledEvent`s naming that monster in which the player is a
  participant. `talk` is met when the player opens the dialogue of that NPC (`zone` key + `ZoneNpc.Id`).
  `reach` is met when the player enters that area (`ZoneAreaEnteredEvent`). Objectives progress in
  any order; the quest is `ready` when all are met.
- Texts: `quest.camp.wolves.name`, `.description`, `.objective.0` … (with `%current%`/`%required%`).
- Public (`/api/public/content/quest`): the journal and the tracker read names and counts from it.

### 2.2 Dialogue (`content/dialogue/*.json`, server only)

```json
{
  "$schema": "../../schemas/content/dialogue.schema.json",
  "id": "dialogue.camp.elder",
  "kind": "dialogue",
  "speaker": "npc.camp.elder",
  "entries": [
    {"quest": "quest.camp.wolves", "state": "ready", "node": "thanks"},
    {"quest": "quest.camp.wolves", "state": "active", "node": "waiting"}
  ],
  "nodes": {
    "start": {"text": "dialogue.camp.elder.start", "choices": [
      {"text": "dialogue.camp.elder.ask", "next": "offer"},
      {"text": "dialogue.common.bye"}
    ]},
    "offer": {"text": "dialogue.camp.elder.offer", "choices": [
      {"text": "dialogue.common.accept", "accept": "quest.camp.wolves"},
      {"text": "dialogue.common.later"}
    ]},
    "waiting": {"text": "dialogue.camp.elder.waiting", "choices": [{"text": "dialogue.common.bye"}]},
    "thanks": {"text": "dialogue.camp.elder.thanks", "choices": [
      {"text": "dialogue.common.complete", "complete": "quest.camp.wolves"}
    ]}
  }
}
```

- The opening node is the first `entries` line whose quest is in that state for the player, else
  `start`. States: `none` (never taken, offerable), `active`, `ready`, `done`.
- A choice does one thing: `next` (another node), `accept` (take the quest, then close), `complete`
  (hand it in, then close), or nothing (close). A choice whose `accept` quest is not offerable (taken,
  done, `requires` unmet) or whose `complete` quest is not `ready` is not sent to the player.
- Server only: the client never sees nodes it was not shown, nor the conditions.
- The NPC's markers come from its dialogue (§4.4): no quest names a giver.

### 2.3 Validation

The content loader refuses a dialogue whose `next` names no node, a choice with two actions, an
`accept`/`complete`/`entries` quest that is not in the content, and a quest whose `kill` monster is
not in the content or whose `count` is below 1.

## 3. Server contract

Ids are assigned in the emulator's `Headers.cs`, then `pnpm gen:headers` on the client. Proposed:
client → server 9018–9020, server → client 9032–9036. Field types: i = int, s = string, b = bool;
lists are `count × (...)`.

### 3.1 Client → server

| Message | Fields | Meaning |
|---|---|---|
| `RpgNpcTalk` | objectId:i | talk to that NPC. Out of reach (more than 1 tile away), the server walks the player next to it first, as `ZoneInteractionModule` does for decor |
| `RpgDialogueChoose` | choice:i | the index of a choice of the node last sent to this player |
| `RpgQuestAbandon` | questId:s | drop an active or ready quest; its progress is lost, it can be taken again |

### 3.2 Server → client

| Message | Fields | When |
|---|---|---|
| `RpgNpcs` | count × (objectId:i, marker:s) | in the zone's entry burst, then to a player whenever one of their quests changes state. Lists every NPC of the zone. `marker`: `available` (« ! »: a quest it offers is offerable), `ready` (« ? »: a quest it completes is `ready`), `active` (grey « ? »), or `` |
| `RpgDialogue` | npcObjectId:i, speaker:s, text:s, choices: count × (text:s, kind:s) | the node to show. `speaker` and `text` are content text keys; `kind` is `next`, `accept`, `complete` or `close` (for the button's look) |
| `RpgDialogueClose` | — | the server ended the dialogue: a quest accepted or completed, the player walked away (more than 2 tiles), left the zone, or died |
| `RpgQuestLog` | count × (questId:s, state:s, objectives: count × (current:i, required:i)) | the whole log, active, ready and done: after sign-in (with the character's state push) and after every change. Small by construction (§4.1 caps the active quests) |
| `RpgQuestResult` | action:s, code:s, questId:s | `accepted`, `completed`, `abandoned` with `ok`; or a refusal: `quest.log_full`, `quest.not_offerable`, `quest.not_ready`, `npc.too_far`, `npc.unknown` |

### 3.3 Rules

- **NPCs are room units.** On zone activation each `ZoneNpc` becomes a `RoomNpcAvatar` serialized as
  a bot (`RoomBotAvatarSnapshot`, which the serializer already writes): its `Look` as the figure (a
  default figure when empty), its `Name`, its cell and rotation. It never walks, it is not a combatant
  (`IsTargetable` false; skills and auto-attack ignore it), and players do not block on it.
- **One dialogue per player**, kept by the room: the NPC and the node last sent. A choice is checked
  against that node; any other choice is ignored. Talking to another NPC replaces it.
- **Accept**: offerable (§2.2) and fewer than 20 active quests, else a refusal. The quest enters the
  log as `active` with zero progress (or straight `ready` when it has no objectives left to meet).
- **Progress**: a handler per event updates every concerned player's log, in the character grain;
  over-kill does not count past `required`. A quest whose objectives are all met becomes `ready`.
- **Complete**: the quest must be `ready`. The XP and items are granted with the grant key
  `quest:<questId>:<playerId>`, so a retry or a double click grants nothing more; then the quest is
  `done`. Items that do not fit go where `GrantItemsAsync` already puts overflow (its parcel rule).
- **Rules engine**: a `StartQuestExecutor` (the same path as a dialogue accept) and a
  `QuestStateEvaluator` reading a new `CharacterQuestFacts` part of the zone facts (quest id → state),
  pushed by the character on every change, as `CharacterZoneFacts` is today. Both drop their `rpg`
  marker in the editor.
- **Persistence**: a table `rpg_character_quests` (player id, quest id, state, progress per
  objective, accepted at, completed at; one row per quest taken), read with the character and
  written on each change, like the items. An EF migration adds it.

## 4. Client

A new feature `features/quests/` (one line in `GAME_FEATURES`), split from the start: a session,
small model parts, one view per window, `feature.ts` only wiring.

### 4.1 Session and model

- `RpgQuestSession`: one `MessageMap` for the five incoming and three outgoing messages; the only
  writer of the model.
- `QuestLog` (the log as the server sent it), `NpcMarkers` (objectId → marker), `DialogueState` (the
  node shown, or none). Each its own unit with its own test.

### 4.2 Talking

- The interaction feature asks the quests feature, through `INpcDirectory` (`isNpc(objectId)`), before
  selecting a target: a click on an NPC sends `RpgNpcTalk` instead of `RpgTargetSelect`.
- `DialogueWindow` (`vortex_npc_dialog`, a `npc_choice_row` per choice): the speaker's name, the text,
  the choices; a click sends `RpgDialogueChoose`, a `close` choice or Escape closes it locally. It
  closes on `RpgDialogueClose` and on zone change. Pinned like the other screen windows.

### 4.3 Journal and tracker

- `QuestJournal` (`vortex_quest_xml`): the active tab (a row per active or ready quest, its detail
  with the objectives and rewards, Abandon with a confirmation) and the done tab. The daily tab,
  reputation rows and the route button are hidden (§1.3). Opened by the HUD's quest button and `J`.
- The HUD tracker (`IHud.quests`, already drawn) gets the active and ready quests, up to five, with
  their objective lines; `questAlert` (the « ! » on the button) lights when a quest becomes ready.
- Toasts on `accepted` and `completed` (`vortex.quest.done.banner`), and on refusals.

### 4.4 Markers

`NpcMarkerLayer` draws `vortex_npc_marker` over each NPC with a marker, anchored on the avatar's head
like the combat overlay's bars (it reads positions through the room engine, not through the combat
feature). `available` « ! » gold, `ready` « ? » gold, `active` « ? » grey.

## 5. Map editor

- The NPC inspector's dialogue picker lists the content's dialogues (a new editor endpoint
  `GET /api/editor/content/dialogue`: id and speaker text). The typed field stays for an id the list
  does not have yet, flagged by the checks below.
- The `StartQuest` action and the `QuestState` condition and trigger pick their quest from the
  public quest list (`/api/public/content/quest`), with its name.
- Publish-time checks in `ZoneValidator`, beside `UnknownMonster`: `UnknownDialogue` (an NPC or a
  rule names a dialogue the content does not have), `UnknownQuest` (a rule names an unknown quest).
  Both are errors: the zone does not publish. A dialogue `talk` objective naming an NPC id that no
  published zone has is a content warning, not an editor error.

## 6. Content shipped with M2a

No published zone has monsters or NPCs today (measured: `test`, `proof_a`, `proof_b`,
`proof_zone`). M2a ships a demo zone `camp`, a zone document seeded by a dev script beside
`scripts/sql/dev_zone.sql` (re-runnable, published as version 1): a safe area `camp`, an area
`clearing`, three `monster.forest.wolf` spawns outside the camp, the NPCs `elder` (« Ancien du
camp ») and `scout`, a respawn entry in the camp. In it, two chained quests, the second requiring
the first:

1. `quest.camp.wolves`: kill 3 `monster.forest.wolf`; reward 120 XP and `item.weapon.rusted_sword`.
2. `quest.camp.report`: talk to the camp's scout NPC, then reach the area `clearing`; reward 80 XP
   and `item.consumable.minor_potion` × 3.

French and English texts for both.

## 7. Tests and exit criteria

- Emulator: content loading and validation (§2.3); offerable rules; accept, progress per objective
  kind, ready, complete with grants once (a second complete grants nothing); abandon; the dialogue
  walk (entry by state, hidden choices, a stale choice index ignored, close on distance); NPC units
  serialized as bots and ignored by combat; the two rule pieces; the quest log round-trips the
  database; `UnknownDialogue` and `UnknownQuest`.
- Client: the session writes the model from wire bytes in the server's order; each model part;
  the dialogue window's choice routing; the journal's rows from a log; the tracker lines.
- Live, with screenshots: the golden path of §1 in the `camp` zone with quest 1, then quest 2 (talk
  and reach), a sign-out and back in the middle (the log and markers come back), and an abandon.
- `pnpm check` green on the client, `dotnet test` green on the emulator (`--artifacts-path artifacts`
  while the owner's server runs).
