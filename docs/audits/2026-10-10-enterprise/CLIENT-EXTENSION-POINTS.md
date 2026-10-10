# Ambreia client — extension points (AS-IS and target)

> Companion to `CLIENT-ENTERPRISE-AUDIT.md` (2026-10-10, `aeb88ba`). "Adding N+1 must not require editing the core."
> This document lists every place a new feature touches today, and the registry that would remove the edit.

## 1. Inventory of extension mechanisms that exist

| Mechanism | Where | Duplicate handling | Enabled-aware | Tested | Verdict |
|---|---|---|---|---|---|
| `GAME_FEATURES` list + `IFeature` (`id`, `config` Zod section, `provides`, `essential`, `create`, `afterAttach`) | `game/src/features/index.ts`, `kernel/feature/*` | IID collisions **not** checked | yes (`enabled` per section, essential refuses off) | kernel `features.test.ts` (9) | KEEP + strengthen |
| `IGameFeature.images` | `GameFeature.ts` → `featureImages()` → `App.readWindowAssets` | n/a (set union) | yes | `feature-extensions.test.ts` | KEEP |
| `IGameFeature.roomWidgets` → `RoomWidgetRegistry` | `game/src/ui/RoomWidgetRegistry.ts` | **throws naming both features** | yes | yes | KEEP — the model for every other registry |
| `MessageMap` per domain (`incoming/outgoing`, `install` all-or-nothing) | `net/style/MessageMap.ts`; 6 feature sessions | refuses a header already served (per connection) | n/a | `message-map.test.ts` (7) | KEEP |
| iso registries (`RoomObjectLogicRegistry`, `RoomObjectVisualizationRegistry`, `registerData`) + modules (`registerScene/Furniture/Avatars/Effects`, `DEFAULT_ROOM_MODULES`) | `iso/src/object/*Registry.ts`, `*/register*.ts` | **silent last-wins** | n/a | `room-registries.test.ts` pins 74 + 37 types | KEEP + duplicate guard |
| `WidgetRegistry` (ui kit) + `registerHabboWidgets` (game) | `ui/src/kit/WidgetRegistry.ts`, `game/src/window/HabboWindowManager.ts` | **silent overwrite** | n/a | `widget-registry.test.ts` | KEEP + duplicate guard |
| Layouts and locales by glob | `App.readVortexLayouts` (`import.meta.glob('./vortex-layouts/*.xml')`), `OWN_TEXTS` | by basename, first wins | no (all 269 layouts registered; 188–203 unreferenced) | none | KEEP mechanism, add ownership |
| Config sections | `featureSections(GAME_FEATURES)` → `loadConfig` strict Zod per id | `section(id)` throws for undeclared ids; duplicate feature ids not checked | yes | `config.test.ts` (12) | KEEP |
| Map editor commands (`IEditorCommand`) | `map-editor-core/commands/*` | n/a | n/a | 46 tests | KEEP |

## 2. Central places a new feature still edits (pressure points)

Measured by simulating a `quests` feature (window + HUD panel + 2 incoming + 1 outgoing message + config + a room
object logic + a chat command). Each row names the file edited today and the registry that would remove the edit.

