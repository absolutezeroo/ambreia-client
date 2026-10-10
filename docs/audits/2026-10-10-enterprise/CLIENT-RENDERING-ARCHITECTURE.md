# Ambreia client — rendering architecture

> Companion to `CLIENT-ENTERPRISE-AUDIT.md` (2026-10-10, `aeb88ba`). Two renderers coexist by design: the room is a
> PixiJS v8 stage, the window system is a Canvas2D compositor blitted over it. This document records the AS-IS
> pipeline, ownership and lifetimes, the measured and unmeasured hot paths, and the target.

## 1. AS-IS: two canvases, one frame

```mermaid
sequenceDiagram
    participant RAF as rAF / Pixi Ticker
    participant VM as VortexMain.update
    participant CC as ComponentContext.update (priority 0→2)
    participant RE as RoomEngine.update (prio 1)
    participant RM as RoomManager / RoomInstance
    participant RC as RoomRenderingCanvas.render
    participant PX as Pixi Application.render (prio LOW)
    participant APP as App.renderFrame (own rAF)
    participant UI as WindowManager.update → WindowComposite
    RAF->>VM: update(ticker)
    VM->>CC: update(clamped deltaMS)
    CC->>RE: update(delta)   %% parameter named `time`, ignored downstream
    RE->>RE: createRoomFurniture() (budgeted queue)
    RE->>RM: update(): processLoadedContentTypes (40 ms budget); every logic.update(now)
    RE->>RC: RoomRenderer.update → render(now)
    RC->>RC: per object: visualization.update → RoomObjectSprite[] → SortableSprite (cull per sprite)
    RC->>RC: stacking post-pass; whole-list sort (b.z − a.z)
    RC->>RC: updateSprite × N (pooled ExtendedSprite)
    RC->>RC: updateOcclusion → hides() alpha probes → updateHoles (RT) → updateXray (RT ×4-5 per occluded avatar)
    RC->>RC: updateLighting (6–8 RT passes when lit)
    RC->>RC: update(): checkMouseHits('mouseMove') when no mouse event this frame
    RE->>RE: updateRoomCameras
    RAF->>RE: onTickerUpdate: createRoomFurniture() again, canvas-sync, cursor
    RAF->>PX: render the Pixi stage (FrameTimings `pixi`)
    APP->>UI: receivers → MouseEventProcessor per layer → render dirty windows (OffscreenCanvas each) → full-tree composite → drawImage on the UI canvas
```

Facts (verified in code):

- **State / presentation / render are separated in iso.** State = `RoomObject` + `RoomObjectModel` (updateIDs,
  immutable keys). Presentation = `RoomObjectSprite` (plain record with a `Texture` reference and `updateId`).
  Pixi `Sprite`s exist only as the pooled `ExtendedSprite` list written in `RoomRenderingCanvas.updateSprite`.
  Exceptions: occlusion/x-ray/mouse passes read the drawn `ExtendedSprite` children back (AS3 parity); `RoomPlane`
  owns a `Graphics` + `Texture`; `RoomLighting` is Pixi-only.
- **The UI never goes through Pixi.** `App.renderFrame` composites the window tree into a 2D canvas when the renderer
  has pending updates or the version changed; `imageSmoothingEnabled = false`, `image-rendering: pixelated`.
- **Pixel policy**: `TextureSource.defaultOptions.scaleMode = 'nearest'`, `resolution: 1`, `autoDensity: true`,
  rounded screen positions in the canvas, integer `place()` in features. One knob to revisit: `antialias` defaults to
  `true` on the main `Application` (MSAA on a nearest-sampled stage; the sandbox uses `false`). DPR > 1 is upscaled by
  the browser (not configurable; crispness at DPR 2 unverified).
- **Per-frame sort is cheap (measured)**: TimSort on a nearly-sorted list, 0.11 ms at 3,000 sprites, 0.45 ms at
  8,000 (shuffled: 0.84 / 3.0 ms). `bounds()` tuple allocation is free under escape analysis. `RoomPlane.shareKey()`
  strings cost 0.16 ms per frame for 120 planes. Benchmark: scratchpad `bench/iso-sort.bench.ts` (Node 22).
- **No upstream dirty gate**: every logic and every visualization runs `update()` every frame; culling is per sprite
  after the work; `RoomCullingMode.avatars` is off by design. Dirty flags exist downstream (`updateID`s, per-object
  sprite cache early-out, `ExtendedSprite.needsUpdate`, `RoomPlane._geometryUpdateId`).
