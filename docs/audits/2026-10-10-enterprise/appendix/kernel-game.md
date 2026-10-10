# Kernel + game-layer architecture audit (read-only)

Repo `/home/user/ambreia-client` @ `aeb88ba` (branch `claude/determined-ritchie-omy2dy` == `origin/rpg-character`).
Scope: `packages/ambreia-kernel`, `packages/ambreia-game/src/{features,core,iid,session,communication}`,
`packages/vortex-engine/src/{Vortex,VortexMain}.ts`, `packages/vortex-client/src/App.ts`.
Tests run: `tsx --test packages/{ambreia-kernel,ambreia-game,vortex-engine}/test/*.test.ts` → **82 pass, 0 fail**.
No file under the repo was modified.

---

## (A) Facts & diagrams

### A.1 Verified boot sequence

```mermaid
sequenceDiagram
    autonumber
    participant IX as index.ts
    participant App as App.init (client)
    participant K as kernel/config
    participant V as Vortex (singleton)
    participant VM as VortexMain
    participant Core as Core / CoreComponentContext
    participant BF as bootFeatures
    participant F as feature.create / afterAttach
    IX->>App: app.init().catch(loadingScreen.showError)
    App->>K: loadConfig(browserSources(location, config.json), featureSections(GAME_FEATURES))
    Note over K: one merge, Zod strict parse, deepFreeze; ConfigError → showBootError()
    App->>App: AssetBundle.load(images), AssetBundle.load(xml)
    App->>App: readWindowAssets(featureImages(GAME_FEATURES, kernel))
    App->>V: Vortex.bootstrap(config) → Vortex.instance (lazy static) .init()
    V->>V: new Application().init(); canvas appended
    V->>VM: new VortexMain(loadingScreen); await init(app, config)
    VM->>VM: setTextureExtractor(); PacketLogger.install()
    VM->>Core: Core.instantiate() (static singleton)
    VM->>Core: registerInterface(IID_Core); attachInstance(IID_AssetLibrary)
    VM->>Core: attachComponent(CoreCommunicationManager)
    VM->>Core: ticker.add(update); ctx.initialize()
    Note over Core: no locked component yet → doInitialize() emits RUNNING (nobody listens)
    VM->>BF: await bootFeatures(ctx, GAME_FEATURES, kernel, host{made: emptyManagers()})
    loop 22 features, list order
        BF->>F: product = await create({context, config: section, app, host})
        Note over F: writes host.made.<slot>; reads host.made.<earlier slots>
        BF->>Core: attach(): Component→attachComponent | {instance}→attachInstance | null→[] (no requires)
        BF->>F: await afterAttach?(product)  (6 RPG features: await Promise.resolve(); install MessageMap on connection)
    end
    BF->>BF: providedInterfaces() ⊇ requires ? else FeatureDependencyError
    VM->>VM: copy made.* into private fields; made.configuration.once('complete') (dead: already emitted)
    VM->>VM: roomEngine.setStage/Canvas/Ticker; new RoomMessageHandler; RSE_STARTED/ENDED wiring
    VM->>VM: await Promise.resolve(); roomMessageHandler.connection = made.communication.connection
    VM->>VM: __ambreia.kernel/boot; addInitializationProgressListeners(): onConfigurationComplete(); queueMicrotask(onCoreRunning)
    V->>V: _ready = true; emit('ready')
    App->>App: installConnectionActions(); createCanvas(); initClientUi(): initAvatarEditor() [attachComponent outside kernel], setupRoomStateTracking(), await Promise.resolve(), startRenderLoop()
    App->>App: localization.loadTexts(); LoginScreen (if no ?sso); habboCommunication.ssoTicket = …
    App->>V: await vortex.connect() → demo.startConnectionWithSSO; waitForAuthentication(∞); wireRoomMessageHandler()
    App->>App: connection.isConfigured() (flush pending server messages)
```

Evidence: `App.ts:566-713`, `App.ts:715-750`, `App.ts:1004-1036`, `Vortex.ts:373-379, 543-640`, `VortexMain.ts:379-406, 475-620, 625-633, 715-733`, `CoreComponentContext.initialize()/doInitialize()`, `bootFeatures.ts:108-161`.

### A.2 Ordering hacks (all confirmed)

| Where | Code | Why it exists |
|---|---|---|
| `kernel/runtime/Component.ts` constructor callback | `if(!this._constructionComplete){ queueMicrotask(() => this.applyDependency(...)); return; }` and `queueMicrotask(() => { this.initComponent(); this.unlock(); })` | TS field initialisers run after `super()`; a dependency resolved synchronously during construction is applied one microtask later. **Root cause** of every hack below. |
| `VortexMain.ts:606` | `await Promise.resolve();` before `made.communication?.connection` | `HabboCommunicationManager.initComponent()` (`:497-524`) builds the connection in that microtask. |
| `features/{character,chat,inventory,interaction,combat,skills}/feature.ts` `afterAttach` (6×) | `await Promise.resolve(); const connection = host.made.communication?.connection ?? null; if(connection) …install(connection); else log.warn('no game connection…')` | Same reason, copied 6 times. Redundant in practice (many microtasks have elapsed since the communication feature), but the contract "connection exists one microtask after attach" is nowhere typed. |
| `App.ts:1032` | `// 11. Flush microtasks\n await Promise.resolve();` | Lets `HabboAvatarEditorManager.initComponent()` run before input/render start. |
| `VortexMain.ts:733` | `queueMicrotask(() => this.onCoreRunning());` | The real `RUNNING` event fired at `ctx.initialize()` (`:526`) **before** any feature existed; "core running" is simulated. |
| `VortexMain.ts:715-716` | `this.onConfigurationComplete();` called directly | Configuration completes synchronously in `Configuration.create` (`features/index.ts:130`, `HabboConfigurationManager.load():62-72` emits `'complete'`). |

### A.3 Static singleton reads (`packages/*/src`)

`Core.instance`: **12** — VortexMain 5, Vortex 3, ambreia-avatar 3 (`AvatarAssetDownloadManager` 2, `IAvatarRenderOptions` 1), `game/features/index.ts:262` 1 (`onLibraryLoaded: name => Core.instance?.updateLoadingProcess(name,'complete')`).
`Vortex.instance`: **46** — App.ts 25, `debugger/WindowDebuggerOverlay.ts` 14, VortexMain 3 (`:537` `renderer: () => Vortex.instance?.application?.renderer`, `:993`, `:1036`), Vortex 1, imager 2, iso `TextureExtractor.ts` 1.
`Vortex.instance` is a lazy constructor (`Vortex.ts:234-241`): reading it before boot *creates an unbooted Vortex*; `hasInstance` (`:253`) exists for that and has **0 call sites**. App guards with `if(Vortex.instance.disposed) return;` (`App.ts:1554,1664,1707,1742,1753`).

### A.4 `globalThis.__ambreia` in production code (no `import.meta.env.DEV` guard anywhere in `features/` or `vortex-engine/src`: 0 hits)

