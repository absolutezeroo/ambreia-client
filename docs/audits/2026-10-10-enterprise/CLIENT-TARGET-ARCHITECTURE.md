# Ambreia client — target architecture (TO-BE)

> Companion to `CLIENT-ENTERPRISE-AUDIT.md` (2026-10-10, revision `aeb88ba`). Derived from the code as it is, not
> imposed from the brief's diagram. Everything here is a *direction*; the migration order is in `CLIENT-ROADMAP.md`.
> Status: proposal, not approved. Nothing in this document changes code.

## 1. What stays (the AS-IS that already is the target)

The J1–J6 extraction produced the right package set. The target keeps it unchanged:

```
hosts        vortex-client   vortex-imager   vortex-glaze   @ambreia/map-editor   (dev tools)
game         @ambreia/game   — features/*, room glue, session, window, avatar editor
kernel       @ambreia/kernel — DI, typed config, defineFeature/bootFeatures
protocol     @ambreia/protocol — headers (generated), inherited messages, rpg parsers/serializers
engines      @ambreia/net   @ambreia/avatar   @ambreia/iso (→ avatar)   @ambreia/ui
base         @ambreia/common — Logger, assets (.ambreia), graphics, reactive, platform()
```

Package-level rules that hold today and remain law: engines import no kernel/protocol/game; `common` imports no Ambreia
package; `iso → avatar` only; `protocol → common, net, iso`; `game` imports no host; hosts import anything. These are
enforced by `eslint.config.mjs` `wall()` blocks and `packages/vortex-engine/tools/boundaries.test.mjs` (23 cases).

## 2. What changes

### 2.1 Hosts become thin, and the imager becomes an engine host

| Host | Today | Target |
|---|---|---|
| `vortex-client` | `App.ts` (1,865 l.) owns canvas, DOM input, render loop, login sequencing, layout globbing, connection actions | Owns only: page bootstrap, config sources, canvas + `CanvasInput` (shared with Glaze), loading screen, error screens. Login and connection sequencing move to game features with a `beforeConnect` hook. |
| `vortex-engine` | `Vortex` (singleton) + `VortexMain` (1,040 l.: copies `host.made.*` into 12 throwing getters, wires `RoomMessageHandler`, heartbeat, progress) | Renamed `@ambreia/client-shell` or folded into `vortex-client`. `prepareCore` shrinks to Pixi + ticker + `bootFeatures`; `RoomMessageHandler` wiring becomes a `room-message-handler` feature. `Vortex.instance` and `Core.instance` reads go to zero outside the shell. |
| `vortex-imager` | boots the kernel DI and the game's `HabboConfigurationManager` for one property map; monkey-patches globals; 543-line pixi shim | Depends on `@ambreia/{common, avatar, iso}` only, through an `ImagerProperties` object implementing `IRoomContentConfiguration`; uses `setPlatform()` like `tools/render-avatar.mjs`; ESLint wall added. |
| `vortex-glaze` | true consumer of `ui` (keep); duplicates the canvas input path | Uses `@ambreia/ui/kit/host/CanvasInput`; reads game widget types from a JSON the game exports (drops the `game`/`kernel` devDeps). |
| `@ambreia/map-editor` | reuses `IsoStage` (keep); borrows layouts/skins/locales from `vortex-client` through `import.meta.glob` | Owns its 45 layouts and `mapeditor.json`; shared Habbo skins/bundles come from a small `@ambreia/ui-assets` export used by Glaze, the UI sandbox and the editor. |

### 2.2 The feature contract (game layer)

`IGameFeature` today = `IFeature` + `images?` + `roomWidgets?`, and features exchange services through the mutable
`host.made` bag (20 nullable slots, order-dependent, invisible to the kernel because 11/22 features return `null`).
Target contract (kernel owns resolution, nothing else changes for a feature author):

