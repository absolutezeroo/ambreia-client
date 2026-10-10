# Ambreia client — performance plan

> Companion to `CLIENT-ENTERPRISE-AUDIT.md` (2026-10-10, `aeb88ba`). Rule of this plan: nothing is called slow without a number.
> Everything below is either MEASURED (with the number and how it was obtained) or PERFORMANCE RISK — UNVERIFIED (with the exact
> way to measure it). No optimisation is recommended before its measurement exists.

## 1. What was measured in this audit

| Item | Number | How |
|---|---|---|
| Depth sort of the whole `SortableSprite` list, nearly sorted (the steady state) | 0.005 / 0.036 / 0.109 / 0.452 ms at 200 / 1k / 3k / 8k sprites | Node 22 micro-benchmark `appendix/iso-sort.bench.ts` (`tsx`), imports only `SortableSprite.ts` |
| Same, fully shuffled (worst case, first frame after a room load) | 0.047 / 0.23 / 0.84 / 3.03 ms | idem |
| `bounds()` tuple allocation vs scratch object (5,000 calls) | 0.287 vs 0.348 ms (allocation is free under escape analysis) | idem |
| `RoomPlane.shareKey()` string building per frame, 120 floor planes | 0.16 ms | idem |
| Dev boot, warm (Vite, no server) | loading screen 1.6 s → bundles 3.05 s → first canvas 4.05 s → login 5.8 s | DOM polling every 250 ms (appendix `runtime.md` C) |
| Dev boot, cold | `load` 2.7 s, login ≈ 9 s | idem |
| Dev requests at boot | 250 requests / 10.0 MB; 207 are `vortex-layouts/*.xml?raw` | Playwright resource log |
| JS heap on the login screen | 195 → 212 MB after resizes | `performance.memory` (precise) |
| Idle frame time on the login screen (headless SwiftShader — pessimistic) | avg 17.8 / p50 16.7 / p95 33.3 ms | rAF sampler |
| UI sandbox, two static windows (CPU composite, SwiftShader) | avg 137 ms (7 fps), heap 38 MB | idem — not representative of a GPU machine, but the composite is pure CPU |
| Production bundle (measurement build with a synthetic release table — not deployable) | `index-*.js` 4,129 kB raw / 762 kB gz, single chunk; own layouts 1,722 kB pre-minify (15.3 %); pixi 991 kB; iso ≈ 1.7 MB; game ≈ 2.4 MB; ui ≈ 1.6 MB; zod 359 kB; pako 221 kB; fonts 1,245 kB as `/assets/*.ttf` **plus** 1.3 MB inside `assets-xml.ambreia`; `freetype.wasm` 830 kB + `harfbuzz.wasm` 390 kB awaited at boot; `assets-images.ambreia` 6.8 MB; dist 16 MB | `vite build` + sourcemap attribution (appendix assets E.3, F) |
| Prod bundle leak check | 0 message names, no `.map`, `REVISION` inlined, debugger eliminated | `check-release-bundle` logic re-run |
| User-Timing marks | 0 | `performance.getEntriesByType('mark')` |

## 2. What could not be measured here, and why

No game server (`../vortex-rpg-emulator`), no asset host (`vortex-assets.local`), no `public/config.json`: nothing that draws a
room, a furni or an avatar could run. The iso sandbox never initialises offline (blank page; furnidata 500 kills the module; the
default asset directories are the literal `${url.prefix}/ambreia/<family>/`). The measurement scripts are written and parked
(`iso.mjs` in the audit scratchpad: 100/400 objects, 20 reload cycles, heap before/after; it uses `stage.getRoom('zone').createRoomObject`,
`stage.loadRoom`, `sandbox.addAvatar`, and `?zone=big&furni=2000` already exists in `sandbox/main.ts`). Precondition to run them:
a local furnidata fixture + a minimal `room` `.ambreia` directory (+ `furniture`, `clothing`) or an `IsoStage` option to boot without
critical content.

## 3. PERFORMANCE RISK — UNVERIFIED (ranked by expected impact)

