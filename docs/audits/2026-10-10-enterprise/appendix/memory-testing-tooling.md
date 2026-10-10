# Ambreia client — cross-cutting audit: memory, lifecycle, tests, tooling, DX, observability, AI-safety

Repo `/home/user/ambreia-client` @ aeb88ba (branch claude/determined-ritchie-omy2dy == origin/rpg-character). Read-only.
Scripts used (all in `…/scratchpad/`): `disposal-audit.mjs` (per-class acquire/release balance), `orphans2.mjs`
(workspace-aware reachability), `orphans3.mjs` (barrel-aware reachability through `index.ts` named re-exports),
`proto-dead.mjs`, `dead-sends.mjs` (composers/events instantiated by game code but registered nowhere). Raw outputs:
`disposal.txt`, `orphans3.txt`, `dead-sends.txt`. The emulator (`../vortex-rpg-emulator`) is **absent** in this
environment; everything below that depends on it is marked.

---

## (A) Facts & tables

### A1. Test pyramid as it exists (85 test files; 369 pass + 7 skipped ≈ 45 s)

| Layer | What | Where (count of `test(` declarations) | Proves |
|---|---|---|---|
| Pure unit (Node, no DOM) | wire format, texts, asset pack reader, config, hud rules, chat model, item grid, iso math, map-editor core | common 29, net 16, kernel 21, game 42, ui 9, map-editor-core 43, map-editor 4, imager 7, glaze 3 | algorithms and state classes in isolation |
| Engine isolation | `avatar/test/render.test.mjs` (Node render vs reference PNG, dir 2 & 4), `iso/test/iso-stage.test.ts` (3×3 room out of session, projection, recolour), `ui/test/window-manager.test.ts` (plain `WindowManager` loads XML), `net/test/message-map.test.ts` | avatar 4, iso 25, ui 9 | each engine runs without kernel/game; **the two heavy ones are skipped without `AMBREIA_ASSETS`** |
| Feature (kernel) | `kernel/test/features.test.ts` (9 cases: missing dep stops boot, disabled provider named, essential off = error, afterAttach order), `game/test/feature-extensions.test.ts` (4), `asset-packs-feature.test.ts` (create with fake host) | kernel 21, game 42 | the declaration contract, not the runtime behaviour of a feature |
| Protocol contract | `incoming-registered`, `outgoing-registered`, `served-headers`, `no-literal-ids`, `client-hello-revision`, 7 `rpg-*.test.ts` (strict `wire()` reader) | protocol 32 | every header in `Headers.generated.ts` is served by exactly one style; RPG parsers read the server fixtures in order. **Against the committed generated file, not the live emulator** (absent here; `pnpm check` still green) |
| Architecture rules | `vortex-engine/tools/boundaries.test.mjs` (23 probes through ESLint), `vortex-engine/test/room-registries.test.ts` (8), `move-modules.test.mjs`, `.claude/scripts/*.test.mjs` (15) | engine tools 51, engine test 19, scripts 15 | layer walls, registry completeness, hooks' pure logic |
| Tooling | `vortex-client/tools/*.test.mjs` (monster-art, vfx sheets, release bundle, vite plugins) | client tools 54 | asset pipelines |
| Visual | none automated; `run-vortex-client` skill = manual screenshots (`ss`), no baseline, no diff | 0 | — |
| Integration / e2e | none (no emulator in CI, no CI at all: `.github/` has no workflows) | 0 | — |
| Perf / memory | none (`RoomStressTest.ts`, `PerfMonitorWindow.ts`, `SelfProfiler.ts`, `FrameTimingsReporter.ts` are **orphans**, see A4) | 0 | — |

Skipped (7): `avatar/test/render.test.mjs` ×2 (`SKIP = !process.env.AMBREIA_ASSETS`, line 16), `iso/test/iso-stage.test.ts` ×4
(line 21, same env), `map-editor-core/test/boundaries.test.ts:24` ×1 (emulator `schemas/zone.schema.json` missing). So the only
two tests that render anything, and the only generated-file freshness test besides headers, never run on a machine without
the asset server and the emulator — which is every machine except the owner's.

Time-dependent: `iso-stage.test.ts:192` (`setTimeout(…, 200)` wait), `features.test.ts:41` / `attach-instance.test.ts:36`
(`setTimeout(resolve, 0)` flush). None uses wall-clock assertions; low flake risk.

### A2. Disposal balance per package (`disposal-audit.mjs`, regex counts over `packages/*/src`, acquire/release)

| pkg | DOM add/remove | emitter on/off | setInterval/clear | setTimeout/clear | rAF/cancel | `new Sprite…`/`.destroy(` | classes w/ `dispose()` | lacking `_disposed` guard | `dispose()` not last |
|---|---|---|---|---|---|---|---|---|---|
| avatar | 0/0 | 4/1 | 0/0 | 0/0 | 0/0 | 0/12 | 19 | 13 | 12 |
| common | 2/1 | 9/5 | 0/0 | 0/0 | 0/0 | 2/10 | 22 | 3 | 15 |
| game | 54/20 | 105/60 | 11/13 | 14/7 | 1/1 | 8/51 | 106 | 48 | 55 |
| iso | 0/0 | 11/8 | 1/0 | 5/4 | 0/0 | 42/21 | 94 | 76 | 57 |
| kernel | 0/0 | 5/4 | 0/0 | 1/0 | 0/0 | 0/0 | 3 | 0 | 3 |
| net | 1/1 | 14/2 | 0/0 | 1/6 | 0/0 | 0/0 | 4 | 0 | 2 |
| protocol | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 3 | 1 | 1 |
| ui | 76/53 | 0/1 | 3/4 | 2/5 | 4/2 | 0/10 | 72 | 9 | 38 |
| map-editor | 28/4 | 2/0 | 1/0 | 2/0 | 2/1 | 0/6 | 4 | 4 | 4 |
| vortex-client | 51/24 | 4/2 | 1/2 | 3/0 | 3/2 | 0/1 | 3 | 1 | 3 |
| vortex-engine | 7/1 | 8/1 | 1/1 | 0/0 | 0/0 | 0/1 | 2 | 0 | 2 |
| vortex-glaze | 29/19 | 6/6 | 0/0 | 1/1 | 6/3 | 0/14 | 14 | 12 | 1 |
| vortex-imager | 0/0 | 7/0 | 0/0 | 3/4 | 0/0 | 5/2 | 2 | 2 | 2 |
| **total** | | | | | | | **348** | **169 (49 %)** | **195 (56 %)** |

Reading: counts are textual, a class that removes listeners through a helper (`removeAllListeners`, `destroyListItems`) counts
as balanced only when the helper name matches. 82 classes show acquire > release; the ones confirmed by reading are in (B).
The CLAUDE.md convention "dispose() is the last method and returns early on `_disposed`" holds in **half** of the classes:
the breach is concentrated in the inherited `iso` (76/94 without guard) and `avatar` (13/19) trees, where AS3 classes had
`dispose()` mid-file and used `_disposed` only through the base `Component`.

### A3. Feature lifecycle (game/features)

