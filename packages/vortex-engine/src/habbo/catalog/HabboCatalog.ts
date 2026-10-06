import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {ICollectorHub} from './collectibles/ICollectorHub';
import {CollectiblesController} from './collectibles/CollectiblesController';
import {IID_CollectiblesController} from '@iid/IIDCollectiblesController';
import {EarningsController} from './earnings/EarningsController';
import {IID_VaultController} from '@iid/IIDVaultController';
import {HabbiconController} from './habbicons/HabbiconController';
import {IID_HabbiconController} from '@iid/IIDHabbiconController';
import {Logger} from '@core/utils/Logger';
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import {HabboClubLevelEnum} from '@habbo/session/enum/HabboClubLevelEnum';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {IProductData} from '@habbo/session/product/IProductData';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IFurniDataListener} from '@habbo/session/furniture/IFurniDataListener';
import type {IProductDataListener} from '@habbo/session/product/IProductDataListener';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import {RoomPreviewer} from '@habbo/room/preview/RoomPreviewer';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowKeyboardEvent} from '@core/window/events/WindowKeyboardEvent';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import {IID_HabboInventory} from '@iid/IIDHabboInventory';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import {IID_HabboQuestEngine} from '@iid/IIDHabboQuestEngine';
import type {IHabboQuestEngine} from '@habbo/quest/IHabboQuestEngine';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_HabboTracking} from '@iid/IIDHabboTracking';
import {IID_HabboSoundManager} from '@iid/IIDHabboSoundManager';
import {IID_HabboFreeFlowChat} from '@iid/IIDHabboFreeFlowChat';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import {IID_HabboNotifications} from '@iid/IIDHabboNotifications';
import {IID_HabboAvatarEditor} from '@iid/IIDHabboAvatarEditor';
import type {IHabboAvatarEditor} from '@habbo/avatar/IHabboAvatarEditor';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import {RoomSessionEvent} from '@habbo/session/events/RoomSessionEvent';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {HabboToolbarIconEnum} from '@habbo/toolbar/HabboToolbarIconEnum';
import {CreditBalanceEvent} from '@habbo/communication/messages/incoming/inventory/purse/CreditBalanceEvent';
import type {
    CreditBalanceEventParser
} from '@habbo/communication/messages/parser/inventory/purse/CreditBalanceEventParser';
import {
    ActivityPointsMessageEvent
} from '@habbo/communication/messages/incoming/notifications/ActivityPointsMessageEvent';
import type {
    ActivityPointsMessageParser
} from '@habbo/communication/messages/parser/notifications/ActivityPointsMessageParser';
import {
    HabboActivityPointNotificationMessageEvent
} from '@habbo/communication/messages/incoming/notifications/HabboActivityPointNotificationMessageEvent';
import {ScrSendUserInfoEvent} from '@habbo/communication/messages/incoming/users/ScrSendUserInfoEvent';
import type {FrontPageItem} from '@habbo/communication/messages/incoming/catalog/FrontPageItem';
import type {ScrSendUserInfoMessageParser} from '@habbo/communication/messages/parser/users/ScrSendUserInfoMessageParser';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import {OrderedMap} from '@core/utils/OrderedMap';
import {ApproveNameMessageEvent} from '@habbo/communication/messages/incoming/users/ApproveNameMessageEvent';
import type {ApproveNameMessageParser} from '@habbo/communication/messages/parser/users/ApproveNameMessageParser';
import {ApproveNameMessageComposer} from '@habbo/communication/messages/outgoing/users/ApproveNameMessageComposer';
import {SellablePetPalettesMessageEvent} from '@habbo/communication/messages/incoming/catalog/SellablePetPalettesMessageEvent';
import type {SellablePetPalette} from '@habbo/communication/messages/parser/catalog/SellablePetPalette';
import type {SellablePetPalettesMessageEventParser} from '@habbo/communication/messages/parser/catalog/SellablePetPalettesMessageEventParser';
import {GetSellablePetPalettesComposer} from '@habbo/communication/messages/outgoing/catalog/GetSellablePetPalettesComposer';
import {CatalogWidgetApproveNameResultEvent} from './viewer/widgets/events/CatalogWidgetApproveNameResultEvent';
import {CatalogWidgetSellablePetPalettesEvent} from './viewer/widgets/events/CatalogWidgetSellablePetPalettesEvent';
import {GetCreditsInfoComposer} from '@habbo/communication/messages/outgoing/inventory/purse/GetCreditsInfoComposer';
import {GetCatalogPageComposer} from '@habbo/communication/messages/outgoing/catalog/GetCatalogPageComposer';
import {PurchaseFromCatalogComposer} from '@habbo/communication/messages/outgoing/catalog/PurchaseFromCatalogComposer';
import {GetProductOfferComposer} from '@habbo/communication/messages/outgoing/catalog/GetProductOfferComposer';
import {PurchaseNftOfferMessageComposer} from '@habbo/communication/messages/outgoing/catalog/PurchaseNftOfferMessageComposer';
import {PurchaseMintTokensMessageComposer} from '@habbo/communication/messages/outgoing/catalog/PurchaseMintTokensMessageComposer';
import {CheckGiftableMessageComposer} from '@habbo/communication/messages/outgoing/catalog/CheckGiftableMessageComposer';
import {GetRoomAdsPurchaseInfoMessageComposer} from '@habbo/communication/messages/outgoing/catalog/GetRoomAdsPurchaseInfoMessageComposer';
import {PurchaseRoomAdMessageComposer} from '@habbo/communication/messages/outgoing/catalog/PurchaseRoomAdMessageComposer';
import {RoomAdPurchaseInitiatedMessageComposer} from '@habbo/communication/messages/outgoing/catalog/RoomAdPurchaseInitiatedMessageComposer';
import {AssetLoaderEvent} from '@core/assets/loaders/AssetLoaderEvent';
import {LtdRaffleResultMessageEvent} from '@habbo/communication/messages/incoming/catalog/LtdRaffleResultMessageEvent';
import {LtdRaffleEnteredMessageEvent} from '@habbo/communication/messages/incoming/catalog/LtdRaffleEnteredMessageEvent';
import {
    SnowWarGameTokensMessageEvent
} from '@habbo/communication/messages/incoming/catalog/SnowWarGameTokensMessageEvent';
import type {
    SnowWarGameTokensMessageParser
} from '@habbo/communication/messages/parser/catalog/SnowWarGameTokensMessageParser';
import {
    GetSnowWarGameTokensOfferComposer
} from '@habbo/communication/messages/outgoing/catalog/GetSnowWarGameTokensOfferComposer';
import {
    PurchaseSnowWarGameTokensOfferComposer
} from '@habbo/communication/messages/outgoing/catalog/PurchaseSnowWarGameTokensOfferComposer';
import {GameTokensOffer} from '@habbo/catalog/viewer/GameTokensOffer';
import type {LtdRaffleResultMessageParser} from '@habbo/communication/messages/parser/catalog/LtdRaffleResultMessageParser';
import {SilverBalanceMessageEvent} from '@habbo/communication/messages/incoming/collectibles/SilverBalanceMessageEvent';
import {EmeraldBalanceMessageEvent} from '@habbo/communication/messages/incoming/collectibles/EmeraldBalanceMessageEvent';
import type {SilverBalanceMessageParser} from '@habbo/communication/messages/parser/collectibles/SilverBalanceMessageParser';
import type {EmeraldBalanceMessageParser} from '@habbo/communication/messages/parser/collectibles/EmeraldBalanceMessageParser';
import {PurchaseProductAsGiftMessageComposer} from '@habbo/communication/messages/outgoing/catalog/PurchaseProductAsGiftMessageComposer';
import {CatalogIndexMessageEvent} from '@habbo/communication/messages/incoming/catalog/CatalogIndexMessageEvent';
import {BundleDiscountRulesetMessageEvent} from '@habbo/communication/messages/incoming/catalog/BundleDiscountRulesetMessageEvent';
import type {BundleDiscountRuleset} from '@habbo/communication/messages/incoming/catalog/BundleDiscountRuleset';
import type {BundleDiscountRulesetMessageEventParser} from '@habbo/communication/messages/parser/catalog/BundleDiscountRulesetMessageEventParser';
import type {
    CatalogIndexMessageEventParser
} from '@habbo/communication/messages/parser/catalog/CatalogIndexMessageEventParser';
import {ProductOfferMessageEvent} from '@habbo/communication/messages/incoming/catalog/ProductOfferMessageEvent';
import {LimitedEditionSoldOutMessageEvent} from '@habbo/communication/messages/incoming/catalog/LimitedEditionSoldOutMessageEvent';
import {GiftReceiverNotFoundMessageEvent} from '@habbo/communication/messages/incoming/catalog/GiftReceiverNotFoundMessageEvent';
import type {ProductOfferMessageEventParser} from '@habbo/communication/messages/parser/catalog/ProductOfferMessageEventParser';
import {SelectProductEvent} from './viewer/widgets/events/SelectProductEvent';
import {SetExtraPurchaseParameterEvent} from './viewer/widgets/events/SetExtraPurchaseParameterEvent';
import {CatalogPageMessageEvent} from '@habbo/communication/messages/incoming/catalog/CatalogPageMessageEvent';
import type {
    CatalogPageMessageEventParser
} from '@habbo/communication/messages/parser/catalog/CatalogPageMessageEventParser';
import {GetCatalogIndexComposer} from '@habbo/communication/messages/outgoing/catalog/GetCatalogIndexComposer';
import {GetBundleDiscountRulesetComposer} from '@habbo/communication/messages/outgoing/catalog/GetBundleDiscountRulesetComposer';
import {GetGiftWrappingConfigurationComposer} from '@habbo/communication/messages/outgoing/catalog/GetGiftWrappingConfigurationComposer';
import {GiftWrappingConfigurationEvent} from '@habbo/communication/messages/incoming/catalog/GiftWrappingConfigurationEvent';
import {CatalogPublishedMessageEvent} from '@habbo/communication/messages/incoming/catalog/CatalogPublishedMessageEvent';
import type {CatalogPublishedMessageEventParser} from '@habbo/communication/messages/parser/catalog/CatalogPublishedMessageEventParser';
import type {GiftWrappingConfigurationEventParser} from '@habbo/communication/messages/parser/catalog/GiftWrappingConfigurationEventParser';
import {GiftWrappingConfiguration} from './purchase/GiftWrappingConfiguration';
import {PurchaseOKMessageEvent} from '@habbo/communication/messages/incoming/catalog/PurchaseOKMessageEvent';
import type {PurchaseOKMessageEventParser} from '@habbo/communication/messages/parser/catalog/PurchaseOKMessageEventParser';
import {PurchaseErrorMessageEvent} from '@habbo/communication/messages/incoming/catalog/PurchaseErrorMessageEvent';
import type {PurchaseErrorMessageEventParser} from '@habbo/communication/messages/parser/catalog/PurchaseErrorMessageEventParser';
import {PurchaseNotAllowedMessageEvent} from '@habbo/communication/messages/incoming/catalog/PurchaseNotAllowedMessageEvent';
import type {PurchaseNotAllowedMessageEventParser} from '@habbo/communication/messages/parser/catalog/PurchaseNotAllowedMessageEventParser';
import {NotEnoughBalanceMessageEvent} from '@habbo/communication/messages/incoming/catalog/NotEnoughBalanceMessageEvent';
import type {NotEnoughBalanceMessageEventParser} from '@habbo/communication/messages/parser/catalog/NotEnoughBalanceMessageEventParser';
import {CatalogFurniPurchaseEvent} from './navigation/events/CatalogFurniPurchaseEvent';
import {RedeemVoucherMessageComposer} from '@habbo/communication/messages/outgoing/catalog/RedeemVoucherMessageComposer';
import {VoucherRedeemOkMessageEvent} from '@habbo/communication/messages/incoming/catalog/VoucherRedeemOkMessageEvent';
import type {VoucherRedeemOkMessageEventParser} from '@habbo/communication/messages/parser/catalog/VoucherRedeemOkMessageEventParser';
import {VoucherRedeemErrorMessageEvent} from '@habbo/communication/messages/incoming/catalog/VoucherRedeemErrorMessageEvent';
import type {VoucherRedeemErrorMessageEventParser} from '@habbo/communication/messages/parser/catalog/VoucherRedeemErrorMessageEventParser';
import {GetClubOffersMessageComposer} from '@habbo/communication/messages/outgoing/catalog/GetClubOffersMessageComposer';
import {HabboClubOffersMessageEvent} from '@habbo/communication/messages/incoming/catalog/HabboClubOffersMessageEvent';
import type {HabboClubOffersMessageEventParser} from '@habbo/communication/messages/parser/catalog/HabboClubOffersMessageEventParser';
import {HabboClubExtendOfferMessageEvent} from '@habbo/communication/messages/incoming/catalog/HabboClubExtendOfferMessageEvent';
import {PurchaseVipMembershipExtensionComposer} from '@habbo/communication/messages/outgoing/catalog/PurchaseVipMembershipExtensionComposer';
import {PurchaseBasicMembershipExtensionComposer} from '@habbo/communication/messages/outgoing/catalog/PurchaseBasicMembershipExtensionComposer';
import {ClubGiftInfoEvent} from '@habbo/communication/messages/incoming/catalog/ClubGiftInfoEvent';
import type {ClubGiftInfoEventParser} from '@habbo/communication/messages/parser/catalog/ClubGiftInfoEventParser';
import {ClubBuyController} from './club/ClubBuyController';
import {ClubExtendController} from './club/ClubExtendController';
import {ClubGiftController} from './club/ClubGiftController';
import type {IMarketPlace} from './marketplace/IMarketPlace';
import {MarketPlaceLogic} from './marketplace/MarketPlaceLogic';
import {GetMarketplaceOffersMessageComposer} from '@habbo/communication/messages/outgoing/marketplace/GetMarketplaceOffersMessageComposer';
import {GetMarketplaceOwnOffersMessageComposer} from '@habbo/communication/messages/outgoing/marketplace/GetMarketplaceOwnOffersMessageComposer';
import {CancelAllMarketplaceOffersMessageComposer} from '@habbo/communication/messages/outgoing/marketplace/CancelAllMarketplaceOffersMessageComposer';
import {ClearOwnMarketplaceHistoryMessageComposer} from '@habbo/communication/messages/outgoing/marketplace/ClearOwnMarketplaceHistoryMessageComposer';
import {BuyMarketplaceOfferMessageComposer} from '@habbo/communication/messages/outgoing/marketplace/BuyMarketplaceOfferMessageComposer';
import {RedeemMarketplaceOfferCreditsMessageComposer} from '@habbo/communication/messages/outgoing/marketplace/RedeemMarketplaceOfferCreditsMessageComposer';
import {CancelMarketplaceOfferMessageComposer} from '@habbo/communication/messages/outgoing/marketplace/CancelMarketplaceOfferMessageComposer';
import {GetMarketplaceItemStatsComposer} from '@habbo/communication/messages/outgoing/marketplace/GetMarketplaceItemStatsComposer';
import {MarketPlaceOffersEvent} from '@habbo/communication/messages/incoming/marketplace/MarketPlaceOffersEvent';
import {MarketPlaceOwnOffersEvent} from '@habbo/communication/messages/incoming/marketplace/MarketPlaceOwnOffersEvent';
import {MarketplaceBuyOfferResultEvent} from '@habbo/communication/messages/incoming/marketplace/MarketplaceBuyOfferResultEvent';
import {MarketplaceCancelOfferResultEvent} from '@habbo/communication/messages/incoming/marketplace/MarketplaceCancelOfferResultEvent';
import {MarketplaceCancelAllOffersResultEvent} from '@habbo/communication/messages/incoming/marketplace/MarketplaceCancelAllOffersResultEvent';
import {MarketplaceClearOwnHistoryResultEvent} from '@habbo/communication/messages/incoming/marketplace/MarketplaceClearOwnHistoryResultEvent';
import {MarketplaceMakeOfferResultEvent} from '@habbo/communication/messages/incoming/marketplace/MarketplaceMakeOfferResultEvent';
import type {MarketplaceMakeOfferResultParser} from '@habbo/communication/messages/parser/marketplace/MarketplaceMakeOfferResultParser';
import {MarketplaceConfigurationEvent} from '@habbo/communication/messages/incoming/marketplace/MarketplaceConfigurationEvent';
import type {MarketplaceConfigurationEventParser} from '@habbo/communication/messages/parser/marketplace/MarketplaceConfigurationEventParser';
import {MarketplaceItemStatsEvent} from '@habbo/communication/messages/incoming/marketplace/MarketplaceItemStatsEvent';
import type {MarketplaceItemStatsEventParser} from '@habbo/communication/messages/parser/marketplace/MarketplaceItemStatsEventParser';
import {MarketplaceItemStats} from './marketplace/MarketplaceItemStats';
import type {IRecycler} from './recycler/IRecycler';
import {RecyclerLogic} from './recycler/RecyclerLogic';
import {GetRecyclerStatusMessageComposer} from '@habbo/communication/messages/outgoing/catalog/GetRecyclerStatusMessageComposer';
import {GetRecyclerPrizesMessageComposer} from '@habbo/communication/messages/outgoing/catalog/GetRecyclerPrizesMessageComposer';
import {RecycleItemsMessageComposer} from '@habbo/communication/messages/outgoing/catalog/RecycleItemsMessageComposer';
import {RecyclerStatusMessageEvent} from '@habbo/communication/messages/incoming/catalog/RecyclerStatusMessageEvent';
import type {RecyclerStatusMessageEventParser} from '@habbo/communication/messages/parser/catalog/RecyclerStatusMessageEventParser';
import {RecyclerFinishedMessageEvent} from '@habbo/communication/messages/incoming/catalog/RecyclerFinishedMessageEvent';
import type {RecyclerFinishedMessageEventParser} from '@habbo/communication/messages/parser/catalog/RecyclerFinishedMessageEventParser';
import {RecyclerPrizesMessageEvent} from '@habbo/communication/messages/incoming/catalog/RecyclerPrizesMessageEvent';
import type {RecyclerPrizesMessageEventParser} from '@habbo/communication/messages/parser/catalog/RecyclerPrizesMessageEventParser';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {IDisposable} from '@core/runtime/IDisposable';
import {IID_HabboNewNavigator} from '@iid/IIDHabboNewNavigator';
import {IID_HabboGroupsManager} from '@iid/IIDHabboGroupsManager';
import type {IHabboNewNavigator} from '@habbo/navigator/IHabboNewNavigator';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import {GuildSettingsChangedInManageEvent} from '@habbo/groups/events/GuildSettingsChangedInManageEvent';
import {GuildMembershipsMessageEvent} from '@habbo/communication/messages/incoming/users/GuildMembershipsMessageEvent';
import {GuildMembershipsController} from './guilds/GuildMembershipsController';
import {PurchaseConfirmationDialog} from './purchase/PurchaseConfirmationDialog';
import {ProductTypeEnum} from './enum/ProductTypeEnum';
import type {IHabboCatalog} from './IHabboCatalog';
import type {IPurchasableOffer} from './IPurchasableOffer';
import type {ICatalogNavigator} from './navigation/ICatalogNavigator';
import {CatalogNavigator} from './navigation/CatalogNavigator';
import {RequestedPage} from './navigation/RequestedPage';
import {CatalogViewer} from './viewer/CatalogViewer';
import type {ICatalogPage} from './viewer/ICatalogPage';
import {PageLocalization} from './viewer/PageLocalization';
import {Offer} from './viewer/Offer';
import {ClubBuyOfferData} from './club/ClubBuyOfferData';
import {Product} from './viewer/Product';
import {CatalogWindowState} from './CatalogWindowState';
import {CatalogType} from './enum/CatalogType';
import {HabboCatalogTrackingEvent} from './enum/HabboCatalogTrackingEvent';
import {CatalogSearchEntry} from './search/CatalogSearchEntry';
import {FurnitureOffer} from './viewer/FurnitureOffer';
import type {IOfferCenter} from './offers/IOfferCenter';
import type {IOfferExtension} from './offers/IOfferExtension';
import {OfferCenter} from './offers/OfferCenter';
import {SpecialItemsController} from './special_items_display/SpecialItemsController';
import {IID_SpecialItemsController} from '@iid/IIDSpecialItemsController';
import {PlacedObjectPurchaseData} from './purchase/PlacedObjectPurchaseData';
import {RentConfirmationWindow} from './purchase/RentConfirmationWindow';
import {RoomAdPurchaseData} from './purchase/RoomAdPurchaseData';
import {OfferController} from './targetedoffers/OfferController';
import {VideoOfferManager} from './VideoOfferManager';
import {NftStorePurchaseMessageEvent} from '@habbo/communication/messages/incoming/collectibles/NftStorePurchaseMessageEvent';
import {NftStorePurchaseMessageParser} from '@habbo/communication/messages/parser/collectibles/NftStorePurchaseMessageParser';
import type {IVideoOfferManager} from './IVideoOfferManager';
import {FurnitureCategory} from '@habbo/inventory/enum/FurnitureCategory';
import {PlaceObjectMessageComposer} from '@habbo/communication/messages/outgoing/room/engine/PlaceObjectMessageComposer';
import type {IDragAndDropDoneReceiver} from './viewer/IDragAndDropDoneReceiver';
import {CatalogWidgetRoomChangedEvent} from './viewer/widgets/events/CatalogWidgetRoomChangedEvent';
import {RoomEngineObjectEvent} from '@habbo/room/events/RoomEngineObjectEvent';
import type {RoomEngineObjectPlacedEvent} from '@habbo/room/events/RoomEngineObjectPlacedEvent';
import type {RoomEngineObjectPlacedOnUserEvent} from '@habbo/room/events/RoomEngineObjectPlacedOnUserEvent';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {AssetBitmap} from '@core/assets/AssetBitmap';
import {MarkCatalogNewAdditionsPageOpenedComposer} from '@habbo/communication/messages/outgoing/catalog/MarkCatalogNewAdditionsPageOpenedComposer';
import {RequestRoomPropertySetComposer} from '@habbo/communication/messages/outgoing/inventory/RequestRoomPropertySetComposer';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {LegacyStuffData} from '@habbo/room/object/data/LegacyStuffData';
import {Vector3d} from '@room/utils/Vector3d';
import type {IRoomObjectController} from '@room/object/IRoomObjectController';
import type {IUserData} from '@habbo/session';
import {HabboCatalogUtils} from './HabboCatalogUtils';
import {WindowToggle} from '@habbo/utils/WindowToggle';
import {CatalogUserEvent} from '@habbo/catalog/event/CatalogUserEvent';
import {MintTokenPurchaseOffer} from '@habbo/catalog/collectibles/tabs/MintTokenPurchaseOffer';
import {NftStorePurchaseOffer} from '@habbo/catalog/collectibles/tabs/NftStorePurchaseOffer';
import {CatalogEvent} from './event/CatalogEvent';
import type {IEarningsController} from './earnings/IEarningsController';
import {Purse} from './purse/Purse';
import {PurseEvent} from './purse/PurseEvent';
import {PurseUpdateEvent} from './purse/PurseUpdateEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.catalog.HabboCatalog');