`features/character/feature.ts:37-38`, `hud/feature.ts:168-170`, `inventory/feature.ts:152-155`, `interaction/feature.ts:103-105`, `combat/feature.ts:276-283` (includes `simulate()` which emits fake `hits`), `skills/feature.ts:361-364` (`use`, `open`), `VortexMain.ts:394-402` (`boot()` reads the private `_configurationData` through a cast).

### A.5 DI mechanics (kernel) — what the code does

| Concern | Behaviour | Evidence |
|---|---|---|
| Resolution | `queueInterface` scans `_attachedComponents` in attach order, returns the first **non-locked** provider; else queues callback (LIFO pop on announce). | `ComponentContext.ts` (comment-stripped) `:57-87`, `:425-455` |
| Duplicate IID | **No guard.** `attachComponent` only checks `includes(component)`; a second provider of the same IID is attached and silently shadowed for later requesters (first non-locked wins). `bootFeatures` does not check either; only `RoomWidgetRegistry.register` refuses duplicates. | `ComponentContext.ts:108-152`, `bootFeatures.ts:143-158`, `RoomWidgetRegistry.ts:register` |
| Cycles / never-resolving | A↔B required: both stay `locked`; `armLockedComponentReport()` logs a `warn` **15 s** after core start (`LOCKED_REPORT_DELAY_MS = 15_000`). Boot does **not** fail: `providedInterfaces()` includes locked components (`if(!component.disposed)` only). | `CoreComponentContext.ts:162-179`, `ComponentContext.ts:99-107` |
| Missing dependency diagnostic | `FeatureDependencyError` names feature + IID + the disabled provider. Good, but covers only `Component.requiredDependencies` / `attach.dependencies` — **`null` products contribute `[]`**. | `bootFeatures.ts:164-182` (`if(product === null) return [];`) |
| `locked` observability | `Component.locked`, `pendingDependencyIids`, `describeLockedComponents()`, `IFeatureReport.state()` (live), `__ambreia.kernel()`. Observable, never enforced after boot. | `Component.ts`, `bootFeatures.ts:184-190` |
| Late attachment | `AvatarRenderer.create` calls `context.attachInstance(IID_AvatarRenderManager, …)` itself and returns `null` → kernel report says `'ready'` regardless; `provides` is declared but `stateOf` short-circuits on `product === null`. In practice attachment is synchronous (config `load()` is sync), so the `once('complete')` branch (`features/index.ts:268`) and `VortexMain.ts:556` are dead. | `features/index.ts:237-272`, `HabboConfigurationManager.ts:62-72` |
| Disposal order | `ComponentContext.dispose()` pops `_attachedComponents` (reverse attach order) → good. `attachInstance`'s `Carrier` is a bare `Component`: disposing it does **not** dispose the carried instance. `VortexMain.dispose()` therefore hand-disposes `_windowManager`, `_avatarRenderManager`, `_roomManager` (not `HabboRoomRendererFactory`). | `ComponentContext.ts:281-297, 389-424`, `VortexMain.ts:414-466` |
| Readiness | `ctx.initialize()` runs before `bootFeatures` → `RUNNING` emitted with 1 component attached. `onExitFrame` gate = `_roomEngineReady && _coreRunning` where `_coreRunning` is set by `queueMicrotask`. | `VortexMain.ts:526, 697-702, 733` |
| `update()` ordering | Root context: 3 priority levels, `registerUpdateReceiver` clamps to `[0,2]`, levels iterate 0→2, insertion order inside a level; `attachInstance.updatePriority` only used by `window-manager` (0). `ComponentContext._updateReceivers` (sorted list) is dead code on the root (overridden). | `CoreComponentContext.registerUpdateReceiver/simpleFrameUpdateHandler`, `features/index.ts:293` |
| Config side-effect | `HabboConfigurationManager` constructor does `context.configuration = this` (`:36`). | |

### A.6 Feature product kinds in `GAME_FEATURES` (22)

Component: configuration, communication, communication-demo, localization, room-session, session-data, room-engine, room-ui (8). Plain instance: room-manager, room-renderer-factory, window-manager (3). **`null`: asset-packs, avatar-renderer, avatar-info, loading-bar, character, hud, inventory, interaction, chat, combat, skills (11)** → half the features are invisible to the kernel's dependency check and lifecycle.

---

## (B) Findings

### KG-01 | HIGH | CONFIRMED | Feature wiring — `host.made` is an untyped service locator that bypasses the kernel
**Evidence**: `features/index.ts:56-87` (`IEngineManagers`: 20 nullable slots, concrete classes), `:109-116` `emptyManagers()`, 11 features `return null` (A.6); 77 optional-chain reads `made.X?.` (skills 28, combat 17, inventory 14, interaction 5, hud 4, character 4, chat 3, VortexMain 2); `bootFeatures.ts:166` `if(product === null) return [];`. Skill text: "the line in GAME_FEATURES after every feature whose host.made.* create reads synchronously".
**Files**: `features/index.ts`, all `features/*/feature.ts`, `kernel/feature/bootFeatures.ts`.
**Observed**: Order is a hand-maintained invariant. I verified every synchronous read today targets an earlier slot (hud→character ✓, inventory→character,hud ✓, interaction→roomEngine,hud ✓, skills→interaction,hud,hudPlayer ✓, chat→hud ✓); reads of later slots (interaction→combat, combat→skills) are inside callbacks, so they work by timing. Nothing checks this; a reorder or a new sync read fails silently (`?.` → feature does nothing). Spec §4 promises "order doesn't matter", "missing dependency fails the boot", "features talk through typed events"; reality for the 7 RPG features is none of the three.
**Why it matters**: the kernel's one real guarantee (named boot failure) does not cover the code being written now; the J5 report of "14 features ready" is vacuous for `null` products (`stateOf` → `'ready'`).
**Failure scenario**: move `HudFeature` after `InventoryFeature` → `host.made.hud` is null in inventory's `create` → `nav`/`changed` listeners never attach, the I key still opens the bag but the bottom bar never highlights; no log, no error, tests green.
**False-positive review**: tried to disprove by checking whether `IGameFeature` lets a feature declare what it needs — it does not (`GameFeature.ts:11-17`: `images`, `roomWidgets` only). Checked whether the `afterAttach` connection wait is the only cross-feature timing dependency — no: `hud.create` calls `bindCharacterToHud(host.made.character, state)` synchronously (`hud/feature.ts:94`). Confirmed.
**Recommended architecture**: features declare `requires: [IID…]`/`optional: […]`, `create` receives resolved typed services (`ctx.get(IID_Hud)`), the kernel orders a DAG and fails on missing/cyclic requirements; `host.made` disappears.
**Minimal fix (S/M)**: (1) add `requires?: readonly (keyof IEngineManagers)[]` to `IGameFeature`; in `bootFeatures`' game wrapper assert each required slot is non-null *before* `create` and throw `FeatureDependencyError` naming feature+slot; (2) type slots with the existing `I*` interfaces (`IRpgCharacterSession`, `IRpgInventorySession`), add the missing ones; (3) a unit test that boots `GAME_FEATURES` with fake host and asserts no sync read of a later slot (instrument `made` with a Proxy recording reads during `create`).
**Long-term**: kernel-resolved capability interfaces per feature (`provides`/`requires` IIDs), `create(ctx)` with `ctx.require(IID)`; remove `IEngineManagers`.
**Verify**: Proxy test above; `pnpm check`; `run-vortex-client` HUD nav highlight.
**Regression risk**: low for (1)-(3). **Effort**: S (1-3), L (long-term).

