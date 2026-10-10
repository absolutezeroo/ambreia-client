# AMBREIA CLIENT — ENTERPRISE ARCHITECTURE AUDIT

> **Date:** 2026-10-10 · **Revision audited:** `aeb88bab6f2f6260556d1fc75568a037a083ca88` (`origin/rpg-character`, identical to the working
> branch `claude/determined-ritchie-omy2dy`) · **Method:** one coordinator plus nine specialist passes (kernel/features, net/protocol,
> iso/rendering, avatar/imager/platform, UI/HUD/Glaze, assets/config/build/security, memory/testing/tooling, map editor, live runtime)
> with every HIGH finding re-read by the coordinator against the code. Specialist reports and screenshots are in `appendix/` and `shots/`.
> **Nothing in the repository was modified or committed by this audit**; the documents in this folder are the only output.
>
> Supporting documents: `CLIENT-TARGET-ARCHITECTURE.md`, `CLIENT-MODULARITY-MATRIX.md`, `CLIENT-STATE-OWNERSHIP.md`,
> `CLIENT-RENDERING-ARCHITECTURE.md`, `CLIENT-EXTENSION-POINTS.md`, `CLIENT-PERFORMANCE-PLAN.md`, `CLIENT-ROADMAP.md`.

---

## 1. Executive summary

The J1–J6 extraction worked. Eight `@ambreia/*` packages exist with the dependency direction the 2026-10-07 spec drew, the walls are
machine-enforced (ESLint + a 23-case boundary test), the typed configuration is exactly what §5 asked for, the avatar engine is a
plain class that renders in Node, the room engine's state → presentation → Pixi split is real, and the new `MessageMap` network style
with its "one style per header" tests is sound. `pnpm check` is green (369 tests). The engines are already at the level of a
structured client that other tools can reuse: the map editor renders through the real `IsoStage`, Glaze is a genuine consumer of
`@ambreia/ui`, and the imager renders with the same `AvatarRenderManager` as the game.

What has not happened yet is the **game layer** half of the spec. The seven RPG features written since J6 do not use the kernel's
dependency contract: they return `null` from `create()`, hand each other services through a mutable 20-slot bag (`host.made`),
import each other's files (26 edges, no rule), bind hotkeys with raw `window` listeners, and have no teardown at all. The kernel's
one real guarantee ("a missing dependency fails the boot with a name") therefore does not cover the code being written now, and
"add a feature = a folder + a line" is true only for leaf features. Every new HUD element, chat command, room-object behaviour or
hotkey still edits central files (`features/index.ts`, `hud/*`, `chatModel.ts`, `RoomEngine.ts` at 10,335 lines, `NewStyleHeaders.ts`).

Operationally the project is **not deployable from this revision**: both Dockerfiles copy four of the fourteen workspace manifests
before `pnpm install --frozen-lockfile`, so `zod` and `pako` are never installed for the packages that import them (reproduced by
simulation); the documented Coolify watch paths do not include `packages/ambreia-*/**`; there is no CI, and the pre-commit header
check silently passes on any machine without the emulator checkout. The live client also shows a misleading "Maintenance break! /
Logged out ( / -2 )" modal over the login form whenever the asset host is unreachable (observed, screenshot), never reconnects after
a socket loss (the embedding website is expected to recover), leaves the SSO ticket in the URL for the whole session, and renders
the UI blurry on HiDPI screens (observed at DPR 2).

Performance architecture is the least measured area. The per-frame depth sort is cheap (measured: 0.11 ms at 3,000 sprites), but a
new occlusion / x-ray / holes / lighting pass runs every frame with pixel readbacks and 4–8 render-to-texture passes, every logic
and visualization updates every frame without an upstream dirty gate, and the HUD re-renders all panels on any change. None of this
could be measured here (no server, no asset host); it is reported as PERFORMANCE RISK — UNVERIFIED with the exact channels to add.

**Verdict: CONDITIONALLY READY** — playable and architecturally on the right track; not production-reliable (deploy pipeline, no
reconnect, no CI) and not yet feature-scalable (game-layer contract). Current maturity **Level 2 (production-capable client,
with a Level-1 deployment story)**; target **Level 3 (modular game platform)** is reachable with the P0–P2 items of the roadmap,
none of which is a rewrite. Numbers that matter:

| Measure | Value |
|---|---|
| Source | 14 packages · 2,165 `.ts` files · 85 test files · 369 tests pass, 7 skipped (all renderer/schema tests needing assets or the emulator) |
| Gates | `pnpm check` green · `pnpm lint` red (427 errors, 0 in package `src`) · `pnpm build` blocked without the emulator's release file · `pnpm audit` 0 critical / 59 high (only `fastify` reaches a shipped runtime) · **no CI** |
| Findings | 0 CRITICAL · 11 HIGH · ~45 MEDIUM · ~40 LOW/INFO (consolidated in §7 and §37) |
| Spec vs code | 9 decisions IMPLEMENTED, 11 PARTIAL, 3 DIVERGED, 0 obsolete (§5) |
| Prod bundle (measurement build) | one 4.13 MB chunk (762 kB gz), 15 % of which is 269 XML layouts inlined as strings; fonts shipped twice; 1.2 MB WASM text engine awaited at boot |

---

## 2. Exact audited revision

| Item | Value |
|---|---|
| Repository / branch | `absolutezeroo/ambreia-client` · audited `origin/rpg-character` = `claude/determined-ritchie-omy2dy` @ `aeb88ba` (2026-10-10 18:41 +0200, "hud, personnage : la barre du bas remplace la barre du haut…") |
| Other branches / tags | none on the remote (no `main`/`master`); no tags in this clone (the `pre-noyau-client` tag named in CLAUDE.md is absent) |
| History | 62 commits, first dated 2026-10-09 (squashed); one author |
| Working tree | clean before and after every command (the prebuild regenerates `vfxSheets.generated.ts` byte-identically) |
| Toolchain | Node v22.22.0 · pnpm 11.8.0 (pinned by `packageManager`) · Linux 6.18 x86_64 cloud container · Chromium 1194 (Playwright, headless, SwiftShader) for runtime checks |
| Not available | `../vortex-rpg-emulator` (no server, no `Headers.cs`, no release file, no zone schema) · asset host `vortex-assets.local` · `public/config.json` · Docker |
| Commands run | `pnpm install --frozen-lockfile` OK (9.1 s) · `pnpm check` OK (122 + 254 tests) · `pnpm lint` exit 1 · `pnpm build` exit 1 (`[ambreia:release-headers] No release revision`) · `pnpm audit --json` · `pnpm outdated -r` · `node install.mjs` OK · `pnpm dev`, both sandboxes, Glaze, map editor, imager started and driven (appendix `runtime.md`) |

---

## 3. Current maturity

| Level | Definition | Ambreia today |
|---|---|---|
| 0 prototype | works on the author's machine | — |
| 1 structured client | layers, tests, docs | ✅ |
| 2 production-capable | typed config, error screens, gates, deployable | ✅ for the client code; ❌ deployment (Docker build broken, no CI, no reconnect) |
| 3 modular game platform | features added/removed without touching core; engines reusable by tools | engines ✅ (sandbox, imager, editor); game layer ❌ (`host.made`, HUD, hotkeys, `RoomEngine`) |
| 4 mature game-client platform | measured performance budget, visual/perf/memory tests, observability | ❌ (no perf/memory/visual tests; perf overlay unreachable) |
| 5 extensible engine/tool ecosystem | third-party tools, public API tiers | ❌ |

**Current: Level 2 (engines at 3). Target of this roadmap: Level 3, with the measurement half of Level 4 (P4).**

