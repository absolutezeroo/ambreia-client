# Ambreia client — state ownership

> Companion to `CLIENT-ENTERPRISE-AUDIT.md` (2026-10-10, `aeb88ba`). Principle 3: the server is authoritative; the
> client predicts, interpolates, animates, caches and displays. Evidence lines refer to that revision.

## 1. Classification of client state

| Class | Examples | Where it lives today |
|---|---|---|
| Server-authoritative mirror | room objects, users, played character, inventory, skills/cooldowns, target, vitals | iso `RoomObject`/`RoomObjectModel`; `Rpg*Session` classes (typed `EventEmitter`) |
| Session | connection flags, SSO ticket, authenticated | `SocketConnection` + `IncomingMessages` + `HabboCommunicationDemo` (6 booleans), `App._authenticated` |
| Feature | HUD panel values, open windows, chat lines, demo values | `HudPanelsState`, `PlayerHudState`, closures in `feature.ts` |
| Scene | room instance, planes, camera, sortable sprites | `RoomManager`/`RoomInstance`/`RoomRenderingCanvas` |
| Presentation | `RoomObjectSprite` records, window controller tree, OffscreenCanvas buffers | iso canvas, `@ambreia/ui` |
| UI ephemeral | hover, drag ghost, tooltip timers, focus | `MouseEventProcessor`, `FocusManager`, feature closures |
| Cache | `.ambreia` directories, asset libraries, graphic asset collections, avatar image caches, `TRANSFORM_MEMO`, `RoomPlane.SHARED`, imager LRU/disk | `common/assets`, `RoomContentLoader`, `AvatarRenderManager` |
| Configuration | `IKernelConfig` (frozen), legacy map (mutable) | kernel; `HabboConfigurationManager` |

## 2. AS-IS ownership table (significant state)

| State | Owner (truth) | Writers | Readers | Server-authoritative | Reconciliation (room change / reconnect) | Issue |
|---|---|---|---|---|---|---|
| Current room / "in a room" | `RoomSessionManager._sessions` | legacy room handlers | `RoomMessageHandler._currentRoomId`, `RoomEngine._activeRoomId`, `App._isInRoom/_activeRoomId`, closures in 6 features (`room`, `inWorld`) | yes | `RSE_STARTED/ENDED`; `VortexMain` disposes the room on `RSE_ENDED` | **≥10 copies**; no reconnect path |
| Played character (name, figure, class, level, stats) | `RpgCharacterSession.state/played` | `RpgCharacterState/Progress/Stats` messages | hud (bridge), inventory (local `stats` copy), skills/combat (`classId`) | yes | message-driven; no `forget()` on disconnect | duplicated `stats` in inventory closure |
| Own HP / mana | **two projections**: `PlayerHudState.hp/mana` written by combat `'self'` (`RpgSelfVitals`) **and** by `CharacterHudBridge.vitals()` (assumes full HP when unknown); `RpgCombatSession._health` per combatant | combat, bridge | `HudView`; interaction (`combat.healthOf(target)`) | yes | none on reconnect; `RSE_ENDED` → `inCombat=false` only | bridge invents full HP before first vitals |
| Selected target | `RpgInteractionSession._target` (server `RpgTarget`) | server; `select()` on `REOE_SELECTED`/Escape/panel close | hud `target` panel (copy with hp), `RoomEngine.setRpgTarget`, skills `targetId()`, combat `classOf` | yes (server confirms) | `RSE_ENDED` → `forget()`, `hud.target=null` | fine; hud copy is a projection |
| Inventory (bag, equipment) | `RpgInventorySession.inventory` | server | `InventoryView`, `CharacterWindow` | yes | none on reconnect | — |
| Skills bar, cooldowns, global cooldown | `RpgSkillSession.bar/_cooldownEnds/_globalEnd` (server `remainingMs` projected on `Date.now()`) | server `RpgCooldowns` | HUD slots, `SkillsWindow` | yes; `cast()` sends unconditionally | `RSE_ENDED` → `forget()` | **correct**: no client gating |
| Casts / statuses (display timers) | skills feature closures (`casts`, `ownStatuses`, `setInterval` tickers) | server castStart/castEnd/statuses | target/boss cast bar, buffs | yes | cleared on `RSE_ENDED` | fine |
| Connection state | `SocketConnection` flags + `IncomingMessages` + `HabboCommunicationDemo` | transport, demo | `App._authenticated`, `Vortex._ready`, 7 features at `afterAttach` | n/a | none (no reconnect) | scattered; sessions stay installed on a dead connection |
| Avatar figure (own) | `RpgCharacterSession.played.figure` **vs** `SessionDataManager.figure` | two messages | hud, inventory (`played ?? sessionData`) | yes | — | fallback chain = duplicated truth |
| Room objects (position, state, model) | iso `RoomObject` + `RoomObjectModel` (updateIDs) | `RoomMessageHandler` → `RoomEngine` → logic `processUpdateMessage` | visualizations, picking, features via `RoomEngine` getters | yes | room disposed on `RSE_ENDED` | Pixi sprites are pooled presentation, not state (good); occlusion/x-ray read the drawn sprites |
| Chat lines | `HudPanelsState.chat` | chat feature, combat (system lines) | `ChatPanel` | yes (server echo) | per room? (not cleared on `RSE_ENDED` — to verify) | cap to verify |
| Configuration | `IKernelConfig` (frozen) | kernel, once | features (`config`), App | n/a | — | `HabboConfigurationManager` is a **mutable** legacy copy (`setProperty` public) |
| Asset directories / libraries | `AmbreiaDirectory` per family; `RoomContentLoader._graphicAssetCollections/_assetLibraries`; `AvatarAssetDownloadManager` | loaders | iso, avatar | n/a | `purge()` on every session end drops **every** furniture/pet collection (reference counting is dead code) | re-download on every room change |