| Feature | `create` returns | listeners on `roomSession.sessionEvents` | `globalThis` keydown | timers | `__ambreia` global | anything torn down |
|---|---|---|---|---|---|---|
| hud | `null` | RSE_STARTED, RSE_ENDED, RSUDUE_USER_DATA_UPDATE (feature.ts:116-118) | – | HudView `_ticker` (cleared on hide) | `hud` | **no** |
| character | `null` | RSE_STARTED (feature.ts:42) | – | – | `characters` | screen disposed on RSE_STARTED (45) |
| inventory | `null` | RSE_STARTED/ENDED | **I, C** (135) | – | `inventory` | **no** |
| interaction | `null` | RSE_STARTED/ENDED (93-94) | **Escape** (86) | – | `interaction` | **no** |
| chat | `null` | – | – | – | – | **no** (`session.install` returns an uninstall never called) |
| combat | `null` (feature.ts:311) | RSE_STARTED/ENDED (260-271) | – | `countdown` setInterval (238) **not cleared on RSE_ENDED**; `setTimeout(go…)` (98), `setTimeout(() => play…)` (176) | `combat` | overlay `clear()`, maps cleared; `CombatOverlay.dispose()`, `CombatVfx.dispose()`, `RpgCombatSession.dispose()` **never called** |
| skills | `null` | RSE_STARTED/ENDED (343-359) | **1-6, K, Escape** (321) | `castTicker`, `statusTicker` (statusTicker cleared at 354) | `skills` | window hidden, telegraphs cleared |

Teardown reachability: `bootFeatures()` (kernel `feature/bootFeatures.ts`) has no counterpart; `attach()` returns `[]` for a
`null` product; `Vortex.dispose()` → `VortexMain.dispose()` (VortexMain.ts:414-461) disposes the window manager, avatar
renderer, room manager, message handler, then `Core.dispose()` disposes **Components** (`ComponentContext.dispose`, 445-468).
A plain instance attached through `attachInstance` is wrapped in a carrier whose `dispose: (): void => undefined`
(ComponentContext.ts:629+35). **Nothing reaches a feature closure.** The `new-game-feature` skill states it plainly:
"`dispose()` … is called only on what `create` returns; a feature returning `null` writes it on classes that hold listeners
anyway, for tests and later use."

### A4. Orphans / dead code

`node .claude/scripts/find-orphans.mjs` → `0 orphan file(s)`. **The tool is stale**: it scans only
`packages/vortex-engine/src` and `packages/vortex-client/src` (13 files) with the pre-J6 aliases `@core/@habbo/@room/@iid`
(find-orphans.mjs:139-146) and does not resolve `@ambreia/<pkg>/…`, so it cannot see the 2,036 files that moved.

Barrel-aware reachability (`orphans3.mjs`; roots = app entries + every `test/`, `tools/`, `sandbox/`, `app/` file, so a file
kept alive only by a test counts as reached): **2,049 src files, 205 unreached (127 non-barrel)**.

| pkg | orphans | non-barrel highlights |
|---|---|---|
| game | 96 | `perf/PerfMonitorWindow.ts` (759 l.) + `PerfMonitorLayout.ts`; `room/utils/RoomStressTest.ts`, `SpriteDataCollector.ts`; `utils/animation/{Juggler,DelayedCall,Transitions}`; `utils/{InfoText,UserInfoRegionUtil,WindowToggle,HabboFaceFocuser,LoadingIcon,TextWindowUtils,MathUtils,PlatformUtils,BitmapDataUtils,FigureDataContainer}`; `communication/{HabboWebApiError,HabboWebApiMethod,login/*,enum/*}`; `ui/widget/enums/*`, `RoomWidgetChatUpdateEvent`; `session/enum/*`; `avatar/AvatarImageSnapshot`, `avatar/pets/PetType`, `avatar/events/LibraryLoadedEvent` |
| ui | 66 | whole `motion/` (16 files: Motions, Ease, MoveTo…), whole `kit/utils/tableview/` (8), `kit/enum/*` (7), `kit/utils/{AnimatedColor,AnimatedScalar,DeBouncer,ILimitedItemOverlay}`, `utils/{ChildEntityArray,SelectableTextOverlay,WindowUtils,I*}` (10), `graphics/renderer/ISkin*` (3), `components/{INotifyWindow,IRadioButtonSelectionWindow,ITabContentWindow,IToolBarWindow}`, `enum/*`, `events/{WindowMessage,WindowTouchEvent}` |
| protocol | 24 | all barrels (`parser/**/index.ts`, `incoming/{hotlooks,wardrobe}/index.ts`…) — classes themselves are imported directly, see "dead sends" |
| iso | 7 | `furniture/logic/FurniturePetCustomizationLogic`, `scene/object/visualization/room/RoomPlane{Bitmap,Rectangle}Mask`, `RoomObjectTypeEnum`, `RoomEngineObjectPlacedOnUserEvent`, `RoomObjectPlacementSource`, `utils/NumberBank` |
| common | 6 | `utils/{FrameTimingsReporter,SelfProfiler,GlowFilter,GlowKernel,BitmapSlot,DateTimeFormatter}` |
| avatar | 4 | `enum/{AvatarBodyPartType,AvatarFigurePartType,GeometryType}`, `structure/EmbeddedAvatarAnimationData` |
| kernel / map-editor-core | 1 / 1 | `runtime/releaseProvider.ts`, `commands/setDecorState.ts` |

Dead-at-runtime network paths (`dead-sends.mjs`): **85 composers** are still `new`-ed by game code but registered in neither
`HabboMessages.ts` (60 ids) nor `NewStyleHeaders.ts` (43). `SocketConnection.send()` drops them with
`log.once('unknown-composer:…').warn` (SocketConnection.ts:221). Examples: `ChatMessageComposer`, `ShoutMessageComposer`,
`DanceMessageComposer`, `MoveObjectMessageComposer`, `PickupObjectMessageComposer`, 23 moderation/rights composers in
`session/RoomSession.ts`, `GetPetInfoMessageComposer` (UserDataManager), `UpdateFloorPropertiesMessageComposer`
(BCFloorPlanEditor). Protocol folders of cut modules (`navigator` 10 files, `notifications` 9, `help` 6, `inventory` 6,
`friendlist`, `moderation`, `quest`, `tracking`, `wardrobe`, `hotlooks`, `perk`, `preferences`) are kept alive only by
these importers (`RoomSessionHandler`, `RoomUsersHandler`, `SessionDataManager`, `AvatarEditorMessageHandler`,
`HotLooksModel`, `WardrobeModel`, `RoomEngine`, `BCFloorPlanEditor`…). The 60-message contract itself imports only
`incoming/{room,handshake,avatar,availability,notifications}` and `outgoing/{room,index}`.

Other deadness: `inversify` and `reflect-metadata` are dependencies of `packages/vortex-engine/package.json` (lines 17, 20) with
**zero** imports anywhere in `packages/*/src`. `packages/ambreia-game/src/hurlant/` (3 files) is alive through
`utils/CommunicationUtils.ts`. `avatar/hotlooks/`, `avatar/wardrobe/` are reached from `HabboAvatarEditor.ts` though their
server messages are not in the contract (HotLooks/Wardrobe composers are among the 85 dead sends). Layouts: **175 of 269**
`vortex-client/src/vortex-layouts/*.xml` are referenced by no code or test (achievement 15, craft 18, dungeon 13, market 14,
quest 12, shop 8, social 12, guild 5, friends 4, group 3, bestiary 5, derby 4, fishing 6, map_editor 19, hud_* 3…): design
mock-ups loaded by the window manager's folder glob at every boot.

