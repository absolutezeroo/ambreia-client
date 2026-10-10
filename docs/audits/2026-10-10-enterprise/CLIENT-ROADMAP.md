# Ambreia client — roadmap and migration DAG

> Companion to `CLIENT-ENTERPRISE-AUDIT.md` (2026-10-10, `aeb88ba`). Every item names the finding it closes (IDs from the audit and
> its appendix), its invariant, tests, definition of done and rollback. No item is a rewrite; every one is extract / wrap / stabilise /
> test / replace a boundary / remove a compatibility layer. Efforts: S ≤ 1 day, M ≤ 1 week, L > 1 week for one developer.

## P0 — correctness, security, operability (before any deploy)

| # | Item (findings) | Packages | Invariant | Outline | Tests / proof | Definition of done | Rollback |
|---|---|---|---|---|---|---|---|
| P0-1 | Dockerfiles install the whole workspace (H1: AC-01, AV-01) | root | an image builds from a clean clone | copy every `packages/*/package.json` (or `pnpm fetch` + `install --offline` after `COPY . .`); fix the stale `vortex-engine` comment | `tools/docker-manifests.test.mjs`: lockfile importers ⊆ Dockerfile `COPY` lines; a real `docker build` | both images build; imager `/health` answers | revert Dockerfile |
| P0-2 | Watch paths cover `packages/ambreia-*/**` (H2) | DEPLOYMENT.md + Coolify | a code push redeploys what it changes | update both lists; later derive from the Dockerfile surface | push a comment in `ambreia-game`, see the webhook | deploy triggered | — |
| P0-3 | Asset outage is not "Maintenance break!" (H8: RT-01) | game/communication | no disconnect dialog before a session exists | route content-load errors to the data-download message; give `disconnected.reason.maintenance` a text | `run-vortex-client` with the asset proxy pointing nowhere; screenshot | login form visible with a clear message | revert |
| P0-4 | CI exists and the gates are not vacuous (H9: NP-11, MT-07, AC-11) | repo | a commit from any machine is checked | GitHub workflow: `pnpm check`, `pnpm lint` (green after fixing 6 tool errors + ignoring `previews/**`), `gen-headers --check` with the emulator cloned at a pinned ref (or a committed `Headers.cs` fingerprint when absent, failing under `CI=1`), `build-vfx-sheets --check`, zone schema check; `AMBREIA_RELEASE=dev` fixture so `pnpm build` runs (marked non-deployable) | the workflow itself | red on a stale header, green on `aeb88ba` + fixes | disable workflow |
| P0-5 | SSO ticket hygiene (AC-05, NP-08) | vortex-client | the ticket is in memory only | `history.replaceState` after `loadConfig`; `BugReporter` sends `pathname` only; `Referrer-Policy: same-origin` | DevTools: no `sso` in Referer or URL | — | revert |
| P0-6 | Cache headers (AC-06) | Caddyfile | no silent old-bundle/new-JS skew | `immutable` for `/assets/*`, `no-cache` for `index.html`, `.ambreia` bundles, `config.json`; later hashed bundle names | `curl -I` | headers present | revert |
| P0-7 | `DEV_SERVER_HOST` out of the kernel (AC-04, KG-13, NP-07) | kernel, client | no remote host in library code; `ws://` refused in prod outside localhost | default `ws://127.0.0.1:40001`; shared dev server via `public/config.json`; refuse `ws://` when `PROD` and not localhost | kernel config test | — | revert |
| P0-8 | Handshake robustness (NP-05, NP-06, NP-02) | net, game/communication | a bad key fails loudly within 15 s; retries detach the old socket | try/catch → `HANDSHAKE_FAIL` + close; handshake deadline; WebCrypto randomness; detach handlers before `new WebSocket` | unit tests with a fake socket | — | revert |
| P0-9 | Imager operability (RT-05, AV-03, AV-11, AV-12) | imager | `/health` answers within 1 s and names the problem; a timed-out render is never cached | `listen()` first, preload state in `/health`, fast fail on ECONNREFUSED, `ContentUnavailableError` on effect timeout, `path.relative` confinement, update `fastify` | imager tests for cache key/URL grammar (AV-06) | — | revert |
| P0-10 | Combat timers and overlay bounded (MT-02, MT-03) | game/features/combat | no timer outlives the room | epoch token per session; clear `countdown` on `RSE_ENDED`; stop the RAF when nothing is shown; remove bars on user removal | fake-timer unit test | — | revert |

## P1 — architecture boundaries (before features multiply)