---

## 4. Architecture AS-IS

### 4.1 Package dependencies (measured on the source tree)

```mermaid
flowchart TB
  VC[vortex-client] --> VE[vortex-engine] & G & UI & K & CM
  VE --> G & K & AV & UI & ISO & N & CM
  IM[vortex-imager] --> AV & ISO & CM & K & G
  GL[vortex-glaze] --> UI & CM
  ME[@ambreia/map-editor] --> MEC[@ambreia/map-editor-core] & UI & ISO & CM
  ME -. "import.meta.glob + publicDir (hidden)" .-> VC
  G[@ambreia/game] --> K[@ambreia/kernel] & P[@ambreia/protocol] & ISO & UI & AV & N & CM
  K --> CM
  P --> N & ISO & CM
  ISO[@ambreia/iso] --> AV[@ambreia/avatar] & CM
  UI[@ambreia/ui] --> CM
  N[@ambreia/net] --> CM
  AV --> CM
  CM[@ambreia/common]
  classDef bad stroke:#c00,stroke-width:2px;
  class IM bad;
```

No cycles. No engine imports kernel/protocol/game. The two red edges against the spec: the imager depends on `game` and `kernel`
(for one property map) and still declares `vortex-engine`, `ui`, `net`, `protocol`, `pako` it never imports; the map editor reaches
`vortex-client` data through `import.meta.glob`, invisible to the wall.

### 4.2 Runtime bootstrap (verified)

```mermaid
sequenceDiagram
  autonumber
  participant IX as index.ts
  participant App as App.init
  participant K as kernel/config
  participant V as Vortex (static singleton)
  participant VM as VortexMain
  participant BF as bootFeatures
  participant F as 22 features (list order)
  IX->>App: app.init().catch(loadingScreen.showError)
  App->>K: loadConfig(browserSources(location, config.json), featureSections(GAME_FEATURES)) — one merge, Zod strict, deep-frozen; ConfigError → showBootError()
  App->>App: AssetBundle.load ×2 (8.8 MB) → readWindowAssets (decode every layout-named bitmap)
  App->>V: Vortex.bootstrap(config) → new VortexMain.init()
  VM->>VM: PacketLogger.install() (unconditional) · Core.instantiate() · attach AssetLibrary + CoreCommunicationManager · ctx.initialize() (RUNNING emitted before any feature)
  VM->>BF: bootFeatures(ctx, GAME_FEATURES, config, host{made: emptyManagers()})
  loop each enabled feature
    BF->>F: create({context, config, app, host}) — writes host.made.<slot>, reads earlier slots
    BF->>BF: attach (Component | {instance} | null → no requires)
    BF->>F: afterAttach — 6 RPG features: await Promise.resolve(); map.install(connection)
  end
  BF->>BF: declared requires ⊆ providedInterfaces() else FeatureDependencyError
  VM->>VM: copy made.* into 12 throwing getters · new RoomMessageHandler · RSE_STARTED/ENDED wiring · __ambreia.kernel/boot · queueMicrotask(onCoreRunning)
  App->>App: createCanvas · initClientUi (avatar editor attached outside the kernel) · loadWebFonts (WASM, awaited) · LoginScreen (if no ?sso)
  App->>V: connect() → handshake → SSO → waitForAuthentication(∞) → isConfigured() replays queues
```

Boot measured in dev (warm): loading screen 1.6 s → bundles 3.05 s → first canvas 4.05 s → login 5.8 s; cold ≈ 9 s; 250 requests
(207 are eagerly imported layout XML files). Zero User-Timing marks.

### 4.3 Feature boot, packet flow, server → model → rendering, room rendering, window/UI, asset loading, avatar rendering, tooling

These diagrams are in the companion documents to keep this one readable: feature boot and `host.made` in `CLIENT-EXTENSION-POINTS.md`
§1–2 and appendix `kernel-game.md` A.1; packet flow for both styles and the connection state machine in appendix `net-protocol.md`
A.2–A.4; server → model → sprite → Pixi and the frame loop in `CLIENT-RENDERING-ARCHITECTURE.md` §1; window system and HUD in
appendix `ui-hud-glaze.md` A; asset pipeline, config load and release handshake in appendix `assets-config-build-security.md` A.1–A.3;
avatar pipeline, imager request flow and platform boundary in appendix `avatar-imager-platform.md` A.1–A.3; tooling reuse in
`CLIENT-TARGET-ARCHITECTURE.md` §5.

---

## 5. Architecture spec vs reality

| Architectural decision (spec 2026-10-07) | Spec | Current code | Status | Gap |
|---|---|---|---|---|
| Packages common/net/avatar/iso/ui/kernel/protocol/game | §3 | all exist (+ map-editor, map-editor-core); `vortex-engine` shell not yet renamed/folded | IMPLEMENTED | naming pass |
| Engines never import kernel/protocol/game | §3 r1 | holds (import scan + ESLint + boundaries test) | IMPLEMENTED | — |
| Engines use no DI, take typed options | §3 r1 | avatar ✅ typed options; ui ✅ plain `WindowManager`; **iso ✗** `RoomManager`/`RoomContentLoader` read legacy keys through `property/flag` string callbacks | PARTIAL | typed `IRoomManagerOptions` |
| `iso → avatar` allowed, never the reverse | §3 r2 | holds | IMPLEMENTED | — |
| Features are folders; A imports B only via interface/event; ESLint rule inside game | §3 r3, r4 | 26 cross-feature import edges (`WindowBits` ×13, `chatModel`, `HudTooltips`, `buildFrame`…); **no rule** | DIVERGED | rule + move shared kit |
| Boundaries by `package.json` (undeclared import does not resolve) | §3 r4 | workspace deps declared; `exports: "./*"` makes every file public; relative `../pkg/src` blocked only in `src` by ESLint | PARTIAL | API tiers |
| One sandbox per engine | §3 r5 | iso + ui sandboxes exist (both need client data; iso needs the asset host → blank offline); avatar has the Node tool; net/kernel: tests | PARTIAL | offline fixtures |
| `defineFeature({ config, map, images, roomLogics, roomWidgets, chatCommands })` | §4 | `IGameFeature` = kernel fields + `images` + `roomWidgets`; messages installed by hand in `afterAttach`; `roomLogics`, `chatCommands`, `layouts/`, `locale/` absent | PARTIAL | §13 extension points |
| Add a feature = folder + one line; remove = delete + compiles | §4 | folder + `GAME_FEATURES` line + `IEngineManagers` slot + `emptyManagers()` + `NewStyleHeaders` (+ `hud/*`, `chatModel`); removal of `character` or `hud` breaks 5–6 features at compile time | DIVERGED | kernel-resolved `provides/requires` |
| Attach order does not matter | §4 | `host.made` is order-dependent; every current synchronous read happens to target an earlier slot (verified by hand); nothing checks it | DIVERGED | `requires` asserted before `create` |
| Missing dependency fails the boot, named | §4 | `FeatureDependencyError` ✅ for IID deps; **blind** for the 11 features that return `null` | PARTIAL | cover null products |
| Features talk through typed events | §4 | typed `EventEmitter<I…Events>` on sessions ✅; plus direct `host.made.X?.` reads (77) and cross imports | PARTIAL | — |
| Config typed, loaded once, validated, frozen; `enabled` per section; unknown section warns; invalid = error screen listing fields | §5 | all implemented and **observed** (screenshot `shots/02-config-invalid.png`) | IMPLEMENTED | — |
| Engines read no key; each feature declares its section; legacy shrinks | §5 | 1 of 13 game features declares a schema; 36 legacy defaults, 73 textual `getProperty` sites, 0 keys migrated; iso reads keys via callbacks; a public dev host is hard-coded in the kernel | PARTIAL | migration map (appendix assets E.1) |
| New messages in the new style, in the feature folder | §6 | 6 `MessageMap`s in features ✅; parsers/serializers live in `protocol/src/*/rpg/` (not the feature folder); central `NewStyleHeaders.ts` list required | PARTIAL (location diverged by choice) | derive the list |
| Headers generated from the emulator, pre-commit regenerates/refuses | §6 | `gen-headers --check` in husky ✅; **skips silently without the emulator**; no CI | IMPLEMENTED, gate vacuous off the owner's machine | CI + fingerprint |
| Handlers/views never see `MessageDataWrapper` | §6 | holds (only the callback signature) | IMPLEMENTED | — |
| Security: client is never a barrier; `wss://` in prod; no secret in config | §7 | respected (no client-side gating found); `ws://` only warned; dev default dials a public plaintext host; asset key in public config documented | PARTIAL | hardening list |
| Dev tools not in the production build | §7.6 | `WindowDebuggerOverlay` tree-shaken ✅; `__ambreia`, `__packets`, `PacketLogger` history ungated | PARTIAL | `devHook()` |
| Tools: packet inspector, DevTools panel, avatar studio, World editor | §8 | seams exist (`IPacketTap`, `__ambreia.kernel/boot`, `FrameTimings`), map editor exists on `IsoStage`; no inspector/overlay UI, no avatar studio | PARTIAL | §27 |
| Milestone proof: removing the demo feature keeps the build green | §9/§11 | scripted for `loading-bar` ✅; false for any non-leaf feature | IMPLEMENTED (leaf only) | synthetic feature test |