### A5. Source-of-truth table

| Artifact | Source | Generator | Freshness check | Edit guard |
|---|---|---|---|---|
| `protocol/src/Headers.generated.ts` | emulator `Vortex.Revisions/Revision20260701/Headers.cs` | `pnpm gen:headers` | pre-commit `gen-headers --check`, **silently skipped when the emulator is absent** (`gen-headers.mjs:22-29`: "A clone without the emulator beside it cannot regenerate: let it commit"); `no-literal-ids` test checks ids exist in the committed file only | guard-edits refuses `*.generated.ts` |
| `game/src/features/combat/vfxSheets.generated.ts` | `vortex-client/spells/<folder>/<name>.json` | `pnpm gen:vfx` / before `pnpm dev` | **none** at commit; `build-vfx-sheets.test.mjs` tests the generator, not the staleness | guard-edits |
| `map-editor-core/src/zone/Zone.generated.ts` | emulator `schemas/zone.schema.json` | `pnpm --filter @ambreia/map-editor-core gen:types` | `boundaries.test.ts:24`, **skipped without the emulator** | guard-edits |
| `vortex-client/src/assets/window-layouts/**`, `window-skins/**` | AS3 dump `sources/**/*Com.as` | `tools/build-window-assets.mjs` | none (dump is static) | guard-edits path rule |
| `.ambreia` pieces, `vortex-client-assets.zip` | `sources/` + nitro | `install.mjs`, `build:ambreia` | `check-release-bundle.test.mjs` (names) | none (binary) |
| `AGENTS.md`, `.github/copilot-instructions.md` | `CLAUDE.md` + `.claude/rules/*.md` | `pnpm sync:agents` | pre-commit `sync-agent-docs.mjs` | none (would be overwritten) |
| `.vortex-dev/` engine bundle | engine sources | `vite-plugin-engine-bundle.mjs` | rebuilt by dev server | guard-edits |
| `docs/IMPLEMENTATION_STATUS.md` counts | trees | manual | frozen ("Last updated 2026-09-07") | — |

### A6. Legacy / new share (by file count; `// AS3:` presence + path heuristics; git history is squashed to 62 commits dated 2026-10-09/10, unusable)

| pkg | files | with `AS3:` | inherited (traced or untraced hotel code) | ported-modernized (TS-only/DEVIATION dense) | new Ambreia architecture | new RPG feature | generated |
|---|---|---|---|---|---|---|---|
| common | 57 | 28 | ~35 % | ~15 % (Logger, AssetLibrary rewrites: 102 `TS-only`) | ~50 % (`assets/pack/`, `reactive/`, `platform/`) | 0 | 0 |
| net | 32 | 15 | ~45 % | ~15 % | ~40 % (`style/MessageMap`, `PacketTap`, `PacketLogger`) | 0 | 0 |
| avatar | 86 | 76 | ~85 % | ~10 % | ~5 % (render options, Node platform) | 0 | 0 |
| ui | 355 | 267 | ~75 % | ~15 % (199 `TS-only`) | ~10 % (`kit/` generic manager, parsers) | 0 | 0 |
| kernel | 32 | 17 | ~50 % (`runtime/`) | ~5 % | ~45 % (`feature/`, `config/`) | 0 | 0 |
| iso | 379 | 294 | ~78 % | ~12 % | ~7 % (`IsoStage`, `register*`, zone) | ~3 % (RPG additions, telegraphs) | 0 |
| protocol | 535 | 222 | ~80 % (hotel messages, most without marker) | ~2 % | ~1 % (`NewStyleHeaders`, `HabboMessages`) | ~17 % (`*/rpg/*` ≈ 91 files) | 1 |
| game | 403 | 228 | ~65 % | ~10 % | ~8 % (`features/index.ts`, `core/`, `GameFeature`, `RoomWidgetRegistry`) | ~16 % (`features/{hud,combat,skills,chat,character,inventory,interaction,login}` ≈ 65 files) | 1 |
| vortex-engine / client | 6 / 7 | 3 / 3 | ~40 % | ~40 % | ~20 % | 0 | 0 |
| glaze, imager, map-editor(-core) | 35 / 20 / 137 | 0 / 1 / 0 | 0 | 0 | 100 % | 0 | 1 (Zone) |

Sample of 30 inherited files (10 iso, 8 ui, 6 game, 3 avatar, 3 protocol): all 30 carry `// AS3:` lines with a readable
member name; 4 carry `DEVIATION`, 0 carry `TODO(AS3)` (2 exist repo-wide, both in game). Traceability discipline is good.

### A7. TypeScript quality markers per package (regex counts)

| pkg | `any` | `as X` casts (code lines) | `as unknown as` | `x!` non-null | `\| undefined` in types | `== null` | `\|\| ''` | `\|\| 0` |
|---|---|---|---|---|---|---|---|---|
| avatar | 110 (AvatarStructure 11, FigureSetData 9, PartSetsData 7: XML → structure) | 26 | 1 | 0 | 0 | 74 | **35** | **72** |
| common | 1 | 37 | 17 | 0 | 1 | 63 | 1 | 8 |
| game | 15 | **724** (RoomEngine 102, RoomMessageHandler 98 = `event as XMessageEvent` at the wire; SkillsWindow 34, ChatPanel 34 = `findChildByName() as I…Window`) | 94 | 1 | 0 | 1443 | 1 | 4 |
| iso | 10 | 157 | 54 | 8 | 0 | 1356 | 1 | 34 |
| kernel | 4 | 19 | 3 | 0 | 0 | 24 | 0 | 0 |
| net | 2 | 19 | 1 | 0 | 0 | 6 | 0 | 0 |
| protocol | 0 | 19 | 0 | 4 | 0 | 56 | 0 | 0 |
| ui | 83 (`Classes.ts` 66 = class registry) | **528** (ItemGridController 58, WindowController 42) | **391** (`this._root as unknown as IWindow`) | 0 | 3 | 396 | 1 | 3 |
| glaze | 1 | 140 | 134 | 0 | 0 | 6 | 0 | 2 |

---

## (B) Findings

