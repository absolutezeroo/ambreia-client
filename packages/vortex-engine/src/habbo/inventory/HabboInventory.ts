import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import {HabboInventoryTrackingEvent} from './events/HabboInventoryTrackingEvent';
import {Component, ComponentDependency, type IContext} from '@core/runtime';
// Vortex-only: the fishing tab. Optional — the inventory works unchanged without it.
import {IID_HabboFishing} from '@iid/IIDHabboFishing';
import type {HabboFishing} from '@habbo/vortex/fishing/HabboFishing';
import {isRoomViewerMode} from '@habbo/configuration/enum/HabboComponentFlags';
import type {IHabboInventory, InventoryCategoryType} from './IHabboInventory';
import type {IFurniModel} from './furni/IFurniModel';
import type {IBadgesModel} from './badges/IBadgesModel';
import type {IEffectsModel} from './effects/IEffectsModel';
import {EffectFilter} from './effects/IEffectsModel';
import type {IPetsModel} from './pets/IPetsModel';
import type {IBotsModel} from './bots/IBotsModel';
import type {ITradingModel} from './trading/ITradingModel';
import type {IPurse} from './purse/IPurse';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import {FurniModel} from './furni/FurniModel';
import {FurnitureCategory} from './enum/FurnitureCategory';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {BadgesModel} from './badges/BadgesModel';
import {EffectsModel} from './effects/EffectsModel';
import {RecyclerModel} from './recycler/RecyclerModel';
import type {IRecyclerModel} from './recycler/IRecyclerModel';
import {CollectiblesModel} from './collectibles/CollectiblesModel';
import {CollectibleGroupedItem} from './collectibles/CollectibleGroupedItem';
import type {ICollectiblesModel} from './collectibles/ICollectiblesModel';
import {NftAssetsMessageEvent} from '@habbo/communication/messages/incoming/collectibles/NftAssetsMessageEvent';
import {TradeNftAssetsMessageEvent} from '@habbo/communication/messages/incoming/collectibles/TradeNftAssetsMessageEvent';
import type {NftAssetsMessageParser} from '@habbo/communication/messages/parser/collectibles/NftAssetsMessageParser';
import type {TradeNftAssetsMessageParser} from '@habbo/communication/messages/parser/collectibles/TradeNftAssetsMessageParser';
import type {CollectibleAsset} from '@habbo/communication/messages/parser/collectibles/CollectibleAsset';
import {PetsModel} from './pets/PetsModel';
import {Pet} from './pets/Pet';
import {PetFigureData} from './pets/PetFigureData';
import {
    PostItPlacedMessageEvent
} from '@habbo/communication/messages/incoming/inventory/furni/PostItPlacedMessageEvent';
import type {
    PostItPlacedMessageParser
} from '@habbo/communication/messages/parser/inventory/furni/PostItPlacedMessageParser';
import {
    BadgePointLimitsMessageEvent
} from '@habbo/communication/messages/incoming/inventory/badges/BadgePointLimitsMessageEvent';
import type {
    BadgePointLimitsMessageParser
} from '@habbo/communication/messages/parser/inventory/badges/BadgePointLimitsMessageParser';
import {BadgeReceivedEvent} from '../communication/messages/incoming/inventory/badges/BadgeReceivedEvent';
import type {
    BadgeReceivedEventParser
} from '../communication/messages/parser/inventory/badges/BadgeReceivedEventParser';
import {BadgesMessageEvent} from '../communication/messages/incoming/inventory/badges/BadgesMessageEvent';
import {HabboUserBadgesMessageEvent} from '../communication/messages/incoming/users/HabboUserBadgesMessageEvent';
import type {HabboUserBadgesMessageParser} from '../communication/messages/parser/users/HabboUserBadgesMessageParser';
import type {
    BadgesMessageParser,
    IBadgeData
} from '../communication/messages/parser/inventory/badges/BadgesMessageParser';
import {
    BotAddedToInventoryMessageEvent,
    BotInventoryMessageEvent,
    BotRemovedFromInventoryMessageEvent
} from '@habbo/communication/messages/incoming/inventory/bots';
import type {
    BotAddedToInventoryMessageParser,
    BotInventoryMessageParser,
    BotRemovedFromInventoryMessageParser
} from '@habbo/communication/messages/parser/inventory/bots';
import {PetInventoryMessageEvent} from '../communication/messages/incoming/inventory/pets/PetInventoryMessageEvent';
import type {
    PetInventoryMessageParser
} from '../communication/messages/parser/inventory/pets/PetInventoryMessageParser';
import {
    GoToBreedingNestFailureEvent,
    PetAddedToInventoryEvent,
    PetRemovedFromInventoryEvent
} from '../communication/messages/incoming/inventory/pets';
import type {
    GoToBreedingNestFailureEventParser,
    PetAddedToInventoryEventParser,
    PetRemovedFromInventoryEventParser
} from '../communication/messages/parser/inventory/pets';
import {BotsModel} from './bots/BotsModel';
import {TradingModel} from './trading/TradingModel';
import {MarketplaceModel} from './marketplace/MarketplaceModel';
import {
    MarketplaceCanMakeOfferResultEvent
} from '@habbo/communication/messages/incoming/marketplace/MarketplaceCanMakeOfferResultEvent';
import {
    MarketplaceMakeOfferResultEvent
} from '@habbo/communication/messages/incoming/marketplace/MarketplaceMakeOfferResultEvent';
import type {
    MarketplaceCanMakeOfferResultParser
} from '@habbo/communication/messages/parser/marketplace/MarketplaceCanMakeOfferResultParser';
import type {
    MarketplaceMakeOfferResultParser
} from '@habbo/communication/messages/parser/marketplace/MarketplaceMakeOfferResultParser';
import {
    TradeOpenFailedEvent,
    TradeSilverFeeMessageEvent,
    TradeSilverSetMessageEvent,
    TradingAcceptMessageEvent,
    TradingCloseMessageEvent,
    TradingCompletedMessageEvent,
    TradingConfirmationMessageEvent,
    TradingItemListMessageEvent,
    TradingNotOpenMessageEvent,
    TradingOpenMessageEvent,
    TradingOtherNotAllowedEvent,
    TradingYouAreNotAllowedEvent
} from '../communication/messages/incoming/inventory/trading';
import type {
    TradingItemListMessageParser
} from '../communication/messages/parser/inventory/trading/TradingItemListMessageParser';
import type {
    TradingOpenMessageParser
} from '../communication/messages/parser/inventory/trading/TradingOpenMessageParser';
import type {TradingFurniItemParser} from '../communication/messages/parser/inventory/trading/TradingFurniItemParser';
import {OrderedMap} from '@core/utils/OrderedMap';
import type {IInventoryModel} from './IInventoryModel';
import type {IAssetLibrary} from '@core/assets';
import {ErrorReportStorage} from '@core/utils/ErrorReportStorage';
import type {GroupItem} from './items/GroupItem';
import {Purse} from './purse/Purse';
import {UnseenItemTracker} from './UnseenItemTracker';
import {InventoryMainView} from './InventoryMainView';
import {Logger} from '@core/utils/Logger';
import {IID_HabboCommunicationManager} from "@iid/IIDHabboCommunicationManager";
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboNotifications} from '@iid/IIDHabboNotifications';
import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import {IID_HabboSoundManager} from '@iid/IIDHabboSoundManager';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {RoomSessionEvent} from '@habbo/session/events/RoomSessionEvent';
import {RoomSessionPropertyUpdateEvent} from '@habbo/session/events/RoomSessionPropertyUpdateEvent';
import {
    GetBadgesComposer,
    GetBotInventoryComposer,
    GetPetInventoryComposer,
    RequestFurniInventoryComposer,
    GetSilverMessageComposer,
    GetNftCreditsMessageComposer,
} from '../communication/messages/outgoing/inventory';
import {ScrGetUserInfoMessageComposer} from '../communication/messages/outgoing/users/ScrGetUserInfoMessageComposer';
import {GetBadgePointLimitsComposer} from '@habbo/communication/messages/outgoing/inventory/GetBadgePointLimitsComposer';
import {GetCreditsInfoComposer} from '@habbo/communication/messages/outgoing/inventory/purse/GetCreditsInfoComposer';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {FurniListMessageEvent} from '../communication/messages/incoming/inventory/furni/FurniListMessageEvent';
import {
    FurniListAddOrUpdateMessageEvent
} from '../communication/messages/incoming/inventory/furni/FurniListAddOrUpdateMessageEvent';
import {
    FurniListRemoveMessageEvent
} from '../communication/messages/incoming/inventory/furni/FurniListRemoveMessageEvent';
import {
    FurniListRemoveMultipleMessageEvent
} from '../communication/messages/incoming/inventory/furni/FurniListRemoveMultipleMessageEvent';
import {
    FurniListInvalidateMessageEvent
} from '../communication/messages/incoming/inventory/furni/FurniListInvalidateMessageEvent';
import type {FurniListMessageParser} from '../communication/messages/parser/inventory/furni/FurniListMessageParser';
import type {
    FurniListAddOrUpdateMessageParser
} from '../communication/messages/parser/inventory/furni/FurniListAddOrUpdateMessageParser';
import type {
    FurniListRemoveMessageParser
} from '../communication/messages/parser/inventory/furni/FurniListRemoveMessageParser';
import type {
    FurniListRemoveMultipleMessageParser
} from '../communication/messages/parser/inventory/furni/FurniListRemoveMultipleMessageParser';
import type {FurniListItemParser} from '../communication/messages/parser/inventory/furni/FurniListItemParser';
import type {IFurnitureItemData} from './items/FurnitureItemData';
import {FurnitureItem} from './items/FurnitureItem';
import type {IFurnitureItem} from './items/IFurnitureItem';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import {Vector3d} from '@room/utils/Vector3d';
import {ScrSendUserInfoEvent} from '../communication/messages/incoming/users/ScrSendUserInfoEvent';
import type {ScrSendUserInfoMessageParser} from '../communication/messages/parser/users/ScrSendUserInfoMessageParser';
import {AvatarEffectsMessageEvent} from '../communication/messages/incoming/inventory/AvatarEffectsMessageEvent';
import {
    AvatarEffectAddedMessageEvent
} from '../communication/messages/incoming/inventory/AvatarEffectAddedMessageEvent';
import {
    AvatarEffectActivatedMessageEvent
} from '../communication/messages/incoming/inventory/AvatarEffectActivatedMessageEvent';
import {
    AvatarEffectExpiredMessageEvent
} from '../communication/messages/incoming/inventory/AvatarEffectExpiredMessageEvent';
import type {AvatarEffectsMessageParser} from '../communication/messages/parser/inventory/AvatarEffectsMessageParser';
import type {
    AvatarEffectAddedMessageParser
} from '../communication/messages/parser/inventory/AvatarEffectAddedMessageParser';
import type {
    AvatarEffectActivatedMessageParser
} from '../communication/messages/parser/inventory/AvatarEffectActivatedMessageParser';
import type {
    AvatarEffectExpiredMessageParser
} from '../communication/messages/parser/inventory/AvatarEffectExpiredMessageParser';
import {
    OpenConnectionMessageEvent
} from '@habbo/communication/messages/incoming/room/session/OpenConnectionMessageEvent';
import {
    CloseConnectionMessageEvent
} from '@habbo/communication/messages/incoming/room/session/CloseConnectionMessageEvent';
import {
    FlatAccessDeniedMessageEvent
} from '@habbo/communication/messages/incoming/navigator/FlatAccessDeniedMessageEvent';
import type {
    FlatAccessDeniedMessageParser
} from '@habbo/communication/messages/parser/navigator/FlatAccessDeniedMessageParser';
import {
    RoomEntryInfoMessageEvent
} from '@habbo/communication/messages/incoming/room/engine/RoomEntryInfoMessageEvent';
import {
    NotEnoughBalanceMessageEvent
} from '@habbo/communication/messages/incoming/catalog/NotEnoughBalanceMessageEvent';
import {
    MarketplaceConfigurationEvent
} from '@habbo/communication/messages/incoming/marketplace/MarketplaceConfigurationEvent';
import type {
    MarketplaceConfigurationEventParser
} from '@habbo/communication/messages/parser/marketplace/MarketplaceConfigurationEventParser';
import {
    MarketplaceItemStatsEvent
} from '@habbo/communication/messages/incoming/marketplace/MarketplaceItemStatsEvent';
import type {
    MarketplaceItemStatsEventParser
} from '@habbo/communication/messages/parser/marketplace/MarketplaceItemStatsEventParser';
import {MarketplaceItemStats} from '@habbo/catalog/marketplace/MarketplaceItemStats';
import {
    UserRightsMessageEvent
} from '@habbo/communication/messages/incoming/handshake/UserRightsMessageEvent';
import {
    FigureSetIdsMessageEvent
} from '@habbo/communication/messages/incoming/inventory/FigureSetIdsMessageEvent';
import type {
    FigureSetIdsMessageParser
} from '@habbo/communication/messages/parser/inventory/FigureSetIdsMessageParser';
import {
    AchievementsScoreMessageEvent
} from '@habbo/communication/messages/incoming/inventory/AchievementsScoreMessageEvent';
import type {
    AchievementsScoreMessageParser
} from '@habbo/communication/messages/parser/inventory/AchievementsScoreMessageParser';
import {
    HabboAchievementNotificationMessageEvent
} from '@habbo/communication/messages/incoming/notifications/HabboAchievementNotificationMessageEvent';
import type {
    HabboAchievementNotificationMessageEventParser
} from '@habbo/communication/messages/parser/notifications/HabboAchievementNotificationMessageEventParser';
import {HabboInventoryEffectsEvent} from './events/HabboInventoryEffectsEvent';
import {HabboInventoryFurniListParsedEvent} from './events/HabboInventoryFurniListParsedEvent';
import {Effect} from './effects/Effect';

