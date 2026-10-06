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
import {Component, ComponentDependency, type IContext, type IUpdateReceiver} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import {Logger} from '@core/utils/Logger';

// DI identifiers
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_HabboLandingView} from '@iid/IIDHabboLandingView';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import {IID_HabboInventory} from '@iid/IIDHabboInventory';
import {IID_HabboFurniEditor} from '@iid/IIDHabboFurniEditor';
import {IID_HabboHelp} from '@iid/IIDHabboHelp';
import {IID_HabboFriendBarView} from '@iid/IIDHabboFriendBarView';
import {IID_HabboFishing} from '@iid/IIDHabboFishing';
import {IID_HabboSoundManager} from '@iid/IIDHabboSoundManager';
import {IID_HabboQuestEngine} from '@iid/IIDHabboQuestEngine';
import {IID_HabboAdManager} from '@iid/IIDHabboAdManager';
import type {IAdManager} from '@habbo/advertisement/IAdManager';
import type {IHabboQuestEngine} from '@habbo/quest/IHabboQuestEngine';
import {IID_HabboMessenger} from '@iid/IIDHabboMessenger';
import {IID_HabboAvatarEditor} from '@iid/IIDHabboAvatarEditor';
import type {IHabboAvatarEditor} from '@habbo/avatar/IHabboAvatarEditor';
import type {HabboFishing} from '@habbo/vortex/fishing/HabboFishing';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {IHabboMessenger} from '@habbo/messenger/IHabboMessenger';
import type {IHabboFriendBarView} from '@habbo/friendbar/view/IHabboFriendBarView';
import {IID_HabboTracking} from '@iid/IIDHabboTracking';
import {IID_HabboGroupsManager} from '@iid/IIDHabboGroupsManager';
import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import {IID_HabboFreeFlowChat} from '@iid/IIDHabboFreeFlowChat';
import {IID_HabboNavigator} from '@iid/IIDHabboNavigator';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboModeration} from '@iid/IIDHabboModeration';
import type {IHabboModeration} from '@habbo/moderation/IHabboModeration';

// Interfaces
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IHabboFurniEditor} from '@habbo/vortex/furnieditor/IHabboFurniEditor';
import type {IHabboHelp} from '@habbo/help/IHabboHelp';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IHabboGroupsManager} from '@habbo/groups/IHabboGroupsManager';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import type {IChatStyleLibrary} from '@habbo/freeflowchat/style/IChatStyleLibrary';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import {HabboToolbarEnum} from '@habbo/toolbar/HabboToolbarEnum';
import {FriendBarResizeEvent} from '@habbo/friendbar/events/FriendBarResizeEvent';
import type {IHabboLandingView} from '@habbo/friendbar/IHabboLandingView';
import type {IRoomSession} from '@habbo/session/IRoomSession';

// Events
import {RoomSessionEvent} from '@habbo/session/events/RoomSessionEvent';
import {RoomSessionErrorMessageEvent} from '@habbo/session/events/RoomSessionErrorMessageEvent';
import {RoomSessionDoorbellEvent} from '@habbo/session/events/RoomSessionDoorbellEvent';
import {RoomSessionQueueEvent} from '@habbo/session/events/RoomSessionQueueEvent';
import {RoomEngineEvent} from '@habbo/room/events/RoomEngineEvent';
import {RoomEngineObjectEvent} from '@habbo/room/events/RoomEngineObjectEvent';
import {RoomEngineToWidgetEvent} from '@habbo/room/events/RoomEngineToWidgetEvent';
import {RoomEngineUseProductEvent} from '@habbo/room/events/RoomEngineUseProductEvent';
import {RoomEngineRoomAdEvent} from '@habbo/room/events/RoomEngineRoomAdEvent';
import {RoomEngineAreaHideStateWidgetEvent} from '@habbo/room/events/RoomEngineAreaHideStateWidgetEvent';
import {RoomEngineRoomColorEvent} from '@habbo/room/events/RoomEngineRoomColorEvent';
import {RoomEngineZoomEvent} from '@habbo/room/events/RoomEngineZoomEvent';
import {RoomEngineDimmerStateEvent} from '@habbo/room/events/RoomEngineDimmerStateEvent';
import {RoomEngineHSLColorEnableEvent} from '@habbo/room/events/RoomEngineHSLColorEnableEvent';