| # | Item (findings) | Invariant | Outline | Tests / proof | DoD |
|---|---|---|---|---|---|
| P1-1 | Feature dependencies through the kernel (H3: KG-01, KG-02, KG-03, KG-12) | a feature's needs are declared and checked before `create()`; duplicate providers and cycles fail the boot | add `requires`/`optional` to `IGameFeature`, assert slots non-null before `create`; type slots with `I*` interfaces; `bootFeatures` fails on locked-after-boot and duplicate IID/id | Proxy test over `made` (no sync read of a later slot); kernel tests for cycle/duplicate | reorder `GAME_FEATURES` arbitrarily → boot error, never silence |
| P1-2 | Feature teardown (H4: MT-01, KG-05, UI-02) | `boot → dispose → boot` leaves no listener, timer, global or window | `IFeature.dispose`; `bootFeatures` returns `{report, dispose}`; carriers dispose `IDisposable` instances; a `FeatureScope` helper (`on/listen/interval/timeout` with one `release()`); `FrameController` raises `WE_CLOSE`; `WindowManager.purge()` on `RSE_ENDED` | kernel test counting listeners and `__ambreia` keys over two boots; debugger buffer count after 5 open/close | — |
| P1-3 | Feature-to-feature wall + shared kit (KG-06, UI-05, UI-07) | a feature imports another only via `I*.ts`/`events.ts` | move `WindowBits`, `HudTooltips`, `buildFrame`, `hudRules`, `chatClock/chatSend` to `game/src/ui/kit/`; ESLint block per `features/*`; `RpgView`, `RpgTooltip` on the tool-tip agent, `RpgMenu` with click-away | boundaries probe; `pnpm check` | removing `character` compiles everything but `character` |
| P1-4 | Connection state machine with reconnect (NP-01, NP-13, KG-11) | one `ConnectionState`; bounded reconnect with backoff; every session `forget()`s on `reset` | `net/ConnectionStateMachine`; features subscribe to `reset`; "reconnecting" overlay; keep the iframe handover | state-machine unit tests; manual: stop the emulator, restart | the client recovers in-world or returns to login by itself |
| P1-5 | Host singletons retired from engine/game paths (KG-07, UI-03) | `Core.instance`/`Vortex.instance` reads only in the shell; `WindowManager` owns queue/renderer/modal | pass `application` into `VortexMain`; `onLibraryLoaded` closes over `ctx`; instance-own `WindowContext` statics; reset `ModalDialog` on dispose | test: two `WindowManager`s, events do not cross | — |
| P1-6 | Imager = avatar + iso + common (AV-02, AV-05 part, AV-15) | `vortex-imager` imports no game/kernel/engine | `ImagerProperties` over `legacy.defaults.json`; `setPlatform()` instead of global shims where possible; ESLint wall for the imager; drop unused deps | wall probe; `smoke.mjs` byte-compare reference PNG | — |
| P1-7 | iso purity (IR-04, IR-06, IR-01) | iso knows no RPG word, reads no key; registries refuse duplicates; content retained by its users | typed `IRoomManagerOptions`; `seeThrough` → `revealObjectId`; `isOccluder` predicate; widget-named events to `game/room/events`; registry duplicate guard; ref-count `assetCollection` | `room-registries` duplicate test; purge test (alive while referenced, dropped 20 s after) | grep `rpg|player|monster|target` in iso → comments only |
| P1-8 | Hotkeys through one binding service (H5: UI-01, UI-10) | duplicate chord = boot error; Escape is a stack; modals get Enter/Escape | `InputBindings` (host or `features/input`), `IGameFeature.keys`; `WindowManager.dispatchKey()` to the focused chain; `tabindex=-1` on bridge inputs | test: two features bind `k` → error | grep `addEventListener?.('keydown'` in features → 0 |
| P1-9 | Wire type discipline and bounded reads (NP-03, NP-04, NP-12) | serializers declare wire types; counts are bounded; a refused parse is logged | `Float` wrapper opt-in, throw on non-integer `number`/`undefined` in dev; `readCount(max)`; log on `parse() === false` | wire-format tests; fuzz each rpg parser | — |

## P2 — modularity and extension points (remove core-modification pressure)

