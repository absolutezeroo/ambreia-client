import {EventEmitter} from 'eventemitter3';
import {Component, ComponentDependency, type IContext, type ICore,} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_RoomUI} from '@iid/IIDRoomUI';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboInventory} from '@iid/IIDHabboInventory';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import {IID_HabboQuestEngine} from '@iid/IIDHabboQuestEngine';
import {UnseenAchievementsCountUpdateEvent} from '@habbo/quest/events/UnseenAchievementsCountUpdateEvent';
import {UnseenDailyTasksCountUpdateEvent} from '@habbo/quest/events/UnseenDailyTasksCountUpdateEvent';
import {UnseenRewardTrackRewardsCountUpdateEvent} from '@habbo/quest/events/UnseenRewardTrackRewardsCountUpdateEvent';
import {IID_HabboNavigator} from '@iid/IIDHabboNavigator';
import {IID_HabboNewNavigator} from '@iid/IIDHabboNewNavigator';
import {IID_HabboSoundManager} from '@iid/IIDHabboSoundManager';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import {IID_HabboFreeFlowChat} from '@iid/IIDHabboFreeFlowChat';
import {IID_HabboMessenger} from '@iid/IIDHabboMessenger';
import type {IHabboToolbar} from './IHabboToolbar';
import type {IRoomUI} from '@habbo/ui/IRoomUI';
import type {IExtensionView} from './IExtensionView';
import type {IWindow} from '@core/window/IWindow';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import type {IRoomSessionManager} from '../session/IRoomSessionManager';
import type {IHabboInventory} from '../inventory/IHabboInventory';
import type {IHabboLocalizationManager} from '../localization/IHabboLocalizationManager';
import type {IHabboCatalog} from '../catalog/IHabboCatalog';
import type {IHabboQuestEngine} from '../quest/IHabboQuestEngine';
import type {IHabboNavigator} from '../navigator/IHabboNavigator';
import type {IHabboNewNavigator} from '../navigator/IHabboNewNavigator';
import type {IHabboFreeFlowChat} from '../freeflowchat/IHabboFreeFlowChat';
import type {IHabboMessenger} from '../messenger/IHabboMessenger';
import type {IHabboConfigurationManager} from '../configuration/IHabboConfigurationManager';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {
    UserRightsMessageEvent
} from '@habbo/communication/messages/incoming/handshake/UserRightsMessageEvent';
import type {IConnection} from '@core/communication/connection/IConnection';
import {BottomBarLeft} from './BottomBarLeft';
import {BottomBackgroundBorder} from './BottomBackgroundBorder';
import {ExtensionView} from './ExtensionView';
import {HabboToolbarEvent} from './events/HabboToolbarEvent';
import {HabboToolbarEnum} from './HabboToolbarEnum';
import {HabboToolbarIconEnum} from './HabboToolbarIconEnum';
import {IID_HabboGroupForumController} from '@iid/IIDHabboGroupForumController';
import {UnseenForumsCountUpdatedEvent} from '@habbo/friendbar/groupforums/UnseenForumsCountUpdatedEvent';
import {PurseAreaExtension} from './extensions/PurseAreaExtension';
import {SeasonalCurrencyIndicator} from './extensions/purse/indicators/SeasonalCurrencyIndicator';
import {SettingsExtension} from './extensions/SettingsExtension';
import {ClubDiscountPromoExtension} from './extensions/ClubDiscountPromoExtension';
import {CitizenshipVipDiscountPromoExtension} from './extensions/CitizenshipVipDiscountPromoExtension';
import {CitizenshipVipQuestsPromoExtension} from './extensions/CitizenshipVipQuestsPromoExtension';
import {VideoOfferExtension} from './extensions/VideoOfferExtension';
import {OfferExtension} from './offers/OfferExtension';
import {EventLogMessageComposer} from '../communication/messages/outgoing/tracking/EventLogMessageComposer';
import {PurseEvent} from '../catalog/purse/PurseEvent';
import {CatalogEvent} from '../catalog/event/CatalogEvent';
import {RoomEnterEffect} from '@room/utils/RoomEnterEffect';
import type {Motion} from '@core/window/motion/Motion';
import {Logger} from '@core/utils/Logger';
import {IID_HabboConfigurationManager} from "@iid/IIDHabboConfigurationManager";
import {IID_HabboCommunicationManager} from "@iid/IIDHabboCommunicationManager";
import {IID_AvatarRenderManager} from "@iid/IIDAvatarRenderManager";
import type {IAvatarRenderManager} from '../avatar/IAvatarRenderManager';

const log = Logger.getLogger('habbo.toolbar.HabboToolbar');

/**
 * Events emitted by HabboToolbar via toolbarEvents
 */
export interface IHabboToolbarEvents
{
    [HabboToolbarEvent.TOOLBAR_CLICK]: (event: HabboToolbarEvent) => void;
    [HabboToolbarEvent.RESIZED]: (event: HabboToolbarEvent) => void;
    [HabboToolbarEvent.CAMERA_TOGGLE]: (event: HabboToolbarEvent) => void;
    [HabboToolbarEvent.GROUP_ROOM_INFO_CLICK]: (event: HabboToolbarEvent) => void;
}

/**
 * Main Habbo Toolbar Component
 *
 * Manages the toolbar UI state, icon interactions, and extension panels.
 * Extends Component for dependency injection lifecycle.
 *
 * IMPORTANT: Uses `_toolbarEvents` / `toolbarEvents` for custom events
 * rather than overriding the `events` getter from Component (see MEMORY.md).
 *
 * @see source_as_win63/habbo/toolbar/HabboToolbar.as
 */
