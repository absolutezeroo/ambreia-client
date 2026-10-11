/**
 * RoomUI
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as
 *
 * Main room UI component. Extends Component for DI integration.
 * Creates and manages RoomDesktop instances for each active room session.
 * Listens to room session events and room engine events to coordinate
 * the room display lifecycle.
 */
import {Component, ComponentDependency, type IContext, type IUpdateReceiver} from '../core/runtime/index';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import {Logger} from '@ambreia/common/utils/Logger';

// DI identifiers
import {IID_AvatarRenderManager} from '../iid/IIDAvatarRenderManager';
import {IID_HabboWindowManager} from '../iid/IIDHabboWindowManager';
import {IID_RoomEngine} from '../iid/IIDRoomEngine';
import {IID_RoomSessionManager} from '../iid/IIDRoomSessionManager';
import {IID_SessionDataManager} from '../iid/IIDSessionDataManager';
import {IID_HabboConfigurationManager} from '../iid/IIDHabboConfigurationManager';
import {IID_HabboLocalizationManager} from '../iid/IIDHabboLocalizationManager';
import {IID_HabboAvatarEditor} from '../iid/IIDHabboAvatarEditor';
import type {IHabboAvatarEditor} from '../avatar/IHabboAvatarEditor';
import {IID_HabboCommunicationManager} from '../iid/IIDHabboCommunicationManager';

// Interfaces
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IRoomEngine} from '../room/IRoomEngine';
import type {IRoomSessionManager} from '../session/IRoomSessionManager';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import type {IHabboConfigurationManager} from '../configuration/IHabboConfigurationManager';
import type {IHabboLocalizationManager} from '../localization/IHabboLocalizationManager';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import {CantConnectMessageEvent} from '@ambreia/protocol/incoming/room/session/CantConnectMessageEvent';
import type {CantConnectMessageParser} from '@ambreia/protocol/parser/room/session/CantConnectMessageParser';
import {NotificationDialogMessageEvent} from '@ambreia/protocol/incoming/notifications/NotificationDialogMessageEvent';
import type {NotificationDialogMessageEventParser} from '@ambreia/protocol/parser/notifications/NotificationDialogMessageEventParser';
import type {IRoomSession} from '../session/IRoomSession';

// Events
import {RoomSessionEvent} from '../session/events/RoomSessionEvent';
import {RoomSessionErrorMessageEvent} from '../session/events/RoomSessionErrorMessageEvent';
import {RoomEngineEvent} from '@ambreia/iso/scene/events/RoomEngineEvent';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import {RoomEngineToWidgetEvent} from '@ambreia/iso/scene/events/RoomEngineToWidgetEvent';
import {RoomEngineUseProductEvent} from '@ambreia/iso/scene/events/RoomEngineUseProductEvent';
import {RoomEngineRoomAdEvent} from '@ambreia/iso/scene/events/RoomEngineRoomAdEvent';
import {RoomEngineAreaHideStateWidgetEvent} from '@ambreia/iso/scene/events/RoomEngineAreaHideStateWidgetEvent';
import {RoomEngineRoomColorEvent} from '@ambreia/iso/scene/events/RoomEngineRoomColorEvent';
import {RoomEngineZoomEvent} from '@ambreia/iso/scene/events/RoomEngineZoomEvent';
import {RoomEngineDimmerStateEvent} from '@ambreia/iso/scene/events/RoomEngineDimmerStateEvent';
import {RoomEngineHSLColorEnableEvent} from '@ambreia/iso/scene/events/RoomEngineHSLColorEnableEvent';

// Internal
import type {IRoomUI} from './IRoomUI';
import type {IRoomDesktop} from './IRoomDesktop';
import {RoomDesktop} from './RoomDesktop';
import {RoomWidgetFactory} from './RoomWidgetFactory';
import {RoomWidgetRegistry} from './RoomWidgetRegistry';
import {HideRoomWidgetEvent} from './widget/events/HideRoomWidgetEvent';
import type {IDisplayObjectWrapper} from '@ambreia/ui/components/IDisplayObjectWrapper';

const log = Logger.getLogger('habbo.ui.RoomUI');