| # | Path | Why it is a risk | Frequency / complexity | Measure with |
|---|---|---|---|---|
| R1 | `RoomRenderingCanvas.updateOcclusion → hides()` + `updateXray` + `updateHoles` + `RoomLighting.render` | per-frame alpha probes (≤ 25 per overlapping pair) with a full-texture `getImageData` per **new** `Texture` (animated avatars recompose per frame); `updateXray`/`updateHoles` run even when `seeThrough` is false; 4–5 render-to-texture passes per occluded avatar; lighting 6–8 passes | every frame; O(avatars × overlapping sprites) + RT passes | add `FrameTimings` channels `room.occ`, `room.xray`, `room.holes`, `room.light`; wrap `CanvasRenderingContext2D.prototype.getImageData` to count readbacks; scenarios: 1 / 10 / 40 avatars behind the same tall furni, `seeThrough` on/off |
| R2 | Every logic and every visualization `update()` every frame (no upstream dirty gate) | O(objects) even for a static room; the only culling is per sprite after the work | every frame | `room.obj` channel on a static 500-furni room; expect near-zero after a dirty gate |
| R3 | UI composite while anything moves (`CombatOverlay` own rAF, HUD 250 ms ticker, skills 100 ms cast / 1 s status tickers re-rendering **all** panels, buff grid destroyed and rebuilt every second with `buildWidgetLayout` → `DOMParser` per buff) | full `WindowComposite` tree walk per frame in combat; XML parsed per build (no parsed-layout cache) | every frame in combat | `:showstats ui` + a counter on `buildWidgetLayout` calls/s with `__ambreia.hud.demo()` + 10 moving bars |
| R4 | `checkMouseHits('mouseMove')` every frame without a mouse event (AS3 parity) | O(sprites) alpha hit tests, `new Set` + array + event per frame | every frame | channel `room.mouse`; count per frame |
| R5 | Room content purge on every session end (dead reference counting) | every furniture/pet collection and library disposed → re-download + re-decode on re-entry | per room change | network tab on A → B → A; count `.ambreia` piece fetches; time to first furni |
| R6 | Boot critical path: config → 8.8 MB bundles → decode every layout-named bitmap → Pixi init → `bootFeatures` → WASM text engine (awaited) → UI → login | serial awaits; 1.2 MB WASM before first paint; 1.7 MB of XML parsed as JS strings | once | `performance.mark` at each `trackLoginStep` + `bundles.loaded`, `windowAssets.ready`, `pixi.ready`, `fonts.ready`, `login.shown`, `socket.open`, `auth.ok`, `room.ready` |
| R7 | `IsoView.pick()` (sandbox / map editor) | O(W × L) × 4 projections, ~6 allocations per tile per mousemove; 64×64 = 16k projections per move | per mousemove | time `pick()` on `?zone=big` |
| R8 | Map editor: full redraw per pointer move + 10 Hz backdrop timer + whole-room iso rebuild per floor edit | O(tiles + decor) per event; `loadRoom` + N awaited `addItem` per brush cell | per event | `performance.now()` around `IsoView.draw()` and `IsoBackdrop.sync()` on a 64×64 template with 200 furni |
| R9 | `PacketLogger.record` per packet in production (even disabled) + `getIncomingMessageName` string per packet | 1 object + 1 string per packet | per packet | `net` channel during a 50-avatar room |
| R10 | Avatar: per-instance body-part caches; identical NPC crowds compose N times (mitigated by `TRANSFORM_MEMO` and sprite-parts) | only if crowds of identical figures appear | per figure change | heap + `AvatarImageCache` size with 50 identical avatars (`sandbox.addAvatar`) |

## 4. Budget (targets to measure against)

| Scenario | Frame budget | Channels to record |
|---|---|---|
| Baseline room (`zone.json`: 11×10, 5 decor, 1 avatar) | ≤ 4 ms total; UI 0 when idle | `room.obj/sort/spr/occ/xray/light`, `pixi`, `ui` |
| 100 / 500 / 1,000 furniture (sandbox `?zone=big&furni=N`) | ≤ 8 / 12 / 16 ms | same + heap |
| 20 / 50 / 100 avatars walking | ≤ 8 / 12 / 16 ms | same; R1 channels are the ones to watch |
| Combat / VFX stress (10 health bars, 5 projectiles, 20 numbers, 2 casts) | ≤ 16 ms, UI composite ≤ 3 ms | `ui`, `buildWidgetLayout` calls/s |
| 8 HUD panels + 5 windows open | UI ≤ 2 ms idle, ≤ 4 ms moving | `ui` |
| Room entry (network → parse → assets → scene → sort → textures → first render) | ≤ 2 s on a warm cache, ≤ 5 s cold | marks `room.ready` − `OpenFlatConnection`; piece fetch count |
| Boot to login | ≤ 3 s warm on a GPU machine (dev measured 5.8 s under SwiftShader + Vite) | marks |
| GC | no pause > 10 ms in a 60 s combat loop | Chrome Performance → Memory |
| Long session | heap slope < 1 MB per 10 room changes after warm-up; `managedTextures.length` returns to baseline | protocol F-a (appendix memory) |