export class HabboToolbar extends Component implements IHabboToolbar
{
    private _communication: IHabboCommunicationManager | null = null;
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _roomSessionManager: IRoomSessionManager | null = null;
    private _messageEvents: IMessageEvent[] = [];
    private _extensionsInitialized: boolean = false;
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_inventory
    private _inventory: IHabboInventory | null = null;
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_catalog
    private _catalog: IHabboCatalog | null = null;
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_questEngine
    private _questEngine: IHabboQuestEngine | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::_navigator
    private _navigator: IHabboNavigator | null = null;
    // TS-only bridge: AS3's `get navigator()` returns `_newNavigator.legacyNavigator` -
    // the same underlying object that implements showToolbarHover()/hideToolbarHover().
    // This port wires `_navigator` directly off IID_HabboNavigator (the legacy
    // interface, which has no hover methods) instead of through that indirection, so
    // BottomBarLeft.onNaviHover() needs a separate route to the object that actually
    // has them - see IHabboNewNavigator.
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_newNavigator
    private _newNavigator: IHabboNewNavigator | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::_soundManager
    private _soundManager: IHabboSoundManager | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::_messenger
    // No concrete HabboMessenger is attached against IID_HabboMessenger in this port
    // yet (only the interface is ported) - stays null until one is.
    private _messenger: IHabboMessenger | null = null;
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_localization
    private _localization: IHabboLocalizationManager | null = null;
    private _configuration: IHabboConfigurationManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/toolbar/HabboToolbar.as::_extensionView
    private _extensionView: ExtensionView | null = null;
    private _purseAreaExtension: PurseAreaExtension | null = null;
    private _seasonalCurrencyIndicator: SeasonalCurrencyIndicator | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/toolbar/HabboToolbar.as::_settingsExtension
    private _settingsExtension: SettingsExtension | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/toolbar/HabboToolbar.as::_clubDiscountPromoExtension
    private _clubDiscountPromoExtension: ClubDiscountPromoExtension | null = null;
    private _citizenshipVipDiscountPromoExtension: CitizenshipVipDiscountPromoExtension | null = null;
    private _citizenshipVipQuestsPromoExtension: CitizenshipVipQuestsPromoExtension | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/toolbar/HabboToolbar.as::_videoOfferExtension
    private _videoOfferExtension: VideoOfferExtension | null = null;
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_offerExtension
    private _offerExtension: OfferExtension | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::roomUI
    private _roomUI: IRoomUI | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::HabboToolbar()
    // AS3's constructor attaches 3 components here: HabboPhoneNumber/IIDHabboPhoneNumber,
    // HabboNuxDialogs/IIDHabboNuxDialogs, HabboCampaigns/IIDHabboCampaigns.
    // - HabboCampaigns IS attached (against the correct IID) - see VortexMain.ts
    //   "12b. Campaign Calendar", which documents this exact AS3 call site and moves it
    //   to the bootstrap sequence instead, since HabboCampaigns' own dependencies need
    //   to resolve independent of the toolbar's lazy BottomBarLeft construction.
    // - HabboNuxDialogs and HabboPhoneNumber have no concrete implementation in this
    //   port (only their IIDs and empty placeholder directories exist under
    //   habbo/nux and habbo/phonenumber) - attaching stub instances here would be
    //   inventing modules that don't exist, so there is nothing to attach yet.
    /**
	 * The asset library is not optional in practice: `SettingsExtension` and the three settings
	 * views read their layouts straight out of it (`assets.getAssetByName("settings_xml")`), as
	 * AS3 does. This constructor used to take only the context and call `super(context)`, so
	 * `Component._assets` stayed null whatever the caller passed — every one of those lookups
	 * returned null and the settings menu could not be built.
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::HabboToolbar()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_avatarRenderManager
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    /**
	 * The avatar render manager
	 *
	 * @see sources/win63_version/habbo/toolbar/HabboToolbar.as avatarRenderManager
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get avatarRenderManager()
    get avatarRenderManager(): IAvatarRenderManager | null
    {
        return this._avatarRenderManager;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    /**
	 * The session data manager
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    private _toolbarEvents: EventEmitter = new EventEmitter();

    /**
	 * Custom toolbar event emitter (NOT the Component events)
	 *
	 * Uses a separate EventEmitter to avoid overriding Component.events
	 * which would break the dependency injection unlock mechanism.
	 */
    get toolbarEvents(): EventEmitter
    {
        return this._toolbarEvents;
    }

    private _currentState: string = HabboToolbarEnum.TOOLBAR_STATE_HIDDEN;

    /**
	 * The current toolbar state
	 */
    get currentState(): string
    {
        return this._currentState;
    }

    private _onDuty: boolean = false;