### KG-02 | MEDIUM | CONFIRMED | Kernel dependency check verifies "declared", not "resolvable"
**Evidence**: `ComponentContext.providedInterfaces()` adds interfaces of every non-disposed component including **locked** ones (`:99-107`); `bootFeatures.ts:143-158` only tests membership. `CoreComponentContext.armLockedComponentReport` warns after 15 s (`:162-179`).
**Observed**: two features requiring each other, or a component whose provider never unlocks, pass `bootFeatures`; the client shows a missing feature and a `warn` 15 s later. `IFeatureReport.state()` reads `'locked'` but nobody fails on it.
**Failure scenario**: `SessionDataManager` requires `IID_HabboLocalizationManager` and `IID_HabboCommunicationManager`; if `localization` were made to require session data, both stay locked, boot "succeeds".
**Recommended**: after the loop, `const stuck = reports.filter(r => r.state() === 'locked')` → `FeatureDependencyError` listing `pendingDependencyIids`; keep the 15 s warn for non-feature components.
**Minimal fix**: 10 lines in `bootFeatures` + a test ("a cycle is a boot error"). **Long-term**: resolve a DAG from declared requires before creating anything. **Verify**: kernel test. **Risk**: a legitimately-late provider (none today: A.5 late attachment is sync) would now fail — desirable. **Effort**: S.

### KG-03 | MEDIUM | CONFIRMED | Duplicate IID providers are silently shadowed
**Evidence**: `ComponentContext.attachComponent` (`:108-152`) has no "already provided" check; `queueInterface` returns the first non-locked match (`:57-72`); `attachInstance` builds a new carrier each call (`:389-424`); `bootFeatures` doesn't check `provides` collisions (`:120-141`). `createIID` uses `Symbol.for('IID:'+name)` → two files naming the same string are the *same* IID.
**Failure scenario**: a second feature declares `provides: [IID_RoomUI]`; which instance consumers get depends on attach order and lock state at request time; already-resolved consumers keep the old one.
**Recommended**: refuse in `attachComponent`/`attachInstance` when `providedInterfaces().has(iid)` (throw, like `RoomWidgetRegistry.register`), and in `bootFeatures` when two enabled features `provide` the same IID.
**Minimal fix**: S; test "two providers of one IID is an error naming both". **Risk**: `HabboWindowManager.createDependencies()` lists `IID_HabboWindowManager` itself (A.5 table) — verify it is a dependency, not a provide, before adding the guard. **Effort**: S.

### KG-04 | MEDIUM | CONFIRMED | Microtask-shaped lifecycle leaks into 8 `await Promise.resolve()` and a simulated `RUNNING`
**Evidence**: A.2. `Component.ts` `queueMicrotask` in `createDependencyCallback` and `onAllDependenciesQueued`; `VortexMain.ts:526` `ctx.initialize()` precedes `bootFeatures`; `:733` `queueMicrotask(() => this.onCoreRunning())`; the connection is created in `HabboCommunicationManager.initComponent` (`:497-524`).
**Why it matters**: "the connection exists one microtask after attach" is folklore copied into 6 features; `_coreRunning` gates `onExitFrame` (`:697`) on a fake signal; a future async dependency (a real late provider) would break every copy at once.
**False-positive review**: checked whether `afterAttach` already runs after the microtask — yes (`await feature.create()` yields), so the 6 waits are redundant today, not harmful. The design smell stands; the runtime bug does not.
**Recommended**: the communication feature exposes a readiness promise or the kernel awaits `initComponent` completion (`Component.ready: Promise<void>` resolved in `onAllDependenciesQueued`) and `bootFeatures` awaits it before `afterAttach`. Then delete the 8 waits and emit `RUNNING` after `bootFeatures`.
**Minimal fix**: add `readonly ready: Promise<void>` to `Component`; `bootFeatures` awaits it for Component products; remove the 6 `await Promise.resolve()`; move `ctx.initialize()` after `bootFeatures`. **Verify**: boot fingerprint `__ambreia.boot()` identical; `run-vortex-client` enters a zone. **Risk**: M (ordering of `onCoreRunning`/loading screen). **Effort**: M.