const log = Logger.getLogger('habbo.inventory.HabboInventory');

/**
 * Main inventory controller
 *
 * Based on AS3 com.sulake.habbo.inventory.HabboInventory (ENGINE only)
 * UI is the ported window system (InventoryMainView), matching the AS3
 * class hierarchy.
 */
export class HabboInventory extends Component implements IHabboInventory, ILinkEventTracker
{
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_communication
    private _communication: IHabboCommunicationManager | null = null;
    // TS-only: Vortex-only fishing system; null when the feature is not present.
    private _fishing: HabboFishing | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_catalog
    private _catalog: IHabboCatalog | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    /**
     * AS3 exposes this as `sessionData`; the models reach it for the safety-lock check that gates
     * selling and trading.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get sessionData()
    get sessionData(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_localization
    private _localization: IHabboLocalizationManager | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_notifications
    private _notifications: IHabboNotifications | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_friendList
    private _friendList: IHabboFriendList | null = null;
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_soundManager
    private _soundManager: IHabboSoundManager | null = null;
    private _furniMessageEvents: IMessageEvent[] = [];
    private _effectMessageEvents: IMessageEvent[] = [];
    private _furniListFragments: Map<number, FurniListItemParser> = new Map();

    // Accumulates pets across a fragmented PetInventory response (AS3 buffers by fragment like furni).
    private _petListFragments: Map<number, Pet> = new Map();
    private _petMessageEvents: IMessageEvent[] = [];
    private _botMessageEvents: IMessageEvent[] = [];
    // TS-only: no AS3 counterpart; the dump's inventory message handler keeps one flat
    // `_messageEvents` vector, where this port already splits it per feature (furni/pet/effect).
    private _badgeMessageEvents: IMessageEvent[] = [];
    // TS-only: no AS3 counterpart; same per-feature split as the vectors above.
    private _tradingMessageEvents: IMessageEvent[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::_badgeFragments
    // Name DERIVED, not recovered: the field is `_SafeStr_7439` and is obfuscated in every tree.
    // A Vector sized to totalFragments in onBadges(), nulled again once assembled.
    private _badgeFragments: (IBadgeData[] | null)[] | null = null;
    // TS-only: no AS3 counterpart; the dump's inventory message handler keeps one flat
    // `_messageEvents` vector, where this port splits it per feature (furni/pet/effect/badge).
    private _clubMessageEvents: IMessageEvent[] = [];
    // TS-only: no AS3 counterpart; same per-feature split as the vectors above.
    private _roomMessageEvents: IMessageEvent[] = [];
    // TS-only: no AS3 counterpart; same per-feature split as the vectors above.
    private _marketplaceMessageEvents: IMessageEvent[] = [];

    /**
	 * Figure-set ids the player has bought, and the furniture names those purchases are bound to.
	 * Both arrive together on 1231 and are read by the avatar editor to decide whether a sellable
	 * clothing item is already owned.
	 */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_SafeStr_7554 (name derived: purchased figure sets)
    private _purchasedFigureSetIds: number[] = [];

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_boundFurnitureNames
    private _boundFurnitureNames: string[] = [];
    private _initializedCategories: Set<string> = new Set();

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::_inventories
     *
     * Every category model, keyed by the category name the window uses. AS3 resolves
     * `getCategoryWindowContainer()`, `getCategorySubWindowContainer()` and `updateView()` through
     * it rather than switching on the name, which is how the trading sub-window finds its host.
     *
     * All eleven of AS3's models are registered. `effects` hands back no window, which is what
     * AS3 does too — its view field is never assigned.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_inventories
    private _inventories: OrderedMap<string, IInventoryModel> = new OrderedMap<string, IInventoryModel>();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::_SafeStr_4983
    private _purseTimer: ReturnType<typeof setInterval> | null = null;
    private _view!: InventoryMainView;

    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get localization()
    get localization(): IHabboLocalizationManager | null
    {
        return this._localization;
    }