**MT-01 | HIGH | Confidence high | Lifecycle / memory**
Evidence: `kernel/src/feature/bootFeatures.ts` has no teardown function; `attach()` returns `[]` for `product === null`;
`ComponentContext.ts:629+35` wraps plain instances with `dispose: (): void => undefined`; all 7 RPG features return `null`
(`combat/feature.ts:311`, `skills/feature.ts:366`, `hud/feature.ts:171`, `chat/feature.ts:51`, `inventory`, `interaction`,
`character`); `VortexMain.dispose()` (414-461) never touches them; skill `new-game-feature`: "dispose() … is called only on
what create returns".
Files/Symbols: `bootFeatures`, `IGameFeature`, `VortexMain.dispose`, every `features/*/feature.ts`.
Observed: feature state, listeners on `roomSession.sessionEvents`, `globalThis` keydown listeners (skills:321,
interaction:86, inventory:135), `session.install()` uninstalls, `CombatOverlay`/`CombatVfx`/`HudView`/`HudPanelsView`
instances and the `__ambreia` globals survive `Vortex.dispose()`.
Why it matters: `Vortex.dispose()` is a half-dispose. Today the app lives once per page load so the leak is invisible; the
documented "in-process alternative" (VortexMain.ts:1022, reboot without reload) and any future hot-swap would duplicate
every listener and keep the first boot's game graph alive through `window → keydown closure → host → made → *`.
Failure scenario: reboot in page → pressing `i` opens the inventory of the dead boot on a disposed window manager (throws
once per keypress); two `hits` listeners draw numbers twice.
Recommended architecture: `IFeature.create` returns a product **or** `{instance?, dispose()}`; `bootFeatures` returns
`{report, dispose()}` that calls products' `dispose` in reverse order; `IGameFeature` features return `{dispose}` closures
that `off()` their session listeners, remove keydown listeners, clear timers, delete their `__ambreia` key.
Minimal fix: in each feature, collect `const cleanups: Array<() => void> = []` and return `{instance: {dispose: () => cleanups.forEach(f => f())}}`
under a dedicated IID (or let `FeatureProduct` accept `{dispose}`); call it from `VortexMain.dispose()` via the kernel report.
Long-term: a `FeatureScope` helper (`scope.on(emitter, ev, fn)`, `scope.listen(window, 'keydown', fn)`,
`scope.interval(fn, ms)`) so acquisition and release are one call; a kernel test "boot, dispose, boot again: listener counts
and `__ambreia` keys equal the first boot's".
How to verify: `bootFeatures` + `dispose()` twice in `features.test.ts`, assert `sessionEvents.listenerCount(RSE_ENDED)` returns
to 0 and `globalThis` keydown listeners are removed (count via a stub `addEventListener`).
False-positive review: retained path confirmed (`globalThis.addEventListener('keydown', closure)` with no `removeEventListener`
in any feature; `__ambreia.<id>` assigned unconditionally in prod). Severity is HIGH for the in-process reboot path only;
for the page-reload lifecycle it is a design debt, not a user-visible leak.
Regression risk: low (additive). Effort: M.

**MT-02 | MEDIUM | high | Combat lifecycle**
Evidence: `combat/feature.ts:238` `countdown = setInterval(…)` cleared only when `left <= 0` (245) or on the next death
(236); RSE_ENDED handler (262-271) does not clear it. `feature.ts:98` `setTimeout(go, phase.delayMs)` and `:176`
`setTimeout(() => play(...), delay)` run after a room change; `play()` → `vfx.burst()` → `this._stage()` =
`host.made.roomEngine` → `rpgOverlay` of **the new active room** (`RoomEngine.ts:6163`), and `playRpgGroundSheet(objectId)`
(6206) looks up `getRoomObject(this._activeRoomId, objectId, USER)`: room object ids are per room, so a delayed hit lands
on whoever has that id in the next zone.
Files/Symbols: `CombatFeature.create` (`play`, `fire`, `death` handler), `CombatVfx.burst/loop`, `RoomEngine.playRpgGroundSheet`.
Observed: cosmetic: a stale burst/number in the next room; the death alert keeps counting in the new zone (bounded ≤ respawn s).
Why it matters: every delayed effect is a future write into whatever room is active; the content decides the delays
(`IVfxPhase.delayMs`), so a 3 s telegraph is enough to cross a zone change.
Failure scenario: die, leave during countdown → the HUD alert still says "dead in N s" in the new zone; cast a slow
projectile, change zone → the hit sheet plays on a random avatar.
Recommended architecture: a per-session generation token in the feature (`let epoch = 0; RSE_ENDED → epoch++`); every
timer closure captures `epoch` and returns if changed; keep timer handles in a `Set` cleared on RSE_ENDED.
Minimal fix: `if(countdown !== null) clearInterval(countdown); countdown = null;` in RSE_ENDED; wrap `setTimeout(go, …)`
with the epoch check.
How to verify: unit test with a fake host: emit `hits` with a `hit.delayMs > 0`, emit RSE_ENDED, advance fake timers, assert
`vfx.burst` not called.
False-positive review: `room` is nulled on RSE_ENDED so `isMonster()` → false and `gesture()` is skipped, but `play()` does
not read `room`; the stage getter reads the live engine. Confirmed by reading `CombatVfx.burst` (no room check).
Regression risk: low. Effort: S.

**MT-03 | MEDIUM | medium | Combat overlay growth / RAF**
Evidence: `CombatOverlay.ts` `_bars` entries are removed only by `remove()` (called at `feature.ts:143,178` for **killed
monsters**) or `clear()` on RSE_ENDED; `UserRemoveMessageEvent` (`RoomUsersHandler.ts:74,221`) is not relayed; `_tick`
`again ||= bar.always || bar.hurt` keeps `requestAnimationFrame` running as long as **any** monster bar exists.
Observed: a hurt player who leaves the zone keeps an invisible bar window (`visible = false`, anchor lookup fails each frame);
in a zone with monsters the overlay ticks every frame for the whole visit even with nothing visible on screen.
Why it matters: per-frame `getRpgAnchor` × stale entries, plus one leaked `vortex_combat_bar_xml` window per departed hurt
player per zone visit (bounded by the visit, released on RSE_ENDED).
Recommended: listen to a user-removed session event (add `RSUDUE_USER_REMOVED` or reuse `RoomSessionUserDataUpdateEvent`) and
call `overlay.remove(id)`; stop the RAF when no bar is actually shown (`shown` count) and restart on `setHealth`.
Minimal fix: in `_tick`, track `let shown = 0` and only `run()` again if `shown > 0 || _numbers.length || _casts.size || _yells.size`.
How to verify: `__ambreia.combat.simulate()` then `eval` a counter on `requestAnimationFrame` calls over 2 s with no monster on screen.
False-positive review: `always` bars are legitimately shown while a monster is on screen; the issue is the invisible ones.
Regression risk: low. Effort: S.

**MT-04 | MEDIUM | high | Dead network paths kept as live code**
Evidence: `dead-sends.txt`: 85 composers instantiated by game code and registered nowhere (e.g. `RoomSession.ts` sends
`ChatMessageComposer`, `DanceMessageComposer`, `KickUserMessageComposer`…; `RoomEngine.ts` `MoveObjectMessageComposer`,
`PickupObjectMessageComposer`, `ThrowDiceMessageComposer`; `SessionDataManager.ts` `RespectUserMessageComposer`,
`GetUserNftChatStylesMessageComposer`). `SocketConnection.ts:217-221`: unknown composer → `log.once(...).warn` and return.
Why it matters: a reader of `RoomSession.sendChatMessage()` sees a working send; the server never receives it. CLAUDE.md says
the contract is the 60 messages; the code still carries ~85 send sites of cut modules, each a trap for "why doesn't X work"
and a reason the cut protocol folders (navigator, help, notifications, moderation, wardrobe, hotlooks, perk, quest, tracking)
cannot be deleted.
Recommended: a protocol test `no-dead-sends`: every `new XMessageComposer(` under `game/src` must name a composer registered
in `HabboMessages.ts` (same for `new XMessageEvent(` outside `communication/`). Delete the 85 call sites and the folders they
hold alive, in one reviewed pass (the tag `pre-noyau-client` keeps them readable).
Minimal fix: the test above as `test.todo` listing the 85, promoted to failing once the pass is done.
How to verify: rerun `dead-sends.mjs` → 0; `orphans3.mjs` protocol count drops; typecheck green.
Regression risk: medium (RoomSession/RoomEngine are large; delete method by method). Effort: M–L.