// Internal
import type {IRoomUI} from './IRoomUI';
import type {IRoomDesktop} from './IRoomDesktop';
import {RoomDesktop} from './RoomDesktop';
import {RoomWidgetFactory} from './RoomWidgetFactory';
import {HideRoomWidgetEvent} from './widget/events/HideRoomWidgetEvent';
import type {IDisplayObjectWrapper} from '@core/window/components/IDisplayObjectWrapper';

const log = Logger.getLogger('habbo.ui.RoomUI');

export class RoomUI extends Component implements IRoomUI, IUpdateReceiver
{
    // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::onPerkAllowances() —
    // deliberately not subscribed, and this note is here so the next unwired-code sweep stops
    // re-flagging it as a missing registration.
    //
    // AS3 subscribes `PerkAllowancesMessageEvent` (1535) here only to start a 250 ms timer whose
    // completion adds the free-flow chat to the stage — it builds that chat lazily, on the first
    // perk packet. This port builds it eagerly in `HabboFreeFlowChat.initComponent()`, and the
    // reasoning (with the AS3 check that makes it a deviation rather than a gap) is written at that
    // method. The end state is identical; the message itself is ported and read by `PerkManager`
    // and `GuideSessionController`.

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
        RoomSessionDoorbellEvent.RSDE_DOORBELL,
        RoomSessionDoorbellEvent.RSDE_REJECTED,
        RoomSessionDoorbellEvent.RSDE_ACCEPTED,
        'RSPE_PRESENT_OPENED',
        'RSOPPE_OPEN_PET_PACKAGE_REQUESTED',
        'RSOPPE_OPEN_PET_PACKAGE_RESULT',
        RoomSessionQueueEvent.QUEUE_STATUS,
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
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_landingView
    private _landingView: IHabboLandingView | null = null;
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_habboTracking
    private _habboTracking: IHabboTracking | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::get habboTracking()
    public get habboTracking(): IHabboTracking | null
    {
        return this._habboTracking;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_habboGroupsManager
    private _habboGroupsManager: IHabboGroupsManager | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::friendList
    private _friendList: IHabboFriendList | null = null;
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null = null;
    private _widgetFactory: RoomWidgetFactory;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/RoomUI.as::_desktops
    private _desktops: Map<string, RoomDesktop> = new Map();
    private _currentDesktop: RoomDesktop | null = null;

    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null) 
    {
        super(context, flags, assetLibrary);

        this._widgetFactory = new RoomWidgetFactory(this);
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

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_catalog
    private _catalog: IHabboCatalog | null = null;
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_inventory
    private _inventory: IHabboInventory | null = null;

    // AS3: RoomUI.as — the widget container exposes this to the mannequin and present widgets.
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // NOT from AS3: Vortex-only furni editor.
    private _furniEditor: IHabboFurniEditor | null = null;
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_habboHelp
    private _habboHelp: IHabboHelp | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_friendBarView
    // Needed by the UI help bubbles, which look their target icons up through it.
    private _friendBarView: IHabboFriendBarView | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_questEngine
    // Needed by the me-menu's achievements button.
    private _questEngine: IHabboQuestEngine | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_adManager
    private _adManager: IAdManager | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_soundManager
    // Needed by the me-menu's settings tab.
    private _soundManager: IHabboSoundManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::get soundManager()
    public get soundManager(): IHabboSoundManager | null
    {
        return this._soundManager;
    }

    // TS-only: Vortex-only fishing system — DI-resolved, and null until it attaches.
    private _fishing: HabboFishing | null = null;

    // TS-only: Vortex-only — read by RoomWidgetFactory when it builds the spot panel.
    public get fishing(): HabboFishing | null
    {
        return this._fishing;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_messenger
    private _messenger: IHabboMessenger | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_avatarEditor
    private _avatarEditor: IHabboAvatarEditor | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::_moderation
    private _moderation: IHabboModeration | null = null;

    /**
     * The catalog manager, used to construct widgets that need it (e.g. infostand).
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get catalog()
    public get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get habboGroupsManager()
    public get habboGroupsManager(): IHabboGroupsManager | null
    {
        return this._habboGroupsManager;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get inventory()
    // Was marked TS-only; AS3 declares it at RoomUI.as:1240 and RoomWidgetFactory reads it there
    // for the same reason this port does.
    public get inventory(): IHabboInventory | null
    {
        return this._inventory;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get habboHelp()
    public get habboHelp(): IHabboHelp | null
    {
        return this._habboHelp;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get toolbar()
    public get toolbar(): IHabboToolbar | null
    {
        return this._toolbar;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get friendBarView()
    public get friendBarView(): IHabboFriendBarView | null
    {
        return this._friendBarView;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::get roomEngine()
    public get roomEngine(): IRoomEngine | null
    {
        return this._roomEngine;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::get chatStyleLibrary()
    public get chatStyleLibrary(): IChatStyleLibrary | null
    {
        return this._freeFlowChat?.chatStyleLibrary ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::get freeFlowChat()
    public get freeFlowChat(): IHabboFreeFlowChat | null
    {
        return this._freeFlowChat;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::_navigator
    private _navigator: IHabboNavigator | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::get navigator()
    public get navigator(): IHabboNavigator | null 
    {
        return this._navigator;
    }

    private _communicationManager: IHabboCommunicationManager | null = null;

    /**
     * The communication manager, used to construct widgets that need it (e.g. room tools).
     */
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
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) => 
                {
                    this._toolbar = toolbar;

                    for(const desktop of this._desktops.values()) 
                    {
                        desktop.toolbar = toolbar;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboLandingView,
                (lv: IHabboLandingView | null) => 
                {
                    this._landingView = lv;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCatalog,
                (catalog: IHabboCatalog | null) =>
                {
                    this._catalog = catalog;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.catalog = catalog;
                    }
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
            new ComponentDependency(
                IID_HabboFurniEditor,
                (furniEditor: IHabboFurniEditor | null) =>
                {
                    this._furniEditor = furniEditor;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.furniEditor = furniEditor;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboInventory,
                (inventory: IHabboInventory | null) =>
                {
                    this._inventory = inventory;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.inventory = inventory;
                    }
                },
                false
            ),
            /**
             * AS3 declares this dependency with the FBE_BAR_RESIZE_EVENT listener attached
             * (RoomUI.as:532-538). `bottomBarResizeHandler()` already existed in this port but was
             * only ever reached through the explicit `triggerbottomBarResize()`; wiring the event
             * is what AS3 specifies and is what makes a real bar resize reach the desktops.
             *
             * `HabboFriendBar` provides this IID, so the required flag cannot lock the component.
             */
            new ComponentDependency(
                IID_HabboFriendBarView,
                // The IID is declared `createIID<unknown>`, like every other view-layer IID in
                // `iid/`, so the setter takes unknown and narrows here.
                (view: unknown) =>
                {
                    this._friendBarView = (view as IHabboFriendBarView | null) ?? null;
                },
                true,
                // Wrapped rather than passed bare: `Component` attaches these with
                // `events.on(type, callback)` and no context, so a plain method reference would
                // run with the emitter as `this`.
                [{
                    type: FriendBarResizeEvent.FRIENDBAR_RESIZE_EVENT,
                    callback: (...args: unknown[]) => this.bottomBarResizeHandler(args[0] as FriendBarResizeEvent)
                }]
            ),
            /**
             * Both are attached (VortexMain), but both stay optional: a required dependency that
             * never resolves locks the component forever with no log — the hole that kept the
             * friend bar from ever building — and the room UI must come up whether or not sound
             * and the console are present.
             */
            // Optional, as AS3 declares it: the ad manager only ever answers
            // `RoomDesktop.requestInterstitial()`.
            // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::dependencies (IIDHabboAdManager)
            new ComponentDependency(
                IID_HabboAdManager,
                (adManager: IAdManager | null) =>
                {
                    this._adManager = adManager;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.adManager = adManager;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboQuestEngine,
                (questEngine: IHabboQuestEngine | null) =>
                {
                    this._questEngine = questEngine;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.questEngine = questEngine;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboSoundManager,
                (soundManager: IHabboSoundManager | null) =>
                {
                    this._soundManager = soundManager;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.soundManager = soundManager;
                    }
                },
                false
            ),
            // TS-only: Vortex-only fishing system — no AS3 counterpart. Optional, like every
            //   dependency around it: a hotel that has not configured fishing still gets a room.
            //   `RoomWidgetFactory` reads it back when it builds the spot panel, which is what hands
            //   the panel its definition tables and registers it for incoming messages.
            new ComponentDependency(
                IID_HabboFishing,
                (fishing: HabboFishing | null) =>
                {
                    this._fishing = fishing;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboMessenger,
                (messenger: IHabboMessenger | null) =>
                {
                    this._messenger = messenger;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.messenger = messenger;
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
                IID_HabboHelp,
                (help: IHabboHelp | null) =>
                {
                    this._habboHelp = help;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.habboHelp = help;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboModeration,
                (moderation: IHabboModeration | null) =>
                {
                    this._moderation = moderation;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.moderation = moderation;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboTracking,
                (tracking: IHabboTracking | null) => 
                {
                    this._habboTracking = tracking;

                    for(const desktop of this._desktops.values()) 
                    {
                        desktop.habboTracking = tracking;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboGroupsManager,
                (groupsManager: IHabboGroupsManager | null) => 
                {
                    this._habboGroupsManager = groupsManager;

                    for(const desktop of this._desktops.values()) 
                    {
                        desktop.habboGroupsManager = groupsManager;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboFriendList,
                (friendList: IHabboFriendList | null) =>
                {
                    this._friendList = friendList;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.friendList = friendList;
                    }
                },
                false
            ),
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::onPerkAllowances()
            // wires the same dependency via a ComponentDependency(new IIDHabboFreeFlowChat(), ...).
            new ComponentDependency(
                IID_HabboFreeFlowChat,
                (freeFlowChat: IHabboFreeFlowChat | null) =>
                {
                    this._freeFlowChat = freeFlowChat;

                    for(const desktop of this._desktops.values())
                    {
                        desktop.freeFlowChat = freeFlowChat;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboNavigator,
                (navigator: IHabboNavigator | null) => 
                {
                    this._navigator = navigator;

                    for(const desktop of this._desktops.values()) 
                    {
                        desktop.navigator = navigator;
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (communicationManager: IHabboCommunicationManager | null) => 
                {
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
        desktop.moderation = this._moderation;
        desktop.config = this._config;
        desktop.localization = this._localization;
        desktop.toolbar = this._toolbar;
        desktop.roomWidgetFactory = this._widgetFactory;
        desktop.catalog = this._catalog;
        desktop.inventory = this._inventory;
        desktop.fishing = this._fishing;
        desktop.avatarRenderManager = this._avatarRenderManager;
        desktop.furniEditor = this._furniEditor;
        desktop.habboHelp = this._habboHelp;
        desktop.questEngine = this._questEngine;
        desktop.soundManager = this._soundManager;
        desktop.messenger = this._messenger;
        desktop.avatarEditor = this._avatarEditor;
        desktop.habboTracking = this._habboTracking;
        desktop.habboGroupsManager = this._habboGroupsManager;
        desktop.friendList = this._friendList;
        desktop.freeFlowChat = this._freeFlowChat;
        desktop.navigator = this._navigator;
        desktop.communicationManager = this._communicationManager;
        desktop.adManager = this._adManager;

        // Set the layout
        desktop.layout = 'room_desktop_layout_xml';

        // AS3: RoomUI.as:1124-1125 — these two are created **here**, with the desktop and before
        // init(), not in the REE_INITIALIZED block below where every other widget is built. That
        // is deliberate: a room you are queued for never initializes, so a queue window created at
        // room entry would never exist when it is needed. Same for the loading bar, which has to
        // be up while the room is still loading.
        desktop.createWidget('RWE_LOADINGBAR');
        desktop.createWidget('RWE_ROOM_QUEUE');

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
     * Triggers bottom bar resize.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::triggerbottomBarResize()
    public triggerbottomBarResize(): void 
    {
        this.bottomBarResizeHandler(new FriendBarResizeEvent());
    }

    /**
     * TS alias kept for existing callers; delegates to the AS3-named API.
     */
    public triggerBottomBarResize(): void 
    {
        this.triggerbottomBarResize();
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::bottomBarResizeHandler()
    private bottomBarResizeHandler(event: FriendBarResizeEvent): void
    {
        for(const desktop of this._desktops.values())
        {
            desktop.processEvent(event);
        }
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

    /**
     * Which toolbar a room shows.
     *
     * The port set `HTE_STATE_ROOM_VIEW` unconditionally. AS3 has a new-user branch in front of
     * it: with `nux.lobbies.enabled` set and the session data saying this is a real newcomer, the
     * toolbar takes one of two NUX states depending on whether the room is their own — which is
     * how the onboarding toolbar differs from the ordinary one. Both flags were already on the
     * port's interfaces (`isRealNoob`, `isNoobRoom`); only the branch and the two enum members
     * were missing.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::defineToolbarState()
    private defineToolbarState(session: IRoomSession | null): void
    {
        if(this._toolbar === null) return;

        if(this.getBoolean('nux.lobbies.enabled') && this._sessionDataManager?.isRealNoob === true)
        {
            this._toolbar.setToolbarState(session?.isNoobRoom === true
                ? HabboToolbarEnum.TOOLBAR_STATE_NOOB_NOT_HOME
                : HabboToolbarEnum.TOOLBAR_STATE_NOOB_HOME);

            return;
        }

        this._toolbar.setToolbarState(HabboToolbarEnum.TOOLBAR_STATE_ROOM_VIEW);
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomUI.as::roomSessionStateEventHandler()
    private roomSessionStateEventHandler(event: RoomSessionEvent): void
    {
        switch(event.type) 
        {
            case RoomSessionEvent.RSE_CREATED: {
                log.debug(`Session created for room ${event.session.roomId}`);

                this.createDesktop(event.session);

                // For game sessions, hide toolbar and landing view immediately
                // AS3: RoomUI.roomSessionStateEventHandler RSE_CREATED
                if(event.session.isGameSession) 
                {
                    if(this._toolbar) 
                    {
                        this._toolbar.setToolbarState(HabboToolbarEnum.TOOLBAR_STATE_HIDDEN);
                    }

                    if(this._landingView) 
                    {
                        this._landingView.disable();
                    }
                }

                break;
            }

            case RoomSessionEvent.RSE_STARTED: {
                log.debug(`Session started for room ${event.session.roomId}`);

                this.defineToolbarState(event.session);

                // Disable the landing view (hotel view page)
                if(this._landingView) 
                {
                    this._landingView.disable();
                }

                break;
            }

            case RoomSessionEvent.RSE_ENDED: {
                log.debug(`Session ended for room ${event.session.roomId}`);

                const identifier = this.getRoomIdentifier(event.session.roomId);

                this.disposeDesktop(identifier);

                this._isInRoom = false;

                if(event.openLandingPage) 
                {
                    // Restore toolbar to hotel view mode
                    // AS3: RoomUI RSE_ENDED -> toolbar state + landingView.activate()
                    if(this._toolbar) 
                    {
                        this._toolbar.setToolbarState(HabboToolbarEnum.TOOLBAR_STATE_HOTEL_VIEW);
                    }

                    // Re-enable landing view
                    if(this._landingView) 
                    {
                        this._landingView.activate();
                    }
                }

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

                    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::roomEventHandler()
                    // (REE_INITIALIZED case) — freeFlowChat's displayObject is mounted into the
                    // room_new_chat layout slot. It is the sole chat renderer: this tree dropped
                    // RWE_CHAT_WIDGET entirely and RoomWidgetEnum no longer declares the constant.
                    //
                    // There is deliberately no fallback. The port used to build the legacy
                    // roomchat widget when this dependency was absent — a branch AS3 does not
                    // have — which meant a component that silently failed to attach produced a
                    // room rendering chat through a superseded architecture instead of an
                    // obvious failure. IID_HabboFreeFlowChat is optional, so absence is possible
                    // and is now loud.
                    if(desktop.freeFlowChat === null)
                    {
                        log.error('No free-flow chat component: this room will render no chat bubbles at all');
                    }
                    else if(desktop.freeFlowChat.displayObject)
                    {
                        desktop.layoutManager.getChatContainer()?.setDisplayObject(desktop.freeFlowChat.displayObject);
                    }

                    // Create room widgets (stubs for now)
                    desktop.createWidget('RWE_CHAT_INPUT_WIDGET');
                    desktop.createWidget('RWE_INFOSTAND');
                    desktop.createWidget('RWE_ME_MENU');
                    // AS3: RoomUI.as:931 — the in-room friend-request bubbles.
                    desktop.createWidget('RWE_FRIEND_REQUEST');
                    desktop.createWidget('RWE_AVATAR_INFO');
                    desktop.createWidget('RWE_ROOM_TOOLS');
                    // AS3: RoomUI.as:925 — answers "where is this object on screen?"; no window.
                    desktop.createWidget('RWE_LOCATION_WIDGET');
                    desktop.createWidget('RWE_FURNITURE_CONTEXT_MENU');
                    desktop.createWidget('RWE_EFFECTS');
                    // AS3: RoomUI.as:941. The furni widgets are created eagerly at room entry,
                    // not on demand — creating one is what registers its handler's message
                    // types, so the widget must exist before the furni is ever clicked.
                    desktop.createWidget('RWE_FURNI_PET_PACKAGE_WIDGET');
                    desktop.createWidget('RWE_FURNI_ECOTRONBOX_WIDGET');
                    // AS3: RoomUI.as:944 — the doorbell list, for a room locked to ringing.
                    desktop.createWidget('RWE_DOORBELL');
                    desktop.createWidget('RWE_FURNI_CREDIT_WIDGET');
                    desktop.createWidget('RWE_ROOM_BACKGROUND_COLOR');
                    desktop.createWidget('RWE_FURNI_PLACEHOLDER');
                    desktop.createWidget('RWE_FURNI_STICKIE_WIDGET');
                    desktop.createWidget('RWE_SPAMWALL_POSTIT_WIDGET');
                    desktop.createWidget('RWE_FURNI_TROPHY_WIDGET');
                    desktop.createWidget('RWE_ROOM_DIMMER');
                    desktop.createWidget('RWE_FURNI_PRESENT_WIDGET');
                    desktop.createWidget('RWE_MANNEQUIN');
                    // AS3: RoomUI.as:956 — the refusal dialogs (VIP/costume gates, failed respect).
                    desktop.createWidget('RWE_CUSTOM_USER_NOTIFICATION');
                    // AS3: RoomUI.as:969 — the YouTube TV furni's player window.
                    desktop.createWidget('RWE_YOUTUBE');
                    // AS3: RoomUI.as:975 — the rentable-space rent dialog.
                    desktop.createWidget('RWE_RENTABLESPACE');
                    // AS3: RoomUI.as:971 — the Vimeo TV furni's player window.
                    desktop.createWidget('RWE_VIMEO');
                    desktop.createWidget('RWE_FRIEND_FURNI_ENGRAVING');
                    // AS3: RoomUI.as:964
                    desktop.createWidget('RWE_FRIEND_FURNI_CONFIRM');
                    // AS3: RoomUI.as:968
                    desktop.createWidget('RWE_CUSTOM_STACK_HEIGHT');
                    desktop.createWidget('RWE_ROOM_LINK');
                    // AS3: RoomUI.as:978 — the crafting table.
                    desktop.createWidget('RWE_CRAFTING');
                    // TS-only: Vortex-only fishing system — the spot's panel.
                    //   See docs/vortex-original/fishing.md §2.3.
                    desktop.createWidget('RWE_FISHING_SPOT');
                    // TS-only: Vortex-only fishing system — the sign, which opens the book.
                    //   See docs/vortex-original/fishing.md §1 and §15.
                    desktop.createWidget('RWE_FISHING_SIGN');
                    desktop.createWidget('RWE_CLOTHING_CHANGE');
                    // AS3: RoomUI.as:966 — the scoreboard bubble over a high-score furni.
                    desktop.createWidget('RWE_HIGH_SCORE_DISPLAY');
                    // AS3: RoomUI.as:958 — "who is in this room". AS3 passes the widget's previous
                    // state here so a chooser left open reopens itself after a room change; this
                    // port has no cross-room widget cache yet, so it always starts closed.
                    // AS3: RoomUI.as:963 — the achievement-resolution / badge-display trophy.
                    desktop.createWidget('RWE_FURNI_ACHIEVEMENT_RESOLUTION_ENGRAVING');
                    // AS3: RoomUI.as:957 — "what furniture is in this room".
                    desktop.createWidget('RWE_FURNI_CHOOSER');
                    desktop.createWidget('RWE_USER_CHOOSER');
                    // AS3: RoomUI.as:967 — no window of its own; the handler follows the link the
                    // clicked furni carries.
                    desktop.createWidget('RWE_INTERNAL_LINK');
                    // AS3: RoomUI.as:948 — the event-log forwarder; no window either.
                    desktop.createWidget('RWE_CONVERSION_TRACKING');
                    // AS3: RoomUI.as:955 — the area-hide configuration window.
                    desktop.createWidget('RWE_AREA_HIDE');
                    // AS3: RoomUI.as:972 — the photo / selfie wall item, full size.
                    desktop.createWidget('RWE_EXTERNAL_IMAGE');
                    // AS3: RoomUI.as:973 — the guided-tour help bubbles. Order matters: the widget
                    // pulls RWE_ROOM_TOOLS and RWE_CHAT_INPUT_WIDGET off the desktop in its own
                    // constructor, so both must already have been created above.
                    desktop.createWidget('RWE_UI_HELP_BUBBLE');

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