- **Occlusion / x-ray / holes / lighting run every frame.** `canvas.seeThrough = true` for every game canvas
  (`RoomEngine.ts:5564`); `updateXray` and `updateHoles` run even when `seeThrough` is false; `hides()` does an AABB
  test then up to 25 alpha probes per overlapping pair; `ExtendedSprite.getAlphaHitData` reads back a whole texture
  with `getImageData` once per `Texture` object (an animated avatar's composed texture is a new object per animation
  frame unless `_fullImageCache` hits). Cost **not measured** (needs textures + GPU): PERFORMANCE RISK — UNVERIFIED.
- **Depth tie-break**: `z = baseZ + relativeDepth + 3.7e-11 × (objectIndex + spriteIndex)`; stable sort; deterministic
  per session, not across clients (arrival order).
- **Content lifetime**: `GraphicAssetCollection.addReference/removeReference` have no caller; `purge()` (called by
  `RoomSessionManager` on every session end, after `VortexMain` disposed the room) therefore drops every furniture and
  pet collection and asset library immediately — the AS3 20 s grace never applies, and re-entering a room re-downloads
  and re-decodes everything.
- **Draw calls / batching**: textures per furniture piece are spritesheets (batchable); x-ray/holes/lighting use
  `RenderTexture`s and filters (batch breaks per pass). Not measured.

## 2. Ownership and lifetime of textures

| Texture / cache | Loaded by | Owned by | Referenced by | Evicted | Destroyed |
|---|---|---|---|---|---|
| Furniture / pet spritesheets (`.ambreia` pieces) | `AmbreiaPieceLoader` → `AssetLibrary` | `RoomContentLoader` (`_assetLibraries`, `_graphicAssetCollections`) | visualizations' `assetCollection` (no ref count) | `purge()` on every session end (all) | `NitroAsset.dispose()` → spritesheet/base texture `destroy(true)` |
| Room planes (floor/wall) | `RoomPlane` rasterizers (canvas → `Texture.from`) | `RoomPlane` (+ `RoomPlane.SHARED` ref-counted for identical floors) | plane sprites | on geometry/material change | `dispose()` releases the share correctly |
| Avatar body parts / full images | `AvatarImageCache` per `AvatarImage` | `AvatarImage` | room `AvatarVisualization` (per room object), widgets (create + dispose per refresh) | `disposeInactiveActions(60 s)` from the room | `AvatarImage.dispose()` destroys; but `AvatarRenderManager._activeImages` keeps the disposed shell (no `unregisterImage` caller) |
| Colour-transform memo | `AvatarImageCache.TRANSFORM_MEMO` (static `WeakMap` by source bitmap, 512/source) | process | all images | cap per source | with the source |
| UI window buffers | `WindowRenderer` (one `OffscreenCanvas` per rendered window) | renderer | composite | `purge()` — **no caller** | on `WindowDisposeEvent`; hidden/detached windows keep theirs |
| Client bundles (`assets-images.ambreia`, `assets-xml.ambreia`) | `AssetBundle` (whole file in memory, blob URLs) | `App` (never disposed by design) | UI resources | — | page unload |
| x-ray / hole / lighting render textures | `RoomRenderingCanvas`, `RoomLighting` | canvas | per frame | — | canvas `dispose()` (lighting and `_discEraser` not disposed: minor gap) |
| Imager PNGs | `RenderCache` (LRU + in-flight de-dup) + `DiskCache` (per asset build) | imager | HTTP | LRU ttl / never on disk | — (a timed-out effect produces a wrong PNG cached permanently) |

Cache classes recommended: **permanent** (client bundles, embedded avatar XML), **session** (avatar libraries,
`TRANSFORM_MEMO`), **room** (furniture/pet collections: retained by visualizations, dropped 20 s after the last
release), **feature** (HUD icons by `images`), **transient** (render textures). An LRU is only needed for the imager
(exists). Measure before adding a persistent Cache API tier (listed as "à reprendre" in the 2026-10-08 bilan).

## 3. Hot-path table

| Path | Frequency | Complexity | Allocation | Measured |
|---|---|---|---|---|
| logic.update per object | per frame × N | O(N) | none | read |
| visualization.update per object | per frame × N | O(N × sprites) | furniture: none when unchanged; avatar: template strings on sprite rebuild | **no** (no upstream dirty gate) |
| plane `shareKey()` | per frame × planes | O(planes) | ~6 strings/plane | 0.16 ms / 120 planes |
| sort | per frame | O(S log S), ~O(S) nearly sorted | none | 0.11 ms @3k, 0.45 ms @8k |
| updateSprite | per frame × S | O(S) | none (pooled) | read |
| occlusion `hides()` | per frame | O(own × candidates) + ≤25 probes/pair | tuple (free) | **no** |
| `updateXray` | per frame (even when off) | O(avatars × later sprites) + 4–5 RT passes per occluded avatar | 2 closures per slot | **no** |
| `updateHoles` | per frame × discs | O(S) + 2 RT | none | **no** |
| lighting | per frame when lit | 6–8 RT passes + blur | `{x,y}` | **no** |
| `checkMouseHits` | per frame without mouse event | O(S) alpha tests | `Set`, array, event object | **no** |
| UI composite | per frame while anything moves | O(visible windows) full-tree walk | — | **no** (`:showstats ui` channel exists) |
| `buildWidgetLayout` | per window build; per buff per second in combat | XML parse (`DOMParser`), no parsed cache | tree | **no** |
| `PacketLogger.record` | per packet, even when disabled | O(1) | 1 object + 1 string | read |
| `IsoView.pick` (sandbox / editor) | per mousemove | O(W × L) × 4 projections | ~6 allocs / tile | read |