**MT-05 | MEDIUM | high | Orphan tool stale, dead code invisible**
Evidence: `find-orphans.mjs:139-146` scans `packages/vortex-engine/src` + `packages/vortex-client/src` with aliases
`@core/@habbo/@room/@iid` (gone since J6) → prints `0 orphan file(s)`; barrel-aware scan finds 205 (A4).
Why it matters: CLAUDE.md lists the script as the deletion path ("a deletion goes through a reviewed path list"); it currently
blesses everything. `ui/motion/` (16 files), `ui/kit/utils/tableview/` (8), `game/perf/` (789 lines), `game/utils/animation/`
are unreachable and still linted/typechecked each run.
Recommended: port `find-orphans.mjs` to resolve `@ambreia/<pkg>/<path>` (the map in `orphans3.mjs`), scan every `packages/*/src`,
take `test/`, `tools/`, `sandbox/`, `app/` as roots, follow named imports through barrels; add a test asserting the count
does not grow (`orphans.baseline.json`).
Minimal fix: replace the `aliases`/`scan` block; expected 205 → review list.
Regression risk: none (listing tool). Effort: S.

**MT-06 | MEDIUM | high | Hooks and gates miss non-`.ts` and tool files**
Evidence: `hooks/lib.mjs` `changedTypeScript()` keeps only `path.endsWith('.ts')`; `check-on-stop.mjs` exits 0 when
`touched.length === 0`; `eslint-on-edit.mjs` scope `^packages/[^/]+/(src|tools)/.+\.(ts|mjs)$`; lint-staged
`packages/*/src/**/*.ts`; ESLint walls `files: ['packages/*/src/**/*.ts']` (eslint.config.mjs:36,162,194…); `.claude/scripts/*.mjs`
are linted by neither hook; `pnpm lint` is red on `packages/vortex-client/tools/{relink-furnidata-offers,skins-to-css,textstyles-to-css}.mjs`
(6 errors) and `.claude/skills/design-habbo-window/previews/*.js` (414 `no-undef`).
Observed: a session that edits only `vortex-layouts/*.xml`, `locales/*.json`, `config.json`, a `.mjs` tool or a test
`.test.mjs` ends with no `pnpm check`; a test or tool may import across a layer wall (not walled); `stop_hook_active` lets the
second stop through, so one red run is enough to end the turn.
Why it matters: the RPG work is XML/JSON heavy (175 unreferenced layouts, locale files); the Stop gate does not see it.
Recommended: `changedTypeScript` → `changedSources` matching `\.(ts|mts|mjs|json|xml)$` under `packages/` and `.claude/scripts/`;
add `packages/*/test/**/*.ts` and `packages/*/tools/**/*.mjs` to the wall blocks with the same `wall()`; make `pnpm lint` green by
ignoring `.claude/skills/**/previews/**` and fixing the 6 tool errors; run `pnpm lint` in `pnpm check`.
Effort: S.

**MT-07 | MEDIUM | high | Generated artifacts without a freshness gate off the owner's machine**
Evidence: `gen-headers.mjs:22-29` skips `--check` when the emulator is absent; `Zone.generated.ts` test skipped likewise;
`vfxSheets.generated.ts` has no `--check`; A5.
Why it matters: a CI (none exists) or a contributor without `../vortex-rpg-emulator` can commit stale headers; the two
registration tests then validate the client against itself.
Recommended: commit a `Headers.cs` fingerprint (sha + revision name) next to `Headers.generated.ts`; `--check` compares the
fingerprint when the emulator is absent and fails loudly instead of skipping; `build-vfx-sheets.mjs --check` in pre-commit;
a GitHub workflow running `pnpm check` + `pnpm lint` on push (the repo has `.github/` but no workflow).
Effort: S (fingerprint), S (workflow).

**MT-08 | MEDIUM | high | Spec/skill/code contradictions a newcomer hits**
Evidence: spec §4 (`design.md:102-150`) declares `map`, `roomLogics`, `chatCommands`, colocated `layouts/*.xml` and
`locale/*.txt`, `create: ctx => new FishingManager(ctx)`, "features talk by typed events", "removing = delete the folder +
the line"; `IGameFeature` has only `images` and `roomWidgets`; features return `null`; cross-feature reads go through
`host.made.<slot>` (75 optional-chained reads, 21 slots in `IEngineManagers`), which the spec never mentions (0 hits for
`made`); layouts live in `vortex-client/src/vortex-layouts/`, locales in `vortex-client/src/locales/{fr,en}/`; removing a
feature means also removing its slot, its `emptyManagers()` entry and its `import type` in `features/index.ts`. CLAUDE.md
"A manager is a feature … a DI `Component` or a plain instance under an IID" vs the 7 RPG features that are neither.
PATTERNS.md "Component Lifecycle: every manager and service extends `Component`" vs `new-game-feature` ("plain class with
`readonly events`"). 26 feature→feature internal imports exist (`../character/WindowBits` ×13, `../hud/chatModel` ×4,
`../hud/PlayerHudState`, `../inventory/InventoryView`, `../combat/vfxSheets`…) with no ESLint rule (`eslint.config.mjs`
mentions `features` only in a comment).
Why it matters: three documents give three feature shapes; the executable one (the skill) is the only correct one.
Recommended: update spec §4 with `host.made` or replace `host.made` with typed events/IIDs as the spec says; move
`WindowBits`, `chatModel` to `features/_shared/` or `game/src/ui/`; add a wall `features/<a>/** ↛ ../<b>/*` except `I*.ts`
interfaces and `_shared/`; PATTERNS.md gets a "Feature (closure) lifecycle" section that supersedes "Component Lifecycle"
for new code; CLAUDE.md line "A manager is a feature" → "a feature is a closure returning `null` or a product".
Effort: S (docs), M (wall + moves).

**MT-09 | LOW | high | `dispose()` convention not met in inherited engines**
Evidence: A2 — 169/348 classes without `_disposed` guard, 195 with `dispose()` not last; iso 76/94 unguarded.
Why it matters: CLAUDE.md states the convention as universal; a lint rule would make it checkable. Most iso classes inherit
the guard from a base (`RoomObjectSpriteVisualization`…); the count mixes real gaps with inherited ones.
Recommended: ESLint rule (custom, `no-restricted-syntax` cannot express it): a class with a `dispose()` method must read
`_disposed`/`disposed` in its first statement and declare it last; apply to `features/**` and `kit/**` first, baseline the rest.
Effort: S.

**MT-10 | LOW | high | Race: late continuations without a disposed/room guard**
Cases (guard present ✓ / absent ✗):
- `skills/feature.ts:154-176` `loadDefinitions` fetch → `session.define`, `renderBar()`, `window?.refresh()` after RSE_ENDED ✗
  (benign: definitions are global; `definitions = null` on failure → retried next room ✓).