```ts
export const Quests = defineGameFeature({
    id: 'quests',
    config: z.object({ maxTracked: z.number().int().default(5) }),
    provides: [IID_Quests],                       // typed capability (interface in quests/IQuests.ts)
    requires: [IID_Hud, IID_Character],           // asserted BEFORE create(); boot fails naming both sides
    optional: [IID_Combat],                       // may be null, declared so
    messages: QuestsMap,                          // MessageMap: installed/uninstalled by the kernel on connection events
    images: ['rpg/quests/*'],
    layouts: import.meta.glob('./layouts/*.xml', {query: '?raw', eager: true}),
    texts:   import.meta.glob('./locale/*.json', {eager: true}),
    roomWidgets: { RWE_QUEST_MARKER: {...} },     // exists today
    roomLogics: { quest_board: QuestBoardLogic }, // new: appended to DEFAULT_ROOM_MODULES by the room-engine feature
    hudPanels: [questsPanel],                     // new: {id, layout, anchor, order, render, describe?, onEvent?}
    keys: { 'quests.toggle': {default: 'L', scope: 'world'} },  // new: duplicate chord = boot error
    chatCommands: { quest: openQuest },           // new
    create: ctx => new RpgQuestSession(ctx.require(IID_Hud), ctx.require(IID_Character), ctx.optional(IID_Combat)),
    dispose: product => product.dispose(),       // new: reverse-order teardown
});
```

Rules: a feature imports another feature **only** through `../<other>/I*.ts` (ESLint `no-restricted-imports` per
folder, which does not exist today); shared view helpers (`WindowBits`, `HudTooltips`, `buildFrame`, `hudRules`,
`chatModel` helpers) move to `game/src/ui/kit/`; `IEngineManagers`/`host.made` disappears once every slot has an IID.
The current `new-game-feature` skill documents the workaround; it is rewritten with the contract.

### 2.3 The data flow (unchanged in shape, made explicit)

```mermaid
flowchart LR
  subgraph in[Server → screen]
    W[wire bytes] --> P[parser (protocol)] --> M[message class] --> H[IMessageHandler (feature)] --> S[feature session/state<br/>typed EventEmitter] --> V[feature view / HUD panel] --> R[@ambreia/ui renderer]
    S --> RE[RoomEngine façade IRpgRoomView] --> ISO[@ambreia/iso model → sprites → Pixi]
  end
  subgraph out[Input → server]
    I[InputBindings / window event] --> F[feature intent] --> MM[MessageMap.send(message class)] --> SER[serializer (protocol, declared wire types)] --> T[net transport]
  end
```

Invariants: handlers never see `IMessageDataWrapper` (true today); serializers declare wire types instead of relying
on JS `typeof` (not true today, NP-03); the client never gates an intent on cooldown/range/cost (true today — keep).

### 2.4 Connection as a state machine

`net` gains one `ConnectionStateMachine` (`Idle → Connecting → Handshake → Authenticated → InWorld → Reconnecting →
Disconnected/Failed`) replacing six booleans across three classes; it owns timeouts (open, handshake), bounded
reconnect with backoff, and emits typed transitions. `game` features subscribe to `reset` to `forget()` their
sessions (today: no reconnect, no resync, dead page after the dialog when not framed by the site).

### 2.5 Engines: the few openings they still need

| Engine | Target change | Why |
|---|---|---|
| `iso` | `RoomManager`/`RoomContentLoader` take typed options instead of `property/flag` string callbacks; `seeThrough` becomes `revealObjectId`; `isFurni`'s `pet_type` test becomes a host predicate; widget-named events move to `game/room/events`; registries refuse duplicates; effect hooks become registry instances; `IRoomRenderingCanvas` exposes per-sprite depth/screen position for a room debugger | spec §3 r1 / §5 r1; map editor and imager embed iso and carry RPG code they cannot use |
| `ui` | queue/processor/renderer/modal become instance-owned by `WindowManager`; `FrameController` raises `WE_CLOSE`; `WindowManager.dispatchKey()` routes keyboard to the focused chain; `purge()` scheduled; parsed-layout cache; `kit/widgets/habbo/*` move to game | two managers in one page; lifecycle owned by nobody; hotkeys bypass the engine |
| `avatar` | `AvatarImage.dispose()` unregisters; `IAvatarImage.getBodyPartImage()` public; weapon part types/actions read from partsets/actions XML | leak; imager reaches `_cache` by cast; RPG knowledge in constants |
| `net` | state machine (2.4); `readCount(max)` on the wrapper; declared wire types; WebCrypto randomness; `PacketLogger` history gated by dev | robustness, hardening |
| `common` | remaining `document.createElement('canvas')`/`new OffscreenCanvas`/`createImageBitmap` in `graphics/`, `assets/` go through `platform()`; AMBB/AMBP bounds check | one Node strategy instead of two |

### 2.6 Protocol