| # | Edit today | File | Why it is central | Target |
|---|---|---|---|---|
| 1 | import + `GAME_FEATURES` line | `features/index.ts` | expected (the "one line") | keep |
| 2 | `IEngineManagers.quests` slot + `emptyManagers()` line | `features/index.ts` | **the `host.made` service locator**: other features read `host.made.quests?.…` | `provides: [IID_Quests]` resolved by the kernel; slot disappears |
| 3 | add headers to two `Set`s | `protocol/src/NewStyleHeaders.ts` | registration tests require it | derive from installed `MessageMap`s (`map.headers()`) |
| 4 | regenerate headers | `Headers.generated.ts` (needs the emulator) | by design | keep; CI makes it non-vacuous |
| 5 | HUD panel: `IHudPanels` field, `LAYOUTS`, `Panel` union, `place()`, `render()`, `describe()`, `_onEvent`, `images` | `features/hud/HudPanelsState.ts`, `HudPanelsView.ts`, `hud/feature.ts` (7 places) | one state object, one view, one event switch | `IGameFeature.hudPanels` + dock layouter; HUD owns layout and plumbing only |
| 6 | chat command | `features/hud/chatModel.ts` (`SHORTCUTS`, `chatSend`) + `test/chat.test.ts` | regexes in a feature file | `IGameFeature.chatCommands` consumed by `chatSend` |
| 7 | room object logic | `iso/src/furniture/registerFurniture.ts` (engine) or `RoomEngine.ts:593` `createRoomRegistries(DEFAULT_ROOM_MODULES)` | fixed module list; **impossible from a feature** | `IGameFeature.roomLogics`/`roomVisualizations` appended by the `room-engine` feature |
| 8 | new room-object → UI event | `RoomEngine.handleRoomObjectEvent` (`:7976`, switch) + a `RoomObjectEvent` subclass under `iso/scene/events` | the last big switch; event classes named after UI widgets live in the engine | `Map<eventType, handler>` registry populated by features; UI events move to `game/room/events` |
| 9 | new server message that updates a room object | `RoomEngine` (`updateRoomObject*`, 12 `*Rpg*` methods already) + `RoomMessageHandler` | `RoomEngine.ts` is 10,335 lines / 294 methods | `IRpgRoomView` façade (small interface features depend on); `RoomEngine` split along existing seams |
| 10 | hotkey | a raw `globalThis.addEventListener('keydown')` in the feature (3 today, never removed, Escape ×3) | no routing; duplicates silent | `IGameFeature.keys` → `InputBindings` (duplicate chord throws); Escape as a stack |
| 11 | texts | `vortex-client/src/locales/{fr,en}/quest.json` | owned by the client, not the feature | `IGameFeature.texts` glob in the feature folder |
| 12 | layout | `vortex-client/src/vortex-layouts/vortex_quest_*.xml` (glob) | ownership by prefix convention | `IGameFeature.layouts` glob in the feature folder (Glaze takes a directory) |
| 13 | dispose | nothing — features return `null`, no teardown hook | listeners/timers/MessageMaps leak across a second boot | `IFeature.dispose` awaited in reverse order |

What needs **no** edit today (and must stay that way): `App.ts`, `VortexMain.ts`, `HabboMessages.ts`, config
loading, image decoding, `RoomWidgetRegistry`.

## 3. N+1 simulations (files added / existing files modified)

| Feature | Pure game feature? | New files | Existing files modified today | Engine change needed? |
|---|---|---|---|---|
| quests | yes | ~8 (feature.ts, session, I*.ts, window, map, parsers/serializers, test) | `features/index.ts` (3–4 edits), `NewStyleHeaders.ts`, `hud/*` (if a new panel), `chatModel.ts`; `registerFurniture.ts` for a quest board | only for a room object logic |
| party | yes (`IHudPanels.party` exists) | ~6 | `features/index.ts`, `NewStyleHeaders.ts` | no |
| target frame | exists (interaction + hud) | — | — | — |
| buffs/debuffs | exists (skills → `hud.buffs`) | — | — | — |
| achievements | yes (15 layouts + locale already shipped) | ~6 | `features/index.ts`, `NewStyleHeaders.ts`, `hud/*` for a toast | no (toast infra missing: see §4) |
| reputation | yes | ~5 | same as above | no |
| crafting / professions | yes + one room logic (crafting station) | ~8 | + `registerFurniture.ts`, `RoomEngine.handleRoomObjectEvent` | yes (logic + event case) |
| combat | exists | — | — | — |
| skills | exists | — | — | — |
| guild | yes | ~8 | same as quests | no |
| dungeon / world events | yes + zone alerts | ~6 | `hud/*` (alert), `features/index.ts` | no |
| minimap | **no** | ~4 | + `RoomEngine` façade method | **yes**: iso must expose tile geometry/visible objects or a render-to-texture of the room; only `getRpgAnchor/getRpgOverlayCell` exist |