- `inventory/feature.ts:48-55` texts fetch → `host.made.localization?.loadTexts` ✓ (optional chaining), `refresh()` ✗ harmless.
- `FurnitureExternalImageVisualization.ts:189-191` `.then(text => this.onExtraDataLoaded(text))` — no `disposed` read anywhere
  in the file ✗ (writes into a disposed visualization after a room change; inherited).
- `HabboCommunicationManager.ts:291` `setTimeout(checkConnection, 0)`: if `_connection` is still null one tick later the
  listener is dropped silently while the caller holds a working-looking unsubscribe ✗.
- `features/*/afterAttach`: `await Promise.resolve()` then `connection ?? null` else `log.warn` — no retry if the connection
  comes later ✗ (documented in the skill as the contract; fine today because `Communication` is first and essential).
- `AvatarRenderer` feature (`features/index.ts`): `configuration.events.once('complete', start)`; `assetDirectories === null`
  at that moment → `log.error` and avatars never load, no retry ✗ (depends on `AssetPacksFeature` ordering).
- `CombatVfx.shoot/play`: `queueMicrotask(() => { if(!sprite.destroyed) sprite.destroy(); land(); })` ✓ for the sprite; `land()`
  runs without a room check (see MT-02).
- Socket reconnect: none exists (`SocketConnection.ts:616` "nothing reconnects") → no reconnect race; the session just dies.
Recommended: epoch token (MT-02) for features; `if(this.disposed) return` in `onExtraDataLoaded`; `checkConnection` re-arms
until `_connection` exists or the unsubscribe is called. Effort: S each.

**MT-11 | LOW | medium | Error boundaries: good at the edges, uneven inside**
Classification and where it lands:
- Developer bug in a feature `create()` → `bootFeatures` has no try/catch → rejection → `App.init().catch` → `loadingScreen.showError()`
  (`index.ts:45-50`): fatal and visible ✓.
- Bug in an incoming handler → `SocketConnection.handleReceivedMessage` try/catch per message → `log.error` + `messageParseError` ✓
  (not fatal); byte-stream desync → `processReceivedData` catch → `close()` ✓ (SocketConnection.ts:400-416).
- Bug in a `Component.update()` → `simpleFrameUpdateHandler` catches per receiver (CoreComponentContext.ts:973-977) ✓; the
  `debugFrameUpdateHandler` path has "No try/catch — errors propagate" (1125) — selected by config only.
- Bug in an `eventemitter3` listener (`session.events.emit('hits')`) → propagates to the message handler catch ✓, but the
  remaining listeners of that emit do not run (eventemitter3 semantics).
- Bad server data: parsers do not validate (`outcome`, `channel`, `code` are `string`; no switch, no default): consumers use
  `Set.has` with fallbacks (`CHANNELS` → `'system'`, `MISSED`, `textOr(key, fallback)`) ✓ degrade gracefully.
- Bad asset: `AmbreiaPieceLoader.ts:151,168` `log.once(...).warn/error` ✓; `AvatarRenderer` → `log.error` + nothing drawn.
- Configuration: Zod strict sections → boot error ✓ (`loadConfig.ts:96,106`).
- Swallow points: empty/comment-only `catch` — ui 14, vortex-client 5, game 3 (`chatModel.ts` localStorage, `LoginScreen.ts`,
  `ApiRequest.ts`), map-editor 3, common 2, engine 2 (`Vortex.unloading`), imager 1, map-editor-core 1. The ui ones are
  inherited DOM/clipboard guards; acceptable. `host.made.*?.` optional chaining: 75 sites turn a missing feature into a silent
  no-op by design (skill: "may be null (optional chaining, a `log.warn` when it matters)") — only `log.warn` in afterAttach.
- What the user sees: boot failure → loading screen error text ✓; runtime crash → `Vortex.reportCrash` logs and emits `'crash'`
  (Vortex.ts:406-425); **no listener of `'crash'` found in `packages/*/src`** (not verified exhaustively: grep `on('crash'` → 0);
  BugReporter (DOM `<dialog>`, 40 console lines, `unhandledrejection`, POST `/webapi/api/user/reports`) is the only user-facing
  channel and it is manual.
Recommended: a `'crash'` listener in `App.ts` that opens the BugReporter dialog pre-filled; `error_handling.crash_on_critical_error`
documented; a kernel test that a throwing `update()` does not stop other receivers. Effort: S.

**MT-12 | LOW | high | Logger**
Levels: TRACE..SILENT; build default INFO in dev, WARN in prod (`Logger.ts:configureFromEnvironment`), `?log=` and
`localStorage vortex:log` specs, `__log.{list,level,set,only,reset,timestamps,spec}`; disabled levels are a shared NOOP
bound property (zero wrapper cost); `once(key)` keyed in a static `Set` — keys are urls/type/class names
(`missing:${url}`, `unknown:${type}`, `unknown-composer:${name}`…) so growth is bounded by distinct names ✓. Per-packet
`PacketLogger.incoming()` returns when `_enabled === false` (default) ✓; `log.trace` per packet is NOOP in prod ✓.
Namespaces: the ESLint selector enforces a dot (`eslint.config.mjs:73`) but not the root; roots in use: `habbo.*` (game 58,
iso 11, avatar 6, ui 3, protocol 1, common 1), `core.*` (common 16, ui 6, kernel 5, net 3, game 1), plus `kernel`, `iso`,
`room`, `ui`, `common`, `client`, `glaze`, `imager`, `map` — the package rename left `habbo.`/`core.` as the dominant roots
across every package, so `__log.set('iso', …)` catches 2 of the 16 iso loggers.
Recommended: one root per package (`common.`, `net.`, `avatar.`, `iso.`, `ui.`, `kernel.`, `protocol.`, `game.`), enforced by
extending the selector with the package's root; a codemod pass. Effort: S.

**MT-13 | LOW | medium | TypeScript boundaries**
Where casts concentrate (A7): wire boundary (`RoomMessageHandler` 98 `event as XMessageEvent`: the inherited event style has
no generic), window lookups (`findChildByName(...) as I…Window`, 391 `as unknown as` in ui: the AS3 interface lattice vs the
TS class tree), DI (`Core.instance as CoreComponentContext`), XML → structures (`avatar` 110 `any`). None is at the parser
level (protocol 0 `any`, 19 casts). `| undefined` rule: 10 violations, all outside the walled `src` globs or in `.d.ts`-like
files; `x!`: 13. AS3 semantics: avatar `|| ''` 35, `|| 0` 72, iso `|| 0` 34 — values where 0/'' are legitimate (`x || 1`
is called out in `30-as3-traceability.md`); `== null` idioms 1443 (game) / 1356 (iso) are the port's style, consistent.
Server discriminators are `string` with Set/fallback handling, not unions: no exhaustiveness, but no crash on an unknown value.
Recommended: a typed `findChild<T>(name, guard)` in `WindowBits` to retire the window casts in features; union types for
`outcome`/`channel`/`code` with `satisfies` on the Sets (chat already uses `satisfies ChatChannel[]`). Effort: S–M.