/**
 * Habbo catalog component.
 *
 * This restores the AS3 purse event flow used by the toolbar: incoming purse
 * messages update the catalog-owned `Purse`, then emit `PurseEvent`.
 *
 * @see sources/win63_version/habbo/catalog/HabboCatalog.as
 */
export class HabboCatalog extends Component implements IHabboCatalog, ILinkEventTracker, IFurniDataListener, IProductDataListener
{
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_communication
    private _communication: IHabboCommunicationManager | null = null;

    /**
     * AS3 exposes the manager so collaborators can register their own message events —
     * `RentConfirmationWindow` subscribes to the rent quote itself rather than being fed by the
     * catalog.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_communication
    get communication(): IHabboCommunicationManager | null
    {
        return this._communication;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;

    private _tracking: IHabboTracking | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_notifications
    private _notifications: IHabboNotifications | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_avatarEditor
    private _avatarEditor: IHabboAvatarEditor | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_soundManager
    private _soundManager: IHabboSoundManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get soundManager()
    get soundManager(): IHabboSoundManager | null
    {
        return this._soundManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get freeFlowChat()
    get freeFlowChat(): IHabboFreeFlowChat | null
    {
        return this._freeFlowChat;
    }

    /**
     * Name DERIVED: obfuscated in every tree. Starts true and is cleared by the first credit
     * balance, which is how the login-time balance push avoids playing the purchase chime.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_9727
    private _firstCreditBalancePending: boolean = true;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::roomSession (_SafeStr_5616)
    private _roomSession: IRoomSession | null = null;
    private _mainWindow: IWindowContainer | null = null;
    // Per-catalog-type state. _mainWindow/_catalogViewer above are re-pointed at the
    // active entry by setActiveCatalogState(); AS3 keeps exactly this shape.
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_catalogStates
    private _catalogStates: Map<string, CatalogWindowState> | null = null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_catalogNavigators
    private _catalogNavigators: Map<string, CatalogNavigator> | null = null;
    // Derived name: `_searchTimer` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_searchTimer
    private _searchTimer: ReturnType<typeof setTimeout> | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_5194 (furniture data cache)
    private _furnitureDataCache: IFurnitureData[] | null = null;

    /**
     * The search index, rebuilt lazily whenever furni or product data changes.
     *
     * Derived name — AS3's `_searchEntries` is readable; the dirty flag beside it (`_SafeStr_6916`)
     * is not, and is named for what it gates.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_searchEntries
    /** AS3's literal cap on how many results the grid is handed. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::performSearch() (the literal 400)
    private static readonly SEARCH_RESULT_LIMIT: number = 400;

    /**
     * Furni whose product description lives under a code other than their class name.
     *
     * AS3 declares it empty and this port keeps it empty: it is a hook the hotel's own build fills,
     * not a table with contents to recover.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::SEARCH_PRODUCT_CODE_OVERRIDES_BY_FURNI_CLASS_NAME
    private static readonly SEARCH_PRODUCT_CODE_OVERRIDES_BY_FURNI_CLASS_NAME: Record<string, string> = {};

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_searchEntries
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_offerCenter
    private _offerCenter: OfferCenter | null = null;

    private _searchEntries: CatalogSearchEntry[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_6916
    private _searchEntriesDirty: boolean = true;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_6916 (search-index stale flag)
    private _searchIndexStale: boolean = true;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_7748 (product data ready flag)
    private _productDataReady: boolean = false;
    private _catalogViewer: CatalogViewer | null = null;
    private _requestedPage: RequestedPage = new RequestedPage();
    private _initialized: boolean = false;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_sellablePetPalettes
    private _sellablePetPalettes: OrderedMap<string, SellablePetPalette[]> | null = new OrderedMap<string, SellablePetPalette[]>();
    private _purse: Purse = new Purse();

    private _clubBuyController: ClubBuyController | null = null;

    private _clubExtendController: ClubExtendController | null = null;

    private _clubGiftController: ClubGiftController | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_6362 (name derived: the rent dialog)
    private _rentConfirmationWindow: RentConfirmationWindow | null = null;

    private _marketPlace: MarketPlaceLogic | null = null;
    private _recycler: RecyclerLogic | null = null;
    private _purchaseWillBeGift: boolean = false;
    private _purchaseConfirmationDialog: PurchaseConfirmationDialog | null = null;

    /**
     * AS3 builds the collectibles hub here, in the catalog's own constructor, and attaches it to
     * the context under `IIDCollectiblesController` — it is not a top-level component the bootstrap
     * creates.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::HabboCatalog()
    constructor(context: IContext, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, 0, assetLibrary);

        this._earningsController = new EarningsController(context, 0, assetLibrary);
        context.attachComponent(this._earningsController, [IID_VaultController]);

        this._collectorHub = new CollectiblesController(context, 0, assetLibrary);
        context.attachComponent(this._collectorHub, [IID_CollectiblesController]);

        this._habbiconController = new HabbiconController(context, 0, assetLibrary);
        context.attachComponent(this._habbiconController, [IID_HabbiconController]);

        // AS3 attaches this from the same constructor (HabboCatalog.as:455). It registers a link
        // tracker for `special_items_display/<set>` and builds nothing until one arrives.
        this._specialItemsController = new SpecialItemsController(context, 0, assetLibrary);
        context.attachComponent(this._specialItemsController, [IID_SpecialItemsController]);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_8506
    private _specialItemsController: SpecialItemsController | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_habbiconController
    private _habbiconController: HabbiconController | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_8735 (name derived: the vault)
    private _earningsController: EarningsController | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_4729
    private _collectorHub: CollectiblesController | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // TS-only: no direct AS3 equivalent (AS3's HabboTracking is reached via a global singleton,
    // HabboTracking.getInstance()) - exposed here so HabboCatalogUtils's
    // spinnerValueChangedEventTrack()/bundlesInfoShownEventTrack()/discountShownEventTrack() can
    // reach it through the existing DI ComponentDependency pattern instead.
    get tracking(): IHabboTracking | null
    {
        return this._tracking;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get mainContainer()
    get mainContainer(): IWindowContainer | null
    {
        return this._mainWindow;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_localization
    private _localization: IHabboLocalizationManager | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_questEngine
    private _questEngine: IHabboQuestEngine | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get questEngine()
    get questEngine(): IHabboQuestEngine | null
    {
        return this._questEngine;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get localization()
    get localization(): IHabboLocalizationManager | null 
    {
        return this._localization;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_inventory
    private _inventory: IHabboInventory | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get inventory()
    get inventory(): IHabboInventory | null
    {
        return this._inventory;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null 
    {
        return this._sessionDataManager;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_avatarRenderManager
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get avatarRenderManager()
    get avatarRenderManager(): IAvatarRenderManager | null 
    {
        return this._avatarRenderManager;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get roomEngine()
    get roomEngine(): IRoomEngine | null
    {
        return this._roomEngine;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get toolbar()
    get toolbar(): IHabboToolbar | null
    {
        return this._toolbar;
    }

    /**
     * AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_7106
     *
     * Field name DERIVED: obfuscated in every tree. The targeted-offer controller, which has no
     * accessor — it is built in `initComponent()` and disposed here, and drives itself from there.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_7106
    private _offerController: OfferController | null = null;

    /** Derived name — `_SafeStr_6636`, the object `get videoOffers()` returns. */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_6636
    private _videoOfferManager: VideoOfferManager | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get videoOffers()
    get videoOffers(): IVideoOfferManager | null
    {
        return this._videoOfferManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get currentPage()
    get currentPage(): ICatalogPage | null
    {
        return this._catalogViewer?.currentPage ?? null;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_newNavigator
    private _newNavigator: IHabboNewNavigator | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get notifications()
    get notifications(): IHabboNotifications | null
    {
        return this._notifications;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get avatarEditor()
    get avatarEditor(): IHabboAvatarEditor | null
    {
        return this._avatarEditor;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get specialItemsController()
    get specialItemsController(): SpecialItemsController | null
    {
        return this._specialItemsController;
    }

    private _groupMembershipsController: GuildMembershipsController | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get navigator()
    get navigator(): IHabboNavigator | null
    {
        return this._newNavigator?.legacyNavigator ?? null;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_utils
    private _utils: HabboCatalogUtils = new HabboCatalogUtils(this);

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get utils()
    get utils(): HabboCatalogUtils 
    {
        return this._utils;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_friendList
    private _friendList: IHabboFriendList | null = null;

    private _giftReceiver: string = '';

    get giftReceiver(): string 
    {
        return this._giftReceiver;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::set giftReceiver()
    set giftReceiver(value: string) 
    {
        this._giftReceiver = value;
    }

    private _catalogType: string = 'NORMAL';

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get catalogType()
    get catalogType(): string 
    {
        return this._catalogType;
    }

    private _roomPreviewer: RoomPreviewer | null = null;

    // config flag are enforced here.
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get roomPreviewer()
    get roomPreviewer(): RoomPreviewer | null 
    {
        if(this._roomPreviewer == null) 
        {
            this.initializeRoomPreviewer();
        }

        return this._roomPreviewer;
    }

    get assets(): IAssetLibrary | null 
    {
        return super.assets;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get connection()
    get connection(): IConnection | null 
    {
        return this._communication?.connection ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get privateRoomSessionActive()
    // The backing field is _SafeStr_7595, set by onRoomSessionEvent() alongside roomSession.
    get privateRoomSessionActive(): boolean
    {
        return this._roomSession?.isPrivateRoom ?? false;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get tradingActive()
    // Hard-coded false until the inventory dependency landed; it answers for real now.
    get tradingActive(): boolean
    {
        return this._inventory?.tradingActive ?? false;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get imageGalleryHost()
    get imageGalleryHost(): string 
    {
        return this.getProperty('image.library.catalogue.url');
    }

    /**
     * The collectibles hub, built in the constructor above.
     *
     * Its *hub* half is real — product naming, the reward-box messages, the send/subscribe
     * plumbing. Its *view* half is not: the collectibles catalog tab is roughly 4,200 lines that
     * `CollectiblesController` still marks as owed at each entry point. Callers get honest names
     * regardless, which is what they were falling back on product codes for.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get collectorHub()
    get collectorHub(): ICollectorHub | null
    {
        return this._collectorHub;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_frontPageItems
    private _frontPageItems: FrontPageItem[] | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get frontPageItems()
    get frontPageItems(): FrontPageItem[] | null
    {
        return this._frontPageItems;
    }

    // DEVIATION: AS3 also answers false in the Builders Club catalog; the RPG fork has only NORMAL.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get multiplePurchaseEnabled()
    get multiplePurchaseEnabled(): boolean 
    {
        return this.getBoolean('catalog.multiple.purchase.enabled');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get bundleDiscountRuleset()
    private _bundleDiscountRuleset: BundleDiscountRuleset | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get giftWrappingConfiguration()
    private _giftWrappingConfiguration: GiftWrappingConfiguration | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::refreshFurniData()
    private _furniDataNeedsRefresh: boolean = false;

    // DEVIATION: AS3 answers false in the Builders Club catalog; the RPG fork has only NORMAL.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get bundleDiscountEnabled()
    get bundleDiscountEnabled(): boolean 
    {
        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get bundleDiscountRuleset()
    get bundleDiscountRuleset(): BundleDiscountRuleset | null
    {
        return this._bundleDiscountRuleset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get giftWrappingConfiguration()
    get giftWrappingConfiguration(): GiftWrappingConfiguration | null
    {
        return this._giftWrappingConfiguration;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getGiftWrappingConfiguration()
    private getGiftWrappingConfiguration(): void
    {
        this.connection?.send(new GetGiftWrappingConfigurationComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onGiftWrappingConfiguration()
    private onGiftWrappingConfiguration(event: IMessageEvent): void
    {
        this._giftWrappingConfiguration = new GiftWrappingConfiguration(
            event.parser as GiftWrappingConfigurationEventParser | null
        );
    }

    /**
     * The catalog was republished server-side. AS3 flags the furni data as stale rather than
     * refetching immediately - the refetch happens on the next `init()`, so a user who never
     * reopens the catalog never pays for it.
     */
    /**
     * The NFT store's answer to a purchase: an alert on failure, a notification naming the item on
     * success. Either way the confirmation dialog is taken down — AS3 disposes it after the branch,
     * not inside it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onNftStorePurchase()
    private onNftStorePurchase = (event: IMessageEvent): void =>
    {
        const parser = event.parser as NftStorePurchaseMessageParser | null;

        if(parser == null) return;

        if(parser.result === NftStorePurchaseMessageParser.RESULT_ERROR)
        {
            this._windowManager?.alert(
                '${catalog.alert.purchaseerror.title}',
                '${notification.nft.purchase.error}',
                0,
                null
            );
        }
        else
        {
            const productInfo = this._purchaseConfirmationDialog?.getNftImage()?.productInfo ?? null;
            const productName = this._collectorHub?.getProductName(productInfo) ?? '';

            this._notifications?.addItem(
                this._localization?.getLocalizationWithParams(
                    'notifications.text.purchase.ok', '', 'productName', productName
                ) ?? '',
                'info',
                'icon_curator_stamp_large_png'
            );
        }

        if(this._purchaseConfirmationDialog != null)
        {
            this._purchaseConfirmationDialog.dispose();
            this._purchaseConfirmationDialog = null;
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onCatalogPublished()
    private onCatalogPublished(event: IMessageEvent): void
    {
        const parser = event.parser as CatalogPublishedMessageEventParser | null;

        if(parser?.newFurniDataHash && this._sessionDataManager)
        {
            this._sessionDataManager.newFurniDataHash = parser.newFurniDataHash;
        }

        this._furniDataNeedsRefresh = true;

        const wasVisible = this.mainWindowVisible();

        this.reset();

        if(wasVisible)
        {
            this._windowManager?.alert(
                '${catalog.alert.published.title}',
                '${catalog.alert.published.description}',
                0,
                this.alertDialogEventProcessor
            );
        }
        else if(this._notifications)
        {
            const description = this._localization?.getLocalization('catalog.alert.published.description') ?? '';

            this._notifications.addItem(description, 'info', 'if_icon_temp_png');
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::refreshFurniData()
    private refreshFurniData(): void
    {
        this._sessionDataManager?.refreshFurniData();
        this._furniDataNeedsRefresh = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::initBundleDiscounts()
    private initBundleDiscounts(): void
    {
        this.sendGetBundleDiscountRuleset();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::sendGetBundleDiscountRuleset()
    private sendGetBundleDiscountRuleset(): void
    {
        this.connection?.send(new GetBundleDiscountRulesetComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onBundleDiscountRulesetMessageEvent()
    private onBundleDiscountRulesetMessageEvent(event: IMessageEvent): void
    {
        const parser = event.parser as BundleDiscountRulesetMessageEventParser | null;

        if(!parser) return;

        this._bundleDiscountRuleset = parser.bundleDiscountRuleset;
        this._utils?.resolveBundleDiscountFlatPriceSteps();
    }

    /**
     * Field name DERIVED from its accessor `roomAdPurchaseData`, which is not obfuscated. Non-null
     * only while a room-ad page is open, and that is what switches `purchaseProduct()` over to
     * `PurchaseRoomAdMessageComposer`.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_4993
    private _roomAdPurchaseData: RoomAdPurchaseData | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get roomAdPurchaseData()
    get roomAdPurchaseData(): RoomAdPurchaseData | null
    {
        return this._roomAdPurchaseData;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::set roomAdPurchaseData()
    set roomAdPurchaseData(value: RoomAdPurchaseData | null)
    {
        this._roomAdPurchaseData = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get currentCatalogNavigator()
    get currentCatalogNavigator(): ICatalogNavigator | null 
    {
        return this.getCatalogNavigator(this._catalogType);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) => 
                {
                    this._windowManager = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) => 
                {
                    this._localization = manager;
                },
                false
            ),
            // AS3 declares this optional (`false`), and it must stay optional: the catalog boots
            // before the inventory in some flows, and a hard dependency on an IID nothing has
            // provided yet locks the component with no log at all.
            new ComponentDependency(
                IID_HabboInventory,
                (manager: IHabboInventory | null) =>
                {
                    this._inventory = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) =>
                {
                    this._sessionDataManager = manager;
                },
                false
            ),
            // Optional in AS3 too, and it has to stay that way: it is only read to seed the gift
            // dialog's name suggestions, and a hard dependency on an IID nothing has provided yet
            // locks the component with no log at all.
            // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::dependencies (IIDHabboFriendList)
            new ComponentDependency(
                IID_HabboFriendList,
                (manager: IHabboFriendList | null) =>
                {
                    this._friendList = manager;
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
            // Optional, as AS3 declares it: the only thing the catalog asks of the quest engine is
            // to open the achievements window from the `info_pixels` page's link.
            new ComponentDependency(
                IID_HabboQuestEngine,
                (engine: IHabboQuestEngine | null) =>
                {
                    this._questEngine = engine;
                },
                false
            ),
            // AS3 registers the two placement callbacks on this dependency, not by hand — which is
            // why they unsubscribe with the dependency. Deferred reads of the arrow properties:
            // this array is built inside the base Component constructor, before this class's own
            // field initializers have run (same reason as the groups dependency below).
            new ComponentDependency(
                IID_RoomEngine,
                (manager: IRoomEngine | null) =>
                {
                    this._roomEngine = manager;
                },
                false,
                [
                    {
                        type: RoomEngineObjectEvent.REOE_PLACED,
                        callback: (...args: unknown[]) => this.onObjectPlacedInRoom(args[0] as RoomEngineObjectPlacedEvent)
                    },
                    {
                        type: RoomEngineObjectEvent.REOE_PLACED_ON_USER,
                        callback: (...args: unknown[]) => this.onObjectPlaceOnUser(args[0] as RoomEngineObjectPlacedOnUserEvent)
                    }
                    ,
                    {
                        type: RoomEngineObjectEvent.REOE_SELECTED,
                        callback: (...args: unknown[]) => this.onObjectSelected(args[0] as RoomEngineObjectEvent)
                    }
                ]
            ),
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) => 
                {
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
            new ComponentDependency(
                IID_HabboTracking,
                (tracking: IHabboTracking | null) =>
                {
                    this._tracking = tracking;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboSoundManager,
                (soundManager: IHabboSoundManager | null) =>
                {
                    this._soundManager = soundManager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboNewNavigator,
                (navigator: IHabboNewNavigator | null) =>
                {
                    this._newNavigator = navigator;
                },
                false
            ),
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::dependencies
            // AS3 subscribes to IHabboGroupsManager's GSCIME_GUILD_VISUAL_SETTINGS_CHANGED event
            // with no plain setter (null) - only the event listener matters here. Currently dormant:
            // HabboGroupsManager never dispatches this event yet (the guild-settings management UI
            // that would fire it isn't ported), so onGuildVisualSettingsChanged() is real but
            // unreachable today, same as ClubBuyController.showConfirmation()'s documented gap.
            new ComponentDependency(
                IID_HabboGroupsManager,
                null,
                false,
                [
                    {
                        type: GuildSettingsChangedInManageEvent.GUILD_VISUAL_SETTINGS_CHANGED,
                        // Deferred read of this.onGuildVisualSettingsChanged: this array is built
                        // inside the base Component constructor, before this class's own arrow-
                        // function field initializers have run - a direct `this.onX` reference here
                        // would capture `undefined`. Wrapping it in a fresh closure defers the
                        // property read until the listener actually fires, by which point
                        // construction has completed (same reasoning as onHabboToolbarEvent above,
                        // which is safe only because it's read inside a nested setter callback).
                        callback: (...args: unknown[]) => this.onGuildVisualSettingsChanged(args[0] as GuildSettingsChangedInManageEvent)
                    }
                ]
            ),
            new ComponentDependency(
                IID_HabboNotifications,
                (notifications: IHabboNotifications | null) =>
                {
                    this._notifications = notifications;
                },
                false
            ),
            // Provided since `HabboAvatarEditorManager` landed. The IID is declared
            // `createIID<unknown>`, so the setter narrows here.
            new ComponentDependency(
                IID_HabboAvatarEditor,
                (avatarEditor: unknown) =>
                {
                    this._avatarEditor = (avatarEditor as IHabboAvatarEditor | null) ?? null;
                },
                false
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this.onRoomSessionEvent);
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this.onRoomSessionEvent);

                    this._roomSessionManager = manager;

                    manager?.sessionEvents.on(RoomSessionEvent.RSE_STARTED, this.onRoomSessionEvent);
                    manager?.sessionEvents.on(RoomSessionEvent.RSE_ENDED, this.onRoomSessionEvent);
                },
                false
            ),
            // What a chat-style offer's preview is drawn from — see
            // HabboCatalogUtils.showExtraOnProduct() and PrizeGridItem.
            new ComponentDependency(
                IID_HabboFreeFlowChat,
                (freeFlowChat: IHabboFreeFlowChat | null) =>
                {
                    this._freeFlowChat = freeFlowChat;
                },
                false
            ),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getFurnitureDataByName()
    getFurnitureDataByName(name: string, productType: string): IFurnitureData | null 
    {
        if(this._sessionDataManager == null) return null;

        if(productType === 's') return this._sessionDataManager.getFloorItemDataByName(name);

        if(productType === 'i') return this._sessionDataManager.getWallItemDataByName(name);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::furniDataReady()
    furniDataReady(): void
    {
        this._furnitureDataCache = this._sessionDataManager?.getFurniData(this) ?? null;
        this._newItemsNotificationEnabled = this.isNewItemsNotificationEnabled();
        this._searchIndexStale = true;
    }

    /**
     * AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_6471 / _SafeStr_10150 / _SafeStr_9864
     *
     * Names DERIVED: all three obfuscated in every tree. A `toggleCatalog()` call that arrived
     * before the product data was loaded, held until `productDataReady()` can replay it. The type
     * being non-null is the "something is pending" flag.
     */
    private _pendingToggleCatalogType: string | null = null;
    private _pendingToggleForceOpen: boolean = false;
    private _pendingToggleShowMainWindow: boolean = true;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::productDataReady()
    productDataReady(): void
    {
        this._productDataReady = true;
        this._searchIndexStale = true;
        this.events.emit(CatalogEvent.CATALOG_INITIALIZED, new CatalogEvent(CatalogEvent.CATALOG_INITIALIZED));

        // Only replay while the catalog still has no states: a toggle that has since succeeded by
        // another route must not be re-run. AS3 clears the stash *before* the call, so a second
        // failure re-stashes cleanly instead of recursing on a stale copy.
        if(this._catalogStates == null && this._pendingToggleCatalogType !== null)
        {
            const catalogType = this._pendingToggleCatalogType;
            const forceOpen = this._pendingToggleForceOpen;
            const showMainWindow = this._pendingToggleShowMainWindow;

            this._pendingToggleCatalogType = null;

            this.toggleCatalog(catalogType, forceOpen, showMainWindow);
        }
    }

    // AS3's HabboCatalog itself doubles as a config accessor (getBoolean/getProperty/propertyExists
    // are already inherited from Component, delegating to context.configuration - these two
    // mirror that same pattern for the two config methods Component doesn't already expose).
    // TS-only: no AS3 counterpart; Component's own config surface stops short of these two.
    interpolate(value: string): string
    {
        return this.context.configuration?.interpolate(value) ?? value;
    }

    updateUrlProtocol(url: string): string
    {
        return this.context.configuration?.updateUrlProtocol(url) ?? url;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getSellablePetPalettes()
    // Returns the cached palettes for a product code, or null after firing the request off - the
    // response arrives asynchronously via onSellablePetPalettes() and reaches the widget as a
    // CatalogWidgetSellablePetPalettesEvent. Callers treat null as "not known yet", not "none".
    getSellablePetPalettes(productCode: string): SellablePetPalette[] | null
    {
        const cached = this._sellablePetPalettes?.getValue(productCode) ?? null;

        if(cached != null) return cached.slice();

        this.connection?.send(new GetSellablePetPalettesComposer(productCode));

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::approveName()
    approveName(name: string, validationType: number): void
    {
        this.connection?.send(new ApproveNameMessageComposer(name, validationType));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onSellablePalettes()
    private onSellablePetPalettes(event: IMessageEvent): void
    {
        const parser = event.parser as SellablePetPalettesMessageEventParser | null;

        if(parser == null) return;

        const productCode = parser.productCode;
        const palettes = parser.sellablePalettes;

        this._sellablePetPalettes?.remove(productCode);

        if(palettes == null) return;

        this._sellablePetPalettes?.add(productCode, palettes.slice());

        if(this._catalogViewer != null && this._catalogViewer.currentPage != null)
        {
            this._catalogViewer.dispatchWidgetEvent(new CatalogWidgetSellablePetPalettesEvent(productCode, palettes.slice()));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onApproveNameResult()
    private onApproveNameResult(event: IMessageEvent): void
    {
        if(event == null || this._catalogViewer == null) return;

        const parser = event.parser as ApproveNameMessageParser | null;

        if(parser == null) return;

        this._catalogViewer.dispatchWidgetEvent(new CatalogWidgetApproveNameResultEvent(parser.result, parser.nameValidationInfo));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseWillBeGift()
    purchaseWillBeGift(isGift: boolean): void
    {
        this._purchaseWillBeGift = isGift;
    }

    /**
     * Buys `offerId` off page `pageId`.
     *
     * Room ads take a different composer entirely: when the pending `RoomAdPurchaseData` is for
     * this very offer, the purchase carries the room, the ad text and the event category instead
     * of a quantity. The expiry check before it downgrades a stale extension back to a fresh
     * purchase — an extension the server would reject anyway.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseProduct()
    purchaseProduct(pageId: number, offerId: number, extraParam: string = '', quantity: number = 1): void
    {
        const roomAd = this._roomAdPurchaseData;

        if(roomAd == null || roomAd.offerId !== offerId)
        {
            this.connection?.send(new PurchaseFromCatalogComposer(pageId, offerId, extraParam, quantity));

            return;
        }

        if(roomAd.extended && roomAd.expirationTime != null && roomAd.expirationTime.getTime() < new Date().getTime())
        {
            roomAd.extended = false;
        }

        this.connection?.send(new PurchaseRoomAdMessageComposer(
            pageId, offerId, roomAd.flatId, roomAd.name ?? '', roomAd.extended, roomAd.description, roomAd.categoryId
        ));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseOffer()
    purchaseOffer(offerId: number, extraParam: string = '', quantity: number = 1): void
    {
        const nodes = this.getCatalogNavigator('NORMAL')?.getNodesByOfferId(offerId, true);

        if(nodes != null && nodes.length > 0)
        {
            this.purchaseProduct(nodes[0].pageId, offerId, extraParam, quantity);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseVipMembershipExtension()
    purchaseVipMembershipExtension(offerId: number): void
    {
        this.connection?.send(new PurchaseVipMembershipExtensionComposer(offerId));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseBasicMembershipExtension()
    purchaseBasicMembershipExtension(offerId: number): void
    {
        this.connection?.send(new PurchaseBasicMembershipExtensionComposer(offerId));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseNftOffer()
    purchaseNftOffer(offerId: string, extraParam: string): void
    {
        this.connection?.send(new PurchaseNftOfferMessageComposer(offerId, extraParam));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseMintTokens()
    purchaseMintTokens(amount: number, currency: string): void
    {
        this.connection?.send(new PurchaseMintTokensMessageComposer(amount, currency));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::checkGiftable()
    checkGiftable(offer: IPurchasableOffer): void
    {
        this.connection?.send(new CheckGiftableMessageComposer(offer.offerId));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseProductAsGift()
    // No current caller: PurchaseConfirmationDialog.ts documents implementing only the base
    // "confirm and buy" path, not the gift-wrapping flow (box/ribbon selectors, receiver name) -
    // same category as purchaseVipMembershipExtension()/purchaseBasicMembershipExtension() above,
    // which are also real composer-senders reachable only once their calling UI is wired.
    purchaseProductAsGift(pageId: number, offerId: number, extraParam: string, receiverName: string, giftMessage: string | null, giftBoxProductId: number, boxType: number, ribbonType: number, showPurchaserName: boolean = false): void
    {
        this.connection?.send(new PurchaseProductAsGiftMessageComposer(
            pageId, offerId, extraParam, receiverName, giftMessage, giftBoxProductId, boxType, ribbonType, showPurchaserName
        ));
    }

    /**
     * AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_5631
     *
     * Name DERIVED: obfuscated in every tree. The page to reopen once the club purchase comes back
     * — non-null is also the signal that a purchase is in flight, which is what
     * `doNotCloseAfterVipPurchase()` tests.
     */
    private _pageToReopenAfterVipPurchase: string | null = null;

    /**
     * AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_6885
     *
     * Name DERIVED: obfuscated in every tree. A one-shot veto on the next `hideMainWindow()`, so
     * the club purchase flow can leave the catalog standing. It clears itself on use.
     */
    private _suppressNextHideMainWindow: boolean = false;

    /**
     * Arms the one-shot hide veto, but only if a page is actually remembered — a purchase that
     * never went through `rememberPageDuringVipPurchase()` still closes the catalog normally.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::doNotCloseAfterVipPurchase()
    doNotCloseAfterVipPurchase(): void
    {
        this._suppressNextHideMainWindow = this._pageToReopenAfterVipPurchase !== null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::forgetPageDuringVipPurchase()
    forgetPageDuringVipPurchase(): void
    {
        this._pageToReopenAfterVipPurchase = null;
        this._suppressNextHideMainWindow = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::sendRoomAdPurchaseInitiatedEvent()
    sendRoomAdPurchaseInitiatedEvent(): void
    {
        this.connection?.send(new RoomAdPurchaseInitiatedMessageComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getRoomAdsPurchaseInfo()
    // The reply (header 3787) is read by RoomAdsCatalogWidget, which subscribes to it directly
    // rather than through this class - it is the only consumer of the room list.
    getRoomAdsPurchaseInfo(): void
    {
        this.connection?.send(new GetRoomAdsPurchaseInfoMessageComposer());
    }

    /**
     * A page id that resolves to no node still remembers something — AS3 falls back to
     * `"frontpage"` rather than leaving the field null, because null would also switch off
     * `doNotCloseAfterVipPurchase()`.
     *
     * No caller yet: `PurchaseCatalogWidget`'s onBuyClub is not attached to a button in the ported
     * layouts, so this is reachable only once that button exists.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::rememberPageDuringVipPurchase()
    rememberPageDuringVipPurchase(pageId: number): void
    {
        const node = this.currentCatalogNavigator?.getNodeById(pageId) ?? null;

        this._pageToReopenAfterVipPurchase = node !== null ? node.pageName : 'frontpage';
    }

    /**
     * The offer currently being dragged out of the catalog into the room. Distinct from
     * `_placedOfferData` below: this one lives from the drag starting until the room object is
     * placed or the drag is cancelled.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_offerInFurniPlacing
    private _offerInFurniPlacing: IPurchasableOffer | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_offerPlacingCallbackReceiver
    private _offerPlacingCallbackReceiver: IDragAndDropDoneReceiver | null = null;

    /**
     * AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_5130
     *
     * Name DERIVED: obfuscated in every tree. It gates all three placement callbacks — a
     * REOE_PLACED that did not come from a catalog drag must not touch any of this state — and is
     * also what `onPurchaseOK()` reads to decide whether to fly the icon to the toolbar.
     */
    private _placingFurni: boolean = false;

    /**
     * AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_4676
     *
     * Name DERIVED: obfuscated in every tree. The ghost furni already standing in the room while
     * the purchase is in flight — see `PlacedObjectPurchaseData`.
     */
    private _placedOfferData: PlacedObjectPurchaseData | null = null;

    /**
     * Hands an offer to the room engine's object-inserter, so the next click in the room places it.
     * Note AS3 never involves `CatalogObjectMover` here — that class is the *widget*'s drag icon;
     * the catalog side of the flow is `initializeRoomObjectInsert()` plus the three placement
     * callbacks below.
     *
     * The window is hidden only once the insert is accepted, which is what keeps the catalog open
     * when the offer turns out not to be placeable.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::requestSelectedItemToMover()
    requestSelectedItemToMover(receiver: IDragAndDropDoneReceiver | null, offer: IPurchasableOffer, placeMany: boolean = false): void
    {
        if(!this.isDraggable(offer)) return;

        const product = offer.product;

        if(product === null) return;

        let category: number = 0;

        switch(product.productType)
        {
            case 's':
                category = RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE;
                break;
            case 'i':
                category = RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL;
                break;
        }

        // AS3 passes the offer id negated: the inserter keys placement previews by object id, and a
        // negative one cannot collide with a real room object's.
        const accepted = this._roomEngine?.initializeRoomObjectInsert(
            'catalog',
            -offer.offerId,
            category,
            product.productClassId,
            product.extraParam ? product.extraParam.toString() : '',
            null,
            -1,
            -1,
            null,
            placeMany
        ) ?? false;

        if(accepted)
        {
            this._offerInFurniPlacing = offer;
            this._offerPlacingCallbackReceiver = receiver;

            this.hideMainWindow();

            this._placingFurni = true;
        }
    }

    /**
     * Drops whatever the mover is holding. Called on every catalog open/close and page switch, so a
     * drag can never survive into an unrelated catalog state.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::cancelFurniInMover()
    cancelFurniInMover(): void
    {
        if(this._offerInFurniPlacing !== null)
        {
            this._roomEngine?.cancelRoomObjectInsert();

            this._placingFurni = false;
            this._offerInFurniPlacing = null;
        }
    }

    /**
     * Brings the catalog back after a drag ends. `showWindow` is false on the paths that are about
     * to re-arm the mover (place-many) or close the catalog themselves.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::resetObjectMover()
    private resetObjectMover(showWindow: boolean = true): void
    {
        if(showWindow && this._placingFurni)
        {
            // AS3 passes the state to both calls; this port's showMainWindow() already acts on the
            // active state's container, which is the same window for the same `_catalogType`.
            this.showMainWindow();
            this.dispatchRoomChangedToCatalogPage(this.getCatalogState(this._catalogType));
        }

        this._placingFurni = false;
        this._offerPlacingCallbackReceiver = null;
    }

    /**
     * Tells the open page its room context changed, so widgets gated on being in a room (the place
     * button) re-evaluate.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::dispatchRoomChangedToCatalogPage()
    private dispatchRoomChangedToCatalogPage(state: CatalogWindowState | null): void
    {
        if(state !== null && state.catalogViewer != null && state.catalogViewer.currentPage != null)
        {
            state.catalogViewer.currentPage.dispatchWidgetEvent(new CatalogWidgetRoomChangedEvent());
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::dispatchRoomChangedToCatalogPages()
    private dispatchRoomChangedToCatalogPages(): void
    {
        if(this._catalogStates == null) return;

        for(const state of this._catalogStates.values())
        {
            this.dispatchRoomChangedToCatalogPage(state);
        }
    }

    /**
     * The item landed somewhere in the room. AS3 immediately draws it locally at half alpha — the
     * ghost — and remembers where, so `itemAddedToInventory()` can turn it into the real placement
     * when the server confirms, or `resetPlacedOfferData()` can take it away again if it doesn't.
     *
     * A wall item whose class is floor/wallpaper/landscape is a decoration, not an object: it
     * "lands" on the floor or the wall rather than in the room, and applies through `updateRoom()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onObjectPlacedInRoom()
    private onObjectPlacedInRoom = (event: RoomEngineObjectPlacedEvent): void =>
    {
        if(!this._placingFurni || event.type !== RoomEngineObjectEvent.REOE_PLACED || event.placementSource !== 'catalog') return;

        this.resetPlacedOfferData(true);

        if(this._offerInFurniPlacing === null || this._offerInFurniPlacing.disposed)
        {
            this.resetObjectMover();

            return;
        }

        const category = event.category;
        const product = this._offerInFurniPlacing.product;
        const className = product?.furnitureData?.className ?? '';
        let placed: boolean;

        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            switch(className)
            {
                case 'floor':
                case 'wallpaper':
                case 'landscape':
                    placed = event.placedOnFloor || event.placedOnWall;
                    break;
                default:
                    placed = event.placedInRoom;
            }
        }
        else
        {
            placed = event.placedInRoom;
        }

        if(!placed)
        {
            this.resetObjectMover();

            return;
        }

        this._placedOfferData = new PlacedObjectPurchaseData(
            event.roomId,
            event.objectId,
            event.category,
            event.wallLocation,
            event.x,
            event.y,
            event.direction,
            this._offerInFurniPlacing
        );

        // Captured before the callback, as AS3 does (its Builders Club branch, removed in the RPG
        // fork, re-armed the mover through `requestSelectedItemToMover()`).
        // AS3 passes null as the second argument here; this port's interface types it `string`.
        const receiver = this._offerPlacingCallbackReceiver;

        receiver?.onDragAndDropDone(true, '');

        switch(this._catalogType)
        {
            case 'NORMAL':
                if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
                {
                    this._roomEngine?.addObjectFurniture(
                        event.roomId,
                        event.objectId,
                        product?.productClassId ?? 0,
                        new Vector3d(event.x, event.y, event.z),
                        new Vector3d(event.direction, 0, 0),
                        0,
                        new LegacyStuffData(),
                        NaN,
                        -1,
                        0,
                        0,
                        '',
                        true,
                        true,
                        -1
                    );
                }
                else if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
                {
                    switch(className)
                    {
                        case 'floor':
                        case 'wallpaper':
                        case 'landscape':
                            this.updateRoom(className, product?.extraParam ?? '');
                            break;
                        default:
                            // AS3 multiplies the direction by 45 here and nowhere else: wall items
                            // carry a direction index, the room object wants degrees.
                            this._roomEngine?.addObjectWallItem(
                                event.roomId,
                                event.objectId,
                                product?.productClassId ?? 0,
                                new Vector3d(event.x, event.y, event.z),
                                new Vector3d(event.direction * 45, 0, 0),
                                0,
                                event.instanceData ?? '',
                                0,
                                0,
                                '',
                                -1
                            );
                    }
                }

                // Half alpha is what makes it read as "not yours yet".
                {
                    const object = this._roomEngine?.getRoomObject(event.roomId, event.objectId, event.category) as IRoomObjectController | null;

                    object?.getModelController().setNumber(RoomObjectVariableEnum.FURNITURE_ALPHA_MULTIPLIER, 0.5);
                }

                break;
        }
    };

    /**
     * Dropping an offer onto a user is the drag-to-gift gesture: nothing is placed, the receiver is
     * told whose avatar it landed on, and the mover closes without restoring the catalog window
     * (`resetObjectMover(false)`) because `cancelFurniInMover()` follows immediately.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onObjectPlaceOnUser()
    private onObjectPlaceOnUser = (event: RoomEngineObjectPlacedOnUserEvent): void =>
    {
        if(!this._placingFurni || event.type !== RoomEngineObjectEvent.REOE_PLACED_ON_USER) return;

        this.resetPlacedOfferData(true);

        if(this._offerInFurniPlacing === null || this._offerInFurniPlacing.disposed)
        {
            this.resetObjectMover();

            return;
        }

        const userData = this.getUserDataForEvent(event);

        this._offerPlacingCallbackReceiver?.onDragAndDropDone(true, userData?.name ?? '');

        this.resetObjectMover(false);
        this.cancelFurniInMover();
    };

    /**
     * Any room object was clicked. Only an avatar matters: it raises `CATALOG_USER_SELECTED` for
     * whoever wants it.
     */
    // DEVIATION: AS3 first builds the BUILDERS_CLUB index lazily on the first click in the room
    //   (when `builders.club.enabled`). The RPG fork removed the Builders Club.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onObjectSelected()
    private onObjectSelected = (event: RoomEngineObjectEvent): void =>
    {
        if(event == null) return;

        if(event.type !== RoomEngineObjectEvent.REOE_SELECTED || event.category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) return;

        const userData = this.getUserDataForEvent(event);

        if(userData === null) return;

        this.events.emit(
            CatalogEvent.CATALOG_USER_SELECTED,
            new CatalogUserEvent(CatalogEvent.CATALOG_USER_SELECTED, userData.webID, userData.name)
        );
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getUserDataForEvent()
    private getUserDataForEvent(event: RoomEngineObjectEvent): IUserData | null
    {
        const session = this._roomSessionManager?.getSession(event.roomId) ?? null;

        return session?.userDataManager?.getUserDataByIndex(event.objectId) ?? null;
    }

    /**
     * The floor/wallpaper/landscape trio is one room update in AS3: changing any one of them has to
     * resend the other two, so each is read back off the room instance first. `'reset'` (and any
     * unknown value) re-applies all three unchanged, which is how the ghost decoration is undone.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::updateRoom()
    private updateRoom(type: string, value: string): void
    {
        if(this._roomEngine === null) return;

        const activeRoomId = this._roomEngine.activeRoomId;
        let wallType = this._roomEngine.getRoomStringValue(activeRoomId, RoomObjectVariableEnum.ROOM_WALL_TYPE);
        let floorType = this._roomEngine.getRoomStringValue(activeRoomId, RoomObjectVariableEnum.ROOM_FLOOR_TYPE);
        let landscapeType = this._roomEngine.getRoomStringValue(activeRoomId, RoomObjectVariableEnum.ROOM_LANDSCAPE_TYPE);

        wallType = wallType && wallType.length > 0 ? wallType : '101';
        floorType = floorType && floorType.length > 0 ? floorType : '101';
        landscapeType = landscapeType && landscapeType.length > 0 ? landscapeType : '1.1';

        switch(type)
        {
            case 'floor':
                this._roomEngine.updateObjectRoom(activeRoomId, value, wallType, landscapeType, true);
                break;
            case 'wallpaper':
                this._roomEngine.updateObjectRoom(activeRoomId, floorType, value, landscapeType, true);
                break;
            case 'landscape':
                this._roomEngine.updateObjectRoom(activeRoomId, floorType, wallType, value, true);
                break;
            default:
                this._roomEngine.updateObjectRoom(activeRoomId, floorType, wallType, landscapeType, true);
        }
    }

    /**
     * Opens the buy dialog for one offer.
     *
     * `showConfirmation` is declared by AS3 and never read anywhere in its method body — a dead
     * parameter in the original client, kept so the pet widgets' eight-argument call matches the
     * real signature.
     *
     * `previewImage` is the opposite: a caller that has already rendered the thing being bought
     * (the pet widgets render a real pet portrait) hands it over, and the dialog uses it instead
     * of rendering its own preview.
     *
     * The gifting and LTD-raffle sub-flows are still missing from the dialog itself — see its own
     * file header.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showPurchaseConfirmation()
    showPurchaseConfirmation(
        offer: IPurchasableOffer,
        pageId: number,
        extraParam: string = '',
        quantity: number = 1,
        stuffData: IStuffData | null = null,
        receiverName: string | null = null,
        _showConfirmation: boolean = true,
        previewImage: ImageBitmap | null = null
    ): void
    {
        if(pageId === -12345678) 
        {
            const nodes = this.currentCatalogNavigator?.getNodesByOfferId(offer.offerId, true);

            if(nodes != null && nodes.length > 0) 
            {
                pageId = nodes[0]!.pageId;
            }
        }

        log.debug(`buy: ${[quantity, offer.offerId, extraParam]}`);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showPurchaseConfirmation()
        if(this.isHabbiconOfferOwned(offer))
        {
            this.showHabbiconAlreadyOwnedAlert();

            return;
        }

        // The balance is tested against what the user is about to spend, not the
        // unit price: buying 10 of a 5-credit offer costs 50. AS3 recomputes both
        // prices through calculateBundlePrice() before the two tests below, and
        // only when multiple purchase is enabled — otherwise quantity is always 1
        // and the unit price already is the total.
        let priceInCredits = offer.priceInCredits;
        let priceInActivityPoints = offer.priceInActivityPoints;

        if(this.multiplePurchaseEnabled)
        {
            priceInCredits = this._utils.calculateBundlePrice(true, offer.priceInCredits, quantity);
            priceInActivityPoints = this._utils.calculateBundlePrice(true, offer.priceInActivityPoints, quantity);
        }

        // A snow-war token bundle skips both balance tests. It is priced in credits *and* in
        // activity points, and the player is expected to have one or the other — testing both
        // would reject a purchase they can afford.
        const isGameTokens = offer instanceof GameTokensOffer;

        if(!isGameTokens && priceInCredits > 0 && priceInCredits > this._purse.credits)
        {
            this.showNotEnoughCreditsAlert();

            return;
        }

        if(!isGameTokens
            && priceInActivityPoints > 0
            && priceInActivityPoints > this._purse.getActivityPointsForType(offer.activityPointType))
        {
            this.showNotEnoughActivityPointsAlert(offer.activityPointType);

            return;
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showPurchaseConfirmation()
        // AS3 splits here: furniture-shaped offers get the generic dialog, a ClubBuyOfferData goes
        // to the club buy controller instead. Note a gift always takes the generic path, even for a
        // club offer — that is why _purchaseWillBeGift is part of the first test, not a separate one.
        // All five of AS3's offer classes are admitted. Three of them are not catalog offers at
        // all — MintTokenPurchaseOffer and NftStorePurchaseOffer come from the collectibles shop,
        // GameTokensOffer from the snow-war lobby — and each was reaching neither branch, and so
        // doing nothing, until it was listed here.
        if(offer instanceof Offer
            || this._purchaseWillBeGift
            || offer instanceof MintTokenPurchaseOffer
            || offer instanceof NftStorePurchaseOffer
            || offer instanceof GameTokensOffer)
        {
            if(this._purchaseConfirmationDialog == null || this._purchaseConfirmationDialog.disposed)
            {
                this._purchaseConfirmationDialog = new PurchaseConfirmationDialog(this, this._windowManager!);
            }

            // The friend names seed the gift dialog's receiver suggestions, and the receiver name
            // comes from the caller when it has one — the "gift to this user" entry points pass
            // it — otherwise from whatever `giftReceiver` was last set to.
            this._purchaseConfirmationDialog.showOffer(
                offer, pageId, extraParam, quantity, stuffData, this._purchaseWillBeGift, previewImage,
                this._friendList?.getFriendNames() ?? [],
                receiverName ?? (this._giftReceiver !== '' ? this._giftReceiver : null)
            );
        }
        else if(offer instanceof ClubBuyOfferData)
        {
            if(pageId === -1)
            {
                const node = this.currentCatalogNavigator?.getNodeByName('hc_membership') ?? null;

                if(node !== null)
                {
                    pageId = node.pageId;
                }
            }

            if(pageId >= 0)
            {
                this.getClubBuyController()?.showConfirmation(offer, pageId);
            }
        }

        // The flag is consumed here, not in the dialog: it is set by `purchaseAsGift()` just
        // before this call, and left standing it would make every later purchase on this instance
        // read as a gift too.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showPurchaseConfirmation()
        if(this._purchaseWillBeGift)
        {
            this._purchaseConfirmationDialog?.turnIntoGifting();
            this._purchaseWillBeGift = false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getSeasonalCurrencyActivityPointType()
    getSeasonalCurrencyActivityPointType(): number 
    {
        return this.getInteger('seasonalcurrencyindicator.currency', 1);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::setLeftPaneVisibility()
    public setLeftPaneVisibility(visible: boolean): void
    {
        if(!this._mainWindow) return;

        const navigationContainer = this._mainWindow.findChildByName('navigationContainer');

        if(navigationContainer) 
        {
            navigationContainer.visible = visible;
        }

        const searchContainer = this._mainWindow.findChildByName('searchContainer');

        if(searchContainer) 
        {
            searchContainer.visible = visible;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::redeemVoucher()
    public redeemVoucher(voucher: string): void
    {
        this.connection?.send(new RedeemVoucherMessageComposer(voucher));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::loadCatalogPage()
    public loadCatalogPage(pageId: number, offerId: number, catalogType: string): void
    {
        this.setCatalogBusy(catalogType, true);

        const state = this.getCatalogState(catalogType);

        if(state != null) state.lastPageRequestId = pageId;

        this.connection?.send(new GetCatalogPageComposer(pageId, offerId, catalogType));
    }

    /**
	 * Puts one catalog type's window into (or out of) its loading state.
	 *
	 * @param catalogType - The catalog type whose window to mark
	 * @param busy - Whether a page request is in flight
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::setCatalogBusy()
    private setCatalogBusy(catalogType: string, busy: boolean): void
    {
        const state = this.getCatalogState(catalogType);

        if(state == null || state.mainContainer == null) return;

        state.mainContainer.caption = busy
            ? '${generic.loading}'
            : '${catalog.title}';

        const mask = state.mainContainer.findChildByName('search_waiting_for_results_mask');

        if(mask != null) mask.visible = busy;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::set isBusy()
    public set isBusy(value: boolean)
    {
        this.setCatalogBusy(this._catalogType, value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::sendGetProductOffer()
    public sendGetProductOffer(offerId: number): void
    {
        this.connection?.send(new GetProductOfferComposer(offerId));
    }

    /**
	 * The limited-edition item was bought out from under this purchase
	 *
	 * Tells the player, then drops the confirmation dialog: the offer it was showing no longer
	 * exists, so there is nothing left to confirm.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onLimitedEditionSoldOut()
    private onLimitedEditionSoldOut = (_event: IMessageEvent): void =>
    {
        this._windowManager?.alert(
            '${catalog.alert.limited_edition_sold_out.title}',
            '${catalog.alert.limited_edition_sold_out.message}',
            0,
            this.alertDialogEventProcessor
        );

        if(this._purchaseConfirmationDialog != null)
        {
            this._purchaseConfirmationDialog.dispose();
            this._purchaseConfirmationDialog = null;
        }
    };

    /**
	 * The gift was addressed to a player who does not exist
	 *
	 * Unlike the sold-out case the dialog stays open — the name is correctable.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onGiftReceiverNotFound()
    private onGiftReceiverNotFound = (_event: IMessageEvent): void =>
    {
        this._purchaseConfirmationDialog?.receiverNotFound();
    };

    /**
	 * One refreshed offer came back — select it on the open page
	 *
	 * This is the reply to `sendGetProductOffer()`. Its first job is the limited-edition counter:
	 * a unique item's remaining count is only current at the moment it is asked for, so the page
	 * is told before anything else happens. Then the offer is rebuilt and handed to the page as a
	 * selection, which is what draws it in the product view.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onProductOffer()
    private onProductOffer = (event: IMessageEvent): void =>
    {
        const parser = event.parser as ProductOfferMessageEventParser | null;
        const offerData = parser?.offerData ?? null;

        if(!offerData || offerData.products.length === 0) return;

        const state = this.getCatalogState(this._catalogType);
        const viewer = state?.catalogViewer ?? null;
        const currentPage = viewer?.currentPage ?? null;

        const firstProduct = offerData.products[0];

        if(currentPage != null && firstProduct.uniqueLimitedItem)
        {
            currentPage.updateLimitedItemsLeft(offerData.offerId, firstProduct.uniqueLimitedItemsLeft);
        }

        // Same reconstruction the catalog-page reply does, product for product.
        const products = offerData.products.map((productData) =>
        {
            const furnitureData = this.getFurnitureData(productData.furniClassId, productData.productType);

            return new Product(
                productData.productType,
                productData.furniClassId,
                productData.extraParam,
                this.getProductCountOverride(offerData.localizationId, furnitureData, productData.productCount),
                this.getProductData(offerData.localizationId),
                furnitureData,
                this,
                productData.uniqueLimitedItem,
                productData.uniqueLimitedItemSeriesSize,
                productData.uniqueLimitedItemsLeft
            );
        });

        const offer = new Offer(
            offerData.offerId,
            offerData.localizationId,
            offerData.isRent,
            offerData.priceInCredits,
            offerData.priceInActivityPoints,
            offerData.activityPointType,
            offerData.priceInSilver,
            offerData.giftable,
            offerData.clubLevel,
            products,
            offerData.bundlePurchaseAllowed,
            this
        );

        // An offer that does not belong in the catalog this client is showing is dropped rather
        // than displayed — the reply can arrive after the user has switched catalog type.
        if(!this.isOfferCompatibleWithCurrentMode(offer))
        {
            offer.dispose();

            return;
        }

        if(currentPage == null)
        {
            // Nothing to select it on. AS3 leaves the offer to the garbage collector here; this
            // port disposes it, since `Offer` holds a product container.
            offer.dispose();

            return;
        }

        offer.page = currentPage;

        currentPage.dispatchWidgetEvent(new SelectProductEvent(offer));

        // A wall item carries its own extra parameter (the wallpaper/floor code), which the
        // purchase widget needs before it can price the selection.
        if(offer.product && offer.product.productType === 'i')
        {
            currentPage.dispatchWidgetEvent(new SetExtraPurchaseParameterEvent(offer.product.extraParam));
        }

        // Re-point an in-flight placement at the newly selected offer. Both halves of AS3's guard
        // matter: `_placingFurni` says a placement is running, and the non-null check says one was
        // actually recorded — without it a selection made after `resetPlacedOfferData()` would
        // revive a finished placement.
        if(this._placingFurni && this._offerInFurniPlacing) this._offerInFurniPlacing = offer;
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getRecyclerStatus()
    public getRecyclerStatus(): void
    {
        this.connection?.send(new GetRecyclerStatusMessageComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getRecyclerPrizes()
    public getRecyclerPrizes(): void
    {
        this.connection?.send(new GetRecyclerPrizesMessageComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::sendRecycleItems()
    public sendRecycleItems(items: number[]): void
    {
        this.connection?.send(new RecycleItemsMessageComposer(items));
    }

    // DEVIATION: AS3 first forces "NORMAL" for anyone who is neither staff nor has the Builders Club
    //   enabled. The RPG fork removed the Builders Club, so "NORMAL" is the only type there is.
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::toggleCatalog()
    public toggleCatalog(catalogType: string, forceOpen: boolean = false, showMainWindow: boolean = true): void 
    {
        this.cancelFurniInMover();

        // AS3 gates on the states, not on a window: init() is what builds them.
        if(this._catalogStates == null)
        {
            if(!this.init(catalogType))
            {
                // init() fails while product data is still loading. AS3 stashes the whole call
                // rather than dropping it, so the click that arrived too early still opens the
                // catalog once productDataReady() fires.
                this._pendingToggleCatalogType = catalogType;
                this._pendingToggleForceOpen = forceOpen;
                this._pendingToggleShowMainWindow = showMainWindow;

                return;
            }
        }

        this._pendingToggleCatalogType = null;

        // Read the outgoing state before switching, so a type change can be detected
        // by identity and the window being left behind can be hidden.
        const previousState = this.getCatalogState(this._catalogType);
        const state = this.setActiveCatalogState(catalogType);
        const catalogTypeChanged = previousState != null && previousState !== state;

        if(state.catalogNavigator == null || !state.catalogNavigator.initialized)
        {
            this.refreshCatalogIndex(catalogType);
        }

        // Each type owns its window, so switching leaves the other one on the desktop
        // unless it is taken down explicitly. AS3 does this as hideMainWindow(old, false)
        // — the `false` being why the viewer is not told the catalog closed: it did not,
        // it moved.
        if(catalogTypeChanged && previousState?.mainContainer != null && previousState.mainContainer.parent != null)
        {
            const desktop = this._windowManager?.getDesktop(1) as unknown as IWindowContainer | null;

            desktop?.removeChild(previousState.mainContainer);
        }

        if(!this.mainWindowVisible() || forceOpen || catalogTypeChanged)
        {
            // Opening the catalog is what "seeing" the new additions means: the badge goes out
            // here and the server is told, so it does not come back on the next login.
            if(this._newAdditionsAvailable)
            {
                this._newAdditionsAvailable = false;

                this.events.emit(CatalogEvent.CATALOG_NEW_ITEMS_HIDE, new CatalogEvent(CatalogEvent.CATALOG_NEW_ITEMS_HIDE));
                this.markNewAdditionPageOpened();
            }

            this.showMainWindow();
        }
        else if(!WindowToggle.isHiddenByOtherWindows(this._mainWindow!)) 
        {
            this.hideMainWindow();
        }

        if(this.mainWindowVisible()) 
        {
            this._mainWindow!.activate();

            const searchInput = this._mainWindow!.findChildByName('search.input') as unknown as ITextFieldWindow | null;

            if(searchInput)
            {
                searchInput.focus();
                searchInput.setSelection(0, searchInput.text.length);
            }

            this._tracking?.trackGoogle('catalogue', 'open');
        }

        this.refreshCatalogWindowChrome(catalogType, this._mainWindow);

        if(catalogTypeChanged && this.currentCatalogNavigator != null) 
        {
            if(showMainWindow) 
            {
                this.currentCatalogNavigator.deactivateCurrentNode();
                this.currentCatalogNavigator.loadFrontPage();
            }

            this.currentCatalogNavigator.showIndex();
            this._catalogViewer?.setForceRefresh();
        }

        // Flag 9 of the crash report's error context, and the only thing that writes it: a report
        // filed from here says whether the catalog was on screen. AS3 dispatches this in the same
        // `if(mainWindowVisible())` as the recycler branch below; kept separate because this port
        // guards that branch on `_recycler` being built, and the flag must be set either way.
        // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::toggleCatalog()
        this.events.emit(this.mainWindowVisible()
            ? HabboCatalogTrackingEvent.HABBO_CATALOG_TRACKING_EVENT_OPEN
            : HabboCatalogTrackingEvent.HABBO_CATALOG_TRACKING_EVENT_CLOSE);

        // Opening the catalog *on* the recycler page starts the machine; leaving it cancels a run
        // in progress. Note which viewer each branch asks: on open it is the current one, on close
        // it is the state being *left* — by then the active state may already be the other catalog
        // type, whose page has nothing to do with recycling.
        if(this._recycler != null)
        {
            if(this.mainWindowVisible())
            {
                if(this._catalogViewer?.getCurrentLayoutCode() === 'recycler') this._recycler.activate();
            }
            else if(previousState?.catalogViewer?.getCurrentLayoutCode() === 'recycler')
            {
                this._recycler.cancel();
            }

            // Unconditional in AS3, and after the branch above so it sees the new state: this is
            // what turns the inventory's recycle badges on and off.
            this.setupInventoryForRecycler(this._recycler.active && this.mainWindowVisible());
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::openCatalog()
    public openCatalog(): void
    {
        this.cancelFurniInMover();
        this.toggleCatalog('NORMAL', true);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::openCatalogPage()
    public openCatalogPage(pageName: string, catalogType: string | null = null): void
    {
        this.cancelFurniInMover();
        this.toggleCatalog(catalogType ?? 'NORMAL', true, false);

        if(!this._initialized || this._catalogNavigators == null || !this.currentCatalogNavigator!.initialized) 
        {
            this._requestedPage.requestByName = pageName;

            return;
        }

        this.currentCatalogNavigator!.openPage(pageName);
    }

    /**
     * Opens the room-ad page with the current room's ad already filled in, for extending it.
     *
     * The purchase data is built *before* the page opens, because `RoomAdsCatalogWidget` reads it
     * on init to decide whether it is in extend mode. The trailing `getRoomAdsPurchaseInfo()` is
     * conditional for a reason: if the requested page was already the open one, no page load
     * follows and therefore no widget init, so nothing else would ask the server for the rooms.
     *
     * The parameter names come from the AS3 signature's only caller
     * (`HabboNavigator.as::openCatalogRoomAdsExtendPage()`); the declaration itself is positional.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openRoomAdCatalogPageInExtendedMode()
    public openRoomAdCatalogPageInExtendedMode(
        pageName: string,
        eventName: string,
        eventDescription: string,
        roomName: string,
        expiration: Date,
        categoryId: number
    ): void
    {
        const catalogState = this.getCatalogState('NORMAL');
        const lastPageRequestId = catalogState == null ? -1 : catalogState.lastPageRequestId;
        const purchaseData = new RoomAdPurchaseData();

        purchaseData.name = eventName;
        purchaseData.extended = true;
        purchaseData.extendedFlatId = this._roomEngine?.activeRoomId ?? 0;
        purchaseData.description = eventDescription;
        purchaseData.flatId = this._roomEngine?.activeRoomId ?? 0;
        purchaseData.roomName = roomName;
        purchaseData.expirationTime = expiration;
        purchaseData.categoryId = categoryId;

        this._roomAdPurchaseData = purchaseData;

        this.openCatalogPage(pageName);

        const node = this.currentCatalogNavigator?.getNodeByName(pageName) ?? null;

        if(node != null && node.pageId === lastPageRequestId) this.getRoomAdsPurchaseInfo();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::openCatalogPageById()
    public openCatalogPageById(pageId: number, offerId: number, catalogType: string): void 
    {
        if(this._initialized && this._catalogNavigators != null && this.getCatalogNavigator(catalogType)?.initialized) 
        {
            this.toggleCatalog(catalogType, true, false);
            this._catalogViewer?.setForceRefresh();
            this.currentCatalogNavigator!.openPageById(pageId, offerId);
        }
        else 
        {
            this.toggleCatalog(catalogType);
            this._requestedPage.requestById = pageId;
            this._requestedPage.requestedOfferId = offerId;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::openCatalogPageByOfferId()
    public openCatalogPageByOfferId(offerId: number, catalogType: string): void 
    {
        this.openCatalogPageById(-12345678, offerId, catalogType);
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openInventoryCategory()
    public openInventoryCategory(category: string): void 
    {
        this.context.createLinkEvent(`inventory/open/${category}`);
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openCreditsHabblet()
    public openCreditsHabblet(): void 
    {
        this.context.createLinkEvent('habblet/open/credits');
    }

    /**
     * The three recycler bridges. Each was a stub returning AS3's own "nothing happened" value,
     * because the catalog had no inventory reference at all — that was the real blocker, and the
     * only one of this cluster that was not already solved elsewhere.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::setupInventoryForRecycler()
    public setupInventoryForRecycler(enabled: boolean): void
    {
        this._inventory?.setupRecycler(enabled);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::requestInventoryFurniToRecycler()
    public requestInventoryFurniToRecycler(): number
    {
        return this._inventory?.requestSelectedFurniToRecycler() ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::returnInventoryFurniFromRecycler()
    public returnInventoryFurniFromRecycler(itemId: number): boolean
    {
        return this._inventory?.returnInventoryFurniFromRecycler(itemId) ?? false;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getProductData()
    public getProductData(localizationId: string): IProductData | null 
    {
        return this._sessionDataManager?.getProductData(localizationId) ?? null;
    }

    // The decompiled source computes the result into a local but always `return null`s
    // instead of returning it - reconstructed to return the looked-up data.
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getFurnitureData()
    public getFurnitureData(classId: number, productType: string): IFurnitureData | null 
    {
        if(productType === 's') return this._sessionDataManager?.getFloorItemData(classId) ?? null;
        if(productType === 'i') return this._sessionDataManager?.getWallItemData(classId) ?? null;

        return null;
    }

    /**
	 * Overrides the product count the server sent, for two bundles it gets wrong.
	 *
	 * Hardcoded in AS3 exactly as it is here — the two `wf_storage_*_bd` bundles
	 * ship five items but arrive with a different count, and the client patches
	 * it on the way in. Every other offer keeps the server's number.
	 *
	 * @param localizationId - The offer's localization id
	 * @param furnitureData - The product's furniture data, or null
	 * @param productCount - The count the server sent
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getProductCountOverride()
    private getProductCountOverride(localizationId: string, furnitureData: IFurnitureData | null, productCount: number): number
    {
        if(localizationId === 'wf_storage_furni_bd' && furnitureData?.className === 'wf_storage_furni1') return 5;
        if(localizationId === 'wf_storage_coins_bd' && furnitureData?.className === 'wf_storage_coins2') return 5;

        return productCount;
    }

    /**
     * The icon for a wearable effect, by effect id.
     *
     * AS3 reads it out of the *inventory's* asset library, not the catalog's; this port has one
     * library behind `getAssetByName()`, so the distinction does not survive. AS3 also asks for
     * `fx_icon_N_png` — the `_png` suffix is the AS3 field name, and this port registers images
     * under the bare basename (see `App.ts::readImageAssets`).
     *
     * AS3 answers a missing icon with a 1x1 white bitmap; null is the equivalent here, and every
     * caller in the port already null-checks.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getPixelEffectIcon()
    public getPixelEffectIcon(effectId: number): ImageBitmap | null
    {
        return this.getIconBitmap(`fx_icon_${effectId}`);
    }

    /**
     * The Habbo Club icon, shown for every subscription product.
     *
     * `productId` is accepted and unused — AS3 takes it and looks up the one `icon_hc` asset
     * regardless.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getSubscriptionProductIcon()
    public getSubscriptionProductIcon(_productId: number): ImageBitmap | null
    {
        return this.getIconBitmap('icon_hc');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getMintTokenProductIcon()
    public getMintTokenProductIcon(): ImageBitmap | null
    {
        return this.getIconBitmap('minting_token_large');
    }

    /**
     * Closes the confirmation dialog once a stamp purchase has been answered.
     *
     * Guarded on the product type rather than closing whatever is open: `MintInventoryListTab` calls
     * this from the balance message, and the tab asks for that balance when it opens as well as
     * after a purchase — so an unguarded close would shut a dialog the player opened somewhere else.
     */
    // DEVIATION: the AS3 has no counterpart and needs one. `_SafeStr_4602` is touched in 18 places
    //   in HabboCatalog.as and not one of them is the mint-token path, so the dialog that
    //   `onBuyStampsClicked` opens is never closed — and `onBuyButtonClick` disables Buy and Cancel
    //   before sending, leaving two dead buttons and a close cross. The sibling purchase does have
    //   one (`onNftStorePurchase` disposes it on the answer), which is the shape copied here.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onNftStorePurchase()
    public closeMintTokenPurchaseConfirmation(): void
    {
        if(this._purchaseConfirmationDialog?.productType !== ProductTypeEnum.PRODUCT_TYPE_MINT_TOKEN) return;

        this._purchaseConfirmationDialog.dispose();
        this._purchaseConfirmationDialog = null;
    }

    // TS-only: the shared body of the three icon getters above. AS3 clones the BitmapData at each
    // of them because a BitmapData is mutable and the caller may draw on it; an ImageBitmap is
    // immutable, so the library's own object is handed out directly.
    private getIconBitmap(assetName: string): ImageBitmap | null
    {
        const asset = this.assets?.getAssetByName(assetName) ?? null;

        if(asset === null)
        {
            log.warn(`Catalog icon "${assetName}" is not in the asset library`);

            return null;
        }

        return AssetBitmap.resolveSync(asset.content);
    }

    /**
     * Five independent gates, all of which AS3 packs into one expression: the config flag, being in
     * a room at all, the page allowing drags, having the rights to place here (room ownership, or
     * group-room rights), and the offer being a single placeable object — bundles, multi-offers,
     * effects (`e`) and Habbicons (`h`) are not draggable.
     */
    // DEVIATION: AS3 also accepts a BUILDERS_CLUB catalog whose Builders Club placement status allows
    //   it. The RPG fork removed the Builders Club, so only the NORMAL rights test remains.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::isDraggable()
    public isDraggable(offer: IPurchasableOffer): boolean
    {
        if(!this.getBoolean('catalog.drag_and_drop') || this._roomSession === null) return false;

        const currentPage = this._catalogViewer?.currentPage ?? null;

        if(currentPage !== null && !currentPage.allowDragging) return false;

        const allowedHere = this._catalogType === 'NORMAL'
            && (this._roomSession.isRoomOwner || (this._roomSession.isGuildRoom && this._roomSession.roomControllerLevel >= 2));

        if(!allowedHere) return false;

        return offer.pricingModel !== 'pricing_model_bundle'
            && offer.pricingModel !== 'pricing_model_multi'
            && offer.product !== null
            && offer.product.productType !== 'e'
            && offer.product.productType !== 'h';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onRoomSessionEvent()
    private onRoomSessionEvent = (event: RoomSessionEvent): void =>
    {
        switch(event.type)
        {
            case RoomSessionEvent.RSE_STARTED:
                this._roomSession = event.session;

                // AS3 tells the recycler in both branches (`_SafeStr_4719.setRoomSessionActive()`),
                // and the port had dropped both calls: `RecyclerLogic.setRoomSessionActive()` was
                // fully ported and reached by nothing. Leaving a room therefore left the recycler
                // still holding its items with a stale button, and the "you must be in your own
                // room" warning could never fire.
                if(this._recycler !== null) this._recycler.setRoomSessionActive(true);
                break;

            case RoomSessionEvent.RSE_ENDED:
                this._roomSession = null;

                if(this._recycler !== null) this._recycler.setRoomSessionActive(false);
                break;
        }

        // AS3 runs this for *both* cases, outside the switch: entering or leaving a room changes
        // what the open page may offer (placement), and `isDraggable()` reads
        // the same session state.
        this.dispatchRoomChangedToCatalogPages();
    };

    /**
     * Puts a catalog preview image on `target`, fetching it first if the library does not have it.
     *
     * The cache miss is the interesting half: AS3 returns *without touching the target* and lets
     * the caller's own callback finish the job once the download lands. So a miss leaves the
     * element as it was rather than blanking it, and a caller that passes no callback simply warms
     * the cache for next time.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::setImageFromAsset()
    public setImageFromAsset(target: unknown, assetName: string | null, onAssetReady?: ((...args: unknown[]) => void) | null): void
    {
        if(!assetName || !this.assets) return;

        const asset = this.assets.getAssetByName(assetName);

        if(asset == null)
        {
            this.retrievePreviewAsset(assetName, onAssetReady ?? null);

            return;
        }

        if(!target) return;

        HabboCatalog.setElementImageCentered(target as IWindow, AssetBitmap.resolveSync(asset.content));
    }

    /**
     * Puts a bitmap in the middle of a window rather than in its top-left corner.
     *
     * AS3 allocates a BitmapData the size of the element, clears it and `copyPixels()` the source
     * into the centre; the same thing here is an OffscreenCanvas plus
     * `transferToImageBitmap()`, which is what keeps it synchronous — `createImageBitmap()` would
     * make every caller async for a blit that is already in CPU memory.
     *
     * `height` overrides the element's own when the caller knows the box is taller than the
     * window reports, and AS3 also uses it as the "rebuild the backing bitmap" flag.
     *
     * AS3's second branch — `setDisplayObject(new Bitmap(...))` on a display-object wrapper — has
     * no counterpart: this port's element types do not include that wrapper.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::setElementImageCentered()
    public static setElementImageCentered(element: IWindow | null, bitmap: ImageBitmap | null, height: number = 0): void
    {
        if(bitmap === null || element === null || element.disposed) return;

        const boxHeight = height > 0 ? height : element.height;
        const x = Math.trunc((element.width - bitmap.width) / 2);
        const y = Math.trunc((boxHeight - bitmap.height) / 2);
        const canvas = new OffscreenCanvas(Math.max(1, element.width), Math.max(1, boxHeight));
        const ctx = canvas.getContext('2d');

        if(ctx === null) return;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bitmap, x, y);

        (element as unknown as {bitmap: ImageBitmap | null}).bitmap = canvas.transferToImageBitmap();

        element.invalidate();
    }

    /**
     * Downloads one preview image into the asset library under its own name.
     *
     * The URL is built from `image.library.catalogue.url` plus the asset name and `.png` — the
     * server sends bare names, never paths.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::retrievePreviewAsset()
    private retrievePreviewAsset(assetName: string, onAssetReady: ((...args: unknown[]) => void) | null): void
    {
        if(!assetName || !this.assets) return;

        const loader = this.assets.loadAssetFromFile(assetName, `${this.imageGalleryHost}${assetName}.png`, 'image/png');

        if(!loader) return;

        // AS3's listener reads `event.target` to get the loader back, and this port's event
        // carries no target — so the loader is handed over as the callback's own argument. Every
        // caller wants the same one thing from it: `assetName`, to look the asset up now that it
        // is in the library.
        if(onAssetReady != null) loader.addEventListener(AssetLoaderEvent.COMPLETE, () => onAssetReady(loader));
    }

    public getPurse(): Purse
    {
        return this._purse;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getClubBuyController()
    // Controllers are created eagerly in initComponent() (see createClubBuyController() etc.
    // below), not lazily here - matches AS3, where these are plain field getters.
    public getClubBuyController(): ClubBuyController | null
    {
        return this._clubBuyController;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::createClubBuyController()
    private createClubBuyController(): void
    {
        if(this._clubBuyController == null)
        {
            this._clubBuyController = new ClubBuyController(this, this.connection);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getClubExtendController()
    public getClubExtendController(): ClubExtendController | null
    {
        return this._clubExtendController;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::createClubExtendController()
    private createClubExtendController(): void
    {
        if(this._clubExtendController == null)
        {
            this._clubExtendController = new ClubExtendController(this);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getClubGiftController()
    public getClubGiftController(): ClubGiftController | null
    {
        return this._clubGiftController;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::createClubGiftController()
    private createClubGiftController(): void
    {
        if(this._clubGiftController == null)
        {
            this._clubGiftController = new ClubGiftController(this);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getGroupMembershipsController()
    public getGroupMembershipsController(): GuildMembershipsController | null
    {
        return this._groupMembershipsController;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::createGroupMembershipsController()
    private createGroupMembershipsController(): void
    {
        if(this._groupMembershipsController == null)
        {
            this._groupMembershipsController = new GuildMembershipsController(this);
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getEarnings()
    public getEarnings(): IEarningsController | null
    {
        return this._earningsController;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getRecycler()
    public getRecycler(): IRecycler | null
    {
        return this._recycler;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::createRecycler()
    private createRecycler(): void
    {
        if(this._recycler == null && this._windowManager != null)
        {
            this._recycler = new RecyclerLogic(this, this._windowManager);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getMarketPlace()
    public getMarketPlace(): IMarketPlace | null
    {
        return this._marketPlace;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::createMarketPlace()
    private createMarketPlace(): void
    {
        if(this._marketPlace == null && this._windowManager != null && this._roomEngine != null)
        {
            this._marketPlace = new MarketPlaceLogic(this, this._windowManager, this._roomEngine);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getPublicMarketPlaceOffers()
    public getPublicMarketPlaceOffers(minPrice: number, maxPrice: number, searchString: string, category: number, combineUniques: boolean = true): void
    {
        this.connection?.send(new GetMarketplaceOffersMessageComposer(minPrice, maxPrice, searchString, category, combineUniques));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getOwnMarketPlaceOffers()
    public getOwnMarketPlaceOffers(category: number = 1): void
    {
        this.connection?.send(new GetMarketplaceOwnOffersMessageComposer(category));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::cancelAllMarketPlaceOffers()
    public cancelAllMarketPlaceOffers(): void
    {
        this.connection?.send(new CancelAllMarketplaceOffersMessageComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::clearOwnMarketPlaceHistory()
    public clearOwnMarketPlaceHistory(status: number): void
    {
        this.connection?.send(new ClearOwnMarketplaceHistoryMessageComposer(status));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::buyMarketPlaceOffer()
    public buyMarketPlaceOffer(offerId: number): void
    {
        this.connection?.send(new BuyMarketplaceOfferMessageComposer(offerId));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::redeemSoldMarketPlaceOffers()
    public redeemSoldMarketPlaceOffers(): void
    {
        this.connection?.send(new RedeemMarketplaceOfferCreditsMessageComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::redeemExpiredMarketPlaceOffer()
    public redeemExpiredMarketPlaceOffer(offerId: number): void
    {
        this.connection?.send(new CancelMarketplaceOfferMessageComposer(offerId));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getMarketplaceItemStats()
    public getMarketplaceItemStats(category: number, furniId: number, extraData: string | null = null): void
    {
        if(!this._communication) return;

        this.connection?.send(new GetMarketplaceItemStatsComposer(category, furniId, extraData));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showNotEnoughCreditsAlert()
    public showNotEnoughCreditsAlert(): void
    {
        if(!this._windowManager)
        {
            return;
        }

        this._windowManager.confirm(
            '${catalog.alert.notenough.title}',
            '${catalog.alert.notenough.credits.description}',
            0,
            this.noCreditsConfirmDialogEventProcessor
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showHabbiconAlreadyOwnedAlert()
    public showHabbiconAlreadyOwnedAlert(): void
    {
        this._windowManager?.alert(
            '${catalog.alert.purchaseerror.title}',
            '${habbicon.catalog.already_owned}',
            0,
            this.alertDialogEventProcessor
        );
    }

    /**
	 * A habbicon offer carries the habbicon id in `extraParam` — as a string, hence the parse.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::isHabbiconOfferOwned()
    public isHabbiconOfferOwned(offer: IPurchasableOffer | null): boolean
    {
        if(!this.getBoolean('habbicons.enabled')
            || offer === null
            || offer.product === null
            || offer.product.productType !== 'habbicon'
            || this._habbiconController === null)
        {
            return false;
        }

        return this.isHabbiconOwned(parseInt(offer.product.extraParam, 10) || 0);
    }

    /**
	 * "Owned" here means the controller has *an entry* for it, whatever its state — a claimable
	 * reward counts, which is what stops the catalog offering it for sale a second time.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::isHabbiconOwned()
    public isHabbiconOwned(id: number): boolean
    {
        if(!this.getBoolean('habbicons.enabled') || this._habbiconController === null) return false;

        return this._habbiconController.tryGetOwnedHabbicon(id) !== null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showNotEnoughActivityPointsAlert()
    public showNotEnoughActivityPointsAlert(activityPointType: number): void
    {
        const currencyName = this.getActivityPointName(activityPointType);
        const title = this._localization?.getLocalizationWithParams('catalog.alert.notenough.activitypoints.title', '', 'currencyname', currencyName) ?? '';
        const description = this._localization?.getLocalizationWithParams('catalog.alert.notenough.activitypoints.description', '', 'currencyname', currencyName) ?? '';

        if(activityPointType === 0)
        {
            this._windowManager?.confirm(title, description, 0, this.noDucketsConfirmDialogEventProcessor);
        }
        else
        {
            this._windowManager?.alert(title, description, 0, this.alertDialogEventProcessor);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::noCreditsConfirmDialogEventProcessor()
    private noCreditsConfirmDialogEventProcessor = (dialog: IDisposable, event: WindowEvent): void =>
    {
        dialog.dispose();
        this.resetPlacedOfferData();

        if(event.type === WindowEvent.WE_OK)
        {
            HabboWebTools.openWebPageAndMinimizeClient(this.getProperty('web.shop.relativeUrl'));
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::noDucketsConfirmDialogEventProcessor()
    private noDucketsConfirmDialogEventProcessor = (dialog: IDisposable, event: WindowEvent): void =>
    {
        dialog.dispose();
        this.resetPlacedOfferData();

        if(event.type === WindowEvent.WE_OK)
        {
            const url = this.getProperty('link.format.duckets');

            if(url !== '')
            {
                this._windowManager?.alert('${catalog.alert.external.link.title}', '${catalog.alert.external.link.desc}', 0, this.onExternalLink);
                HabboWebTools.navigateToURL(url, HabboWebTools.WINDOW_HABBO_MAIN);
            }
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onExternalLink()
    private onExternalLink = (dialog: IDisposable, _event: WindowEvent): void =>
    {
        dialog.dispose();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getHabboClubOffers()
    public getHabboClubOffers(source: number): void
    {
        this.connection?.send(new GetClubOffersMessageComposer(source));
    }

    // --- ILinkEventTracker ---

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get linkPattern()
    public get linkPattern(): string
    {
        return 'catalog/';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::linkReceived()
    public linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2)
        {
            return;
        }

        switch(parts[1])
        {
            case 'open':
                if(parts.length > 2)
                {
                    this.openCatalogPage(parts[2]);

                    break;
                }

                this.openCatalog();

                break;

            case 'club_buy':
                this.openClubCenter();

                break;

            case 'habbicons':
                if(this.getBoolean('habbicons.enabled'))
                {
                    this.context.createLinkEvent('habbicons/open');
                }

                break;

            default:
                log.warn(`Catalog unknown link-type receive: ${parts[1]}`);

                break;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::openClubCenter()
    public openClubCenter(): void
    {
        this.context.createLinkEvent('habboUI/open/hccenter');
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openVault()
    public openVault(): void 
    {
        this.context.createLinkEvent('habboUI/open/vault');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::verifyClubLevel()
    // AS3 opens the HC centre here on failure, and its only caller
    // (PurchaseCatalogWidget.as:280-283) opens it again right after. The redundancy is AS3's, and
    // the TS caller already mirrors it — kept as-is rather than "tidied" on one side only.
    public verifyClubLevel(clubLevel: number = 1): boolean
    {
        if((this._sessionDataManager?.clubLevel ?? HabboClubLevelEnum.NO_CLUB) >= clubLevel)
        {
            return true;
        }

        this.openClubCenter();

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::isNewIdentity()
    public isNewIdentity(): boolean
    {
        return this.getInteger('new.identity', 0) > 0;
    }

    /**
     * Opens the confirmation for one of the three snow-war token bundles, or asks the server for
     * them if they are not cached yet.
     *
     * The else-branch is the lazy fetch, and it is *only* an else: a bundle that has not arrived
     * produces a request and nothing visible, so the player's first click loads the offers and the
     * second one buys. AS3 does not re-open the dialog when the answer lands either.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::buySnowWarTokensOffer()
    public buySnowWarTokensOffer(localizationId: string): void
    {
        const offer = this._snowWarTokenOffers.get(localizationId) ?? null;

        if(offer !== null)
        {
            this.showPurchaseConfirmation(offer, -1, offer.localizationId);

            return;
        }

        this._communication?.connection?.send(new GetSnowWarGameTokensOfferComposer());
    }

    /**
     * Sends the purchase for one snow-war token bundle.
     *
     * The sibling of `buySnowWarTokensOffer()` above and not a duplicate of it: that one *offers*
     * the bundle, this one buys it, and unlike that one it does nothing at all when the bundle is
     * not cached — there is no id to send.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::purchaseGameTokensOffer()
    public purchaseGameTokensOffer(localizationId: string): void
    {
        const offer = this._snowWarTokenOffers.get(localizationId) ?? null;

        if(offer === null) return;

        this._communication?.connection?.send(new PurchaseSnowWarGameTokensOfferComposer(offer.offerId));
    }

    /**
     * The three token bundles, by their localization id.
     *
     * AS3 holds them in three separate fields and repeats the same three-way `if` chain at each of
     * its three use sites. A map keyed by the same ids says it once — `disposeSnowWarTokens()` is
     * a `clear()`, and neither reader has to know how many there are.
     */
    // AS3: HabboCatalog.as::_SafeStr_5588 / _SafeStr_5482 / _SafeStr_5548
    private _snowWarTokenOffers: Map<string, GameTokensOffer> = new Map();

    // AS3: the three literals HabboCatalog.as compares against in onSnowWarGameTokenOffer(),
    // buySnowWarTokensOffer() and purchaseGameTokensOffer().
    private static readonly SNOW_WAR_TOKEN_IDS: readonly string[] = [
        'GET_SNOWWAR_TOKENS', 'GET_SNOWWAR_TOKENS2', 'GET_SNOWWAR_TOKENS3',
    ];

    /**
     * The token bundles have arrived. The list replaces whatever was cached rather than merging
     * into it, so a bundle the server stops offering disappears.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onSnowWarGameTokenOffer()
    private onSnowWarGameTokenOffer(event: IMessageEvent): void
    {
        const parser = event?.parser as SnowWarGameTokensMessageParser | null;

        if(parser == null) return;

        this.disposeSnowWarTokens();

        for(const offer of parser.offers)
        {
            // AS3 only keeps the three it knows the ids of; anything else on the wire is ignored.
            if(!HabboCatalog.SNOW_WAR_TOKEN_IDS.includes(offer.localizationId)) continue;

            this._snowWarTokenOffers.set(offer.localizationId, new GameTokensOffer(
                offer.offerId,
                offer.localizationId,
                offer.priceInCredits,
                offer.priceInActivityPoints,
                offer.activityPointType
            ));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::disposeSnowWarTokens()
    private disposeSnowWarTokens(): void
    {
        for(const offer of this._snowWarTokenOffers.values()) offer.dispose();

        this._snowWarTokenOffers.clear();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showVipBenefits()
    // AS3 also lazily calls init() first if _utils is still null - this port's _utils is always
    // constructed eagerly in the field initializer, so that guard has nothing to do here.
    public showVipBenefits(): void
    {
        if(!this.getCatalogNavigator('NORMAL')?.initialized)
        {
            this.refreshCatalogIndex('NORMAL');
        }

        this._utils.showVipBenefits();
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::displayProductIcon()
    public displayProductIcon(productType: string, classId: number, target: unknown): void 
    {
        this._utils.displayProductIcon(productType, classId, target as IBitmapWrapperWindow);
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openRentConfirmationWindow()
    /**
     * Built lazily and kept: the window owns a message-event subscription, so re-creating it per
     * call would stack listeners.
     *
     * Note AS3's parameter names are misleading and preserved as such — the second is the *buyout*
     * flag, not a wall-item flag (the window derives that from the furni data itself), and the two
     * ids are the room object and the inventory strip item, which is how it picks its mode.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::openRentConfirmationWindow()
    public openRentConfirmationWindow(
        furniData: IFurnitureData | null,
        buyout: boolean,
        objectId: number = -1,
        stripId: number = -1,
        fromCatalogue: boolean = false
    ): void
    {
        if(this._rentConfirmationWindow == null)
        {
            this._rentConfirmationWindow = new RentConfirmationWindow(this);
        }

        this._rentConfirmationWindow.show(furniData, buyout, objectId, stripId, fromCatalogue);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getCatalogNavigator()
    public getCatalogNavigator(catalogType: string): ICatalogNavigator | null 
    {
        return this._catalogNavigators?.get(catalogType) ?? null;
    }

    /**
	 * Whether the given catalog type uses the tab-less catalog window.
	 *
	 * @param _catalogType - The catalog type ("NORMAL")
	 */
    // DEVIATION: AS3 always answers true for the Builders Club catalog, whatever the config says;
    //   the RPG fork removed it, so only the config decides.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::useNonTabbedCatalog()
    public useNonTabbedCatalog(_catalogType: string): boolean
    {
        return this.getBoolean('client.desktop.use.non.tabbed.catalog');
    }

    /**
     * The offer centre, built on first use and handed the extension that will display its badges.
     *
     * Two callers share the one instance — `HabboClubCenter` and the toolbar's `OfferExtension` —
     * and each replaces the extension as it asks, which is AS3's own behaviour: whoever asked last
     * gets the notifications.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getOfferCenter()
    public getOfferCenter(extension: IOfferExtension | null): IOfferCenter | null
    {
        if(this._offerCenter === null)
        {
            if(this.windowManager === null) return null;

            this._offerCenter = new OfferCenter(this.windowManager, this);
        }

        this._offerCenter.offerExtension = extension;

        return this._offerCenter;
    }

    /**
     * The purchased item has landed in the inventory. If it is the one already standing in the room
     * as a ghost, this is what makes the placement real — it sends the placement the user already
     * performed, at the remembered position, and clears the ghost.
     *
     * **AS3 bug, ported as-is:** `category` is overwritten with the *room* category (10/20) and then
     * switched against `FurnitureCategory`'s WALL_PAPER/FLOOR/LANDSCAPE (2/3/4), so those three
     * branches can never be reached and every placement takes the default one. They are documented
     * below rather than silently dropped; the composer they need is unported anyway.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::itemAddedToInventory()
    public itemAddedToInventory(classId: number, itemId: number, category: number): void
    {
        if(this._placedOfferData === null || this._placedOfferData.productClassId !== classId) return;
        if(this._placedOfferData.roomId !== this._roomEngine?.activeRoomId) return;

        category = this._placedOfferData.category;

        switch(category)
        {
            // A decoration is applied, not placed. The read-back is the whole point of the branch:
            // if the room already wears the type that was just bought, nothing is sent — buying a
            // second copy of the wallpaper you are already using must not re-apply it.
            case FurnitureCategory.WALL_PAPER:
                this.sendRoomPropertyIfChanged(RoomObjectVariableEnum.ROOM_WALL_TYPE, itemId);
                break;
            case FurnitureCategory.FLOOR:
                this.sendRoomPropertyIfChanged(RoomObjectVariableEnum.ROOM_FLOOR_TYPE, itemId);
                break;
            case FurnitureCategory.LANDSCAPE:
                this.sendRoomPropertyIfChanged(RoomObjectVariableEnum.ROOM_LANDSCAPE_TYPE, itemId);
                break;
            default:
                this.connection?.send(new PlaceObjectMessageComposer(
                    itemId,
                    category,
                    this._placedOfferData.wallLocation,
                    this._placedOfferData.x,
                    this._placedOfferData.y,
                    this._placedOfferData.direction
                ));
        }

        this.resetPlacedOfferData();
    }

    /**
     * Applies a freshly bought decoration to the active room, unless the room already wears it.
     *
     * AS3 writes the same three lines out per category with a different room variable each time;
     * folded into one helper here because the only thing that varies is which variable to compare
     * against.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::itemAddedToInventory()
    private sendRoomPropertyIfChanged(roomVariable: string, itemId: number): void
    {
        if(this._roomEngine === null || this._placedOfferData === null) return;

        const current = this._roomEngine.getRoomStringValue(this._roomEngine.activeRoomId, roomVariable);

        if(this._placedOfferData.extraParameter === current) return;

        this.connection?.send(new RequestRoomPropertySetComposer(itemId));
    }

    // AS3 loads this via assets.getAssetByName(name).content + buildFromXML(); this port
    // pre-compiles window layouts into a named registry instead (see IHabboWindowManager

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getActivityPointName()
    // The config supplies the localization key; it is not hardcoded. The key doubles as its own
    // default, so an unmapped currency shows the key rather than an empty string.
    public getActivityPointName(activityPointType: number): string
    {
        const key = this.getProperty(`activitypoint.name.${activityPointType}`);

        return this._localization?.getLocalization(key, key) ?? key;
    }

    override dispose(): void 
    {
        if(this._disposed) return;

        if(this._communication) 
        {
            for(const event of this._messageEvents) 
            {
                this._communication.removeMessageEvent(event);
            }
        }

        this._messageEvents.length = 0;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::dispose()
        this.context.removeLinkEventTracker(this);

        if(this._purchaseConfirmationDialog != null)
        {
            this._purchaseConfirmationDialog.dispose();
            this._purchaseConfirmationDialog = null;
        }

        if(this._clubBuyController != null)
        {
            this._clubBuyController.dispose();
            this._clubBuyController = null;
        }

        if(this._clubExtendController != null)
        {
            this._clubExtendController.dispose();
            this._clubExtendController = null;
        }

        if(this._groupMembershipsController != null)
        {
            this._groupMembershipsController.dispose();
            this._groupMembershipsController = null;
        }

        if(this._roomPreviewer != null)
        {
            this._roomPreviewer.dispose();
            this._roomPreviewer = null;
        }

        // Dropped, not disposed — AS3 only nulls this one (`_SafeStr_4730 = null`), and
        // the asymmetry is deliberate enough to keep: MarketPlaceLogic is reachable from
        // elsewhere, so disposing it here would take it out from under another owner.
        this._marketPlace = null;

        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::dispose()
        // AS3 never releases its ClubGiftController (_SafeStr_7444) or its recycler — neither
        // appears anywhere in dispose(). Left leaking to match, rather than "fixing" AS3 on a
        // guess: both hold windows, and taking them down here may be exactly what AS3 avoids.
        // Decide with a leak trace, not by reading.

        if(this._sellablePetPalettes != null)
        {
            this._sellablePetPalettes.dispose();
            this._sellablePetPalettes = null;
        }

        // AS3: .../HabboCatalog.as::dispose() — takes the ghost furni out of the room before the
        // state that describes it goes away, then clears the mover.
        this.resetPlacedOfferData();
        this._placingFurni = false;
        this._offerPlacingCallbackReceiver = null;

        this._utils.dispose();

        // AS3: .../HabboCatalog.as::dispose() — right after _utils, before super.dispose().
        if(this._offerController != null)
        {
            this._offerController.dispose();
            this._offerController = null;
        }

        if(this._videoOfferManager != null)
        {
            this._videoOfferManager.dispose();
            this._videoOfferManager = null;
        }

        // Drop the flat references before the states that own the objects behind them,
        // then let each state take down its own window, navigator and viewer.
        this._catalogViewer = null;
        this._mainWindow = null;

        if(this._catalogStates != null)
        {
            for(const state of this._catalogStates.values())
            {
                state.dispose();
            }

            this._catalogStates = null;
        }

        this._catalogNavigators = null;

        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this.onRoomSessionEvent);
        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this.onRoomSessionEvent);
        this._roomSessionManager = null;
        this._roomSession = null;
        this._sessionDataManager?.removeFurniDataListener(this);
        this._notifications = null;
        this._avatarEditor = null;

        this._communication = null;
        this._windowManager = null;
        this._localization = null;
        super.dispose();
    }

    protected override initComponent(): void
    {
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as
        // ::onRoomExit() — deliberately not subscribed, and this note is here so the next
        // unwired-code sweep stops re-flagging it as a missing registration.
        //
        // AS3 subscribes `CloseConnectionMessageEvent` (3404) to it and **the handler's body is
        // empty** — two braces, no statements. Wiring it would add a subscription that does
        // nothing. The message itself is ported and seven other modules subscribe to it for the
        // work they really do on a room exit.
        this.addMessageEvent(new CreditBalanceEvent(this.onCreditBalance.bind(this)));
        this.addMessageEvent(new LtdRaffleResultMessageEvent(this.onLtdRaffleResult.bind(this)));
        this.addMessageEvent(new SilverBalanceMessageEvent(this.onSilverBalance.bind(this)));
        this.addMessageEvent(new EmeraldBalanceMessageEvent(this.onEmeraldBalance.bind(this)));
        this.addMessageEvent(new ActivityPointsMessageEvent(this.onActivityPoints.bind(this)));
        this.addMessageEvent(new HabboActivityPointNotificationMessageEvent(this.onActivityPointNotification.bind(this)));
        this.addMessageEvent(new CatalogIndexMessageEvent(this.onCatalogIndex.bind(this)));
        this.addMessageEvent(new CatalogPageMessageEvent(this.onCatalogPage.bind(this)));
        this.addMessageEvent(new ProductOfferMessageEvent(this.onProductOffer));
        this.addMessageEvent(new LimitedEditionSoldOutMessageEvent(this.onLimitedEditionSoldOut));
        this.addMessageEvent(new GiftReceiverNotFoundMessageEvent(this.onGiftReceiverNotFound));
        this.addMessageEvent(new ScrSendUserInfoEvent(this.onSubscriptionInfo.bind(this)));
        this.addMessageEvent(new LtdRaffleEnteredMessageEvent(this.onLtdRaffleEntered.bind(this)));
        this.addMessageEvent(new SnowWarGameTokensMessageEvent(this.onSnowWarGameTokenOffer.bind(this)));
        this.addMessageEvent(new PurchaseOKMessageEvent(this.onPurchaseOK.bind(this)));
        this.addMessageEvent(new PurchaseErrorMessageEvent(this.onPurchaseError.bind(this)));
        this.addMessageEvent(new PurchaseNotAllowedMessageEvent(this.onPurchaseNotAllowed.bind(this)));
        this.addMessageEvent(new NotEnoughBalanceMessageEvent(this.onNotEnoughBalance.bind(this)));
        this.addMessageEvent(new VoucherRedeemOkMessageEvent(this.onVoucherRedeemOk.bind(this)));
        this.addMessageEvent(new VoucherRedeemErrorMessageEvent(this.onVoucherRedeemError.bind(this)));
        this.addMessageEvent(new HabboClubOffersMessageEvent(this.onHabboClubOffers.bind(this)));
        this.addMessageEvent(new HabboClubExtendOfferMessageEvent(this.onHabboClubExtendOffer.bind(this)));
        this.addMessageEvent(new ClubGiftInfoEvent(this.onClubGiftInfo.bind(this)));
        this.addMessageEvent(new MarketPlaceOffersEvent(this.onMarketPlaceOffers.bind(this)));
        this.addMessageEvent(new MarketPlaceOwnOffersEvent(this.onMarketPlaceOwnOffers.bind(this)));
        this.addMessageEvent(new MarketplaceBuyOfferResultEvent(this.onMarketPlaceBuyResult.bind(this)));
        this.addMessageEvent(new MarketplaceCancelOfferResultEvent(this.onMarketPlaceCancelResult.bind(this)));
        this.addMessageEvent(new MarketplaceCancelAllOffersResultEvent(this.onMarketPlaceCancelAllResult.bind(this)));
        this.addMessageEvent(new MarketplaceClearOwnHistoryResultEvent(this.onMarketPlaceClearOwnHistoryResult.bind(this)));
        this.addMessageEvent(new MarketplaceMakeOfferResultEvent(this.onMarketplaceMakeOfferResult.bind(this)));

        this.addMessageEvent(new NftStorePurchaseMessageEvent(this.onNftStorePurchase));

        // One header AS3 subscribes here and this port does not: 3404 CloseConnection, whose AS3
        // handler `onRoomExit(param1:IMessageEvent)` has an **empty body**. Subscribing it would
        // register a no-op, so `sweep-unwired` reports it and always will.
        this.addMessageEvent(new MarketplaceConfigurationEvent(this.onMarketplaceConfiguration.bind(this)));
        this.addMessageEvent(new MarketplaceItemStatsEvent(this.onMarketplaceItemStats.bind(this)));
        this.addMessageEvent(new RecyclerStatusMessageEvent(this.onRecyclerStatus.bind(this)));
        this.addMessageEvent(new RecyclerFinishedMessageEvent(this.onRecyclerFinished.bind(this)));
        this.addMessageEvent(new RecyclerPrizesMessageEvent(this.onRecyclerPrizes.bind(this)));
        this.addMessageEvent(new GuildMembershipsMessageEvent(this.onGuildMemberships.bind(this)));
        this.addMessageEvent(new SellablePetPalettesMessageEvent(this.onSellablePetPalettes.bind(this)));
        this.addMessageEvent(new ApproveNameMessageEvent(this.onApproveNameResult.bind(this)));
        this.addMessageEvent(new BundleDiscountRulesetMessageEvent(this.onBundleDiscountRulesetMessageEvent.bind(this)));
        this.addMessageEvent(new GiftWrappingConfigurationEvent(this.onGiftWrappingConfiguration.bind(this)));
        this.addMessageEvent(new CatalogPublishedMessageEvent(this.onCatalogPublished.bind(this)));

        // DEVIATION: AS3 also registers `CloseConnectionMessageEvent` (3404) here, on
        //   `onRoomExit()` — whose body is empty (HabboCatalog.as:2724-2726). Registering a
        //   listener that does nothing has no observable effect in either language, and seven
        //   other modules already register the same event, so the message is parsed regardless.
        //   Left out deliberately rather than shipped as dead code; `scripts/sweep-unwired.mjs`
        //   flags it every run, and this is the answer.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onRoomExit()

        // AS3 registers the tracker here, right after the message events (HabboCatalog.as:752).
        this.context.addLinkEventTracker(this);

        this.connection?.send(new GetCreditsInfoComposer());

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::initComponent()
        this._sessionDataManager?.loadProductData(this);

        // AS3: HabboCatalog.as::initComponent() — immediately before the OfferController below.
        this._videoOfferManager = new VideoOfferManager(this);

        // Must come after loadProductData(): the controller registers itself as a products-ready
        // listener in its own constructor, and that is what triggers its first server request.
        this._offerController = new OfferController(this);

        this._furnitureDataCache = this._sessionDataManager?.getFurniData(this) ?? null;

        // AS3 also registers itself as an update receiver (HabboCatalog.as:446) for `update()`,
        // which ticks the Builders Club countdown (and the room previewer, which this port drives
        // off room-engine events instead). The RPG fork removed the Builders Club, so there is
        // nothing left to tick.
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::initializeRoomPreviewer()
    /**
     * The engine check is not redundant with the null one: a resolved-but-uninitialised engine has
     * no room manager yet, and `createRoomForPreviews()` would build the preview room into nothing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::initializeRoomPreviewer()
    private initializeRoomPreviewer(): void
    {
        if(this._roomEngine != null && this._roomEngine.isInitialized && this.getBoolean('catalog.furniture.animation')) 
        {
            if(this._roomPreviewer == null)
            {
                this._roomPreviewer = new RoomPreviewer(this._roomEngine);
                this._roomPreviewer.centerWallItems = true;
                this._roomPreviewer.createRoomForPreviews();
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::init()
    // Every step AS3 runs here is now run here. The three this note used to list as blocked -
    // refreshFurniData(), getGiftWrappingConfiguration(), initBundleDiscounts() - were each
    // blocked on something that had since landed or was one message away.
    /**
	 * @param catalogType - The catalog type to activate once the states exist
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::init()
    private init(catalogType: string): boolean
    {
        if(this._initialized) return false;

        if(this._furniDataNeedsRefresh)
        {
            this.refreshFurniData();
        }

        this.createCatalogWindowStates();
        this.setActiveCatalogState(catalogType);
        this.updatePurse();
        this.createClubGiftController();
        this.createClubBuyController();
        this.createClubExtendController();
        this.createGroupMembershipsController();
        this.createMarketPlace();
        this.createRecycler();
        this.getGiftWrappingConfiguration();
        this.initBundleDiscounts();
        this._initialized = true;
        this.events.emit(CatalogEvent.CATALOG_INITIALIZED, new CatalogEvent(CatalogEvent.CATALOG_INITIALIZED));

        return true;
    }

    /**
     * Tears the catalog back down to "never opened": the window states, both navigators and the
     * viewer all go, so the next `toggleCatalog()` rebuilds them from a fresh index. Used after the
     * catalog is republished server-side and after a club purchase, both of which invalidate the
     * pages currently held.
     *
     * `disposing` skips the product-data reload — during `dispose()` there is nothing left to
     * reload into.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::reset()
    private reset(disposing: boolean = false): void
    {
        this._initialized = false;
        this._catalogViewer = null;
        this._mainWindow = null;

        if(this._catalogStates != null)
        {
            for(const state of this._catalogStates.values())
            {
                state.dispose();
            }

            this._catalogStates = null;
        }

        this._catalogNavigators = null;

        if(disposing) return;

        if(this._sessionDataManager == null)
        {
            // AS3 calls `_SafeCls_48.crash(...)` here — a hard client crash with a code. This port
            // logs and bails instead: the catalog is already torn down, and taking the whole client
            // with it is a Flash-era choice, not a requirement of the flow.
            log.error('Could not reload product data after reset() because the session data manager was null');

            return;
        }

        if(!this._sessionDataManager.loadProductData(this))
        {
            this.events.emit(CatalogEvent.CATALOG_NOT_READY, new CatalogEvent(CatalogEvent.CATALOG_NOT_READY));
        }
    }

    /**
	 * Builds the main window for one catalog type and returns it.
	 *
	 * buildWidgetLayout() doc: "AS3: buildFromXML(assets.getAssetByName(name).content as XML)".
	 *
	 * @param catalogType - The catalog type this window is for
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::createMainWindow()
    private createMainWindow(catalogType: string): IWindowContainer
    {
        const assetName = this.useNonTabbedCatalog(catalogType) ? 'catalog_ubuntu' : 'catalog_ubuntu_with_tabs';

        const window = this._windowManager!.buildWidgetLayout(assetName, 1) as unknown as IWindowContainer;

        window.tags.push('habbo_catalog');
        window.position = {x: 100, y: 5};
        window.visible = false;

        // buildWidgetLayout() leaves the window parented, and both mainWindowVisible()
        // and showMainWindow() judge by `parent` — a window still attached here reads as
        // already open, so showMainWindow() skips it and it never appears. AS3 detaches
        // it the same way and for the same reason (`_loc3_ = _loc2_.parent; if(_loc3_ !=
        // null) _loc3_.removeChild(_loc2_)`). Before CatalogWindowState this was done by
        // calling hideMainWindow() from here, which no longer fits: it hides whichever
        // window is *active*, and during construction that is not this one.
        const parent = window.parent as unknown as IWindowContainer | null;

        parent?.removeChild(window as unknown as IWindow);

        const closeButton = window.findChildByName('titlebar_close_button') ?? window.findChildByTag('close');

        if(closeButton)
        {
            closeButton.addEventListener(WindowMouseEvent.CLICK, this.onWindowClose);
        }

        const searchInput = window.findChildByName('search.input') as unknown as ITextFieldWindow | null;

        if(searchInput)
        {
            searchInput.setSelection(0, searchInput.text.length);
            searchInput.focus();

            // AS3 (HabboCatalog.as:1804-1812) wires the search field and clear button.
            // The port had never attached them, so typing in the catalog search did
            // nothing (user-reported). The node search backend (CatalogNavigator.filter)
            // already exists; this just drives it.
            searchInput.addEventListener(WindowKeyboardEvent.KEY_DOWN, this.onSearchInputEvent);
            searchInput.addEventListener(WindowKeyboardEvent.KEY_UP, this.onSearchInputEvent);

            const clearButton = window.findChildByName('clear_search_button');

            if(clearButton)
            {
                clearButton.addEventListener(WindowMouseEvent.CLICK, this.onClearSearch);
            }
        }

        this.refreshCatalogWindowChrome(catalogType, window);

        return window;
    }

    /**
     * Repaints the catalog window's title bar. AS3 calls it from `createMainWindow()` and
     * `toggleCatalog()`, and so does this.
     */
    // DEVIATION: AS3 paints per mode — NORMAL the blue chrome below, BUILDERS_CLUB an orange one with
    //   `builder.mode.header` shown instead of `catalog.mode.header`. The RPG fork removed the
    //   Builders Club, so only the NORMAL values remain (the layout still carries the builder header,
    //   which stays hidden).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::refreshCatalogWindowChrome()
    private refreshCatalogWindowChrome(_catalogType: string, container: IWindowContainer | null): void
    {
        if(container == null) return;

        container.color = 4296112;
        container.caption = '${catalog.title}';

        const border = container.findChildByName('catalog.header.background.border');

        if(border != null) border.color = 4281819765;

        const body = container.findChildByName('catalog.header.background.body');

        if(body != null) body.color = 4279123794;

        const catalogHeader = container.findChildByName('catalog.mode.header');

        if(catalogHeader != null) catalogHeader.visible = true;

        const builderHeader = container.findChildByName('builder.mode.header');

        if(builderHeader != null) builderHeader.visible = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onSearchInputEvent()
    // KEY_DOWN stops the debounce; KEY_UP re-arms it (>= 3 chars), searches immediately on
    // Enter, and clears when the field empties.
    private onSearchInputEvent = (event: WindowEvent): void =>
    {
        const searchInput = event.target as unknown as ITextFieldWindow | null;

        if(searchInput === null) return;

        if(event.type === WindowKeyboardEvent.KEY_DOWN)
        {
            if(this._searchTimer !== null)
            {
                clearTimeout(this._searchTimer);
                this._searchTimer = null;
            }

            return;
        }

        const caption = searchInput.text ?? '';
        const keyCode = (event as WindowKeyboardEvent).keyCode;

        // The two things the search box does on every key-up, and neither was ported: the helper
        // label shows only while the field is empty, and the icon beside it swaps between a close
        // cross and a pen. AS3 does both BEFORE the empty/Enter branches below, so they happen on
        // the keystroke that empties the field too.
        const helper = this._mainWindow?.findChildByName('search.helper') ?? null;

        if(helper !== null) helper.visible = caption.length === 0;

        const clearIcon = this._mainWindow?.findChildByName('search.clear.icon') as unknown as IStaticBitmapWrapperWindow | null;

        if(clearIcon) clearIcon.assetUri = caption.length > 0 ? 'icons_close' : 'common_small_pen';

        if(caption.length === 0)
        {
            this.onClearSearch();
        }
        else if(keyCode === 13)
        {
            this.performSearch(caption);
        }
        else if(caption.length >= 3)
        {
            if(this._searchTimer !== null) clearTimeout(this._searchTimer);

            this._searchTimer = setTimeout(() => this.performSearch(caption), 50);
        }
    };

    /**
     * Runs a catalog search: match the furni index, turn the hits into offers, show them, and
     * narrow the navigator tree to the pages they live on.
     *
     * The 400 cap is AS3's own — a two-letter query can match most of the furni table, and the grid
     * has to render every result it is handed.
     *
     * The normal catalog hides furni marked `excludedFromDynamic`. (AS3's Builders Club catalog also
     * filled `furniLines` from furni whose offer resolved to nothing; the RPG fork removed it, so
     * that list always reaches the navigator empty.)
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::performSearch()
    private performSearch(query: string): void
    {
        if(this._searchTimer !== null)
        {
            clearTimeout(this._searchTimer);
            this._searchTimer = null;
        }

        if(this._furnitureDataCache === null || query === null || query.length === 0) return;

        const state = this.getCatalogState(this._catalogType);

        if(state === null || state.catalogNavigator === null || state.catalogViewer === null
            || state.mainContainer === null)
        {
            return;
        }

        this.ensureSearchEntries();

        const furniLines: string[] = [];
        const offers: IPurchasableOffer[] = [];
        const pageIds = new Set<number>();
        const needle = HabboCatalog.normalizeSearchText(query);

        for(const entry of this._searchEntries)
        {
            const furniData = entry.furniData;

            if(this._catalogType === CatalogType.NORMAL && furniData.excludedFromDynamic) continue;

            if(!HabboCatalog.matchesSearchEntry(entry, needle)) continue;

            const offer = this.createSearchResultOffer(entry);

            if(offer !== null)
            {
                this.addMatchingNodesForOffer(offer.offerId, pageIds);

                if(!HabboCatalog.isExcludedFromFurnitureSearchResults(furniData))
                {
                    offers.push(offer);

                    if(offers.length >= HabboCatalog.SEARCH_RESULT_LIMIT) break;
                }
            }
        }

        this.localization?.registerParameter('catalog.search.results', 'count', offers.length.toString());
        this.localization?.registerParameter('catalog.search.results', 'needle', query);

        const title = state.mainContainer.findChildByName('catalog.header.title');

        if(title !== null) title.caption = '${catalog.search.header}';

        state.catalogNavigator.deactivateCurrentNode();
        state.catalogViewer.showSearchResults(offers);
        state.catalogNavigator.filter(needle, furniLines, pageIds);
    }

    /**
     * AS3: .../HabboCatalog.as::ensureSearchEntries()
     *
     * Rebuilds the index only when something invalidated it. Each entry's terms are normalised and
     * de-duplicated here so a keystroke costs a substring scan and nothing else. The product name is
     * only added once product data has arrived — before that, `getProductData()` would answer null
     * for everything and bake a half-empty index.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::ensureSearchEntries()
    private ensureSearchEntries(): void
    {
        if(!this._searchEntriesDirty) return;

        this._searchEntries = [];

        if(this._furnitureDataCache !== null)
        {
            for(const furniData of this._furnitureDataCache)
            {
                const productCode = HabboCatalog.resolveSearchProductCode(furniData);
                let productName = '';

                if(this._productDataReady && productCode !== null && productCode.length > 0)
                {
                    const productData = this.getProductData(productCode);

                    if(productData !== null && productData.name !== null) productName = productData.name;
                }

                const terms: string[] = [];

                HabboCatalog.addSearchTerm(terms, furniData.localizedName);
                HabboCatalog.addSearchTerm(terms, productName);

                this._searchEntries.push(new CatalogSearchEntry(furniData, terms, productCode));
            }
        }

        this._searchEntriesDirty = false;
    }

    /**
     * AS3: .../HabboCatalog.as::createSearchResultOffer()
     *
     * Returns null when no offer of the furni is reachable from the current navigator; the caller
     * then skips it. (AS3 also resolves `bcOfferId` in the Builders Club catalog; the RPG fork
     * removed it.)
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::createSearchResultOffer()
    private createSearchResultOffer(entry: CatalogSearchEntry): FurnitureOffer | null
    {
        const furniData = entry.furniData;
        const navigator = this.currentCatalogNavigator;
        let offerId = -1;
        let isRentOffer = false;

        if(furniData.purchaseOfferId !== -1
            && navigator?.getNodesByOfferId(furniData.purchaseOfferId, true) != null)
        {
            offerId = furniData.purchaseOfferId;
        }
        else if(furniData.rentOfferId !== -1
            && navigator?.getNodesByOfferId(furniData.rentOfferId, true) != null)
        {
            offerId = furniData.rentOfferId;
            isRentOffer = true;
        }

        if(offerId === -1) return null;

        return new FurnitureOffer(furniData, this, offerId, isRentOffer, entry.productCode);
    }

    /** Every page that carries this offer, so the navigator keeps it even if its name says nothing. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::addMatchingNodesForOffer()
    private addMatchingNodesForOffer(offerId: number, pageIds: Set<number>): void
    {
        const nodes = this.currentCatalogNavigator?.getNodesByOfferId(offerId, true) ?? null;

        if(nodes === null) return;

        for(const node of nodes) pageIds.add(node.pageId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::matchesSearchEntry()
    private static matchesSearchEntry(entry: CatalogSearchEntry, needle: string): boolean
    {
        for(const term of entry.searchTerms)
        {
            if(term.indexOf(needle) >= 0) return true;
        }

        return false;
    }

    /** Normalises and de-duplicates as it goes, so the index never holds a blank or a repeat. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::addSearchTerm()
    private static addSearchTerm(terms: string[], text: string): void
    {
        const normalized = HabboCatalog.normalizeSearchText(text);

        if(normalized.length > 0 && terms.indexOf(normalized) < 0) terms.push(normalized);
    }

    /**
     * Builders Club furni (`bc_` prefix) never appears among the *results*. AS3 reached them through
     * the Builders Club catalog, which the RPG fork removed; the furni data can still list them, so
     * the filter stays.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::isExcludedFromFurnitureSearchResults()
    private static isExcludedFromFurnitureSearchResults(furniData: IFurnitureData): boolean
    {
        return furniData.className !== null && furniData.className.indexOf('bc_') === 0;
    }

    /** Lower-casing only — AS3 does not strip separators here, unlike the navigator's own matcher. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::normalizeSearchText()
    private static normalizeSearchText(text: string | null): string
    {
        if(text === null) return '';

        return text.toLocaleLowerCase();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::resolveSearchProductCode()
    private static resolveSearchProductCode(furniData: IFurnitureData): string
    {
        return HabboCatalog.SEARCH_PRODUCT_CODE_OVERRIDES_BY_FURNI_CLASS_NAME[furniData.className]
            ?? furniData.className;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onClearSearch()
    private onClearSearch = (): void =>
    {
        if(this._searchTimer !== null)
        {
            clearTimeout(this._searchTimer);
            this._searchTimer = null;
        }

        const searchInput = this._mainWindow?.findChildByName('search.input') as unknown as ITextFieldWindow | null;

        if(searchInput)
        {
            searchInput.text = '';
            // AS3 selects the (now empty) text and takes focus back, so the next keystroke goes
            // into the field rather than nowhere.
            searchInput.setSelection(0, searchInput.text.length);
            searchInput.focus();
        }

        const clearIcon = this._mainWindow?.findChildByName('search.clear.icon') as unknown as IStaticBitmapWrapperWindow | null;

        if(clearIcon) clearIcon.assetUri = 'common_small_pen';

        // Not `showIndex()`: AS3 goes BACK to the page the user was on before they searched, and
        // only when there is one. Showing the index instead threw away their place.
        const previousPageId = this._catalogViewer?.previousPageId ?? 0;

        if(previousPageId > 0)
        {
            this.currentCatalogNavigator?.openPageById(previousPageId, -1);
        }

        const helper = this._mainWindow?.findChildByName('search.helper') ?? null;

        if(helper !== null) helper.visible = true;
    };

    /**
	 * Builds the catalog's state up front, as AS3 does.
	 */
    // DEVIATION: AS3 also builds the BUILDERS_CLUB state here; the RPG fork removed the Builders Club.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::createCatalogWindowStates()
    private createCatalogWindowStates(): void
    {
        this._catalogStates = new Map();
        this._catalogNavigators = new Map();
        this.createCatalogWindowState('NORMAL');
    }

    /**
	 * Builds one catalog type's window, navigator and viewer, and files them.
	 * Each type gets its *own* main window. (AS3 also makes the BUILDERS_CLUB
	 * window 15px taller; the RPG fork removed the Builders Club.)
	 *
	 * @param catalogType - The catalog type to build
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::createCatalogWindowState()
    private createCatalogWindowState(catalogType: string): CatalogWindowState
    {
        const existing = this._catalogStates?.get(catalogType) ?? null;

        if(existing != null) return existing;

        const state = new CatalogWindowState(catalogType);

        state.mainContainer = this.createMainWindow(catalogType);

        state.catalogNavigator = new CatalogNavigator(this, state.mainContainer, catalogType);
        state.catalogViewer = new CatalogViewer(
            this,
            state.mainContainer.findChildByName('layoutContainer') as unknown as IWindowContainer,
            catalogType
        );

        this._catalogStates!.set(catalogType, state);
        this._catalogNavigators!.set(catalogType, state.catalogNavigator as CatalogNavigator);

        return state;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::getCatalogState()
    private getCatalogState(catalogType: string): CatalogWindowState | null
    {
        return this._catalogStates?.get(catalogType) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::ensureCatalogState()
    private ensureCatalogState(catalogType: string): CatalogWindowState
    {
        if(this._catalogStates == null) this._catalogStates = new Map();
        if(this._catalogNavigators == null) this._catalogNavigators = new Map();

        return this.getCatalogState(catalogType) ?? this.createCatalogWindowState(catalogType);
    }

    /**
	 * Makes `catalogType` the active one and re-points the flat fields at its state.
	 *
	 * The flat `_mainWindow`/`_catalogViewer` are AS3's own design, not a
	 * simplification: it keeps the same two fields and re-points them here, so the
	 * ~40 call sites that read them need no notion of catalog type.
	 *
	 * @param catalogType - The catalog type to activate
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::setActiveCatalogState()
    private setActiveCatalogState(catalogType: string): CatalogWindowState
    {
        this._catalogType = catalogType;

        const state = this.ensureCatalogState(catalogType);

        this._mainWindow = state.mainContainer;
        this._catalogViewer = state.catalogViewer;

        return state;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::updatePurse()
    // win63's decompile of this method is corrupted (literal `if(true)`/`if(false)` branches
    // replacing the real hasClubLeft/isVIP checks) - ported from the clean vortex-client
    // reference instead. This replaces the previous setElementImage('creditsIcon'/'pixelsIcon'/
    // 'clubIcon', ...) calls, which were a DIFFERENT (dead, non-bitmap-based in the real client)
    // code path that doesn't match this layout's actual elements - updatePurse() only touches
    // clubIcon/clubText via IIconWindow.style, and registers localization parameters that
    // ${catalog.purse.creditbalance}/${catalog.purse.pixelbalance} template captions elsewhere
    // resolve on their own.
    private updatePurse(): void
    {
        if(this._mainWindow == null) return;

        this._localization?.registerParameter('catalog.purse.creditbalance', 'balance', String(this._purse.credits));
        this._localization?.registerParameter('catalog.purse.pixelbalance', 'balance', String(this._purse.getActivityPointsForType(0)));

        let style = 11;
        let key: string;

        if(!this._purse.hasClubLeft)
        {
            key = 'catalog.purse.club.join';
        }
        else
        {
            if(this._purse.isVIP)
            {
                key = 'catalog.purse.vipdays';
                style = 12;
            }
            else
            {
                key = 'catalog.purse.clubdays';
            }

            this._localization?.registerParameter(key, 'days', String(this._purse.clubDays));
            this._localization?.registerParameter(key, 'months', String(this._purse.clubPeriods));
        }

        const clubIcon = this._mainWindow.findChildByName('clubIcon');

        if(clubIcon != null)
        {
            clubIcon.style = style;
        }

        const clubText = this._mainWindow.findChildByName('clubText');

        if(clubText != null)
        {
            clubText.caption = this._localization?.getLocalization(key) ?? '';
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::showMainWindow()
    private showMainWindow(): void
    {
        if(this._windowManager != null && this._mainWindow != null && this._mainWindow.parent == null)
        {
            const desktop = this._windowManager.getDesktop(1) as unknown as IWindowContainer | null;

            // AS3 sets visible before attaching. Nothing else ever sets it back to true,
            // so a window built hidden — as AS3 builds them — depends on this line.
            this._mainWindow.visible = true;

            desktop?.addChild(this._mainWindow);
        }
    }

    private hideMainWindow(): void
    {
        if(this._windowManager != null && this._mainWindow != null && this._mainWindow.parent != null)
        {
            const desktop = this._windowManager.getDesktop(1) as unknown as IWindowContainer | null;

            // The club-purchase veto. Note AS3 clears it outside this inner `if` but inside the
            // outer one: a hide attempted while the window is already detached does *not* consume
            // it, so the veto survives until a hide that would really have closed something.
            if(desktop != null && !this._suppressNextHideMainWindow)
            {
                desktop.removeChild(this._mainWindow);
                this._catalogViewer?.catalogWindowClosed();
            }

            this._suppressNextHideMainWindow = false;
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::mainWindowVisible()
    private mainWindowVisible(): boolean 
    {
        return this._windowManager != null && this._mainWindow != null && this._mainWindow.parent != null;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::setElementImage()
    private setElementImage(elementName: string, assetName: string): void 
    {
        const element = this._mainWindow?.findChildByName(elementName) as unknown as IBitmapWrapperWindow | null;

        if(element == null) 
        {
            log.warn(`Could not find element: ${elementName}`);

            return;
        }

        const asset = this.assets?.getAssetByName(assetName);

        if(asset) 
        {
            element.bitmap = asset.content as ImageBitmap;
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::refreshCatalogIndex()
    private refreshCatalogIndex(catalogType: string): void 
    {
        this.connection?.send(new GetCatalogIndexComposer(catalogType));
    }

    private onWindowClose = (_event: WindowEvent): void =>
    {
        this.hideMainWindow();
        this._catalogViewer?.catalogWindowClosed();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onGuildVisualSettingsChanged()
    private onGuildVisualSettingsChanged = (event: GuildSettingsChangedInManageEvent): void =>
    {
        this._groupMembershipsController?.onGuildVisualSettingsChanged(event.guildId);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onHabboToolbarEvent()
    private onHabboToolbarEvent = (event: HabboToolbarEvent): void => 
    {
        if(event.type !== HabboToolbarEvent.TOOLBAR_CLICK) return;

        switch(event.iconId) 
        {
            case HabboToolbarIconEnum.CATALOGUE:
                this.toggleCatalog('NORMAL');
                break;
        }
    };

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::onCatalogIndex()
    private onCatalogIndex(event: IMessageEvent): void
    {
        const parser = event.parser as CatalogIndexMessageEventParser | null;

        if(!parser || !parser.root) return;

        const navigator = this.getCatalogNavigator(parser.catalogType);

        if(navigator == null) return;

        // Set before the index is built, and read again by `toggleCatalog()` — the server sends
        // this with *every* index, so it is the authority on whether the badge should be on.
        this._newAdditionsAvailable = parser.newAdditionsAvailable;

        navigator.buildCatalogIndex(parser.root);

        if(parser.catalogType === this._catalogType) 
        {
            navigator.showIndex();
        }

        switch(this._requestedPage.requestType)
        {
            case RequestedPage.REQUEST_TYPE_ID:
                navigator.openPageById(this._requestedPage.requestId, this._requestedPage.requestedOfferId);
                this._requestedPage.resetRequest();
                break;
            case RequestedPage.REQUEST_TYPE_NAME:
                navigator.openPage(this._requestedPage.requestName);
                this._requestedPage.resetRequest();
                break;
            default:
                // Four conditions, and all four are needed: something new to show, the hotel's
                // notification switch on, the auto-open not separately disabled, and the NORMAL
                // catalog.
                if(this._newAdditionsAvailable
                    && this._newItemsNotificationEnabled
                    && !this.newAdditionsPageOpenDisabled
                    && parser.catalogType === 'NORMAL')
                {
                    this.events.emit(CatalogEvent.CATALOG_NEW_ITEMS_SHOW, new CatalogEvent(CatalogEvent.CATALOG_NEW_ITEMS_SHOW));
                    this.openCatalogPage('new_additions');

                    break;
                }

                navigator.loadFrontPage();
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::markNewAdditionPageOpened()
    private markNewAdditionPageOpened(): void
    {
        this.connection?.send(new MarkCatalogNewAdditionsPageOpenedComposer());
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_7503
    // Name DERIVED: obfuscated in every tree; `parser.newAdditionsAvailable` is what identifies it.
    private _newAdditionsAvailable: boolean = false;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::_SafeStr_9410
    // Read once at initComponent, as AS3 does — a config change mid-session does not move it.
    private _newItemsNotificationEnabled: boolean = false;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::isNewItemsNotificationEnabled()
    private isNewItemsNotificationEnabled(): boolean
    {
        return this.getBoolean('toolbar.new_additions.notification.enabled');
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get newAdditionsPageOpenDisabled()
    get newAdditionsPageOpenDisabled(): boolean
    {
        return this.getBoolean('catalog.new.additions.page.open.disabled');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onCatalogPage()
    private onCatalogPage(event: IMessageEvent): void 
    {
        const parser = event.parser as CatalogPageMessageEventParser | null;

        if(!parser) return;

        // Resolve the state the *response* belongs to, not the active one. A page for
        // the type the user is no longer looking at still renders into its own viewer;
        // dropping it (`parser.catalogType !== this._catalogType`) threw away the page that
        // was in flight when the type switched.
        const state = this.getCatalogState(parser.catalogType);

        if(state == null || state.catalogViewer == null) return;

        const localization = new PageLocalization(
            [...(parser.localization?.images ?? [])],
            [...(parser.localization?.texts ?? [])]
        );

        const offers: IPurchasableOffer[] = [];

        for(const offerData of parser.offers) 
        {
            const products = offerData.products.map((productData) =>
            {
                // AS3 resolves the furniture data once and hands it to both the count
                // override and the Product (_loc8_).
                const furnitureData = this.getFurnitureData(productData.furniClassId, productData.productType);

                return new Product(
                    productData.productType,
                    productData.furniClassId,
                    productData.extraParam,
                    this.getProductCountOverride(offerData.localizationId, furnitureData, productData.productCount),
                    this.getProductData(offerData.localizationId),
                    furnitureData,
                    this,
                    productData.uniqueLimitedItem,
                    productData.uniqueLimitedItemSeriesSize,
                    productData.uniqueLimitedItemsLeft
                );
            });

            if(products.length === 0) continue;

            const offer = new Offer(
                offerData.offerId,
                offerData.localizationId,
                offerData.isRent,
                offerData.priceInCredits,
                offerData.priceInActivityPoints,
                offerData.activityPointType,
                offerData.priceInSilver,
                offerData.giftable,
                offerData.clubLevel,
                products,
                offerData.bundlePurchaseAllowed,
                this
            );

            if(offer.productContainer != null && this.isOfferCompatibleWithCurrentMode(offer)) 
            {
                offers.push(offer);
            }
            else 
            {
                offer.dispose();
            }
        }

        if(parser.frontPageItems != null && parser.frontPageItems.length > 0)
        {
            this._frontPageItems = parser.frontPageItems;
        }

        // lastPageRequestId is a race guard: only render the page this state actually
        // asked for last. A reply for a page the user has already navigated away from
        // arrives anyway, and must not overwrite what replaced it.
        if(state.lastPageRequestId === parser.pageId)
        {
            state.catalogViewer.showCatalogPage(
                parser.pageId,
                parser.layoutCode,
                localization,
                offers,
                parser.offerId,
                parser.acceptSeasonCurrencyAsCredits
            );
        }

        this.setCatalogBusy(parser.catalogType, false);
    }

    // AS3: sources/win63_version/habbo/catalog/HabboCatalog.as::isOfferCompatibleWithCurrentMode()
    private isOfferCompatibleWithCurrentMode(offer: IPurchasableOffer): boolean 
    {
        return this._catalogType === 'NORMAL'
            || (offer.pricingModel !== 'pricing_model_bundle' && offer.pricingModel !== 'pricing_model_multi');
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::addMessageEvent()
    private addMessageEvent(event: IMessageEvent): void 
    {
        this._communication?.addMessageEvent(event);
        this._messageEvents.push(event);
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::onCreditBalance()
    private onCreditBalance(event: IMessageEvent): void 
    {
        if(!event) return;

        const parser = event.parser as CreditBalanceEventParser | null;

        if(!parser) return;

        this._purse.credits = parser.balance;

        // Both of these were missing: without updatePurse() the catalog header keeps showing the
        // old balance until something else refreshes it.
        this.updatePurse();

        if(!this._firstCreditBalancePending)
        {
            this._soundManager?.playSound('HBST_purchase');
        }

        this._firstCreditBalancePending = false;

        this.events.emit(PurseEvent.CREDIT_BALANCE, new PurseEvent(PurseEvent.CREDIT_BALANCE, parser.balance, 0));
        this.events.emit(PurseUpdateEvent.UPDATE, new PurseUpdateEvent());
    }

    /**
     * The server accepted the entry into a limited-edition raffle.
     *
     * The parser's `className` goes unread, in AS3 too: the dialog already knows which product it
     * is showing, so all this does is switch its panel over to the "raffling..." animation.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::onLtdRaffleEntered()
    private onLtdRaffleEntered(_event: IMessageEvent): void
    {
        this._purchaseConfirmationDialog?.ltdRaffleStarted();
    }

    /**
     * The raffle the player entered has been drawn.
     *
     * Tears down the purchase dialog whether they won or lost — `ltdRaffleEnded()` first, so the
     * countdown stops before the window goes — and leaves a notification behind, since the dialog
     * that would have shown the result is the thing being closed.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::onLtdRaffleResult()
    private onLtdRaffleResult(event: IMessageEvent): void
    {
        if(this._purchaseConfirmationDialog != null)
        {
            this._purchaseConfirmationDialog.ltdRaffleEnded();
            this._purchaseConfirmationDialog.dispose();
            this._purchaseConfirmationDialog = null;
        }

        const parser = event?.parser as LtdRaffleResultMessageParser | null;

        if(parser == null) return;

        // `hasWon` is `resultCode === 0`; zero is the win, not the failure.
        const key = `notification.raffle.${parser.hasWon ? 'won' : 'lost'}`;

        this._notifications?.addItem(this._localization?.getLocalization(key, key) ?? key, 'ltd');
    }

    /**
     * The two collectible currencies, each its own message and each one int.
     *
     * Note what they do *not* do, next to `onCreditBalance()` above: no `updatePurse()` and no
     * purchase sound. AS3 dispatches the two events and stops, which is why the catalog header
     * only redraws once something else refreshes it.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::onSilverBalance()
    private onSilverBalance(event: IMessageEvent): void
    {
        const parser = event?.parser as SilverBalanceMessageParser | null;

        if(!parser) return;

        this._purse.silverBalance = parser.silverBalance;

        this.events.emit(PurseEvent.SILVER_BALANCE, new PurseEvent(PurseEvent.SILVER_BALANCE, parser.silverBalance, 0));
        this.events.emit(PurseUpdateEvent.UPDATE, new PurseUpdateEvent());
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::onEmeraldBalance()
    private onEmeraldBalance(event: IMessageEvent): void
    {
        const parser = event?.parser as EmeraldBalanceMessageParser | null;

        if(!parser) return;

        this._purse.emeraldBalance = parser.emeraldBalance;

        this.events.emit(PurseEvent.EMERALD_BALANCE, new PurseEvent(PurseEvent.EMERALD_BALANCE, parser.emeraldBalance, 0));
        this.events.emit(PurseUpdateEvent.UPDATE, new PurseUpdateEvent());
    }

    /**
	 * Single-currency balance update, as opposed to onActivityPoints()'s whole wallet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onActivityPointNotification()
    private onActivityPointNotification(event: IMessageEvent): void
    {
        if(!event) return;

        const notification = event as HabboActivityPointNotificationMessageEvent;

        if(!notification.parser) return;

        // AS3 writes straight into the purse's dictionary (`purse.activityPoints[type] = amount`),
        // which leaves the other currencies untouched - setActivityPoints() would clear them.
        this._purse.activityPoints.set(notification.type, notification.amount);

        this.updatePurse();

        // Only duckets (type 0) get a chime; the seasonal currencies are silent.
        if(notification.type === 0)
        {
            this._soundManager?.playSound('HBST_pixels');
        }

        this.events.emit(
            PurseEvent.ACTIVITY_POINT_BALANCE,
            new PurseEvent(PurseEvent.ACTIVITY_POINT_BALANCE, notification.amount, notification.type)
        );
        this.events.emit(PurseUpdateEvent.UPDATE, new PurseUpdateEvent());
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::onActivityPoints()
    private onActivityPoints(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as ActivityPointsMessageParser | null;

        if(!parser) return;

        this._purse.setActivityPoints(parser.points);

        for(const [type, amount] of parser.points) 
        {
            this.events.emit(PurseEvent.ACTIVITY_POINT_BALANCE, new PurseEvent(PurseEvent.ACTIVITY_POINT_BALANCE, amount, type));
        }

        this.events.emit(PurseUpdateEvent.UPDATE, new PurseUpdateEvent());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onSubscriptionInfo()
    private onSubscriptionInfo(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as ScrSendUserInfoMessageParser | null;

        if(!parser) return;

        this._purse.clubDays = Math.max(0, parser.daysToPeriodEnd);
        this._purse.clubPeriods = Math.max(0, parser.periodsSubscribedAhead);
        this._purse.isVIP = parser.isVIP;
        this._purse.pastClubDays = parser.pastClubDays;
        this._purse.pastVipDays = parser.pastVipDays;
        this._purse.isExpiring = parser.responseType === 3;
        this._purse.minutesUntilExpiration = parser.minutesUntilExpiration;
        this._purse.minutesSinceLastModified = parser.minutesSinceLastModified;

        if(parser.productName === 'habbo_club' || parser.productName === 'club_habbo')
        {
            HabboWebTools.subscriptionUpdated(parser.isVIP && parser.minutesUntilExpiration > 0);
        }

        this.updatePurse();

        // responseType 2 is the post-purchase push: the club level the pages were built against is
        // stale, so the whole catalog is rebuilt and the page the purchase started from reopened.
        // AS3 uses the bare literal here, as it does with 3 for `isExpiring` above.
        if(parser.responseType === 2)
        {
            this.reset();

            if(this._pageToReopenAfterVipPurchase !== null)
            {
                this.openCatalogPage(this._pageToReopenAfterVipPurchase);
                this._pageToReopenAfterVipPurchase = null;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onPurchaseOK()
    private onPurchaseOK(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as PurchaseOKMessageEventParser | null;
        const offer = parser?.offer;

        if(offer)
        {
            this.events.emit(CatalogFurniPurchaseEvent.CATALOG_FURNI_PURCHASE, new CatalogFurniPurchaseEvent(offer.localizationId));
        }

        this.flyPurchasedIconToToolbar();

        // AS3 closes the confirmation here, not on the buy click: the dialog stays up with its
        // buttons disabled until the server answers, which is what makes a rejected purchase leave
        // it open for onPurchaseError/onNotEnoughBalance to speak to.
        this._purchaseConfirmationDialog?.dispose();
        this._purchaseConfirmationDialog = null;
    }

    /**
     * Flies the confirmation dialog's product icon into the toolbar button the item just landed
     * behind.
     *
     * Skipped for the two purchases where the item is *not* going into the inventory: one bought
     * to be dragged straight into the room (`_placingFurni`) and one bought as a gift. Effects
     * (product type "e") land in the me-menu instead, which is the only reason the target icon is
     * not a constant.
     *
     * AS3 clones the BitmapData before handing it over because the dialog is disposed two lines
     * later; an `ImageBitmap` is not owned by the window the same way, so the reference travels as
     * is — `HabboToolbar.createTransitionToIcon()` draws it into its own motion sprite.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onPurchaseOK()
    private flyPurchasedIconToToolbar(): void
    {
        const dialog = this._purchaseConfirmationDialog;

        if(dialog === null || this._placingFurni || dialog.isGiftPurchase()) return;

        const iconWrapper = dialog.getIconWrapper();
        const bitmap = iconWrapper?.bitmap ?? null;

        if(iconWrapper === null || bitmap === null) return;

        const position = {x: 0, y: 0};

        iconWrapper.getGlobalPosition(position);

        const iconId = dialog.productType === 'e'
            ? HabboToolbarIconEnum.MEMENU
            : HabboToolbarIconEnum.INVENTORY;

        this._toolbar?.createTransitionToIcon(iconId, bitmap, position.x, position.y);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onPurchaseError()
    private onPurchaseError(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as PurchaseErrorMessageEventParser | null;

        if(!parser) return;

        const description = parser.errorCode > 0
            ? `\${catalog.alert.purchaseerror.description.${parser.errorCode}}`
            : '${catalog.alert.purchaseerror.description}';

        this._windowManager?.alert('${catalog.alert.purchaseerror.title}', description, 0, this.alertDialogEventProcessor);

        // AS3 tears the confirmation down here too - the buy and cancel buttons were disabled when
        // the composer went out, so leaving it up would strand the user on a dead dialog.
        this._purchaseConfirmationDialog?.dispose();
        this._purchaseConfirmationDialog = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onPurchaseNotAllowed()
    private onPurchaseNotAllowed(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as PurchaseNotAllowedMessageEventParser | null;

        if(!parser) return;

        const description = parser.errorCode - 1 === 0
            ? '${catalog.alert.purchasenotallowed.hc.description}'
            : '${catalog.alert.purchasenotallowed.unknown.description}';

        this._windowManager?.alert('${catalog.alert.purchasenotallowed.title}', description, 0, this.alertDialogEventProcessor);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onNotEnoughBalance()
    private onNotEnoughBalance(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as NotEnoughBalanceMessageEventParser | null;

        if(!parser) return;

        if(parser.notEnoughCredits)
        {
            this.showNotEnoughCreditsAlert();
        }
        else if(parser.notEnoughActivityPoints)
        {
            this.showNotEnoughActivityPointsAlert(parser.activityPointType);
        }

        this._purchaseConfirmationDialog?.notEnoughCredits();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onVoucherRedeemOk()
    private onVoucherRedeemOk(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as VoucherRedeemOkMessageEventParser | null;

        if(!parser) return;

        let description = '${catalog.alert.voucherredeem.ok.description}';

        if(parser.productName !== '')
        {
            const key = 'catalog.alert.voucherredeem.ok.description.furni';

            this._localization?.registerParameter(key, 'productName', parser.productName);
            this._localization?.registerParameter(key, 'productDescription', parser.productDescription);
            description = `\${${key}}`;
        }

        this._windowManager?.alert('${catalog.alert.voucherredeem.ok.title}', description, 0, this.alertDialogEventProcessor);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onVoucherRedeemError()
    private onVoucherRedeemError(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as VoucherRedeemErrorMessageEventParser | null;

        if(!parser) return;

        const description = `\${catalog.alert.voucherredeem.error.description.${parser.errorCode}}`;

        this._windowManager?.alert('${catalog.alert.voucherredeem.error.title}', description, 0, this.alertDialogEventProcessor);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onHabboClubOffers()
    private onHabboClubOffers(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as HabboClubOffersMessageEventParser | null;

        if(!parser || !this._clubBuyController) return;

        if(parser.source === 0 || parser.source === 1 || parser.source === 2 || parser.source === 6)
        {
            this._clubBuyController.onOffers(parser.offers);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onHabboClubExtendOffer()
    // Unlike onHabboClubOffers() above, AS3 forwards the raw event here (not its parser) -
    // ClubExtendController.onOffer() does its own event.getParser() extraction. Preserved as-is,
    // a genuine inconsistency in the primary source between these two otherwise-similar handlers.
    private onHabboClubExtendOffer(event: IMessageEvent): void
    {
        // Not a user-driven open: this arrives on a server message, so it initialises
        // against whichever type is already current rather than switching to one.
        if(!this._initialized) this.init(this._catalogType);

        if(this._clubExtendController) this._clubExtendController.onOffer(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onClubGiftInfo()
    private onClubGiftInfo(event: IMessageEvent): void
    {
        if(!event || !this._clubGiftController) return;

        const parser = event.parser as ClubGiftInfoEventParser | null;

        if(!parser) return;

        this._clubGiftController.setInfo(parser.daysUntilNextGift, parser.giftsAvailable, parser.offers, parser.giftData);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketPlaceOffers()
    private onMarketPlaceOffers(event: IMessageEvent): void
    {
        this._marketPlace?.onOffers(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketPlaceOwnOffers()
    private onMarketPlaceOwnOffers(event: IMessageEvent): void
    {
        this._marketPlace?.onOwnOffers(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketPlaceBuyResult()
    private onMarketPlaceBuyResult(event: IMessageEvent): void
    {
        this._marketPlace?.onBuyResult(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketPlaceCancelResult()
    private onMarketPlaceCancelResult(event: IMessageEvent): void
    {
        this._marketPlace?.onCancelResult(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketPlaceCancelAllResult()
    private onMarketPlaceCancelAllResult(event: IMessageEvent): void
    {
        this._marketPlace?.onCancelAllResult(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketPlaceClearOwnHistoryResult()
    private onMarketPlaceClearOwnHistoryResult(event: IMessageEvent): void
    {
        this._marketPlace?.onClearOwnHistoryResult(event);
    }

    /**
	 * A successful listing re-reads the player's own offers, so the marketplace tab shows the new one
	 * without a manual refresh. **Only result 1 refreshes** — every other code is a refusal, and AS3
	 * leaves the view untouched rather than blanking it.
	 *
	 * The inventory subscribes this header too, for its own marketplace model; the registry allows
	 * both listeners and AS3 likewise has the two components subscribe independently.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketplaceMakeOfferResult()
    private onMarketplaceMakeOfferResult(event: IMessageEvent): void
    {
        if(!event || !this._marketPlace) return;

        const parser = event.parser as MarketplaceMakeOfferResultParser | null;

        if(!parser) return;

        if(parser.result === 1)
        {
            this._marketPlace.refreshOffers();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onRecyclerStatus()
    private onRecyclerStatus(event: IMessageEvent): void
    {
        const parser = event.parser as RecyclerStatusMessageEventParser | null;

        if(!parser || !this._recycler) return;

        this._recycler.setSystemStatus(parser.recyclerStatus, parser.recyclerTimeoutSeconds);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onRecyclerFinished()
    private onRecyclerFinished(event: IMessageEvent): void
    {
        const parser = event.parser as RecyclerFinishedMessageEventParser | null;

        if(!parser || !this._recycler) return;

        this._recycler.setFinished(parser.recyclerFinishedStatus, parser.prizeId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onRecyclerPrizes()
    private onRecyclerPrizes(event: IMessageEvent): void
    {
        const parser = event.parser as RecyclerPrizesMessageEventParser | null;

        if(!parser || !this._recycler) return;

        this._recycler.storePrizeTable(parser.prizeLevels);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onGuildMemberships()
    public onGuildMemberships(event: IMessageEvent): void
    {
        this._groupMembershipsController?.onGuildMembershipsMessageEvent(event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketplaceItemStats()
    private onMarketplaceItemStats(event: IMessageEvent): void
    {
        if(!event || !this._marketPlace) return;

        const parser = event.parser as MarketplaceItemStatsEventParser | null;

        if(!parser) return;

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
        this._marketPlace.itemStats = stats;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::onMarketplaceConfiguration()
    private onMarketplaceConfiguration(event: IMessageEvent): void
    {
        if(!event || !this._marketPlace) return;

        const parser = event.parser as MarketplaceConfigurationEventParser | null;

        if(!parser) return;

        this._marketPlace.averagePricePeriod = parser.averagePricePeriod;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::alertDialogEventProcessor()
    private alertDialogEventProcessor = (dialog: IDisposable, _event: WindowEvent): void =>
    {
        dialog.dispose();
        this.resetPlacedOfferData();
    };

    /**
     * Takes the ghost furni back out of the room. `placingItem` is true only when called from the
     * placement callbacks themselves — they are mid-placement, so restoring the catalog window
     * there would fight the drag that is still running.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::resetPlacedOfferData()
    public resetPlacedOfferData(placingItem: boolean = false): void
    {
        if(!placingItem)
        {
            this.resetObjectMover();
        }

        if(this._placedOfferData === null) return;

        if(this._placedOfferData.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        {
            this._roomEngine?.disposeObjectFurniture(this._placedOfferData.roomId, this._placedOfferData.objectId);
        }
        else if(this._placedOfferData.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            switch(this._placedOfferData.furniData?.className ?? '')
            {
                case 'floor':
                case 'wallpaper':
                case 'landscape':
                    // Re-applies the room's own three decoration types, undoing the preview.
                    this.updateRoom('reset', '');
                    break;
                default:
                    this._roomEngine?.disposeObjectWallItem(this._placedOfferData.roomId, this._placedOfferData.objectId);
            }
        }
        else
        {
            this._roomEngine?.deleteRoomObject(this._placedOfferData.objectId, this._placedOfferData.category);
        }

        this._placedOfferData.dispose();
        this._placedOfferData = null;
    }

    /**
     * Note the asymmetry, preserved from AS3: a purchase of a *different* offer clears the ghost,
     * but a purchase of the same one leaves it standing — that is the case where the ghost is about
     * to become the real item.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::syncPlacedOfferWithPurchase()
    public syncPlacedOfferWithPurchase(offer: IPurchasableOffer): void
    {
        if(this._placedOfferData !== null && this._placedOfferData.offerId !== offer.offerId)
        {
            this.resetPlacedOfferData();
        }
    }
}