## 4. Shared infrastructure that features currently re-invent

| Need | Kit that exists | What features built instead |
|---|---|---|
| tooltips | `WindowToolTipAgent` + `InteractiveController.toolTipCaption` | `HudTooltips` (own timer, own placement), `toolTipCaption` used 0× |
| menus/popups with click-away | `DropMenuController`, `WME_CLICK_AWAY` | `ChatPanel.toggleMenu` (no click-away) |
| drag | `WindowMouseDragger`, `WindowParam.DRAGGABLE_WITH_MOUSE` | `SkillsWindow` own `pointermove` + ghost |
| progress bars | `ProgressIndicatorWidget` | `setBar()` ×2 (`HudView`, `HudPanelsView`) |
| frame build/place/show/hide | — | `buildFrame` (inventory), `CharacterScreen.build`, `HudView.build`: `build` ×8, `show/hide` ×8, `dispose` ×19 hand-written |
| overlays/toasts (safe zone, PvP, achievement, loot, level up) | `HudPanelsState.alert` (one string) | nothing shared yet; each future feature would copy the alert path |

Target: `game/src/ui/kit/` with `RpgView` (build → attach → place → show/hide → dispose), `RpgTooltip` on the
tool-tip agent, `RpgMenu` on `DropMenuController`, a `Toasts` service with one queue and one animation, and
`WindowBits` as the single text/bar/icon helper. Nothing new in `@ambreia/ui`.

## 5. Collision behaviour today (what happens when two features claim the same thing)

| Resource | Today | Target |
|---|---|---|
| feature id / config section | second section shadows silently (`Map` set) | boot error naming both |
| IID provider | second provider attached, first non-locked wins for later requesters | `attachComponent/attachInstance` throw when already provided |
| room widget type | **error naming both features** | keep |
| room logic / visualization type | silent last-wins | throw unless `{override: true}` |
| ui widget type | silent overwrite | throw unless `{replace: true}` (Glaze placeholders) |
| message header (new style) | refused at install (per connection) | keep; plus derive `NewStyleHeaders` |
| message header (inherited vs new) | `HeaderMap.set` logs `error`, does not throw | throw in tests |
| hotkey | both run (Escape ×3) | throw at bind |
| layout name | first basename wins, no log | warn in dev + ownership test |
| HUD nav id (`'nav_inventory'` strings compared in 3 features) | n/a | panel registry ids |

## 6. Fitness functions to add (executable rules)

| Rule | Mechanism | Effort |
|---|---|---|
| feature A imports feature B only via `I*.ts`/`events.ts` | ESLint `no-restricted-imports` block per `features/*` folder | S |
| no `host.made` read of a slot filled later | Proxy over `made` during `bootFeatures` in a game test; or remove `host.made` | S |
| duplicate IID / feature id / config section is a boot error | kernel tests + guards | S |
| duplicate room logic / ui widget / hotkey is an error | registry guards + tests | S |
| every `vortex_*` layout maps to an enabled feature (or lives in `mockups/`) | node test over `vortex-layouts/*.xml` | S |
| every `vortex.*` key used in features/layouts exists in `fr` and `en` | node test | S |
| `NewStyleHeaders` == union of installed maps | test | S |
| generated headers are current | CI with the emulator at a pinned ref; `--check` fails under `CI=1` when the emulator is absent | M |
| `RoomEngine.ts` stops growing | ESLint `max-lines` budget (ratchet) | S |
| engines call no browser global outside `platform/` and an allow-list | ESLint `no-restricted-globals`/`no-restricted-syntax` per engine package | S |
| synthetic test feature: register, resolve DI, message, window, room widget, object logic, config, dispose without editing core | `game/test/synthetic-feature.test.ts` once §2 rows 2, 7, 10, 13 exist | M |