**MT-14 | LOW | high | Duplicate-registration checks that do not exist**
`featureSections()` (`defineFeature.ts`) builds `new Map(features.map(...))` → a duplicate feature `id` silently keeps the last
schema; `host.made` slots are assigned by convention (two features writing the same slot = last wins, untested); three
features add their own `globalThis` keydown listener (skills 1-6/K/Escape, interaction Escape, inventory I/C) with no registry —
Escape is handled by two features (both intentional today); `roomWidgetRegistry` **does** refuse duplicates with both names ✓
(`feature-extensions.test.ts:48`). Recommended: `bootFeatures` throws on duplicate `id`; a `HotkeyRegistry` feature-extension
(`hotkeys: {'k': open}`) refusing duplicates like `roomWidgets`; a test that every `IEngineManagers` slot is written by exactly
one enabled feature. Effort: S.

**MT-15 | LOW | high | Unused dependencies and leftover tooling**
`inversify@^6.2.1`, `reflect-metadata@^0.2.2` in `vortex-engine/package.json` with zero imports; `game/src/perf/*` (789 lines,
10 DOM listeners never removed) and `RoomStressTest.ts` unreachable; `IRoomEngine.setFpsCounterEnabled` has no caller (the
`:showstats` chat command went with the chat cut) so the only in-canvas perf overlay is unreachable. Effort: S.

---

## (C) Positive findings

- **KEEP** `SocketConnection` per-handler try/catch + fatal desync close with its AS3 rationale (lines 400-416); `MessageMap.install`
  refusing a header served twice; `log.once` for dropped packets.
- **KEEP** `Logger` design (bound sinks, `__log`, `?log=`, `once`, `group`), `PacketLogger` off by default, `IPacketTap`.
- **KEEP** `bootFeatures` dependency check with named errors and `essential`; Zod strict sections (`"No configuration section"`).
- **KEEP** `boundaries.test.mjs` (23 probes lint a virtual file at a path: cheap and exact), `room-registries.test.ts`,
  `no-literal-ids`, `served-headers`, the strict `wire()` reader in `rpg-*.test.ts`.
- **KEEP** hooks: `guard-edits` (sources/, generated, built assets, `.vortex-dev`), `eslint-on-edit` returning wall errors in
  the same turn, `check-on-stop` with transcript-birth mtime filter and fingerprint cache; `sync-agent-docs` kept honest by pre-commit.
- **KEEP** `RoomContentLoader.purge()` reference-counted eviction with `CONTENT_DROP_DELAY`; `AvatarImageCache.disposeInactiveActions(60 s)`;
  `HudPanelsState` `CHAT_HISTORY = 50`; `CombatOverlay` number pooling and swap-remove ("splice() would allocate… every frame").
- **KEEP** `CombatVfx` self-advancing sprites (`onRender`, `queueMicrotask` destroy), textures cut once per sheet.
- **KEEP** `CharacterScreen` disposed on RSE_STARTED; `HudTooltips`/`HudView` timers cleared; `IsoStage.dispose` guarded.
- **KEEP+STRENGTHEN** `run-vortex-client/driver.mjs` (`eval`, `errors`, `net`, screenshots over CDP) → add `heap`, `metrics`, `gc` (below).
- **KEEP+STRENGTHEN** `FrameTimings` + `instrumentRendererTimings` + the `:showstats` text (fps, room/obj/sort/spr, pixi, ui, net, mem, halted) → expose through `__ambreia.perf()` and a key.
- **KEEP+STRENGTHEN** `__ambreia.{kernel,boot,hud,skills,combat,inventory,interaction,characters}` dev hooks → a typed registry, cleared on dispose.
- **REFACTOR** `find-orphans.mjs` (MT-05), `features/index.ts` `IEngineManagers` slot pattern (MT-08), feature closures → disposable (MT-01).
- **REPLACE** the 85 dead composer sends and the hotel protocol folders they pin (MT-04); `perf/` and `RoomStressTest` by a reachable `__ambreia.perf` (MT-15).

---

## (D) Scorecards (0–10)

| Axis | Score | Why |
|---|---|---|
| Memory safety | 5 | Caches are bounded or ref-counted and per-frame paths allocate nothing; but features have no teardown (MT-01), delayed combat work crosses rooms (MT-02), overlay entries and RAF outlive their objects (MT-03), half the classes ignore the dispose convention (MT-09). No measurement protocol exists. |
| Testing | 6 | 369 fast tests, strong contract/registry/boundary layer; zero visual, integration, perf or memory tests; the two render tests skip everywhere but the owner's machine; registration tests validate against a file that cannot be checked without the emulator. |
| Observability | 4 | Good primitives (Logger, FrameTimings, PacketLogger, `__ambreia`, BugReporter) but the perf overlay is unreachable, perf tools are orphaned, `'crash'` has no listener, no telemetry, no FPS/object/texture/socket counters exposed together. |
| Tooling | 7 | Hooks, husky, boundaries probes, move-modules, wire-diff, gen-headers are precise; gaps: no CI, `pnpm lint` red, non-`.ts` edits ungated, stale orphan tool, skip-when-absent freshness checks. |
| Developer experience | 6 | Skills are the best docs in the repo (golden paths in ≤3 lookups for message/feature/window); contradictions between spec §4, PATTERNS.md, CLAUDE.md and the code; 175 unreferenced layouts and 85 dead sends mislead readers. |
| AI-safety | 7 | An agent cannot edit sources/generated/built assets, gets wall errors at edit time, must pass `pnpm check` on `.ts` changes, cannot invent ids (`no-literal-ids`); it can still edit `.xml/.json/.mjs` and stop without a check, import across walls from tests/tools, duplicate a feature id or a hotkey, and add a feature→feature import. |

---

## (E) Proposed fitness functions (rule → mechanism → effort)

| # | Rule | Mechanism | Effort |
|---|---|---|---|
| F1 | A feature declares nothing it cannot undo | `features.test.ts`: `bootFeatures` + `dispose()` twice; listener counts and `__ambreia` keys equal after each cycle | M (needs MT-01) |
| F2 | No composer is sent that no style serves | `protocol/test/no-dead-sends.test.ts`: regex `new (\w+Composer)\(` over `game/src` ∩ not in `HabboMessages` ∪ `NewStyleHeaders` → fail | S |
| F3 | No feature imports another feature's internals | ESLint block `files: packages/ambreia-game/src/features/*/**`, `no-restricted-imports` pattern `../*/!(I*)` with an allow-list `_shared/`; probe in `boundaries.test.mjs` | S |
| F4 | Tests and tools obey the walls | add `packages/*/test/**/*.ts`, `packages/*/tools/**/*.mjs` to the wall blocks; 2 probes | S |
| F5 | Generated files are fresh without the emulator | fingerprint file beside each `*.generated.ts`; `--check` compares it; `build-vfx-sheets --check` in pre-commit | S |
| F6 | Orphan count never grows | `find-orphans.mjs` rewritten (workspace + barrel aware) + `orphans.baseline.json` test | S |
| F7 | Every layout shipped is referenced or declared as a mock-up | test: `vortex-layouts/*.xml` ∖ (code refs ∪ `mockups.txt`) = ∅ | S |
| F8 | Unique feature ids / slots / hotkeys | `bootFeatures` throws on duplicate id; `hotkeys` extension with registry (like `roomWidgets`); test that each `IEngineManagers` slot has one writer | S |
| F9 | `dispose()` last and guarded | custom ESLint rule scoped to `features/**`, `kit/**`, `net/**`, baseline elsewhere | S |
| F10 | Logger root = package | extend the `getLogger` selector per wall block (`^iso\.` under `packages/ambreia-iso/src/**`) | S |
| F11 | Removing a demo feature keeps the build green (spec J6) | test: compile `features/index.ts` with `SyntheticFeature` removed through a generated variant; requires slots to move out of `IEngineManagers` | M |
| F12 | Stop gate sees every source kind | `changedSources` (`.ts/.mts/.mjs/.json/.xml` under `packages/`, `.claude/scripts/`) | S |
| F13 | Lint is a gate | fix 6 tool errors, ignore `previews/**`, add `pnpm lint` to `pnpm check` and a GitHub workflow | S |
| F14 | Property-based round-trips | fast-check: `wireformat` writer→reader (int/short/string/bool/list, random lengths), `.ambreia` pack writer→`AmbreiaPieceLoader`, `XMLVariableParser`/`WindowXmlAssetParser` on generated attribute sets, zone JSON `withShape/translateElement` invariants, depth-sort comparator (transitivity, stability on `RoomObjectSortableSprite`) | M |

