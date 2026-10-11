import {devHook} from '@ambreia/common/utils/BuildEnv';
import {EventEmitter} from 'eventemitter3';
import type {HabboConfigurationManager} from '@ambreia/game/configuration/HabboConfigurationManager';
import type {HabboCommunicationManager} from '@ambreia/game/communication/HabboCommunicationManager';
import type {HabboCommunicationDemo} from '@ambreia/game/communication/demo/HabboCommunicationDemo';
import type {HabboLocalizationManager} from '@ambreia/game/localization/HabboLocalizationManager';
import {WindowParser} from '@ambreia/ui/utils/WindowParser';
import type {RoomEngine} from '@ambreia/game/room/index';
import { RoomMessageHandler} from '@ambreia/game/room/index';
import type {RoomManager} from '@ambreia/iso/RoomManager';
import {setTextureExtractor} from '@ambreia/iso/renderer/TextureExtractor';
import type {RoomSessionManager} from '@ambreia/game/session/RoomSessionManager';
import {RoomSessionEvent} from '@ambreia/game/session/events/RoomSessionEvent';
import type {SessionDataManager} from '@ambreia/game/session/SessionDataManager';
import type {AvatarRenderManager} from '@ambreia/avatar/AvatarRenderManager';
import {AvatarAssetDownloadManager} from '@ambreia/avatar/AvatarAssetDownloadManager';
import type {HabboWindowManager} from '@ambreia/game/window/HabboWindowManager';
import type {RoomUI} from '@ambreia/game/ui/RoomUI';
import {Core} from '@ambreia/kernel/Core';
import {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {AssetTypeDeclaration} from '@ambreia/common/assets/AssetTypeDeclaration';
import {XmlAsset} from '@ambreia/common/assets/XmlAsset';
import {UnknownAsset} from '@ambreia/common/assets/UnknownAsset';
import {CoreCommunicationManager} from '@ambreia/game/core/communication/CoreCommunicationManager';
import type {CoreComponentContext} from '@ambreia/kernel/runtime/CoreComponentContext';
import {CoreComponentContextEvents, CoreSetup} from '@ambreia/kernel/runtime/CoreComponentContext';
import {Logger} from '@ambreia/common/utils/Logger';
import {FrameTimings} from '@ambreia/common/utils/FrameTimings';
import type {IVortexConfig, IVortexWindowAssets} from './VortexConfig';
import {Vortex} from './Vortex';
import {bootFeatures} from '@ambreia/kernel/feature/bootFeatures';
import type {IKernelReport} from '@ambreia/kernel/feature/bootFeatures';
import {GAME_FEATURES, emptyManagers} from '@ambreia/game/features/index';
import {roomWidgetRegistry, guardedFeatures} from '@ambreia/game/features/GameFeature';
import type {IEngineHost} from '@ambreia/game/features/index';

import {PacketLogger} from '@ambreia/net/PacketLogger';
import {IID_AssetLibrary} from '@ambreia/kernel/iid/IIDAssetLibrary';
import {IID_CoreCommunicationManager} from '@ambreia/game/iid/IIDCoreCommunicationManager';
import {IID_Core} from '@ambreia/kernel/iid/IIDCore';
import type {IHabboConfigurationManager} from '@ambreia/game/configuration/IHabboConfigurationManager';
import type {IHabboWindowManager} from '@ambreia/game/window/IHabboWindowManager';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {ISessionDataManager} from '@ambreia/game/session/ISessionDataManager';
import {IID_HabboAvatarEditor} from '@ambreia/game/iid/IIDHabboAvatarEditor';
import {HabboAvatarEditorManager} from '@ambreia/game/avatar/HabboAvatarEditorManager';
import type {IVortexMain} from "./IVortexMain";
import type {IVortexLoadingScreen} from './IVortexLoadingScreen';
import type {Application, Ticker} from 'pixi.js';

const log = Logger.getLogger('VortexMain');

/**
 * HabboMain
 *
 * Engine orchestrator for the Habbo client.
 * Manages all Habbo-specific managers, module system, and localization.
 *
 * Follows the AS3 pattern where HabboAirMain.as orchestrates the engine
 * while HabboAir.as acts as the application shell.
 *
 * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as
 */
export class VortexMain implements IVortexMain 
{
    /**
     * Ratio of progress bar dedicated to core/SWF loading (0.0 to CORE_RATIO).
     * The remaining (CORE_RATIO to 1.0) is for initialization steps.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as::CORE_RATIO
     */
    // AS3: .../src/binaryData/HabboAir.as::CORE_RATIO
    private static readonly CORE_RATIO: number = 0.6;

    /**
     * Number of initialization steps for progress tracking in the [CORE_RATIO - 1.0] range:
     * 1. Configuration loaded
     * 2. Localization loaded
     * 3. All components ready (core running / COMPONENT_EVENT_RUNNING)
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as::INIT_STEPS
     */
    // AS3: .../src/binaryData/HabboAir.as::INIT_STEPS
    private static readonly INIT_STEPS: number = 3;

    /**
     * PixiJS Application reference.
     * Passed in from Vortex shell (which owns the Application).
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as (uses stage from HabboAir)
     */
    private _application: Application | null = null;
    private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    /**
     * Loading screen reference.
     *
     * AS3: HabboAirMain receives _loadingScreen from HabboAir constructor.
     * Calls _loadingScreen.updateLoadingBar(progress) during initialization.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as _loadingScreen
     */
    // AS3: .../src/binaryData/HabboAir.as::_loadingScreen
    private _loadingScreen: IVortexLoadingScreen | null = null;
    /**
     * Number of completed initialization steps.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as _completedInitSteps
     */
    // AS3: .../src/binaryData/HabboAir.as::_completedInitSteps
    private _completedInitSteps: number = 0;
    /**
     * Denominator of the progress fraction: the core's asset-library files plus INIT_STEPS.
     *
     * AS3 seeds it to INIT_STEPS and overwrites it in prepareCore() the moment the config
     * document has been read, so the bar is spread over the files as well as the three steps —
     * which is what makes the last step land on exactly 1.0. The port used the bare INIT_STEPS
     * constant as the denominator and so could only ever show 73%, 87% or 100%.
     */
    // AS3: .../src/binaryData/HabboAir.as::_totalInitSteps (name derived: the denominator of updateProgressBar())
    private _totalInitSteps: number = VortexMain.INIT_STEPS;
    /**
     * Core asset-library files finished so far, counted into the same fraction as the steps.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as _loadedFiles
     */
    // AS3: .../src/binaryData/HabboAir.as::_loadedFiles
    private _loadedFiles: number = 0;
    /**
     * Receives the core's `progress` / `complete` library events.
     *
     * AS3 passes `this` to `readConfigDocument()` — HabboAir is itself an EventDispatcher and
     * listens on itself. VortexMain is not a dispatcher, so it hands the core a dedicated
     * emitter and listens on that.
     */
    // AS3: .../src/binaryData/HabboAir.as::addEventListener("progress", onProgressEvent)
    private readonly _loadingEvents: EventEmitter = new EventEmitter();
    /**
     * Whether the room engine has finished initialization.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as _SafeStr_412
     */
    private _roomEngineReady: boolean = false;
    /**
     * Whether all core components are running.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as _SafeStr_413
     */
    private _coreRunning: boolean = false;
    /**
     * Guards onExitFrame()'s cleanup so it only runs once.
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/HabboMain.as::dispose() (called once from onExitFrame)
     */
    private _bootFinalized: boolean = false;
    private _habboCommunicationManager: HabboCommunicationManager | null = null;
    private _localizationManager: HabboLocalizationManager | null = null;

    /**
     * AS3: HabboAirMain(_arg_1:IHabboLoadingScreen, _arg_2:Dictionary)
     *
     * @param loadingScreen - Loading screen to update during initialization
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as constructor
     */
    constructor(loadingScreen?: IVortexLoadingScreen | null) 
    {
        this._loadingScreen = loadingScreen ?? null;
    }

    /**
     * Asset library reference (created in prepareCore).
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as (AssetLibrary is a core component)
     */
    private _assets: AssetLibrary | null = null;

    get assets(): IAssetLibrary 
    {
        if(!this._assets) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._assets;
    }

    private _roomUI: RoomUI | null = null;

    // TS-only: what the kernel booted (J5), for the dev tools (window.__ambreia.kernel).
    private _kernelReport: IKernelReport | null = null;

    /** The features as the kernel booted them: id, provides, waits on, state (read live). */
    get kernelReport(): IKernelReport | null
    {
        return this._kernelReport;
    }

    get roomUI(): RoomUI 
    {
        if(!this._roomUI) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._roomUI;
    }

    private _avatarEditor: HabboAvatarEditorManager | null = null;

    // TS-only: the toolbar and the own-avatar menu that opened the editor are gone (core cut,
    //   2026-10-07); this getter is the editor's entry point until the RPG HUD exists.
    get avatarEditor(): HabboAvatarEditorManager | null
    {
        return this._avatarEditor;
    }

    private _avatarRenderManager: AvatarRenderManager | null = null;

    get avatarRenderManager(): AvatarRenderManager 
    {
        if(!this._avatarRenderManager) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._avatarRenderManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_windowManager
    private _windowManager: HabboWindowManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get windowManager()
    get windowManager(): IHabboWindowManager 
    {
        if(!this._windowManager) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._windowManager;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/Habbo.as::_disposed
    protected _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    private _configurationManager: HabboConfigurationManager | null = null;

    get configurationManager(): IHabboConfigurationManager 
    {
        if(!this._configurationManager) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._configurationManager;
    }

    private _communicationDemo: HabboCommunicationDemo | null = null;

    get communicationDemo(): HabboCommunicationDemo 
    {
        if(!this._communicationDemo) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._communicationDemo;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_roomManager
    private _roomManager: RoomManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get roomManager()
    get roomManager(): RoomManager 
    {
        if(!this._roomManager) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._roomManager;
    }

    private _roomMessageHandler: RoomMessageHandler | null = null;

    get roomMessageHandler(): RoomMessageHandler 
    {
        if(!this._roomMessageHandler) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._roomMessageHandler;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_roomSessionManager
    private _roomSessionManager: RoomSessionManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get roomSessionManager()
    get roomSessionManager(): RoomSessionManager 
    {
        if(!this._roomSessionManager) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._roomSessionManager;
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get localization()
    get localization(): HabboLocalizationManager 
    {
        if(!this._localizationManager) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._localizationManager;
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_roomEngine
    private _roomEngine: RoomEngine | null = null;

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get roomEngine()
    get roomEngine(): RoomEngine 
    {
        if(!this._roomEngine) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._roomEngine;
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_sessionDataManager
    private _sessionDataManager: SessionDataManager | null = null;

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager 
    {
        if(!this._sessionDataManager) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._sessionDataManager;
    }

    get habboCommunication(): HabboCommunicationManager 
    {
        if(!this._habboCommunicationManager) 
        {
            throw new Error('[HabboMain] Not initialized');
        }

        return this._habboCommunicationManager;
    }

    /**
     * Initialize the engine orchestrator.
     *
     * AS3 flow:
     * 1. prepareCore() — create Core, register all components
     * 2. addInitializationProgressListeners() — track config, localization, room engine, core running
     *
     * The texts are not loaded here: the client reads them out of its bundle and hands them to
     * the localization manager (App.ts, HabboLocalizationManager.loadTexts()).
     *
     * @param application - The PixiJS Application (created by Vortex shell)
     * @param config - Optional Vortex configuration
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as prepareCore()
     */
    async init(application: Application, config: IVortexConfig): Promise<void>
    {
        this._application = application;

        // The room renderer reads sprites back through this; it has no renderer of its own (J4).
        setTextureExtractor(target => application.renderer.extract.canvas(target) as HTMLCanvasElement);

        // Console-only tracing; records nothing to the log until __packets.on() is called.
        PacketLogger.install();

        await this.prepareCore(config);

        // A fingerprint of the boot, read by the dev tools and by J5's before/after comparison:
        // what was attached in which order, what still waits, every configuration property.
        // TS-only: introspection, read-only.
        devHook('kernel', () => this._kernelReport?.features.map(feature => ({...feature, state: feature.state()})) ?? []);
        devHook('boot', () => ({
            attached: (Core.instance as CoreComponentContext | null)?.describeAttached() ?? [],
            locked: (Core.instance as CoreComponentContext | null)?.describeLockedComponents() ?? [],
            configuration: [...((this._configurationManager as unknown as {_configurationData?: Map<string, string>})?._configurationData ?? new Map()).entries()].sort(([a], [b]) => a.localeCompare(b)),
            progress: [...this._progressLog]
        }));

        this.addInitializationProgressListeners();
    }

    /**
     * Dispose engine resources.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as dispose()
     */
    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::dispose()
    dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

        log.info('Disposing HabboMain...');

        // Stop update loop
        this._application?.ticker.remove(this.update, this);

        // Stop heartbeat
        if(this._heartbeatTimer !== null) 
        {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }

        // AS3: _loadingScreen.dispose() + _loadingScreen = null
        if(this._loadingScreen) 
        {
            this._loadingScreen.dispose();
            this._loadingScreen = null;
        }

        // Dispose RoomMessageHandler (not a Component, needs manual dispose)
        this._roomMessageHandler?.dispose();
        this._roomMessageHandler = null;

        // The features first, last booted first: their listeners on the managers go before the managers.
        this._kernelReport?.dispose();
        this._kernelReport = null;

        // Nullify Habbo manager refs (inverse init order)
        this._avatarEditor = null;
        this._roomUI = null;
        this._windowManager?.dispose();
        this._windowManager = null;
        this._avatarRenderManager?.dispose();
        this._avatarRenderManager = null;
        this._roomEngine = null;
        this._sessionDataManager = null;
        this._roomSessionManager = null;
        this._roomManager?.dispose();
        this._roomManager = null;
        this._localizationManager = null;
        this._communicationDemo = null;
        this._habboCommunicationManager = null;
        this._configurationManager = null;
        this._assets = null;

        // Do NOT dispose Core or Application — owned by Vortex shell
        setTextureExtractor(null);
        this._application = null;
    }

    /**
     * Create Core and prepare all components.
     *
     * AS3: HabboAirMain.prepareCore() calls Core.instantiate(stage, 1, reporter, dict),
     * then registers all component libraries via _core.prepareComponent().
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as prepareCore()
     */
    // AS3: .../src/binaryData/HabboAir.as::prepareCore()
    async prepareCore(config: IVortexConfig): Promise<void> 
    {
        const ctx = Core.instantiate(
            CoreSetup.FRAME_UPDATE_SIMPLE
        ) as CoreComponentContext;

        // AS3: _loc1_.addEventListener("COMPONENT_EVENT_REBOOT", onCoreReboot), in prepareCore()
        // right after Core.instantiate. Its sibling COMPONENT_EVENT_ERROR is not subscribed here
        // because this port's core never emits it — `CoreComponentContextEvents` has RUNNING and
        // REBOOT only, and `onCoreError()` is reached through `Vortex.reportCrash` instead.
        ctx.events.on(CoreComponentContextEvents.REBOOT, this.onCoreReboot);

        // AS3: addEventListener("progress", onProgressEvent) / ("complete", onCompleteEvent), then
        // `_core.readConfigDocument(<config><asset-libraries><library url="hh_human_body.swf"/>
        // <library url="hh_human_item.swf"/></asset-libraries>…</config>, this)`, and only then
        // `_totalInitSteps = getNumberOfFilesPending() + getNumberOfFilesLoaded() + INIT_STEPS`.
        //
        // The whole progress path was ported into CoreComponentContext — the counters,
        // updateLoadingProcess(), the LibraryProgressEvent — and nobody called it, so both
        // counters read 0 and the bar had only the three init steps to move on. The mandatory
        // avatar libraries (AS3's two, plus Ambreia's weapons) are downloaded here by
        // AvatarAssetDownloadManager rather than by the core, so that is where the matching
        // updateLoadingProcess() call lives.
        this._loadingEvents.on('progress', this.onProgressEvent);

        ctx.readConfigDocument({'asset-libraries': [...AvatarAssetDownloadManager.MANDATORY_LIBRARIES]}, this._loadingEvents);

        this._totalInitSteps = ctx.getNumberOfFilesPending() + ctx.getNumberOfFilesLoaded() + VortexMain.INIT_STEPS;

        // Set target FPS from ticker
        ctx.targetFps = this._application!.ticker.maxFPS || 60;

        // Register core itself as IID_Core so components can depend on it
        ctx.registerInterface(IID_Core, ctx);

        // Asset Library — manages all game assets
        this._assets = new AssetLibrary();
        ctx.attachInstance(IID_AssetLibrary, this._assets);
        // Before any component exists, not after: HabboGroupsManager (12g below) builds its badge
        // editor in its own constructor and reads `badge_part_add` out of the library while doing
        // it. In AS3 those are `[Embed]`s in the component's own SWF library, so
        // they cannot be late; here they were pushed in from the client only after bootstrap()
        // returned, and every one of those lookups came back null.
        this.registerWindowAssetLibraryContent(config?.windowAssets ?? null);

        // Core Communication Manager — low-level socket communication
        const coreCommunication = new CoreCommunicationManager(ctx);
        ctx.attachComponent(coreCommunication, [IID_CoreCommunicationManager]);

        this._application!.ticker.add(this.update, this);

        ctx.initialize();

        // The managers are features since J5 (spec §4): declared in features/index.ts, created in
        // the order prepareCore() attached them, with their dependencies checked before the boot
        // goes on. A required dependency nobody provides throws here, naming the feature.
        const made = emptyManagers();
        const host: IEngineHost = {
            assets: this._assets,
            avatarData: config.avatarData,
            legacy: config.kernel.legacy,
            onWindowManager: windowManager => this.applyWindowAssets(config.windowAssets ?? null, windowManager),
            renderer: () => Vortex.instance?.application?.renderer ?? null,
            roomWidgets: roomWidgetRegistry(GAME_FEATURES, config.kernel),
            made
        };

        this._kernelReport = await bootFeatures(ctx, guardedFeatures(GAME_FEATURES), config.kernel, host);

        this._configurationManager = made.configuration;
        this._habboCommunicationManager = made.communication;
        this._communicationDemo = made.demo;
        this._localizationManager = made.localization;
        this._roomManager = made.roomManager;
        this._roomSessionManager = made.roomSession;
        this._sessionDataManager = made.sessionData;
        this._roomEngine = made.roomEngine;
        this._windowManager = made.windowManager;
        this._roomUI = made.roomUI;

        // Read once the configuration completes: the feature registers it then.
        made.configuration?.events.once('complete', () => { this._avatarRenderManager = made.avatarRenderer; });
        this._avatarRenderManager = made.avatarRenderer;

        // 12n-12s (club center, furni editor, fishing, Discord) left with the core cut (2026-10-07).

        // With room-engine switched off there is no room to draw or feed.
        const roomEngine = made.roomEngine;

        if(roomEngine === null) return;

        // Set PixiJS stage on room engine for rendering
        roomEngine.setStage(this._application!.stage);
        roomEngine.setCanvasElement(this._application!.canvas as HTMLCanvasElement);
        roomEngine.setTicker(this._application!.ticker);

        // 12. Room Message Handler - bridges communication to room engine
        const roomMessageHandler = new RoomMessageHandler(roomEngine);

        this._roomMessageHandler = roomMessageHandler;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::onRoomSessionEvent()
        // AS3's RoomEngine owns/constructs the message handler directly (`var_761 = new
        // class_1788(this)`) and subscribes to its own RoomSessionManager dependency's
        // RSE_STARTED/RSE_ENDED to keep the handler's "current room" tracking and the engine's
        // room-instance lifecycle in sync. This port constructs RoomMessageHandler here instead
        // (composition root) rather than inside RoomEngine.ts, so the equivalent wiring lives
        // here. Missing this wiring meant rejoining a room you were already in never disposed
        // the stale room instance first (RoomMessageHandler.onRoomReady()'s own "did the room id
        // change" check saw no change from the last visit and skipped setCurrentRoom()'s
        // disposal), duplicating the avatar and every other room object on rejoin.
        if(this._roomSessionManager) 
        {
            this._roomSessionManager.sessionEvents.on(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) =>
            {
                this._roomMessageHandler?.setCurrentRoom(event.session.roomId);
                // AS3: _SafeCls_90.as::onRoomSessionEvent() RSE_STARTED also calls
                // `_SafeStr_4619.enterNewRoom()` on its object-handler field — clears the previous
                // room's selected avatar/object and any in-progress move/place before the new room
                // is entered.
                this._roomEngine?.enterNewRoom();
            });

            this._roomSessionManager.sessionEvents.on(RoomSessionEvent.RSE_ENDED, (event: RoomSessionEvent) => 
            {
                this._roomMessageHandler?.resetCurrentRoom();
                this._roomEngine?.disposeRoom(event.session.roomId);
            });
        }

        // Wire RoomMessageHandler to the connection.
        await Promise.resolve();

        const connection = made.communication?.connection ?? null;

        if(connection) 
        {
            roomMessageHandler.connection = connection;
            roomEngine.connection = connection;
        }
    }

    /**
     * Constructs the avatar editor. Must be called after the window layouts are registered by the
     * client layer, because the editor builds its windows from them.
     *
     * The core cut (2026-10-07) removed the friend bar, friend list, messenger, help and moderation
     * that this step used to construct alongside it (initFriendBar/initFriendList); the editor stays.
     */
    // TS-only: replaces initFriendList(), which built the editor last among the social managers.
    initAvatarEditor(): void
    {
        const ctx = Core.instance as CoreComponentContext;

        // AS3 registers it via HabboAvatarEditorManagerBootstrap. Its optional dependencies are the
        // avatar renderer, the communication manager and the session, all attached in prepareCore().
        this._avatarEditor = new HabboAvatarEditorManager(ctx, 0, this._assets);
        ctx.attachComponent(this._avatarEditor, [IID_HabboAvatarEditor]);

        log.debug('Avatar editor initialized');
    }

    /**
     * Main update loop — PixiJS ticker calls this each frame.
     *
     * Delegates to CoreComponentContext.update() which handles
     * priority-based update receivers, hibernation throttling, and reboot.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as (ticker integration)
     */
    // AS3: .../src/com/sulake/habbo/ui/handler/ChatInputWidgetHandler.as::update()
    private update(ticker: Ticker): void
    {
        if(this._disposed) return;

        // Opens the `:showstats` frame budget. This callback sits at the ticker's default priority
        // and PixiJS's own render runs at UPDATE_PRIORITY.LOW, so the frame is open before any
        // channel it needs to bill. See core/utils/FrameTimings.
        FrameTimings.beginFrame();

        const ctx = Core.instance as CoreComponentContext;

        if(ctx)
        {
            // Clamp the frame delta. requestAnimationFrame (which drives this ticker) is paused
            // entirely while the tab is hidden, so the first frame after the tab returns to the
            // foreground can report deltaMS equal to the whole background duration (tens of
            // seconds). Feeding that to time-based updates would make animations/interpolation
            // jump. Cap it to a sane single-frame maximum so the client resumes smoothly.
            const MAX_UPDATE_DELTA_MS = 1000;

            ctx.update(Math.min(ticker.deltaMS, MAX_UPDATE_DELTA_MS));
        }

        this.onExitFrame();
    }

    /**
     * Once both the room engine and the core are up and running, the
     * loading screen has done its job and can be freed.
     *
     * AS3's bootstrap Sprite (HabboMain/HabboAirMain) never holds the running
     * managers itself — they live independently under `_core` — so its own
     * `dispose()` here only detaches its init-tracking listeners and frees the
     * loading screen. VortexMain also owns the manager lifecycle (for real
     * shutdown via `dispose()`), so only that loading-screen cleanup is mirrored
     * here; the rest of AS3's `dispose()` has no TS equivalent to tear down.
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/HabboMain.as::onExitFrame()
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as::onExitFrame()
     */
    // AS3: .../src/binaryData/HabboAir.as::onExitFrame()
    private onExitFrame(): void 
    {
        if(this._bootFinalized || !this._roomEngineReady || !this._coreRunning) return;

        this._bootFinalized = true;

        if(this._loadingScreen) 
        {
            this._loadingScreen.dispose();
            this._loadingScreen = null;
        }
    }

    /**
     * Set up listeners to track initialization progress of key components.
     *
     * AS3 listens for:
     * - IIDHabboConfigurationManager → onConfigurationComplete
     * - IIDHabboLocalizationManager → events "complete" → onLocalizationComplete
     * - IIDRoomEngine → events "REE_ENGINE_INITIALIZED" → onRoomEngineReady
     * - _core.events "COMPONENT_EVENT_RUNNING" → onCoreRunning
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as addInitializationProgressListeners()
     */
    // AS3: .../src/binaryData/HabboAir.as::addInitializationProgressListeners()
    private addInitializationProgressListeners(): void 
    {
        // AS3: simpleQueueInterface(new IIDHabboConfigurationManager(), onConfigurationComplete)
        // Configuration is already loaded (we awaited initConfigurationDownload in prepareCore)
        this.onConfigurationComplete();

        // AS3: simpleQueueInterface(new IIDHabboLocalizationManager(), cb → events.addEventListener("complete", onLocalizationComplete))
        if(this._localizationManager) 
        {
            this._localizationManager.events.on('complete', () => this.onLocalizationComplete());
        }

        // AS3: simpleQueueInterface(new IIDRoomEngine(), cb → events.addEventListener("REE_ENGINE_INITIALIZED", onRoomEngineReady))
        if(this._roomEngine) 
        {
            this._roomEngine.events.on('REE_ENGINE_INITIALIZED', () => this.onRoomEngineReady());
        }

        // AS3: _core.events.addEventListener("COMPONENT_EVENT_RUNNING", onCoreRunning)
        // In our system, all components are ready after prepareCore + microtask flush.
        // We trigger this after the current microtask completes.
        queueMicrotask(() => this.onCoreRunning());
    }

    /**
     * Fills the window manager's asset library, at construction.
     *
     * AS3: HabboWindowManagerComponent(context, flags, assets) — the third argument is the
     * AssetLibrary loaded from the embedded HabboWindowManagerCom resource, so the component
     * has its skins and layouts before it is attached, let alone before any message can be
     * handled. The client used to call loadElementDescription/loadSkinAssets/
     * registerWidgetLayout itself after Vortex.bootstrap() returned, which left the manager
     * alive but empty while the socket (opened during HabboCommunicationManager.initComponent)
     * was already carrying server messages — buildWidgetLayout() then returned null for
     * whatever arrived first.
     *
     * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::HabboWindowManagerComponent()
     */
    /**
     * Fills the asset library with the window assets that ported code reads by name, at the
     * moment the library is created and before a single component is attached.
     *
     * TS-only: AS3 has no counterpart because it has no equivalent problem — each component is
     * handed an `AssetLibrary` already filled from its `[Embed]`ed SWF resource, so a component
     * can never observe its own library empty. This port loads the same bytes out of a downloaded
     * bundle, so the filling has to be sequenced explicitly; `applyWindowAssets()` below does the
     * window-manager half once that manager exists.
     */
    private registerWindowAssetLibraryContent(windowAssets: IVortexWindowAssets | null): void
    {
        if(!windowAssets || !this._assets)
        {
            return;
        }

        if(windowAssets.libraryImages)
        {
            const declaration = this._assets.getAssetTypeDeclarationByMimeType('application/octet-stream')
                ?? new AssetTypeDeclaration('application/octet-stream', UnknownAsset);

            for(const [name, bitmap] of windowAssets.libraryImages)
            {
                const asset = new UnknownAsset(declaration, name);

                asset.setUnknownContent(bitmap);
                this._assets.setAsset(name, asset, true);
            }
        }

        if(windowAssets.libraryLayouts)
        {
            const declaration = this._assets.getAssetTypeDeclarationByMimeType('text/xml')
                ?? new AssetTypeDeclaration('text/xml', XmlAsset, null, 'xml');

            for(const [name, xml] of windowAssets.libraryLayouts)
            {
                const asset = new XmlAsset(declaration, name);

                // Left as the raw string: XmlAsset parses it lazily on first `content` access,
                // and most layouts are never asked for.
                asset.setUnknownContent(xml);
                this._assets.setAsset(name, asset, true);
            }
        }

        log.debug(
            `Asset library seeded with ${windowAssets.libraryImages?.size ?? 0} bitmaps`
            + ` and ${windowAssets.libraryLayouts?.size ?? 0} layouts`
        );
    }

    private applyWindowAssets(windowAssets: IVortexWindowAssets | null, windowManager: HabboWindowManager): void
    {
        if(!windowAssets)
        {
            return;
        }

        // Same reasoning as registerWindowAssetLibraryContent(): this runs before the window
        // manager is attached, so the `asset_uri` of every layout built during component init
        // resolves instead of queueing a receiver that is never served.
        if(windowAssets.imageUrls)
        {
            for(const [name, url] of windowAssets.imageUrls)
            {
                windowManager.registerAssetUrl(name, url);
            }
        }

        if(windowAssets.elementDescription)
        {
            windowManager.loadElementDescription(windowAssets.elementDescription);
        }

        if(windowAssets.skins)
        {
            windowManager.loadSkinAssets(windowAssets.skins, windowAssets.atlases ?? new Map());
        }

        if(windowAssets.layouts)
        {
            for(const [name, xml] of windowAssets.layouts)
            {
                windowManager.registerWidgetLayout(name, xml);
            }
        }
    }

    /**
     * Update the loading bar progress.
     *
     * Progress formula: CORE_RATIO + (completedInitSteps / INIT_STEPS) * (1 - CORE_RATIO)
     * Maps init steps to the [0.6 - 1.0] range.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as updateProgressBar()
     */
    // AS3: .../src/binaryData/HabboAir.as::updateProgressBar()
    // TS-only: the bar's successive values, for the boot fingerprint (window.__ambreia.boot).
    private readonly _progressLog: number[] = [];

    private updateProgressBar(): void 
    {
        if(this._loadingScreen != null) 
        {
            const progress = VortexMain.CORE_RATIO + (((this._completedInitSteps + this._loadedFiles) / this._totalInitSteps) * (1 - VortexMain.CORE_RATIO));

            this._loadingScreen.updateLoadingBar(progress);
            this._progressLog.push(Math.round(progress * 1000) / 1000);
        }
    }

    /**
     * A core asset library finished loading — re-read the counter and repaint the bar.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as onProgressEvent()
     */
    // AS3: .../src/binaryData/HabboAir.as::onProgressEvent()
    private onProgressEvent = (): void =>
    {
        const ctx = Core.instance as CoreComponentContext | null;

        if(ctx === null) return;

        this._loadedFiles = ctx.getNumberOfFilesLoaded();
        this.updateProgressBar();
    };

    /**
     * Called when the configuration manager has loaded.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as onConfigurationComplete()
     */
    // AS3: .../src/binaryData/HabboAir.as::onConfigurationComplete()
    private onConfigurationComplete(): void 
    {
        Vortex.trackLoginStep('client.init.config.loaded');
        this._completedInitSteps++;
        this.updateProgressBar();
    }

    /**
     * Called when the localization manager has finished loading.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as onLocalizationComplete()
     */
    // AS3: .../src/binaryData/HabboAir.as::onLocalizationComplete()
    private onLocalizationComplete(): void 
    {
        Vortex.trackLoginStep('client.init.localization.loaded');

        // Wire localization resolver for WindowParser.
        if(this._localizationManager) 
        {
            const locMgr = this._localizationManager;

            // Resolved-only: an entry that is just a listener stand-in carries its own key as its
            // value, and treating that as a hit is what bakes the key into a window's caption.
            WindowParser.localizationResolver = (key: string) => locMgr.getResolvedLocalization(key);
        }

        this._completedInitSteps++;
        this.updateProgressBar();
    }

    /**
     * Called when the room engine has finished initialization.
     *
     * AS3: Sets _SafeStr_412 = true, starts heartbeat if spaweb=1.
     * When both _roomEngineReady and _coreRunning are true, the init is complete.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as onRoomEngineReady()
     */
    // AS3: .../src/binaryData/HabboAir.as::onRoomEngineReady()
    private onRoomEngineReady(): void 
    {
        this._roomEngineReady = true;
        Vortex.trackLoginStep('client.init.room.ready');

        this.startSendingHeartBeat();
    }

    /**
     * Called when all core components are running.
     *
     * AS3: Sets _SafeStr_413 = true, increments completedInitSteps.
     * When both _roomEngineReady and _coreRunning are true, the init is complete.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as onCoreRunning()
     */
    // AS3: .../src/binaryData/HabboAir.as::onCoreRunning()
    private onCoreRunning(): void 
    {
        this._coreRunning = true;
        Vortex.trackLoginStep('client.init.core.running');
        this._completedInitSteps++;
        this.updateProgressBar();
    }

    /**
     * Start sending heartbeat at regular intervals.
     *
     * AS3: If config "spaweb=1", sends heartbeat every 10 seconds
     * via HabboWebTools to keep the session alive.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as startSendingHeartBeat()
     */
    // AS3: .../src/binaryData/HabboAir.as::startSendingHeartBeat()
    private startSendingHeartBeat(): void 
    {
        const config = this._configurationManager;

        if(!config) return;

        const spaweb = config.propertyExists('spaweb')
            ? config.getProperty('spaweb')
            : '0';

        if(spaweb === '1') 
        {
            log.debug('SPA heartbeat enabled');

            this.sendHeartBeat();

            this._heartbeatTimer = setInterval(() => 
            {
                this.sendHeartBeat();
            }, 10000);
        }
    }

    /**
     * Send a heartbeat signal.
     *
     * Emits a 'heartbeat' event on the Vortex instance.
     * The client can listen to POST this to a server endpoint.
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/Habbo.as sendHeartBeat()
     */
    // AS3: .../src/binaryData/HabboAir.as::sendHeartBeat()
    private sendHeartBeat(): void 
    {
        Vortex.instance.vortexEvents.emit('heartbeat');
    }

    /**
     * Handle a core component error.
     *
     * @see sources/PRODUCTION-201601012205-226667486/src/HabboMain.as onCoreError()
     */
    // AS3: .../src/binaryData/HabboAir.as::onCoreError()
    private onCoreError(message: string): void 
    {
        log.error(`Core error: ${message}`);

        Vortex.reportCrash(message, 'core', false);
    }

    /**
     * Handle a core component reboot request — in practice, the toolbar's Log out button
     * (`PurseAreaExtension` → `HabboToolbar.reboot()` → `ICore.reboot()`).
     *
     * AS3 does `shutdownCore(); NativeApplication.nativeApplication.exit(1)`: it does NOT restart
     * in process. It kills the AIR process and leaves the relaunch to the launcher, which comes
     * back up at the login flow because the SSO ticket died with the process.
     *
     * A page reload is that same thing in a browser, and it lands in the same place: `index.html`
     * builds `window.VortexConfig` with no `ssoTicket`, the login flow only produces one at
     * runtime, and `App.init()` gates on `if(!configuredTicket) showLoginFlow()`. So a fresh
     * document has no ticket and opens on the login flow, exactly as AS3's relaunch does.
     *
     * The in-process alternative — dispose the core, the room engine, the window system and every
     * manager, then re-run the boot — is not what AS3 does and would be the first time this port
     * ever ran a full teardown; a single leaked listener, texture or socket would surface as a
     * subtly broken second session. Reloading has no such failure mode.
     *
     * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as::onCoreReboot()
     */
    // AS3: .../src/binaryData/HabboAir.as::onCoreReboot()
    private onCoreReboot = (): void =>
    {
        log.warn('Reboot application!');

        // Kept ahead of the reload for anything embedding the engine that wants to know; nothing
        // in this client listens, and the reload wins either way.
        Vortex.instance.vortexEvents.emit('reboot');

        window.location.reload();
    };
}