    // Derived name: `soundManager` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get soundManager()
    get soundManager(): IHabboSoundManager | null
    {
        return this._soundManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get friendList()
    get friendList(): IHabboFriendList | null
    {
        return this._friendList;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get roomSession()
    get roomSession(): IRoomSession | null
    {
        if(!this._roomSessionManager || !this._roomEngine) return null;

        return this._roomSessionManager.getSession(this._roomEngine.activeRoomId);
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get catalog()
    get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get view()
    get view(): InventoryMainView
    {
        return this._view;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get isVisible()
    get isVisible(): boolean
    {
        return this._view.isVisible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get isMainViewActive()
    get isMainViewActive(): boolean
    {
        return this._view.isActive;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get mergeRentFurni()
    get mergeRentFurni(): boolean
    {
        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubDays()
    // A forwarder to the purse, as in AS3. The room-queue handler reads it to decide whether the
    // club queue applies to you and whether the club upsell is shown.
    get clubDays(): number
    {
        return this._purse.clubDays;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubPeriods()
    get clubPeriods(): number
    {
        return this._purse.clubPeriods;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubPastPeriods()
    // Note the purse here is `inventory/purse/Purse`, not the catalogue's — the two are different
    // classes with different members, and only this one has `clubPastPeriods`.
    get clubPastPeriods(): number
    {
        return this._purse.clubPastPeriods;
    }

    /**
	 * Whether the player has ever held club, which is not the same as holding it now
	 *
	 * The upsell copy differs between a first-time buyer and a lapsed member, so the two flags are
	 * kept apart from clubDays/clubPeriods.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubHasEverBeenMember()
    get clubHasEverBeenMember(): boolean
    {
        return this._purse.clubHasEverBeenMember;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubIsExpiring()
    get clubIsExpiring(): boolean
    {
        return this._purse.clubIsExpiring;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get web3tradeEnabled()
    get web3tradeEnabled(): boolean
    {
        return this.getBoolean('web3trade.enabled');
    }

    /**
     * Whether the player may put items into the trade window at all.
     *
     * Note this is *not* "is a trade running": a trade can be open while the server has still
     * refused this side the right to offer, which is what `ownUserCanTrade` carries.
     */
    // DEVIATION: AS3 first answers true while a wired trade runs (its contract decides what may be
    //   offered). The RPG fork removed wired trading, so only the player-to-player permission is read.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::canUserOfferToTrade()
    canUserOfferToTrade(): boolean
    {
        return this._tradingModel?.ownUserCanTrade ?? false;
    }

    /**
	 * A model by name, building the inventory first if nobody has yet.
	 *
	 * This is what makes the lazy `init()` invisible in AS3: every model getter goes through here,
	 * so *reading* a model is what creates it. The port read its private fields directly instead,
	 * which turned the laziness into a hole — a message handler that arrived before the player had
	 * ever opened the inventory found `null`, took its `?.` and did nothing, silently.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getModel()
    getModel(name: string): IInventoryModel | null
    {
        if(!this._isInitialized) this.init();

        return this._inventories.getValue(name) ?? null;
    }

    /**
     * Whichever trade is live, or null. The ordinary one wins if both somehow are.
     *
     * Returns `ITradingModel`, as AS3 does. Both callers only ever use `getOwnItemIdsInTrade()`
     * and `requestAddItemsToTrading()`, which is the whole interface. (AS3 also returns the wired
     * trading model when it runs; the RPG fork removed wired trading.)
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get activeTradingModel()
    get activeTradingModel(): ITradingModel | null
    {
        if(this._tradingModel && this._tradingModel.running)
        {
            return this._tradingModel;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get tradingActive()
    get tradingActive(): boolean
    {
        return this.activeTradingModel !== null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::onTradeActiveChanged()
    // `tradeComplete` is AS3's parameter: only a trade that *finished* refreshes the collectibles
    // model, and only when web3 trading is on at all.
    onTradeActiveChanged(tradeComplete: boolean = false): void
    {
        this._view?.disableNonTradingTabs(this.tradingActive);

        if(this.web3tradeEnabled)
        {
            this._view?.showCollectiblesTab(this.tradingActive);

            if(tradeComplete)
            {
                this._collectiblesModel?.onTradeComplete();
            }
        }
    }

    private _isInitialized: boolean = false;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get isInitialized()
    get isInitialized(): boolean
    {
        return this._isInitialized;
    }

    private _currentCategory: InventoryCategoryType | null = null;

    get currentCategory(): InventoryCategoryType | null
    {
        return this._currentCategory;
    }

    private _hasRoomSession: boolean = false;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get hasRoomSession()
    get hasRoomSession(): boolean
    {
        return this._hasRoomSession;
    }

    set hasRoomSession(value: boolean)
    {
        this._hasRoomSession = value;
    }

    private _furniModel!: FurniModel;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get furniModel()
    get furniModel(): IFurniModel
    {
        return this.getModel('furni') as IFurniModel;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getFloorItemById()
    getFloorItemById(itemId: number): FurnitureItem | null
    {
        for(const groupItem of this._furniModel.furniData)
        {
            const item = groupItem.getItem(itemId);

            if(item && !item.isWallItem) return item;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getWallItemById()
    getWallItemById(itemId: number): FurnitureItem | null
    {
        for(const groupItem of this._furniModel.furniData)
        {
            const item = groupItem.getItem(itemId);

            if(item && item.isWallItem) return item;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::requestSelectedFurniToMover()
    // Posters carry their placement payload as the stuff data's legacy string and pass no stuff
    // data object; everything else passes its own `extra` plus the stuff data.
    requestSelectedFurniToMover(item: FurnitureItem): boolean
    {
        if(!this._roomEngine) return false;

        const category = item.isWallItem
            ? RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL
            : RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE;

        if(item.category === FurnitureCategory.POSTER)
        {
            return this._roomEngine.initializeRoomObjectInsert(
                'inventory', item.id, category, item.type, item.stuffData?.getLegacyString() ?? ''
            );
        }

        return this._roomEngine.initializeRoomObjectInsert(
            'inventory', item.id, category, item.type, item.extra.toString(), item.stuffData
        );
    }

    private _badgesModel!: BadgesModel;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get badgesModel()
    get badgesModel(): IBadgesModel
    {
        return this._badgesModel;
    }

    // Lazily created in init(); null before the inventory is initialized, so the
    // avatar bubble / effects widget can query effects before the user has ever
    // opened their inventory. AS3 guards `effectsModel == null` everywhere.
    private _effectsModel: EffectsModel | null = null;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get effectsModel()
    get effectsModel(): IEffectsModel | null
    {
        return this._effectsModel;
    }

    private _petsModel!: PetsModel;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get petsModel()
    get petsModel(): IPetsModel
    {
        return this._petsModel;
    }

    private _botsModel!: BotsModel;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get botsModel()
    get botsModel(): IBotsModel
    {
        return this._botsModel;
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_avatarRenderer
    private _avatarRenderer: IAvatarRenderManager | null = null;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get avatarRenderer()
    get avatarRenderer(): IAvatarRenderManager | null
    {
        return this._avatarRenderer;
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get botsMax()
    get botsMax(): number
    {
        return this.getInteger('inventory.bots.max', 150);
    }

    private _tradingModel!: TradingModel;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_marketplaceModel
    private _marketplaceModel: MarketplaceModel | null = null;

    /**
     * The *selling* half of the marketplace. Not to be confused with the catalog's
     * `MarketPlaceLogic`, which browses and buys — AS3 keeps them in separate packages and this is
     * the one `FurniModel.requestSelectedFurniSelling()` reaches for.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get marketplaceModel()
    get marketplaceModel(): MarketplaceModel | null
    {
        return this._marketplaceModel;
    }

    /**
     * AS3 declares this `TradingModel`, not `ITradingModel` — the interface is the *view's* narrow
     * four-member contract, and every model-side caller (CollectiblesModel, FurniModel) needs the
     * concrete class. The port had narrowed it, which is what left `requestAddNftsToTrading()`,
     * `running` and `ownUserNftItems` unreachable from the collectibles model.
     */
    /**
     * AS3 reads this as `getModel("trading")`, and `getModel()` is what runs the lazy `init()` —
     * so in Flash the model exists the first time anything asks for it. The port returned the raw
     * field, which is `undefined` until the player has opened the inventory at least once: every
     * caller took its `?.` and did nothing, silently. That is why "Trade" in the avatar menu did
     * nothing at all on a fresh session, and why the server's refusal popped no alert.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get tradingModel()
    get tradingModel(): TradingModel
    {
        if(!this._isInitialized) this.init();

        return this._tradingModel;
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_inventories (the "collectibles" entry)
    private _collectiblesModel: CollectiblesModel | null = null;

    /**
     * AS3 resolves this through `getModel("collectibles")` and casts, returning null once disposed.
     * Kept the same way as `recyclerModel` below.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get collectiblesModel()
    get collectiblesModel(): ICollectiblesModel | null
    {
        return this.disposed ? null : (this.getModel('collectibles') as ICollectiblesModel | null);
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::_inventories (the "recycler" entry)
    private _recyclerModel: RecyclerModel | null = null;

    /**
     * AS3 resolves this through `getModel("recycler")` and casts, returning null once disposed.
     * The disposed check is kept because callers test `recyclerModel?.running` during teardown.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get recyclerModel()
    get recyclerModel(): IRecyclerModel | null
    {
        return this.disposed ? null : (this.getModel('recycler') as IRecyclerModel | null);
    }

    /**
     * Sends the selected stack's top item to the catalog's recycler.
     *
     * `placeObjectAtSlot(-1, ...)` with `findNewSlotId` set is how AS3 says "any free slot"; the
     * category is the room-object category, 20 for a wall item and 10 for a floor one, the same
     * pair `requestSelectedFurniToMover()` uses.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::recycleSelectedFurni()
    recycleSelectedFurni(): void
    {
        const recycler = this.catalog?.getRecycler() ?? null;

        if(recycler == null) return;

        const groupItem = this._furniModel?.getSelectedItem() ?? null;

        if(groupItem == null) return;

        const item = groupItem.peek();

        if(item == null) return;

        const category = item.isWallItem ? 20 : 10;

        recycler.placeObjectAtSlot(-1, item.id, category, item.type, String(item.extra), true);
    }

    /**
     * Opening and closing the furnimatic. The catalog calls this when its recycler page is shown or
     * left; everything downstream — the recycle badges, the locks, the grid's main button — follows
     * from the flag this sets.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::setupRecycler()
    setupRecycler(enabled: boolean): void
    {
        if(this._recyclerModel == null) return;

        if(enabled) this._recyclerModel.startRecycler();
        else this._recyclerModel.stopRecycler();
    }

    /**
     * The catalog's route into the grid: hand me one recyclable copy of whatever is selected.
     * Returns 0 when there is nothing to give, which is what `RecyclerLogic` tests.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::requestSelectedFurniToRecycler()
    requestSelectedFurniToRecycler(): number
    {
        return this._recyclerModel?.lockSelectedFurni() ?? 0;
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::returnInventoryFurniFromRecycler()
    returnInventoryFurniFromRecycler(itemId: number): boolean
    {
        return this._recyclerModel?.releaseFurni(itemId) ?? false;
    }

    private _purse: Purse = new Purse();

    get purse(): IPurse
    {
        return this._purse;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubLevel()
    get clubLevel(): number
    {
        if(this._purse.clubDays === 0 && this._purse.clubPeriods === 0)
        {
            return 0;
        }

        if(this._purse.isVIP)
        {
            return 2;
        }

        return 1;
    }

    private _unseenItemTracker: UnseenItemTracker | null = null;

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::get unseenItemTracker()
    get unseenItemTracker(): UnseenItemTracker
    {
        return this._unseenItemTracker!;
    }

    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communication = manager;
                },
                true
            ),
            // TS-only: Vortex-only fishing system. **Optional (`false`)** on purpose — a build
            //   without it must still open its inventory, so the tab is simply absent rather than
            //   the whole component locking on a dependency nothing provides.
            //   See docs/vortex-original/fishing.md 2.6.
            new ComponentDependency(
                IID_HabboFishing,
                (fishing: HabboFishing | null) =>
                {
                    this._fishing = fishing;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                },
                true
            ),
            // Required, as AS3 declares it — it omits the third argument here and
            // passes an explicit `false` for IIDHabboFriendList further down, so the
            // distinction is deliberate. init() hands this straight to FurniModel as
            // `this._catalog!`, so optional meant the model could be built around a
            // null catalog.
            new ComponentDependency(
                IID_HabboCatalog,
                (catalog: IHabboCatalog | null) =>
                {
                    this._catalog = catalog;
                },
                true
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (roomEngine: IRoomEngine | null) =>
                {
                    this._roomEngine = roomEngine;
                },
                true
            ),
            // AS3: HabboInventory.as:158 — IIDAvatarRenderManager, declared there with no third
            // argument (required). Kept OPTIONAL here, the same way HabboCatalog declares it: a hard
            // dependency locks the whole component if nothing provides the IID, and the only reader
            // is the bots grid, which renders nothing rather than blocking the inventory.
            new ComponentDependency(
                IID_AvatarRenderManager,
                (manager: IAvatarRenderManager | null) =>
                {
                    this._avatarRenderer = manager;
                },
                false
            ),
            // Required, as AS3 declares it (no third argument). VortexMain attaches
            // SessionDataManager before HabboInventory, so this neither delays init
            // nor risks a deadlock. getFurnitureData() still null-guards it, matching
            // AS3's own defensive guard.
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) =>
                {
                    this._sessionDataManager = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    // sessionEvents is a dedicated EventEmitter (not Component.events - see
                    // RoomSessionManager.ts), so it can't use ComponentDependency's built-in
                    // eventListeners param (that subscribes to .events). Subscribe/unsubscribe
                    // manually, matching the IID_HabboToolbar dependency below.
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this.onRoomSessionEvent);
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this.onRoomSessionEvent);
                    this._roomSessionManager?.sessionEvents.off(RoomSessionPropertyUpdateEvent.RSDUE_ALLOW_PETS, this.onRoomSessionEvent);

                    this._roomSessionManager = manager;

                    manager?.sessionEvents.on(RoomSessionEvent.RSE_STARTED, this.onRoomSessionEvent);
                    manager?.sessionEvents.on(RoomSessionEvent.RSE_ENDED, this.onRoomSessionEvent);
                    manager?.sessionEvents.on(RoomSessionPropertyUpdateEvent.RSDUE_ALLOW_PETS, this.onRoomSessionEvent);
                },
                false
            ),
            // Required, as AS3 declares it — same reasoning as IID_HabboCatalog above.
            // init() passes this to FurniModel as `this._localization!`, and every
            // furniture name in the inventory is read back through it.
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (localization: IHabboLocalizationManager | null) =>
                {
                    this._localization = localization;
                },
                true
            ),
            // AS3: HabboInventory.as:179 — IIDHabboSoundManager, declared with no third
            // argument, i.e. required. VortexMain attaches it, so it cannot deadlock. The trade
            // window's tooltip is what reads it, to name a Trax disc.
            new ComponentDependency(
                IID_HabboSoundManager,
                (soundManager: IHabboSoundManager | null) =>
                {
                    this._soundManager = soundManager;
                },
                true
            ),
            // AS3: HabboInventory.as:164 — IIDHabboFriendList, declared *optional* there (its
            // third argument is false). The trade's name-scam check is the only reader: without it
            // the friend half of the comparison is simply empty.
            new ComponentDependency(
                IID_HabboFriendList,
                (friendList: IHabboFriendList | null) =>
                {
                    this._friendList = friendList;
                },
                false
            ),
            // AS3 declares IIDHabboNotifications as a *required* dependency (HabboInventory.as:161)
            // and hands it to both trading models. VortexMain attaches it, so requiring it here
            // cannot deadlock the component.
            new ComponentDependency(
                IID_HabboNotifications,
                (notifications: IHabboNotifications | null) =>
                {
                    this._notifications = notifications;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) =>
                {
                    // toolbarEvents is a dedicated EventEmitter (not Component.events —
                    // see HabboToolbar.ts), so it can't use ComponentDependency's
                    // built-in eventListeners param (that subscribes to .events).
                    // Subscribe/unsubscribe manually, matching HabboNewNavigator.ts.
                    if(this._toolbar)
                    {
                        this._toolbar.toolbarEvents.off(HabboToolbarEvent.TOOLBAR_CLICK, this.onHabboToolbarEvent);
                    }

                    this._toolbar = toolbar;

                    if(toolbar)
                    {
                        toolbar.toolbarEvents.on(HabboToolbarEvent.TOOLBAR_CLICK, this.onHabboToolbarEvent);
                    }
                },
                false
            ),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::habboToolbarEventHandler()
    private onHabboToolbarEvent = (event: HabboToolbarEvent): void =>
    {
        this._view?.onHabboToolbarEvent(event);
    };

    /**
     * AS3 also stores the session itself here (`_SafeStr_5616`); this port recomputes `roomSession`
     * from `roomSessionManager.getSession()` on every access, so there is nothing to keep.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::roomSessionEventHandler()
    private onRoomSessionEvent = (event: RoomSessionEvent): void =>
    {
        // AS3 gates on isInitialized (_SafeStr_4755), not isVisible: on RSE_STARTED it
        // refreshes the furni view whether or not the panel is open, so it is current
        // the moment it is shown. Gating on isVisible skipped that refresh while the
        // inventory was closed.
        if(!this.isInitialized) return;

        switch(event.type)
        {
            case RoomSessionEvent.RSE_STARTED:
                this._petsModel?.updatePetsAllowed();
                // Re-evaluates the "place in room"/rent/use action buttons against the now-current
                // session; without it nothing re-runs updateActionButtons() after a mid-entry open.
                this._furniModel?.updateView();
                break;

            case RoomSessionEvent.RSE_ENDED:
                this.deselectAllEffects();
                break;

            case RoomSessionPropertyUpdateEvent.RSDUE_ALLOW_PETS:
                this._petsModel?.updatePetsAllowed();
                break;
        }
    };

    override dispose(): void
    {
        if(this.disposed) return;

        this._toolbar?.toolbarEvents.off(HabboToolbarEvent.TOOLBAR_CLICK, this.onHabboToolbarEvent);
        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this.onRoomSessionEvent);
        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this.onRoomSessionEvent);
        this._roomSessionManager?.sessionEvents.off(RoomSessionPropertyUpdateEvent.RSDUE_ALLOW_PETS, this.onRoomSessionEvent);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::dispose()
        if(this._purseTimer !== null)
        {
            clearInterval(this._purseTimer);
            this._purseTimer = null;
        }

        for(const event of this._furniMessageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        for(const event of this._effectMessageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        for(const event of this._badgeMessageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        for(const event of this._clubMessageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        for(const event of this._roomMessageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        for(const event of this._marketplaceMessageEvents)
        {
            this._communication?.removeMessageEvent(event);
        }

        this._furniMessageEvents = [];
        this._effectMessageEvents = [];
        this._badgeMessageEvents = [];
        this._clubMessageEvents = [];
        this._roomMessageEvents = [];
        this._marketplaceMessageEvents = [];
        this._furniModel?.dispose();
        this._badgesModel?.dispose();
        this._effectsModel?.dispose();
        this._petsModel?.dispose();
        for(const event of this._botMessageEvents) this._communication?.removeMessageEvent(event);

        this._botMessageEvents.length = 0;
        this._botsModel?.dispose();
        this._tradingModel?.dispose();
        this._unseenItemTracker?.dispose();
        this._view?.dispose();

        this._initializedCategories.clear();

        log.debug('Inventory disposed');
        super.dispose();
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::init()
    init(): void
    {
        if(this._isInitialized) return;

        this._furniModel = new FurniModel(
            this,
            this._windowManager!,
            this._roomEngine!,
            this._communication!,
            this._catalog!,
            this._localization!,
            this._soundManager
        );
        // AS3's BadgesModel reads `inventory.getBoolean("badge_rarity.uncommon")` off the
        // component it is given; this port hands it the lookup instead of the component.
        this._badgesModel = new BadgesModel(
            this,
            this._communication?.connection ?? null,
            () => this.getBoolean('badge_rarity.uncommon')
        );
        this._effectsModel = new EffectsModel(this._communication?.connection ?? null);
        this._petsModel = new PetsModel(
            this,
            this._windowManager!,
            this._communication!,
            this._roomEngine!,
            this._localization!
        );
        // AS3: HabboInventory.as:505 — `new BotsModel(this, _windowManager, _communication, assets,
        // _roomEngine, _catalog, _avatarRenderer)`. Assets and the catalog are left out: the port's
        // view builds its thumbnail through the window manager, and BotsModel never reads `_catalog`
        // in AS3 either (it stores it and only disposes it).
        this._botsModel = new BotsModel(
            this,
            this._windowManager!,
            this._communication!,
            this._roomEngine!,
            this._avatarRenderer
        );
        // AS3: HabboInventory.as:497 — `new TradingModel(this, _windowManager, _communication,
        // assets, _roomEngine, _localization, _soundManager, _notifications)`. The four the view
        // needs (window manager, assets, room engine, sound manager) are left out until
        // TradingView is ported; the model documents that at its constructor.
        this._tradingModel = new TradingModel(
            this,
            this._windowManager,
            this._communication,
            this.assets,
            this._localization,
            this._soundManager,
            this._notifications
        );

        // AS3: HabboInventory.as:482-506 — each model is added to `_inventories` as it is built.
        // `rentables` is only a second entry for the furni model when rent furni is NOT merged,
        // which is AS3's own condition and false here.
        this._inventories.add('furni', this._furniModel);

        if(!this.mergeRentFurni)
        {
            this._inventories.add('rentables', this._furniModel);
        }

        // AS3: HabboInventory.as — `new MarketplaceModel(this, _windowManager, _communication,
        // assets, _roomEngine, _localization)`.
        if(this._windowManager != null && this._communication != null && this._roomEngine != null && this._localization != null)
        {
            this._marketplaceModel = new MarketplaceModel(
                this,
                this._windowManager,
                this._communication,
                this.assets,
                this._roomEngine,
                this._localization
            );
        }

        // AS3: HabboInventory.as:491 — `new CollectiblesModel(this, _windowManager, _communication,
        // assets, _roomEngine, _catalog, _avatarRenderer)`. The last four are stored and never read
        // there; the model documents that at its constructor.
        this._collectiblesModel = new CollectiblesModel(this, this._windowManager, this._communication);

        // AS3: HabboInventory.as:501 — `new RecyclerModel(this, _windowManager, _communication,
        // assets, _roomEngine, _localization)`. Five of those six are stored and never read; the
        // model documents that at its constructor.
        this._recyclerModel = new RecyclerModel(this);

        this._inventories.add('collectibles', this._collectiblesModel);
        this._inventories.add('trading', this._tradingModel);
        this._inventories.add('recycler', this._recyclerModel);
        this._inventories.add('pets', this._petsModel);
        this._inventories.add('bots', this._botsModel);
        // AS3 registers badges here too; it was left out while BadgesView was unported, which is
        // why the tab had no content at all.
        this._inventories.add('badges', this._badgesModel);
        // AS3 (HabboInventory.as:496) registers effects too, with a model whose view field it
        // never assigns — see EffectsModel._view. Registered here for the same reason: so the
        // tab exists and reports no window, rather than being absent from the map.
        this._inventories.add('effects', this._effectsModel);

        // The marketplace model was already being built above but never registered, so
        // `getCategoryWindowContainer('marketplace')` and `updateView('marketplace')` resolved to
        // nothing. AS3 adds it first, before furni.
        if(this._marketplaceModel != null)
        {
            this._inventories.add('marketplace', this._marketplaceModel);
        }

        this._isInitialized = true;
    }

    switchCategory(category: InventoryCategoryType): void
    {
        if(!this._isInitialized)
        {
            this.init();
        }

        this._currentCategory = category;

        // Handle furni/rentables special case
        if(category === 'furni' || category === 'rentables')
        {
            this._furniModel.categorySwitch(category);
        }
        else if(category === 'pets')
        {
            this._petsModel.categorySwitch(category);
        }
        else if(category === 'bots')
        {
            this._botsModel.categorySwitch(category);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getSubCategoryViewId()
    getSubCategoryViewId(): string | null
    {
        return this._view.getSubCategoryViewId();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::closeView()
    closeView(): void
    {
        if(this._view?.isVisible)
        {
            this._view.hideInventory();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::showView()
    showView(): void
    {
        this._view?.showInventory();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::preparingInventoryView()
    preparingInventoryView(): void
    {
        if(!this._isInitialized)
        {
            this.init();
        }
    }

    /**
     * AS3: .../HabboInventory.as::inventoryViewOpened()
     *
     * Every registered model is told, not just furni's. Each one decides for itself whether the
     * category is its own — which is the whole point of the callback, and why the collectibles tab
     * could never load until this looped: `CollectiblesModel.categorySwitch()` is what sends
     * RequestNftAssetsComposer.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::inventoryViewOpened()
    inventoryViewOpened(category: string): void
    {
        this._currentCategory = category as InventoryCategoryType;

        for(const model of this._inventories.getValues()) model.categorySwitch(category);
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::getLastActivatedEffect()
    getLastActivatedEffect(): number
    {
        return this._effectsModel?.lastActivatedEffect ?? -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::closingInventoryView()
    closingInventoryView(): void
    {
        for(const model of this._inventories.getValues()) model.closingInventoryView();

        this.events.emit(HabboInventoryTrackingEvent.CLOSED);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::toggleInventoryPage()
    // AS3 sets _currentCategory unconditionally here, before the toggle even runs - not only on
    // the `opened` branch below (inventoryViewOpened() also sets it, but only reaches that when
    // the toggle actually opens the view).
    toggleInventoryPage(category: string, itemId: string | null = null, forceSwitch: boolean = false): void
    {
        this._currentCategory = category as InventoryCategoryType;

        const opened = this._view.toggleCategoryView(category, false, forceSwitch);

        if(opened)
        {
            this.inventoryViewOpened(category);

            if(itemId !== null && category === 'furni')
            {
                this._furniModel.selectItemById(itemId);
            }
        }
        else
        {
            this.events.emit(HabboInventoryTrackingEvent.CLOSED);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::toggleInventorySubPage()
    toggleInventorySubPage(category: string): void
    {
        // AS3 switches the furni category *before* the sub-category, and does it for
        // both "trading" and "wired_trading". The old body inverted the order and
        // missed wired_trading, so opening a wired-trade sub-page left the wrong
        // category showing.
        if(category === 'trading' || category === 'wired_trading')
        {
            this._view.toggleCategoryView('furni', false);
        }

        this._view.toggleSubCategoryView(category, false);

        // AS3 loops every registered model here, and so does this now. FurniModel is no longer the
        // only one with something to do: CollectiblesModel re-arms its once-per-trade asset request
        // on "trading" and drops every lock on "empty".
        for(const model of this._inventories.getValues()) model.subCategorySwitch(category);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::updateSubView()
    updateSubView(): void
    {
        this._view.updateSubCategoryView();
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getItemImage()
     *
     * The big picture the hover tooltip shows — direction 180, scale 64, which is a different
     * request from the small grid icon `GroupItem` asks for.
     *
     * AS3 returns `ImageResult.data` directly and so does this: a miss returns null and the
     * tooltip shows no picture, exactly as AS3's `null` BitmapData would. The listener AS3 passes
     * is null too, so nothing is repainted when a late image arrives.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getItemImage()
    getItemImage(item: IFurnitureItem): ImageBitmap | null
    {
        if(!this._roomEngine) return null;

        const direction = new Vector3d(180, 0, 0);

        const result = !item.isWallItem
            ? this._roomEngine.getFurnitureImage(
                item.type,
                direction,
                64,
                null as unknown as IGetImageListener,
                0,
                String(item.extra),
                -1,
                -1,
                item.stuffData
            )
            : this._roomEngine.getWallItemImage(
                item.type,
                direction,
                64,
                null as unknown as IGetImageListener,
                0,
                item.stuffData?.getLegacyString() ?? ''
            );

        return result?.data ?? null;
    }

    /**
     * Every non-rented inventory id of one furni type, for the collectibles mint tab.
     *
     * AS3's first line looks up `_inventories.getValue(category)` and types it as a `FurniModel` —
     * and then never uses it, reading `furniModel` directly instead. So the lookup is purely a
     * guard on the category name existing, and passing anything but "furni" returns null. Kept,
     * because the mint tab passes "furni" and tests the null.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getNonRentedInventoryIds()
    getNonRentedInventoryIds(category: string, itemTypeId: number, isWallItem: boolean): number[] | null
    {
        if(this._inventories.getValue(category) === null) return null;

        const groupItem = this._furniModel?.getGroupItemByItemTypeId(itemTypeId, isWallItem) ?? null;

        if(groupItem === null) return null;

        return groupItem.getNonRentedFurnitureIds();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::placePetToRoom()
    placePetToRoom(id: number, skipServer: boolean = false): boolean
    {
        return this._petsModel?.placePetToRoom(id, skipServer) ?? false;
    }

    /** Both of these redraw the tab badges after clearing, which is the point of going through here. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::removeUnseenFurniCounter()
    removeUnseenFurniCounter(itemId: number): boolean
    {
        const removed = this._furniModel?.removeUnseenFurniCounter(itemId) ?? false;

        if(removed) this.updateUnseenItemCounts();

        return removed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::removeUnseenPetCounter()
    removeUnseenPetCounter(itemId: number): boolean
    {
        const removed = this._petsModel?.removeUnseenFurniCounter(itemId) ?? false;

        if(removed) this.updateUnseenItemCounts();

        return removed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::updateUnseenItemCounts()
    updateUnseenItemCounts(): void
    {
        if(!this._unseenItemTracker) return;

        this._view.updateUnseenFurniCount(this._unseenItemTracker.getCount(1));
        this._view.updateUnseenRentedFurniCount(this._unseenItemTracker.getCount(2));
        this._view.updateUnseenPetsCount(this._unseenItemTracker.getCount(3));
        this._view.updateUnseenBadgeCount(this._unseenItemTracker.getCount(4));
        this._view.updateUnseenBotCount(this._unseenItemTracker.getCount(5));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getCategoryWindowContainer()
    // A category with no registered model has no content — AS3 returns null too, and
    // InventoryMainView already guards for it.
    getCategoryWindowContainer(category: string): IWindowContainer | null
    {
        return this._inventories.getValue(category)?.getWindowContainer() ?? null;
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getCategorySubWindowContainer()
     *
     * The same lookup as above — the *sub*-window is simply the model registered under a
     * sub-category name (`trading`, `wired_trading`). This returned null unconditionally before,
     * so the trade window had nowhere to be hosted even once it existed.
     */
    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::getCategorySubWindowContainer()
    getCategorySubWindowContainer(category: string): IWindowContainer | null
    {
        return this._inventories.getValue(category)?.getWindowContainer() ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::updateView()
    updateView(category: string): void
    {
        this._inventories.getValue(category)?.updateView();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::isInventoryCategoryInit()
    isInventoryCategoryInit(category: string): boolean
    {
        return this._initializedCategories.has(category);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::setInventoryCategoryInit()
    setInventoryCategoryInit(category: string, init: boolean = true): boolean
    {
        if(init)
        {
            if(!this._initializedCategories.has(category))
            {
                this._initializedCategories.add(category);

                return true;
            }
        }
        else
        {
            this._initializedCategories.delete(category);

            if(this._view?.isVisible && category !== 'rentables')
            {
                this.requestInventoryCategoryInit(category);
            }
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::checkCategoryInitilization()
    checkCategoryInitilization(category: string): boolean
    {
        if(this.isInventoryCategoryInit(category))
        {
            return true;
        }

        this.requestInventoryCategoryInit(category);

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::requestInventoryCategoryInit()
    requestInventoryCategoryInit(category: string): void
    {
        switch(category)
        {
            case 'furni':
            case 'rentables':
                this.requestFurni();
                break;
            case 'badges':
                this.requestBadges();
                break;
            case 'pets':
                this.requestPets();
                break;
            case 'bots':
                this.requestBots();
                break;
        }
    }

    // AS3: .../src/com/sulake/habbo/inventory/HabboInventory.as::setClubStatus()
    setClubStatus(
        periods: number,
        days: number,
        hasEverBeenMember: boolean,
        isVIP: boolean,
        isExpiring: boolean,
        citizenshipVipIsExpiring: boolean,
        minutesUntilExpiration: number,
        minutesSinceLastModified: number
    ): void
    {
        this._purse.clubPeriods = periods;
        this._purse.clubDays = days;
        this._purse.clubHasEverBeenMember = hasEverBeenMember;
        this._purse.isVIP = isVIP;
        this._purse.clubIsExpiring = isExpiring;
        this._purse.citizenshipVipIsExpiring = citizenshipVipIsExpiring;
        this._purse.minutesUntilExpiration = minutesUntilExpiration;
        this._purse.minutesSinceLastModified = minutesSinceLastModified;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::setClubStatus()
        // Keeps the HC status fresh while it's genuinely about to expire, by resending the
        // same "habbo_club" info request every minute; stops (and is torn down) once it isn't.
        if(minutesUntilExpiration > 0 && minutesUntilExpiration < 86400000)
        {
            if(this._purseTimer === null)
            {
                this._purseTimer = setInterval(() => this.onPurseTimer(), 60000);
            }
        }
        else if(this._purseTimer !== null)
        {
            clearInterval(this._purseTimer);
            this._purseTimer = null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::onPurseTimer()
    private onPurseTimer(): void
    {
        this._communication?.connection?.send(new ScrGetUserInfoMessageComposer('habbo_club'));
    }

    requestFurni(): void
    {
        this._communication?.connection?.send(new RequestFurniInventoryComposer());
    }

    requestBadges(): void
    {
        this._communication?.connection?.send(new GetBadgesComposer());
    }

    requestPets(): void
    {
        this._communication?.connection?.send(new GetPetInventoryComposer());
    }

    requestBots(): void
    {
        this._communication?.connection?.send(new GetBotInventoryComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::initComponent()
    // AS3 creates `view` (var_18 = new InventoryMainView(...)) unconditionally
    // here, separately from the lazily-created models (init()) — the view must
    // exist before any toolbar click can reach it.
    protected override initComponent(): void
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::initComponent()
        if(isRoomViewerMode(this.flags))
        {
            return;
        }

        // AS3 registers the tracker here, before building the unseen tracker and the view
        // (HabboInventory.as:200).
        this.context.addLinkEventTracker(this);

        this._unseenItemTracker = new UnseenItemTracker(this._communication!, this.events, this);
        this._view = new InventoryMainView(this);

        // AS3: HabboInventory.as::initComponent() sends these five, in this order. The port used
        // to send only the two middle ones and reach 540 through `requestFurni()` and habbo_club
        // through `onPurseTimer()` — but AS3 has those same lazy paths *as well*, so the boot
        // sends were a gap and not a duplicate: the purse showed no credit balance until the first
        // inventory open, and the levelled-badge point limits were never asked for at all.
        this._communication?.connection?.send(new GetCreditsInfoComposer());
        this._communication?.connection?.send(new GetNftCreditsMessageComposer());
        this._communication?.connection?.send(new GetSilverMessageComposer());
        this._communication?.connection?.send(new ScrGetUserInfoMessageComposer('habbo_club'));
        this._communication?.connection?.send(new GetBadgePointLimitsComposer());

        this.registerFurniMessageEvents();
        this.registerPetMessageEvents();
        this.registerBotMessageEvents();
        this.registerEffectMessageEvents();
        this.registerBadgeMessageEvents();
        this.registerTradingMessageEvents();
        this.registerClubMessageEvents();
        this.registerRoomMessageEvents();
        this.registerMarketplaceMessageEvents();
        log.debug('Inventory initialized');
    }

    /**
	 * Resolves the furniture data for a class id and type ("s" floor / "i" wall).
	 *
	 * GroupItem.furniData calls this to recover an item's className, which every
	 * NFT check and the furni-line lookups depend on. It null-guards the session
	 * data manager exactly as AS3 does, so a call before that manager is injected
	 * returns null rather than throwing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getFurnitureData()
    public getFurnitureData(classId: number, type: string): IFurnitureData | null
    {
        if(this._sessionDataManager === null)
        {
            return null;
        }

        if(type === 's')
        {
            return this._sessionDataManager.getFloorItemData(classId);
        }

        if(type === 'i')
        {
            return this._sessionDataManager.getWallItemData(classId);
        }

        return null;
    }

    /**
	 * The same lookup as getFurnitureData(), keyed by the item's type name instead of its class id
	 *
	 * AS3 takes an unused third argument; it is dropped here rather than carried.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getFurnitureDataByName()
    public getFurnitureDataByName(name: string, type: string): IFurnitureData | null
    {
        if(this._sessionDataManager === null) return null;

        if(type === 's') return this._sessionDataManager.getFloorItemDataByName(name);

        if(type === 'i') return this._sessionDataManager.getWallItemDataByName(name);

        return null;
    }

    /**
	 * Every badge the player owns, minus the ones already passed in
	 *
	 * The exclusion list is how a caller asks for "badges I could still equip" without filtering
	 * afterwards. Requesting the badge list on a cold cache is part of the call: the first caller
	 * gets an empty answer and the fetch it triggers, rather than nothing at all.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::getAllMyBadgeIds()
    public getAllMyBadgeIds(exclude: string[] | null): string[]
    {
        const badges = this._badgesModel.getBadges();

        if(badges.length === 0 && !this._badgeInitializationRequested)
        {
            this._badgesModel.requestInitialization();
            this._badgeInitializationRequested = true;
        }

        const ids: string[] = [];

        for(const badge of badges)
        {
            if(exclude === null || exclude.indexOf(badge.badgeId) === -1) ids.push(badge.badgeId);
        }

        return ids;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::_SafeStr_9885 (name derived: guards the one-shot request in getAllMyBadgeIds())
    private _badgeInitializationRequested: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get clubMinutesUntilExpiration()
    get clubMinutesUntilExpiration(): number
    {
        return this._purse.minutesUntilExpiration;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get currentCategoryId()
    get currentCategoryId(): string | null
    {
        return this._currentCategory;
    }

    /**
	 * Whether the inventory window has been built yet
	 *
	 * The view object exists from construction; its main container does not until the layout is
	 * built, which is what callers are really asking about.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get isMainViewInitialized()
    get isMainViewInitialized(): boolean
    {
        return this._view.mainContainer !== null;
    }

    /**
	 * Selects the furniture page without showing the inventory
	 *
	 * Used before opening something that wants the furni tab already current — the toggle would
	 * otherwise leave the window visible, so AS3 hides it again immediately.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::initializeFurniturePage()
    initializeFurniturePage(): void
    {
        this.toggleInventoryPage('furni');
        this._view.hideInventory();
    }

    /**
	 * Opens a trade with another user in the room
	 */
    // AS3 opens with `if(!isInitialized) init();` — the trade is usually the first thing that ever
    // asks for a model, so without it the click reached a model that did not exist yet.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::setupTrading()
    setupTrading(userId: number): void
    {
        this.tradingModel.requestOpenTrading(userId);
    }

    // --- ILinkEventTracker ---

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::get linkPattern()
    public get linkPattern(): string
    {
        return 'inventory/';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::linkReceived()
    public linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2)
        {
            return;
        }

        if(parts[1] !== 'open')
        {
            log.warn(`Inventory unknown link-type received: ${parts[1]}`);
        }
        else if(parts.length === 2)
        {
            this.toggleInventoryPage('furni');
        }
        else if(parts.length === 3)
        {
            this.toggleInventoryPage(parts[2]);
        }
        else if(parts.length === 4)
        {
            this.toggleInventoryPage(parts[2], parts[3]);
        }
    }

    // TS-only: AS3's message routing happens elsewhere in the engine and simply
    // calls FurniModel.insertFurniture()/etc directly; this port wires the
    // incoming messages here since HabboInventory owns the FurniModel lifecycle.
    private registerFurniMessageEvents(): void
    {
        if(!this._communication) return;

        this._furniMessageEvents.push(
            this._communication.addMessageEvent(new FurniListMessageEvent(this.onFurniList)),
            this._communication.addMessageEvent(new FurniListAddOrUpdateMessageEvent(this.onFurniListAddOrUpdate)),
            this._communication.addMessageEvent(new FurniListRemoveMessageEvent(this.onFurniListRemove)),
            this._communication.addMessageEvent(new FurniListRemoveMultipleMessageEvent(this.onFurniListRemoveMultiple)),
            this._communication.addMessageEvent(new FurniListInvalidateMessageEvent(this.onFurniListInvalidate)),
            this._communication.addMessageEvent(new PostItPlacedMessageEvent(this.onPostItPlaced)),
            // AS3 registers these on its own inventory message handler (`_SafeCls_1951`), which
            // this port folds into HabboInventory. Both replies belong to the *selling* flow: the
            // first decides whether the offer dialog may open at all, the second reports the
            // listing's outcome.
            this._communication.addMessageEvent(new MarketplaceCanMakeOfferResultEvent(this.onMarketplaceCanMakeOfferResult)),
            this._communication.addMessageEvent(new MarketplaceMakeOfferResultEvent(this.onMarketplaceMakeOfferResult))
        );
    }

    // AS3: .../src/com/sulake/habbo/inventory/_SafeCls_1951.as::onMarketplaceCanMakeOfferResult()
    private onMarketplaceCanMakeOfferResult = (event: IMessageEvent): void =>
    {
        const parser = event.parser as MarketplaceCanMakeOfferResultParser | null;

        if(parser == null) return;

        this._marketplaceModel?.proceedOfferMaking(parser.resultCode, parser.tokenCount);
    };

    // AS3: .../src/com/sulake/habbo/inventory/_SafeCls_1951.as::onMarketplaceMakeOfferResult()
    private onMarketplaceMakeOfferResult = (event: IMessageEvent): void =>
    {
        const parser = event.parser as MarketplaceMakeOfferResultParser | null;

        if(parser == null) return;

        this._marketplaceModel?.endOfferMaking(parser.result);
    };

    // AS3: HabboInventory.as::registerMessageEvents() — the pet-inventory branch. Without this the
    // PetInventory response (header 1200) reached the registry but nothing consumed it, so the pets
    // tab stayed empty even though requestPets() sent GetPetInventoryComposer.
    private registerPetMessageEvents(): void
    {
        if(!this._communication) return;

        this._petMessageEvents.push(
            this._communication.addMessageEvent(new PetInventoryMessageEvent(this.onPetInventory)),
            this._communication.addMessageEvent(new PetAddedToInventoryEvent(this.onPetAdded)),
            this._communication.addMessageEvent(new PetRemovedFromInventoryEvent(this.onPetRemoved)),
            this._communication.addMessageEvent(new GoToBreedingNestFailureEvent(this.onGoToBreedingNestFailure))
        );
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as:168/193/205
     * — the bot branch of the same block. `BotsModel` was built and `BotInventory` was registered
     * in the header table, but nothing subscribed, so the reply was parsed and dropped and the bots
     * tab stayed empty however many times it was opened.
     */
    private registerBotMessageEvents(): void
    {
        if(!this._communication) return;

        this._botMessageEvents.push(
            this._communication.addMessageEvent(new BotInventoryMessageEvent(this.onBotInventory)),
            this._communication.addMessageEvent(new BotAddedToInventoryMessageEvent(this.onBotAdded)),
            this._communication.addMessageEvent(new BotRemovedFromInventoryMessageEvent(this.onBotRemoved))
        );
    }

    // AS3: .../_SafeCls_1951.as::onBots()
    private onBotInventory = (event: IMessageEvent): void =>
    {
        const parser = event.parser as BotInventoryMessageParser | null;

        if(!parser || !this._botsModel) return;

        this._botsModel.updateItems(parser.items);
        this.setInventoryCategoryInit('bots');
        this._botsModel.setListInitialized();
    };

    /**
     * AS3: .../_SafeCls_1951.as::onBotAdded()
     *
     * AS3 drops the bot silently once the hand is full (`items.length >= botsMax`) — the server has
     * already granted it, so the cap only governs what the grid shows until the next full request.
     *
     * The parser's `openInventory` flag is what the emulator sets on a purchase and clears on a bot
     * coming back out of a room; AS3 ignores it here, so this does too — the catalog's own
     * post-purchase flow is what opens the inventory.
     */
    // AS3: .../src/com/sulake/habbo/inventory/_SafeCls_1951.as::onBotAdded()
    private onBotAdded = (event: IMessageEvent): void =>
    {
        const parser = event.parser as BotAddedToInventoryMessageParser | null;

        if(!parser || !this._botsModel || !parser.item) return;

        if(this._botsModel.items.size >= this.botsMax) return;

        this._botsModel.addItem(parser.item);
    };

    // AS3: .../_SafeCls_1951.as::onBotRemoved()
    private onBotRemoved = (event: IMessageEvent): void =>
    {
        const parser = event.parser as BotRemovedFromInventoryMessageParser | null;

        if(!parser || !this._botsModel) return;

        this._botsModel.removeItem(parser.itemId);
    };

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as
     * — the trading branch of the same block. All ten answers were registered in the header table
     * and **subscribed by nobody**, so a trade opened by the other side reached the client, was
     * parsed, and vanished.
     *
     * Eight of them are pure delegation to `TradingModel.handleMessageEvent()`, exactly as in AS3;
     * the open and the item list are unpacked here first, because they need the session's own
     * user id, the room's user data and the furni model to build their group items.
     *
     * The same block also registers `onTradeNfts` (the header for the NFT half is 850, not the
     * 2159 an old note carried). AS3 registers the four wired-trading answers here too; the RPG
     * fork removed wired trading.
     */
    private registerTradingMessageEvents(): void
    {
        if(!this._communication) return;

        this._tradingMessageEvents.push(
            this._communication.addMessageEvent(new TradingOpenMessageEvent(this.onTradingOpen)),
            this._communication.addMessageEvent(new TradeOpenFailedEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradingCloseMessageEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradingCompletedMessageEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradingAcceptMessageEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradingConfirmationMessageEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradingNotOpenMessageEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradingOtherNotAllowedEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradingYouAreNotAllowedEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradeSilverSetMessageEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradeSilverFeeMessageEvent(this.onTradingMessage)),
            this._communication.addMessageEvent(new TradingItemListMessageEvent(this.onTradingItemList)),
            // AS3: .../_SafeCls_1951.as:166 and :204 — the collectibles pair. `onCollectibles` is
            // the tab's own inventory; `onTradeNfts` is the NFT half of an open trade, which is why
            // it sits in this trading block rather than beside the tab.
            this._communication.addMessageEvent(new NftAssetsMessageEvent(this.onCollectibles)),
            this._communication.addMessageEvent(new TradeNftAssetsMessageEvent(this.onTradeNfts))
        );
    }

    // AS3: .../src/com/sulake/habbo/inventory/_SafeCls_1951.as::onCollectibles()
    private onCollectibles = (event: IMessageEvent): void =>
    {
        const parser = event.parser as NftAssetsMessageParser | null;

        if(!parser || !this._collectiblesModel) return;

        const items = new OrderedMap<number, CollectibleAsset>();

        for(const asset of parser.items) items.add(asset.assetId, asset);

        this._collectiblesModel.initCollectibles(items);
    };

    // AS3: .../src/com/sulake/habbo/inventory/_SafeCls_1951.as::onTradeNfts()
    private onTradeNfts = (event: IMessageEvent): void =>
    {
        const parser = event.parser as TradeNftAssetsMessageParser | null;

        if(!parser || !this._collectiblesModel || !this._tradingModel) return;

        const ownItems = this.parseNftTradeMap(parser.myItems, this._collectiblesModel);
        const otherItems = this.parseNftTradeMap(parser.theirItems, this._collectiblesModel);

        this._tradingModel.updateNftItems(ownItems, otherItems, parser.myItems.length, parser.theirItems.length);
    };

    /**
     * AS3: .../_SafeCls_1951.as::parseNftTradeMap()
     *
     * Builds a *throwaway* set of grouped items for one side of the trade — these are not the
     * inventory tab's groups, they are fresh ones the trade window renders. Note the
     * `initializeImage()` on the first copy of each product only: the trade window shows every
     * offered item at once, so unlike the tab's grid it cannot spread the renders over a timer.
     */
    // AS3: .../src/com/sulake/habbo/inventory/_SafeCls_1951.as::parseNftTradeMap()
    private parseNftTradeMap(
        assets: CollectibleAsset[],
        model: CollectiblesModel
    ): OrderedMap<string, CollectibleGroupedItem>
    {
        const groups = new OrderedMap<string, CollectibleGroupedItem>();

        for(const asset of assets)
        {
            const key = asset.productCode;
            const existing = groups.getValue(key);

            if(existing === null)
            {
                const group = new CollectibleGroupedItem(asset, [asset.assetId], model);

                groups.add(key, group);
                group.initializeImage();
            }
            else
            {
                existing.addAssetId(asset.assetId);
            }
        }

        return groups;
    }

    // AS3: .../_SafeCls_1951.as::onTradingOpenFailed(), onTradingClose(), onTradingCompleted(),
    // onTradingAccepted(), onTradingConfirmation(), onTradingNotOpen(), onTradingOtherNotAllowed(),
    // onTradingYouAreNotAllowed(), onTradeSilverSet(), onTradeSilverFee()
    // Ten identical AS3 methods, each `tradingModel?.handleMessageEvent(event)`. One here.
    private onTradingMessage = (event: IMessageEvent): void =>
    {
        // Through the getter, as AS3's ten one-liners do (`_inventory.tradingModel`): a refusal
        // (TradeOpenFailed) can be the first trading message of the session, and on the raw field
        // it was dropped — which is what swallowed the "trading is disabled here" alert.
        this.tradingModel.handleMessageEvent(event);
    };

    /**
     * AS3: .../_SafeCls_1951.as::onTradingOpen()
     *
     * The message names its two sides in wire order, not "you and them": when the *second* id is
     * ours, AS3 swaps the pairs so `startTrading()` always receives our own side first. The last
     * argument records whether the swap happened, i.e. whether we opened the trade — the name-scam
     * check is the only thing that reads it.
     */
    private onTradingOpen = (event: IMessageEvent): void =>
    {
        // AS3's first guard is `if(!_inventory)` — the inventory component, which here is `this`.
        // The port tested `_tradingModel` instead and returned on the very case AS3 handles by
        // creating it: a trade opened by the *other* player, before this one ever opened their
        // inventory. Reading it through the getter below runs the lazy init AS3 relies on.
        const sessionData = this._sessionDataManager;
        const roomSession = this.roomSession;

        if(!sessionData)
        {
            ErrorReportStorage.addDebugData('IncomingEvent', 'Trading open - sessionData not available!');

            return;
        }

        if(!roomSession)
        {
            ErrorReportStorage.addDebugData('IncomingEvent', 'Trading open - roomSession not available!');

            return;
        }

        this.toggleInventorySubPage('trading');

        const parser = event.parser as TradingOpenMessageParser | null;

        if(!parser)
        {
            ErrorReportStorage.addDebugData('IncomingEvent', `event is of unknown type:${event}!`);

            return;
        }

        let userId = parser.userId;
        const ownUserData = roomSession.userDataManager.getUserData(userId);

        if(!ownUserData)
        {
            ErrorReportStorage.addDebugData('IncomingEvent', 'Trading open - failed to retrieve own user data!');

            return;
        }

        let userName = ownUserData.name;
        let userCanTrade = parser.userCanTrade;
        let otherUserId = parser.otherUserId;
        const otherUserData = roomSession.userDataManager.getUserData(otherUserId);

        if(!otherUserData)
        {
            ErrorReportStorage.addDebugData('IncomingEvent', 'Trading open - failed to retrieve other user data!');

            return;
        }

        let otherUserName = otherUserData.name;
        let otherUserCanTrade = parser.otherUserCanTrade;
        const selfInitiated = otherUserId === sessionData.userId;

        if(selfInitiated)
        {
            const swappedId = userId;
            const swappedName = userName;
            const swappedCanTrade = userCanTrade;

            userId = otherUserId;
            userName = otherUserName;
            userCanTrade = otherUserCanTrade;
            otherUserId = swappedId;
            otherUserName = swappedName;
            otherUserCanTrade = swappedCanTrade;
        }

        this.tradingModel.startTrading(
            userId,
            userName,
            userCanTrade,
            otherUserId,
            otherUserName,
            otherUserCanTrade,
            selfInitiated
        );
    };

    /**
     * AS3: .../_SafeCls_1951.as::onTradingItemList()
     *
     * The *second* user's staked credits get a tile of their own at the head of their offer, and
     * only when `trading.warning.enabled` is on: it is a scam warning, so it is shown for the
     * other side's credits and not for your own.
     */
    private onTradingItemList = (event: IMessageEvent): void =>
    {
        const parser = event.parser as TradingItemListMessageParser | null;

        if(!parser || !this._tradingModel) return;

        const furniModel = this._furniModel;

        if(!furniModel) return;

        const firstUserItems = new OrderedMap<string, GroupItem>();
        const secondUserItems = new OrderedMap<string, GroupItem>();
        const ownUserId = this._sessionDataManager?.userId ?? -1;

        if(this.getBoolean('trading.warning.enabled') && parser.secondUserNumCredits > 0)
        {
            secondUserItems.add('credit_groupitem_type_id', furniModel.createCreditGroupItem(parser.secondUserNumCredits));
        }

        this.populateItemGroups(parser.firstUserItemArray, firstUserItems, parser.firstUserId === ownUserId);
        this.populateItemGroups(parser.secondUserItemArray, secondUserItems, parser.secondUserId === ownUserId);

        this._tradingModel.updateItemGroupMaps(parser, firstUserItems, secondUserItems);
    };

    /**
     * AS3: .../_SafeCls_1951.as::populateItemGroups()
     *
     * The grouping key decides what stacks in the trade window: normally item type + type id, but
     * a poster keys on its legacy string and guild furni on its four colour values, and anything
     * non-groupable — or an external-image furni, whatever its flag says — keys on its own item id
     * so it never merges with another.
     *
     * AS3 takes an `isOwnUser` argument here and uses it for nothing at all; kept for the same
     * reason it kept `MAX_ITEMS_TO_TRADE`'s dead siblings — the signature is the source's.
     */
    // AS3: .../src/com/sulake/habbo/inventory/_SafeCls_1951.as::populateItemGroups()
    private populateItemGroups(
        items: TradingFurniItemParser[],
        target: OrderedMap<string, GroupItem>,
        _isOwnUser: boolean
    ): void
    {
        for(const item of items)
        {
            const typeId = item.itemTypeId;
            const category = item.category;
            let key = item.itemType + String(typeId);

            if(!item.isGroupable || this.isFurniExternalImage(item.itemTypeId))
            {
                key = 'itemid' + item.itemId;
            }

            if(category === FurnitureCategory.POSTER)
            {
                key = String(typeId) + 'poster' + (item.stuffData?.getLegacyString() ?? '');
            }
            else if(category === FurnitureCategory.GUILD_FURNI)
            {
                key = TradingModel.getGuildFurniType(typeId, item.stuffData);
            }

            const groupable = item.isGroupable && !this.isFurniExternalImage(item.itemTypeId);
            let groupItem = groupable ? target.getValue(key) : null;

            if(groupItem === null)
            {
                groupItem = this._furniModel.createGroupItem(typeId, category, item.stuffData, item.extra);
                target.add(key, groupItem);
            }

            groupItem.push(new FurnitureItem(item));
        }
    }

    // AS3: .../_SafeCls_1951.as::isFurniExternalImage()
    private isFurniExternalImage(typeId: number): boolean
    {
        const furnitureData = this.getFurnitureData(typeId, 'i');

        return furnitureData !== null && furnitureData.isExternalImageType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as:200
    // — the badge branch of the same registration block the furni/pet ones above come from.
    private registerBadgeMessageEvents(): void
    {
        if(!this._communication) return;

        this._badgeMessageEvents.push(
            this._communication.addMessageEvent(new BadgesMessageEvent(this.onBadges)),
            this._communication.addMessageEvent(new BadgeReceivedEvent(this.onBadgeReceived)),
            this._communication.addMessageEvent(new BadgePointLimitsMessageEvent(this.onBadgePointLimits)),
            this._communication.addMessageEvent(
                new HabboAchievementNotificationMessageEvent(this.onAchievementReceived)
            ),
            this._communication.addMessageEvent(new AchievementsScoreMessageEvent(this.onAchievementsScore)),
            this._communication.addMessageEvent(new FigureSetIdsMessageEvent(this.onFigureSetIds))
        );

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as:180 registers 1292 alongside the rest. It is the only thing that marks a
        // badge as worn: `onBadges` (3926) builds every badge inactive, so without this the
        // active grid stays empty however many badges the player wears.
        this._badgeMessageEvents.push(
            this._communication.addMessageEvent(new HabboUserBadgesMessageEvent(this.onUserBadges))
        );
    }

    /**
	 * The badges this user is wearing. Ignored for anyone but the local player, as AS3 does —
	 * the same message carries other users' badges for their profile.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onUserBadges()
    private onUserBadges = (event: IMessageEvent): void =>
    {
        const parser = event.parser as HabboUserBadgesMessageParser | null;

        if(!parser || !this._badgesModel) return;

        if(parser.userId !== this.sessionData?.userId) return;

        for(const badge of parser.selectedBadges)
        {
            this._badgesModel.updateBadge(
                badge.badgeCode,
                true,
                0,
                badge.ownerCount,
                badge.badgeRarityId,
                (id: string) => this._localization?.getBadgeName(id) ?? '',
                (id: string) => this._localization?.getBadgeDesc(id) ?? ''
            );
        }

        this._badgesModel.updateView();
    };

    /**
	 * An achievement completed. The badge it grants is recorded not-in-use — the player has it but
	 * is not wearing it — and the badge the new level replaces is dropped in the same breath.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onAchievementReceived()
    private onAchievementReceived = (event: IMessageEvent): void =>
    {
        const parser = event.parser as HabboAchievementNotificationMessageEventParser | null;
        const data = parser?.data ?? null;
        const model = this._badgesModel;

        if(!data || !model) return;

        model.updateBadge(
            data.badgeCode,
            false,
            data.badgeId,
            data.ownerCount,
            data.badgeRarityId,
            (id: string) => this._localization?.getBadgeName(id) ?? '',
            (id: string) => this._localization?.getBadgeDesc(id) ?? ''
        );
        model.removeBadge(data.removedBadgeCode);
        model.updateView();
    };

    /**
	 * The score is not stored — it is registered as a localization parameter, so
	 * `${achievements_score_description}` renders with the number already in it wherever it appears.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onAchievementsScore()
    private onAchievementsScore = (event: IMessageEvent): void =>
    {
        const parser = event.parser as AchievementsScoreMessageParser | null;

        if(!parser) return;

        this._localization?.registerParameter('achievements_score_description', 'score', String(parser.score));
    };

    /**
	 * The clothing the player has bought. Nothing subscribed this, so both lists stayed empty and
	 * `hasFigureSetIdInInventory()` answered false for everything — which is how the avatar editor
	 * came to hide every sellable item, owned or not.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onFigureSetIds()
    private onFigureSetIds = (event: IMessageEvent): void =>
    {
        const parser = event.parser as FigureSetIdsMessageParser | null;

        if(!parser) return;

        this.updatePurchasedFigureSetIds(parser.figureSetIds, parser.boundFurnitureNames);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::updatePurchasedFigureSetIds()
    updatePurchasedFigureSetIds(figureSetIds: number[], boundFurnitureNames: string[]): void
    {
        this._purchasedFigureSetIds = figureSetIds;
        this._boundFurnitureNames = boundFurnitureNames;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::hasFigureSetIdInInventory()
    hasFigureSetIdInInventory(figureSetId: number): boolean
    {
        return this._purchasedFigureSetIds.indexOf(figureSetId) > -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/HabboInventory.as::hasBoundFigureSetFurniture()
    hasBoundFigureSetFurniture(className: string): boolean
    {
        return this._boundFurnitureNames.indexOf(className) > -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::addMessageFragment()
    // A single-fragment message is used as it stands — AS3 returns `param1` before it ever looks
    // at `fragmentNo`, which matters: the server this client talks to sends `totalFragments = 1`
    // with `fragmentNo = 1`, so any implementation that indexes by fragment number instead would
    // wait forever for a fragment 0 that never arrives.
    //
    // AS3 concatenates the raw fragment buffers and lets `initBadges()` parse the assembled one;
    // this port's parser already decodes each fragment, so what is assembled here is the decoded
    // arrays. Same ordering, same completeness rule.
    private addBadgeMessageFragment(
        fragment: IBadgeData[],
        totalFragments: number,
        fragmentNo: number
    ): IBadgeData[] | null
    {
        if(totalFragments === 1) return fragment;

        if(this._badgeFragments === null) this._badgeFragments = new Array(totalFragments).fill(null);

        this._badgeFragments[fragmentNo] = fragment;

        for(const stored of this._badgeFragments)
        {
            if(stored === null) return null;
        }

        const assembled: IBadgeData[] = [];

        for(const stored of this._badgeFragments)
        {
            assembled.push(...stored!);
        }

        return assembled;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onBadges()
    // The badge list itself, which nothing subscribed until now: `requestBadges()` sent
    // GetBadgesComposer and the answer was dropped, so the badges tab stayed empty until a badge
    // was awarded live (onBadgeReceived, below). AS3's timing logs around the two slow steps are
    // dropped; the rest is its order, `initBadges()` then `updateView()` then the category latch.
    private onBadges = (event: IMessageEvent): void =>
    {
        const parser = event.parser as BadgesMessageParser | null;

        if(!parser || !this._badgesModel) return;

        const badges = this.addBadgeMessageFragment(parser.badges, parser.totalFragments, parser.fragmentNo);

        if(!badges) return;

        this._badgeFragments = null;

        this._badgesModel.initBadges(
            badges,
            (id: string) => this._localization?.getBadgeName(id) ?? '',
            (id: string) => this._localization?.getBadgeDesc(id) ?? ''
        );
        this._badgesModel.updateView();
        this.setInventoryCategoryInit('badges');
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onBadgeReceived()
    // The third argument is AS3's `badgeId:int` — this port named the parameter `slotId` because
    // that is what initBadges() feeds it, but both trees write the same code->int map that the
    // unseen tracker joins against (AS3 `isUnseen(4, badgeId)`), so the position is faithful.
    /**
     * The badge-point limits table.
     *
     * Goes nowhere near the badges model: AS3 pushes every pair straight into the localization
     * manager, which is what later answers "how many points is this achievement level worth".
     */
    /**
     * A post-it sheet was placed. Rewrites the stack's remaining count in the furni model, which
     * keeps it inside the item's stuff data rather than as a field.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onPostItPlaced()
    private onPostItPlaced = (event: IMessageEvent): void =>
    {
        const parser = event.parser as PostItPlacedMessageParser | null;

        if(parser === null || this._furniModel === null) return;

        this._furniModel.updatePostItCount(parser.id, parser.itemsLeft);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onBadgePointLimits()
    private onBadgePointLimits = (event: IMessageEvent): void =>
    {
        const parser = event.parser as BadgePointLimitsMessageParser | null;

        if(parser === null) return;

        for(const entry of parser.data)
        {
            this._localization?.setBadgePointLimit(entry.badgeId, entry.limit);
        }
    };

    private onBadgeReceived = (event: IMessageEvent): void =>
    {
        const parser = event.parser as BadgeReceivedEventParser | null;

        if(!parser || !this._badgesModel) return;

        this._badgesModel.updateBadge(
            parser.badgeCode,
            false,
            parser.badgeId,
            parser.ownerCount,
            parser.badgeRarityId,
            (id: string) => this._localization?.getBadgeName(id) ?? '',
            (id: string) => this._localization?.getBadgeDesc(id) ?? ''
        );
        this._badgesModel.updateView();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onPetAdded()
    // AS3's `if(parser.openInventory()) {}` is an empty branch in the dump — the body was compiled
    // away — so the flag is read and deliberately acted on by nothing here too.
    private onPetAdded = (event: IMessageEvent): void =>
    {
        const parser = event.parser as PetAddedToInventoryEventParser | null;

        if(!parser || !this._petsModel || !parser.pet) return;

        this._petsModel.addPet(parser.pet);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onPetRemoved()
    private onPetRemoved = (event: IMessageEvent): void =>
    {
        const parser = event.parser as PetRemovedFromInventoryEventParser | null;

        if(!parser || !this._petsModel) return;

        this._petsModel.removePet(parser.petId);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onGoToBreedingNestFailure()
    // Reason 6 is "no food": the alert's action button then points at the food catalog page instead
    // of the nests page. Every other reason keeps the nest page, and the message key itself is built
    // from the raw reason code.
    private onGoToBreedingNestFailure = (event: IMessageEvent): void =>
    {
        const parser = event.parser as GoToBreedingNestFailureEventParser | null;

        if(!parser || !this._windowManager) return;

        let linkCaption = '${gotobreedingnestfailure.getnest}';
        let linkClickCallback = this.getNest;

        if(parser.reason === 6)
        {
            linkCaption = '${gotobreedingnestfailure.getfood}';
            linkClickCallback = this.getFood;
        }

        this._windowManager.simpleAlert(
            '${gotobreedingnestfailure.caption}',
            '${gotobreedingnestfailure.subtitle}',
            `\${gotobreedingnestfailure.message.${parser.reason}}`,
            linkCaption,
            '',
            null,
            null,
            linkClickCallback
        );
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::getNest()
    private getNest = (): void =>
    {
        this._catalog?.openCatalogPage(this.getProperty('gotobreedingnestfailure.catalogpage.nests'));
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::getFood()
    private getFood = (): void =>
    {
        this._catalog?.openCatalogPage(this.getProperty('gotobreedingnestfailure.catalogpage.food'));
    };

    // Mirrors onFurniList: accumulate across fragments, then hand the full set to the model.
    private onPetInventory = (event: IMessageEvent): void =>
    {
        const parser = event.parser as PetInventoryMessageParser | null;

        if(!parser) return;

        for(const data of parser.pets)
        {
            const figureData = new PetFigureData(
                data.figureData.typeId,
                data.figureData.paletteId,
                data.figureData.color,
                data.figureData.breedId,
                Math.floor(data.figureData.customParts.length / 3),
                data.figureData.customParts
            );

            this._petListFragments.set(data.id, new Pet(data.id, data.name, figureData, data.level, data.rarityLevel));
        }

        if(parser.fragmentNo < parser.totalFragments - 1) return;

        const pets = new Map<number, Pet>(this._petListFragments);

        this._petListFragments.clear();

        // updatePets() sets the list-initialized flag; updateView() is a no-op until PetsView is
        // wired (Step 2/3). This already proves the wire path fills the model.
        this._petsModel?.updatePets(pets);
        this._petsModel?.updateView();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as
    // The inventory owns the avatar-effects message pipeline (the session-side
    // AvatarEffectsHandler is a stub; SessionDataManager also caches 2405 but
    // nothing reads it — the MessageRegistry allows both listeners). Populates the
    // EffectsModel and fires HIEE_EFFECTS_CHANGED so the me-menu widget re-renders.
    private registerEffectMessageEvents(): void
    {
        if(!this._communication) return;

        this._effectMessageEvents.push(
            this._communication.addMessageEvent(new AvatarEffectsMessageEvent(this.onAvatarEffects)),
            this._communication.addMessageEvent(new AvatarEffectAddedMessageEvent(this.onAvatarEffectAdded)),
            this._communication.addMessageEvent(new AvatarEffectActivatedMessageEvent(this.onAvatarEffectActivated)),
            this._communication.addMessageEvent(new AvatarEffectExpiredMessageEvent(this.onAvatarEffectExpired))
        );
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as:164
     * — `_com.addHabboConnectionMessageEvent(new _SafeCls_2180(onClubStatus))`.
     *
     * `setClubStatus()` was ported but nothing ever called it, so the inventory's purse kept
     * `clubPeriods`/`clubDays` at 0 and `get clubLevel()` — which is exactly
     * `clubDays == 0 && clubPeriods == 0 ? 0 : ...` — answered 0 for a member. That is what made
     * the toolbar purse show the "Get" join label to users who do hold HC: PurseClubArea's
     * `clubLevel == 0` branch is the one that writes `amountZeroText`.
     *
     * The catalog registers the same message for its own purse (HabboCatalog.onSubscriptionInfo);
     * the registry allows both listeners, and AS3 likewise has the two components subscribe
     * independently rather than share one purse.
     */
    // Derived name: `registerMessageEvents` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::registerMessageEvents()
    private registerClubMessageEvents(): void
    {
        if(!this._communication) return;

        this._clubMessageEvents.push(
            this._communication.addMessageEvent(new ScrSendUserInfoEvent(this.onClubStatus))
        );
    }

    /**
	 * The room-lifecycle branch of AS3's registration block. Four messages, two meanings: the
	 * inventory closes and the furni model stops considering itself in a room, or it starts.
	 *
	 * **Nothing subscribed these before**, so `FurniModel._isInRoom` never moved off `false` and the
	 * inventory stayed open across a room exit.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as:160,177,190,202
    private registerRoomMessageEvents(): void
    {
        if(!this._communication) return;

        this._roomMessageEvents.push(
            this._communication.addMessageEvent(new OpenConnectionMessageEvent(this.onRoomLeft)),
            this._communication.addMessageEvent(new CloseConnectionMessageEvent(this.onRoomLeft)),
            this._communication.addMessageEvent(new FlatAccessDeniedMessageEvent(this.onFlatAccessDenied)),
            this._communication.addMessageEvent(new RoomEntryInfoMessageEvent(this.onRoomEnter))
        );
    }

    /**
	 * AS3 hangs `onRoomLeft` on **both** 611 and 3404 — opening a connection to another room and
	 * closing the current one both mean "you are no longer where you were".
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onRoomLeft()
    private onRoomLeft = (): void =>
    {
        this.closeView();
        this._furniModel?.roomLeft();
    };

    /**
	 * The same as leaving, but only when the refusal is about *this* player — the message also
	 * reaches everyone already inside, and AS3 filters on the name for exactly that reason.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onFlatAccessDenied()
    private onFlatAccessDenied = (event: IMessageEvent): void =>
    {
        const parser = event.parser as FlatAccessDeniedMessageParser | null;

        if(!parser) return;

        if(this._sessionDataManager == null || parser.userName !== this._sessionDataManager.userName) return;

        this.closeView();
        this._furniModel?.roomLeft();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onRoomEnter()
    private onRoomEnter = (): void =>
    {
        if(this.getBoolean('effects.reactivate.on.room.entry'))
        {
            this._effectsModel?.reactivateLastEffect();
        }

        this._furniModel?.roomEntered();
    };

    /**
	 * The marketplace branch. `MarketplaceModel` was fully ported — every setter, `setItemStats()`,
	 * `onNotEnoughCredits()` — and fed by nothing, so the marketplace tab opened with a disabled
	 * model showing zero commission and no price history.
	 *
	 * The catalog subscribes 1397 and 2821 too, for its own `MarketPlaceLogic`; the registry allows
	 * both listeners and AS3 likewise has the two components subscribe independently.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as:161,172,175,183
    private registerMarketplaceMessageEvents(): void
    {
        if(!this._communication) return;

        this._marketplaceMessageEvents.push(
            this._communication.addMessageEvent(new NotEnoughBalanceMessageEvent(this.onNotEnoughCredits)),
            this._communication.addMessageEvent(new MarketplaceConfigurationEvent(this.onMarketplaceConfiguration)),
            this._communication.addMessageEvent(new MarketplaceItemStatsEvent(this.onMarketplaceItemStats)),
            this._communication.addMessageEvent(new UserRightsMessageEvent(this.onUserRights))
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onNotEnoughCredits()
    private onNotEnoughCredits = (): void =>
    {
        this._marketplaceModel?.onNotEnoughCredits();
    };

    /**
	 * Arriving marks the marketplace category initialised, which is what
	 * {@link onUserRights} later tests before re-requesting — and refreshes the furni grid, whose
	 * per-item "sell" affordance depends on the model being enabled.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onMarketplaceConfiguration()
    private onMarketplaceConfiguration = (event: IMessageEvent): void =>
    {
        const parser = event.parser as MarketplaceConfigurationEventParser | null;
        const model = this._marketplaceModel;

        if(!parser || !model) return;

        model.isEnabled = parser.isEnabled;
        model.commission = parser.commission;
        model.tokenBatchPrice = parser.tokenBatchPrice;
        model.tokenBatchSize = parser.tokenBatchSize;
        model.offerMinPrice = parser.offerMinPrice;
        model.offerMaxPrice = parser.offerMaxPrice;
        model.expirationHours = parser.expirationHours;
        model.averagePricePeriod = parser.averagePricePeriod;
        model.sellingFeePercentage = parser.sellingFeePercentage;
        model.revenueLimit = parser.revenueLimit;
        model.halfTaxLimit = parser.halfTaxLimit;

        this.setInventoryCategoryInit('marketplace');
        this._furniModel?.updateView();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onMarketplaceItemStats()
    private onMarketplaceItemStats = (event: IMessageEvent): void =>
    {
        const parser = event.parser as MarketplaceItemStatsEventParser | null;
        const model = this._marketplaceModel;

        if(!parser || !model) return;

        const stats = new MarketplaceItemStats();

        stats.averagePrice = parser.averagePrice;
        stats.offerCount = parser.offerCount;
        stats.historyLength = parser.historyLength;
        stats.dayOffsets = parser.dayOffsets;
        stats.averagePrices = parser.averagePrices;
        stats.soldAmounts = parser.soldAmounts;
        stats.furniCategoryId = parser.furniCategoryId;
        stats.furniTypeId = parser.furniTypeId;
        stats.lowestCurrentPrice = parser.lowestCurrentPrice;
        stats.suggestedPrice = parser.suggestedPrice;

        model.setItemStats(stats);
    };

    /**
	 * Rights change while the marketplace tab is already up: re-ask, because what the player may
	 * sell has just moved. The `isInventoryCategoryInit` gate is what keeps this from firing before
	 * the tab has ever been opened.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onUserRights()
    private onUserRights = (): void =>
    {
        if(!this.isInventoryCategoryInit('marketplace')) return;

        this._marketplaceModel?.requestInitialization();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onClubStatus()
    private onClubStatus = (event: IMessageEvent): void =>
    {
        const parser = event.parser as ScrSendUserInfoMessageParser | null;

        if(!parser) return;

        if(parser.productName !== 'habbo_club' && parser.productName !== 'club_habbo') return;

        this.setClubStatus(
            parser.periodsSubscribedAhead,
            parser.daysToPeriodEnd,
            parser.hasEverBeenMember,
            parser.isVIP,
            parser.responseType === 3,
            parser.responseType === 4,
            parser.minutesUntilExpiration,
            parser.minutesSinceLastModified
        );

        // AS3 dispatches `new HabboInventoryHabboClubEvent()`; HabboToolbar subscribes to it under
        // this type name and fans it out to every club-dependent extension.
        this.events.emit('HIHCE_HABBO_CLUB_CHANGED');
    };

    // AS3: _SafeCls_1951.as::onAvatarEffects()
    private onAvatarEffects = (event: IMessageEvent): void =>
    {
        const parser = event.parser as AvatarEffectsMessageParser | null;

        if(!parser) return;

        const model = this._effectsModel;

        if(!model) return;

        for(const dto of parser.effects)
        {
            const effect = new Effect();

            effect.type = dto.type;
            effect.subType = dto.subType;
            effect.duration = dto.duration;
            effect.isPermanent = dto.isPermanent;
            effect.amountInInventory = dto.inactiveEffectsInInventory;

            // AS3: secondsLeftIfActive >= 0 → active (and counts as an extra owned
            // instance); -1 → inactive stock (full duration remaining).
            if(dto.secondsLeftIfActive >= 0)
            {
                effect.isActive = true;
                effect.secondsLeft = dto.secondsLeftIfActive;
                effect.amountInInventory++;
            }
            else
            {
                effect.isActive = false;
                effect.secondsLeft = dto.duration;
            }

            model.addEffect(effect);
        }

        this.setInventoryCategoryInit('effects');
        this.notifyChangedEffects();
    };

    // AS3: _SafeCls_1951.as::onAvatarEffectAdded()
    private onAvatarEffectAdded = (event: IMessageEvent): void =>
    {
        const parser = event.parser as AvatarEffectAddedMessageParser | null;

        if(!parser || !this._effectsModel) return;

        const effect = new Effect();

        effect.type = parser.type;
        effect.subType = parser.subType;
        effect.duration = parser.duration;
        effect.isPermanent = parser.isPermanent;
        effect.secondsLeft = parser.duration;

        this._effectsModel.addEffect(effect);
        this.notifyChangedEffects();
    };

    // AS3: _SafeCls_1951.as::onAvatarEffectActivated()
    private onAvatarEffectActivated = (event: IMessageEvent): void =>
    {
        const parser = event.parser as AvatarEffectActivatedMessageParser | null;

        if(!parser || !this._effectsModel) return;

        this._effectsModel.setEffectActivated(parser.type);
        this.notifyChangedEffects();
    };

    // AS3: _SafeCls_1951.as::onAvatarEffectExpired()
    private onAvatarEffectExpired = (event: IMessageEvent): void =>
    {
        const parser = event.parser as AvatarEffectExpiredMessageParser | null;

        if(!parser || !this._effectsModel) return;

        this._effectsModel.setEffectExpired(parser.type);
        this.notifyChangedEffects();
    };

    // AS3: HabboInventory.as::getAvatarEffects()
    getAvatarEffects(): Effect[]
    {
        return this._effectsModel ? this._effectsModel.getEffects() : [];
    }

    // AS3: HabboInventory.as::getActivatedAvatarEffects()
    getActivatedAvatarEffects(): Effect[]
    {
        return this._effectsModel ? this._effectsModel.getEffects(EffectFilter.ACTIVE) : [];
    }

    // AS3: HabboInventory.as::setEffectSelected() — wear an owned effect
    setEffectSelected(type: number): void
    {
        if(!this._effectsModel) return;

        this._effectsModel.useEffect(type);
        this.notifyChangedEffects();
    }

    // AS3: HabboInventory.as::setEffectDeselected() — stop wearing an effect
    setEffectDeselected(type: number): void
    {
        if(!this._effectsModel) return;

        this._effectsModel.stopUsingEffect(type, true);
        this.notifyChangedEffects();
    }

    // AS3: HabboInventory.as::deselectAllEffects()
    deselectAllEffects(clearLastActivated: boolean = false): void
    {
        if(!this._effectsModel) return;

        this._effectsModel.stopUsingAllEffects(true, true, clearLastActivated);
        this.notifyChangedEffects();
    }

    // AS3: HabboInventory.as::getAvatarEffect()
    getAvatarEffect(type: number): Effect | null
    {
        return this._effectsModel ? this._effectsModel.getEffect(type) : null;
    }

    // AS3: HabboInventory.as::notifyChangedEffects() — dispatches HabboInventoryEffectsEvent
    notifyChangedEffects(): void
    {
        this.events.emit(
            HabboInventoryEffectsEvent.HIEE_EFFECTS_CHANGED,
            new HabboInventoryEffectsEvent()
        );
    }

    private onFurniList = (event: IMessageEvent): void =>
    {
        const parser = event.parser as FurniListMessageParser | null;

        if(!parser) return;

        // AS3 (_SafeCls_1951.as::onFurniList():223-231) builds the inventory view here — hidden —
        // and then bails if the model is still null. Both lines were dropped, and `_furniModel` only
        // exists once `init()` has run, which nothing does until the player opens the inventory
        // window: a furni list arriving before that found `undefined`, took the `?.` below and threw
        // the whole list away, silently, without marking the category initialised.
        //
        // That is what left the Relics grid empty. Opening the Collector's Guild asks for the furni
        // inventory (MintInventoryListTab.initializeData() → checkCategoryInitilization('furni'),
        // which requests as a side effect) and then waits on HABBO_INVENTORY_CATEGORY_INITIALIZED —
        // an event only insertFurniture() raises. The reply was dropped, the wait never cleared, and
        // the tab stayed blank until the player opened the inventory by hand and the next list
        // landed with the model finally built.
        if(!this.isMainViewInitialized)
        {
            this.initializeFurniturePage();
        }

        if(!this._furniModel) return;

        for(const [itemId, item] of parser.items)
        {
            this._furniListFragments.set(itemId, item);
        }

        if(parser.fragmentNo < parser.totalFragments - 1) return;

        const items = new Map<number, IFurnitureItemData>();

        for(const [itemId, item] of this._furniListFragments)
        {
            items.set(itemId, item.toFurnitureItemData());
        }

        this._furniListFragments.clear();
        this._furniModel?.insertFurniture(items);

        // AS3 raises this at the tail of onFurniList(), once the last fragment has been folded
        // in and handed over. `CraftingWidgetHandler` listens for it.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onFurniList()
        this.events.emit(
            HabboInventoryFurniListParsedEvent.HFLPE_FURNI_LIST_PARSED,
            new HabboInventoryFurniListParsedEvent('furni')
        );
    };

    // Named `onFurniListAddOrUpdate` here for symmetry with its sibling handlers
    // (onFurniList/onFurniListRemove/...); the real AS3 name is `onFurnitureAddOrUpdate`.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/_SafeCls_1951.as::onFurnitureAddOrUpdate()
    private onFurniListAddOrUpdate = (event: IMessageEvent): void =>
    {
        const parser = event.parser as FurniListAddOrUpdateMessageParser | null;

        if(!parser || !this._furniModel) return;

        const addedIds: number[] = [];

        for(const item of parser.items)
        {
            const furnitureItem = new FurnitureItem(item.toFurnitureItemData());

            this._furniModel.addOrUpdateItem(furnitureItem, false);
            addedIds.push(furnitureItem.id);
        }

        // AS3 refreshes the view after adding — this was missing, so a picked-up item
        // only appeared after the inventory was reopened. updateUnseenItems() highlights
        // the new items and floats them to the top; setViewToState() flips an empty
        // panel to the list; updateView() redraws the grid.
        if(addedIds.length > 0)
        {
            // AS3: `updateUnseenItemsThumbs(_loc8_, false)` - no grid refresh here; setViewToState()/
            // updateView() below already redraw it.
            this._furniModel.updateUnseenItemsThumbs(addedIds, false);
        }

        this._furniModel.setViewToState();
        this._furniModel.updateView();
    };

    private onFurniListRemove = (event: IMessageEvent): void =>
    {
        const parser = event.parser as FurniListRemoveMessageParser | null;

        if(!parser || !this._furniModel) return;

        this._furniModel.removeFurni(parser.itemId);
    };

    // AS3: sources/win63_version/habbo/inventory/class_1762.as::onFurniListRemoveMultiple()
    private onFurniListRemoveMultiple = (event: IMessageEvent): void =>
    {
        const parser = event.parser as FurniListRemoveMultipleMessageParser | null;

        if(!parser || !this._furniModel) return;

        if(this._furniModel.removeFurnis(parser.stripIds))
        {
            this._furniModel.resetUnseenItems();
        }
    };

    private onFurniListInvalidate = (_event: IMessageEvent): void =>
    {
        this.requestFurni();
    };
}