`NewStyleHeaders.ts` (two hand-kept `Set`s) is derived from the installed `MessageMap`s (`map.headers()`); the
registration tests keep enforcing "exactly one style per header". `HabboMessages.ts` is pruned to its ~220 live
lines. Contract tests gain "no bytes left unread" and a real-bytes round trip. A CI job clones the emulator at a
pinned ref so `gen-headers --check` and `wire-diff` are never vacuous.

### 2.7 Assets and build

Own layouts leave the JS graph (today 1.7 MB of XML string literals in `index-*.js`) and join the deflated XML
bundle; fonts ship once; `truffle-text` WASM is deferred past first paint; both `.ambreia` bundles get a content hash
in the name and `Cache-Control` headers exist (`immutable` for hashed, `no-cache` for `index.html`/`config.json`).
`pnpm build` accepts a dev release fixture so a clone without the emulator can build (clearly marked non-deployable).
Dockerfiles copy every workspace manifest (today they copy four of fourteen and cannot build).

## 3. Target dependency graph

```mermaid
flowchart TB
  C[vortex-client] --> G
  IM[vortex-imager] --> AV & ISO & CM
  GL[vortex-glaze] --> UI & CM
  ME[@ambreia/map-editor] --> MEC[@ambreia/map-editor-core] & UI & ISO & CM
  G[@ambreia/game] --> K[@ambreia/kernel] & P[@ambreia/protocol] & ISO & UI & AV & N & CM
  K --> CM
  P --> N & ISO & CM
  ISO[@ambreia/iso] --> AV[@ambreia/avatar] & CM
  UI[@ambreia/ui] --> CM
  N[@ambreia/net] --> CM
  AV --> CM
  CM[@ambreia/common]
  classDef host fill:#eee,stroke:#999;
  class C,IM,GL,ME host;
```

Differences from today: `vortex-imager` loses `game`, `kernel`, `vortex-engine` (and the unused `ui`, `net`,
`protocol`, `pako` declarations); `vortex-glaze` loses the `game`/`kernel` devDeps; `@ambreia/map-editor` loses the
hidden `vortex-client` data reach-through; `vortex-engine` disappears as a package.

## 4. Public API strategy (deep imports)

Every package exports `"./*": "./src/*.ts"`: all 2,165 files are public. Deep imports are the repo's working style
(`@ambreia/common/utils/Logger`) and are not banned. The target adds *tiers* without changing import syntax:

| Tier | Mechanism | Example |
|---|---|---|
| Public | listed in the package's `src/index.ts` (barrel) or a `public/` folder; documented in `docs/PATTERNS.md` | `@ambreia/iso/IsoStage`, `@ambreia/net/style/MessageMap`, `@ambreia/kernel/feature/defineFeature` |
| Package-internal | anything under `src/**/internal/` or not in the barrel; ESLint `no-restricted-imports` from *other* packages on `/internal/` | `@ambreia/iso/scene/renderer/*` |
| Feature-internal | `features/<x>/*` except `I*.ts`, `events.ts`, `feature.ts` | enforced by the per-folder rule in 2.2 |

The `exports` map stays `./*` until the barrel tier is complete, then narrows to `./index`, `./public/*`, `./*` with
a `sideEffects: false` field so tree shaking can drop unused modules (none declared today).

## 5. Tooling as first-class consumers (spec §8)

| Tool | Seam that exists | What is missing |
|---|---|---|
| Packet inspector (dev) | `IPacketTap`, `injectIncoming`, `PacketLogger` tally, `__packets` | the UI; dev-only install (today unconditional) |
| DevTools panel | `__ambreia.kernel()`, `__ambreia.boot()`, `FrameTimings`, `:showstats` | an overlay (FPS, frame ms, object/visible counts, textures, socket state, packet rate) and the occlusion/x-ray/lighting timing channel |
| Room debugger | `IsoView.pick`, `IRoomInstance.getObject`, `RoomRenderingCanvas.getSortableSpriteList` | per-sprite depth/screen position accessor |
| Avatar studio | `AvatarRenderManager` typed options, `tools/render-avatar.mjs` | the page |
| World editor | `IsoStage` (shared with sandbox and imager) | thickness/visibility fields in `IIsoRoomData`; incremental `setTile` use |
| Glaze | all of `ui` | shared `CanvasInput`; layout validity test over `vortex-layouts/*.xml` |

## 6. What this is not

No ECS, no Redux, no event sourcing, no plugin framework, no workers, no micro-frontends. Every change above is a
registry, an interface, or a typed option on code that already exists.