Synthetic test feature (brief §109) — feasibility against current APIs: register ✓ (`bootFeatures(context, [...GAME_FEATURES, Synthetic], config, fakeHost)`
as `features.test.ts`/`asset-packs-feature.test.ts` do); resolve DI ✓ (`provides: [IID]`, `context.queueInterface`); message ✓
(`MessageMap.install(fakeConnection)` as `message-map.test.ts`); window ✓ in Node for layout loading (`window-manager.test.ts`)
but not for rendering; room widget ✓ (`roomWidgetRegistry`); object logic ✓ (`registerFurniture`-style registries,
`room-registries.test.ts`); config ✓ (`loadConfig` + `featureSections`); **dispose ✗** (no API: the test would document MT-01);
"without editing core" ✗ for anything another feature reads (needs an `IEngineManagers` slot). Verdict: 6 of 8 steps testable
today in one file; the two misses are the two architectural gaps.

---

## (F) Protocols

### F-a. Leak tests (dev client, `node .claude/skills/run-vortex-client/driver.mjs …`)

Start Chrome with `--js-flags=--expose-gc` (add to the driver's launch args, or `eval "gc && gc()"` is undefined otherwise).
Probe (one `eval`, reuse as `P`):
```js
(() => { const r = Vortex.instance?.application?.renderer; const wm = __ambreia.hud?.inspect?.();
 return { heap: performance.memory?.usedJSHeapSize, tex: r?.texture?.managedTextures?.length,
   children: Vortex.instance?.application?.stage?.children?.length,
   desktop1: __ambreia.hud ? (Vortex.instance?.application?.stage?.getChildAt?.(0)?.children?.length ?? null) : null,
   onceKeys: 'n/a', loggers: __log.spec() }; })()
```
(`Vortex.instance` is exposed by `App.ts`; the window-manager desktop child count needs a small `__ambreia.windows = () => desktop.children.length` hook — one line in `features/hud/feature.ts`.)
1. **Enter/leave ×50**: with the emulator, `goto …?sso=T`, wait room, `P` → baseline; loop 50× `eval "__ambreia.interaction.session…"`
   is not enough: zone change needs the server; use the dev route (`Vortex.instance.openAvatarEditor` pattern) or a server test
   command that teleports between two zones; after each 10 cycles: `eval "gc()"`, `P`. Pass: heap slope < 1 MB/10 cycles after
   cycle 10; `tex` returns to baseline ± sheets cut by `CombatVfx` (≤ 5 sheets); desktop children constant.
2. **Open/close UI ×100**: `key k` ×100 (skills window show/hide), `key i`/`key c` ×100, `eval "__ambreia.hud.hide(); __ambreia.hud.show()"` ×100,
   avatar editor `eval "Vortex.instance.openAvatarEditor()"` + close ×50; `gc()` + `P` every 25. Pass: desktop children and
   `tex` constant (feature windows are singletons; a growth means a layout rebuilt per open).
3. **VFX spawn ×N**: in a zone with one avatar id `X`: `eval "__ambreia.combat.simulate(X)"` ×200 at 100 ms, then
   `simulate(X,'cast')` ×50 without `cast null` (edit the dev hook to skip the `setTimeout(() => cast(null))` for this run);
   `gc()` + `P` + `eval "Vortex.instance.application.renderer… overlay children"` via a `__ambreia.combat.overlayCount = () => roomEngine.rpgOverlay?.children.length`.
   Pass: overlay children return to 0 within 2 s after the last burst; loops without `cast null` must be ≤ 1 per object
   (today: `incantations` replaces the handle and stops the previous one ✓, but a server that never sends RpgCastEnd leaves 1
   looping sprite per caster until room change — acceptable, document).
Capture: `ss` before/after; `errors` after each protocol (a leak often surfaces first as a thrown "destroyed texture" error).

### F-b. Visual baselines
Exists: none committed; `run-vortex-client` writes `shots/*.png` (gitignored); `avatar/test/render.test.mjs` compares two
reference PNGs in Node (skipped without `AMBREIA_ASSETS`); glaze has no mock-up folder in the repo (the `mockup/glaze/hud_*.png`
named in `hud/feature.ts` is not checked in).
Proposed baseline set (1280×800, `?log=warn`, deterministic seed, same font): `boot-login`, `zone-empty` (IsoStage test room),
`zone-with-hud` (`__ambreia.hud.demo()`), `skills-window` (`key k`), `inventory` (`key i`), `character` (`key c`),
`combat-burst` (`simulate(X)` + `wait 350`), `avatar-editor`, `chat-settings`. Tolerance: per-pixel diff with a 2 % changed-pixel
budget and a 24-px ignore mask over the clock/`fps` text; fail > 2 %, warn 0.5–2 %. Storage: `packages/vortex-client/test/visual/baseline/*.png`
+ `visual.test.mjs` that drives `driver.mjs` when `VORTEX_VISUAL=1` (needs dev server + emulator or the IsoStage out-of-session
path for the room shots), skipped otherwise like `render.test.mjs`.

---

## (G) Not verified
- Runtime heap/texture numbers: no browser or emulator here; every leak statement is a retained-reference reading, not a measurement.
- `'crash'` event listeners: grep over `packages/*/src` found none; `vortex-web` or inline scripts could subscribe.
- Whether `castTicker` in `skills/feature.ts` is cleared on RSE_ENDED (only `statusTicker` is, line 354; `castTicker` clears when `casting` turns false — not traced through `casts.clear()`).
- `RoomContentLoader._loadingTypes` continuation after `dispose()`/`purge()`; `AvatarRenderManager` disposal of Pixi textures.
- The exact 13 `pnpm lint` tool errors reported earlier: this run shows 6 errors in 3 `vortex-client/tools/*.mjs` files (ESLint 10 without `compact`/`unix` formatters).
- The AS3 share percentages are heuristics (trace presence + path), ±10 points.
- `move-modules.mjs` and `wire-diff.mjs` behaviour were read, not run (wire-diff needs the emulator).