| # | Item (findings) | Invariant | Outline | Proof |
|---|---|---|---|---|
| P2-1 | `IGameFeature.roomLogics/roomVisualizations` (KG-09, IR-03 part) | a room-object behaviour is a feature file + a line | `room-engine` feature appends feature modules to `DEFAULT_ROOM_MODULES`; `handleRoomObjectEvent` becomes a `Map<eventType, handler>` features populate | synthetic feature registers a logic and an event handler without editing `RoomEngine.ts` |
| P2-2 | `IGameFeature.hudPanels` + dock layouter (UI-06, UI-08 part) | a HUD panel is declared by its feature; HUD renders per changed key | `{id, layout, anchor, order, render, describe?, onEvent?}`; `HudPanelsState` keeps cross-cutting fields only; buff captions updated in place | add a dummy "minimap" panel from a new folder without touching `hud/*` |
| P2-3 | `IGameFeature.chatCommands`, `layouts`, `texts` (KG-09, KG-15, UI-12, UI-21) | commands, layouts and texts are owned by their feature; every shipped layout has an owner | registries consumed by `chatSend` and the window manager; `vortex-layouts/mockups/` excluded from the client glob; key-coverage test | ownership tests green; 175 orphan layouts triaged |
| P2-4 | `NewStyleHeaders` derived from installed maps (KG-09, NP-10) | no hand-kept header list | `MessageMap.headers()`; tests unchanged; prune `HabboMessages.ts` comments; delete the 85 dead sends and the hotel protocol folders they pin (MT-04) | `no-dead-sends` test green; typecheck green |
| P2-5 | `RoomEngine` split along seams (H6: IR-03) | `RoomEngine.ts` shrinks every milestone (lint `max-lines` ratchet) | `RoomObjectEventRouter`, `RoomCanvasHost`, `RoomCameraDriver`, `RoomFurnitureQueue`, `RoomPreviewService`; `IRpgRoomView` façade for features | `pnpm check`; room tests; screenshots identical |
| P2-6 | Host shell shrinks (KG-07, KG-14) | `VortexMain` = Pixi + ticker + `bootFeatures`; login is a feature with `beforeConnect` | `room-message-handler` feature; `features/login` → feature or `game/src/login/`; fold `vortex-engine` into the client (rename pass) | boot fingerprint identical |
| P2-7 | UI kit cleanup (UI-04, UI-14, UI-15, UI-09) | kit has no Habbo catalog widgets; registries refuse duplicates; layouts validated in dev | move 5 widgets to game; `WidgetRegistry` duplicate guard; one `enum/`; node test over `vortex-layouts/*.xml` through the node window host | tests |
| P2-8 | Docs match the code (KG-16, MT-08) | one feature shape | PATTERNS.md feature template generated from the skill; spec §4 marked with what is planned vs built; CLAUDE.md "manager is a feature" line corrected; `docs/architectures` rule allows RPG module docs | — |
| P2-9 | Map editor boundaries (ME-01, ME-02, ME-04, ME-06) | the editor owns its layouts/locale; endpoints are configurable; schema drift is detectable; locked layers refuse edits | move 45 layouts + `mapeditor.json`; `ServerEndpoints`; vendor `zone.schema.json`; `LAYER_OF` in core | tests; Tauri build boots to login |

## P3 — state, lifecycle, testing (make features predictable)

| # | Item | Proof |
|---|---|---|
| P3-1 | Single owner per state (`IZonePresence`, own vitals in `combat`, figure from `character`); `forget()` on `reset` everywhere (KG-11) | state ownership table has one writer per row; reconnect test |
| P3-2 | Synthetic test feature covering register / DI / message / window / room widget / object logic / config / dispose without editing core (MT, EP §6) | `game/test/synthetic-feature.test.ts` green |
| P3-3 | Offline fixtures (furnidata, minimal `room`/`clothing`/`furniture` `.ambreia`) so the avatar and iso render tests and both sandboxes run on any machine (RT-04, RT-07, RT-14) | `pnpm test` runs ≥ 1 render test offline; sandbox shows a floor on a clean clone |
| P3-4 | Visual baselines (9 states, 2 % tolerance, driver-based, skipped without `VORTEX_VISUAL=1`) and the three leak protocols (appendix memory F) | baseline folder + `visual.test.mjs`; leak runs recorded |
| P3-5 | Property-based tests: wire format round trip, `.ambreia` pack round trip, XML parsers, zone commands, depth comparator | fast-check suites |
| P3-6 | Protocol contract tests: unread-bytes assertion, real-bytes round trip, fuzz per rpg parser; CI wire-diff | tests |
| P3-7 | Dispose convention lint (guard first, method last) scoped to new code first; orphan tool rewritten with a baseline (MT-05, MT-09) | lint + `orphans.baseline.json` |
| P3-8 | Hooks see every source kind; tests/tools walled; `pnpm lint` in `pnpm check` (MT-06) | hook tests |

## P4 — performance and observability (benchmark, then optimise)