## 3. Reconciliation model (what exists vs what is needed)

| Phase | Today | Target |
|---|---|---|
| snapshot | per-domain full messages on entry (`RpgSkills`, `RpgInventory`, `RpgCharacterState`, room `Objects/Users`) | keep |
| delta | per-domain update messages | keep |
| optimistic change | none (client never applies before the server answers) | keep this discipline; animate only |
| acknowledgement | server echo (chat), `Rpg*Result` codes | keep |
| rollback | n/a | n/a |
| reconnect | **none**: no `Reconnecting` state, dead page after the dialog when not framed | `ConnectionStateMachine` emits `reset`; every `Rpg*Session.forget()` subscribes; HUD shows "reconnecting" |
| resync | server re-sends on re-entry (not verified without the emulator) | define per domain which snapshot is re-sent on `InWorld` after a reconnect |

## 4. Target ownership table

| State | Owner | Source | Mutable? | Lifetime | Readers get it through |
|---|---|---|---|---|---|
| Zone presence (room id, own object id, in-world flag) | `room-session` feature (`IZonePresence`) | `RoomReady`/`RSE_*` | by owner only | world session | `IID_ZonePresence` |
| Connection state | `net` state machine | socket + handshake | by owner only | page | typed transitions |
| Played character | `character` (`IRpgCharacterSession`) | server | by owner only | world session; `forget()` on reset | `IID_Character` |
| Own vitals (hp, mana, inCombat) | `combat` only | `RpgSelfVitals` | by owner only | world session | `IID_Combat`; character supplies maxima |
| Target | `interaction` | server | by owner only | world session | `IID_Interaction` |
| Inventory | `inventory` | server | by owner only | world session | `IID_Inventory` |
| Skills/cooldowns/statuses | `skills` | server (`remainingMs` → local clock) | by owner only | world session | `IID_Skills` |
| HUD layout state (navOpen, questAlert, chat tabs) | `hud` | user | by owner | world session | `IID_Hud` (panels write their own state, not the HUD's) |
| Room objects | iso room instance | `RoomMessageHandler` | by `RoomEngine` only | room | `IRpgRoomView` façade for features |
| Config | kernel | boot | never | page | `IFeatureContext.config` |
| Asset caches | `common`/engines | loaders | by owner | session; room content retained by visualizations (ref-counted) and dropped 20 s after last release | engine options |

Rules: one owner per state; readers hold projections, never second copies they mutate; every owner implements
`forget()` for `reset`; nothing client-side decides whether an intent is legal.

## 5. Client-side authority audit (Principle 3)

Checked: `RpgSkillSession.cast()` sends unconditionally (`readyAt()` only feeds the HUD veil); `RpgChatSession.send()`
has no length/cooldown check; `RpgInteractionSession.select()` sends on click/Escape; `RpgInventorySession` moves are
sent and applied on the server's `RpgInventory`; movement has a UX gate only (`RoomEngine.isMoveBlocked()`). No
damage, currency, XP, loot, cooldown truth or trade validity is computed on the client. **No violation found.**

Dev hooks that *fabricate* server events exist in production code (`__ambreia.combat.simulate()` emits fake `hits`):
harmless to others (display only), but they should be `import.meta.env.DEV`-gated.
