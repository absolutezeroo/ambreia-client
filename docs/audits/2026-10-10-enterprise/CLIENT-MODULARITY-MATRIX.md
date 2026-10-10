# Ambreia client — modularity matrix

> Companion to `CLIENT-ENTERPRISE-AUDIT.md` (2026-10-10, `aeb88ba`). Dependency direction as measured on the source
> tree (import scan over `packages/*/{src,test,tools,sandbox}`), the forbidden-dependency matrix with its enforcement
> status, per-package responsibilities, and the modularity scorecard.

## 1. Measured import graph (src → package, number of import statements)

| From \ To | common | net | avatar | ui | iso | kernel | protocol | game | vortex-engine | vortex-client | other |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **common** | — | | | | | | | | | | pixi, pako, eventemitter3 |
| **net** | 9 | — | | | | | | | | | |
| **avatar** | 43 | | — | | | | | | | | pixi |
| **ui** | 44 | | | — | | | | | | sandbox: data only (1) | |
| **iso** | 79 | | 24 | | — | | | | | sandbox: data glob | pixi, vite (sandbox) |
| **kernel** | 15 | | | | | — | | | | | zod |
| **protocol** | 2 | 704 | | | 12 | | — | | | | |
| **game** | 128 | 97 | 50 | 448 | 531 | 60 | 462 | — | | | zod, pixi |
| **map-editor-core** | 0 | | | | | | | | | | json-schema-to-typescript (dev) |
| **map-editor** | 7 | | | 98 | 7 | | | | | **import.meta.glob + publicDir (hidden)** | tauri opener |
| **vortex-engine** | 13 | 1 | 5 | 4 | 3 | 11 | | 54 | — | | inversify, reflect-metadata (**unused**) |
| **vortex-client** | 7 | | | 20 | 1 | 5 | | 7 | 5 | — | tests/tools → imager (1) |
| **vortex-glaze** | 22 | | | 98 | | test: 1 | | test: 1 | | | |
| **vortex-imager** | 15 | | 12 | | 30 | **5** | | **7** | declared, 0 imports | | fastify, mysql2, lru-cache |

No cycles. No engine imports kernel/protocol/game. `iso → avatar` only (allowed).

## 2. Forbidden-dependency matrix

| From | To | Allowed? | Enforced? | How / gap |
|---|---|---:|---:|---|
| common | any `@ambreia/*`, `vortex-*` | no | yes | ESLint wall + boundaries test |
| net / avatar / ui / kernel | anything but common | no | yes | ESLint wall + boundaries test |
| iso | anything but common, avatar | no | yes | ESLint wall + boundaries test |
| protocol | anything but common, net, iso | no | yes | ESLint wall + boundaries test |
| game | `vortex-*` | no | yes | ESLint wall + boundaries test |
| game `core/` | rest of game | no | yes | depth-counted ESLint rule + test |
| feature A | feature B internals | no (spec §3 r3) | **no** | 26 import edges today; no rule |
| any engine | kernel / protocol / game | no | yes | ESLint + test |
| glaze | anything but ui, common | no | yes (src) | devDeps on game/kernel for one test |
| imager | game, kernel, vortex-engine | no (spec §3: avatar + iso) | **no** | 12 imports; no wall for `vortex-imager` |
| map-editor-core | anything | no | yes | wall (allows common) + boundaries test; actual: zero imports |
| map-editor | anything but core, ui, iso, common | no | yes for `import` | **`import.meta.glob('../../../vortex-client/…')` and `publicDir` are invisible to the rule** |
| any package | another package by relative path into `src/` | no | yes (src) | regex `ambreia-[a-z]+/src` — misses `ambreia-map-editor-core/src` in the engine walls (hyphen); tools/tests not covered |
| any `src` | browser globals outside `platform()` | engines: should not | **no** | avatar is clean; iso ~23 sites, ui ~40, common off-path 5; no lint |
| any | literal message id | no | partly | `no-literal-ids` test scans `HabboMessages.ts` only; maps rely on `Incoming.X` + the release plugin |
| any | `console.*` | no | yes | ESLint `no-console` |
| game features | `globalThis.__ambreia` in prod | should not | no | 7 files, 0 DEV guards |

Note on the mechanism: ESLint runs via lint-staged (pre-commit) and the Claude edit hook, **not** in `pnpm check`;
`pnpm lint` as a whole is red (skill preview scripts). The boundaries test runs in `pnpm check` and is the real gate.

## 3. Package responsibilities and public surface