---

## 6. What is already excellent (do not refactor)

| Verdict | What | Why it is right |
|---|---|---|
| KEEP | Package split + ESLint `wall()` + `boundaries.test.mjs` | the one architecture rule that is machine-enforced today, and it holds |
| KEEP | `kernel/config/loadConfig` (strict Zod per section, kernel-added `enabled`, deep-freeze, unknown-section warning, one `ConfigError`, error screen) | spec §5 implemented faithfully; observed working |
| KEEP | `FeatureDependencyError` + `essential` + `showBootError` | the boot fails loudly and readably |
| KEEP | `RoomWidgetRegistry` + `IGameFeature.roomWidgets/images` | duplicate-safe, enabled-aware, tested: the model for every other registry |
| KEEP | `MessageMap` + `handleIncoming` refusal + `NewStyleHeaders` partition tests + `no-literal-ids` + release plugin + `check-release-bundle` | small, typed, all-or-nothing, "one style per header" is enforced; bundle leak check verified (0 names, no `.map`) |
| KEEP | `WireFormatter.splitMessages` (partial frames, RC4 mark/reset, fatal on bad length) and the closure-based pre-configuration queues | correct handling of the one unrecoverable case; both styles stay ordered |
| KEEP | iso's `RoomObject` → `RoomObjectModel` → `RoomObjectSprite` → pooled `ExtendedSprite` chain; per-object sprite cache early-out; placeholder content pipeline with its documented regressions; `RoomPlane.SHARED` ref-counted textures; registries + `DEFAULT_ROOM_MODULES` pinned by test; `IsoStage` as the no-session entry shared by sandbox, imager and editor | Pixi objects are not state; measured sort is cheap |
| KEEP | `AvatarRenderManager` as a plain class over `IAvatarRenderOptions`; zero browser globals in the avatar package; `tools/render-avatar.mjs` + `node-platform.mjs`; `TRANSFORM_MEMO`; sprite-parts path; one renderer for room, HUD, editor, imager | spec §1 objective achieved |
| KEEP | `@ambreia/ui` engine/game wall; AS3 `MouseEventQueue`/`MouseEventProcessor` input pipeline; allocation-free receiver loop; layouts as XML with `static_bitmap asset_uri`; Glaze as a true consumer; dev debugger tree-shaken | |
| KEEP | `.ambreia` reader semantics (broken vs retryable, `log.once` per missing piece), lossless WebP pixel check, deterministic `bundle-assets`, zip-slip guard, one-origin Caddy design | |
| KEEP | `Logger` (bound NOOP sinks, `__log`, `?log=`, `once`), `PacketLogger` tally, `IPacketTap`, `FrameTimings` + `:showstats`, `BugReporter` | the observability primitives exist; they need wiring, not replacing |
| KEEP | Claude hooks (`guard-edits`, `eslint-on-edit`, `check-on-stop`), husky (`gen-headers --check`, `sync-agent-docs`), the five skills | the skills are the most accurate documentation in the repo |
| KEEP | `@ambreia/map-editor-core` (pure commands, snapshot history, 46 tests, zero deps) and the editor's reuse of `IsoStage` | best-structured package in the repository |
| KEEP+STRENGTHEN | `bootFeatures` (cover `null` products, locked-after-boot, duplicate provides, create() errors, dispose) · `attachInstance` carrier (dispose the instance) · rpg contract tests (unread-bytes assert, real-bytes round trip, fuzz) · `WidgetRegistry` and iso registries (duplicate guard) · `run-vortex-client` driver (Linux browser path, heap/metrics commands) | |
| REFACTOR | `host.made`/`IEngineManagers` · `RoomEngine.ts` · `HudPanelsState/View` · static singletons in `ui` · `HabboMessages.ts` (735/1,094 lines are comments) · imager boot on kernel+game · Glaze's own input path | see roadmap |
| REPLACE | the 8 `await Promise.resolve()` ordering waits and the simulated `RUNNING` · `writeValue`'s `typeof` dispatch · `Math.random` in the handshake · dead `once('complete')` branches · `DEV_SERVER_HOST` constant · Dockerfile manifest layer · `find-orphans.mjs` (stale aliases, reports 0) | |

---

## 7. Critical findings (consolidated HIGH; full detail with evidence lines in the appendix report named)

No CRITICAL finding (nothing data-destroying, security-catastrophic or system-wide beyond repair). Eleven HIGH:

