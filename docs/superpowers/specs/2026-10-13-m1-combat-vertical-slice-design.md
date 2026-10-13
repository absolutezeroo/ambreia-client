# M1 Combat Vertical Slice: finishing the combat loop

Date: 2026-10-13. Status: approved in conversation (five sections). Roadmap milestone M1 of
`AMBREIA_PRO_ROADMAP_2026.md` §5; closes the "AvatarEffect lifecycle" row of its legacy register (§11).

Scope: client and server contract. The server side is `../vortex-rpg-emulator`; its combat is already
specified and built in `docs/superpowers/specs/2026-10-09-rpg-combat-m1a-design.md`,
`2026-10-09-rpg-skills-m1b-design.md` and `2026-10-10-rpg-monsters-m1c-design.md`. This spec adds to
those, it does not restate them.

## 1. Goal

A player can play the whole combat loop of a real MMORPG, without a dev command:

> enter a zone → select a monster without attacking it → open with a skill → start auto-attack →
> see the target's target and own threat → get interrupted → take damage, heal → die → wait, be
> resurrected by another player (or release to the zone's respawn point) → kill → gain XP →
> level up with its panel.

And the client state behind that loop has one owner and survives a resync.

### 1.1 What already exists (measured 2026-10-13)

Server: targeting with rank, range and auto-approach, statuses with stacks, casts/channels/interrupts,
GCD and cooldowns, thirteen refusal codes, threat tables, death and respawn, XP and level. Client: 42
new-style RPG messages, player/target/buff frames, the 6-slot action bar, health bars, floating numbers,
cast bars, telegraphs, per-phase VFX (`features/{combat,skills,interaction,hud}`,
`NewStyleHeaders.ts`). The roadmap's M1 scope describes them as to-do; they are done.

### 1.2 What M1 adds

| Gap | Side |
|---|---|
| Selecting a monster starts the auto-attack (`RoomTargetModule`) | server rule + client button |
| Target of target, threat of the current target | wire + HUD |
| Death: ghost 5 s then forced respawn, no choice, no resurrection | server rules + wire + KO screen |
| Level-up: no message, no panel, no heal | wire + panel + server rule |
| Combat log | client, derived |
| Cooldowns lost on zone change, absent from the entry burst | server |
| Dead target never cleared | server |
| Health has two client writers, no resync | client model |
| Status auras declared in content, never played | client |
| `AvatarEffect` (2624) still registered; 241 Habbo effects shipped | removal |

### 1.3 Out of scope, with where it goes

- Respawn-point choice with cost and zone danger (mockup panel 3): M2 World, it needs
  World → Region → Zone and gold. In M1, release goes to the zone's `respawn` entry.
- "New quests available" in the level-up panel, quest reward choice with equipment comparison
  (mockup panels 5 and 6): M2 with the Quest domain, its only producer.
- "Leave the instance" on the KO screen, party wipe (panel 7): M4 Dungeons. The layout keeps the
  slot, M1 hides it.
- Loot, taunt, PvP, passives, cast interruptibility flag.

## 2. Server contract

Ids are assigned in the emulator's `Headers.cs`, then `pnpm gen:headers` on the client. Field types:
i = int, s = string, b = bool; lists are `count × (...)`.

### 2.1 New incoming messages

| Message | Fields | When |
|---|---|---|
| `RpgTargets` | count × (objectId:i, targetObjectId:i; 0 = none) | full in the entry burst, then one entry per combatant whose target changed, each tick. Gives the target of target and every monster's target |
| `RpgThreat` | monsterObjectId:i, percent:i, hasAggro:b | to the player only, for their current target: on target change, when `percent` moves by `ThreatReportStep` or more, and when `hasAggro` flips. `percent` = floor(playerThreat / topThreat × 100), in 0..100; `hasAggro` = the player is the top of the table (ties: the first in, as the server already resolves them). No value above 100 |
| `RpgResurrectOffer` | casterObjectId:i, healthPercent:i, expiresMs:i | when a `resurrect` effect lands on a KO player. A newer offer replaces the pending one |
| `RpgLevelUp` | level:i, statsBefore, statsAfter (the stat block of `RpgStatBlockWriter`), skillsLearned: count × skillId:s | to the player, right after `RpgCharacterProgress`, once per level gained |
| `RpgAutoAttackState` | active:b | to the player on every change: start, stop, target died, target cleared, refusal |

### 2.2 New outgoing messages

| Message | Fields | Meaning |
|---|---|---|
| `RpgAutoAttack` | active:b | start or stop auto-attacking the current target |
| `RpgDeathChoice` | choice:s | `wait`, `release`, `accept`, `decline` |

### 2.3 Rule changes

**Select is not attack.** `RpgTargetSelect` only selects; the server no longer calls `StartAttack`
on a monster target. `CombatZone.Swings` swings for a player only while their new `AutoAttacking`
flag is true. `RpgAutoAttack(true)` sets it (refused `dead`, `safe_zone`, or `invalid_target` when
the target is not a living monster, through `RpgCombatResult`); `RpgAutoAttack(false)` clears it.
A target change while attacking transfers the attack to the new target if it is a monster,
otherwise clears the flag. Walking by hand clears it, as today; the automatic approach when out of
reach stays. A cast suspends swings (`Busy`) and they resume after it if the flag is still set.
Casting never sets or clears the flag. Monsters are unchanged. Every flag change sends
`RpgAutoAttackState`.

**KO replaces the ghost.** On death the player stays on the spot, posture `lay`, invulnerable,
removed from every threat table, out of reach of `RpgTargetSelect` and of every targeting mode
except `dead_ally` (the only way to target a KO player is a skill declared for it), casts and statuses cleared, 10% equipment wear
unchanged. `RpgDeath.respawnSeconds` becomes the auto-release delay (`AutoReleaseSeconds`, 60).
`RpgDeathChoice`:

- `release`: today's respawn — the zone's `respawn` entry, 50% health, mana untouched.
- `wait`: cancels the auto-release; the player stays KO until an offer, a release, a disconnect,
  or `MaxKoSeconds` (600) since death, which then releases. Leaving the zone or the instance while
  KO (teleport, instance end) releases too: a player never changes zone KO.
- `accept`: only with a pending offer; stands the player up on the spot with `healthPercent` of
  health and mana, leaves combat.
- `decline`: drops the pending offer.
- Auto-release at the delay behaves as `release`. Disconnect while KO: release on next login.

**Effect `resurrect`.** New effect kind with `healthPercent`, and a new targeting mode `dead_ally`:
a KO player within range and line of sight; a living target is refused `invalid_target`. It is carried
by a class `cast` skill (§6.1). When it lands, the server sends `RpgResurrectOffer` to the target
with `expiresMs` = `ResurrectOfferSeconds` (30) and the caster's object id; the caster gets the usual
`RpgSkillEvents` impact. The offer expires silently; the KO screen counts it down.

**Target cleared on death.** When a monster dies, every player targeting it receives `RpgTarget`
None at that tick, not when the corpse is removed. The same for a player who dies while targeted.

**Cooldowns.** `SkillCooldowns` moves out of the per-zone combatant part into the character grain, in
memory like `persistent` statuses, so the GCD and cooldowns survive a zone change. `RpgCooldowns`
joins the entry burst.

**Level-up.** Order on one XP gain, deterministic whatever the number of levels gained:
`RpgCharacterProgress` (final level), `RpgCharacterStats` and `RpgSkills` as today, `RpgVitals` and
`RpgSelfVitals` at the new maxima (health and mana filled), then one `RpgLevelUp` per level in
ascending order, each with its own `statsBefore`/`statsAfter` and the skills learned at that level.
The client coalesces consecutive `RpgLevelUp` received in the same tick into one panel (§4).

**Entry burst**, in order: `RpgVitals` (full), `RpgStatuses` (full), `RpgTelegraphs`, `RpgTargets`
(full), `RpgCooldowns` (full), `RpgThreat` of the current target if any, if the player is KO
`RpgDeath` with the remaining delay (0 after `wait`) then the pending `RpgResurrectOffer` with its
remaining time, and last `RpgSelfVitals`, which terminates the burst. The burst is flushed in one
tick, before any delta of that tick, which the zone's single tick loop guarantees; every list in it
is a full snapshot, so a delta that follows is always correct, and no message of the previous zone
can follow `RSE_STARTED` because the session change travels on the same ordered connection.

### 2.4 Unchanged and sufficient

9012 and 9024 feed the combat log; 9021 `interrupted` is the interruption signal; 9004 stays the
XP signal; telegraphs, statuses and casts keep their messages. The intent rate limiter does not cover
combat messages; `RpgDeathChoice` and `RpgAutoAttack` are idempotent on the server so a double click
is harmless.

## 3. Client model

### 3.1 `CombatModel`

One object in `features/combat/`, exposed through `ICombat.ts` (the feature-import rule: a feature
imports another only through its `I*.ts`). One writer per field; everything else reads.

| Field | Written from | Cleared by |
|---|---|---|
| vitals by objectId: health, maxHealth, mana, maxMana | 9013, 9014, 9012, 9024 | zone epoch |
| `self`: inCombat, autoAttacking, death state | 9014, `RpgAutoAttackState`, 9015, `RpgResurrectOffer`, 9013 of self | epoch, reconnect |
| targets by objectId | `RpgTargets` | epoch |
| `target`: objectId, kind, name, level, classId, rank | 9009 | 9009 None |
| `threat`: percent and hasAggro of the current target | `RpgThreat` | target change |
| statuses by objectId | 9023 | epoch |
| casts by objectId | 9020, 9021 | epoch, caster death |
| cooldowns of the player | 9022 | epoch |
| `log`: bounded list of typed entries | derived from 9012, 9024, 9021, 9015, `RpgLevelUp`, offers, refusals | epoch |

Death state is a small machine: `alive` → `ko{autoReleaseAt, waiting, offer?}` → `alive`. It
leaves `ko` only on the player's own `RpgVitals` with health above 0; the client never anticipates a
server answer. A button sends; the model changes when the server replies.

Timers (casts, cooldowns, status expiry, auto-release, offer expiry) are stored as absolute deadlines
on the monotonic clock (`performance.now()`, through `platform()` so the Node tools and tests can
substitute it), computed from `remainingMs` and the receive time, never accumulated and never on
`Date.now()`, which a system clock change would shift.

### 3.2 Writers

The network sessions only: `RpgCombatSession`, `RpgSkillSession`, `RpgInteractionSession`,
`RpgCharacterSession`. Each receives the model at install and translates its messages into model
calls (`setVitals`, `setTarget`, `setDeath`, …). `CharacterHudBridge` stops writing health: it pushes
level, XP and maxima only, and health comes from the model. This ends the two-writer situation the
2026-10-10 audit named (`CLIENT-STATE-OWNERSHIP.md`).

### 3.3 Readers

The HUD (player frame, target frame, target-of-target frame, threat gauge, buffs, action bar and its
Attack button), the room overlay (bars, numbers, cast bars, marks), the KO panel, the level-up panel
and the combat log tab. All through the model's events: `vitals(objectId)`, `target`, `self`,
`death`, `statuses(objectId)`, `cast(objectId)`, `cooldowns`, `threat`, `log(entry)`, `levelUp`. A
view keeps no combat state of its own.

### 3.4 Resync

`reset(epoch)` runs on RSE_ENDED and on the reconnect lifecycle reset, and opens the `resyncing`
phase; the first `RpgSelfVitals` of the new epoch closes it (§2.3 makes it the burst terminator).
While `resyncing`, the model applies snapshots but emits no `log` entry and the feature plays no
floating number or VFX: the burst restores state, it is not news. The burst rebuilds the model in
full; §2.3 added `RpgTargets`, `RpgCooldowns`, `RpgThreat` and the KO replay for that reason. A
`reset` followed by the burst must yield a model equal to one built live (§7).

### 3.5 Outside the model, on purpose

VFX, telegraphs, monster gestures and projectiles stay in the combat feature, driven by the messages
directly: they are transient and do not survive a resync.

## 4. Screens

Visual references: `mockup/new/f7957172-a9e9-45c2-b848-56feef60a0a1.png` (death, resurrection, progression),
`mockup/new/0840e7d7-44c4-45a6-b187-0f1629fe02e1.png` (combat states and tactical HUD), the UI-COMBAT-01…10 sheets of
`AMBREIA_UI_UX_MASTER_BIBLE.md`. Dark theme, as decided for the quest windows. New layouts go in
`packages/vortex-client/src/vortex-layouts/` and are authored with the design-habbo-window skill.

**Attack button.** Slot 0 of the action bar, left of the six skills, sword icon, default key `T`
(configurable through the input feature). States: idle, active (highlighted, pulsing), disabled (no
living monster target). It reflects `self.autoAttacking`, never the click. Double-click on a monster
also sends `RpgAutoAttack(true)`.

**Target of target.** A compact frame docked right of the target frame: name, level, health bar,
from `targets` and the model's vitals. It reuses the unused `vortex_hud_target_compact_xml`. Hidden
when the target has no target.

**Threat.** A thin gauge under the target's health bar, only for a monster target: red when
`hasAggro`, otherwise green below 80 and orange from 80, with `percent` as text. Fed by `threat`,
reset on target change.

**KO panel** (mockup panel 1). Central, modal for the game, not for the chat: title, the player's
avatar lying, level and class, "Réapparition possible dans …" counting the auto-release while
`waiting` is false. Three buttons: "Réapparaître au sanctuaire" (`release`), "Attendre une
résurrection" (`wait`, with a `?` tooltip), "Quitter l'instance" (hidden in M1). The world stays
visible behind, greyed by a filter on the scene. The panel closes when the death state returns to
`alive`.

**Resurrection offer** (panel 2). Inside the KO panel when an offer is pending: the caster's portrait,
name, level and class resolved from the room's user data by `casterObjectId`, the text with
`healthPercent`, an expiry bar from `expiresMs`, Accept and Decline.

**Level-up panel** (panel 4). Modal "Niveau N !" with N the last level reached: the avatar in its
victory pose, the table of stats that rose (last `statsAfter` minus first `statsBefore`, non-zero rows
only), "Nouveaux éléments débloqués" with every `skillsLearned` (icon and name from content),
Continue. Several `RpgLevelUp` in one tick make one panel. A gold flash on the player frame. No toast.

**Combat log.** A `combat` tab of the chat panel: a new channel in `ui/kit/chatModel.ts` next to
`system`. Typed, coloured lines, each derived from one producer:

| Entry | Producer |
|---|---|
| damage dealt / taken, crit, absorbed | 9012 outcomes `hit`/`crit`; 9024 outcomes `hit`/`crit` with `absorbed`; dealt when `sourceObjectId` is self, taken when `targetObjectId` is self |
| miss, dodge, immune | 9012 `miss`; 9024 `dodge`, `immune` |
| heal | 9024 `heal` |
| status applied, stacked, expired | the diff between two successive 9023 of the same objectId: a `statusId` that appears, whose `stacks` grows, or that disappears (9023 is a full list, so disappearance is the only expiry signal) |
| cast interrupted / failed | 9021 `interrupted`, `failed` |
| death | `killed` in 9012/9024 for others; 9015 for self |
| resurrection offered, accepted, declined, released | `RpgResurrectOffer`; the death state leaving `ko` |
| level-up | `RpgLevelUp` |
| refusals | 9016 `RpgCombatResult`, 9019 `RpgSkillResult` |

Per-type filters in the tab header, 200 lines kept, cleared on epoch, none emitted while
`resyncing`. The refusal lines (`vortex.combat.error.*`, `vortex.skill.error`) move from `system`
to `combat`.

**Toasts** (panel 8). A generic info/error/success toast on `vortex_hud_toast_xml`, in `ui/kit/`,
used for "Résurrection en cours", "Impossible de réapparaître ici" and later features. The tooltip
and the confirmation dialog already exist in the kit.

**Cast bar and target frame**: unchanged, plus an "interrupted" state (red, 600 ms) on 9021
`interrupted` and an "out of range" state on the target frame on the matching refusal code.

## 5. AvatarEffect removal

**Goes**: message 2624 and its chain — `AvatarEffectMessageEvent`, its parser, the registration in
`RoomMessageHandler` and `onAvatarEffect`, `updateObjectUserEffect` in `IRoomCreator` and
`RoomEngine`, `setAvatarEffect` (no caller), `RoomObjectAvatarEffectUpdateMessage`, the
`figure_effect` read in `AvatarVisualization`, `avatarEffectType` in `FigureData`, `EffectPreviewer`
and its part of `ProductImageWidget`, the `RoomPreviewer` call, the layouts `effect_selector`,
`effectbox`, `effects_widget`, `memenu_effect*`, `inventory_effects`, `avatar_editor_effect_griditem`.
Server: `IRoomAvatar.CurrentEffectId` and the 2624 replay in `RoomGrain.Entry.cs`; then the header
leaves `Headers.cs` and `HabboMessages.ts`. The register row becomes "supprimé".

**Stays, renamed for what it does**: `EffectAssetDownloadManager` only serves the RPG `dance` emote.
It becomes `AvatarAnimationAssets` in `@ambreia/avatar`; `AmbreiaEffectMap.xml` is cut to its
`dance.*` entries and renamed `AmbreiaAnimationMap.xml`; the 237 other Habbo effects leave the file
and the asset zip. `vortex-imager` follows; it renders no effect.

**Replacement on the avatar**: status auras. `AuraAddition` in `iso/effects/additions/`, next to
`SelectionRing` and `SheetAddition`, attached to body or feet per `attach`, created when a status with
`vfx.aura` appears in the model for an avatar and removed when it expires. It reads the sheets of
`vfxSheets.generated.ts` like the other phases.

**Cutover order**: the new domain first, the removal as the last task, after auras play, so no state
of the client is without visuals.

## 6. Emulator content

### 6.1 Definitions

- Skill `priest_resurrect`: class healer, `type: cast`, `castMs` 8000, `range` 8, `target:
  dead_ally`, effect `{kind: resurrect, healthPercent: 35}`, `cooldownMs` 60000, VFX `release` on the
  target.
- Status aura example: `vfx.aura` on an existing mage buff with the `power-aura` sheet, to prove the
  chain.
- `icon` field on skill and status definitions, served with them. `skillArt.ts` is deleted; the client
  maps nothing. Unknown icon: the generic one, as today.
- Config: `AutoReleaseSeconds` 60, `MaxKoSeconds` 600, `ResurrectOfferSeconds` 30,
  `ThreatReportStep` 5.

### 6.2 Texts

`vortex.combat.ko.*`, `vortex.combat.resurrect.*`, `vortex.combat.levelup.*`,
`vortex.combat.log.*`, `vortex.combat.threat`, `vortex.combat.autoattack`, in fr and en, served by
`GET /api/public/content/texts/{language}`.

## 7. Tests and exit criteria

**Protocol** (`packages/ambreia-protocol/test/rpg-combat.test.ts`): one test per new message, reading
a buffer produced by the emulator's serializer, not an invented shape. `incoming-registered` and
`outgoing-registered` keep blocking any header without a style. emulator-sync closes the loop after
`pnpm gen:headers`.

**Model** (`packages/ambreia-game/test/combat-model.test.ts`, no DOM, no network): the death machine
(alive → ko → wait → offer → accept / decline / release / auto-release / offer replaced); health with
one writer (9013 then 9004 does not lower it); rebuild from the entry burst after `reset(epoch)`
equals the live model; timers computed from `remainingMs`; log bounded at 200 and typed; auto-attack
follows `RpgAutoAttackState` only; nothing is logged while `resyncing`; two `RpgLevelUp` in one tick
make one `levelUp` event.

**Server** (emulator tests): `Swings` does nothing without `AutoAttacking`; `RpgTargetSelect` alone
never swings; `resurrect` on a living target is `invalid_target`; `accept` stands up on the spot with
the right percent; `release` respawns at the zone entry; `wait` cancels auto-release; target cleared
on monster death; cooldowns in the burst and after a zone change; level-up fills vitals and sends
`RpgLevelUp` after 9004.

**Visual** (run-vortex-client, the mage test account, two screenshots per screen against the
mockups): KO and offer, target of target and threat, the Attack button in its three states, the
level-up panel, the combat tab, a status aura.

**Exit criteria of M1**

1. The golden path of §1 plays with no dev command, once with a resurrection by a second account
   and once with a release.
2. `reset(epoch)` + entry burst rebuilds an identical model: proven by test, checked live by a zone
   change mid-fight.
3. `grep -ri AvatarEffect packages/ --include=*.ts --include=*.xml --include=*.json` is zero
   outside comments, the asset zip (`node install.mjs --pack`) carries no effect map or effect
   library, and the emulator has no 2624 in `Headers.cs` nor an effect serializer; the dance emote
   still plays.
4. `skillArt.ts` no longer exists; icons come from content.
5. `pnpm check` green on both repositories; the roadmap's §9.1 matrix and §11 register updated.