    /**
	 * Whether the user is on duty (moderation)
	 */
    get onDuty(): boolean
    {
        return this._onDuty;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::set onDuty()
    set onDuty(value: boolean)
    {
        this._onDuty = value;

        if(this.bottomBarLeft)
        {
            this.bottomBarLeft.onDuty = value;
        }
    }

    /**
	 * The extension view container for toolbar extensions
	 *
	 * Built lazily on first read, as AS3 does — the window manager is an optional dependency and is
	 * not there yet when the toolbar is constructed. It is null only while that is still true.
	 *
	 * (This comment used to say the view was "handled by the SolidJS UI layer" and that the getter
	 * "returns null". Both were false — see `project_no_solidjs`: there is no SolidJS in this port,
	 * and every toolbar extension attaches to the real `ExtensionView` returned below.)
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get extensionView()
    get extensionView(): IExtensionView | null
    {
        if(!this._extensionView)
        {
            if(!this._windowManager) return null;

            this._extensionView = new ExtensionView(this._windowManager, this);
        }

        return this._extensionView;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::get roomUI()
    get roomUI(): IRoomUI | null
    {
        return this._roomUI;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get inventory()
    get inventory(): IHabboInventory | null
    {
        return this._inventory;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get catalog()
    get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::get questEngine()
    get questEngine(): IHabboQuestEngine | null
    {
        return this._questEngine;
    }

    /**
	 * **The wrapper, not the old navigator** — AS3 returns `_newNavigator.legacyNavigator`, which is
	 * a `LegacyNavigator` bridging to the new one. This port used to hand back the component resolved
	 * from `IID_HabboNavigator` directly, whose `openNavigator()` is faithful to an AS3 body that is
	 * **empty**: the me-menu's "rooms" entry sent its search and then opened nothing.
	 *
	 * Falls back to the old navigator while the new one is still resolving, so callers that only read
	 * data keep working during boot; AS3 returns null there instead.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::get navigator()
    get navigator(): IHabboNavigator | null
    {
        // `legacyWrapper` rather than `legacyNavigator`: the same object, through the nullable
        // accessor. The throwing one would fire during boot, before initComponent() has built it.
        return this._newNavigator?.legacyWrapper ?? this._navigator;
    }

    // TS-only: see the `_newNavigator` field comment - bridges BottomBarLeft.onNaviHover()
    // to the object that implements showToolbarHover()/hideToolbarHover() in this port.
    get newNavigator(): IHabboNewNavigator | null
    {
        return this._newNavigator;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::get soundManager()
    get soundManager(): IHabboSoundManager | null
    {
        return this._soundManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::get connection()
    get connection(): IConnection | null
    {
        return this._communication?.connection ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::get freeFlowChat()
    get freeFlowChat(): IHabboFreeFlowChat | null
    {
        return this._freeFlowChat;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::get messenger()
    get messenger(): IHabboMessenger | null
    {
        return this._messenger;
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get localization()
    get localization(): IHabboLocalizationManager | null
    {
        return this._localization;
    }

    get configuration(): IHabboConfigurationManager | null
    {
        return this._configuration;
    }

    /**
	 * The width of the toolbar area
	 *
	 * Delegates to BottomBarLeft.getToolbarAreaWidth() which returns
	 * the line separator position or collapsed margin.
	 *
	 * @see sources/win63_version/habbo/toolbar/HabboToolbar.as get toolBarAreaWidth()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get toolBarAreaWidth()
    get toolBarAreaWidth(): number
    {
        if(this.bottomBarLeft)
        {
            return this.bottomBarLeft.getToolbarAreaWidth();
        }

        return 0;
    }

    /**
	 * The communication manager
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::get communicationManager()
    get communicationManager(): IHabboCommunicationManager | null
    {
        return this._communication;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (manager: IHabboConfigurationManager | null) =>
                {
                    this._configuration = manager;
                },
                true,
                [{
                    type: 'complete',
                    callback: this.onConfigurationComplete.bind(this)
                }]
            ),
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communication = manager;

                    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::initComponent()
                    // registers this the moment it has the connection — the toolbar's only
                    // subscription, and the one call site of `addHabboConnectionMessageEvent()`,
                    // which was ported with its tracking list and its disposal and then never
                    // called by anything. The DI callback is where this port learns it has a
                    // communication manager, so it is the honest equivalent of that point.
                    if(manager) this.addHabboConnectionMessageEvent(new UserRightsMessageEvent(this.onUserRights.bind(this)));
                },
                true
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboInventory,
                (manager: IHabboInventory | null) =>
                {
                    this._inventory = manager;
                },
                true,
                [{
                    // AS3: HIHCE_HABBO_CLUB_CHANGED - dispatched by the club-status
                    // message handler after HabboInventory.setClubStatus(). That
                    // handler is not ported yet (communication/ scope), so this
                    // listener is currently dormant, matching this port's own
                    // documented precedent for other not-yet-wired producers.
                    type: 'HIHCE_HABBO_CLUB_CHANGED',
                    callback: this.onClubChanged.bind(this)
                }]
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localization = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCatalog,
                (manager: IHabboCatalog | null) =>
                {
                    this._catalog = manager;
                },
                true,
                [
                    {type: CatalogEvent.CATALOG_INITIALIZED, callback: this.onCatalogEvent.bind(this)},
                    {type: CatalogEvent.CATALOG_NOT_READY, callback: this.onCatalogEvent.bind(this)},
                    {type: CatalogEvent.CATALOG_NEW_ITEMS_SHOW, callback: this.onCatalogEvent.bind(this)},
                    {type: CatalogEvent.CATALOG_NEW_ITEMS_HIDE, callback: this.onCatalogEvent.bind(this)}
                ]
            ),
            new ComponentDependency(
                IID_HabboNavigator,
                (navigator: IHabboNavigator | null) =>
                {
                    this._navigator = navigator;
                },
                true
            ),
            // Optional: the quest engine is attached after the toolbar, so a required
            // dependency would block the toolbar's own init. AS3's toolbar exposes
            // questEngine the same way (get questEngine).
            new ComponentDependency(
                IID_HabboQuestEngine,
                (engine: IHabboQuestEngine | null) =>
                {
                    this._questEngine = engine;
                },
                false,
                // AS3 attaches three listeners to this dependency, and all three have a source
                // here: achievements, daily tasks, and the reward track.
                [
                    {
                        type: UnseenAchievementsCountUpdateEvent.TYPE,
                        callback: this.onUnseenAchievementsCountUpdate.bind(this) as unknown as (...args: unknown[]) => void
                    },
                    {
                        type: UnseenDailyTasksCountUpdateEvent.TYPE,
                        callback: this.onUnseenDailyTasksCountUpdate.bind(this) as unknown as (...args: unknown[]) => void
                    },
                    {
                        type: UnseenRewardTrackRewardsCountUpdateEvent.TYPE,
                        callback: this.onUnseenRewardTrackRewardsCountUpdate.bind(this) as unknown as (...args: unknown[]) => void
                    }
                ]
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) =>
                {
                    this._sessionDataManager = manager;
                },
                true,
                [{
                    type: 'PUE_perks_updated',
                    callback: this.onPerksUpdated.bind(this)
                }]
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_RoomUI,
                (roomUI: IRoomUI | null) =>
                {
                    this._roomUI = roomUI;
                },
                false
            ),
            new ComponentDependency(
                IID_AvatarRenderManager,
                (manager: IAvatarRenderManager | null) =>
                {
                    this._avatarRenderManager = manager;
                },
                false
            ),
            // TS-only: see the `_newNavigator` field comment - not an AS3 dependency
            // entry of its own (AS3 wires IIDHabboNewNavigator the same way, but this
            // port's own IID_HabboNavigator dependency above already covers the
            // AS3-declared `_navigator` field).
            new ComponentDependency(
                IID_HabboNewNavigator,
                (navigator: IHabboNewNavigator | null) =>
                {
                    this._newNavigator = navigator;
                },
                false
            ),
            // Optional where AS3 has it required: an unresolved required dependency locks
            // the toolbar forever, and it has nothing to do with sound.
            new ComponentDependency(
                IID_HabboSoundManager,
                (manager: IHabboSoundManager | null) =>
                {
                    this._soundManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboFreeFlowChat,
                (freeFlowChat: IHabboFreeFlowChat | null) =>
                {
                    this._freeFlowChat = freeFlowChat;
                },
                false
            ),
            // AS3: no concrete HabboMessenger is attached against this IID yet -
            // optional and dormant (see the `_messenger` field comment).
            new ComponentDependency(
                IID_HabboMessenger,
                (messenger: IHabboMessenger | null) =>
                {
                    this._messenger = messenger;
                },
                false
            ),
            // The forums contribute to the me-menu badge. AS3 takes no reference at all — the
            // dependency exists purely to subscribe to the controller's event bus, which is why
            // the setter is null.
            new ComponentDependency(
                IID_HabboGroupForumController,
                null,
                false,
                [{
                    type: UnseenForumsCountUpdatedEvent.TYPE,
                    callback: this.onUnseenForumsCountUpdate.bind(this)
                }]
            ),
        ];
    }

    /**
	 * The me-menu badge is the sum of three counters, so the forum figure is written to
	 * `BottomBarLeft` *and* to the me-menu itself before the total is recomputed — writing only the
	 * total would lose the breakdown the menu shows per row.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::onUnseenForumsCountUpdate()
    private onUnseenForumsCountUpdate(...args: unknown[]): void
    {
        const event = (args[0] ?? null) as UnseenForumsCountUpdatedEvent | null;

        if(event === null) return;

        const bottomBarLeft = this.bottomBarLeft;

        if(bottomBarLeft !== null)
        {
            bottomBarLeft.unseenForumsCount = event.unseenForumsCount;

            const memenu = bottomBarLeft.memenu;

            if(memenu !== null) memenu.unseenForumsCount = event.unseenForumsCount;

            this.setUnseenItemCount(HabboToolbarIconEnum.MEMENU, bottomBarLeft.unseenMeMenuCount);
        }
    }

    private _bottomBarLeft: BottomBarLeft | null = null;
    private _backgroundBorder: BottomBackgroundBorder | null = null;
    private _pendingIconVisibility: Map<string, boolean> = new Map();

    /**
	 * Lazy accessor for the BottomBarLeft view.
	 *
	 * Creates the view on first access. This defers construction until
	 * after the client has registered window layouts (which happens after
	 * bootstrap). In AS3, layouts were embedded in the SWF and available
	 * immediately during initComponent().
	 */
    private get bottomBarLeft(): BottomBarLeft | null
    {
        if(!this._bottomBarLeft && this._windowManager)
        {
            try
            {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::initComponent()
                // constructs BottomBackgroundBorder alongside BottomBarLeft — the TS port
                // never constructed it at all, so the toolbar's background panel never
                // rendered (icons floated over whatever was behind them, e.g. the room
                // canvas going transparent/black once in a room).
                if(!this._backgroundBorder)
                {
                    this._backgroundBorder = new BottomBackgroundBorder(this);
                }

                this._bottomBarLeft = new BottomBarLeft(this, this._windowManager);

                if(this._bottomBarLeft.window)
                {
                    this._bottomBarLeft.window.visible = false;
                }

                log.debug('BottomBarLeft created successfully');

                // Replay any icon-visibility requests that arrived before the
                // window layout was registered (construction fails silently
                // until then — see setIconVisibility()).
                for(const [iconId, visible] of this._pendingIconVisibility)
                {
                    this._bottomBarLeft.iconVisibility(iconId, visible);
                }

                this._pendingIconVisibility.clear();
            }
            catch (error)
            {
                log.warn('Failed to create BottomBarLeft:', error);
            }
        }

        return this._bottomBarLeft;
    }

    /**
	 * Set the toolbar state (hotel view, room view, hidden, etc.)
	 *
	 * @param state One of HabboToolbarEnum state constants
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as setToolbarState()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::setToolbarState()
    setToolbarState(state: string): void
    {
        this._currentState = state;

        switch(state)
        {
            case HabboToolbarEnum.TOOLBAR_STATE_HOTEL_VIEW:
            case HabboToolbarEnum.TOOLBAR_STATE_GAME_CENTER_VIEW:
            case HabboToolbarEnum.TOOLBAR_STATE_ROOM_VIEW:
                // Extensions visible in hotel, game center, and room views
                break;
            case HabboToolbarEnum.TOOLBAR_STATE_HIDDEN:
                // Extensions hidden
                break;
        }

        // Delegate to BottomBarLeft for window state + visibility
        if(this.bottomBarLeft)
        {
            this.bottomBarLeft.setToolbarState(state);

            if(this.bottomBarLeft.window)
            {
                this.bottomBarLeft.window.visible = true;
            }
        }

        // Dispatch resized event
        const resizedEvent = new HabboToolbarEvent(HabboToolbarEvent.RESIZED);
        this._toolbarEvents.emit(HabboToolbarEvent.RESIZED, resizedEvent);

        log.debug(`Toolbar state set to: ${state}`);
    }

    /**
	 * Toggle the visibility of a window by icon name
	 *
	 * Dispatches the appropriate toolbar event when an icon is clicked.
	 * Also sends an event log to the server for tracking.
	 *
	 * Emitting the click *is* the whole method: in AS3 too, a separate module subscribes and
	 * decides what to open. CATALOGUE reaches HabboCatalog, ACHIEVEMENTS the quest
	 * engine, NAVIGATOR/ROOMINFO/HOME the navigator, INVENTORY the inventory, MEMENU/GAMES the
	 * me-menu controller, and the landing view listens for its own.
	 *
	 * CAMERA is the one icon that does not emit a click at all: AS3 raises `CAMERA_TOGGLE`
	 * instead, carrying where the camera was launched from, because the camera is opened by the
	 * room UI rather than by a window-owning module.
	 *
	 * Icons whose module does not exist at all — GUIDE, STORIES, RECEPTION — still emit; nothing
	 * listens, which is also what happens in AS3 on a hotel where those features are off.
	 *
	 * @param iconName Icon name to toggle
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as toggleWindowVisibility()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::toggleWindowVisibility()
    toggleWindowVisibility(iconName: string): void
    {
        const iconId = (HabboToolbarIconEnum as unknown as Record<string, string>)[iconName];

        if(iconId === HabboToolbarIconEnum.CAMERA)
        {
            const cameraEvent = new HabboToolbarEvent(HabboToolbarEvent.CAMERA_TOGGLE);
            cameraEvent.iconName = HabboToolbarEvent.CAMERA_LAUNCH_ORIGIN_TOOLBAR;

            this._toolbarEvents.emit(HabboToolbarEvent.CAMERA_TOGGLE, cameraEvent);
        }
        else
        {
            const clickEvent = new HabboToolbarEvent(HabboToolbarEvent.TOOLBAR_CLICK);
            clickEvent.iconId = iconId;
            clickEvent.iconName = iconName;
            this._toolbarEvents.emit(HabboToolbarEvent.TOOLBAR_CLICK, clickEvent);
        }

        // Send tracking event
        if(this._communication?.connection)
        {
            const composer = new EventLogMessageComposer('Toolbar', iconName, 'client.toolbar.clicked');
            this._communication.connection.send(composer);
        }
    }

    /**
	 * Toggles the settings menu and refreshes the extension strip around it.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::toggleSettingVisibility()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::toggleSettingVisibility()
    toggleSettingVisibility(): void
    {
        const window = this._settingsExtension?.window ?? null;

        if(window !== null) window.visible = !window.visible;

        this.extensionView?.refreshItemWindow();
    }

    /**
	 * Reboots the client — this is what the toolbar's Log out button does.
	 *
	 * `PurseAreaExtension.onClick()` maps `logout_button` to this and to nothing else: AS3 has no
	 * separate logout path, because rebooting the AIR client IS logging out. The reboot itself is
	 * three hops away — this sets `_rebootOnNextFrame` on the core, whose next frame dispatches
	 * COMPONENT_EVENT_REBOOT, which `VortexMain.onCoreReboot()` turns into a restart.
	 *
	 * The cast mirrors AS3's `(context as _SafeCls_58)`: `IContext` is the narrow view a component
	 * gets, and `reboot()` is declared one level up on `ICore`.
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::reboot()
    reboot(): void
    {
        (this.context as ICore).reboot();
    }

    /**
	 * Get the screen location of a toolbar icon
	 *
	 * Delegates to BottomBarLeft.getIconLocation() which finds the child
	 * window by name and returns its global rectangle.
	 *
	 * @param iconId Icon identifier
	 * @returns Rectangle or null if not found
	 * @see sources/win63_version/habbo/toolbar/HabboToolbar.as getIconLocation()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::getIconLocation()
    getIconLocation(iconId: string): { x: number; y: number; width: number; height: number } | null
    {
        if(this.bottomBarLeft)
        {
            return this.bottomBarLeft.getIconLocation(iconId);
        }

        return null;
    }

    /**
	 * Get the toolbar icon window for an icon identifier.
	 *
	 * AS3 checks HTIE_EXT_GROUP against the extension view first, then
	 * BottomBarLeft (unwrapping a static-bitmap icon to its parent region),
	 * then falls back to the purse area extension.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::getIcon()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::getIcon()
    getIcon(iconId: string): IWindow | null
    {
        let icon: IWindow | null = null;

        if(iconId === 'HTIE_EXT_GROUP')
        {
            icon = this._extensionView?.getIcon(iconId) ?? null;
        }
        else if(this._bottomBarLeft)
        {
            icon = this._bottomBarLeft.getIcon(iconId);

            if(icon && (icon as unknown as {assetUri?: unknown}).assetUri !== undefined)
            {
                icon = icon.parent;
            }
        }

        if(!icon && this._purseAreaExtension)
        {
            icon = this._purseAreaExtension.getIcon(iconId);
        }

        return icon;
    }

    /**
	 * Refresh the purse area's indicators (currency/club icons)
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::refreshPurseAreaIndicators()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::refreshPurseAreaIndicators()
    refreshPurseAreaIndicators(): void
    {
        this._purseAreaExtension?.refreshIndicators();
    }

    /**
	 * Get the current toolbar state as last applied by setToolbarState()
	 * (HTE_STATE_COLLAPSED does not overwrite it - see BottomBarLeft.setToolbarState()).
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::getToolbarState()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::getToolbarState()
    getToolbarState(): string
    {
        return this.bottomBarLeft?.getToolbarState() ?? '';
    }

    /**
     * Both handlers write the count twice — once onto the bar, which sums it into the icon badge,
     * and once onto the progression menu, which shows it on the row inside. AS3 does the same and
     * the two are not redundant: the badge is a total, the row is per-category.
     */
    // AS3: HabboToolbar.as::onUnseenAchievementsCountUpdate()
    private onUnseenAchievementsCountUpdate(event: UnseenAchievementsCountUpdateEvent): void
    {
        const bar = this.bottomBarLeft;

        if(bar === null) return;

        bar.unseenAchievementCount = event.count;

        if(bar.progmenu !== null) bar.progmenu.unseenAchievementsCount = event.count;

        this.setUnseenItemCount(HabboToolbarIconEnum.PROGRESSION, bar.unseenProgMenuCount);
    }

    // AS3: HabboToolbar.as::onUnseenDailyTasksCountUpdate()
    private onUnseenDailyTasksCountUpdate(event: UnseenDailyTasksCountUpdateEvent): void
    {
        const bar = this.bottomBarLeft;

        if(bar === null) return;

        bar.unseenDailyTasksCount = event.count;

        if(bar.progmenu !== null) bar.progmenu.unseenDailyTaskCount = event.count;

        this.setUnseenItemCount(HabboToolbarIconEnum.PROGRESSION, bar.unseenProgMenuCount);
    }

    /**
     * The reward track has unclaimed rewards.
     *
     * The count lands in two places on purpose: on the bar, where it is summed with achievements
     * and daily tasks into the one badge the progression icon shows, and on the prog menu, which
     * shows it again against its own row.
     */
    // AS3: HabboToolbar.as::onUnseenRewardTrackRewardsCountUpdate()
    private onUnseenRewardTrackRewardsCountUpdate(event: UnseenRewardTrackRewardsCountUpdateEvent): void
    {
        const bar = this.bottomBarLeft;

        if(bar === null) return;

        bar.unseenRewardTrackRewardsCount = event.count;

        if(bar.progmenu !== null) bar.progmenu.unseenRewardTrackRewardsCount = event.count;

        this.setUnseenItemCount(HabboToolbarIconEnum.PROGRESSION, bar.unseenProgMenuCount);
    }

    /**
	 * Set the unseen item count for a toolbar icon
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::setUnseenItemCount()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::setUnseenItemCount()
    setUnseenItemCount(iconId: string, count: number): void
    {
        this.bottomBarLeft?.setUnseenItemCount(iconId, count);
    }

    /**
	 * Create and attach a semi-transparent dimmer window over the given
	 * window while the new-user room-enter effect is running.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::createAndAttachDimmerWindow()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::createAndAttachDimmerWindow()
    createAndAttachDimmerWindow(window: IWindow | null): void
    {
        if(!RoomEnterEffect.isRunning() || !window || !this._windowManager) return;

        const dimmer = this._windowManager.createWindow(
            'toolbar_dimmer',
            '',
            30,
            1,
            0x80 | 0x0800 | 1,
            {x: 0, y: 0, width: window.width, height: window.height},
            null,
            0
        );

        dimmer.color = 0;
        dimmer.blend = 0.3;
        (window as unknown as {addChild: (child: IWindow) => IWindow}).addChild(dimmer);
        window.invalidate();
    }

    /**
	 * Remove the dimmer window previously attached by createAndAttachDimmerWindow().
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::removeDimmer()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::removeDimmer()
    removeDimmer(window: IWindow | null): void
    {
        if(!window) return;

        const container = window as unknown as {
            findChildByName: (name: string) => IWindow | null;
            removeChild: (child: IWindow) => IWindow | null;
        };
        const dimmer = container.findChildByName('toolbar_dimmer');

        if(dimmer)
        {
            container.removeChild(dimmer);
            window.invalidate();
            this._windowManager?.destroy(dimmer);
        }
    }

    /**
	 * React to the Habbo Club status changing: forwards to every extension
	 * that displays club-dependent UI. The event itself carries no data (AS3:
	 * `new HabboInventoryHabboClubEvent()`), so the current values are read
	 * from the inventory's purse state at call time.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::onClubChanged()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::onClubChanged()
    onClubChanged(): void
    {
        const purse = this._inventory?.purse;

        this._purseAreaExtension?.getClubArea()?.onClubChanged();
        this._citizenshipVipDiscountPromoExtension?.onClubChanged(
            purse?.citizenshipVipIsExpiring ?? false,
            purse?.minutesUntilExpiration ?? 0
        );

        if(this._inventory)
        {
            this._videoOfferExtension?.onClubChanged();
            this._clubDiscountPromoExtension?.onClubChanged(
                purse?.clubIsExpiring ?? false,
                purse?.minutesUntilExpiration ?? 0,
                this._inventory.clubLevel
            );
        }
    }

    /**
	 * Forward a catalog state-change to BottomBarLeft (icon enable/disable and the
	 * "new items" badge). HabboCatalog's emit() passes the CatalogEvent instance itself, so it
	 * is forwarded as-is.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::onCatalogEvent()
    private onCatalogEvent(...args: unknown[]): void
    {
        const event = (args[0] ?? null) as CatalogEvent | null;

        if(event) this._bottomBarLeft?.onCatalogEvent(event);
    }

    /**
     * Set bitmap data for a toolbar icon
     *
     * In AS3, this set a BitmapData on the toolbar view icon.
     *
     * @see source_as_win63/habbo/toolbar/HabboToolbar.as setIconBitmap()
     * @param iconId
     * @param bitmap
     */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::setIconBitmap()
    setIconBitmap(iconId: string, bitmap: unknown): void
    {
        if(this._bottomBarLeft && (bitmap === null || bitmap instanceof ImageBitmap))
        {
            this._bottomBarLeft.setIconBitmap(iconId, bitmap);
        }
    }

    /**
	 * Animate a bitmap from a source position to a toolbar icon.
	 *
	 * Creates a temporary floating bitmap that flies from (startX, startY) to
	 * the target icon with a jump arc, then bounces the icon on arrival.
	 * Used when purchasing catalog items (fly to inventory) or picking up furni.
	 *
	 * @param iconId Target icon identifier (e.g. 'HTIE_ICON_INVENTORY')
	 * @param bitmap The bitmap to animate (ownership is transferred)
	 * @param startX Source X position in global coordinates
	 * @param startY Source Y position in global coordinates
	 * @returns The fly motion, or null if the icon was not found
	 * @see sources/win63_version/habbo/toolbar/HabboToolbar.as createTransitionToIcon()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::createTransitionToIcon()
    createTransitionToIcon(iconId: string, bitmap: ImageBitmap | null, startX: number, startY: number): Motion | null
    {
        if(this._bottomBarLeft && !this._bottomBarLeft.disposed)
        {
            return this._bottomBarLeft.animateToIcon(iconId, bitmap, startX, startY);
        }

        // No toolbar view — dispose the bitmap to avoid leaks
        if(bitmap)
        {
            bitmap.close();
        }

        return null;
    }

    /**
	 * Get the bounding rectangle of the toolbar
	 *
	 * Returns the BottomBarLeft window's rectangle.
	 *
	 * @returns The toolbar rectangle
	 * @see sources/win63_version/habbo/toolbar/HabboToolbar.as getRect()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::getRect()
    getRect(): { x: number; y: number; width: number; height: number }
    {
        if(this.bottomBarLeft?.window)
        {
            return this.bottomBarLeft.window.rectangle;
        }

        return {x: 0, y: 0, width: 0, height: 0};
    }

    /**
	 * Set the visibility of a toolbar icon
	 *
	 * Delegates to BottomBarLeft.iconVisibility() which finds the child
	 * window by name and sets its visible property.
	 *
	 * @param iconId Icon identifier (the toolbar icon name, not the HTIE_ constant)
	 * @param visible Whether the icon should be visible
	 * @see sources/win63_version/habbo/toolbar/HabboToolbar.as setIconVisibility()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::setIconVisibility()
    setIconVisibility(iconId: string, visible: boolean): void
    {
        if(this.bottomBarLeft)
        {
            this.bottomBarLeft.iconVisibility(iconId, visible);
        }
        else
        {
            // Window layout may not be registered yet (see bottomBarLeft getter) —
            // remember the request and apply it once construction succeeds.
            this._pendingIconVisibility.set(iconId, visible);
        }
    }

    /**
	 * Check if this is a new identity user
	 *
	 * @returns True if new.identity config value is greater than 0
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as isNewIdentity()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::isNewIdentity()
    isNewIdentity(): boolean
    {
        return this.getInteger('new.identity', 0) > 0;
    }

    /**
	 * Check if Xmas features are enabled
	 *
	 * @returns True if xmas11.enabled config is true
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as isXmasEnabled()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::isXmasEnabled()
    isXmasEnabled(): boolean
    {
        return this.getBoolean('xmas11.enabled');
    }

    /**
	 * Check if Valentines features are enabled
	 *
	 * @returns True if valentines.enabled config is true
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as isValentinesEnabled()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::isValentinesEnabled()
    isValentinesEnabled(): boolean
    {
        return this.getBoolean('valentines.enabled');
    }

    /**
	 * Dispose of this component
	 *
	 * Cleans up all message event handlers, extensions, and timers.
	 *
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as dispose()
	 */
    override dispose(): void
    {
        if(this._disposed) return;

        // Remove all message event handlers
        if(this._communication)
        {
            for(const event of this._messageEvents)
            {
                this._communication.removeMessageEvent(event);
            }
        }

        this._messageEvents = [];

        // Dispose toolbar view
        if(this._bottomBarLeft)
        {
            this._bottomBarLeft.dispose();
            this._bottomBarLeft = null;
        }

        if(this._backgroundBorder)
        {
            this._backgroundBorder.dispose();
            this._backgroundBorder = null;
        }

        if(this._seasonalCurrencyIndicator)
        {
            this._seasonalCurrencyIndicator.dispose();
            this._seasonalCurrencyIndicator = null;
        }

        if(this._purseAreaExtension)
        {
            this._purseAreaExtension.dispose();
            this._purseAreaExtension = null;
        }

        if(this._settingsExtension)
        {
            this._settingsExtension.dispose();
            this._settingsExtension = null;
        }

        if(this._offerExtension)
        {
            this._offerExtension.dispose();
            this._offerExtension = null;
        }

        if(this._clubDiscountPromoExtension)
        {
            this._clubDiscountPromoExtension.dispose();
            this._clubDiscountPromoExtension = null;
        }

        if(this._citizenshipVipQuestsPromoExtension)
        {
            this._citizenshipVipQuestsPromoExtension.dispose();
            this._citizenshipVipQuestsPromoExtension = null;
        }

        if(this._citizenshipVipDiscountPromoExtension)
        {
            this._citizenshipVipDiscountPromoExtension.dispose();
            this._citizenshipVipDiscountPromoExtension = null;
        }

        if(this._videoOfferExtension)
        {
            this._videoOfferExtension.dispose();
            this._videoOfferExtension = null;
        }

        if(this._extensionView)
        {
            this._extensionView.dispose();
            this._extensionView = null;
        }

        // Clear toolbar events
        this._toolbarEvents.removeAllListeners();

        // Clear references
        this._communication = null;
        this._windowManager = null;
        this._sessionDataManager = null;
        this._roomSessionManager = null;
        this._avatarRenderManager = null;
        this._roomUI = null;
        this._inventory = null;
        this._catalog = null;
        this._localization = null;
        this._configuration = null;
        this._extensionsInitialized = false;

        super.dispose();
    }

    /**
	 * Initialize the toolbar component
	 *
	 * Called when all required dependencies are resolved.
	 * Sets up message event handlers and initial toolbar state.
	 *
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as initComponent()
	 */
    protected override initComponent(): void
    {
        // BottomBarLeft is created lazily via ensureBottomBarLeft() because
        // initComponent() fires during bootstrap, before the client has
        // registered the window layouts. In AS3, layouts were embedded in
        // the SWF and available immediately; here they're registered after
        // bootstrap by the client layer.
        log.debug('Toolbar component initialized');
    }

    /**
	 * Handler for configuration complete event
	 *
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as onConfigurationComplete()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::onConfigurationComplete()
    private onConfigurationComplete(): void
    {
        // Configuration is ready - extensions can now be initialized
    }

    /**
	 * Handler for perks updated event
	 *
	 * Initializes toolbar extensions after perks are available.
	 * Extensions are only initialized once.
	 *
	 * @see source_as_win63/habbo/toolbar/HabboToolbar.as onPerksUpdated()
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::onPerksUpdated()
    private onPerksUpdated(): void
    {
        if(!this._extensionsInitialized)
        {
            this.initPurseAreaExtension();
            this.initSeasonalCurrencyExtension();
            this.initVipExtendExtension();
            this.initCitizenshipVipExtendExtension();
            this.initCitizenshipVipQuestsExtension();
            this.initVideoOfferExtension();
            this.initOfferExtension();
            this.initSettingsExtension();

            this._extensionsInitialized = true;

            log.debug('Toolbar extensions initialized after perks update');
        }
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::initPurseAreaExtension()
    private initPurseAreaExtension(): void
    {
        if(this._purseAreaExtension || !this._windowManager || !this._catalog) return;

        this._purseAreaExtension = new PurseAreaExtension(
            this,
            this._windowManager,
            this._catalog
        );

        this._purseAreaExtension.getClubArea()?.onClubChanged();
    }

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbar.as::initSeasonalCurrencyExtension()
    private initSeasonalCurrencyExtension(): void
    {
        if(this._seasonalCurrencyIndicator || !this._windowManager || !this._catalog) return;
        if(!this.getBoolean('seasonalcurrencyindicator.enabled')) return;

        this._seasonalCurrencyIndicator = new SeasonalCurrencyIndicator(
            this,
            this._windowManager,
            this._catalog,
            this._localization
        );

        const displayedType = this._seasonalCurrencyIndicator.displayedActivityPointType;
        const balance = this._catalog.getPurse().getActivityPointsForType(displayedType);

        this._seasonalCurrencyIndicator.onBalance(
            new PurseEvent(PurseEvent.ACTIVITY_POINT_BALANCE, balance, displayedType)
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::initVipExtendExtension()
    private initVipExtendExtension(): void
    {
        if(this._clubDiscountPromoExtension) return;
        if(!this.getBoolean('club.membership.extend.vip.promotion.enabled')) return;

        this._clubDiscountPromoExtension = new ClubDiscountPromoExtension(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::initCitizenshipVipExtendExtension()
    private initCitizenshipVipExtendExtension(): void
    {
        if(this._citizenshipVipDiscountPromoExtension) return;
        if(!this.getBoolean('club.membership.extend.vip.promotion.enabled')) return;

        this._citizenshipVipDiscountPromoExtension = new CitizenshipVipDiscountPromoExtension(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::initCitizenshipVipQuestsExtension()
    private initCitizenshipVipQuestsExtension(): void
    {
        if(this._citizenshipVipQuestsPromoExtension) return;
        if(!this.getBoolean('citizenship.vip.quest.promotion.enabled')) return;

        this._citizenshipVipQuestsPromoExtension = new CitizenshipVipQuestsPromoExtension(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::initVideoOfferExtension()
    private initVideoOfferExtension(): void
    {
        if(this._videoOfferExtension || !this._catalog) return;

        const identityGate = !this.isNewIdentity() || !this.getBoolean('new.identity.hide.ui');

        if(!this._catalog.videoOffers?.enabled) return;
        if(!this.getBoolean('toolbar.extension.video.promo.enabled')) return;
        if(!identityGate) return;

        this._videoOfferExtension = new VideoOfferExtension(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::initOfferExtension()
    private initOfferExtension(): void
    {
        if(this._offerExtension) return;

        const identityGate = !this.isNewIdentity() || !this.getBoolean('new.identity.hide.ui');

        if(!this.getBoolean('offers.enabled')) return;
        if(!identityGate) return;
        if(this.getBoolean('offers.habboclub.enabled')) return;

        this._offerExtension = new OfferExtension(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::initSettingsExtension()
    private initSettingsExtension(): void
    {
        if(this._settingsExtension) return;

        this._settingsExtension = new SettingsExtension(this);
    }

    /**
	 * Add a message event handler and track it for cleanup
	 *
	 * @param event The message event to register
	 */
    /**
	 * The video-offer extension gets a second chance here.
	 *
	 * `initVideoOfferExtension()` runs from `onPerksUpdated()` with the rest of the extensions, but
	 * its gates include `catalog.videoOffers.enabled`, which can flip true *after* that pass. AS3
	 * guards on the extension field itself — `if(!_videoOfferExtension)` — and this port's
	 * `initVideoOfferExtension()` already opens with the same check, so calling it again is a no-op
	 * once the extension exists.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbar.as::onUserRights()
    private onUserRights(_event: IMessageEvent): void
    {
        if(!this._videoOfferExtension) this.initVideoOfferExtension();
    }

    private addHabboConnectionMessageEvent(event: IMessageEvent): void
    {
        if(this._communication)
        {
            this._communication.addMessageEvent(event);
            this._messageEvents.push(event);
        }
    }
}