### KG-05 | MEDIUM | CONFIRMED | Teardown is incomplete for everything the kernel does not own
**Evidence**: no caller of `RpgCharacterSession/RpgChatSession/RpgCombatSession/RpgSkillSession/RpgInventorySession/RpgInteractionSession.dispose()` anywhere in `packages/*/src` (grep: 0); `HudPanelsState`, `PlayerHudState`, `HudView`, `HudPanelsView`, `CombatOverlay`, `SkillsWindow`, `InventoryView`, `CharacterWindow` never disposed (only `CharacterScreen` on `RSE_STARTED`, `character/feature.ts:36`); `globalThis.addEventListener('keydown', …)` in inventory `:108`, interaction, skills never removed; `MessageMap.install` returns an uninstaller that only `install()` itself calls (`RpgChatSession.install`). `attachInstance` carrier dispose does not dispose the instance (`ComponentContext.ts:389-424`); `VortexMain.dispose()` hand-disposes three (`:446-453`). `IFeature` has no `dispose`/`destroy` hook.
**Why it matters**: `Vortex.dispose()` (`Vortex.ts:493-541`) is reached only from `beforeunload`, so today nothing observable breaks; but the lifecycle the kernel advertises (create/attach/ready/dispose) stops at the carrier, and a second boot (`Core.dispose()` nulls the singleton, so it is possible) would double every listener.
**Recommended**: `IFeature.dispose?(product, ctx)` awaited in reverse order by a `disposeFeatures()`; carriers dispose instances implementing `IDisposable`; features return a disposer from `create`.
**Minimal fix**: carrier `dispose()` → `(instance as IDisposable).dispose?.()`; `bootFeatures` returns `{report, dispose()}`; each RPG feature registers its session + keydown remover. **Risk**: M (`HabboWindowManager` is disposed twice unless VortexMain's manual calls go). **Effort**: M.

### KG-06 | MEDIUM | CONFIRMED | Cross-feature imports are shared kit misfiled in features; no ESLint rule between features
**Evidence** (26 import edges): `WindowBits` (`features/character/WindowBits.ts`: generic text/visibility/colour/avatar helpers on `IWindowContainer`) imported by chat, combat, hud (4 files), interaction, inventory (4), skills (2); `hud/chatModel` (`chatClock`, `chatSend`, `IChatSend`, `ChatChannel`) → chat (2), combat, skills; `hud/PlayerHudState` (`SKILL_SLOTS`, `ISlotTip`) → skills (2); `hud/hudRules` (`expiring`, `SELECTED_MS`) → skills; `hud/HudPanelsState` types → interaction, skills; `hud/HudTooltips` → inventory/CharacterWindow; `inventory/InventoryView.buildFrame` → skills/SkillsWindow; `combat/vfxSheets` types → skills/RpgSkillSession; `character/IRpgCharacterSession` → hud/CharacterHudBridge (the one legitimate interface import). `eslint.config.mjs:286-300` walls `game` from host packages and `core/` from the game; **no rule between `features/*`** (spec §3 rule 4 says ESLint enforces it).
**Why it matters**: removing `character` breaks 6 features at compile time for a text helper; removing `inventory` breaks `skills` for a frame builder.
**Recommended**: move `WindowBits`, `buildFrame`, `HudTooltips`, `hudRules`, `chatClock`/`chatSend` to `game/src/ui/kit/` (or `@ambreia/ui` where it has no game dependency); features import each other only via `I*.ts`/`events`; add `no-restricted-imports` per feature folder allowing `../<other>/I*` only.
**Minimal fix**: the move (`tools/move-modules.mjs`) + one ESLint block. **Risk**: low (type-only + pure helpers). **Effort**: S-M.

### KG-07 | MEDIUM | CONFIRMED | Static singletons survive the kernel: `Core.instance` ×12, `Vortex.instance` ×46
**Evidence**: A.3. `VortexMain.ts:537` `renderer: () => Vortex.instance?.application?.renderer` (host built *inside* VortexMain reaches back up through the singleton); `features/index.ts:262` `Core.instance?.updateLoadingProcess`; `Vortex.instance` lazily constructs (`Vortex.ts:234-241`); App guards 5 handlers with `Vortex.instance.disposed`.
**Why it matters**: `vortex-imager` needs `shim/pixi.ts`+`RoomStack` to fake `Vortex.instance`; tests of `VortexMain` need a global; two hosts in one page are impossible.
**Recommended**: VortexMain receives `application` (it already does: `init(application, …)`) → `renderer: () => this._application?.renderer`; `onLibraryLoaded` closes over `ctx` passed to `create`; App keeps the `Vortex` it awaited from `bootstrapEngine()` instead of re-reading the static. `WindowDebuggerOverlay` (14) is dev-only.
**Minimal fix**: the two engine/game reads (S). App's 25 (M, mechanical). **Effort**: S+M.

### KG-08 | LOW | CONFIRMED | Dev hooks ship in production; `combat.simulate()` fakes server events
**Evidence**: A.4; `combat/feature.ts:276-283` `simulate()` emits `hits` with fabricated `RpgCombatEventsMessage`; `VortexMain.ts:394-402` casts to read `_configurationData`. Zero `import.meta.env.DEV` guards in `features/` and `vortex-engine/src`.
**Why it matters**: spec §7.6 (dev tools not in the production build — "pas comme protection"); `simulate` lets anyone display fake damage locally (harmless to others, but it is dead weight and a support confusion source).
**Minimal fix**: one `devHook(id, value)` helper in `game/src/features/devHooks.ts` that is a no-op unless `import.meta.env.DEV` (Vite inlines → tree-shaken); expose `configuration.entries()` instead of the cast. **Effort**: S.

### KG-09 | MEDIUM | CONFIRMED | Missing extension points: room logics, chat commands, HUD panels, message registry
**Evidence**: `RoomEngine.ts:593` `createRoomRegistries(DEFAULT_ROOM_MODULES)` (fixed list; `IGameFeature` has no `roomLogics`); chat commands are regexes in `hud/chatModel.ts:112-113` (`WHISPER`, `SHORTCUTS`); HUD panels are fields of `IHudPanels` (`HudPanelsState.ts:66-101`: `quests`, `party`, `buffs`, `boss`, `target`…) rendered by `HudPanelsView`, nav buttons are strings (`'nav_inventory'`, `'nav_skills'`, `'nav_character'`) compared in 3 features; every new-style message must also be listed in `protocol/src/NewStyleHeaders.ts` (two hand-maintained `Set`s) or `incoming-registered`/`outgoing-registered` fail; `RoomEngine.ts` is **10,335 lines** and grows one `*Rpg*` method per feature (`setRpgInteractives :9444`, `pickRpgTile :9450`, `setRpgTarget :9456`, `showRpgTelegraph :9473`, `setRpgStepTime :9525`, `clearRpgTelegraph :9532`, `playRpgEmote :5053`…).
**Why it matters**: spec §4's `roomLogics`, `chatCommands`, `map` fields do not exist; the "switches" moved from `RoomDesktop` to `HudPanelsState`/`chatModel`/`RoomEngine`.
**Recommended**: `IGameFeature.roomLogics` → `createRoomRegistries([...DEFAULT_ROOM_MODULES, featureModule])`; `chatCommands: Record<string, (args) => void>` consumed by `chatSend`; `hudPanels: {id, layout, bind(state)}` registry in `HudPanelsView`; derive `NewStyleHeaders` from the features' `MessageMap`s (`map.headers()`) instead of a list; a `RoomEngine` RPG façade interface (`IRpgRoomView`) so features depend on a small surface.
**Effort**: M each; the NewStyleHeaders derivation is S.

### KG-10 | LOW | CONFIRMED | Dead "late configuration" code paths and stale comments
**Evidence**: `HabboConfigurationManager.load()` is synchronous and emits `'complete'` (`:62-72`), called in `Configuration.create` (`features/index.ts:130`). Therefore `asset-packs/feature.ts:55` `configuration.events.once('complete', open)`, `features/index.ts:268` `configuration?.events.once('complete', start)`, `VortexMain.ts:556` `made.configuration?.events.once('complete', () => …)` never run; doc comments `:59` "null until the configuration completes", `:234` "once the configuration is complete, and registered then" describe J5's `external_variables` download that J6 removed.
**Minimal fix**: delete the `once` branches, make `asset-packs` and `avatar-renderer` plain sequential creates (or one feature), and let `avatar-renderer` return `{instance}` so the kernel owns it. **Effort**: S.

### KG-11 | MEDIUM | HIGH | State duplicated across layers; no reconciliation on reconnect
**Evidence**: "in a room" lives in `RoomSessionManager._sessions` (`:82`), `RoomMessageHandler._currentRoomId` (`:220`), `RoomEngine._activeRoomId` (`:610`), `App._isInRoom/_activeRoomId` (`setupRoomStateTracking`), and a closure in 6 features (`room`/`inWorld` in character, hud, inventory, interaction, combat, skills). Self HP: `PlayerHudState.hp` written by combat `'self'` (`combat/feature.ts:143`) and by `CharacterHudBridge.vitals()` (`hp: Math.min(hp ?? stats.maxHealth, maxHealth)` — assumes full health when unknown) while `RpgCombatSession._health` also tracks combatants. Figure: `host.made.character?.played?.figure ?? host.made.sessionData?.figure` in hud `:81` and inventory `:32`. Reconnect: grep `reconnect|resync|DISCONNECT` in `features/` → **0**; sessions `forget()` only on `RSE_ENDED`.
**Why it matters**: after a socket drop and re-login (the demo handles it), every RPG session keeps stale `inventory`, `cooldownEnds`, `_target`, `casts` until the server re-sends; the HUD may show the previous character's values for a frame or forever if a message is not resent.
**Recommended**: one `IZonePresence` (room id + own object id) owned by `room-session`, read by features; a `connection 'reset'` event every session `forget()`s on; HP/mana owned by `combat` only (character stats supply maxima).
**Minimal fix**: subscribe the 6 sessions' `forget()` to `HabboCommunicationManagerEvent.CONNECTION_ERROR`/disconnect in each `feature.ts`. **Effort**: S-M. **Not verified**: whether the server re-sends full state on re-entry (another agent / emulator).

### KG-12 | LOW | CONFIRMED | `IEngineManagers` is typed with concrete classes although interfaces exist
**Evidence**: `features/index.ts:72 character: RpgCharacterSession | null`, `:76 inventory: RpgInventorySession | null` while `character/IRpgCharacterSession.ts` and `inventory/IRpgInventorySession.ts` exist (used only by `CharacterHudBridge`); `avatar-info/feature.ts:15` and `loading-bar/feature.ts:15` use `ui.windowManager!`.
**Fix**: type the slots with `I*`; add `IHudPanels`-style interfaces for `hud`, `hudPlayer`, `combat`, `skills`, `interaction`, `chat`. **Effort**: S.

### KG-13 | LOW | CONFIRMED | Config: a deployment host in kernel source; mutable legacy copy; 116 legacy call sites, 0 migrated
**Evidence**: `kernel/config/browserSources.ts:3` `DEV_SERVER_HOST = 'ws://ourvjasausgxlxmrunm7ys1w.72.60.91.223.sslip.io'` (a tunnel URL compiled into a library); `HabboConfigurationManager.setProperty` is public and mutates the `Map` (frozen `IKernelConfig` stops at the adapter); legacy reads (`getProperty|getBoolean|getInteger|propertyExists|interpolate|updateUrlProtocol|setProperty(`) in game/engine/client: **116** call sites in 39 files (top: `HabboConfigurationManager` 18, `RoomEngine` 7, `HabboCommunicationDemo` 7, `SessionDataManager` 6, `WebApiLoginProvider` 6; **features/**: only `index.ts` 3 + `asset-packs` 1 `interpolate`); `legacy.defaults.json` 36 keys; J6 bilan: "aucune feature n'a encore migré ses clés". `?sso=`/`?link=` are the only URL params (`browserSources.ts:26-30`); `?log=` is read by `Logger` separately.
**Positive**: one parse, Zod strict per section, `enabled` added by the kernel, deep-freeze, unknown-section warning, invalid → `showBootError` listing fields (`App.ts:579-588, 646-656`). `config.section(id)` throws for an undeclared id (`loadConfig.ts:74`).
**Fix**: move `DEV_SERVER_HOST` to `vortex-client` (`import.meta.env.VITE_DEV_SERVER` or `public/config.json`); make `setProperty` dev-only; migrate RPG-era keys first (`RoomEngine` 7). **Effort**: S / M.

### KG-14 | INFO | CONFIRMED | `features/login` is not a feature; the host imports it directly
**Evidence**: no `feature.ts`, absent from `GAME_FEATURES`; `App.ts:28-29` imports `LoginScreen`, `AuthApi`; `App.ts:682-689` sequences `signIn()` → `ssoTicket` → `connect()`. Layouts `vortex_auth_*` (3 referenced), locale `auth.json`, test `rpg-login.test.ts`.
**Why**: the login must run between `bootstrap` and `connect()`, and `IFeature` has no "before connect" hook; `App` owns the connect sequence. Reasonable today; it should either be a feature with a `beforeConnect` hook or live under `game/src/login/` so the folder name stops lying.

### KG-15 | LOW | CONFIRMED | 203 of 269 `vortex_*_xml` layouts are unreferenced but bundled
**Evidence**: `ls vortex-layouts/*.xml` = 269; referenced names in `game/src`+`client/src` = 66 (hud 27, character 17, skill 11, combat 4, inventory 3, auth 3, perfmon 1). Unreferenced families: achievement 15, bestiary 5, craft 20, derby 4, dungeon 13, fishing 6, friends 4, group/guild 8, map_editor 46, market 14, quest 12, shop 8, social 12… (`App.readVortexLayouts` globs the folder: `App.ts:1116-1118`). Locales likewise ship `achievement/bestiary/craft/dungeon/market/quest/shop/social.json` with no feature.
**Why**: spec §4 colocation (`layouts/*.xml` in the feature) is not implemented; ownership is by prefix convention; mock-ups and future features are indistinguishable from live ones. **Fix**: `IGameFeature.layouts` glob per feature or a lint that each `vortex_*` prefix maps to an enabled feature. **Effort**: M.

### KG-16 | LOW | CONFIRMED | Documentation drift: PATTERNS.md predates features; spec §4 example ≠ `IGameFeature`
**Evidence**: `docs/PATTERNS.md:617` "### Registration (in VortexMain)", `:648` "Registration order in `VortexMain.initHabboManagers()` matters" (method no longer exists); 0 mentions of `defineFeature`, `host.made`, `GAME_FEATURES`, `IGameFeature`, `attachInstance`. Spec §4 example fields `map`, `roomLogics`, `chatCommands`, `layouts/`, `locale/` do not exist in `GameFeature.ts`. The `new-game-feature` skill is **accurate** to the code (3 edits in `features/index.ts`, `await Promise.resolve()`, `host.made.<slot>` with `?.`) — i.e. it documents the workaround as the method.
**Fix**: replace PATTERNS "Manager/IID registration" with a "Feature" template generated from `skills/feature.ts`; mark spec §4 fields as planned. **Effort**: S.

### KG-17 | INFO | CONFIRMED | Event typing is two-tier
RPG sessions: `EventEmitter<I…Events>` typed tuples (`RpgCombatSession.ts:67`, etc.) — good. Kernel/legacy: `Component.events: EventEmitter` untyped (string names, `any` payload: `ComponentEvents.*`, `'complete'`, `RoomSessionEvent.RSE_*` on `RoomSessionManager._sessionEvents: EventEmitter`). `HudPanelsState.events.nav: [string]` carries layout element names (`'nav_inventory'`) matched by `===` in inventory/skills/hud. Subscribers of `sessionEvents` in 6 features are never removed (KG-05).

### KG-18 | LOW | CONFIRMED | Boot-error UX covers two error classes only
`App.ts:579-588` `ConfigError`, `:646-656` `FeatureDependencyError` → `showBootError(title, issues)` panel. Any other throw from a `create()` (e.g. `asset-packs` rethrows `openAssetDirectories` errors `:49-50`) propagates to `index.ts:45` → `loadingScreen.showError(formatLoadingErrorMessage(error))` → "Client startup failed. Please restart the client." with the cause only in the console. **Fix**: wrap `create()` in `bootFeatures` and rethrow as `FeatureDependencyError(['Feature "x" failed to start: …'])`. **Effort**: S.

### KG-19 | INFO | CONFIRMED | Test coverage of the kernel is happy-path
`kernel/test/features.test.ts` (9 tests) covers satisfied/missing/disabled/optional deps, async create, instance product, report, host/afterAttach, essential. `config.test.ts` (12) is thorough. **Not covered**: duplicate IID, cycle/never-unlocking, `null` product with real needs, disposal order, carrier/instance disposal, update priority ordering, `locked` after boot. Game tests (11 files) test pure state/rule functions and one feature `create` (`asset-packs-feature.test.ts`); no test boots `GAME_FEATURES`.

---

## (C) Positive findings

| Verdict | What | Why |
|---|---|---|
| KEEP | `kernel/config/loadConfig.ts` | single merge, strict Zod per section, kernel-added `enabled`, deep-freeze, unknown-section warning, named errors; 12 tests. |
| KEEP | `FeatureDependencyError` + `essential` + `showBootError` | the one place the boot fails loudly and readably. |
| KEEP+STRENGTHEN | `bootFeatures` | extend to `null` products (KG-01), locked-after-boot (KG-02), duplicate provides (KG-03), create() errors (KG-18), dispose (KG-05). |
| KEEP+STRENGTHEN | `attachInstance` carrier | right idea (engines stay plain classes); make the carrier dispose `IDisposable` instances. |
| KEEP | `RoomWidgetRegistry` + `IGameFeature.roomWidgets`/`images` | the only extension points that exist; duplicate-safe, enabled-aware, tested (`feature-extensions.test.ts`). Pattern to copy for logics/commands/panels (KG-09). |
| KEEP | layouts and locales loaded by glob (`App.readVortexLayouts`, `OWN_TEXTS`) | no registration step for a new window/text. Add ownership (KG-15). |
| KEEP | typed `EventEmitter<I…Events>` on RPG sessions; `MessageMap.install()` returning an uninstaller; `install()` idempotent per connection | correct shape; just needs a caller for the uninstaller. |
| KEEP | `RpgSkillSession.cast()` sends unconditionally; cooldowns are server `remainingMs` projected to the local clock | respects server authority (spec §7 / principle 3); no client gating found anywhere (`select`, `send`, `cast`). |
| KEEP | `ComponentContext.dispose()` reverse order; `armLockedComponentReport` with `unref()` | correct; promote the warn to a boot failure for features. |
| KEEP | ESLint `wall()` blocks per package; `game/core` depth rule | enforced boundaries work; add the feature-to-feature block. |
| REFACTOR | `host.made` / `IEngineManagers` | transitional service locator → typed requires (KG-01). |
| REFACTOR | `VortexMain.prepareCore` tail (copy of `made.*`, 12 throwing getters, RoomMessageHandler wiring) | becomes a `room-message-handler` feature; VortexMain shrinks to Pixi + ticker + loading screen. |
| REPLACE | `once('complete')` configuration waits, `queueMicrotask(onCoreRunning)`, the 8 `await Promise.resolve()` | dead or folklore (KG-04, KG-10). |
| REPLACE | `WindowBits` location, `buildFrame` in `InventoryView` | shared kit, move (KG-06). |

---

## (D) Scorecard (0-10)

| Axis | Kernel | Game (features layer) | One line |
|---|---|---|---|
| Encapsulation | 6 | 4 | kernel hides DI well but exposes `queueInterface`/`locked` leaks; game shares a mutable bag and concrete classes. |
| Extensibility | 5 | 5 | `defineFeature` + sections + widgets/images exist; requires, logics, commands, panels, messages still centralised. |
| Testability | 7 | 6 | kernel is pure and tested on happy paths; game states are pure and tested, features themselves need a browser-ish host and `globalThis`. |
| Independence | 8 | 7 | kernel imports `common` only (ESLint-enforced); game never imports hosts, but features import each other (26 edges) and `Core.instance`/`Vortex.instance` remain. |
| Lifecycle | 5 | 3 | create/attach/ready exist, dispose is partial; 11 features have no lifecycle at all beyond `create`. |
| API quality | 6 | 5 | `IFeature` is small and clear; `FeatureProduct`'s `null` is a trapdoor; `IEngineManagers` is 20 nullable concrete slots. |
| Performance architecture | 7 | 6 | priority update loop, no per-frame allocation in the kernel; features use `setInterval` tickers (`CAST_TICK_MS` 100, status 1 s) instead of the update loop — fine at this scale. |

---

## (E) Feature table, removability, N+1

### E.1 Feature table

| id | kind / class | writes `host.made` | reads `host.made` (count) | messages (MessageMap) | views / windows | layouts (referenced) | images | config section | events out → in | tests |
|---|---|---|---|---|---|---|---|---|---|---|
| configuration | Component `HabboConfigurationManager` | configuration | — | — | — | — | — | (essential) | `'complete'`, `CONFIGURATION_LOADED` | kernel config tests |
| asset-packs | null | assetDirectories | configuration (1), assetDirectories (3) | — | — | — | — | clothing/effects/room/pets/furniture/icons/key | ← configuration `'complete'` (dead) | asset-packs-feature (4) |
| communication | Component `HabboCommunicationManager` | communication | — | legacy `HabboMessages` | — | — | — | (essential; `app.server`, `app.sso`) | `LOGIN_STEP`, `AUTHENTICATED`, `CONNECTION_ERROR`, `DISCONNECT_ACKNOWLEDGED`, `UPDATE_REQUIRED` | update-required (3) |
| communication-demo | Component `HabboCommunicationDemo` | demo | — | legacy incoming (login) | ErrorPopupCtrl dialogs | — | — | (essential) | — | — |
| localization | Component `HabboLocalizationManager` | localization | — | — | — | — | — | — | `'complete'` | — |
| room-manager | instance `RoomManager` (iso) | roomManager | — | — | — | — | — | — (reads legacy via callbacks) | — | room-manager (2) |
| room-renderer-factory | instance | — | — | — | — | — | — | — | — | — |
| room-session | Component `RoomSessionManager` | roomSession | — | legacy handlers | — | — | — | — | `RSE_CREATED/STARTED/ENDED`, `RSUDUE_*` | — |
| session-data | Component `SessionDataManager` | sessionData | — | legacy handlers | — | — | — | — | `SessionDataEvent` | — |
| room-engine | Component `RoomEngine` (10,335 l.) | roomEngine | assetDirectories (closure) | via `RoomMessageHandler` (VortexMain) | — | — | — | — | `REE_*`, `REOE_*` | room-registries, texture-extractor |
| avatar-renderer | null (self-attaches `AvatarRenderManager`) | avatarRenderer | configuration, assetDirectories | — | — | — | — | — | ← `'complete'` (dead) | — |
| window-manager | instance `HabboWindowManager` | windowManager | — | — | window system | all | — | — | — | habbo-widgets (1) |
| room-ui | Component `RoomUI` | roomUI | — | — | RoomDesktop | — | — | `{enabled}` in example | widget events | — |
| avatar-info | null | — | — | — | `AvatarInfoWidget` (under `ui/`) | — | — | — | RWE_AVATAR_INFO | feature-extensions |
| loading-bar | null | — | — | — | `LoadingBarWidget` | — | — | — | RWE_LOADINGBAR | feature-extensions |
| character | null `RpgCharacterSession` | character | 8 (windowManager, localization, avatarRenderer, roomSession, communication) | `RpgCharactersMap`: 6 in / 4 out | `CharacterScreen`, `CharacterCreateView` | 10 `vortex_character_create_*`, `_select_*` | — | — | `characters/classes/result/state/progress/stats` → ← `RSE_STARTED` | rpg-character (4), protocol rpg-characters |
| hud | null `HudPanelsState`+`PlayerHudState` | hud, hudPlayer | 11 (character 3, sessionData 2, localization 2, windowManager, roomSession) | — | `HudView`, `HudPanelsView`, `ChatPanel`, `HudTooltips` | 27 `vortex_hud_*` | CHAT_ICONS + demo icons | — | `changed/nav/say/emote`, `use` → ← `RSE_*`, `RSUDUE`, character events | hud-rules (4), hud-state (5), chat (4) |
| inventory | null `RpgInventorySession` | inventory | 20 (hud 5, character 5, windowManager 2, localization 2, sessionData, roomSession, communication) | 2 in / 6 out | `InventoryView`, `CharacterWindow`, `CharacterSheet` | 10 (`vortex_inventory_*`, `vortex_character_sheet/stat/tab_stats/help/attribute/equipment_tip`) | ITEM_ICONS, STAT_ICONS | — (fetches `/webapi/…/content/texts`) | `inventory/result` → ← hud `nav/changed`, character `state/stats`, `RSE_*`, keydown I/C | inventory (4), protocol rpg-items |
| interaction | null `RpgInteractionSession` | interaction | 9 (roomSession 2, roomEngine, localization, hud, communication, combat) | 2 in / 1 out | — (writes hud.target) | `vortex_hud_target_xml` (shared with hud) | — | — | `interactives/target` → ← `REOE_SELECTED/DESELECTED`, hud `changed`, `RSE_*`, Escape | protocol rpg-interaction |
| chat | null `RpgChatSession` | chat | 7 (localization 2, hud, roomEngine, communication) | 3 in / 2 out | — (writes hud chat lines) | — (hud's chat layouts) | — | — | `message/emote/result` → ← hud `say/emote` | chat (4), protocol rpg-chat/rpg-emote |
| combat | null `RpgCombatSession`, `CombatVfx` | combat | 20 (hud 5, roomEngine 3, interaction 3, skills 2, hudPlayer 2, windowManager, roomSession, localization, communication, character) | 6 in / 0 out | `CombatOverlay` | 4 `vortex_combat_*` | VFX_IMAGES | — | `hits/vitals/self/death/result/yell/health/impacts/outcomes/cast/mark` → ← `RSE_*` | combat-vfx (2), protocol rpg-combat |
| skills | null `RpgSkillSession` | skills | 32 (roomEngine 8, hud 8, combat 4, hudPlayer 3, interaction 2, character 2, windowManager, roomSession, localization, communication) | 8 in / 3 out | `SkillsWindow` | 13 (`vortex_skill_*` 11 + `vortex_hud_slot_tip`, `vortex_character_stat_row`) | SKILL_IMAGES, SKILL_WINDOW_IMAGES | — (fetches `/webapi/…/content/definitions`) | `skills/result/castStart/castEnd/cooldowns/statuses/events/telegraphs` → ← interaction `target`, hudPlayer `use`, hud `nav`, `RSE_*`, keydown 1-6/K/Esc | status-hold (3), protocol rpg-skills |
| login (not in list) | `LoginScreen`, `AuthApi`, `AuthForm` | — | — | web API (fetch) | `LoginScreen` | 3 `vortex_auth_*` | — | — | — | rpg-login (5) |

### E.2 Removability (delete folder + its `features/index.ts` lines; what else breaks)

| Feature | Class | Breaks outside the folder |
|---|---|---|
| loading-bar | **FULLY MODULAR** | `test/feature-extensions.test.ts` names it (J6 proof script). |
| avatar-info | MOSTLY MODULAR | widget lives in `ui/widget/avatarinfo/`; `RoomDesktop.showGamePlayerName` types it. |
| chat | MOSTLY MODULAR | `index.ts` ×3 (import/slot/`emptyManagers`); nothing imports `chat/`; hud keeps emitting `say` into the void (typed text silently dropped). |
| interaction | MOSTLY MODULAR | `index.ts` ×3; combat/skills read `host.made.interaction?.targetId` → always 0, no log. |
| skills | MOSTLY MODULAR | `index.ts` ×3; combat `host.made.skills?.definition()` → no VFX, silent; `SkillsWindow` imports from inventory/hud (compile ok when removing skills). |
| combat | COUPLED | `index.ts` ×3; `skills/RpgSkillSession.ts:14` imports `../combat/vfxSheets` types → **compile error**; interaction reads `combat?.healthOf`. |
| inventory | COUPLED | `index.ts` ×3; `skills/SkillsWindow.ts:13` imports `buildFrame` from `../inventory/InventoryView` → **compile error**. |
| character | COUPLED | `index.ts` ×3; `WindowBits` imported by chat, combat, hud(4), interaction, inventory(4), skills(2) → **compile errors in 6 features**; `hud/CharacterHudBridge` imports `IRpgCharacterSession`. |
| hud | COUPLED→CORE-EMBEDDED | `index.ts` ×3 (two slots); `chatModel`, `PlayerHudState`, `hudRules`, `HudPanelsState`, `HudTooltips` imported by chat(2), combat, skills(4), interaction, inventory → **compile errors in 5 features**. |
| asset-packs | CORE-EMBEDDED | `assetDirectories` read by `room-engine` closure and `avatar-renderer`; without it no avatar/room asset loads (`log.error`). |
| login | n/a | `App.ts:28-29` imports it. |
| 12 inline features | CORE-EMBEDDED | `VortexMain` copies them into fields with 12 throwing getters; `App` reads `vortex.windowManager/localization/habboCommunication/roomEngine`; `room-engine`/`room-session`/`window-manager` are required IIDs of each other. `enabled:false` on `room-engine` is caught by `FeatureDependencyError` (J5 proof). |

### E.3 N+1: adding `quests` (window + HUD panel + 2 incoming + 1 outgoing + config + room object logic + chat command)

| Need | New files | **Existing files that must change today** | Spec §4 target |
|---|---|---|---|
| Declaration | `features/quests/feature.ts`, `RpgQuestSession.ts`, `IRpgQuestSession.ts`, `QuestsWindow.ts` | `features/index.ts`: import, `IEngineManagers.quests` slot, `emptyManagers()`, `GAME_FEATURES` line (**3-4 edits, 1 file**) | 1 line |
| Messages | `protocol/src/incoming/rpg/quests/*Message.ts` + `parser/`, `outgoing/rpg/quests/*` + serializer, `features/quests/RpgQuestsMap.ts`, `protocol/test/rpg-quests.test.ts` | emulator `Headers.cs` → `pnpm gen:headers` → `Headers.generated.ts`; **`protocol/src/NewStyleHeaders.ts`** (2 sets) or `incoming-registered`/`outgoing-registered` fail; `HabboMessages.ts` untouched ✓ | messages in the feature folder, no central list |
| Window | `QuestsWindow.ts` | `vortex-layouts/vortex_quest_xml.xml` exists (12 quest layouts already on disk, unreferenced); glob-loaded ✓; opened by key + `host.made.hud?.events.on('nav', n => n === 'nav_quests')` | layouts in feature folder |
| HUD panel | — | `IHudPanels.quests/questAlert` already exist → `host.made.hud?.update({quests})`. A *new* panel = edit `hud/HudPanelsState.ts` + `hud/HudPanelsView.ts` (+ layout); a new bottom-bar button = `vortex_hud_action_bar_xml` + `HudView.setNav` | `hudPanels` registry |
| Config | `config: z.object(...)` in `feature.ts` | none (`featureSections(GAME_FEATURES)`) ✓ | ✓ |
| Texts | `vortex-client/src/locales/{fr,en}/quest.json` (exist) | none (glob) ✓ | locale in feature folder |
| Images | `images: [...]` | none ✓ | ✓ |
| Room object logic | — | **not possible from a feature**: `RoomEngine.ts:593 createRoomRegistries(DEFAULT_ROOM_MODULES)`; edit an iso module or `RoomEngine` (engine change) | `roomLogics` |
| Chat command `/quest` | — | `hud/chatModel.ts` `SHORTCUTS`/`chatSend` + `test/chat.test.ts` | `chatCommands` |
| Tests | `game/test/quests.test.ts` | — | ✓ |
| App.ts / VortexMain.ts / RoomWidgetRegistry | — | **none** ✓ (unless a room widget → `roomWidgets` ✓) | ✓ |

Other N+1s: **party** — pure game feature (`IHudPanels.party` exists; needs messages + `index.ts` + `NewStyleHeaders`). **target frame** — exists (interaction + hud). **buffs** — exists (skills → `hud.buffs`). **achievements** — pure game (15 layouts + `achievement.json` already shipped). **minimap** — needs **engine capability**: iso must expose tile geometry/visible objects or a render-to-texture of the room, plus a `RoomEngine` façade method; today only `getRpgAnchor/getRpgOverlayCell` exist.

---

## (F) State ownership

| State | Owner (truth holder) | Writers | Readers | Server-authoritative? | Reconciliation (resync / reconnect / room change) | Flag |
|---|---|---|---|---|---|---|
| Current room / session | `RoomSessionManager._sessions` | room handlers (legacy msgs) | `RoomMessageHandler._currentRoomId`, `RoomEngine._activeRoomId`, `App._isInRoom/_activeRoomId`, `room`/`inWorld` closures in 6 features | yes | `RSE_STARTED/ENDED`; `REE_INITIALIZED/DISPOSED` for App | **≥10 copies**; no reconnect path |
| Played character | `RpgCharacterSession.state/played` | `RpgCharacterStateMessage` | hud (bridge), inventory (`stats` local copy), skills/combat (`classId`) | yes | message-driven; `forget()`? none on disconnect | duplicated `stats` in inventory closure |
| HP / mana (self) | **unclear**: `PlayerHudState.hp/mana` (view) ← combat `'self'` (RpgSelfVitals) and `CharacterHudBridge.vitals` (clamps; assumes full when unknown); `RpgCombatSession._health` map (per combatant) | combat, bridge | HudView; interaction (`combat.healthOf(target)`) | yes | none on reconnect; `RSE_ENDED` → `inCombat:false` only | **two projections**; bridge invents full HP before first vitals |
| Selected target | `RpgInteractionSession._target` (server `RpgTarget`) | server; `select()` sends `RpgTargetSelect` on REOE_SELECTED/Escape/panel close | hud `target` (copy with hp), RoomEngine `setRpgTarget`, skills `targetId()`, combat `classOf` | yes (server confirms) | `RSE_ENDED` → `forget()`, `hud.target=null` | hud→model feedback: closing the panel sends select(0) ✓ |
| Inventory | `RpgInventorySession.inventory` | server | InventoryView, CharacterWindow | yes | none on reconnect | — |
| Skills / cooldowns | `RpgSkillSession.bar/_cooldownEnds/_globalEnd` (server `remainingMs` → `Date.now()`) | server `RpgCooldowns` | HUD slots (`readyAt`), SkillsWindow | yes; `cast()` sends unconditionally ✓ | `RSE_ENDED` → `forget()`; `PlayerHudState.startCooldown` used only by `demo()` | ✓ no client gating (range/cost/cooldown) found |
| Casts / statuses (client timers) | skills feature closures `casts`, `ownStatuses` (+ `setInterval` tickers) | server castStart/castEnd/statuses | hud target/boss cast bar, buffs | yes (display timers only) | cleared on `RSE_ENDED` | ok |
| Connection state | `HabboCommunicationManager._connection` + `IConnection` flags | comm manager, demo | `App._authenticated` (via `IConnectionActions`), `Vortex._ready`, 7 features at `afterAttach` | n/a | `setDisconnected/reset` → App flag; features: nothing | sessions keep installed on a dead connection |
| Avatar figure | `RpgCharacterSession.played.figure` vs `SessionDataManager.figure` | server (two messages) | hud `:81`, inventory `:32` (`played ?? sessionData`) | yes | — | fallback chain = duplicated truth |
| Config | `IKernelConfig` (frozen) | kernel once | features (`config`), App (`app.*`) | n/a | — | `HabboConfigurationManager` is a **mutable** legacy copy (`setProperty`) |

---

## (G) Not verified

- Runtime behaviour in a browser (no `run-vortex-client` pass, no emulator): the order-dependence (KG-01) and disposal (KG-05) findings are from code reading, not from reproducing a failure.
- Whether the server re-sends full RPG state on re-entry/re-login (KG-11's impact depends on it).
- `pnpm check` end-to-end (only the three test packages were run: 82/82; the orchestrator's "369 pass" is the full `pnpm test`).
- The exact dependency lists extracted by `awk` for `RoomUI`, `HabboWindowManager.createDependencies()`, `SessionDataManager` (A.5 table) are approximate; `RoomSessionManager` and `RoomEngine` were read precisely.
- The 132 legacy-read figure given in the brief: my regex count is 116 in game/engine/client (57 for the four `get*/propertyExists` methods alone); the difference is method set, not disagreement on the pattern.
- `vortex-imager`, `vortex-glaze`, `ambreia-iso` internals (other agents).