export class RoomUI extends Component implements IRoomUI, IUpdateReceiver
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as — the entries of the
    // listener table whose callback is roomSessionDialogEventHandler, in the source's own order.
    private static readonly ROOM_SESSION_DIALOG_EVENTS: readonly string[] = [
        RoomSessionErrorMessageEvent.KICKED_BY_OWNER,
        RoomSessionErrorMessageEvent.PETS_FORBIDDEN_IN_HOTEL,
        RoomSessionErrorMessageEvent.PETS_FORBIDDEN_IN_FLAT,
        RoomSessionErrorMessageEvent.MAX_NUMBER_OF_PETS,
        RoomSessionErrorMessageEvent.MAX_NUMBER_OF_OWN_PETS,
        RoomSessionErrorMessageEvent.NO_FREE_TILES_FOR_PET,
        RoomSessionErrorMessageEvent.SELECTED_TILE_NOT_FREE_FOR_PET,
        RoomSessionErrorMessageEvent.BOTS_FORBIDDEN_IN_HOTEL,
        RoomSessionErrorMessageEvent.BOTS_FORBIDDEN_IN_FLAT,
        RoomSessionErrorMessageEvent.BOT_LIMIT_REACHED,
        'RSEME_SELECTED_TILE_NOT_FREE_FOR_BOT',
        'RSEME_BOT_NAME_NOT_ACCEPTED',
    ];

    // DEVIATION: AS3's table also carries the three poll events (RSPE_POLL_*) and the three word-quiz
    //   question events (RWPUW_*); the RPG fork removed polls and the word quiz.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as — the entries of the
    // same listener table whose callback is roomSessionEventHandler, in the source's own order.
    //
    // These are the session events that reach the room desktop, and through it every widget handler
    // that claimed them in `getProcessedEvents()`. Without this list a handler is registered and never
    // called: the doorbell and the room queue were both in that state until the poll slice needed the
    // same route and exposed it.
    private static readonly ROOM_SESSION_DESKTOP_EVENTS: readonly string[] = [
        'RSCE_CHAT_EVENT',
        'RSCE_FLOOD_EVENT',
        'RSUBE_BADGES',
        'RSPE_PRESENT_OPENED',
        'RSOPPE_OPEN_PET_PACKAGE_REQUESTED',
        'RSOPPE_OPEN_PET_PACKAGE_RESULT',
        'RSDPE_PRESETS',
        'RSFRE_FRIEND_REQUEST',
        'RSDE_DANCE',
    ];

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as — the entries of
     * the IIDRoomEngine listener table whose callback is roomObjectEventHandler, in the source's
     * own order.
     *
     * This list is the fifth wiring a furni widget needs, on top of the four in
     * `RoomDesktop.createWidget()` / `RoomWidgetFactory` / the logic's `get widget()`: the engine
     * emits `RETWE_*` into `engine.events`, and with nobody subscribed the event dies in the
     * emitter with no throw and no log. It was hand-written and had drifted to 15 of AS3's 43
     * entries, which left eleven engine→widget routes dead while every other file involved looked
     * correctly wired — clothing change (the fball_gate report), presents, the dimmer, the
     * mannequin, area hide, room link, internal link, the high-score display, the friend-furni
     * engraving and REOE_PLACED. Keep it a transcription of the AS3 table, not a list of what is
     * currently consumed: a handler's `getProcessedEvents()` can only be honoured for a type that
     * arrives here first.
     */
    // DEVIATION: AS3's table also carries RETWE_REQUEST_PLAYLIST_EDITOR and the jukebox-dispose
    //   room event; the RPG fork removed jukebox music.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::get dependencies()
    private static readonly ROOM_OBJECT_ENGINE_EVENTS: readonly string[] = [
        RoomEngineObjectEvent.REOE_SELECTED,
        RoomEngineObjectEvent.REOE_DESELECTED,
        RoomEngineObjectEvent.REOE_ADDED,
        RoomEngineObjectEvent.REOE_REMOVED,
        RoomEngineObjectEvent.REOE_PLACED,
        // The furniture-manipulation requests dispatched on a modifier-held click
        // (SHIFT=rotate, CTRL=pickup, ALT-drag=move).
        RoomEngineObjectEvent.REOE_REQUEST_MOVE,
        RoomEngineObjectEvent.REOE_REQUEST_ROTATE,
        RoomEngineObjectEvent.REOE_REQUEST_PICKUP,
        RoomEngineObjectEvent.REOE_MOUSE_ENTER,
        RoomEngineObjectEvent.REOE_MOUSE_LEAVE,
        // The generic open/close pair every widget whose logic names a widget rides on
        // (crafting table, rentable space, fishing spot).
        RoomEngineToWidgetEvent.REQUEST_OPEN_WIDGET,
        RoomEngineToWidgetEvent.REQUEST_CLOSE_WIDGET,
        RoomEngineToWidgetEvent.REQUEST_OPEN_FURNI_CONTEXT_MENU,
        RoomEngineToWidgetEvent.REQUEST_CLOSE_FURNI_CONTEXT_MENU,
        RoomEngineToWidgetEvent.REQUEST_CREDITFURNI,
        RoomEngineToWidgetEvent.REQUEST_STICKIE,
        RoomEngineToWidgetEvent.REQUEST_PRESENT,
        RoomEngineToWidgetEvent.REQUEST_TROPHY,
        RoomEngineToWidgetEvent.REQUEST_TEASER,
        RoomEngineToWidgetEvent.REQUEST_ECOTRONBOX,
        RoomEngineToWidgetEvent.REQUEST_PLACEHOLDER,
        RoomEngineToWidgetEvent.REQUEST_DIMMER,
        RoomEngineRoomAdEvent.FURNI_CLICK,
        RoomEngineRoomAdEvent.FURNI_DOUBLE_CLICK,
        RoomEngineRoomAdEvent.TOOLTIP_SHOW,
        RoomEngineRoomAdEvent.TOOLTIP_HIDE,
        RoomEngineToWidgetEvent.REMOVE_DIMMER,
        RoomEngineToWidgetEvent.REQUEST_CLOTHING_CHANGE,
        RoomEngineToWidgetEvent.REQUEST_MANNEQUIN,
        RoomEngineToWidgetEvent.REQUEST_BACKGROUND_COLOR,
        RoomEngineToWidgetEvent.REQUEST_AREA_HIDE,
        RoomEngineAreaHideStateWidgetEvent.UPDATE_STATE_AREA_HIDE,
        // Not RETWE_* — the engine dispatches these itself, and AvatarInfoWidgetHandler declares
        // both in getProcessedEvents(), so this is the only hop to the "use this product on…"
        // bubbles.
        RoomEngineUseProductEvent.USE_PRODUCT_FROM_INVENTORY,
        RoomEngineUseProductEvent.USE_PRODUCT_FROM_ROOM,
        RoomEngineToWidgetEvent.REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING,
        RoomEngineToWidgetEvent.REQUEST_BADGE_DISPLAY_ENGRAVING,
        RoomEngineToWidgetEvent.REQUEST_ACHIEVEMENT_RESOLUTION_FAILED,
        RoomEngineToWidgetEvent.REQUEST_FRIEND_FURNITURE_ENGRAVING,
        RoomEngineToWidgetEvent.REQUEST_HIGH_SCORE_DISPLAY,
        RoomEngineToWidgetEvent.REQUEST_HIDE_HIGH_SCORE_DISPLAY,
        RoomEngineToWidgetEvent.REQUEST_INTERNAL_LINK,
        RoomEngineToWidgetEvent.REQUEST_ROOM_LINK,
    ];

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;
    private _widgetFactory: RoomWidgetFactory;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/RoomUI.as::_desktops
    private _desktops: Map<string, RoomDesktop> = new Map();
    private _currentDesktop: RoomDesktop | null = null;

    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null, roomWidgets: RoomWidgetRegistry = new RoomWidgetRegistry())
    {
        super(context, flags, assetLibrary);

        this._widgetFactory = new RoomWidgetFactory(this, roomWidgets);
        this.registerUpdateReceiver(this, 0);
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    /**
     * The window manager, used by RoomWidgetFactory to construct widgets.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get windowManager()
    public get windowManager(): IHabboWindowManager | null 
    {
        return this._windowManager;
    }

    private _config: IHabboConfigurationManager | null = null;

    /**
     * The config manager, used to construct widgets that need it (e.g. infostand).
     */
    public get config(): IHabboConfigurationManager | null 
    {
        return this._config;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_localization
    private _localization: IHabboLocalizationManager | null = null;

    /**
     * The localization manager, used by RoomWidgetFactory to construct widgets.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get localization()
    public get localization(): IHabboLocalizationManager | null 
    {
        return this._localization;
    }

    // AS3: RoomUI.as — the widget container exposes this to the mannequin and present widgets.
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_avatarEditor
    private _avatarEditor: IHabboAvatarEditor | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get roomEngine()
    public get roomEngine(): IRoomEngine | null
    {
        return this._roomEngine;
    }

    private _communicationManager: IHabboCommunicationManager | null = null;

    /**
     * The communication manager, used to construct widgets that need it (e.g. room tools).
     */
    // Room-entry errors and generic server dialogs are shown by the kept RoomUI shell.
    private readonly _alertMessageEvents: IMessageEvent[] = [
        new CantConnectMessageEvent(this.onCantConnect.bind(this)),
        new NotificationDialogMessageEvent(this.onNotificationDialog.bind(this)),
    ];

    public get communicationManager(): IHabboCommunicationManager | null
    {
        return this._communicationManager;
    }

    private _isInRoom: boolean = false;

    /**
     * Gets whether we are currently in a room.
     */
    public get isInRoom(): boolean 
    {
        return this._isInRoom;
    }

    // AS3 tracks a single active room desktop (var_22); the TS port keys desktops
    // by room identifier in a Map to support the underlying multi-session
    // architecture, so this exposes "the most recently created desktop" as the
    // AS3-equivalent single current desktop.
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get desktop()
    public get desktop(): IRoomDesktop | null 
    {
        return this._currentDesktop;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::get chatContainer()
    public get chatContainer(): IDisplayObjectWrapper | null
    {
        if(this._currentDesktop === null) return null;

        return this._currentDesktop.layoutManager.getChatContainer();
    }

    /**
     * Routes a HideRoomWidgetEvent to the current desktop's widget handlers. AS3's sole consumer
     * is `ChatInputWidgetHandler`, which declares HIDE_ROOM_WIDGET in `getProcessedEvents()` and
     * handles it in `handleHideWidgetEvent()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::hideWidget()
    public hideWidget(widgetType: string): void
    {
        this._currentDesktop?.processEvent(new HideRoomWidgetEvent(widgetType));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::showGamePlayerName()
    public showGamePlayerName(objectId: number, name: string, color: number, fadeDelayMs: number): void
    {
        this._currentDesktop?.showGamePlayerName(objectId, name, color, fadeDelayMs);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::mouseEventPositionHasContextMenu()
    public mouseEventPositionHasContextMenu(event: { global: { x: number; y: number } }): boolean
    {
        if(this._currentDesktop != null)
        {
            return this._currentDesktop.mouseEventPositionHasInputEventWindow(event, 0);
        }

        return false;
    }

    /**
     * Sets visibility of the active desktop.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::set visible()
    public set visible(value: boolean) 
    {
        for(const desktop of this._desktops.values()) 
        {
            desktop.visible = value;
        }
    }

    // DEVIATION: AS3 also takes the habbicon controller and, when `habbicons.enabled`, listens for
    //   ROOM_USE_HABBICON to push a triggered habbicon onto the avatar (`onRoomUseHabbicon()`). The
    //   RPG fork removed Habbicons.
    // DEVIATION: AS3 also takes the optional games manager (handed to every desktop); the RPG fork
    //   removed Snow War and the games manager.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<any>> 
    {
        return [
            new ComponentDependency(
                IID_HabboWindowManager,
                (wm: IHabboWindowManager | null) => 
                {
                    this._windowManager = wm;
                },
                true
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (engine: IRoomEngine | null) => 
                {
                    this._roomEngine = engine;

                    if(engine) 
                    {
                        engine.events.on(RoomEngineEvent.REE_INITIALIZED, this.roomEventHandler, this);
                        engine.events.on(RoomEngineEvent.REE_DISPOSED, this.roomEventHandler, this);
                        engine.events.on(RoomEngineEvent.REE_OBJECTS_INITIALIZED, this.roomEngineEventHandler, this);
                        engine.events.on(RoomEngineEvent.REE_NORMAL_MODE, this.roomEngineEventHandler, this);
                        engine.events.on(RoomEngineEvent.REE_GAME_MODE, this.roomEngineEventHandler, this);
                        engine.events.on(RoomEngineRoomColorEvent.RERCE_ROOM_COLOR, this.roomEventHandler, this);
                        // The moodlight's state, on its way to the dimmer widget. AS3 subscribes
                        // it here (RoomUI.as l.189) and forwards it to the desktop, which is the
                        // router to the handlers — without this hop the handler declares the event
                        // in getProcessedEvents() and is never called with it.
                        engine.events.on(RoomEngineDimmerStateEvent.CYCLED, this.roomEventHandler, this);
                        engine.events.on(RoomEngineHSLColorEnableEvent.ROOM_BACKGROUND_COLOR, this.roomEventHandler, this);
                        engine.events.on(RoomEngineZoomEvent.ROOM_ZOOM, this.roomEventHandler, this);
                        // AS3: RoomUI.as:200-333 — every entry of the same table routed to
                        // roomObjectEventHandler.
                        for(const type of RoomUI.ROOM_OBJECT_ENGINE_EVENTS)
                        {
                            engine.events.on(type, this.roomObjectEventHandler, this);
                        }
                    }
                },
                true
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (mgr: IRoomSessionManager | null) => 
                {
                    this._roomSessionManager = mgr;

                    if(mgr) 
                    {
                        mgr.sessionEvents.on(RoomSessionEvent.RSE_CREATED, this.roomSessionStateEventHandler, this);
                        mgr.sessionEvents.on(RoomSessionEvent.RSE_STARTED, this.roomSessionStateEventHandler, this);
                        mgr.sessionEvents.on(RoomSessionEvent.RSE_ENDED, this.roomSessionStateEventHandler, this);

                        // AS3: RoomUI.as's listener table routes all of these to
                        // roomSessionDialogEventHandler.
                        for(const type of RoomUI.ROOM_SESSION_DIALOG_EVENTS)
                        {
                            mgr.sessionEvents.on(type, this.roomSessionDialogEventHandler, this);
                        }

                        // AS3: the same table's roomSessionEventHandler entries.
                        for(const type of RoomUI.ROOM_SESSION_DESKTOP_EVENTS)
                        {
                            mgr.sessionEvents.on(type, this.roomSessionEventHandler, this);
                        }
                    }
                },
                true
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (sdm: ISessionDataManager | null) => 
                {
                    this._sessionDataManager = sdm;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (config: IHabboConfigurationManager | null) => 
                {
                    this._config = config;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (loc: IHabboLocalizationManager | null) => 
                {
                    this._localization = loc;
                },
                false
            ),
            new ComponentDependency(
                IID_AvatarRenderManager,
                (avatarRenderManager: IAvatarRenderManager | null) =>
                {
                    this._avatarRenderManager = avatarRenderManager;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.avatarRenderManager = avatarRenderManager;
                    }
                },
                false
            ),
            // Optional like every other manager here — a required dependency that failed to
            // resolve would lock RoomUI forever with no log.
            new ComponentDependency(
                IID_HabboAvatarEditor,
                (raw: unknown) =>
                {
                    // The IID is declared `createIID<unknown>`, as every view-layer IID in `iid/`
                    // is, so the setter takes unknown and narrows here.
                    const avatarEditor = (raw as IHabboAvatarEditor | null) ?? null;

                    this._avatarEditor = avatarEditor;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.avatarEditor = avatarEditor;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (communicationManager: IHabboCommunicationManager | null) =>
                {
                    for(const event of this._alertMessageEvents)
                    {
                        this._communicationManager?.removeHabboConnectionMessageEvent(event);
                        communicationManager?.addHabboConnectionMessageEvent(event);
                    }

                    this._communicationManager = communicationManager;

                    for(const desktop of this._desktops.values()) 
                    {
                        desktop.communicationManager = communicationManager;
                    }
                },
                false
            ),
        ];
    }

    /**
     * Creates a RoomDesktop for the given session.
     */
    // DEVIATION: AS3 also hands the desktop its games manager; the RPG fork removed Snow War and the
    //   games manager.
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::createDesktop()
    public createDesktop(session: IRoomSession): IRoomDesktop 
    {
        const identifier = this.getRoomIdentifier(session.roomId);

        // Dispose existing desktop for this room
        if(this._desktops.has(identifier)) 
        {
            this.disposeDesktop(identifier);
        }

        const connection = session.connection ?? null;

        const desktop = new RoomDesktop(session, this.assets!, connection);

        // Inject all dependencies
        desktop.windowManager = this._windowManager;
        desktop.roomEngine = this._roomEngine;
        desktop.sessionDataManager = this._sessionDataManager;
        desktop.roomSessionManager = this._roomSessionManager;
        desktop.config = this._config;
        desktop.localization = this._localization;
        desktop.roomWidgetFactory = this._widgetFactory;
        desktop.avatarRenderManager = this._avatarRenderManager;
        desktop.avatarEditor = this._avatarEditor;
        desktop.communicationManager = this._communicationManager;

        // Set the layout
        desktop.layout = 'room_desktop_layout_xml';

        // AS3: RoomUI.as:1124-1125 — these two are created **here**, with the desktop and before
        // init(), not in the REE_INITIALIZED block below where every other widget is built. That
        // is deliberate: a room you are queued for never initializes, so a queue window created at
        // room entry would never exist when it is needed. Same for the loading bar, which has to
        // be up while the room is still loading.
        desktop.createWidget('RWE_LOADINGBAR');

        // Initialize
        desktop.init();

        // Store in desktops map
        this._desktops.set(identifier, desktop);
        this._currentDesktop = desktop;

        log.info(`Desktop created for room ${session.roomId} (identifier: ${identifier})`);

        return desktop;
    }

    /**
     * Disposes a desktop by room identifier.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::disposeDesktop()
    public disposeDesktop(identifier: string): void 
    {
        const desktop = this._desktops.get(identifier);

        if(!desktop) return;

        desktop.dispose();
        this._desktops.delete(identifier);

        if(this._currentDesktop === desktop) 
        {
            this._currentDesktop = null;
        }

        log.debug(`Desktop disposed: ${identifier}`);
    }

    /**
     * Gets a desktop by room identifier.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/RoomUI.as::getDesktop()
    public getDesktop(identifier: string): IRoomDesktop | null 
    {
        return this._desktops.get(identifier) ?? null;
    }

    /**
     * Gets the active canvas ID for a room (always 1).
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::getActiveCanvasId()
    public getActiveCanvasId(_roomId: number): number 
    {
        return 1;
    }

    /**
     * Called each frame. Updates all active desktops.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::update()
    public update(time: number): void 
    {
        for(const desktop of this._desktops.values()) 
        {
            // AS3 forwards its `update(param1:uint)` argument — the frame delta in ms — and the
            // zoom animation's step size is measured from it, so dropping it froze the zoom at one
            // fixed step per frame regardless of frame rate.
            desktop.update(time);
        }
    }

    /**
     * Gets a desktop for a specific room ID.
     */
    public getDesktopForRoom(roomId: number): RoomDesktop | null 
    {
        const identifier = this.getRoomIdentifier(roomId);

        return this._desktops.get(identifier) ?? null;
    }

    // DEVIATION: AS3 also detaches from the habbicon controller; the RPG fork removed Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::dispose()
    public override dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

        // Remove update receiver
        this.removeUpdateReceiver(this);

        // Remove event listeners
        if(this._roomEngine) 
        {
            this._roomEngine.events.off(RoomEngineEvent.REE_INITIALIZED, this.roomEventHandler, this);
            this._roomEngine.events.off(RoomEngineEvent.REE_DISPOSED, this.roomEventHandler, this);
            this._roomEngine.events.off(RoomEngineEvent.REE_OBJECTS_INITIALIZED, this.roomEngineEventHandler, this);
            this._roomEngine.events.off(RoomEngineEvent.REE_NORMAL_MODE, this.roomEngineEventHandler, this);
            this._roomEngine.events.off(RoomEngineEvent.REE_GAME_MODE, this.roomEngineEventHandler, this);
            this._roomEngine.events.off(RoomEngineRoomColorEvent.RERCE_ROOM_COLOR, this.roomEventHandler, this);
            this._roomEngine.events.off(RoomEngineDimmerStateEvent.CYCLED, this.roomEventHandler, this);
            this._roomEngine.events.off(RoomEngineHSLColorEnableEvent.ROOM_BACKGROUND_COLOR, this.roomEventHandler, this);
            this._roomEngine.events.off(RoomEngineZoomEvent.ROOM_ZOOM, this.roomEventHandler, this);

            for(const type of RoomUI.ROOM_OBJECT_ENGINE_EVENTS)
            {
                this._roomEngine.events.off(type, this.roomObjectEventHandler, this);
            }
        }

        if(this._roomSessionManager) 
        {
            this._roomSessionManager.sessionEvents.off(RoomSessionEvent.RSE_CREATED, this.roomSessionStateEventHandler, this);
            this._roomSessionManager.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this.roomSessionStateEventHandler, this);
            this._roomSessionManager.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this.roomSessionStateEventHandler, this);

            for(const type of RoomUI.ROOM_SESSION_DIALOG_EVENTS)
            {
                this._roomSessionManager.sessionEvents.off(type, this.roomSessionDialogEventHandler, this);
            }
        }

        for(const event of this._alertMessageEvents)
        {
            this._communicationManager?.removeHabboConnectionMessageEvent(event);
        }

        // Dispose all desktops
        for(const desktop of this._desktops.values())
        {
            desktop.dispose();
        }

        this._desktops.clear();

        // Dispose widget factory
        this._widgetFactory.dispose();

        super.dispose();
    }

    protected override initComponent(): void 
    {
        log.debug('RoomUI initialized');
    }

    /**
     * The route from a room session to the widget handlers. AS3 forwards to the *current* desktop
     * only, guarded on the event carrying a session and the room engine being up; this port keeps
     * both guards and the same single-desktop target.
     *
     * A widget handler naming a session event in `getProcessedEvents()` is registered by
     * `RoomDesktop.createWidget()`, but nothing called it before this existed — the doorbell and
     * the room queue were both wired, registered and dead.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::roomSessionEventHandler()
    private roomSessionEventHandler(event: RoomSessionEvent): void
    {
        if(this._roomEngine === null) return;

        if(event.session === null || event.session === undefined) return;

        this._currentDesktop?.processEvent(event);
    }

    /**
     * The room-session errors that surface as a plain alert. Without this the server's
     * PetPlacingError (3195) and its bot/kick siblings reached RoomUsersHandler, were turned into
     * a RoomSessionErrorMessageEvent, and then died with no subscriber — the placement simply
     * failed in silence.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::roomSessionDialogEventHandler()
    private roomSessionDialogEventHandler(event: RoomSessionEvent): void
    {
        let errorTitle = '${error.title}';
        let errorMessage: string;

        switch(event.type)
        {
            case RoomSessionErrorMessageEvent.MAX_NUMBER_OF_PETS:
                errorMessage = '${room.error.max_pets}';
                break;
            case RoomSessionErrorMessageEvent.MAX_NUMBER_OF_OWN_PETS:
                errorMessage = '${room.error.max_own_pets}';
                break;
            case RoomSessionErrorMessageEvent.KICKED_BY_OWNER:
                errorMessage = '${room.error.kicked}';
                errorTitle = '${generic.alert.title}';
                break;
            case RoomSessionErrorMessageEvent.PETS_FORBIDDEN_IN_HOTEL:
                errorMessage = '${room.error.pets.forbidden_in_hotel}';
                break;
            case RoomSessionErrorMessageEvent.PETS_FORBIDDEN_IN_FLAT:
                errorMessage = '${room.error.pets.forbidden_in_flat}';
                break;
            case RoomSessionErrorMessageEvent.NO_FREE_TILES_FOR_PET:
                errorMessage = '${room.error.pets.no_free_tiles}';
                break;
            case RoomSessionErrorMessageEvent.SELECTED_TILE_NOT_FREE_FOR_PET:
                errorMessage = '${room.error.pets.selected_tile_not_free}';
                break;
            case RoomSessionErrorMessageEvent.BOTS_FORBIDDEN_IN_HOTEL:
                errorMessage = '${room.error.bots.forbidden_in_hotel}';
                break;
            case RoomSessionErrorMessageEvent.BOTS_FORBIDDEN_IN_FLAT:
                errorMessage = '${room.error.bots.forbidden_in_flat}';
                break;
            case RoomSessionErrorMessageEvent.BOT_LIMIT_REACHED:
                errorMessage = '${room.error.max_bots}';
                break;
            case 'RSEME_SELECTED_TILE_NOT_FREE_FOR_BOT':
                errorMessage = '${room.error.bots.selected_tile_not_free}';
                break;
            case 'RSEME_BOT_NAME_NOT_ACCEPTED':
                errorMessage = '${room.error.bots.name.not.accepted}';
                break;
            default:
                return;
        }

        this._windowManager?.alert(errorTitle, errorMessage, 0, (dialog) => dialog.dispose());
    }

    /** AS3 reads the reason one lower than it is sent: 1 is "room full", 3 a queue error, 4 banned, 5 blocked. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/_SafeCls_1951.as::onCantConnect()
    private onCantConnect(event: IMessageEvent): void
    {
        const parser = event?.parser as CantConnectMessageParser | null;

        if(!parser) return;

        let caption = '${room.queue.error.title}';
        let text = '${room.queue.error.title}';

        switch(parser.reason - 1)
        {
            case 0:
                caption = '${navigator.guestroomfull.title}';
                text = '${navigator.guestroomfull.text}';
                break;
            case 2:
                text = `\${room.queue.error.${parser.parameter}}`;
                break;
            case 3:
                caption = '${navigator.banned.title}';
                text = '${navigator.banned.text}';
                break;
            case 4:
                caption = '${navigator.blocked.title}';
                text = '${navigator.blocked.text}';
                break;
        }

        this._windowManager?.alert(caption, text, 0, (dialog) => dialog.dispose());
    }

    // DEVIATION: AS3 hands the dialog to the notifications component, which picks a bubble, a window or
    //   nothing per type from external_variables; that component left with the core cut (2026-10-07),
    //   so every dialog becomes a plain alert of its `message` parameter.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/_SafeCls_1951.as::onNotificationDialogMessageEvent()
    private onNotificationDialog(event: IMessageEvent): void
    {
        const message = (event?.parser as NotificationDialogMessageEventParser | null)?.parameters.get('message');

        if(!message) return;

        this._windowManager?.alert('${generic.alert.title}', message, 0, (dialog) => dialog.dispose());
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::roomSessionStateEventHandler()
    private roomSessionStateEventHandler(event: RoomSessionEvent): void
    {
        switch(event.type) 
        {
            case RoomSessionEvent.RSE_CREATED: {
                log.debug(`Session created for room ${event.session.roomId}`);

                this.createDesktop(event.session);

                break;
            }

            case RoomSessionEvent.RSE_STARTED: {
                log.debug(`Session started for room ${event.session.roomId}`);

                break;
            }

            case RoomSessionEvent.RSE_ENDED: {
                log.debug(`Session ended for room ${event.session.roomId}`);

                const identifier = this.getRoomIdentifier(event.session.roomId);

                this.disposeDesktop(identifier);

                // The room's widgets are gone and the HUD windows that hide between rooms keep
                // their buffers otherwise: this is the one moment to drop them.
                this._windowManager?.purge();

                this._isInRoom = false;

                break;
            }
        }
    }

    /**
     * Handles major room engine events (initialized, disposed, color, zoom).
     */
    // DEVIATION: AS3 also creates RWE_PLAYLIST_EDITOR_WIDGET, the photo camera and the
    //   room-thumbnail camera on REE_INITIALIZED; the RPG fork removed jukebox music and photos.
    // DEVIATION: AS3 also creates RWE_ROOM_POLL and RWE_WORD_QUIZZ there; the RPG fork removed polls
    //   and the word quiz.
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::roomEventHandler()
    private roomEventHandler(event: RoomEngineEvent): void 
    {
        const roomId = event.roomId;
        const identifier = this.getRoomIdentifier(roomId);
        const desktop = this._desktops.get(identifier);

        switch(event.type) 
        {
            case RoomEngineEvent.REE_INITIALIZED: {
                if(desktop) 
                {
                    const canvasId = this.getActiveCanvasId(roomId);

                    desktop.createRoomView(canvasId);

                    // DEVIATION: AS3 mounts the free-flow chat and creates ~40 room widgets here; since
                    //   the core cut (2026-10-07) only the name bubble and the object-location answer
                    //   are built (the loading bar is created with the desktop, see createDesktop()).
                    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::roomEventHandler()
                    desktop.createWidget('RWE_AVATAR_INFO');
                    // AS3: RoomUI.as:925 — answers "where is this object on screen?"; no window.
                    desktop.createWidget('RWE_LOCATION_WIDGET');

                    this._isInRoom = true;

                    log.info(`Room ${roomId} initialized — room view created`);
                }

                break;
            }

            case RoomEngineEvent.REE_DISPOSED: {
                this.disposeDesktop(identifier);
                this._isInRoom = false;

                break;
            }

            case RoomEngineRoomColorEvent.RERCE_ROOM_COLOR: {
                if(desktop)
                {
                    const colorEvent = event as RoomEngineRoomColorEvent;

                    // "Colorize background only" means the room VIEW keeps its neutral tint and
                    // only the backdrop takes the colour — AS3 passes white at full brightness
                    // rather than the event's own colour (RoomUI.as l.999-1002). The flag was
                    // carried on the event and read by nobody, so those furni tinted the whole
                    // room.
                    if(colorEvent.backgroundOnly) desktop.setRoomViewColor(0xFFFFFF, 255);
                    else desktop.setRoomViewColor(colorEvent.color, colorEvent.light);
                }

                break;
            }

            // AS3: RoomUI.as::roomEventHandler() l.1020-1022. The desktop is the router to the
            // widget handlers, and `FurnitureDimmerWidgetHandler` declares this event in its
            // `getProcessedEvents()` — this is the hop that gets it there.
            case RoomEngineDimmerStateEvent.CYCLED: {
                desktop?.processEvent(event);

                break;
            }

            case RoomEngineHSLColorEnableEvent.ROOM_BACKGROUND_COLOR: {
                if(desktop) 
                {
                    const hslEvent = event as RoomEngineHSLColorEnableEvent;

                    if(hslEvent.enable) 
                    {
                        desktop.setRoomBackgroundColor(hslEvent.hue, hslEvent.saturation, hslEvent.lightness);
                    }
                }

                break;
            }

            case RoomEngineZoomEvent.ROOM_ZOOM: {
                // Zoom event — handled by desktop
                break;
            }
        }
    }

    /**
     * Handles room engine mode events (objects initialized, game mode toggle).
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::roomEngineEventHandler()
    private roomEngineEventHandler(event: RoomEngineEvent): void 
    {
        switch(event.type) 
        {
            case RoomEngineEvent.REE_OBJECTS_INITIALIZED: {
                log.debug(`Objects initialized for room ${event.roomId}`);

                break;
            }

            case RoomEngineEvent.REE_NORMAL_MODE:
            case RoomEngineEvent.REE_GAME_MODE: {
                const identifier = this.getRoomIdentifier(event.roomId);
                const desktop = this._desktops.get(identifier);

                if(desktop) 
                {
                    desktop.roomEngineEventHandler(event);
                }

                break;
            }
        }
    }

    /**
     * Routes room object events to the appropriate desktop.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::roomObjectEventHandler()
    private roomObjectEventHandler(event: RoomEngineObjectEvent): void 
    {
        const identifier = this.getRoomIdentifier(event.roomId);
        const desktop = this._desktops.get(identifier);

        if(desktop) 
        {
            desktop.roomObjectEventHandler(event);
        }
    }

    /**
     * Converts a room ID to a room identifier string.
     * Matches AS3 pattern using "hard_coded_room_id".
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/RoomUI.as::getRoomIdentifier()
    private getRoomIdentifier(roomId: number): string 
    {
        return `hard_coded_room_id_${roomId}`;
    }
}