Machines: one GPU laptop (Chrome, DPR 1 and 2), one low-end (integrated GPU), Firefox if supported (not decided today). Record
`navigator.userAgent`, `devicePixelRatio`, renderer type (WebGL/WebGPU) with every run.

## 5. Instrumentation to add (prerequisite, small)

1. `performance.mark()` inside `Vortex.trackLoginStep` and the eight boot points above; expose `__ambreia.boot().marks`; attach to `BugReporter` (S).
2. `FrameTimings` channels for occlusion / x-ray / holes / lighting / mouse (S).
3. Make the `:showstats` overlay reachable again (`__ambreia.perf.show()` and a key), and a dev overlay with FPS, frame ms per
   channel, object/visible/sprite counts, texture count (`renderer.texture.managedTextures.length`), draw calls
   (`renderer.renderPipes` counter), room id, pointer tile, socket state, packets/s (M).
4. `run-vortex-client/driver.mjs`: Linux browser path, `heap`, `metrics`, `gc` commands, `--js-flags=--expose-gc` (S).
5. Offline fixtures for the iso sandbox and the avatar Node test so measurements and the two skipped render tests run in CI (M).

## 6. Optimisations, in the order their measurements allow

| Order | Change | Gate (measure first) | Expected effect | Effort | Regression risk |
|---|---|---|---|---|---|
| 1 | Gate `updateXray`/`updateHoles` under `seeThrough`; skip `hides()` unless own AABB moved or the sprite order changed; cache alpha data by `texture.source` + frame instead of the `Texture` object | R1 channels show > 1 ms at 10 avatars | removes the per-frame readback for animated avatars | S | medium (visual feature tuned by eye; keep screenshots) |
| 2 | Upstream dirty gate before `visualization.update()` (object/model/geometry ids + `isAnimating`) | R2 `room.obj` on a static room | O(changed) instead of O(objects) | M | medium (time-driven visualizations must declare `isAnimating`) |
| 3 | Parsed-layout cache per name in `WindowManager`; HUD render per changed key; buff captions updated in place; combat overlay on a cheap layer | R3 numbers | removes XML parsing from the per-second path; UI composite only when a window really changed | S / M | low |
| 4 | Reference-count asset collections (`assetCollection` setter/dispose) so `purge()` keeps the 20 s grace | R5 fetch count | no re-download on A → B → A | S | low |
| 5 | Own layouts out of the JS graph (into the deflated XML bundle); one font copy; `truffle-text` import deferred past first paint; `manualChunks` pixi/zod; `zod/mini` in the kernel | R6 marks | −1.7 MB JS parse, −1.25 MB assets, first paint before WASM | S–M | medium (font timing) |
| 6 | Tile-space occlusion (`TileObjectMap` + sorted index) and x-ray as a mask on a cached avatar texture | after 1 is measured | O(1) per occluder instead of pixel probes; one RT pass per change | M–L | medium |
| 7 | `IsoView.pick` inverse projection + candidate tiles; map editor rAF-coalesced draw, memoised `sortedDecor`, `setTile` instead of room rebuild | R7/R8 | editor usable at 64×64 | S–M | low–medium |
| 8 | `PacketLogger` history behind `_enabled || DEV`; cache stripped message names | R9 | removes 2 allocations per packet | S | none |
| 9 | Integer DPR scaling for the UI canvas; `antialias: false` on the main `Application` | HiDPI screenshot; `pixi` channel | crisp text; less fill rate | M | medium |

Not recommended: spatial index (object counts do not justify it), ECS/dirty-system rewrite, workers, WebAssembly for sorting
(measured cheap), code-splitting every feature (one meaningful boundary: editors/tools and the WASM text engine).
