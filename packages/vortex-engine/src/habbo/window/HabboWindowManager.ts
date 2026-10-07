import {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {IWindowManagerOptions} from '@ambreia/ui/kit/IWindowManagerOptions';
import type {IWidgetFactory} from '@ambreia/ui/IWidgetFactory';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from './IHabboWindowManager';
import {HabboWidgetFactory} from './HabboWidgetFactory';
import {ComponentDependency} from '@core/runtime/ComponentDependency';
import type {IContext} from '@core/runtime/IContext';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import {SimpleAlertDialog} from './utils/SimpleAlertDialog';
import {HabbletLinkHandler} from './handlers/HabbletLinkHandler';
import {HabboPagesViewer} from './utils/habbopedia/HabboPagesViewer';
import {ElementPointerHandler} from './utils/ElementPointerHandler';
import {BCFloorPlanEditor} from './utils/floorplaneditor/BCFloorPlanEditor';

/**
 * The window manager with the game services: WindowManager (@ambreia/ui) plus the avatar renderer,
 * communication, session, room engine, localisation and configuration, and the game-only windows
 * (help pages, floor plan editor, element pointer). Not a Component since J3: the engine attaches it
 * with `context.attachInstance(IID_HabboWindowManager, manager, {dependencies: manager.createDependencies(), …})`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as
 */
export class HabboWindowManager extends WindowManager implements IHabboWindowManager
{
    private readonly _context: IContext;

    constructor(context: IContext, options: IWindowManagerOptions)
    {
        super(options);
        this._context = context;
    }

    // TS-only: was the Component's; HabboPagesViewer registers its link tracker on it.
    public get context(): IContext
    {
        return this._context;
    }

    // TS-only: was the Component's, which never got an asset library here (VortexMain passed none),
    //   so HabboPagesViewer's download has always stopped at its null check.
    // TODO(AS3): .../habbo/window/utils/habbopedia/HabboPagesViewer.as::openPage(), pages never load.
    public get assets(): IAssetLibrary | null
    {
        return null;
    }

    // AS3: .../src/com/sulake/core/runtime/_SafeCls_50.as::getProperty()
    public getProperty(key: string, params?: Record<string, string>): string
    {
        return this._context.configuration?.getProperty(key, params) ?? '';
    }

    private _habbletLinkHandler: HabbletLinkHandler | null = null;

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_habboPagesViewer
    // Name DERIVED: AS3's field is `_SafeStr_6365`, obfuscated; named after the class it holds.
    private _habboPagesViewer: HabboPagesViewer | null = null;

    private _elementPointerHandler: ElementPointerHandler | null = null;

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_bcfloorPlanEditor
    private _bcFloorPlanEditor: BCFloorPlanEditor | null = null;

    private _configuration: IHabboConfigurationManager | null = null;
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_localization
    private _gameLocalization: IHabboLocalizationManager | null = null;

    /**
     * Configuration manager accessor (AS3 parity).
     *
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as
     * exposes this via `context.configuration`; our `_configuration` field is already
     * wired up as a direct DI dependency below, so this just exposes it directly.
     */
    public get configuration(): IHabboConfigurationManager | null 
    {
        return this._configuration;
    }

    /**
     * Localization accessor (AS3 parity).
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get localization()
    public get localization(): IHabboLocalizationManager | null 
    {
        return this._gameLocalization;
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    /**
     * SessionDataManager accessor (AS3 parity).
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get sessionDataManager()
    public get sessionDataManager(): ISessionDataManager | null 
    {
        return this._sessionDataManager;
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;

    /**
     * RoomEngine accessor (AS3 parity).
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get roomEngine()
    public get roomEngine(): IRoomEngine | null 
    {
        return this._roomEngine;
    }

    private _habboPagesStyleSheet: unknown | null = null;

    /**
     * Habbopedia stylesheet accessor (AS3 parity).
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get habboPagesStyleSheet()
    public get habboPagesStyleSheet(): unknown | null 
    {
        return this._habboPagesStyleSheet;
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_avatarRenderer
    private _avatarRenderer: IAvatarRenderManager | null = null;

    /**
     * The avatar render manager.
     *
     * In AS3: HabboWindowManagerComponent.avatarRenderer
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get avatarRenderer()
    public get avatarRenderer(): IAvatarRenderManager | null 
    {
        return this._avatarRenderer;
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_communication
    private _communication: IHabboCommunicationManager | null = null;

    /**
     * The communication manager.
     *
     * In AS3: HabboWindowManagerComponent.communication
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get communication()
    public get communication(): IHabboCommunicationManager | null 
    {
        return this._communication;
    }

    /**
     * Toggle fullscreen mode.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::toggleFullScreen()
    public toggleFullScreen(): void 
    {
        if(document.fullscreenElement) 
        {
            document.exitFullscreen();
        }
        else 
        {
            document.documentElement.requestFullscreen();
        }
    }

    /**
     * Register a localization parameter.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::registerLocalizationParameter()
    public registerLocalizationParameter(key: string, parameter: string, value: string, delimiter: string = '%'): void 
    {
        this._gameLocalization?.registerParameter(key, parameter, value, delimiter);
    }

    /**
     * Create an unseen item counter widget.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createUnseenItemCounter()
    public createUnseenItemCounter(): IWindowContainer | null 
    {
        return this.buildWidgetLayout('unseen_item_counter_xml') as IWindowContainer | null;
    }

    /**
     * Show a simple alert dialog.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::simpleAlert()
    public simpleAlert(
        title: string,
        subtitle: string,
        message: string,
        linkCaption: string | null = null,
        linkUrl: string | null = null,
        parameters: Map<string, string> | null = null,
        illustrationUrl: string | null = null,
        linkClickCallback: (() => void) | null = null,
        closeCallback: (() => void) | null = null
    ): void 
    {
        new SimpleAlertDialog(
            this,
            title,
            subtitle,
            message,
            linkCaption,
            linkUrl,
            parameters,
            illustrationUrl,
            linkClickCallback,
            closeCallback
        );
    }

    /**
     * Opens a habbopedia page.
     *
     * Every frame built through `buildFromXML()` wires its help button here, so this is what the
     * `?` in a window title bar does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::openHelpPage()
    public override openHelpPage(pageId: string): void
    {
        this._habboPagesViewer?.openPage(pageId);
    }

    /**
     * Opens the floor plan editor (`BCFloorPlanEditor`, AS3's name), building it if the
     * configuration arrived too late for `onConfigurationComplete()` to have done so.
     *
     * Reached from the room-info window's button and from the `:floorplan` chat command, both of
     * which already called this while it was an empty stub.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::displayFloorPlanEditor()
    public displayFloorPlanEditor(): void
    {
        if(this._bcFloorPlanEditor === null) this._bcFloorPlanEditor = new BCFloorPlanEditor(this);

        this._bcFloorPlanEditor.visible = true;
    }

    /**
     * DEVIATION: AS3 only assigns the field here, because in Flash this dependency callback always
     *   ran before the configuration's `complete` event, so `onConfigurationComplete()` could count
     *   on `_communication`. This port's DI resolves the two the other way round often enough that
     *   the guard there simply failed, and the block was skipped in silence — see
     *   `buildCommunicationBoundHelpers()`, which both call sites now share.
     */
    // DEVIATION: see the block above.
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::setCommunicationManager()
    private setCommunicationManager(manager: IHabboCommunicationManager | null): void
    {
        this._communication = manager;

        this.buildCommunicationBoundHelpers();
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::onConfigurationComplete()
    private onConfigurationComplete(): void
    {
        this.buildCommunicationBoundHelpers();
    }

    /**
     * The two helpers AS3 builds in `onConfigurationComplete()`, built the moment the communication
     * manager is in — which is the only thing either of them actually reads.
     *
     * Both subscribe message events in their own constructors, and for `BCFloorPlanEditor` that
     * timing is the whole point: `FloorHeightMap` is a room-entry message, so an editor built when
     * its window is first opened has already missed the only copy it will get. That is what it did
     * — `displayFloorPlanEditor()` was constructing it lazily, and it opened on an empty plan with
     * both panels blank. `ElementPointerHandler` sat behind the same guard and was lost the same
     * way, silently.
     *
     * AS3 can build them from the configuration's `complete` event alone because in Flash the
     * dependency callbacks have all run by then. Here three orderings are possible and one of them
     * loses both helpers outright: `applyDependency()` calls the setter *before* it attaches the
     * event listeners, so a configuration that finished loading early has already emitted
     * `complete` by the time this component subscribes, and `initComponent()`'s `isInitialized()`
     * fallback runs while the optional communication dependency is still null. Hanging the build on
     * `communication` instead of on the configuration removes the ordering from the question.
     */
    // TS-only: AS3 needs no such method — its two callers cannot run in the losing order.
    private buildCommunicationBoundHelpers(): void
    {
        if(!this._communication) return;

        if(!this._elementPointerHandler)
        {
            this._elementPointerHandler = new ElementPointerHandler(this);
        }

        if(this._bcFloorPlanEditor === null)
        {
            this._bcFloorPlanEditor = new BCFloorPlanEditor(this);
        }
    }

    /** The six services, as DI dependencies: the engine attaches this manager with them. */
    // TS-only: was the Component's dependencies getter.
    public createDependencies(): Array<ComponentDependency<any>> 
    {
        return [
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) => 
                {
                    this._sessionDataManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) => 
                {
                    this._gameLocalization = manager;
                    this.setLocalization(manager);
                },
                true
            ),
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (manager: IHabboConfigurationManager | null) => 
                {
                    this._configuration = manager;
                },
                false,
                [
                    {
                        type: 'complete',
                        callback: () => this.onConfigurationComplete(),
                    },
                ]
            ),
            new ComponentDependency(
                IID_AvatarRenderManager,
                (renderer: IAvatarRenderManager | null) => 
                {
                    this._avatarRenderer = renderer;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) => 
                {
                    this.setCommunicationManager(manager);
                },
                false
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (engine: IRoomEngine | null) => 
                {
                    this._roomEngine = engine;
                },
                false
            ),
        ];
    }

    // TS-only: the game widgets on top of the kit's.
    protected override createWidgetFactory(): IWidgetFactory
    {
        return new HabboWidgetFactory(this);
    }

    // TS-only: see WindowManager.widgetTypes().
    protected override widgetTypes(): readonly string[]
    {
        return HabboWidgetFactory.WIDGET_TYPES;
    }

    public override initialize(): void 
    {
        super.initialize();

        // AS3 builds both here, one line apart, and the viewer registers its own `habbopages/`
        // tracker in its constructor where the habblet handler is registered from outside.
        // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::initComponent()
        if(!this._habboPagesViewer)
        {
            this._habboPagesViewer = new HabboPagesViewer(this);
        }

        if(!this._habbletLinkHandler)
        {
            this._habbletLinkHandler = new HabbletLinkHandler(this);
            this._context.addLinkEventTracker(this._habbletLinkHandler);
        }

        if(this._configuration?.isInitialized()) 
        {
            this.onConfigurationComplete();
        }
    }

    /**
     * Dispose the window manager.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::dispose()
    public override dispose(): void 
    {
        if(this._disposed) return;

        if(this._habboPagesViewer)
        {
            // It removes its own tracker — it added it — unlike the habblet handler below.
            this._habboPagesViewer.dispose();
            this._habboPagesViewer = null;
        }

        if(this._habbletLinkHandler)
        {
            this._context.removeLinkEventTracker(this._habbletLinkHandler);
            this._habbletLinkHandler.dispose();
            this._habbletLinkHandler = null;
        }

        if(this._elementPointerHandler) 
        {
            this._elementPointerHandler.dispose();
            this._elementPointerHandler = null;
        }

        this._avatarRenderer = null;
        this._communication = null;
        this._configuration = null;
        this._gameLocalization = null;
        this._sessionDataManager = null;
        this._roomEngine = null;
        this._habboPagesStyleSheet = null;

        super.dispose();
    }
}