| ID | Finding | Confidence | Where | Evidence (coordinator-verified) | Minimal fix | Effort |
|---|---|---|---|---|---|---|
| **H1** (AC-01, AV-01) | **Both Dockerfiles cannot build the current workspace**: they copy only `packages/vortex-{client,engine,glaze,imager}/package.json` before `pnpm install --frozen-lockfile`; the ten `@ambreia/*` importers' dependencies are never installed (`zod` lives only in `packages/ambreia-kernel/node_modules`, no hoist). Reproduced: the partial install exits 0 with dangling workspace links; `tsc`/`vite build` then cannot resolve `zod`/`pako`. Every image build since the package split fails. | HIGH (simulated, no Docker here) | `Dockerfile:17-22`, `Dockerfile.imager:21-26` | `ls node_modules/zod` → absent; simulation in appendix assets F | copy every workspace manifest (or `pnpm fetch` + `install --offline` after `COPY . .`); a test that greps lockfile importers against the Dockerfiles | S |
| **H2** (AC-02) | Documented Coolify watch paths omit `packages/ambreia-*/**`: a push touching only engine/game/protocol code does not redeploy client or imager → client/server skew | MEDIUM (Coolify not visible) | `DEPLOYMENT.md` §8 | — | add the paths; derive them from the Dockerfile `COPY` surface | S |
| **H3** (KG-01) | **`host.made` is an untyped, order-dependent service locator that bypasses the kernel.** 11/22 features return `null` so `bootFeatures` sees no dependencies; 77 `made.X?.` reads turn a missing provider into a silent no-op; moving `HudFeature` after `InventoryFeature` breaks the bottom bar without any log or test failure. Spec §4's three promises (order-free, named failure, typed events) are untrue for the RPG layer. | CONFIRMED | `features/index.ts:56-116`, `kernel/feature/bootFeatures.ts:166`, every `features/*/feature.ts` | coordinator counts: 32/20/17 reads in skills/combat/inventory | `requires` asserted before `create()`; type slots with existing `I*` interfaces; Proxy test over `made` | S now / L to remove the bag |
| **H4** (MT-01, KG-05, UI-02) | **No lifecycle beyond `create()` for features and feature views.** No `dispose` hook; `attachInstance` carriers dispose nothing; `Rpg*Session.dispose()` has 0 callers; `MessageMap` uninstallers are never called; three global `keydown` listeners, HUD/combat/skills views, `setInterval` tickers and `__ambreia` globals survive `Vortex.dispose()`. In `ui`, hide/detach/dispose are per-feature conventions, `WindowManager.purge()` has no caller, `CloseButtonController` is empty. | CONFIRMED | `bootFeatures.ts`, `ComponentContext.ts` carrier, `WindowRenderer.purge`, features | grep: 0 `removeEventListener('keydown'` in features; 0 `windowManager.purge(` callers | `bootFeatures` returns `{report, dispose()}`; features return a disposer; `FrameController` raises `WE_CLOSE`; `purge()` on `RSE_ENDED` | M |
| **H5** (UI-01) | **Hotkeys are raw `globalThis.addEventListener('keydown')` in three features** (skills 1–6/K/Escape, interaction Escape, inventory I/C), never removed, no handled flag: Escape fires three handlers at once, a duplicate binding is silent, modals never see Escape, rebinding is impossible. | CONFIRMED | `skills/feature.ts:321`, `interaction/feature.ts:86`, `inventory/feature.ts:135` | coordinator grep | `InputBindings` with duplicate-chord error (the `RoomWidgetRegistry` contract), Escape as a stack | M |
| **H6** (IR-03) | **`RoomEngine.ts` is 10,335 lines / 294 methods and accretes one `*Rpg*` method per feature** (12 already); `handleRoomObjectEvent` and the 557-line `IRoomCreator` are the remaining switches; a room-object behaviour cannot be added from a feature. | CONFIRMED | `game/src/room/RoomEngine.ts` | `wc -l` 10,335; 12 `*Rpg*` methods | event-type registry for `handleRoomObjectEvent`; `IRpgRoomView` façade; `max-lines` ratchet | M → L |
| **H7** (IR-02) | **Occlusion / x-ray / holes / lighting run every frame on pixels**: `seeThrough = true` for every game canvas; up to 25 alpha probes per overlapping pair with a full-texture `getImageData` per new `Texture` (avatars recompose per animation frame); `updateXray`/`updateHoles` run even when see-through is off, 4–5 render-to-texture passes per occluded avatar; lighting 6–8 passes. Scales with avatars × overlapping furniture, exactly where an MMO is busiest. | HIGH that it runs; **cost UNVERIFIED** | `RoomRenderingCanvas.ts:1085, 2191-2785`, `ExtendedSprite.ts` | — | gate under `seeThrough`; dirty key on own position/list order; add a `FrameTimings` channel; then tile-space occlusion | S gate / M |
| **H8** (RT-01) | **An unreachable asset host shows "Maintenance break! / Logged out ( / -2 )" over the login form** before any login or socket: the furnidata parse error is routed through AS3's maintenance categories in `HabboCommunicationDemo.onCoreError`, with an empty reason text. Observed. | CONFIRMED (screenshot `shots/01-boot-t5s.png`) | `HabboCommunicationDemo.ts:73-96` | coordinator read the switch | route content-load failures to the existing "game data could not be downloaded" bucket; never fire a disconnect before a session exists | S |
| **H9** (NP-11, MT-07, AC-11) | **No CI, and every contract gate is vacuous off the owner's machine**: `gen-headers --check` prints "check skipped" and exits 0 without the emulator; the zone-schema test skips; `vfxSheets.generated.ts` has no `--check`; the two registration tests validate the client against its own committed file; `pnpm build` cannot run without the emulator checkout; `pnpm lint` is red. | CONFIRMED | `.husky/pre-commit`, `gen-headers.mjs:22-29`, `.github/` (no workflows) | coordinator ran both | GitHub workflow running `pnpm check` + `lint`; `--check` fails under `CI=1` without the emulator; a committed `Headers.cs` fingerprint; a dev release fixture for `pnpm build` | S–M |
| **H10** (AC-09, RT-08) | **Production bundle is one 4.13 MB chunk (762 kB gz)**: 269 own layout XML files inlined as JS strings (1.7 MB pre-minify, including 46 map-editor and 6 fishing layouts the client never opens), fonts shipped twice (1.25 MB), `truffle-text` WASM (1.2 MB) awaited before first paint, full `zod`. Measured with a clearly synthetic release table (not deployable). | CONFIRMED (measured) | `App.ts:1118` (`?raw` eager glob), `_index.scss` `@font-face`, `loadWebFonts` | appendix assets E.3 | layouts into the XML bundle; one font copy; defer the WASM import; `manualChunks` | S–M |
| **H11** (RT-03) | **HiDPI: both canvases keep a 1× backing store at DPR 2**; the UI canvas is bilinear-upscaled → blurry text on every Retina/phone screen (observed, `shots/01-dpr2-crop-login.png`). | CONFIRMED | `App.resizeCanvas`, `Vortex.ts:579` `resolution: 1` | — | integer backing scale for the UI canvas (`image-rendering: pixelated` as a stop-gap), Pixi `resolution: Math.round(dpr)` | M |

Downgraded after the coordinator's false-positive review (recorded so they are not re-escalated):

- NP-01 "dead client after the disconnect dialog" → **MEDIUM**: at top level the page is indeed dead and nothing reconnects, but the
  product embeds the client in the website's iframe, which receives `DISCONNECTED` and fetches a fresh ticket (`App.ts:985-1002`). The
  architectural gap (no `Reconnecting` state, no resync) stays in P1.
- IR-01 "purge destroys content the still-displayed room uses" → **MEDIUM**: `VortexMain.ts:598-602` disposes the room on
  `RSE_ENDED` *before* `RoomSessionManager` purges. What remains true: `GraphicAssetCollection.addReference/removeReference` have no
  caller, so `purge()` drops **every** furniture/pet collection and asset library on every room exit (the AS3 20 s grace never
  applies) → re-download and re-decode on each room change. IR-05 ("previous room ticks until next room ready") is **withdrawn** for
  the same reason.
- AV-04 `_activeImages` grows unbounded → **MEDIUM**: `AvatarImage.dispose()` frees textures and caches; only disposed shells are retained.

---

## 8. Package architecture

Responsibilities, public surface, dependency matrix, enforcement status and the per-package scorecard are in
`CLIENT-MODULARITY-MATRIX.md`. Summary of the issues that cross packages:

- **Public surface**: every package exports `"./*": "./src/*.ts"`; 2,165 files are API; no `sideEffects` field; a public/internal tier
  is proposed (matrix §5) without banning deep imports.
- **Cohesion**: `game` is the dumping ground (room glue 17.8k lines with `RoomEngine` 10.3k; `hurlant/`, `perf/`, hotel leftovers —
  floor plan editor 2.6k lines, habbopedia, wardrobe/hotlooks; 85 dead composer sends keep the cut protocol folders alive);
  `iso/scene/renderer/RoomRenderingCanvas.ts` (3,496 lines) holds sort, cull, mouse, occlusion, x-ray, lighting and the FPS overlay;
  `ui/kit` still ships Habbo catalog/navigator widgets and duplicates `enum/` in `kit/enum/`; `common/assets` is half the package (fine).