Order and gates in `CLIENT-PERFORMANCE-PLAN.md` §5–6: marks and channels first; dev overlay; then occlusion gating → dirty gate →
layout cache / per-key HUD → ref-counted content → bundle (layouts into the XML bundle, one font copy, deferred WASM, chunks) →
tile-space occlusion → DPR scaling (H11) → editor redraw. Telemetry (opt-in, aggregate only): `boot_duration`, `room_load_duration`,
`fps`/`long_frames`, `socket_reconnects`, `packet_parse_errors`, `asset_load_errors`, `room_object_count`, `texture_count`,
`heap_estimate`, with the build stamp (`revision`, `commit`, `builtAt`).

## P5 — tooling and platform maturity

Packet inspector UI on `IPacketTap` (dev-only); room debugger (click → id/type/tile/depth/asset/state) on `IsoView.pick` +
`getSortableSpriteList` + a per-sprite depth accessor; avatar studio page on `AvatarRenderManager`; Glaze on the shared
`CanvasInput` with layout validation and live preview; `@ambreia/ui-assets` for the shared skins/bundles; public API tiers and
`sideEffects: false`; browser support matrix decided and tested (Chrome, Edge; Firefox if kept); accessibility basics (ARIA live
region for chat/system lines, labels on bridge inputs, focus-visible, reduced motion).

## Migration DAG (derived from the findings, not from a template)

```mermaid
flowchart TD
  P0a[P0-1/2 deploy pipeline] --> P0b[P0-4 CI + non-vacuous gates]
  P0b --> P1a[P1-1 kernel-resolved feature deps]
  P1a --> P1b[P1-2 feature teardown]
  P1a --> P1c[P1-3 feature wall + shared kit]
  P1b --> P1h[P1-8 input bindings]
  P1c --> P2b[P2-2 hudPanels registry]
  P1a --> P2a[P2-1 roomLogics + event router] --> P2e[P2-5 RoomEngine split]
  P1g[P1-7 iso purity + ref-counted content] --> P2a
  P1a --> P2c[P2-3 chatCommands/layouts/texts]
  P1i[P1-9 wire types] --> P2d[P2-4 derived NewStyleHeaders + dead sends removal]
  P1d[P1-4 connection state machine] --> P3a[P3-1 state owners + reset]
  P1e[P1-5 singletons out] --> P2f[P2-6 host shell shrinks]
  P1f[P1-6 imager on engines] --> P5[P5 tools]
  P1b --> P3b[P3-2 synthetic feature test]
  P2a & P2b & P2c --> P3b
  P3c[P3-3 offline fixtures] --> P3d[P3-4 visual + leak protocols] --> P4[P4 measure then optimise]
  P0b --> P3c
  P2b --> P4
  P4 --> P5
  classDef p0 fill:#fdd; classDef p1 fill:#fed; classDef p2 fill:#ffd; classDef p3 fill:#efd; classDef p4 fill:#dfe; classDef p5 fill:#def;
  class P0a,P0b p0; class P1a,P1b,P1c,P1d,P1e,P1f,P1g,P1h,P1i p1; class P2a,P2b,P2c,P2d,P2e,P2f p2; class P3a,P3b,P3c,P3d p3; class P4 p4; class P5 p5;
```

Reading: nothing in P1 depends on P0 technically, but P0-4 (CI) is what makes every later invariant stick. P1-1 is the root of the
game-layer work: teardown, the wall, every registry and the synthetic test all assume features declare what they need. P1-7 and P2-1
are the iso line; P1-4 and P3-1 the networking/state line; P3-3 unlocks every measurement and the two skipped render tests, and
therefore all of P4.

## DO NOT REFACTOR

The package split and walls; `loadConfig`; `FeatureDependencyError`/`essential`/`showBootError`; `RoomWidgetRegistry`; `MessageMap`
and the registration/partition tests; `WireFormatter.splitMessages` and the closure queues; iso's object → model → sprite → pooled
`ExtendedSprite` chain, the placeholder content pipeline, `RoomPlane.SHARED`, the registries/modules, `IsoStage`; `AvatarRenderManager`
typed options, `TRANSFORM_MEMO`, the sprite-parts path, `render-avatar.mjs`; `@ambreia/ui`'s engine/game wall, the
`MouseEventQueue`/`MouseEventProcessor` pipeline, layouts as XML; the `.ambreia` reader, lossless WebP, deterministic
`bundle-assets`; `Logger`, `FrameTimings`, `PacketLogger`, `IPacketTap`; `@ambreia/map-editor-core`; the Claude hooks, husky and
the skills. Improvements to these are additive (guards, callers, channels), never rewrites.