## 4. Render performance budget (targets to measure against, not claims)

| Scenario | Frame time target | What to record (`:showstats` channels + Chrome Performance) |
|---|---|---|
| baseline room (zone.json, 5 decor, 1 avatar) | ≤ 4 ms total, UI idle 0 | `room.obj`, `room.sort`, `room.spr`, `pixi`, `ui` |
| 100 / 500 / 1,000 furniture (sandbox `?zone=big`) | ≤ 8 / 12 / 16 ms | same + heap |
| 20 / 50 / 100 avatars walking | ≤ 8 / 12 / 16 ms | add an **occlusion/x-ray/lighting** channel (missing today) |
| combat/VFX stress (10 bars, 5 projectiles, 20 numbers) | ≤ 16 ms, UI composite ≤ 3 ms | `ui`, `buildWidgetLayout` calls/s counter |
| 8 HUD panels + 5 windows open | UI ≤ 2 ms idle, ≤ 4 ms moving | `ui` |
| GC | no pause > 10 ms in a 60 s combat loop | Performance → Memory |

Method: `run-vortex-client` against the emulator (not available in this audit) or the iso sandbox with injected
objects; `FrameTimings` is the in-game harness; `renderer.renderPipes` for draw calls; a
`CanvasRenderingContext2D.prototype.getImageData` wrapper to count readbacks.

## 5. Target rendering architecture

```mermaid
flowchart LR
  SS[server state] --> M[RoomObject + RoomObjectModel<br/>(updateIDs)] --> D{dirty?<br/>object / model / geometry / animating}
  D -- no --> SKIP[skip visualization.update]
  D -- yes --> PM[RoomObjectSprite[] (presentation)] --> SORT[SortableSprite list → stable sort<br/>tie-break (tileX+tileY, objectId)] --> ES[pooled ExtendedSprite (Pixi)] --> PX[Pixi render]
  TM[TileObjectMap + sorted index] --> OCC[occlusion in tile space<br/>(no pixel probes)] --> ES
  OCC --> XR[x-ray mask on cached avatar texture<br/>re-rendered on change only] --> ES
  UI[WindowManager tree] --> DIRTY[dirty windows → per-window buffers] --> COMP[composite with stable-branch cache] --> C2D[UI canvas]
```

Rules that follow from it:

1. **Pixi objects are never state.** Keep the `RoomObject → RoomObjectSprite → ExtendedSprite` chain; move the
   occlusion/x-ray data structure from drawn sprites to the presentation model + `TileObjectMap`.
2. **Upstream dirty gate** before `visualization.update()`: skip when object/model/geometry ids are unchanged and the
   visualization is not animating (visualizations declare `isAnimating`).
3. **Content retained by its users**: `RoomObjectSpriteVisualization.assetCollection` setter/dispose call
   `addReference/removeReference`; `purge()` keeps the 20 s grace; `_lastReferenceTimestamp` initialised at creation.
4. **One measurement channel per pass** (`room.occ`, `room.xray`, `room.light`), reported by `:showstats` and by the
   dev overlay.
5. **UI**: parsed-layout cache per name; composite cache for stable branches (`docs/WINDOW_OPTIMIZATIONS.md` §1, still
   open); HUD renders per changed key and updates buff captions in place; the combat overlay anchored to room
   objects moves to a cheap dedicated layer (or the Pixi stage) instead of invalidating the UI composite every frame.
6. **Pixel-perfect**: keep nearest + resolution 1; decide integer UI scaling (1×/2×) with `image-rendering: pixelated`
   as a host option; set `antialias: false` on the main application.
7. **Determinism**: depth ties broken by `(tileX + tileY, objectId)` instead of arrival index.

Nothing here requires a new engine; all of it is inside `RoomRenderingCanvas`, `RoomInstance`, `RoomContentLoader`,
`WindowManager`/`WindowComposite`, and the HUD views.