- **Hosts**: `vortex-engine` is a 1,914-line shell whose only job is copying `host.made` into getters and wiring the message handler;
  `Vortex.instance` (46 reads) and `Core.instance` (12) are still the way the host and two engine files reach each other; the imager
  boots the kernel DI and the game's configuration manager for one property map; the map editor needs `vortex-client`'s source tree.
- **Dead weight**: `inversify` + `reflect-metadata` declared with zero imports; `EmbeddedAvatarAnimationData.ts` (1,526 lines) unreferenced;
  205 unreachable source files by a barrel-aware scan (the repo's `find-orphans.mjs` reports 0 because it still scans pre-J6 paths);
  175–203 of 269 `vortex-layouts/*.xml` referenced by nothing yet bundled and eagerly imported.

---

## 9. Feature architecture

Full feature table, removability classification and the N+1 simulations are in `CLIENT-EXTENSION-POINTS.md` §2–3 and appendix
`kernel-game.md` E. Removability as measured:

| Class | Features | What breaks outside the folder |
|---|---|---|
| FULLY MODULAR | loading-bar | only the test that names it |
| MOSTLY MODULAR | avatar-info, chat, interaction, skills | `features/index.ts` ×3; readers get `null` silently (typed text dropped, no VFX, target id 0) |
| COUPLED | combat, inventory | type/helper imports from `skills` → compile errors |
| COUPLED → CORE-EMBEDDED | character (`WindowBits` imported by 6 features), hud (`chatModel`, `PlayerHudState`, `hudRules`, `HudTooltips` imported by 5) | compile errors in 5–6 features |
| CORE-EMBEDDED | asset-packs + the 12 inline features (configuration … room-ui) | `VortexMain` getters, `App` reads, mutual required IIDs |

Cross-feature coupling is mostly **misfiled shared kit**, not real feature-to-feature logic; the only legitimate interface import is
`hud/CharacterHudBridge → character/IRpgCharacterSession`. The remedy is a move plus one ESLint block, not events.

---

## 10. Kernel / DI

Strengths: `loadConfig`, `FeatureDependencyError`, `essential`, reverse-order dispose, priority update loop with per-receiver
try/catch, no per-frame allocation. Gaps (appendix `kernel-game.md` KG-02…KG-10, KG-18):

- The dependency check verifies "declared", not "resolvable": `providedInterfaces()` includes locked components, so a cycle or a never-
  unlocking provider passes the boot and only a `warn` fires 15 s later.
- No duplicate-IID guard in `attachComponent/attachInstance/bootFeatures` (first non-locked provider silently wins).
- The lifecycle is microtask-shaped (`Component` defers synchronously resolved dependencies and `initComponent` by a microtask), which
  leaked into 8 `await Promise.resolve()` waits and a simulated `RUNNING` (`ctx.initialize()` runs before any feature exists).
- Dead "late configuration" branches (`once('complete')` after a synchronous `load()`), a mutable legacy copy (`setProperty` public),
  and `DEV_SERVER_HOST = 'ws://…sslip.io'` compiled into the kernel.
- Any `create()` error other than config/dependency reaches the user as the generic "Client startup failed" text.
- Kernel tests are happy-path (duplicate IID, cycles, null products, disposal order, update priority uncovered).

---

## 11. Client state

`CLIENT-STATE-OWNERSHIP.md` holds the AS-IS and target tables. Headlines: "in a room" is tracked in ≥10 places; own HP is projected by
both the combat session and the character→HUD bridge (which assumes full HP when unknown); the own figure falls back across two
managers; no `Rpg*Session` reacts to a disconnect (no `reset`), so every mirror is stale until the server re-sends. **No client-side
gameplay authority was found** (casts, chat, target selection, item moves are sent unconditionally; cooldowns are server
`remainingMs` on the local clock) — this discipline is a strength to protect with a rule.

---

## 12. Networking

Appendix `net-protocol.md`. Transport is sound (length-prefixed frames, partial-frame buffering, N messages per frame, RC4 mark/reset,
1 MiB client cap vs 64 KiB documented server cap, fatal close on bad length, per-message `RangeError` on truncation, processing on
`onmessage` and on the ticker). Gaps: no state machine (six booleans across three classes), **no reconnect** and no dead-link timer
(client only answers server pings; `startSendingHeartBeat` is a legacy web event, not wire); the initial retry creates a new
`WebSocket` without detaching the old one (spurious "logged out" dialog possible); a wrong RSA modulus throws inside the handler and the
client waits forever (`waitForAuthentication(+Infinity)`, no handshake deadline); DH private key and RSA padding from `Math.random`
(WebCrypto helpers exist unused); `ws://` only warned; no backpressure (`bufferedAmount` unused); `PacketLogger` records every packet
into a 200-ring in production even when disabled.

---

## 13. Protocol

103 headers (71 in / 32 out) in `Headers.generated.ts`; 60 inherited registrations in `HabboMessages.ts` + 43 new-style — the partition
is enforced by `incoming-registered`/`outgoing-registered`. CLAUDE.md's "60 messages" is the legacy subset only. Views never touch the
wrapper; no feature writes bytes. Gaps: `WireFormatter.writeValue` types by JS `typeof` (a float in a `number` field writes IEEE-754
where the server reads an int, `undefined` is skipped and shifts every later field — `wire-diff` cannot see it); list counts are
unbounded (`UsersMessageParser` pre-allocates `Array.from({length: count})`); legacy `parse()` returning `false` is a silent drop;
`RoomEntryInfoMessageEvent` has no listener and `DisconnectMessageComposer` is never sent; **85 composers are still constructed by
game code and registered nowhere** (dropped with one warning); `reasonText` maps 22 not 122; the compatibility check is server-side
only and reason 122 is used for both "client older" and "client newer" (a newer client reloads into the same bundle, user-paced).

---

## 14. PixiJS rendering · 15. ISO engine

`CLIENT-RENDERING-ARCHITECTURE.md` and appendix `iso-render.md`. Beyond H6/H7: no upstream dirty gate (every logic/visualization
updates every frame; culling per sprite after the work); depth ties broken by arrival index (deterministic per session, not across
clients); registries silently last-wins; effect hooks are statics shared by all stages; RPG vocabulary and Habbo config keys inside
iso (`TargetCircle`, `SheetAddition`, `pet_type` in `isFurni`, 31 widget-named events, `stories.image_url_base`, `gpu.ignored_furni`);
`IsoView.pick()` is O(W×L) with ~6 allocations per tile per mousemove (editor path); three projection implementations; `antialias`
defaults to `true` on a nearest-sampled stage; 31 moved furniture files carry no `// AS3:` trace. Spatial index: **not needed** at
current scale (zone 11×10; typical rooms < 300 objects); a per-object dirty bit is the right next step.

---

## 16. Avatar engine

Appendix `avatar-imager-platform.md`. The package meets spec §1: typed options, one construction shape for five hosts, zero browser
globals, Node rendering with a fixture test (skipped here without assets). Gaps: `_activeImages` never pruned (`unregisterImage` has
0 callers); full-image cache and the `_needsUpdate` shortcut ignore `setType`/`scale`/highlight (latent, AS3-inherited); 115 `any`
at the XML → structure boundary; RPG weapon part types/actions hard-coded in the engine (`rib`/`rif`, `WIELD/ATTACK`, `LIB_WEAPONS`);
1,526 dead lines; the imager accommodates a second Node strategy (543-line pixi shim) and reaches `_cache` by cast.

---

## 17. UI / window engine · 18. HUD architecture

Appendix `ui-hud-glaze.md`. Beyond H4/H5: process-wide statics (`WindowContext.inputEventQueue/_renderer`, `ModalDialog`,
`WindowParser.localizationResolver`) make two managers in one page impossible and sandbox isolation accidental; the kit still ships
Habbo catalog/navigator widgets; layout diagnostics are silent (unknown tags/vars/duplicate names unchecked, missing layout → warn
+ null); `WidgetRegistry.register` overwrites silently; focus is a passive stack with no modal focus, Escape/Enter or tab order; text
input bridges create one DOM element per field at construction and position against the first `<canvas>`; the UI sandbox shows
windows without captions (identity `interpolate`). **HUD**: `HudPanelsState`/`HudPanelsView` is not yet the 10,000-line class (528
lines) but is the exact growth vector — adding a panel edits 7 places, any field change re-renders every panel, the buff grid is
destroyed and rebuilt every second in combat; features re-invent tooltips, menus (no click-away), drag and progress bars that the kit
already provides. A minimal `hudPanels` registry with a dock layouter is proposed (extension points §2 row 5).

---

## 19. Asset pipeline

Appendix `assets-config-build-security.md` A.1, AC-13…AC-16, AC-21. Two formats (AMBB client bundles, AMBP pieces) with magic +
version checks but no checksum or offset bounds check; `bundle-assets` and the lossless WebP step are deterministic (verified);
`install.mjs --pack` is not (mtimes) and the 13.4 MB archive is committed; the `.ambreia` directory reader has the right broken-vs-retry
semantics and `log.once` per missing piece; runtime caches have no size ceiling (`RoomContentLoader`) and no persistent tier; the
Caddyfile proxies `/gamedata`, `/dcr`, `/gordon`… but **not `/ambreia/*`**, so default asset-pack URLs would hit the SPA fallback unless
`config.json` points elsewhere; `guard-edits` does not cover `public/*.ambreia`, `src/assets/{images,…}`, `AGENTS.md`.

---

## 20. Map editor

Appendix `map-editor.md`. Core is exemplary; the app reuses the real `IsoStage` but keeps a full fallback renderer, has a hidden
build-time dependency on `vortex-client` (45 layouts, locale, `publicDir`), cannot work as a packaged Tauri build (all endpoints are
Vite proxies, `csp: null`, `bundle.active: false`), does not render edited thickness/visibility (WYSIWYG gap), does not enforce layer
lock/visibility for world layers, rebuilds the whole iso room on any floor edit although `IsoStage.setTile` exists, and is untestable
headlessly (754-line `EditorApp` binding canvas/fetch/window in its constructor). Zone schema drift is undetectable without the
emulator (test skips).

---

## 21. Glaze

A genuine consumer of `@ambreia/ui` (serializer, catalog, renderer, parser all reused) — keep. It duplicates the host's canvas input
path (never enqueues → OVER/OUT/tooltips differ from the client), carries a hand copy of the game widget list guarded by a test that
needs `game`/`kernel` devDeps, and its preview scripts are what makes `pnpm lint` red (414 `no-undef` on page-side snippets that are
not modules). Live preview and layout validation are feasible on the existing node window host.

---

## 22. Imager

Renders with the unmodified avatar engine and disposes per request (good). Cannot build (H1), depends on `game`+`kernel` for a
property map (spec: avatar + iso), blocks `listen()` behind the asset preload so `/health` never answers and the process crashes after
120 s when the asset host is down (observed, also inside `pnpm dev`), caches a timed-out effect render permanently on disk under the
correct key, maps a figure timeout to 500 and a content timeout to 503, has prefix-only path confinement when `IMAGER_ASSETS_ROOT`
is set, and five tests none of which cover the public URL grammar or the cache key. Only `fastify`/`fast-uri` advisories reach it.

---

## 23. Performance

`CLIENT-PERFORMANCE-PLAN.md`. Measured: sort 0.11 ms @3k sprites; `shareKey()` 0.16 ms/120 planes; tuple allocation free; dev boot
5.8 s warm; prod bundle 4.13 MB. Unmeasured (needs server/assets): occlusion/x-ray/lighting pass, HUD composite in combat, room entry
breakdown, dense rooms, GC. The harness (`FrameTimings`, `:showstats`) exists but the overlay has no caller since the chat-command cut.

## 24. Memory

Appendix `memory-testing-tooling.md`. Confirmed retained paths: features (H4); combat death countdown not cleared on `RSE_ENDED`;
delayed VFX timers fire into the next room on whatever object has the same id; `CombatOverlay` bars for departed hurt players and a
RAF loop that runs while any monster bar exists; `_activeImages`; hidden/detached UI windows keep their buffers (no `purge` caller);
room content dropped too eagerly rather than too late (IR-01). Half of the 348 `dispose()` methods lack the `_disposed` guard (inherited
iso/avatar). No measurement exists; three reproducible protocols are specified (appendix F-a).

## 25. Security

Threat model is correct (server authority, no gating, no secret, encrypted asset packs with a documented public key). Hardening gaps
(none exploitable against other players): SSO ticket never stripped from the URL (history, `Referer` on same-origin requests, persisted
by `BugReporter`); dev default dials a public plaintext `ws://` host; `Math.random` in the handshake; no CSP / `frame-ancestors` /
`Referrer-Policy` / `X-Content-Type-Options`; unbounded list counts (self-inflicted DoS only); prefix path check in the imager;
`fastify` 5.11.2 in a public runtime (Medium; update). XSS surface tiny (constant `innerHTML` only, no `eval`, trusted XML).

## 26. Testing

369 fast tests, strong contract/registry/boundary layer; **zero** visual, integration, e2e, performance or memory tests; the only
rendering tests (avatar, iso) skip on every machine without the asset host; the registration tests validate against the committed
generated file; kernel tests are happy-path; game views untested; imager URL/cache contracts untested. Fitness functions and the
synthetic test feature (6 of 8 steps feasible today) are in `CLIENT-EXTENSION-POINTS.md` §6 and appendix memory E.

## 27. Tooling · 28. Observability

Precise tools exist (`boundaries.test.mjs`, `move-modules`, `gen-headers`, `wire-diff`, `run-vortex-client`, skills) with gaps:
`find-orphans.mjs` stale; the driver knows only Windows browser paths; hooks gate `.ts` only (XML/JSON/`.mjs` edits end a session
without `pnpm check`); tests/tools are not walled. Observability primitives exist, wiring does not: 0 User-Timing marks, `'crash'`
event has no listener, perf overlay unreachable, perf tools orphaned, logger roots still `habbo.`/`core.` across every package,
dev hooks ungated.

## 29. Build / CI · 30. Deployment

See H1, H2, H9, H10. Also: no build stamp (BugReporter sends `MODE · userAgent`, `CLIENT_VERSION` static 0.1.0); `REVISION` used only
in `ClientHello`; no `Cache-Control` at all (unhashed `.ambreia` bundles and `config.json` → silent old-bundle/new-JS skew after a
deploy); imager image carries the whole workspace; two Vite copies, three esbuild versions, both `allowBuilds` and
`onlyBuiltDependencies` set.

## 31. Developer experience

The skills are accurate and the best documentation (golden paths in ≤ 3 lookups for message/feature/window); but three documents
give three feature shapes (spec §4 `map/roomLogics/chatCommands`, PATTERNS.md `VortexMain.initHabboManagers()` + "every manager
extends Component", CLAUDE.md "manager = Component or plain instance") and only the skill matches the code (closures returning `null`
and `host.made` slots the spec never mentions). 175 unreferenced layouts, 85 dead sends and hotel leftovers mislead readers.
`features/login` is not a feature (App imports it). `docs/architectures/README.md` forbids architecture docs for non-AS3 modules —
which now excludes every RPG feature.

---

## 32. Target architecture · 33. Target dependency graph · 34. Target state ownership · 35. Target feature model

`CLIENT-TARGET-ARCHITECTURE.md` (§2–3), `CLIENT-STATE-OWNERSHIP.md` §4, `CLIENT-EXTENSION-POINTS.md`. In one paragraph: keep every
package and wall; make the imager an engine host; turn `host.made` into kernel-resolved `provides/requires`; give `IGameFeature`
the registries the spec drew (`roomLogics`, `hudPanels`, `keys`, `chatCommands`, `layouts`, `texts`, `dispose`); add a connection
state machine with reconnect; make the UI engine instance-owned and keyboard-aware; split `RoomEngine` along its seams; move
occlusion to tile space; put own layouts in the XML bundle. No new framework.

Canonical feature folder (no empty directories):

```
features/quests/
  feature.ts            declaration only (id, config, provides/requires, messages, images, layouts, texts, keys, hudPanels, roomLogics, create, dispose)
  IQuests.ts            the capability other features may import
  RpgQuestSession.ts    state + typed events; forget() on reset
  QuestsMap.ts          MessageMap (parsers/serializers may stay in protocol/src/*/rpg/quests)
  QuestsWindow.ts       view on game/src/ui/kit (RpgView, WindowBits, RpgTooltip)
  layouts/*.xml  locale/{fr,en}.json
  quests.test.ts
```

## 36. Architecture fitness functions

`CLIENT-EXTENSION-POINTS.md` §6 (12 rules) and appendix memory E (14 rules): feature-to-feature import wall, `host.made` order proxy
test, duplicate id/IID/hotkey/registry errors, layout and text ownership tests, `NewStyleHeaders` derivation, header fingerprint,
`RoomEngine` line budget, engine browser-global lint, dead-sends test, orphan baseline, Stop hook over all source kinds, `pnpm lint`
in `pnpm check`, synthetic feature test.

## 37. Gap analysis

| Gap | Current | Target | Impact | Migration | Effort | Risk |
|---|---|---|---|---|---|---|
| Deploy pipeline | Dockerfiles broken, watch paths stale, no CI, no cache headers, no build stamp | buildable images, CI gates, hashed bundles, stamp | nothing ships from this revision | P0 | S–M | none |
| Feature contract | `host.made`, null products, no dispose, cross imports | `provides/requires`, dispose, kit, ESLint block | silent failures, non-removable features | P1–P2 | M (L to remove the bag) | low–medium |
| Extension points | HUD/chat/room-logic/hotkeys/messages centralised | registries on `IGameFeature` | every feature edits core | P2 | M | medium |
| Connection lifecycle | no state machine, no reconnect, stall on bad key | state machine + bounded reconnect + handshake deadline | dead page / embedder-dependent | P1 | M–L | medium |
| Engine purity (iso/ui) | RPG words, config keys, statics, Habbo widgets in kit | typed options, instance-owned, moved widgets | tools carry game code; two managers impossible | P1–P2 | M | low |
| Render cost model | every-frame updates, pixel occlusion, HUD full re-render, unmeasured | dirty gate, tile occlusion, per-key HUD, channels | unknown frame budget at scale | P4 (measure first) | M–L | medium |
| Lifecycle/memory | features/views never disposed, purge churn, overlay growth | disposers, ref-counted content, protocols | long sessions, in-process reboot | P1/P3 | S–M | low |
| Bundle/boot | 4.1 MB chunk, XML in JS, fonts ×2, WASM awaited, DPR 1 | bundle for layouts, deferral, DPR scaling | load time, blurry HiDPI | P0 (fonts, defer) / P4 | S–M | low–medium |
| Testing | no visual/perf/memory; render tests skip | fixtures, baselines, protocols | regressions invisible | P3 | M | none |
| Docs | three feature shapes | one (skill-derived) | newcomers | P2 | S | none |

## 38. P0–P5 roadmap · 39. Migration DAG

`CLIENT-ROADMAP.md` (acceptance criteria per item).

## 40. Final verdict

| Dimension | Rating | Basis |
|---|---|---|
| Playability | **READY (with the server)** | boot, config UX, login error handling observed; room entry validated by the owner on 2026-10-07 (bilan); not reproducible here |
| Production reliability | **NOT READY** | H1, H2, H8, H9, no reconnect, no cache headers, imager crash without `/health` |
| Architecture scalability | **CONDITIONALLY READY** | engines and walls hold; game-layer contract and `RoomEngine` do not yet |
| Feature scalability | **NOT READY** | `host.made`, HUD, hotkeys, chat commands, room logics, `NewStyleHeaders` are all central edits |
| Engine maturity | Level 3 (iso, ui), Level 3+ (avatar) | reusable by three tools today |
| Tooling maturity | Level 2 | precise tools, no CI, stale orphan tool, skipping gates |

**Overall: CONDITIONALLY READY.** Fix P0 (one week of work, no architecture) before any deploy; P1–P2 before the next ten features.

### The ultimate test

| | Question | Answer today | After P2 |
|---|---|---|---|
| A | Add a new MMORPG feature without editing generic engines? | **Mostly yes** for windows/messages/config/texts; **no** for a room-object behaviour (engine module list) or a minimap (engine capability) | yes except genuine new engine capabilities |
| B | Remove it without breaking unrelated systems? | **Only leaf features**; character/hud removal breaks 5–6 features; every feature needs 3–4 edits in `features/index.ts` | yes |
| C | Can `avatar`, `iso`, `ui` run independently? | **Code: yes** (walls, sandboxes, Node tool). **Content: no** — both sandboxes borrow client data, the iso sandbox is blank without the asset host | yes with offline fixtures |
| D | Can a tool reuse them without faking the full client? | avatar: yes (Node tool). iso: yes (map editor on `IsoStage`). imager: **no** (boots kernel + game, 543-line pixi shim) | yes |
| E | 100 more features without `game` becoming a monolith? | **No**: `host.made` would reach 120 slots, `HudPanelsState` and `RoomEngine` would absorb them | yes, if the registries of §13 land first |
| F | Diagnose a blank window, wrong packet, missing asset, laggy room, leak quickly? | packet: yes (`__packets`, `PacketLogger`). asset: yes (`log.once` per piece). blank window: partly (dev debugger). laggy room: **no** (overlay unreachable, no channel for the new passes). leak: **no** (no protocol, no counters) | yes with the dev overlay and protocols |
| G | Can a developer know where new code belongs without the author? | with the skills, yes; with the spec or PATTERNS.md, no | yes once docs match |
| H | Are violations caught before merge? | package walls: yes (locally, pre-commit); feature walls, duplicates, hotkeys, headers off-machine, non-`.ts` edits: **no**; no CI | yes |
| I | Dense rooms and combat stay performant because rendering is measurable? | **Unknown**: harness exists, overlay unreachable, new per-frame passes unmeasured | measurable after P4 |
| J | Will the boundaries still make sense after doubling twice? | package boundaries: **yes**. Game-layer boundaries: **no** in their current form | yes |

---

## Annex A — Enterprise scorecard (0–10)

| Area | Score | Why |
|---|---|---|
| Architecture | 7 | the layered package set exists and holds; the host shell and game layer have not caught up with it |
| Modularity | 6 | engines modular (8–9 independence); game 4 (bag, cross imports); imager 3 |
| Extensibility | 5 | two real registries (room widgets, message maps); HUD, hotkeys, chat commands, room logics, headers, `host.made` are central edits |
| Rendering | 6 | right model/sprite split, pooled sprites, nearest sampling; god canvas, every-frame updates, DPR 1 only |
| Performance | 5 | sort measured cheap; the new per-frame passes, HUD composite and room entry are unmeasured; overlay unreachable |
| Memory safety | 5 | caches bounded or ref-counted where wired; no feature teardown, timers cross rooms, dead refcount churn, no protocol |
| Networking | 5 | transport solid; no state machine, no reconnect, silent handshake stall, `Math.random` keys |
| Protocol design | 7 | generated headers, partition tests, typed maps; `typeof` wire encoding, unbounded counts, 85 dead sends |
| State management | 5 | server authority respected; duplicated presence/vitals/figure; no reset on disconnect |
| UI architecture | 6 | engine/game wall, AS3 input pipeline, XML layouts; statics, lifecycle unowned, HUD monolith forming, kit reinvented |
| Asset pipeline | 7 | deterministic bundles, good reader semantics, documented key; no checksum, no cache headers, `/ambreia` unrouted, 13 MB zip committed |
| Security | 6 | correct threat model, tiny XSS surface, no client authority; SSO in URL, plaintext dev host, no CSP, weak randomness |
| Testing | 6 | 369 fast tests, strong contract layer; zero visual/perf/memory, render tests skip everywhere but one machine |
| Observability | 4 | primitives exist; no marks, no crash listener, overlay unreachable, no telemetry |
| Tooling | 7 | precise tools and skills; no CI, stale orphan tool, Windows-only driver, skipping gates |
| Build / release | 4 | release plugin and leak check verified; build impossible without the emulator, 4.1 MB chunk, no stamp, lint red |
| Maintainability | 6 | traces and comments are excellent; `RoomEngine` 10k lines, 205 orphans, 85 dead sends, hotel leftovers |
| Developer experience | 6 | skills give golden paths; spec/PATTERNS/CLAUDE.md disagree with the code |
| Documentation | 6 | unusually rich and honest (bilans list what was not verified); drift after J6 |
| Deployment | 3 | images do not build, watch paths stale, no cache/security headers, imager image carries the workspace |

## Annex B — Completeness matrix (brief sections 0–180)

| Area (brief §) | Audited | Evidence | Findings | Confidence |
|---|---:|---|---:|---|
| 0–2 reading, exact state, inventory | yes | appendix `00-coordinator-facts.md`; §2 | — | CONFIRMED |
| 3–4 AS-IS diagrams, spec vs reality | yes | §4–5, companion docs | 23 rows | CONFIRMED |
| 5–10 package boundaries, direction, matrix, deep imports, surface, cohesion | yes | `CLIENT-MODULARITY-MATRIX.md` | 6 | CONFIRMED |
| 11–14 features, removability, N+1, cross-feature | yes | `CLIENT-EXTENSION-POINTS.md`, appendix kernel E | 5 | CONFIRMED |
| 15–18 events, DI, service locator, lifecycle | yes | appendix kernel A.5, KG-01..05, 17 | 7 | CONFIRMED |
| 19–20 disposal, leaks | yes (static) | appendix memory A2–A3, MT-01..03; AV-04; IR-11 | 6 | HIGH (no runtime numbers) |
| 21–23 state, single owner, reconciliation | yes | `CLIENT-STATE-OWNERSHIP.md` | 3 | HIGH |
| 24–32 transport, protocol, contract, headers, unknown packets, inspector, state machine, reconnect | yes (emulator absent) | appendix `net-protocol.md` | 14 | CONFIRMED / field order UNVERIFIED |
| 33–39 Pixi, frame loop, allocations, budget, profiling, batching, textures | yes (partly measured) | `CLIENT-RENDERING-ARCHITECTURE.md`, bench | 9 | sort MEASURED; passes UNVERIFIED |
| 40–45 asset caches, async, failure, pipeline, generated policy, `.ambreia` | yes | appendix assets A.1, AC-13..16 | 6 | CONFIRMED |
| 46–54 iso engine, coordinates, sorting, stability, spatial, culling, dirty, furniture, logics | yes | appendix `iso-render.md` | 15 (2 corrected) | CONFIRMED |
| 55–58 avatar engine, perf, cache keys, one renderer | yes | appendix `avatar-imager-platform.md` E–F | 10 | CONFIRMED (render not executed) |
| 59–74 UI engine, window manager, lifecycle, focus, pointer, input, design system, HUD, overlays, responsive, pixel-perfect, UI perf, layout XML, widget registry, Glaze | yes | appendix `ui-hud-glaze.md`; `shots/` | 22 | CONFIRMED; UI perf UNVERIFIED |
| 75 map editor | yes | appendix `map-editor.md` | 13 | CONFIRMED (Tauri runtime not run) |
| 76–77 imager, platform | yes | appendix avatar A.2–A.3, E | 8 | CONFIRMED |
| 78–81 config, ownership, failure UX, localization | yes | appendix assets A.2, AC-04/12/18; `shots/02-config-invalid.png` | 5 | CONFIRMED |
| 82–88 security, SSO, web, untrusted data, URLs, XML, cheat assumptions | yes | appendix assets AC-05..08; net NP-04/06/07/08; state §5 | 8 | CONFIRMED (hardening) |
| 89–94 build, bundle, lazy, tree shaking, boot, room entry | yes (measurement build) | appendix assets E.3, AC-09..11 | 6 | MEASURED / room entry UNVERIFIED |
| 95–98 frame/memory/long-session scenarios, listener instrumentation | **not executable here** | `CLIENT-PERFORMANCE-PLAN.md` §2–4; appendix memory F | protocols defined | — |
| 99–111 tests, engine testability, harness, sandboxes, visual, tolerance, contract, property, fuzz, fitness, synthetic feature, collisions, deterministic registration | yes | appendix memory A1, E; `CLIENT-EXTENSION-POINTS.md` §5–6; runtime B3–B4 | 9 | CONFIRMED |
| 112–117 TS quality, null semantics, traceability, legacy/new, dead code, orphans | yes | appendix memory A4–A7, MT-04/05/13 | 6 | HIGH (heuristic shares) |
| 118–124 errors, boundaries, logging, observability, overlay, room debugger, feature debugging | yes | appendix memory MT-11/12/15; iso §11 | 5 | CONFIRMED |
| 125–128 DX, golden paths, AI safety, source of truth | yes | appendix memory A5, MT-06/08; §31 | 4 | CONFIRMED |
| 129–136 CI, hooks, dependency security, Docker, Caddy, cache busting, compatibility, diagnostics | yes (Docker simulated) | appendix assets AC-01..03/06/08/17/20, E.2, E.4 | 9 | HIGH |
| 137–140 accessibility, resize, DPR, browser support | partly (resize and DPR observed) | runtime B1, RT-03/09; ui F | 3 | CONFIRMED for DPR/resize |
| 141–148 failure, race, maintainer, engine/MMO/platform/red-team/profiling passes | yes | woven into findings (MT-10, NP, IR, KG-11) | — | — |
| 149–180 matrices, scorecards, maturity, target, templates, gap, DAG, roadmap, acceptance, gates, tooling reuse, visual/perf/memory/security evidence, anti-overengineering, do-not-refactor, verdict, ultimate test | yes | this document, companions | — | — |

Anti-over-engineering check on every major recommendation: each is a registry, interface, typed option, test or header on code that
exists; none introduces ECS, Redux, event sourcing, CQRS, plugin frameworks, workers or WebAssembly. The one new "system" (the
connection state machine) replaces six booleans that already encode it.