| Package | Responsibility (observed) | Public API today | Should be public | Browser deps | Node OK | Cohesion notes |
|---|---|---|---|---|---|---|
| common | Logger, utils, asset formats (AMBB/AMBP, `.ambreia` directories, loaders), graphics helpers, reactive, `platform()` | every file (`./*`) | `utils/Logger`, `assets/*` loaders and `pack/*`, `platform/Platform`, `graphics/textureFromCanvas` | 5 off-path sites bypass `platform()` | yes (tools) | `assets/` (5.2k lines) is half the package; fine |
| net | transport, RC4/RSA, wire format, legacy registry, `MessageMap`, packet tap/logger | every file | `connection/IConnection`, `style/MessageMap`, `IPacketTap`, wire format | `WebSocket`, `document.visibilitychange` (by design) | tests only | `SocketConnection` is transport + dispatcher (796 l.) |
| avatar | figure → image; typed options; Node tool | every file | `AvatarRenderManager`, `IAvatarRenderOptions`, `IAvatarImage` | none (clean) | yes (`render-avatar.mjs`) | `EmbeddedAvatarAnimationData.ts` dead (1,526 l.); 115 `any` at XML boundaries |
| ui | window engine, kit, XML parsers, Canvas2D renderer | every file | `kit/WindowManager`, `kit/WidgetRegistry`, `IWindow*`, parsers | DOM text input, canvases (~40 `new OffscreenCanvas`) | partly (`node-window-host.ts`) | `kit/` still ships Habbo catalog/navigator widgets; `enum/` duplicated in `kit/enum/` |
| iso | room engine: model, scene, furniture, avatars, effects, renderer, `IsoStage` | every file | `IsoStage`, `IIsoRoomData`, `IIsoView`, `RoomManager`, registries | ~23 `document.createElement('canvas')`/`OffscreenCanvas` | partly (sandbox/imager shim) | `RoomRenderingCanvas` 3,496 l. holds sort, cull, mouse, occlusion, x-ray, lighting, FPS |
| kernel | DI, config, features | every file | `feature/*`, `config/*`, `runtime/Component`, `IID` | `location` in browserSources (by design) | yes | hard-coded dev host string |
| protocol | headers, inherited messages, rpg parsers/serializers | every file | `Headers.generated`, `NewStyleHeaders`, `incoming/outgoing/rpg/*`, parsers | none | yes | 735/1,094 lines of `HabboMessages.ts` are comments; folders of cut hotel modules remain (navigator, friendlist, help, moderation, quest, tracking, wardrobe, hotlooks, perk, notifications) — only the registered 60 are live |
| game | features, room glue, session, window, avatar editor, communication glue | every file | `features/index` (`GAME_FEATURES`, `IEngineHost`), `I*` of features | yes | no | `RoomEngine.ts` 10,335 l.; `hurlant/`, `perf/`, hotel leftovers (floor plan editor, habbopedia, wardrobe/hotlooks) |
| map-editor-core | zone document, commands, history, validation, API client | every file | all (small) | none (fetch injected) | yes | French labels and JSON-stringify equality in core |
| map-editor | Tauri/Vite editor app | app | — | yes | no | `EditorApp` 754 l. binds canvas/fetch/window in constructor |
| vortex-engine | `Vortex`, `VortexMain` host shell | `src/index.ts` | — | yes | no | to be folded/renamed; unused inversify/reflect-metadata |
| vortex-client | page boot, canvas, input, loading screen, debugger, tools | app | — | yes | tools yes | `App.ts` 1,865 l.; 269 layouts globbed (188–203 unreferenced) |
| vortex-glaze | layout editor | app | — | yes | tests partly | own canvas input path |
| vortex-imager | fastify renderer | `dist/index.js` | HTTP | shims | yes | depends on game/kernel for a property map |

## 4. Modularity scorecard (0–10; axes: Encapsulation · Extensibility · Testability · Independence · Lifecycle · API quality · Performance architecture)

| Package | Enc | Ext | Test | Ind | Life | API | Perf | Mean | One-line reason |
|---|---|---|---|---|---|---|---|---|---|
| common | 7 | 6 | 7 | 10 | 7 | 7 | 7 | 7.3 | bottom package, tested formats; off-path platform bypasses, no bounds check |
| net | 8 | 8 | 7 | 9 | 4 | 6 | 6 | 6.9 | clean wrapper discipline; no reconnect/state machine; per-packet logger allocations |
| avatar | 6 | 6 | 5 | 9 | 6 | 6 | 8 | 6.6 | typed options + platform-clean; `_activeImages` leak, `any` at parsers, RPG weapon constants |
| ui | 6 | 6 | 6 | 8 | 4 | 6 | 6 | 6.0 | wall holds; statics, lifecycle unowned, Habbo widgets in kit, no layout cache |
| iso | 6 | 7 | 5 | 6 | 5 | 6 | 5 | 5.7 | model/sprite split is right; god canvas, dead refcount, every-frame updates, RPG vocabulary |
| kernel | 6 | 5 | 7 | 8 | 5 | 6 | 7 | 6.3 | config excellent; dependency check blind to `null` products, no duplicate-IID guard |
| protocol | 8 | 7 | 6 | 8 | — | 7 | 8 | 7.3 | partition tests strong; central `NewStyleHeaders` list; parsers not fuzzed |
| game | 4 | 5 | 6 | 7 | 3 | 5 | 6 | 5.1 | `host.made` bag, cross-feature imports, no teardown, `RoomEngine` monolith |
| client (vortex-client + engine) | 5 | 5 | 4 | 6 | 5 | 5 | 5 | 5.0 | singletons, 4.1 MB single chunk with inlined XML, SSO in URL |
| imager | 5 | 7 | 4 | 3 | 7 | 7 | 7 | 5.7 | per-request dispose good; boots kernel+game for a map; Dockerfile cannot build |
| glaze | 8 | 7 | 5 | 8 | 6 | 7 | 7 | 6.9 | true consumer of ui; own input path |
| map-editor-core | 8 | 7 | 9 | 9 | 8 | 7 | 7 | 7.9 | best-structured package in the repo |
| map-editor (app) | 6 | 5 | 3 | 5 | 6 | 6 | 5 | 5.1 | reuses iso; hidden client dependency; untestable app class |

## 5. Deep-import policy

Deep imports (`@ambreia/common/utils/Logger`) are the repo convention and are kept. Risks observed: every file is
API (refactors inside a package can break consumers silently); no `sideEffects` declaration; registration-by-import
modules exist (`register*.ts`, `PacketLogger.install()` called by the shell). Policy: barrel the public tier per
package, mark `/internal/`, add `sideEffects: false` once registration is explicit (it already is for iso modules and
widgets). Do not ban deep imports.
