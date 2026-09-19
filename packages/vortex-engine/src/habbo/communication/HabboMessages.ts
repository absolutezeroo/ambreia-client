import {
    CloseIssueDefaultActionMessageComposer,
    CloseIssuesMessageComposer,
    DefaultSanctionMessageComposer,
    GetCfhChatlogMessageComposer,
    GetModeratorRoomInfoMessageComposer,
    GetModeratorUserInfoMessageComposer,
    GetRoomChatlogMessageComposer,
    GetRoomVisitsMessageComposer,
    GetUserChatlogMessageComposer,
    ModAlertMessageComposer,
    ModBanMessageComposer,
    ModKickMessageComposer,
    ModMessageMessageComposer,
    ModMuteMessageComposer,
    ModToolPreferencesComposer,
    ModToolSanctionComposer,
    ModTradingLockMessageComposer,
    ModerateRoomMessageComposer,
    ModeratorActionMessageComposer,
    PeerUsersClassificationMessageComposer,
    PickIssuesMessageComposer,
    ReleaseIssuesMessageComposer,
    RoomUsersClassificationMessageComposer,
} from './messages/outgoing/moderation';
import {
    CallForHelpFromSelfieMessageComposer,
    DeletePendingCallsForHelpMessageComposer,
    ReportBullyMessageComposer,
    GetQuizQuestionsComposer,
    PostQuizAnswersComposer,
    GetGuideReportingStatusMessageComposer,
    GetPendingCallsForHelpMessageComposer,
    GetMyCfhReportStatusMessageComposer,
    GuideSessionCreateMessageComposer,
    GuideSessionInviteRequesterMessageComposer,
    ChatReviewGuideDecidesOnOfferMessageComposer,
    ChatReviewGuideDetachedMessageComposer,
    ChatReviewGuideVoteMessageComposer,
    GuideSessionFeedbackMessageComposer,
    GuideSessionGetRequesterRoomMessageComposer,
    GuideSessionGuideDecidesMessageComposer,
    GuideSessionIsTypingMessageComposer,
    GuideSessionMessageMessageComposer,
    GuideSessionOnDutyUpdateMessageComposer,
    GuideSessionRequesterCancelsMessageComposer,
    GuideSessionResolvedMessageComposer,
    CallForHelpMessageComposer,
    CallForHelpFromIMMessageComposer,
    CallForHelpFromPhotoMessageComposer,
    CallForHelpFromForumMessageMessageComposer,
    CallForHelpFromForumThreadMessageComposer,
    ChatReviewSessionCreateMessageComposer,
    GetCfhStatusMessageComposer,
} from './messages/outgoing/help';
import {
    GetRentOrBuyoutOfferMessageComposer,
    ExtendRentOrBuyoutFurniMessageComposer,
    ExtendRentOrBuyoutStripItemMessageComposer,
} from './messages/outgoing/rent';
import {RentOrBuyoutOfferMessageEvent} from './messages/incoming/rent/RentOrBuyoutOfferMessageEvent';
import {
    ForwardToACompetitionRoomMessageComposer,
    ForwardToASubmittableRoomMessageComposer,
    ForwardToRandomCompetitionRoomMessageComposer,
    GetIsUserPartOfCompetitionMessageComposer,
    GetSecondsUntilMessageComposer,
    RoomCompetitionInitMessageComposer,
    SubmitRoomToCompetitionMessageComposer,
    VoteForRoomMessageComposer,
} from './messages/outgoing/competition';
import {GetInterstitialMessageComposer} from './messages/outgoing/advertisement/GetInterstitialMessageComposer';
import {FriendRequestQuestCompleteMessageComposer} from './messages/outgoing/quest/FriendRequestQuestCompleteMessageComposer';
import {SanctionStatusMessageEvent} from './messages/incoming/help/SanctionStatusMessageEvent';
import {CompetitionEntryMessageEvent} from './messages/incoming/quest/CompetitionEntryMessageEvent';
import {EpicPopupMessageEvent} from './messages/incoming/quest/EpicPopupMessageEvent';
import type {
    ComposerClass,
    EventClass,
    IMessageConfiguration
} from '@core/communication/messages/IMessageConfiguration';
import {Logger} from '@core/utils/Logger';
import {RequestSpamWallPostItMessageEvent} from './messages/incoming/room/furniture/RequestSpamWallPostItMessageEvent';
import {AddSpamWallPostItMessageComposer} from './messages/outgoing/room/furniture/AddSpamWallPostItMessageComposer';

// Incoming Events - Handshake
import {
    AuthenticationOKMessageEvent,
    CompleteDiffieHandshakeMessageEvent,
    DisconnectReasonMessageEvent,
    GenericErrorMessageEvent,
    IdentityAccountsEvent,
    InitDiffieHandshakeMessageEvent,
    IsFirstLoginOfDayMessageEvent,
    NoobnessLevelMessageEvent,
    PingMessageEvent,
    UniqueMachineIdMessageEvent,
    UserObjectMessageEvent,
    UserRightsMessageEvent,
} from './messages/incoming/handshake';

// Incoming Events - Availability
import {
    AvailabilityStatusMessageEvent,
    LoginFailedHotelClosedMessageEvent,
    MaintenanceStatusMessageEvent,
} from './messages/incoming/availability';

// Incoming Events - Avatar
import {FigureUpdateMessageEvent,} from './messages/incoming/avatar';

// Incoming Events - Navigator
import {
    CanCreateRoomEventMessageEvent,
    CanCreateRoomMessageEvent,
    CategoriesWithVisitorCountMessageEvent,
    CompetitionRoomsDataMessageEvent,
    ConvertedRoomIdMessageEvent,
    DoorbellMessageEvent,
    FavouriteChangedMessageEvent,
    FavouritesMessageEvent,
    FlatAccessDeniedMessageEvent,
    FlatCreatedMessageEvent,
    GetGuestRoomResultMessageEvent,
    GuestRoomSearchResultMessageEvent,
    NavigatorSettingsMessageEvent,
    OfficialRoomsMessageEvent,
    PopularRoomTagsResultMessageEvent,
    RaidProtectionCapabilityMessageEvent,
    RaidProtectionSaveResultMessageEvent,
    RaidProtectionSettingsMessageEvent,
    RoomEventCancelMessageEvent,
    RoomEventMessageEvent,
    NoOwnedRoomsAlertMessageEvent,
    NoSuchFlatMessageEvent,
    RoomFilterSettingsMessageEvent,
    RoomInfoUpdatedMessageEvent,
    RoomMuteAllMessageEvent,
    RoomSettingsErrorMessageEvent,
    RoomRatingMessageEvent,
    UserEventCatsMessageEvent,
    UserFlatCatsMessageEvent,
} from './messages/incoming/navigator';

// Incoming Events - Notifications
// Incoming Events - Notifications (extended)
import {
    AccountSafetyLockStatusChangeMessageEvent,
    ActivityPointsMessageEvent,
    ClubGiftNotificationEvent,
    ClubGiftSelectedEvent,
    ElementPointerMessageEvent,
    HabboAchievementNotificationMessageEvent,
    HabboActivityPointNotificationMessageEvent,
    HabboBroadcastMessageEvent,
    InfoFeedEnableMessageEvent,
    InfoHotelClosedMessageEvent,
    InfoHotelClosingMessageEvent,
    ModeratorCautionEvent,
    ModeratorMessageEvent,
    MOTDNotificationEvent,
    NotificationDialogMessageEvent,
    PetLevelNotificationEvent,
    PetReceivedMessageEvent,
    PetRespectFailedEvent,
    PetRespectNotificationEvent,
    RespectNotificationMessageEvent,
    RestoreClientMessageEvent,
    RoomMessageNotificationMessageEvent,
    UserBannedMessageEvent,
} from './messages/incoming/notifications';

// Incoming Events - Inventory
import {
    AchievementsScoreMessageEvent,
    AvatarEffectActivatedMessageEvent,
    AvatarEffectAddedMessageEvent,
    AvatarEffectExpiredMessageEvent,
    AvatarEffectsMessageEvent,
    BadgeReceivedEvent,
    BadgeInformationEvent,
    BadgesMessageEvent,
    BotAddedToInventoryMessageEvent,
    BotInventoryMessageEvent,
    BotRemovedFromInventoryMessageEvent,
    ConfirmBreedingRequestEvent,
    ConfirmBreedingResultEvent,
    CreditBalanceEvent,
    FigureSetIdsMessageEvent,
    FurniListAddOrUpdateMessageEvent,
    FurniListInvalidateMessageEvent,
    FurniListMessageEvent,
    FurniListRemoveMessageEvent,
    FurniListRemoveMultipleMessageEvent,
    GoToBreedingNestFailureEvent,
    NestBreedingSuccessEvent,
    PetAddedToInventoryEvent,
    PetBreedingEvent,
    PetInventoryMessageEvent,
    PetRemovedFromInventoryEvent,
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
    TradingYouAreNotAllowedEvent,
    UnseenItemsMessageEvent,
} from './messages/incoming/inventory';

// Incoming Events - Mystery Box
import {
    CancelMysteryBoxWaitMessageEvent,
    GotMysteryBoxPrizeMessageEvent,
    MysteryBoxKeysMessageEvent,
    ShowMysteryBoxWaitMessageEvent,
} from './messages/incoming/mysterybox';

// Incoming Events - Catalog
import {RemainingMutePeriodMessageEvent} from './messages/incoming/room/session/RemainingMutePeriodMessageEvent';
import {BadgePointLimitsMessageEvent} from './messages/incoming/inventory/badges/BadgePointLimitsMessageEvent';
import {PostItPlacedMessageEvent} from './messages/incoming/inventory/furni/PostItPlacedMessageEvent';
import {SilverBalanceMessageEvent} from './messages/incoming/collectibles/SilverBalanceMessageEvent';
import {EmeraldBalanceMessageEvent} from './messages/incoming/collectibles/EmeraldBalanceMessageEvent';
import {NftAssetsMessageEvent} from './messages/incoming/collectibles/NftAssetsMessageEvent';
import {TradeNftAssetsMessageEvent} from './messages/incoming/collectibles/TradeNftAssetsMessageEvent';
import {NftStorePurchaseMessageEvent} from './messages/incoming/collectibles/NftStorePurchaseMessageEvent';
import {NftTransferAssetsResultMessageEvent} from './messages/incoming/collectibles/NftTransferAssetsResultMessageEvent';
import {CollectibleMintingEnabledMessageEvent} from './messages/incoming/collectibles/CollectibleMintingEnabledMessageEvent';
import {NftCollectionsScoreMessageEvent} from './messages/incoming/collectibles/NftCollectionsScoreMessageEvent';
import {NftClaimResultMessageEvent} from './messages/incoming/collectibles/NftClaimResultMessageEvent';
import {CollectibleWalletAddressesMessageEvent} from './messages/incoming/collectibles/CollectibleWalletAddressesMessageEvent';
import {NftRewardItemClaimResultMessageEvent} from './messages/incoming/collectibles/NftRewardItemClaimResultMessageEvent';
import {CollectibleMintTokenCountMessageEvent} from './messages/incoming/collectibles/CollectibleMintTokenCountMessageEvent';
import {CollectibleMintableItemResultMessageEvent} from './messages/incoming/collectibles/CollectibleMintableItemResultMessageEvent';
import {RedeemNftLootBoxResultMessageEvent} from './messages/incoming/collectibles/RedeemNftLootBoxResultMessageEvent';
import {NftTransferFeeMessageEvent} from './messages/incoming/collectibles/NftTransferFeeMessageEvent';
import {NftBonusItemClaimResultMessageEvent} from './messages/incoming/collectibles/NftBonusItemClaimResultMessageEvent';
import {NftCollectionsMessageEvent} from './messages/incoming/collectibles/NftCollectionsMessageEvent';
import {NftClaimsMessageEvent} from './messages/incoming/collectibles/NftClaimsMessageEvent';
import {NftStoreOffersMessageEvent} from './messages/incoming/collectibles/NftStoreOffersMessageEvent';
import {CollectibleMintTokenOffersMessageEvent} from './messages/incoming/collectibles/CollectibleMintTokenOffersMessageEvent';
import {CollectableMintableItemTypesMessageEvent} from './messages/incoming/collectibles/CollectableMintableItemTypesMessageEvent';
import {RedeemNftLootBoxStateMessageEvent} from './messages/incoming/collectibles/RedeemNftLootBoxStateMessageEvent';
import {NftTransferAssetsComposer} from './messages/outgoing/collectibles/NftTransferAssetsComposer';
import {GetMintTokenOffersComposer} from './messages/outgoing/collectibles/GetMintTokenOffersComposer';
import {GetCollectorScoreComposer} from './messages/outgoing/collectibles/GetCollectorScoreComposer';
import {ClaimNftClaimsComposer} from './messages/outgoing/collectibles/ClaimNftClaimsComposer';
import {GetNftStoreOffersComposer} from './messages/outgoing/collectibles/GetNftStoreOffersComposer';
import {GetCollectibleWalletAddressesComposer} from './messages/outgoing/collectibles/GetCollectibleWalletAddressesComposer';
import {GetNftCollectionsComposer} from './messages/outgoing/collectibles/GetNftCollectionsComposer';
import {GetCollectibleMintableItemTypesComposer} from './messages/outgoing/collectibles/GetCollectibleMintableItemTypesComposer';
import {GetCollectibleMintingEnabledComposer} from './messages/outgoing/collectibles/GetCollectibleMintingEnabledComposer';
import {GetNftClaimsComposer} from './messages/outgoing/collectibles/GetNftClaimsComposer';
import {MintItemComposer} from './messages/outgoing/collectibles/MintItemComposer';
import {NftCollectiblesClaimRewardItemComposer} from './messages/outgoing/collectibles/NftCollectiblesClaimRewardItemComposer';
import {GetNftTransferFeeComposer} from './messages/outgoing/collectibles/GetNftTransferFeeComposer';
import {NftCollectiblesClaimBonusItemComposer} from './messages/outgoing/collectibles/NftCollectiblesClaimBonusItemComposer';
import {GetCollectibleMintTokensComposer} from './messages/outgoing/collectibles/GetCollectibleMintTokensComposer';
import {
    BonusRareInfoMessageEvent,
    ProductOfferMessageEvent,
    LimitedEditionSoldOutMessageEvent,
    GiftReceiverNotFoundMessageEvent,
    RoomAdPurchaseInfoMessageEvent,
    LtdRaffleResultMessageEvent,
    LtdRaffleEnteredMessageEvent,
    SnowWarGameTokensMessageEvent,
    TargetedOfferMessageEvent,
    TargetedOfferNotFoundMessageEvent,
    BundleDiscountRulesetMessageEvent,
    CatalogPublishedMessageEvent,
    GiftWrappingConfigurationEvent,
    BuildersClubFurniCountMessageEvent,
    BuildersClubSubscriptionStatusMessageEvent,
    CatalogIndexMessageEvent,
    CatalogPageMessageEvent,
    CatalogPageWithEarliestExpiryMessageEvent,
    ClubGiftInfoEvent,
    HabboClubExtendOfferMessageEvent,
    HabboClubOffersMessageEvent,
    LimitedOfferAppearingNextMessageEvent,
    NotEnoughBalanceMessageEvent,
    PurchaseErrorMessageEvent,
    PurchaseNotAllowedMessageEvent,
    PurchaseOKMessageEvent,
    RecyclerFinishedMessageEvent,
    RecyclerPrizesMessageEvent,
    RecyclerStatusMessageEvent,
    SellablePetPalettesMessageEvent,
    VoucherRedeemErrorMessageEvent,
    VoucherRedeemOkMessageEvent,
} from './messages/incoming/catalog';

// Incoming Events - Marketplace
import {
    MarketplaceBuyOfferResultEvent,
    MarketplaceCancelAllOffersResultEvent,
    MarketplaceCancelOfferResultEvent,
    MarketplaceClearOwnHistoryResultEvent,
    MarketplaceConfigurationEvent,
    MarketplaceItemStatsEvent,
    MarketplaceCanMakeOfferResultEvent,
    MarketplaceMakeOfferResultEvent,
    MarketPlaceOffersEvent,
    MarketPlaceOwnOffersEvent,
} from './messages/incoming/marketplace';

// Incoming Events - Landing View
import {CommunityVoteReceivedEvent, PromoArticlesMessageEvent,} from './messages/incoming/landingview';

// Incoming Events - Competition
import {CurrentTimingCodeMessageEvent} from './messages/incoming/competition';
import {
    CompetitionEntrySubmitResultMessageEvent
} from './messages/incoming/competition/CompetitionEntrySubmitResultMessageEvent';
import {CompetitionVotingInfoMessageEvent} from './messages/incoming/competition/CompetitionVotingInfoMessageEvent';
import {
    AchievementResolutionCompletedMessageEvent
} from './messages/incoming/game/lobby/AchievementResolutionCompletedMessageEvent';
import {
    AchievementResolutionProgressMessageEvent
} from './messages/incoming/game/lobby/AchievementResolutionProgressMessageEvent';
import {AchievementResolutionsMessageEvent} from './messages/incoming/game/lobby/AchievementResolutionsMessageEvent';

// Incoming Events - Quest
import {
    CommunityGoalHallOfFameMessageEvent,
    CommunityGoalProgressMessageEvent,
    ConcurrentUsersGoalProgressMessageEvent,
    DailyTasksActiveListMessageEvent,
    DailyTasksTaskUpdateMessageEvent,
    DailyTasksTasksAddedMessageEvent,
    CitizenshipQuestPromoEnabledMessageEvent,
    QuestCancelledMessageEvent,
    QuestCompletedMessageEvent,
    QuestDailyMessageEvent,
    QuestMessageEvent,
    QuestsMessageEvent,
    SeasonalQuestsMessageEvent,
} from './messages/incoming/quest';

// Incoming Events - Achievements
import {AchievementMessageEvent, AchievementsMessageEvent,} from './messages/incoming/inventory/achievements';

// Incoming Events - Room Session
import {
    CantConnectMessageEvent,
    CloseConnectionMessageEvent,
    FlatAccessibleMessageEvent,
    GamePlayerValueMessageEvent,
    HanditemConfigurationMessageEvent,
    OpenConnectionMessageEvent,
    RoomForwardMessageEvent,
    RoomQueueStatusMessageEvent,
    RoomReadyMessageEvent,
    YouAreNotSpectatorMessageEvent,
    YouArePlayingGameMessageEvent,
    YouAreSpectatorMessageEvent,
} from './messages/incoming/room/session';

// Incoming Events - Room Layout
import {RoomEntryTileMessageEvent, RoomOccupiedTilesMessageEvent,} from './messages/incoming/room/layout';
import {
    OfferRewardDeliveredMessageEvent
} from './messages/incoming/catalog/OfferRewardDeliveredMessageEvent';
import {
    HasClaimedProductResponseMessageEvent
} from './messages/incoming/catalog/HasClaimedProductResponseMessageEvent';
import {HasClaimedProductComposer} from './messages/outgoing/catalog/HasClaimedProductComposer';
import {ClaimProductComposer} from './messages/outgoing/catalog/ClaimProductComposer';
import {
    GetOccupiedTilesMessageComposer
} from './messages/outgoing/room/layout/GetOccupiedTilesMessageComposer';
import {
    GetRoomEntryTileMessageComposer
} from './messages/outgoing/room/layout/GetRoomEntryTileMessageComposer';
import {
    UpdateFloorPropertiesMessageComposer
} from './messages/outgoing/room/layout/UpdateFloorPropertiesMessageComposer';

// Incoming Events - Room Permissions
import {
    YouAreControllerMessageEvent,
    YouAreNotControllerMessageEvent,
    YouAreOwnerMessageEvent,
} from './messages/incoming/room/permissions';

// Incoming Events - Room Engine
import {
    AreaHideMessageEvent,
    BCPlacementWarningMessageEvent,
    DiceValueMessageEvent,
    FloorHeightMapMessageEvent,
    FurnitureAliasesMessageEvent,
    HeightMapMessageEvent,
    FavoriteMembershipUpdateMessageEvent,
    HeightMapUpdateMessageEvent,
    ItemAddMessageEvent,
    ItemDataUpdateMessageEvent,
    ItemRemoveMessageEvent,
    ItemRemoveMultipleMessageEvent,
    ItemsMessageEvent,
    ItemsStateUpdateMessageEvent,
    ItemStateUpdateMessageEvent,
    ItemUpdateMessageEvent,
    ObjectAddMessageEvent,
    ObjectDataUpdateMessageEvent,
    ObjectRemoveConfirmMessageEvent,
    ObjectRemoveMessageEvent,
    ObjectRemoveMultipleMessageEvent,
    ObjectsDataUpdateMessageEvent,
    ObjectsMessageEvent,
    ObjectUpdateMessageEvent,
    OneWayDoorStatusMessageEvent,
    RoomEntryInfoMessageEvent,
    RoomPropertyMessageEvent,
    RoomVisualizationSettingsEvent,
    SlideObjectBundleMessageEvent,
    SpecialRoomEffectMessageEvent,
    UserRemoveMessageEvent,
    UsersMessageEvent,
    UserUpdateMessageEvent,
    WiredMovementsMessageEvent,
} from './messages/incoming/room/engine';

// Incoming Events - Room Chat
import {
    ChatMessageEvent,
    FloodControlMessageEvent,
    ShoutMessageEvent,
    SpecialSystemChatMessageEvent,
    UserTypingMessageEvent,
    WhisperMessageEvent,
} from './messages/incoming/room/chat';

// Incoming Events - Room Furniture
import {
    OpenPetPackageRequestedMessageEvent,
    OpenPetPackageResultMessageEvent,
    PresentOpenedMessageEvent,
    RentableSpaceConfigMessageEvent,
    RoomDimmerPresetsMessageEvent,
} from './messages/incoming/room/furniture';

// Incoming Events - Room Pet
import {
    PetBreedingResultEvent,
    PetCommandsMessageEvent,
    PetExperienceEvent,
    PetFigureUpdateEvent,
    PetInfoMessageEvent,
    PetLevelUpdateEvent,
    PetPlacingErrorEvent,
    PetStatusUpdateEvent
} from './messages/incoming/room/pet';

// Incoming Events - Room Rentable Bot
import {
    BotCommandConfigurationEvent,
    BotErrorEvent,
    BotForceOpenContextMenuEvent,
    BotSkillListUpdateEvent
} from './messages/incoming/room/bot';

// Incoming Events - User Defined Room Events (Wired)
import {
    OpenEvent,
    WiredClickSettingsEvent,
    WiredClickUserResponseEvent,
    WiredEnvironmentEvent,
    WiredFurniActionEvent,
    WiredFurniAddonEvent,
    WiredFurniConditionEvent,
    WiredFurniSelectorEvent,
    WiredFurniTriggerEvent,
    WiredFurniVariableEvent,
    WiredPermissionsEvent,
    WiredRewardResultMessageEvent,
    WiredSaveSuccessEvent,
    WiredValidationErrorEvent,
    VariableFxConfigUpdateMessageEvent,
    VariableFxConfigRemoveMessageEvent,
    VariableFxStatusUpdateMessageEvent,
    VariableFxStatusRemoveMessageEvent,
    WiredApiKeyResultMessageEvent
} from './messages/incoming/userdefinedroomevents';
// Outgoing Composers - User Defined Room Events (Wired)
import {
    ApplySnapshotMessageComposer,
    OpenMessageComposer,
    UpdateActionMessageComposer,
    UpdateAddonMessageComposer,
    UpdateConditionMessageComposer,
    UpdateSelectorMessageComposer,
    UpdateTriggerMessageComposer,
    UpdateVariableMessageComposer,
    WiredClickUserMessageComposer,
    WiredDebugCommandMessageComposer,
    GenerateWiredApiKeyMessageComposer
} from './messages/outgoing/userdefinedroomevents';
import {
    GetAllVariablesMessageComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/GetAllVariablesMessageComposer';
import {
    GetAllVariablesDiffMessageComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/GetAllVariablesDiffMessageComposer';
import {
    SetWiredMenuPreferencesComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/SetWiredMenuPreferencesComposer';
import {
    RequestWiredRoomLogsComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/RequestWiredRoomLogsComposer';
import {
    SaveWiredMenuSettingsComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/SaveWiredMenuSettingsComposer';
import {
    WiredUpdateRoomComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/WiredUpdateRoomComposer';
import {
    RequestWiredMenuSettingsComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/RequestWiredMenuSettingsComposer';
import {WiredMenuSettingsEvent} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredMenuSettingsEvent';
import {WiredRoomStatsEvent} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredRoomStatsEvent';
import {WiredErrorLogsEvent} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredErrorLogsEvent';
import {
    RequestWiredRoomStatsComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/RequestWiredRoomStatsComposer';
import {
    RequestWiredErrorLogsComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/RequestWiredErrorLogsComposer';
import {
    ClearWiredErrorLogsComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/ClearWiredErrorLogsComposer';
import {
    AllVariablesHashMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredmenu/AllVariablesHashMessageEvent';
import {
    AllVariablesDiffMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredmenu/AllVariablesDiffMessageEvent';
import {
    VariableInfoAndHoldersEvent
} from './messages/incoming/userdefinedroomevents/wiredmenu/VariableInfoAndHoldersEvent';
import {
    WiredTradeInitiateMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTradeInitiateMessageEvent';
import {
    UserHabbiconsMessageEvent
} from './messages/incoming/habbicons/UserHabbiconsMessageEvent';
import {
    UserHabbiconStatusChangedMessageEvent
} from './messages/incoming/habbicons/UserHabbiconStatusChangedMessageEvent';
import {
    HabbiconShopDataMessageEvent
} from './messages/incoming/habbicons/HabbiconShopDataMessageEvent';
import {
    HabbiconInfoMessageEvent
} from './messages/incoming/habbicons/HabbiconInfoMessageEvent';
import {
    RoomUseHabbiconMessageEvent
} from './messages/incoming/habbicons/RoomUseHabbiconMessageEvent';
import {
    GetHabbiconShopDataMessageComposer
} from './messages/outgoing/habbicons/GetHabbiconShopDataMessageComposer';
import {
    GetHabbiconInfoMessageComposer
} from './messages/outgoing/habbicons/GetHabbiconInfoMessageComposer';
import {
    BuyHabbiconMessageComposer
} from './messages/outgoing/habbicons/BuyHabbiconMessageComposer';
import {
    BuyHabbiconCollectionMessageComposer
} from './messages/outgoing/habbicons/BuyHabbiconCollectionMessageComposer';
import {
    ClaimHabbiconMessageComposer
} from './messages/outgoing/habbicons/ClaimHabbiconMessageComposer';
import {
    FavoriteHabbiconMessageComposer
} from './messages/outgoing/habbicons/FavoriteHabbiconMessageComposer';
import {
    UnfavoriteHabbiconMessageComposer
} from './messages/outgoing/habbicons/UnfavoriteHabbiconMessageComposer';
import {
    SendHabbiconMessageComposer
} from './messages/outgoing/habbicons/SendHabbiconMessageComposer';
import {
    TriggerHabbiconMessageComposer
} from './messages/outgoing/habbicons/TriggerHabbiconMessageComposer';

// Outgoing Composers - Youtube display furni
import {
    GetYoutubeDisplayStatusMessageComposer
} from './messages/outgoing/room/furniture/GetYoutubeDisplayStatusMessageComposer';
import {
    SetYoutubeDisplayPlaylistMessageComposer
} from './messages/outgoing/room/furniture/SetYoutubeDisplayPlaylistMessageComposer';
import {
    ControlYoutubeDisplayPlaybackMessageComposer
} from './messages/outgoing/room/furniture/ControlYoutubeDisplayPlaybackMessageComposer';

// Incoming Events - Youtube display furni
import {
    YoutubeDisplayVideoMessageEvent
} from './messages/incoming/room/furniture/YoutubeDisplayVideoMessageEvent';
import {
    YoutubeDisplayPlaylistsMessageEvent
} from './messages/incoming/room/furniture/YoutubeDisplayPlaylistsMessageEvent';
import {
    YoutubeControlVideoMessageEvent
} from './messages/incoming/room/furniture/YoutubeControlVideoMessageEvent';

// Outgoing Composers - Crafting
import {GetCraftableProductsComposer} from './messages/outgoing/crafting/GetCraftableProductsComposer';
import {GetCraftingRecipeComposer} from './messages/outgoing/crafting/GetCraftingRecipeComposer';
import {
    GetCraftingRecipesAvailableComposer
} from './messages/outgoing/crafting/GetCraftingRecipesAvailableComposer';
import {CraftComposer} from './messages/outgoing/crafting/CraftComposer';
import {CraftSecretComposer} from './messages/outgoing/crafting/CraftSecretComposer';

// Incoming Events - Crafting
import {CraftableProductsMessageEvent} from './messages/incoming/crafting/CraftableProductsMessageEvent';
import {CraftingRecipeMessageEvent} from './messages/incoming/crafting/CraftingRecipeMessageEvent';
import {CraftingResultMessageEvent} from './messages/incoming/crafting/CraftingResultMessageEvent';
import {
    CraftingRecipesAvailableMessageEvent
} from './messages/incoming/crafting/CraftingRecipesAvailableMessageEvent';
import {
    GetBadgeLeaderboardMessageComposer
} from './messages/outgoing/users/GetBadgeLeaderboardMessageComposer';
import {
    GetSeasonalCalendarDailyComposer
} from './messages/outgoing/catalog/GetSeasonalCalendarDailyComposer';
import {
    ClaimRewardTrackPrizeMessageComposer,
    PurchaseRewardTrackPremiumMessageComposer
} from './messages/outgoing/quest';
import {
    RewardTrackClaimResultMessageEvent,
    RewardTrackPremiumPurchaseResultMessageEvent,
    RewardTrackProgressMessageEvent,
    RewardTracksMessageEvent
} from './messages/incoming/quest';
import {
    SeasonalCalendarDailyOfferMessageEvent
} from './messages/incoming/catalog/SeasonalCalendarDailyOfferMessageEvent';
import {
    IncomeRewardStatusMessageEvent
} from './messages/incoming/inventory/IncomeRewardStatusMessageEvent';
import {
    IncomeRewardClaimResponseMessageEvent
} from './messages/incoming/inventory/IncomeRewardClaimResponseMessageEvent';
import {
    IncomeRewardNotificationMessageEvent
} from './messages/incoming/inventory/IncomeRewardNotificationMessageEvent';
import {
    WiredTransactionLogsEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTransactionLogsEvent';
import {
    WiredTransactionDetailsMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTransactionDetailsMessageEvent';
import {
    SelfDonationResultMessageEvent
} from './messages/incoming/userdefinedroomevents/misc/SelfDonationResultMessageEvent';
import {RoomChatSettingsMessageEvent} from './messages/incoming/roomsettings/RoomChatSettingsMessageEvent';
import {MarkCatalogNewAdditionsPageOpenedComposer} from './messages/outgoing/catalog/MarkCatalogNewAdditionsPageOpenedComposer';
import {
    WiredTransactionSuccessMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTransactionSuccessMessageEvent';
import {
    WiredTransactionFailMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTransactionFailMessageEvent';
import {
    WiredTradeTransactionNotificationMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTradeTransactionNotificationMessageEvent';
import {
    ClaimProductResultMessageEvent
} from './messages/incoming/notifications/ClaimProductResultMessageEvent';
import {
    OpenWiredChestMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/chests/OpenWiredChestMessageEvent';
import {
    WiredChestUpdateSuccessMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/chests/WiredChestUpdateSuccessMessageEvent';
import {
    WiredChestUpgradeResultMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/chests/WiredChestUpgradeResultMessageEvent';
import {
    WiredChestCoinsMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/chests/WiredChestCoinsMessageEvent';
import {
    WiredChestItemsChunkMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/chests/WiredChestItemsChunkMessageEvent';
import {
    WiredChestItemsUpdatedMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/chests/WiredChestItemsUpdatedMessageEvent';
import {
    OpenWiredChestComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/OpenWiredChestComposer';
import {
    CloseWiredChestComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/CloseWiredChestComposer';
import {
    StartWiredChestDepositComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/StartWiredChestDepositComposer';
import {
    WithdrawAllWiredChestContentsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/WithdrawAllWiredChestContentsComposer';
import {
    WithdrawWiredChestCoinsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/WithdrawWiredChestCoinsComposer';
import {
    UpgradeWiredChestComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/UpgradeWiredChestComposer';
import {
    RequestWiredChestLogsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/RequestWiredChestLogsComposer';
import {
    SetWiredChestOptionsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/SetWiredChestOptionsComposer';
import {
    SetWiredChestNotificationSettingsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/SetWiredChestNotificationSettingsComposer';
import {
    WithdrawChestItemsByTypeComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/WithdrawChestItemsByTypeComposer';
import {
    SaveWiredChestSettingsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/chests/SaveWiredChestSettingsComposer';
import {
    WiredContractContentsMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/contracts/WiredContractContentsMessageEvent';
import {
    WiredContractUpdateResultMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/contracts/WiredContractUpdateResultMessageEvent';
import {
    WiredOpenContractMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/contracts/WiredOpenContractMessageEvent';
import {
    SaveWiredContractComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/contracts/SaveWiredContractComposer';
import {
    RequestWiredContractContentsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/contracts/RequestWiredContractContentsComposer';
import {
    SelfDonationComposer
} from './messages/outgoing/userdefinedroomevents/misc/SelfDonationComposer';
import {
    RequestWiredTransactionLogsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/RequestWiredTransactionLogsComposer';
import {
    RequestWiredTransactionDetailsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/RequestWiredTransactionDetailsComposer';
import {
    SetWiredChestsLockedComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/SetWiredChestsLockedComposer';
import {
    WiredTradeCancelledMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTradeCancelledMessageEvent';
import {
    WiredTradeCompletedMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTradeCompletedMessageEvent';
import {
    WiredTradeItemsUpdateMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredtrading/WiredTradeItemsUpdateMessageEvent';
import {
    WiredTradeUpdateItemsComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/WiredTradeUpdateItemsComposer';
import {
    WiredTradeAcceptComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/WiredTradeAcceptComposer';
import {
    WiredTradeCancelComposer
} from './messages/outgoing/userdefinedroomevents/wiredtrading/WiredTradeCancelComposer';
import {
    RequestNftAssetsComposer
} from './messages/outgoing/collectibles/RequestNftAssetsComposer';
import {
    AddNftToTradeComposer
} from './messages/outgoing/collectibles/AddNftToTradeComposer';
import {
    RemoveNftFromTradeComposer
} from './messages/outgoing/collectibles/RemoveNftFromTradeComposer';
import {
    GetSnowWarGameTokensOfferComposer
} from './messages/outgoing/catalog/GetSnowWarGameTokensOfferComposer';
import {
    PurchaseSnowWarGameTokensOfferComposer
} from './messages/outgoing/catalog/PurchaseSnowWarGameTokensOfferComposer';
import {
    Game2ExitGameMessageComposer,
    Game2LoadStageReadyMessageComposer,
    Game2PlayAgainMessageComposer
} from './messages/outgoing/game/arena';
import {
    Game2CheckGameDirectoryStatusMessageComposer,
    Game2GetAccountGameStatusMessageComposer,
    Game2LeaveGameMessageComposer,
    Game2QuickJoinGameMessageComposer,
    Game2StartSnowWarMessageComposer
} from './messages/outgoing/game/directory';
import {
    Game2MakeSnowballMessageComposer,
    Game2RequestFullStatusUpdateMessageComposer,
    Game2SetUserMoveTargetMessageComposer,
    Game2ThrowSnowballAtHumanMessageComposer,
    Game2ThrowSnowballAtPositionMessageComposer
} from './messages/outgoing/game/ingame';
import {
    Game2AccountGameStatusMessageEvent,
    Game2GameCancelledMessageEvent,
    Game2GameCreatedMessageEvent,
    Game2GameDirectoryStatusMessageEvent,
    Game2GameLongDataMessageEvent,
    Game2GameStartedMessageEvent,
    Game2InArenaQueueMessageEvent,
    Game2JoiningGameFailedMessageEvent,
    Game2StartCounterMessageEvent,
    Game2StartingGameFailedMessageEvent,
    Game2StopCounterMessageEvent,
    Game2UserBlockedMessageEvent,
    Game2UserJoinedGameMessageEvent,
    Game2UserLeftGameMessageEvent
} from './messages/incoming/game/directory';
import {
    Game2ArenaEnteredMessageEvent,
    Game2EnterArenaFailedMessageEvent,
    Game2EnterArenaMessageEvent,
    Game2GameChatFromPlayerMessageEvent,
    Game2GameEndingMessageEvent,
    Game2GameRejoinMessageEvent,
    Game2PlayerExitedGameArenaMessageEvent,
    Game2PlayerRematchesMessageEvent,
    Game2StageEndingMessageEvent,
    Game2StageLoadMessageEvent,
    Game2StageRunningMessageEvent,
    Game2StageStartingMessageEvent,
    Game2StageStillLoadingMessageEvent
} from './messages/incoming/game/snowwar/arena';
import {
    Game2FullGameStatusMessageEvent,
    Game2GameStatusMessageEvent
} from './messages/incoming/game/snowwar/ingame';
import {
    Game2FriendsLeaderboardEvent,
    Game2TotalGroupLeaderboardEvent,
    Game2TotalLeaderboardEvent,
    Game2WeeklyFriendsLeaderboardEvent,
    Game2WeeklyGroupLeaderboardEvent,
    Game2WeeklyLeaderboardEvent
} from './messages/incoming/game/score';
import {
    Game2GetFriendsLeaderboardComposer,
    Game2GetTotalGroupLeaderboardComposer,
    Game2GetTotalLeaderboardComposer,
    Game2GetWeeklyFriendsLeaderboardComposer,
    Game2GetWeeklyGroupLeaderboardComposer,
    Game2GetWeeklyLeaderboardComposer
} from './messages/outgoing/game/score';
import {ClaimDailyTaskComposer} from './messages/outgoing/quest/ClaimDailyTaskComposer';
import {
    RequestVariableHoldersComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/RequestVariableHoldersComposer';
import {
    RequestVariableManagementComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/RequestVariableManagementComposer';
import {
    WiredVariablesForObjectEvent
} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredVariablesForObjectEvent';
import {WiredMenuErrorEvent} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredMenuErrorEvent';
import {WiredRoomLogsMessageEvent} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredRoomLogsMessageEvent';
import {
    WiredUserVariablesPageMessageEvent
} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredUserVariablesPageMessageEvent';
import {
    RequestVariableManagementDetailComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/RequestVariableManagementDetailComposer';
import {
    WiredSetUserPermanentVariableComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/WiredSetUserPermanentVariableComposer';
import {
    WiredUserPermanentVariablesEvent
} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredUserPermanentVariablesEvent';
import {
    WiredSetUserPermanentVariableResultEvent
} from './messages/incoming/userdefinedroomevents/wiredmenu/WiredSetUserPermanentVariableResultEvent';
import {
    RequestWiredVariablesForObjectComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/RequestWiredVariablesForObjectComposer';
import {
    UpdateWiredVariableComposer
} from './messages/outgoing/userdefinedroomevents/wiredmenu/UpdateWiredVariableComposer';

// Incoming Events - Poll
import {
    PollContentsEvent,
    PollErrorEvent,
    PollOfferEvent,
    QuestionAnsweredEvent,
    QuestionEvent,
    QuestionFinishedEvent,
} from './messages/incoming/poll';

// Onboarding (new user flow) — the starter-room pick and the figure save. Imported by path: the
// nux/ barrels are generated and do not list these yet.
import {SelectInitialRoomMessageEvent} from './messages/incoming/nux/SelectInitialRoomMessageEvent';
import {SelectInitialRoomMessageComposer} from './messages/outgoing/nux/SelectInitialRoomMessageComposer';
// The NUX dialogs (habbo/nux/HabboNuxDialogs): the phone-verification offer and the gift picker.
import {
    NewUserExperienceNotCompleteEvent
} from './messages/incoming/nux/NewUserExperienceNotCompleteEvent';
import {NewUserExperienceGiftOfferEvent} from './messages/incoming/nux/NewUserExperienceGiftOfferEvent';
import {
    CustomUserNotificationMessageEvent
} from './messages/incoming/room/furniture/CustomUserNotificationMessageEvent';
// The rentable-space furniture (habbo/ui/handler/RentableSpaceWidgetHandler).
import {
    RentableSpaceStatusMessageEvent
} from './messages/incoming/room/furniture/RentableSpaceStatusMessageEvent';
import {
    RentableSpaceRentOkMessageEvent
} from './messages/incoming/room/furniture/RentableSpaceRentOkMessageEvent';
import {
    RentableSpaceRentFailedMessageEvent
} from './messages/incoming/room/furniture/RentableSpaceRentFailedMessageEvent';
import {
    RentableSpaceStatusMessageComposer
} from './messages/outgoing/room/furniture/RentableSpaceStatusMessageComposer';
import {
    RentableSpaceRentMessageComposer
} from './messages/outgoing/room/furniture/RentableSpaceRentMessageComposer';
import {
    RentableSpaceCancelRentMessageComposer
} from './messages/outgoing/room/furniture/RentableSpaceCancelRentMessageComposer';
import {
    NewUserExperienceGetGiftsMessageComposer
} from './messages/outgoing/nux/NewUserExperienceGetGiftsMessageComposer';
import {
    SetPhoneNumberVerificationStatusMessageComposer
} from './messages/outgoing/preferences/SetPhoneNumberVerificationStatusMessageComposer';
// SMS identity verification (habbo/phonenumber/HabboPhoneNumber). AS3 files these under
// incoming|outgoing/gifts/; this port keeps the phone composers in outgoing/preferences/.
import {
    PhoneCollectionStateMessageEvent
} from './messages/incoming/gifts/PhoneCollectionStateMessageEvent';
import {
    TryPhoneNumberResultMessageEvent
} from './messages/incoming/gifts/TryPhoneNumberResultMessageEvent';
import {
    TryVerificationCodeResultMessageEvent
} from './messages/incoming/gifts/TryVerificationCodeResultMessageEvent';
import {
    TryPhoneNumberMessageComposer
} from './messages/outgoing/preferences/TryPhoneNumberMessageComposer';
import {VerifyCodeMessageComposer} from './messages/outgoing/preferences/VerifyCodeMessageComposer';
import {TraxSongInfoMessageEvent} from './messages/incoming/sound/TraxSongInfoMessageEvent';
import {
    ForumDataMessageEvent,
    ForumThreadsMessageEvent,
    ForumsListMessageEvent,
    PostMessageMessageEvent,
    PostThreadMessageEvent,
    ThreadMessagesMessageEvent,
    UnreadForumsCountMessageEvent,
    UpdateMessageMessageEvent,
    UpdateThreadMessageEvent,
} from './messages/incoming/groupforums';
import {
    GetForumStatsMessageComposer,
    GetForumsListMessageComposer,
    GetMessagesMessageComposer,
    GetThreadMessageComposer,
    GetThreadsMessageComposer,
    GetUnreadForumsCountMessageComposer,
    ModerateMessageMessageComposer,
    ModerateThreadMessageComposer,
    PostMessageMessageComposer,
    UpdateForumReadMarkerMessageComposer,
    UpdateForumSettingsMessageComposer,
    UpdateThreadMessageComposer,
} from './messages/outgoing/groupforums';
import {OfficialSongIdMessageEvent} from './messages/incoming/sound/OfficialSongIdMessageEvent';
import {NowPlayingMessageEvent} from './messages/incoming/sound/NowPlayingMessageEvent';
import {
    JukeboxSongDisksMessageEvent
} from './messages/incoming/sound/JukeboxSongDisksMessageEvent';
import {
    JukeboxPlayListFullMessageEvent
} from './messages/incoming/sound/JukeboxPlayListFullMessageEvent';
import {InitCameraMessageEvent} from './messages/incoming/camera/InitCameraMessageEvent';
import {
    CameraStorageUrlMessageEvent
} from './messages/incoming/camera/CameraStorageUrlMessageEvent';
import {
    CameraPublishStatusMessageEvent
} from './messages/incoming/camera/CameraPublishStatusMessageEvent';
import {
    CameraPurchaseOKMessageEvent
} from './messages/incoming/camera/CameraPurchaseOKMessageEvent';
import {
    ThumbnailStatusMessageEvent
} from './messages/incoming/camera/ThumbnailStatusMessageEvent';
import {
    CompetitionStatusMessageEvent
} from './messages/incoming/camera/CompetitionStatusMessageEvent';
import {RenderRoomMessageComposer} from './messages/outgoing/camera/RenderRoomMessageComposer';
import {
    RenderRoomThumbnailMessageComposer
} from './messages/outgoing/camera/RenderRoomThumbnailMessageComposer';
import {PublishPhotoMessageComposer} from './messages/outgoing/camera/PublishPhotoMessageComposer';
import {
    PurchasePhotoMessageComposer
} from './messages/outgoing/camera/PurchasePhotoMessageComposer';
import {
    PhotoCompetitionMessageComposer
} from './messages/outgoing/camera/PhotoCompetitionMessageComposer';
import {
    RequestCameraConfigurationMessageComposer
} from './messages/outgoing/camera/RequestCameraConfigurationMessageComposer';
import {PlayListMessageEvent} from './messages/incoming/sound/PlayListMessageEvent';
import {
    PlayListSongAddedMessageEvent
} from './messages/incoming/sound/PlayListSongAddedMessageEvent';
import {
    GetNowPlayingMessageComposer
} from './messages/outgoing/sound/GetNowPlayingMessageComposer';
import {
    GetSoundMachinePlayListMessageComposer
} from './messages/outgoing/sound/GetSoundMachinePlayListMessageComposer';
import {
    UserSongDisksInventoryMessageEvent
} from './messages/incoming/sound/UserSongDisksInventoryMessageEvent';
import {GetSongInfoMessageComposer} from './messages/outgoing/sound/GetSongInfoMessageComposer';
import {AddJukeboxDiskComposer} from './messages/outgoing/sound/AddJukeboxDiskComposer';
import {RemoveJukeboxDiskComposer} from './messages/outgoing/sound/RemoveJukeboxDiskComposer';
import {
    GetOfficialSongIdMessageComposer
} from './messages/outgoing/sound/GetOfficialSongIdMessageComposer';
import {
    GetUserSongDisksMessageComposer
} from './messages/outgoing/sound/GetUserSongDisksMessageComposer';
import {
    GetJukeboxPlayListMessageComposer
} from './messages/outgoing/sound/GetJukeboxPlayListMessageComposer';
import {UpdateFigureDataMessageComposer} from './messages/outgoing/avatar/UpdateFigureDataMessageComposer';
import {CheckUserNameResultMessageEvent} from './messages/incoming/help/CheckUserNameResultMessageEvent';
import {
    IsUserPartOfCompetitionMessageEvent
} from './messages/incoming/competition/IsUserPartOfCompetitionMessageEvent';
import {SecondsUntilMessageEvent} from './messages/incoming/competition/SecondsUntilMessageEvent';
import {
    IsBadgeRequestFulfilledEvent
} from './messages/incoming/inventory/badges/IsBadgeRequestFulfilledEvent';
import {BanInfoMessageEvent} from './messages/incoming/moderation/BanInfoMessageEvent';
import {
    MyCfhReportStatusMessageEvent
} from './messages/incoming/callforhelp/MyCfhReportStatusMessageEvent';
import {AppealCfhMessageComposer} from './messages/outgoing/help/AppealCfhMessageComposer';
import {ClaimNewUserNameMessageComposer} from './messages/outgoing/help/ClaimNewUserNameMessageComposer';
import {ModeratorInitMessageEvent} from './messages/incoming/moderation/ModeratorInitMessageEvent';
import {ModeratorToolPreferencesMessageEvent} from './messages/incoming/moderation/ModeratorToolPreferencesMessageEvent';
import {ModeratorUserInfoMessageEvent} from './messages/incoming/moderation/ModeratorUserInfoMessageEvent';
import {ModeratorRoomInfoMessageEvent} from './messages/incoming/moderation/ModeratorRoomInfoMessageEvent';
import {ModeratorActionResultMessageEvent} from './messages/incoming/moderation/ModeratorActionResultMessageEvent';
import {IssueInfoMessageEvent} from './messages/incoming/moderation/IssueInfoMessageEvent';
import {IssueDeletedMessageEvent} from './messages/incoming/moderation/IssueDeletedMessageEvent';
import {IssuePickFailedMessageEvent} from './messages/incoming/moderation/IssuePickFailedMessageEvent';
import {CfhChatlogMessageEvent} from './messages/incoming/moderation/CfhChatlogMessageEvent';
import {RoomChatlogMessageEvent} from './messages/incoming/moderation/RoomChatlogMessageEvent';
import {UserChatlogMessageEvent} from './messages/incoming/moderation/UserChatlogMessageEvent';
import {RoomVisitsMessageEvent} from './messages/incoming/moderation/RoomVisitsMessageEvent';
import {UserClassificationMessageEvent} from './messages/incoming/moderation/UserClassificationMessageEvent';
import {CfhSanctionMessageEvent} from './messages/incoming/moderation/CfhSanctionMessageEvent';
import {CallForHelpDisabledNotifyMessageEvent} from './messages/incoming/help/CallForHelpDisabledNotifyMessageEvent';
import {CallForHelpReplyMessageEvent} from './messages/incoming/help/CallForHelpReplyMessageEvent';
import {CallForHelpResultMessageEvent} from './messages/incoming/help/CallForHelpResultMessageEvent';
import {CallForHelpPendingCallsMessageEvent} from './messages/incoming/help/CallForHelpPendingCallsMessageEvent';
import {CallForHelpPendingCallsDeletedMessageEvent} from './messages/incoming/help/CallForHelpPendingCallsDeletedMessageEvent';
import {CfhTopicsInitMessageEvent} from './messages/incoming/help/CfhTopicsInitMessageEvent';
import {IssueCloseNotificationMessageEvent} from './messages/incoming/help/IssueCloseNotificationMessageEvent';
import {ChatReviewSessionStartedMessageEvent} from './messages/incoming/help/ChatReviewSessionStartedMessageEvent';
import {ChatReviewSessionResultsMessageEvent} from './messages/incoming/help/ChatReviewSessionResultsMessageEvent';
import {ChatReviewSessionDetachedMessageEvent} from './messages/incoming/help/ChatReviewSessionDetachedMessageEvent';
import {ChatReviewSessionOfferedToGuideMessageEvent} from './messages/incoming/help/ChatReviewSessionOfferedToGuideMessageEvent';
import {ChatReviewSessionVotingStatusMessageEvent} from './messages/incoming/help/ChatReviewSessionVotingStatusMessageEvent';
import {GuideOnDutyStatusMessageEvent} from './messages/incoming/help/GuideOnDutyStatusMessageEvent';
import {GuideReportingStatusMessageEvent} from './messages/incoming/help/GuideReportingStatusMessageEvent';
import {GuideSessionAttachedMessageEvent} from './messages/incoming/help/GuideSessionAttachedMessageEvent';
import {GuideSessionDetachedMessageEvent} from './messages/incoming/help/GuideSessionDetachedMessageEvent';
import {GuideSessionInvitedToGuideRoomMessageEvent} from './messages/incoming/help/GuideSessionInvitedToGuideRoomMessageEvent';
import {GuideSessionMessageMessageEvent} from './messages/incoming/help/GuideSessionMessageMessageEvent';
import {GuideSessionPartnerIsTypingMessageEvent} from './messages/incoming/help/GuideSessionPartnerIsTypingMessageEvent';
import {GuideSessionRequesterRoomMessageEvent} from './messages/incoming/help/GuideSessionRequesterRoomMessageEvent';
import {GuideTicketCreationResultMessageEvent} from './messages/incoming/help/GuideTicketCreationResultMessageEvent';
import {GuideTicketResolutionMessageEvent} from './messages/incoming/help/GuideTicketResolutionMessageEvent';
import {QuizDataMessageEvent} from './messages/incoming/help/QuizDataMessageEvent';
import {QuizResultsMessageEvent} from './messages/incoming/help/QuizResultsMessageEvent';
import {ChangeUserNameMessageComposer} from './messages/outgoing/help/ChangeUserNameMessageComposer';
import {CheckUserNameMessageComposer} from './messages/outgoing/help/CheckUserNameMessageComposer';
import {GetWardrobeMessageComposer} from './messages/outgoing/wardrobe/GetWardrobeMessageComposer';
import {GetHotLooksMessageComposer} from './messages/outgoing/nftwardrobe/GetHotLooksMessageComposer';
import {GetUserNftWardrobeMessageComposer} from './messages/outgoing/nftwardrobe/GetUserNftWardrobeMessageComposer';
import {SaveUserNftWardrobeMessageComposer} from './messages/outgoing/nftwardrobe/SaveUserNftWardrobeMessageComposer';
import {GetSelectedNftWardrobeOutfitMessageComposer} from './messages/outgoing/nftwardrobe/GetSelectedNftWardrobeOutfitMessageComposer';
import {HotLooksMessageEvent} from './messages/incoming/nftwardrobe/HotLooksMessageEvent';
import {UserNftWardrobeMessageEvent} from './messages/incoming/nftwardrobe/UserNftWardrobeMessageEvent';
import {SelectedNftWardrobeOutfitMessageEvent} from './messages/incoming/nftwardrobe/SelectedNftWardrobeOutfitMessageEvent';
import {SaveWardrobeOutfitMessageComposer} from './messages/outgoing/wardrobe/SaveWardrobeOutfitMessageComposer';
import {WardrobeMessageEvent} from './messages/incoming/wardrobe/WardrobeMessageEvent';
import {AvatarEffectSelectedMessageEvent} from './messages/incoming/wardrobe/AvatarEffectSelectedMessageEvent';

// Incoming Events - Help (name change events)
import {
    ChangeUserNameResultMessageEvent,
    FaqTextMessageEvent,
    GuideSessionEndedMessageEvent,
    GuideSessionErrorMessageEvent,
    GuideSessionStartedMessageEvent,
    UserNameChangedMessageEvent,
} from './messages/incoming/help';

// Incoming Events - Error
import {ErrorReportEvent} from './messages/incoming/error';

// Incoming Events - Users
import {
    ApproveNameMessageEvent,
    BlockListMessageEvent,
    BlockUserUpdateMessageEvent,
    ChangeEmailResultEvent,
    EmailStatusResultEvent,
    ExtendedProfileChangedMessageEvent,
    ExtendedProfileMessageEvent,
    GroupDetailsChangedMessageEvent,
    GuildCreatedMessageEvent,
    GuildCreationInfoMessageEvent,
    GuildEditFailedMessageEvent,
    GuildEditInfoMessageEvent,
    GuildMemberFurniCountInHQMessageEvent,
    GuildMemberMgmtFailedMessageEvent,
    GuildMembersMessageEvent,
    GuildMembershipRejectedMessageEvent,
    GuildMembershipUpdatedMessageEvent,
    GroupMembershipRequestedMessageEvent,
    GuildEditorDataMessageEvent,
    GuildMembershipsMessageEvent,
    HabboGroupBadgesMessageEvent,
    HabboGroupDeactivatedMessageEvent,
    HabboGroupDetailsMessageEvent,
    HabboGroupJoinFailedMessageEvent,
    HabboUserBadgesMessageEvent,
    BadgeLeaderboardMessageEvent,
    HandItemReceivedMessageEvent,
    IgnoredUsersMessageEvent,
    IgnoreResultMessageEvent,
    InClientLinkMessageEvent,
    PetSupplementedNotificationEvent,
    RelationshipStatusInfoEvent,
    ScrSendKickbackInfoMessageEvent,
    ScrSendUserInfoEvent,
} from './messages/incoming/users';

// Incoming Events - Preferences
import {
    AccountPreferencesEvent,
    GetCustomFilterResultMessageEvent,
    ModifyCustomFilterResultMessageEvent
} from './messages/incoming/preferences';

// Incoming Events - Discord
import {DiscordPreferencesMessageEvent} from './messages/incoming/discord';

// Incoming Events - Perk
import {PerkAllowancesMessageEvent} from './messages/incoming/perk';

// Incoming Events - NFT
import {
    NftEmeraldConvertResultMessageEvent,
    UserNftChatStylesMessageEvent,
    UserPurchasableChatStyleChangedMessageEvent,
    UserPurchasableChatStylesMessageEvent,
} from './messages/incoming/nft';

// Incoming Events - Campaign
import {
    CampaignCalendarDataMessageEvent,
    CampaignCalendarDoorOpenedMessageEvent,
    TreasureHuntFailMessageEvent,
    TreasureHuntFirstWinnerMessageEvent,
    TreasureHuntUpdateMessageEvent,
} from './messages/incoming/campaign';

// Incoming Events - Advertisement
import {InterstitialMessageEvent, RoomAdErrorMessageEvent} from './messages/incoming/advertisement';

// Incoming Events - Tracking
import {LatencyPingResponseMessageEvent} from './messages/incoming/tracking';

// Incoming Events - Friendlist
import {
    AcceptFriendResultMessageEvent,
    ConsoleMessageHistoryEvent,
    FindFriendsProcessResultMessageEvent,
    FollowFriendFailedMessageEvent,
    FriendListFragmentMessageEvent,
    FriendListUpdateMessageEvent,
    FriendNotificationMessageEvent,
    FriendRequestsMessageEvent,
    HabboSearchResultMessageEvent,
    InstantMessageErrorEvent,
    MessengerErrorEvent,
    MessengerInitEvent,
    MiniMailNewMessageEvent,
    MiniMailUnreadCountEvent,
    NewConsoleMessageEvent,
    NewFriendRequestMessageEvent,
    RoomInviteErrorMessageEvent,
    RoomInviteEvent,
} from './messages/incoming/friendlist';

// Incoming Events - Room Action
import {
    AvatarEffectMessageEvent,
    CarryObjectMessageEvent,
    DanceMessageEvent,
    ExpressionMessageEvent,
    SleepMessageEvent,
    UseObjectMessageEvent,
    UserChangeMessageEvent,
} from './messages/incoming/room/action';

// Incoming Events - New Navigator
import {
    NavigatorCollapsedCategoriesMessageEvent,
    NavigatorLiftedRoomsMessageEvent,
    NavigatorMetaDataMessageEvent,
    NavigatorSavedSearchesMessageEvent,
    NavigatorSearchResultSetMessageEvent,
    NavigatorWindowSettingsMessageEvent,
} from './messages/incoming/newnavigator';

// Outgoing Composers - Handshake & Core
import {
    ClientHelloMessageComposer,
    CompleteDiffieHandshakeMessageComposer,
    DisconnectMessageComposer,
    EventLogMessageComposer,
    InfoRetrieveMessageComposer,
    InitDiffieHandshakeMessageComposer,
    PongMessageComposer,
    SSOTicketMessageComposer,
    UniqueIDMessageComposer,
    VersionCheckMessageComposer,
} from './messages/outgoing';

// Outgoing Composers - Navigator
import {
    AddFavouriteRoomMessageComposer,
    CancelEventMessageComposer,
    CanCreateRoomMessageComposer,
    CompetitionRoomsSearchMessageComposer,
    ConvertGlobalRoomIdMessageComposer,
    CreateFlatMessageComposer,
    DeleteFavouriteRoomMessageComposer,
    EditEventMessageComposer,
    ForwardToARandomPromotedRoomMessageComposer,
    ForwardToSomeRoomMessageComposer,
    GetGuestRoomMessageComposer,
    GetOfficialRoomsMessageComposer,
    GetPopularRoomTagsMessageComposer,
    GetUserEventCatsMessageComposer,
    GetUserFlatCatsMessageComposer,
    GuildBaseSearchMessageComposer,
    MyFavouriteRoomsSearchMessageComposer,
    MyFrequentRoomHistorySearchMessageComposer,
    MyFriendsRoomsSearchMessageComposer,
    MyGuildBasesSearchMessageComposer,
    MyRecommendedRoomsMessageComposer,
    MyRoomHistorySearchMessageComposer,
    MyRoomRightsSearchMessageComposer,
    MyRoomsSearchMessageComposer,
    PopularRoomsSearchMessageComposer,
    RateFlatMessageComposer,
    RemoveOwnRoomRightsRoomMessageComposer,
    RoomAdEventTabAdClickedComposer,
    RoomAdEventTabViewedComposer,
    RoomAdSearchMessageComposer,
    RoomsWhereMyFriendsAreSearchMessageComposer,
    RoomsWithHighestScoreSearchMessageComposer,
    RoomTextSearchMessageComposer,
    GetRaidProtectionSettingsMessageComposer,
    SaveRaidProtectionSettingsMessageComposer,
    SetRoomSessionTagsMessageComposer,
    ToggleStaffPickMessageComposer,
    UpdateHomeRoomMessageComposer,
} from './messages/outgoing/navigator';

// Outgoing Composers - New Navigator
import {
    NavigatorAddCollapsedCategoryMessageComposer,
    NavigatorAddSavedSearchComposer,
    NavigatorDeleteSavedSearchComposer,
    NavigatorRemoveCollapsedCategoryMessageComposer,
    NavigatorSetSearchCodeViewModeMessageComposer,
    NewNavigatorInitComposer,
    NewNavigatorSearchComposer,
} from './messages/outgoing/newnavigator';

// Outgoing Composers - Room Session
import {
    ChangeQueueMessageComposer,
    OpenFlatConnectionMessageComposer,
    QuitMessageComposer,
    RoomNetworkOpenConnectionMessageComposer,
} from './messages/outgoing/room/session';

// Outgoing Composers - Room Engine
import {
    ClickFurniMessageComposer,
    GetFurnitureAliasesMessageComposer,
    MoveAvatarMessageComposer,
    MoveObjectMessageComposer,
    MoveWallItemMessageComposer,
    PickupObjectMessageComposer,
    PlaceObjectMessageComposer,
    PlacePostItMessageComposer,
} from './messages/outgoing/room/engine';

import {ClickCharacterComposer} from './messages/outgoing/room/ClickCharacterComposer';

// Outgoing Composers - Room Chat
import {
    CancelTypingMessageComposer,
    ChatMessageComposer,
    Game2GameChatMessageComposer,
    SetChatPreferencesMessageComposer,
    ShoutMessageComposer,
    StartTypingMessageComposer,
    WhisperMessageComposer,
} from './messages/outgoing/room/chat';

// Outgoing Composers - Room Avatar
import {
    AvatarExpressionMessageComposer,
    ChangeMottoMessageComposer,
    ChangePostureMessageComposer,
    DanceMessageComposer,
    LookToMessageComposer,
    DropCarryItemMessageComposer,
    PassCarryItemMessageComposer,
    PassCarryItemToPetMessageComposer,
    SignMessageComposer,
} from './messages/outgoing/room/avatar';

// Outgoing Composers - Room Action
import {
    AmbassadorAlertMessageComposer,
    AssignRightsMessageComposer,
    BanUserWithDurationMessageComposer,
    KickUserMessageComposer,
    LetUserInMessageComposer,
    MuteAllInRoomComposer,
    MuteUserMessageComposer,
    RemoveRightsMessageComposer,
    UnmuteUserMessageComposer,
} from './messages/outgoing/room/action';

// Incoming Events - Room Settings
import {
    BannedUsersFromRoomEvent,
    FlatControllerAddedEvent,
    FlatControllerRemovedEvent,
    FlatControllersEvent,
    RoomSettingsDataEvent,
    RoomSettingsSavedEvent,
    RoomSettingsSaveErrorEvent,
    ShowEnforceRoomCategoryDialogEvent,
    UserUnbannedFromRoomEvent,
} from './messages/incoming/roomsettings';

// Outgoing Composers - Room (settings)
import {
    DeleteRoomMessageComposer,
    GetBannedUsersFromRoomMessageComposer,
    GetCustomRoomFilterMessageComposer,
    GetFlatControllersMessageComposer,
    GetRoomSettingsMessageComposer,
    RemoveAllRightsMessageComposer,
    SaveRoomSettingsMessageComposer,
    UnbanUserFromRoomMessageComposer,
    UpdateRoomCategoryAndTradeSettingsComposer,
    UpdateRoomFilterMessageComposer,
} from './messages/outgoing/room/settings';

// Outgoing Composers - Room (root)
import {RespectPetMessageComposer, RespectUserMessageComposer,} from './messages/outgoing/room';

// Outgoing Composers - Discord
import {
    GetDiscordPreferencesMessageComposer,
    UpdateDiscordPreferencesMessageComposer,
} from './messages/outgoing/discord';

// Outgoing Composers - Preferences
import {
    SetChatStylePreferenceComposer,
    SetNewNavigatorWindowPreferencesMessageComposer,
    AddToCustomFilterMessageComposer,
    GetCustomFilterMessageComposer,
    RemoveFromCustomFilterMessageComposer,
    ResetPhoneNumberStateMessageComposer,
    SetIgnoreRoomInvitesMessageComposer,
    SetRoomCameraPreferencesMessageComposer,
    SetUIFlagsMessageComposer,
} from './messages/outgoing/preferences';

// Outgoing Composers - Sound
import {
    FriendFurniConfirmLockMessageComposer,
    RedeemPurchasableClothingMessageComposer,
    MoveFurnitureToAdjacentHeightMessageComposer,
    SetCustomStackingHeightMessageComposer,
    SetMannequinFigureMessageComposer,
    SetMannequinNameMessageComposer,
} from './messages/outgoing/room/furniture';

// Incoming Events - Friendship furni (love lock and friends)
import {
    FriendFurniCancelLockEvent,
    FriendFurniOtherLockConfirmedEvent,
    FriendFurniStartConfirmationEvent,
    GuildFurniContextMenuInfoMessageEvent,
} from './messages/incoming/room/furniture';

// Outgoing Composers - Sound
import {
    GetSoundSettingsComposer,
    SetSoundSettingsComposer,
} from './messages/outgoing/sound';

// Outgoing Composers - Mystery Box
import {MysteryBoxWaitingCanceledMessageComposer} from './messages/outgoing/mysterybox';

// Outgoing Composers - Room Furniture
import {
    ClaimNftRewardBoxMessageComposer,
    ConfigureRentableSpaceMessageComposer,
    CreditFurniRedeemMessageComposer,
    DiceOffMessageComposer,
    EnterOneWayDoorMessageComposer,
    GetGuildFurniContextMenuInfoMessageComposer,
    GetItemDataMessageComposer,
    GetRentableSpaceConfigMessageComposer,
    OpenMysteryTrophyMessageComposer,
    OpenPetPackageMessageComposer,
    PresentOpenMessageComposer,
    RemoveItemMessageComposer,
    RoomDimmerChangeStateComposer,
    RoomDimmerGetPresetsComposer,
    RoomDimmerSavePresetComposer,
    SetItemDataMessageComposer,
    SetRoomBackgroundColorDataMessageComposer,
    SpinWheelOfFortuneMessageComposer,
    ThrowDiceMessageComposer,
    UpdateClothingChangeFurnitureComposer,
    SetObjectDataMessageComposer,
    SetRandomStateMessageComposer,
    UseFurnitureMessageComposer,
    SetAreaHideDataMessageComposer,
    UseWallItemMessageComposer,
} from './messages/outgoing/room/furniture';

// Outgoing Composers - Room Rentable Bots
import {
    CommandBotComposer,
    GetBotCommandConfigurationDataComposer,
    MoveBotMessageComposer,
    PlaceBotMessageComposer,
    RemoveBotFromFlatMessageComposer
} from './messages/outgoing/room/bot';

// Outgoing Composers - Room Pet
import {
    BreedPetsMessageComposer,
    CompostPlantComposer,
    GetPetCommandsComposer,
    GetPetInfoMessageComposer,
    GiveSupplementToPetMessageComposer,
    HarvestPetComposer,
    MountPetComposer,
    MovePetMessageComposer,
    PetSelectedMessageComposer,
    PickUpPetComposer,
    PlacePetComposer,
    RemoveSaddleFromPetComposer,
    TogglePetBreedingPermissionComposer,
    TogglePetRidingPermissionComposer,
    UseProductForPetComposer,
} from './messages/outgoing/room/pet';

// Outgoing Composers - Poll
import {PollAnswerComposer, PollRejectComposer, PollStartComposer,} from './messages/outgoing/poll';

// Outgoing Composers - Landing View
import {CommunityGoalVoteMessageComposer, GetPromoArticlesComposer,} from './messages/outgoing/landingview';

// Outgoing Composers - Catalog
import {
    BuildersClubQueryFurniCountMessageComposer,
    CheckGiftableMessageComposer,
    GetBonusRareInfoMessageComposer,
    GetBundleDiscountRulesetComposer,
    GetGiftWrappingConfigurationComposer,
    GetCatalogIndexComposer,
    GetHabboClubExtendOfferMessageComposer,
    GetCatalogPageComposer,
    GetCatalogPageWithEarliestExpiryComposer,
    GetClubGiftMessageComposer,
    GetClubOffersMessageComposer,
    GetLimitedOfferAppearingNextComposer,
    GetProductOfferComposer,
    GetRecyclerPrizesMessageComposer,
    GetRecyclerStatusMessageComposer,
    GetRoomAdsPurchaseInfoMessageComposer,
    GetNextTargetedOfferComposer,
    SetTargetedOfferStateComposer,
    PurchaseTargetedOfferComposer,
    ShopTargetedOfferViewedComposer,
    PurchaseRoomAdMessageComposer,
    RoomAdPurchaseInitiatedMessageComposer,
    GetSellablePetPalettesComposer,
    PlaceObjectFromCatalogComposer,
    PlaceWallItemFromCatalogComposer,
    PurchaseBasicMembershipExtensionComposer,
    PurchaseFromCatalogComposer,
    PurchaseMintTokensMessageComposer,
    PurchaseNftOfferMessageComposer,
    PurchaseProductAsGiftMessageComposer,
    PurchaseVipMembershipExtensionComposer,
    RecycleItemsMessageComposer,
    RedeemVoucherMessageComposer,
    SelectClubGiftComposer,
} from './messages/outgoing/catalog';

// Outgoing Composers - Marketplace
import {
    BuyMarketplaceOfferMessageComposer,
    CancelAllMarketplaceOffersMessageComposer,
    CancelMarketplaceOfferMessageComposer,
    ClearOwnMarketplaceHistoryMessageComposer,
    GetMarketplaceConfigurationMessageComposer,
    GetMarketplaceItemStatsComposer,
    GetMarketplaceCanMakeOfferMessageComposer,
    BuyMarketplaceTokensMessageComposer,
    MakeOfferMessageComposer,
    GetMarketplaceOffersMessageComposer,
    GetMarketplaceOwnOffersMessageComposer,
    RedeemMarketplaceOfferCreditsMessageComposer,
} from './messages/outgoing/marketplace';

// Outgoing Composers - Quest
import {
    AcceptQuestMessageComposer,
    ActivateQuestMessageComposer,
    CancelQuestMessageComposer,
    GetCommunityGoalHallOfFameMessageComposer,
    GetCommunityGoalProgressMessageComposer,
    GetConcurrentUsersGoalProgressMessageComposer,
    GetConcurrentUsersRewardMessageComposer,
    GetDailyQuestMessageComposer,
    GetQuestsMessageComposer,
    GetResolutionAchievementsMessageComposer,
    ResetResolutionAchievementMessageComposer,
    GetSeasonalQuestsOnlyMessageComposer,
    OpenQuestTrackerMessageComposer,
    RejectQuestMessageComposer,
    StartCampaignMessageComposer,
} from './messages/outgoing/quest';

// Outgoing Composers - Achievements
import {GetAchievementsComposer} from './messages/outgoing/inventory/achievements';

// Outgoing Composers - Talent
import {
    GetTalentTrackLevelMessageComposer,
    GetTalentTrackMessageComposer,
    GuideAdvertisementReadMessageComposer
} from './messages/outgoing/talent';
import {
    TalentLevelUpMessageEvent,
    TalentTrackLevelMessageEvent,
    TalentTrackMessageEvent
} from './messages/incoming/talent';

// Outgoing Composers - Competition
import {GetCurrentTimingCodeMessageComposer} from './messages/outgoing/competition';

// Outgoing Composers - Notifications
import {GetMOTDMessageComposer} from './messages/outgoing/notifications';

// Outgoing Composers - Tracking
import {
    LagWarningReportMessageComposer,
    LatencyPingReportMessageComposer,
    LatencyPingRequestMessageComposer,
    PerformanceLogMessageComposer,
} from './messages/outgoing/tracking';

// Outgoing Composers - Friendlist
import {
    AcceptFriendMessageComposer,
    DeclineFriendMessageComposer,
    FindNewFriendsMessageComposer,
    FollowFriendMessageComposer,
    FriendListUpdateMessageComposer,
    GetFriendRequestsMessageComposer,
    GetMessengerHistoryComposer,
    GetRelationshipStatusInfoMessageComposer,
    HabboSearchMessageComposer,
    MessengerInitMessageComposer,
    RemoveFriendMessageComposer,
    RequestFriendMessageComposer,
    SendMsgMessageComposer,
    SendRoomInviteMessageComposer,
    SetRelationshipStatusMessageComposer,
    VisitUserMessageComposer,
} from './messages/outgoing/friendlist';
import {
    ApproveNameMessageComposer,
    BlockListInitComposer,
    BlockUserMessageComposer,
    ChangeEmailComposer,
    CreateGuildMessageComposer,
    DeselectFavouriteHabboGroupMessageComposer,
    GetEmailStatusComposer,
    GetExtendedProfileByNameMessageComposer,
    GetExtendedProfileMessageComposer,
    GetGuildCreationInfoMessageComposer,
    DeactivateGuildMessageComposer,
    AddAdminRightsToMemberMessageComposer,
    ApproveAllMembershipRequestsMessageComposer,
    ApproveMembershipRequestMessageComposer,
    GetGuildEditInfoMessageComposer,
    GetGuildMembersMessageComposer,
    RejectMembershipRequestMessageComposer,
    RemoveAdminRightsFromMemberMessageComposer,
    UnblockGroupMemberMessageComposer,
    GetMemberGuildItemCountMessageComposer,
    KickMemberMessageComposer,
    GetGuildEditorDataMessageComposer,
    GetGuildMembershipsMessageComposer,
    GetHabboGroupBadgesMessageComposer,
    GetHabboGroupDetailsMessageComposer,
    GetIgnoredUsersMessageComposer,
    GetDailyTasksComposer,
    GetSelectedBadgesMessageComposer,
    GetUserNftChatStylesMessageComposer,
    IgnoreUserMessageComposer,
    JoinHabboGroupMessageComposer,
    ReplenishRespectMessageComposer,
    ScrGetKickbackInfoMessageComposer,
    ScrGetUserInfoMessageComposer,
    SelectFavouriteHabboGroupMessageComposer,
    UnblockUserMessageComposer,
    UnignoreUserMessageComposer,
    UpdateGuildBadgeMessageComposer,
    UpdateGuildColorsMessageComposer,
    UpdateGuildIdentityMessageComposer,
    UpdateGuildSettingsMessageComposer
} from './messages/outgoing/users';

// Outgoing Composers - Campaign
import {OpenCampaignCalendarDoorAsStaffComposer, OpenCampaignCalendarDoorComposer,} from './messages/outgoing/campaign';

// Outgoing Composers - Advertisement
import {InterstitialShownMessageComposer,} from './messages/outgoing/advertisement';

// Outgoing Composers - Handshake (NUX)
import {NewUserExperienceScriptProceedComposer,} from './messages/outgoing/handshake';

// Outgoing Composers - Inventory
import {
    AcceptTradingComposer,
    AddItemsToTradeComposer,
    AddItemToTradeComposer,
    AvatarEffectActivatedComposer,
    AvatarEffectSelectedComposer,
    CancelPetBreedingComposer,
    CloseTradingComposer,
    ConfirmAcceptTradingComposer,
    ConfirmDeclineTradingComposer,
    ConfirmPetBreedingComposer,
    CreditVaultStatusMessageComposer,
    GetBadgesComposer,
    GetBadgeInformationComposer,
    GetBotInventoryComposer,
    GetCreditsInfoComposer,
    GetPetInventoryComposer,
    IncomeRewardClaimMessageComposer,
    IncomeRewardStatusMessageComposer,
    OpenTradingComposer,
    RemoveItemFromTradeComposer,
    GetIsBadgeRequestFulfilledComposer,
    RequestABadgeComposer,
    RequestFurniInventoryComposer,
    RequestFurniInventoryWhenNotInRoomComposer,
    RequestRoomPropertySetComposer,
    GetBadgePointLimitsComposer,
    GetSilverMessageComposer,
    GetNftCreditsMessageComposer,
    ResetUnseenItemIdsComposer,
    ResetUnseenItemsComposer,
    SetActivatedBadgesComposer,
    SilverFeeMessageComposer,
    UnacceptTradingComposer,
    WithdrawCreditVaultMessageComposer,
} from './messages/outgoing/inventory';

// Vortex-specific (no AS3 backing) - furni editor and fishing
import {
    VortexApplyFurniDefinitionComposer,
    VortexApplyFurniEditComposer,
    VortexStartFishingComposer,
    VortexStopFishingComposer,
    VortexHookHavocInputComposer,
    VortexFishingJoinDerbyComposer,
    VortexFishingMountCatchComposer,
    VortexGetFurniDefinitionComposer,
    VortexGetFurniEditorDataComposer,
} from './messages/outgoing/vortex';

import {
    VortexFishingSpotDepletedMessageEvent,
    VortexHookHavocStartedMessageEvent,
    VortexHookHavocResultMessageEvent,
    VortexFishingCatchResultMessageEvent,
    VortexFishingDefinitionsMessageEvent,
    VortexFishingDerbyStandingMessageEvent,
    VortexFishingErrorMessageEvent,
    VortexFishingPlayerStateMessageEvent,
    VortexFishingRecordsMessageEvent,
    VortexFishSightedMessageEvent,
    VortexFurniDefinitionMessageEvent,
    VortexFurniEditorDataMessageEvent,
    VortexFurniEditorRightsMessageEvent,
} from './messages/incoming/vortex';

const log = Logger.getLogger('habbo.communication.HabboMessages');

/**
 * A `Map` that refuses to lose an entry quietly.
 *
 * Registering two classes under one header used to be invisible: the second `set()` replaced the
 * first, `MessageRegistry` then only ever saw the survivor, and the loser surfaced much later — if
 * at all — as a bare "Unknown message event class" from whichever handler happened to register it.
 * That is how `GuestRoomSearchResultMessageEvent` sat on 1265 (the Wired trigger's header) with no
 * id of its own. A collision here is always a bug in one of the two headers, never a policy.
 *
 * This has no AS3 counterpart: AS3 assigns into a plain array (`_SafeStr_4546[id] = cls`) and has
 * the same hazard, but its ids came from the compiler rather than from being recovered by hand.
 */
class HeaderMap<T> extends Map<number, T>
{
    constructor(private readonly _kind: string)
    {
        super();
    }

    override set(id: number, value: T): this
    {
        const existing = this.get(id);

        if(existing !== undefined && existing !== value)
        {
            log.error(
                `Duplicate ${this._kind} header ${id}: ${(value as {name?: string}).name ?? value} would replace `
                + `${(existing as {name?: string}).name ?? existing}. One of the two headers is wrong — the replaced `
                + 'class ends up with no id and never fires. Check the WIN63 registry (_SafeCls_2046.as).'
            );
        }

        return super.set(id, value);
    }
}

/**
 * Habbo message configuration
 * Maps message IDs to their composer and event classes
 */
export class HabboMessages implements IMessageConfiguration
{
    constructor()
    {
        this.registerEvents();
        this.registerComposers();
    }

    private _events: Map<number, EventClass> = new HeaderMap<EventClass>('incoming event');

    // AS3: .../src/com/sulake/habbo/communication/_SafeCls_2046.as::get events()
    get events(): Map<number, EventClass>
    {
        return this._events;
    }

    // AS3: .../src/com/sulake/habbo/communication/_SafeCls_2046.as::_composers
    private _composers: Map<number, ComposerClass> = new HeaderMap<ComposerClass>('outgoing composer');

    // AS3: .../src/com/sulake/habbo/communication/_SafeCls_2046.as::get composers()
    get composers(): Map<number, ComposerClass>
    {
        return this._composers;
    }

    /**
     * Register incoming message events (Server -> Client)
     */
    private registerEvents(): void 
    {
        // === HANDSHAKE ===
        this._events.set(3309, InitDiffieHandshakeMessageEvent);
        this._events.set(3401, CompleteDiffieHandshakeMessageEvent);
        this._events.set(230, AuthenticationOKMessageEvent);
        this._events.set(1973, UniqueMachineIdMessageEvent);
        this._events.set(4000, DisconnectReasonMessageEvent);
        this._events.set(1343, IdentityAccountsEvent);

        // === SESSION ===
        this._events.set(1407, PingMessageEvent);
        this._events.set(297, GenericErrorMessageEvent);
        this._events.set(3599, UserRightsMessageEvent);
        this._events.set(3985, UserObjectMessageEvent);
        // AS3: header corrected 3913 -> 70 - was swapped with AccountSafetyLockStatusChangeMessageEvent.
        // _SafeCls_2046.as: _SafeStr_4546[70] = _SafeCls_2080, whose only member is `get noobnessLevel():int`.
        this._events.set(70, NoobnessLevelMessageEvent);

        // === AVAILABILITY ===
        this._events.set(1350, AvailabilityStatusMessageEvent);
        this._events.set(698, LoginFailedHotelClosedMessageEvent);
        // AS3: header corrected 184 -> 1737 - was swapped with InfoHotelClosingMessageEvent.
        // sources/WIN63-202607011411-782849652 unknowns/_SafePkg_2018/_SafeCls_3162.as
        // (isInMaintenance, minutesUntilMaintenance, conditional duration) matches this
        // parser exactly and is registered at 1737, not 184.
        this._events.set(1737, MaintenanceStatusMessageEvent);

        // === AVATAR ===
        this._events.set(132, FigureUpdateMessageEvent);

        // === NAVIGATOR ===
        this._events.set(3586, NavigatorSettingsMessageEvent);
        this._events.set(1055, FavouritesMessageEvent);
        // AS3: header corrected 3796 -> 3081 (_SafeCls_3187, onFavouriteChanged in
        // com/sulake/habbo/navigator/_SafeCls_1951.as / _SafeCls_2208.as). Header 3796
        // there is really onPetFigureUpdate (_SafeCls_2731), an unrelated, unported message.
        this._events.set(3081, FavouriteChangedMessageEvent);
        this._events.set(3042, GetGuestRoomResultMessageEvent);
        // The room's flood sensitivity on its own. `vortex-emulator` sends it from the room
        // settings dialog; nothing here listened, so the chat flow kept the default forever.
        this._events.set(594, RoomChatSettingsMessageEvent);
        // AS3: header corrected 1265 -> 160 (_SafeCls_3509, whose parser _SafeCls_4150 builds the
        // searchType/searchParam/rooms/ad data class _SafeCls_3104 — WIN63 registry _SafeCls_2046.as
        // l.1262). 1265 is really the Wired furni-trigger push (_SafeCls_3224, registered below at
        // l.1127), and because `_events` is a Map the later `set(1265, ...)` silently replaced this
        // entry, so GuestRoomSearchResultMessageEvent had no id at all.
        this._events.set(160, GuestRoomSearchResultMessageEvent);
        this._events.set(837, UserFlatCatsMessageEvent);
        this._events.set(1370, UserEventCatsMessageEvent);
        this._events.set(2952, PopularRoomTagsResultMessageEvent);
        this._events.set(2211, OfficialRoomsMessageEvent);
        this._events.set(704, CategoriesWithVisitorCountMessageEvent);
        this._events.set(2831, CanCreateRoomMessageEvent);
        this._events.set(853, CanCreateRoomEventMessageEvent);
        this._events.set(1712, FlatCreatedMessageEvent);
        this._events.set(2502, RoomRatingMessageEvent);
        this._events.set(3030, RoomInfoUpdatedMessageEvent);
        this._events.set(466, DoorbellMessageEvent);
        this._events.set(2481, RoomEventMessageEvent);
        this._events.set(894, RoomEventCancelMessageEvent);
        this._events.set(1086, FlatAccessDeniedMessageEvent);
        this._events.set(3494, ConvertedRoomIdMessageEvent);
        this._events.set(84, CompetitionRoomsDataMessageEvent);

        // === RAID PROTECTION ===
        // These three exist only in AIR-1.0.31 — no WIN63 build has the feature at all, so there
        // is no 20260701 header to recover and none of the three names is recoverable either
        // (every class is obfuscated in the one tree that has them). AIR's own ids cannot simply
        // be reused: it re-randomises the whole registry, and two of the three collide with
        // messages this revision already uses. So the ids below are *assigned* in 20260701
        // numbering, and must be assigned identically in the emulator's Headers.cs:
        //
        //   AIR  734 -> 3554  (734 is ChatReviewSessionOfferedToGuide here)
        //   AIR 3553 -> 3553  (free on both sides, so AIR's own id is kept)
        //   AIR 3620 -> 3555  (3620 is SecondsUntil here)
        //
        // 3554 and 3555 were picked as the first ids after 3553 that are unused as an event AND
        // as a composer in the WIN63 registry, in this file, and in the emulator.
        this._events.set(3554, RaidProtectionCapabilityMessageEvent);
        this._events.set(3553, RaidProtectionSettingsMessageEvent);
        this._events.set(3555, RaidProtectionSaveResultMessageEvent);

        // === NOTIFICATIONS ===
        this._events.set(509, ActivityPointsMessageEvent);
        // Header from the WIN63 registry: _SafeStr_4546[2046] = _SafeCls_2011
        // (sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as),
        // corroborated by the emulator's Revision20260701 Headers.cs. The 2016-era 1016 that
        // win63_version and Nitro carry is a different build's number.
        this._events.set(2046, HabboActivityPointNotificationMessageEvent);
        this._events.set(1936, InfoFeedEnableMessageEvent);

        // === INVENTORY ===
        this._events.set(3642, CreditBalanceEvent);
        this._events.set(1231, FigureSetIdsMessageEvent);
        this._events.set(3070, AchievementsScoreMessageEvent);
        // AS3: header corrected 2475 -> 2405 (_SafeCls_2835, onAvatarEffects in
        // com/sulake/habbo/inventory/_SafeCls_1951.as). Header 2475 there is really
        // onPostMessageMessage (_SafeCls_3133, GroupForumController.as), an unrelated,
        // unported message.
        this._events.set(2405, AvatarEffectsMessageEvent);
        // Discrete avatar-effect push updates (owned by inventory/_SafeCls_1951.as).
        // IDs from com/sulake/habbo/communication/_SafeCls_2046.as.
        this._events.set(1577, AvatarEffectAddedMessageEvent);
        this._events.set(3814, AvatarEffectActivatedMessageEvent);
        this._events.set(2236, AvatarEffectExpiredMessageEvent);
        // The avatar editor's two remaining incoming messages. 3629 is *not* the room-effect push
        // (that is 2624, AvatarEffectMessageEvent) — both ids are real and carry different payloads.
        this._events.set(1484, WardrobeMessageEvent);
        this._events.set(3629, AvatarEffectSelectedMessageEvent);
        // The avatar editor's hot-looks and NFT-wardrobe pages.
        this._events.set(3853, HotLooksMessageEvent);
        this._events.set(2116, UserNftWardrobeMessageEvent);
        this._events.set(582, SelectedNftWardrobeOutfitMessageEvent);

        // === INVENTORY - FURNI ===
        this._events.set(2694, FurniListMessageEvent);
        this._events.set(3151, FurniListAddOrUpdateMessageEvent);
        this._events.set(1156, FurniListRemoveMessageEvent);
        this._events.set(1268, FurniListRemoveMultipleMessageEvent);
        // AS3: header corrected 3790 -> 1856 (_SafeCls_2440, onFurniListInvalidate,
        // confirmed also at com/sulake/habbo/ui/handler/CraftingWidgetHandler.as:223).
        // Header 3790 there is really onTreasureHuntFail (_SafeCls_3474), an unrelated,
        // unported message.
        this._events.set(1856, FurniListInvalidateMessageEvent);

        // === INVENTORY - BADGES ===
        // AS3: header corrected 1091 -> 2748 (_SafeCls_3926, onBadges in
        // com/sulake/habbo/inventory/_SafeCls_1951.as, also seen at
        // catalog/clubcenter/HabboClubCenter.as:120). Header 1091 there is really
        // onCollectibleMintingEnabledMessage (_SafeCls_2669), an unrelated, unported message.
        this._events.set(2748, BadgesMessageEvent);
        // AS3: _SafeStr_4546[2840] = _SafeCls_3204 in the registry
        // com/sulake/habbo/communication/_SafeCls_2046.as:1467 (onBadgeReceived, registered twice —
        // habbo/inventory/_SafeCls_1951.as:200 and habbo/notifications/_SafeCls_1951.as:129).
        // Corroborated by the emulator's own BadgeReceivedComposer = 2840.
        this._events.set(2840, BadgeReceivedEvent);
        // AS3: WIN63's registry, `_SafeStr_4546[1153] = _SafeCls_3875` — the badge-display
        // furni's rarity/owner-count lookup. The emulator does not implement it.
        this._events.set(1153, BadgeInformationEvent);

        // === INVENTORY - PETS ===
        this._events.set(1200, PetInventoryMessageEvent);

        // === INVENTORY - BOTS ===
        // AS3: header corrected 2902 -> 682 (_SafeCls_3058, onBots in
        // com/sulake/habbo/inventory/_SafeCls_1951.as:168). Header 2902 there is really
        // onGameStarted (_SafeCls_3582), an unrelated, unported message.
        this._events.set(682, BotInventoryMessageEvent);
        // The two single-bot deltas, both from WIN63's own registry (`_SafeStr_4546[3570]` =
        // _SafeCls_3954 / `[2032]` = _SafeCls_3331) and corroborated by the emulator
        // (BotAddedToInventoryComposer / BotRemovedFromInventoryComposer). Without them a bought bot
        // only appeared after a full re-request, and a placed one stayed in the grid.
        this._events.set(3570, BotAddedToInventoryMessageEvent);
        this._events.set(2032, BotRemovedFromInventoryMessageEvent);

        // === INVENTORY - TRADING ===
        this._events.set(953, TradingOpenMessageEvent);
        this._events.set(699, TradingCloseMessageEvent);
        this._events.set(560, TradingAcceptMessageEvent);
        this._events.set(2275, TradingItemListMessageEvent);
        this._events.set(1070, TradingCompletedMessageEvent);
        this._events.set(3138, TradingConfirmationMessageEvent);
        this._events.set(3556, TradingNotOpenMessageEvent);
        // The five the trade window needs to explain a refusal or price a web3 trade. IDs from
        // WIN63's registry (`_SafeStr_4546[2855]/[814]/[2294]/[1490]/[3497]`), each corroborated by
        // the emulator (TradeOpenFailed / TradingOtherNotAllowed / TradingYouAreNotAllowed /
        // TradeSilverSet / TradeSilverFee MessageComposer). All five route to
        // `TradingModel.handleMessageEvent()`, as they do in AS3.
        this._events.set(2855, TradeOpenFailedEvent);
        this._events.set(814, TradingOtherNotAllowedEvent);
        this._events.set(2294, TradingYouAreNotAllowedEvent);
        this._events.set(1490, TradeSilverSetMessageEvent);
        this._events.set(3497, TradeSilverFeeMessageEvent);

        // === GROUP FORUMS ===
        // `_events[1373]/[1222]/[3603]/[3965]/[866]/[2475]/[2988]/[956]/[1146]` in WIN63's
        // registry, each resolved through GroupForumController's own listener registrations —
        // the callback names there (onForumsList, onThreadList, …) are what disambiguate the four
        // pairs that share a wire shape.
        this._events.set(1373, ForumsListMessageEvent);
        this._events.set(1222, ForumThreadsMessageEvent);
        this._events.set(3603, ThreadMessagesMessageEvent);
        this._events.set(3965, ForumDataMessageEvent);
        this._events.set(866, UnreadForumsCountMessageEvent);
        this._events.set(2475, PostMessageMessageEvent);
        this._events.set(2988, UpdateMessageMessageEvent);
        this._events.set(956, PostThreadMessageEvent);
        this._events.set(1146, UpdateThreadMessageEvent);

        // === SOUND (Trax) ===
        // The song-metadata answer and your song-disk inventory, `_events[2278]`/`_events[1930]`
        // in WIN63's registry. `HabboMusicController` subscribes both; the metadata one is what
        // names a Trax disc anywhere it is shown.
        this._events.set(2278, TraxSongInfoMessageEvent);
        this._events.set(1930, UserSongDisksInventoryMessageEvent);
        // `_events[3050]` in WIN63's registry — the official-song-code lookup's answer. Explicitly
        // NOT 2264: that is win63_version's id for this event, and the 2026 registry reassigned
        // 2264 to WeeklyCompetitiveFriendsLeaderboardEvent. See the event class's own note.
        this._events.set(3050, OfficialSongIdMessageEvent);
        // The room play lists, `_events[398]/[2257]/[949]/[1242]/[2785]` in WIN63's registry:
        // what a jukebox is playing, the discs in it, its "no room left" refusal, and a sound
        // machine's list plus its single-song addition.
        this._events.set(398, NowPlayingMessageEvent);
        this._events.set(2257, JukeboxSongDisksMessageEvent);
        this._events.set(949, JukeboxPlayListFullMessageEvent);
        this._events.set(1242, PlayListMessageEvent);
        this._events.set(2785, PlayListSongAddedMessageEvent);

        // === CAMERA ===
        // The photo pipeline, `_events[2768]/[2176]/[203]/[3907]/[1325]/[2622]` in WIN63's
        // registry: the camera's prices, where the render can be fetched, and the outcomes of
        // publishing, buying, rendering a thumbnail and entering the competition.
        this._events.set(2768, InitCameraMessageEvent);
        this._events.set(2176, CameraStorageUrlMessageEvent);
        this._events.set(203, CameraPublishStatusMessageEvent);
        this._events.set(3907, CameraPurchaseOKMessageEvent);
        this._events.set(1325, ThumbnailStatusMessageEvent);
        this._events.set(2622, CompetitionStatusMessageEvent);

        // === INVENTORY - UNSEEN ===
        this._events.set(3059, UnseenItemsMessageEvent);

        // === MYSTERY BOX ===
        this._events.set(1389, MysteryBoxKeysMessageEvent);
        this._events.set(691, ShowMysteryBoxWaitMessageEvent);
        this._events.set(3840, CancelMysteryBoxWaitMessageEvent);
        this._events.set(353, GotMysteryBoxPrizeMessageEvent);

        // === CATALOG ===
        this._events.set(1893, BuildersClubSubscriptionStatusMessageEvent);
        this._events.set(2378, BuildersClubFurniCountMessageEvent);

        // === HANDSHAKE (continued) ===
        this._events.set(2313, IsFirstLoginOfDayMessageEvent);

        // === NEW NAVIGATOR ===
        this._events.set(24, NavigatorMetaDataMessageEvent);
        this._events.set(3708, NavigatorSearchResultSetMessageEvent);
        // AS3: header corrected 866 -> 432 - _SafeCls_2046.as: _SafeStr_4546[432] = _SafeCls_3072, whose parser
        // reads `savedSearches:Vector`. 866 is the unread-forums count (parser exposes `unreadForumsCount:int`).
        this._events.set(432, NavigatorSavedSearchesMessageEvent);
        this._events.set(1761, NavigatorLiftedRoomsMessageEvent);
        this._events.set(1754, NavigatorCollapsedCategoriesMessageEvent);
        this._events.set(3937, NavigatorWindowSettingsMessageEvent);

        // === ROOM SESSION ===
        this._events.set(2349, RoomReadyMessageEvent);
        this._events.set(611, OpenConnectionMessageEvent);
        this._events.set(2051, FlatAccessibleMessageEvent);
        this._events.set(3404, CloseConnectionMessageEvent);
        this._events.set(530, RoomQueueStatusMessageEvent);
        this._events.set(1901, YouAreSpectatorMessageEvent);
        // AS3: header corrected 1856 -> 412 (_SafeCls_3717, onYouAreNotSpectator,
        // com/sulake/habbo/room/_SafeCls_1984.as:286). Header 1856 there is really
        // onFurniListInvalidate (_SafeCls_2440), which has moved here from 3790 - see
        // the INVENTORY - FURNI section above.
        this._events.set(412, YouAreNotSpectatorMessageEvent);
        // Header 2942 (_SafeCls_3587, onConfigurationItemStates, parser _SafeCls_3235). The shape
        // gap this used to flag is closed: HanditemConfigurationMessageEventParser now reads
        // chooserDisabled / freeFurniMovementsEnabled / invisibleFurni, each behind its own
        // bytes-available guard exactly as AS3 does. The emulator writes only the first boolean,
        // which the guards already tolerate.
        this._events.set(2942, HanditemConfigurationMessageEvent);
        this._events.set(3339, RoomForwardMessageEvent);
        this._events.set(1052, GamePlayerValueMessageEvent);
        this._events.set(1600, YouArePlayingGameMessageEvent);
        this._events.set(2430, CantConnectMessageEvent);

        // === ROOM PERMISSIONS ===
        this._events.set(934, YouAreControllerMessageEvent);
        this._events.set(456, YouAreNotControllerMessageEvent);
        this._events.set(1986, YouAreOwnerMessageEvent);

        // === ROOM ENGINE ===
        this._events.set(2885, FloorHeightMapMessageEvent);
        this._events.set(154, FurnitureAliasesMessageEvent);
        this._events.set(2260, HeightMapMessageEvent);
        this._events.set(3279, HeightMapUpdateMessageEvent);
        this._events.set(2792, RoomEntryTileMessageEvent);
        this._events.set(1235, RoomOccupiedTilesMessageEvent);
        this._events.set(2621, OfferRewardDeliveredMessageEvent);
        this._events.set(787, HasClaimedProductResponseMessageEvent);
        this._events.set(2914, RoomEntryInfoMessageEvent);
        this._events.set(2104, ObjectsMessageEvent);
        this._events.set(368, ObjectAddMessageEvent);
        this._events.set(114, ObjectUpdateMessageEvent);
        this._events.set(1916, ObjectRemoveMessageEvent);
        this._events.set(2329, ObjectDataUpdateMessageEvent);
        this._events.set(632, ObjectsDataUpdateMessageEvent);
        this._events.set(264, DiceValueMessageEvent);
        this._events.set(1778, OneWayDoorStatusMessageEvent);
        this._events.set(254, ItemRemoveMultipleMessageEvent);
        this._events.set(2361, ObjectRemoveMultipleMessageEvent);
        this._events.set(3379, ItemsMessageEvent);
        this._events.set(3733, ItemAddMessageEvent);
        this._events.set(1198, ItemUpdateMessageEvent);
        this._events.set(2859, ItemRemoveMessageEvent);
        this._events.set(834, ItemStateUpdateMessageEvent);
        this._events.set(1787, ItemsStateUpdateMessageEvent);
        this._events.set(540, ItemDataUpdateMessageEvent);
        this._events.set(1131, AreaHideMessageEvent);
        this._events.set(325, WiredMovementsMessageEvent);
        this._events.set(3643, ObjectRemoveConfirmMessageEvent);
        this._events.set(2458, BCPlacementWarningMessageEvent);
        this._events.set(536, SpecialRoomEffectMessageEvent);
        // Header verified (_SafeCls_2131 -> parser _SafeCls_2309). The extra Integer is now
        // identified: AS3 reads `badgesRank` after `isModerator` on the userType==1 branch, and
        // this port does not.
        //
        // It is deliberately still not read. vortex-emulator's RoomAvatarSerializer ends its
        // player block at IsModerator too, so client and server agree today; adding the read to
        // match AS3 alone would consume four bytes that are not on the wire and desync every
        // remaining user in the packet. Fixing it means changing both sides together.
        this._events.set(996, UsersMessageEvent);
        this._events.set(2613, UserUpdateMessageEvent);
        this._events.set(3693, UserRemoveMessageEvent);
        this._events.set(2794, SlideObjectBundleMessageEvent);
        // AS3: sources/win63_version/habbo/communication/messages/incoming/room/engine/RoomPropertyMessageEvent.as
        // (name recovered; obfuscated in primary dump as _SafeStr_4546[1956] = _SafeCls_2935,
        // sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_2935.as - exact
        // field match: floorType/wallType/landscapeType/animatedLandscapeType).
        this._events.set(1956, RoomPropertyMessageEvent);
        // AS3: sources/win63_version/habbo/communication/messages/incoming/room/engine/RoomVisualizationSettingsEvent.as
        // (name recovered; obfuscated in primary dump as _SafeStr_4546[2986] = _SafeCls_2101,
        // sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_2101.as - exact
        // field match: wallsHidden/wallThicknessMultiplier/floorThicknessMultiplier).
        this._events.set(2986, RoomVisualizationSettingsEvent);

        // === ROOM CHAT ===
        this._events.set(311, ChatMessageEvent);
        this._events.set(1776, ShoutMessageEvent);
        this._events.set(3072, WhisperMessageEvent);
        this._events.set(206, UserTypingMessageEvent);
        // AS3: _SafeCls_2046.as::_events[3614] = _SafeCls_3307 — the server refusing this player's
        // chat for N seconds, subscribed by RoomChatHandler. Corroborated by vortex-emulator's
        // FloodControlMessageComposer = 3614.
        this._events.set(3614, FloodControlMessageEvent);
        // AS3: _SafeCls_2046.as::_events[3102] = _SafeCls_3646 — the special system message shown
        // above a user, subscribed by RoomChatHandler. No unobfuscated tree names it and the
        // emulator has no constant for 3102 either, so the class name is derived from the AS3
        // handler (`onSpecialSystemChat`); see the parser's header.
        this._events.set(3102, SpecialSystemChatMessageEvent);

        // === ROOM ACTION ===
        // AS3: header corrected 1783 -> 1036 (_SafeCls_3215, onExpression,
        // com/sulake/habbo/room/_SafeCls_1984.as:270, parser _SafeCls_3947 - userId,
        // expressionType - matches this TS parser exactly). Header 1783 there is really
        // onRoomSettingsSaved (_SafeCls_2385), which has moved here - see ROOM SETTINGS below.
        this._events.set(1036, ExpressionMessageEvent);
        this._events.set(2217, DanceMessageEvent);
        // AS3: header corrected 3629 -> 2624. The registry maps _SafeStr_4546[2624] = _SafeCls_2589,
        // the event RoomMessageHandler.onAvatarEffect subscribes to, whose parser _SafeCls_3361
        // reads (userId, effectId, delayMilliSeconds) — exactly this TS parser. 3629 is a different
        // message entirely (_SafeCls_3136 -> parser _SafeCls_4142, a single `type` int), consumed by
        // AvatarEditorMessageHandler.onAvatarEffectSelected. The wrong header is why in-room avatar
        // effects never arrived even though the whole render pipeline was ported.
        this._events.set(2624, AvatarEffectMessageEvent);
        this._events.set(3517, SleepMessageEvent);
        this._events.set(2850, CarryObjectMessageEvent);
        // AS3: header corrected 2833 -> 1953 (_SafeCls_3578, onUseObject,
        // com/sulake/habbo/room/_SafeCls_1984.as:275, parser _SafeCls_3865 - userId,
        // itemType - matches this TS parser exactly). Header 2833 there is really
        // onStateMessage (_SafeCls_3686, com/sulake/habbo/phonenumber/HabboPhoneNumber.as:82),
        // an unrelated, unported message.
        this._events.set(1953, UseObjectMessageEvent);
        this._events.set(3798, UserChangeMessageEvent);

        // === ROOM FURNITURE ===
        this._events.set(1093, RoomDimmerPresetsMessageEvent);
        this._events.set(914, PresentOpenedMessageEvent);
        this._events.set(3568, OpenPetPackageRequestedMessageEvent);
        this._events.set(716, OpenPetPackageResultMessageEvent);
        // Vortex-custom (not in official AS3 dumps): vortex-client commit e8dc43d "chore(protocol):
        // register rentable space (4600/4601) and pet (3072/3073) message IDs"
        this._events.set(4600, RentableSpaceConfigMessageEvent);

        // === ROOM PET ===
        // Every header below is read directly out of WIN63's own incoming-events registry,
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // (`_SafeStr_4546[id] = _SafeCls_N`). The pet message package is package-obfuscated there, so
        // each class was identified by the handler that subscribes to it — RoomUsersHandler.as:85-95
        // constructs them by name-bearing callback (onPetInfo, onEnabledPetCommands, …) — and the
        // class names themselves come from the secondary tree's
        // habbo/communication/messages/incoming/room/pets/.
        //
        //   3192 -> _SafeCls_3598 (PetInfo, RoomUsersHandler::onPetInfo)
        //    332 -> _SafeCls_3885 (PetCommands, onEnabledPetCommands)
        //   2753 -> _SafeCls_3115 (PetStatusUpdate, onPetStatusUpdate)
        //   3104 -> _SafeCls_3060 (PetLevelUpdate, onPetLevelUpdate)
        //   3796 -> _SafeCls_2731 (PetFigureUpdate, onPetFigureUpdate)
        //    946 -> _SafeCls_3946 (PetExperience, habbo/room/_SafeCls_1984.as:284 onPetExperience)
        //   3195 -> _SafeCls_3208 (PetPlacingError, onPetPlacingError)
        //   2940 -> _SafeCls_3328 (PetBreedingResult, onPetBreedingResult)
        //
        // These used to be annotated as emulator-derived, with 3192 marked Vortex-custom outright.
        // They are not: all eight are the client's own headers, and the emulator agrees with them.
        // The one genuinely invented member of this block, PetVocalMessageEvent at 3073, is gone —
        // no AS3 tree has such a message, and 3073 is WhisperMessageEvent, which it silently
        // overwrote in this Map.
        this._events.set(3192, PetInfoMessageEvent);
        this._events.set(332, PetCommandsMessageEvent);
        this._events.set(2753, PetStatusUpdateEvent);
        this._events.set(3104, PetLevelUpdateEvent);
        this._events.set(3796, PetFigureUpdateEvent);
        this._events.set(946, PetExperienceEvent);
        this._events.set(3195, PetPlacingErrorEvent);
        this._events.set(2940, PetBreedingResultEvent);

        // === ROOM RENTABLE BOT ===
        // Same route as the pet block above: every id read out of WIN63's own registry
        // (`_SafeStr_4546[2463]/[1293]/[2336]/[520]`), each class identified by the member that
        // subscribes to it — BotSkillConfigurationViewBase.open() for the configuration answer,
        // RoomDesktop for the skill list and the forced context menu, RoomUsersHandler::onBotError
        // for the refusal. All four corroborated by vortex-emulator's own composer constants.
        this._events.set(2463, BotCommandConfigurationEvent);
        this._events.set(1293, BotSkillListUpdateEvent);
        this._events.set(2336, BotForceOpenContextMenuEvent);
        this._events.set(520, BotErrorEvent);

        // Monster-plant breeding, same registry, same identification route (RoomUsersHandler.as:90-95
        // for the first four, habbo/inventory/_SafeCls_1951.as:195 for the last):
        //    939 -> _SafeCls_2392 (PetBreeding, onPetBreedingEvent)
        //   1477 -> _SafeCls_2909 (ConfirmBreedingRequest, onConfirmPetBreeding)
        //   2068 -> _SafeCls_2894 (ConfirmBreedingResult, onConfirmPetBreedingResult)
        //     40 -> _SafeCls_3668 (NestBreedingSuccess, onNestBreedingSuccess)
        //   2441 -> _SafeCls_3355 (GoToBreedingNestFailure, onGoToBreedingNestFailure)
        this._events.set(939, PetBreedingEvent);
        this._events.set(1477, ConfirmBreedingRequestEvent);
        this._events.set(2068, ConfirmBreedingResultEvent);
        this._events.set(40, NestBreedingSuccessEvent);
        this._events.set(2441, GoToBreedingNestFailureEvent);

        // Pet inventory add/remove, from habbo/inventory/_SafeCls_1951.as:170/181:
        //   3013 -> _SafeCls_2397 (PetRemovedFromInventory, onPetRemoved)
        //   3653 -> _SafeCls_3510 (PetAddedToInventory, onPetAdded)
        this._events.set(3013, PetRemovedFromInventoryEvent);
        this._events.set(3653, PetAddedToInventoryEvent);

        // Water/light/treat given to a pet, from RoomChatHandler.as:41:
        //   3858 -> _SafeCls_3489 (PetSupplementedNotification, onPetSupplementedNotification)
        this._events.set(3858, PetSupplementedNotificationEvent);

        // PetRespectFailedEvent (header 31, AS3 incoming/room/pets/) is deliberately absent here:
        // it was already ported and registered under incoming/notifications/ (see the NOTIFICATIONS
        // block below), and its parser already reads AS3's requiredDays/avatarAgeInDays exactly.
        // Its directory does not match the AS3 package, but re-homing it would be churn for no
        // behaviour change — and registering a second copy at 31 would have silently overwritten
        // the first, since _events is a Map. The server sends this one with an empty body too.

        // === WIRED ===
        // AS3: sources/win63_version/habbo/communication/messages/incoming/userdefinedroomevents/wiredmenu/WiredPermissionsEvent.as
        // (name recovered; obfuscated in primary dump as _SafeStr_4546[3483] = _SafeCls_3768,
        // sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2538/_SafeCls_3768.as, whose
        // parser is the real, non-obfuscated com/sulake/habbo/communication/messages/parser/
        // userdefinedroomevents/wiredmenu/_SafeCls_2783.as - exact field match: canModify/canRead).
        this._events.set(3483, WiredPermissionsEvent);
        this._events.set(491, WiredMenuSettingsEvent);
        this._events.set(1964, WiredRoomStatsEvent);
        this._events.set(3419, WiredErrorLogsEvent);
        // IDs read directly from WIN63's own message registry
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // (`_SafeStr_4546[id] = _SafeCls_N`, the incoming-events map):
        //   2827 -> _SafeCls_3319 (WiredEnvironment), 3931 -> _SafeCls_3436 (WiredClickSettings),
        //   309 -> _SafeCls_3728 (WiredClickUserResponse), 2997 -> _SafeCls_3832 (WiredRewardResult).
        this._events.set(2827, WiredEnvironmentEvent);
        this._events.set(3931, WiredClickSettingsEvent);
        this._events.set(309, WiredClickUserResponseEvent);
        this._events.set(2997, WiredRewardResultMessageEvent);
        // Wired-furni definition pushes (server -> client), IDs from WIN63's registry _SafeCls_2046.as:
        //   1265 -> _SafeCls_3224 (Trigger), 2552 -> _SafeCls_3816 (Action), 2250 -> _SafeCls_3178
        //   (Condition), 2574 -> _SafeCls_3130 (Addon), 1501 -> _SafeCls_3199 (Variable),
        //   722 -> _SafeCls_2636 (Selector). Each parser exposes .def (a Triggerable subclass).
        this._events.set(1265, WiredFurniTriggerEvent);
        this._events.set(2552, WiredFurniActionEvent);
        this._events.set(2250, WiredFurniConditionEvent);
        this._events.set(2574, WiredFurniAddonEvent);
        this._events.set(1501, WiredFurniVariableEvent);
        this._events.set(722, WiredFurniSelectorEvent);
        // Wired config lifecycle (server -> client), IDs from WIN63 registry _SafeCls_2046.as:
        //   2635 -> _SafeCls_2464 (Open), 3201 -> _SafeCls_2398 (ValidationError),
        //   1192 -> _SafeCls_2958 (SaveSuccess).
        this._events.set(2635, OpenEvent);
        this._events.set(3201, WiredValidationErrorEvent);
        this._events.set(1192, WiredSaveSuccessEvent);

        // === VARIABLE FX ===
        // AIR-1.0.31 only — the wired-variable effects drawn over avatars and furni. Same
        // situation as raid protection above: AIR re-randomises the registry, so its ids are kept
        // only where they are free in this revision, and assigned otherwise.
        //
        //   AIR  267 -> 3390  (267 is taken as an event here)
        //   AIR 1200 -> 3391  (1200 is taken as an event here)
        //   AIR 3388 -> 3388  (free on both sides, so AIR's own id is kept)
        //   AIR 3889 -> 3889  (likewise)
        //
        // 3390 and 3391 are the first ids after 3388 unused as an event AND as a composer in the
        // WIN63 registry, in this file, and in the emulator. The emulator has none of these four
        // yet; they must be assigned there identically.
        this._events.set(3390, VariableFxConfigUpdateMessageEvent);
        this._events.set(3391, VariableFxConfigRemoveMessageEvent);
        this._events.set(3889, VariableFxStatusUpdateMessageEvent);
        this._events.set(3388, VariableFxStatusRemoveMessageEvent);

        // === WIRED WEB API ===
        // AIR-1.0.31 only, and the easy case of the three: AIR's event 59 is free as an event AND
        // as a composer in the WIN63 registry (58 is RewardTrackPremiumPurchaseResult, 59 and 60
        // are unused), in this file and in the emulator's Revision20260701 headers, so AIR's own
        // number is kept. The emulator has neither this nor its composer yet; both must be
        // assigned there identically.
        this._events.set(59, WiredApiKeyResultMessageEvent);

        this._events.set(3287, AllVariablesHashMessageEvent);
        this._events.set(2733, AllVariablesDiffMessageEvent);
        // Overview tab: variable-holders push (WIN63 registry _SafeCls_2046.as: 3506 -> _SafeCls_2537).
        this._events.set(3506, VariableInfoAndHoldersEvent);
        // Variable-management detail: the holder's permanent-variable list, and the verdict on a
        // write (WIN63 registry: 1557 -> _SafeCls_3146, 1643 -> _SafeCls_2757). Both subscribed by
        // VariableManagementDetailController. The emulator's constants for these two were
        // themselves corrections of a collision and a wrong guess, so its names corroborate rather
        // than merely coincide.
        this._events.set(1557, WiredUserPermanentVariablesEvent);
        this._events.set(1643, WiredSetUserPermanentVariableResultEvent);
        // Wired trading. Headers read straight out of WIN63's registry (_SafeCls_2046.as); the
        // reference emulator defines none of the four, so nothing sends them yet.
        // Wired chests: one page of transaction logs (WIN63 registry: 2910 -> _SafeCls_3439). Two
        // windows subscribe it — the chests tab's ten-row preview and the paged transactions
        // window — and each drops a page whose `logListType` is not its own. Names derived: no
        // unobfuscated tree carries the chest messages and the emulator has no constant for 2910.
        // === VAULT / EARNINGS ===
        // The three server->client halves of the vault. Their client->server siblings (809, 3417)
        // have been registered all along; nothing read the answers, because `EarningsController` was
        // unported. Names recovered from vortex-emulator, whose ids match WIN63's registry exactly.
        this._events.set(3976, IncomeRewardStatusMessageEvent);
        this._events.set(2984, IncomeRewardClaimResponseMessageEvent);
        this._events.set(1914, IncomeRewardNotificationMessageEvent);

        // === HABBICONS ===
        // Ids from WIN63's registry alone. vortex-emulator has no habbicon header of any kind, so
        // for once there is nothing to corroborate against and every name here is derived from the
        // controller's use of it — flagged as such at each declaration. Nothing on the server side
        // will ever send these; the client half is complete regardless.
        this._events.set(3728, UserHabbiconsMessageEvent);
        this._events.set(2019, UserHabbiconStatusChangedMessageEvent);
        this._events.set(3765, HabbiconShopDataMessageEvent);
        this._events.set(3714, HabbiconInfoMessageEvent);
        this._events.set(1547, RoomUseHabbiconMessageEvent);

        this._events.set(2910, WiredTransactionLogsEvent);
        // One transaction's full breakdown (WIN63 registry: 1306 -> _SafeCls_3176), the answer to a
        // click on a log row's "details" cell. Name derived, same reason as 2910.
        this._events.set(1306, WiredTransactionDetailsMessageEvent);
        // A wired transaction completed, and what it paid out (WIN63 registry: 2677 -> _SafeCls_3244).
        // Subscribed by RewardNotificationController. Name derived, same reason as 2910.
        this._events.set(2677, WiredTransactionSuccessMessageEvent);
        this._events.set(352, WiredTransactionFailMessageEvent);
        this._events.set(655, WiredTradeTransactionNotificationMessageEvent);
        this._events.set(431, ClaimProductResultMessageEvent);
        // Wired contracts (WIN63 registry: 2976 -> _SafeCls_2429, 3720 -> _SafeCls_3091,
        // 1479 -> _SafeCls_3800). All three subscribed by WiredContractController. Names derived —
        // no unobfuscated tree carries them. The emulator's 1479 is an unrelated *client->server*
        // Game2 leaderboard request, a different table: not a collision, but not corroboration
        // either.
        // === WIRED CHESTS ===
        // Six pushes, all read from WIN63's registry. Names derived — no unobfuscated tree carries
        // the chest messages and the emulator has no constant for any of them.
        this._events.set(1174, OpenWiredChestMessageEvent);
        this._events.set(1957, WiredChestUpdateSuccessMessageEvent);
        this._events.set(2721, WiredChestUpgradeResultMessageEvent);
        this._events.set(1022, WiredChestCoinsMessageEvent);
        this._events.set(2323, WiredChestItemsChunkMessageEvent);
        this._events.set(2738, WiredChestItemsUpdatedMessageEvent);
        this._events.set(2976, WiredContractContentsMessageEvent);
        this._events.set(3720, WiredContractUpdateResultMessageEvent);
        this._events.set(1479, WiredOpenContractMessageEvent);
        // Sandbox self-donation result (WIN63 registry: 3407 -> SelfDonationResultMessageEvent, one
        // of the few event classes that kept its real name).
        this._events.set(3407, SelfDonationResultMessageEvent);
        this._events.set(3650, WiredTradeInitiateMessageEvent);
        this._events.set(1481, WiredTradeCancelledMessageEvent);
        this._events.set(2137, WiredTradeCompletedMessageEvent);
        this._events.set(2488, WiredTradeItemsUpdateMessageEvent);
        // Inspection tab (WIN63 registry _SafeCls_2046.as): 2179 -> _SafeCls_3452 (variables for object),
        // 1230 -> _SafeCls_2847 (wired-menu error).
        this._events.set(2179, WiredVariablesForObjectEvent);
        this._events.set(1230, WiredMenuErrorEvent);
        // Room-logs sub-controller: a page of room logs (WIN63 registry _SafeCls_2046.as: 1910 ->
        // _SafeCls_3729).
        this._events.set(1910, WiredRoomLogsMessageEvent);
        // Variable-management overview sub-controller: a page of user-variable holders (WIN63 registry
        // _SafeCls_2046.as: 749 -> _SafeCls_2492).
        this._events.set(749, WiredUserVariablesPageMessageEvent);

        // === USERS ===
        this._events.set(1879, ApproveNameMessageEvent);
        // AS3: header corrected 3909 -> 2050. The earlier note here claimed this shape (a single
        // int "result") matched no AS3 message; it does - TalentTrackController.as:132 registers
        // `new _SafeCls_2618(onChangeEmailResult)`, and _SafeCls_2046.as maps _SafeStr_4546[2050]
        // to _SafeCls_2618 (parser _SafeCls_4028: `result:int`). 3909 is that controller's *other*
        // event, onTalentTrack (_SafeCls_2633, TalentTrackController.as:133), still unported.
        // The unrelated onEmailStatus message (email, isVerified, allowChange) stays at 2343 as
        // EmailStatusResultEvent (see USERS section below).
        this._events.set(2050, ChangeEmailResultEvent);
        this._events.set(1400, HabboGroupBadgesMessageEvent);
        // AS3-verified (vortex-emulator Turbo.Revisions/Revision20260701/Headers.cs:1014,
        // "GuildMembershipsMessageComposer = 3994 ... onGuildMemberships @ HabboCatalog"):
        // matches the real consumer confirmed by reading HabboCatalog.as directly.
        this._events.set(3994, GuildMembershipsMessageEvent);
        this._events.set(2847, HabboGroupDetailsMessageEvent);
        this._events.set(12, GroupDetailsChangedMessageEvent);
        // AS3: header corrected 2087 -> 1948 - HabboGroupsManager.as:199 registers
        // `new _SafeCls_2104(onGroupDeactivated)` and _SafeCls_2046.as maps _SafeStr_4546[1948] to
        // _SafeCls_2104 (parser: `groupId:int` only). 2087 is onMembershipRequested
        // (_SafeCls_2076, HabboGroupsManager.as:203 - parser adds a `requester` block), unported.
        this._events.set(1948, HabboGroupDeactivatedMessageEvent);
        this._events.set(3356, HabboGroupJoinFailedMessageEvent);
        // Group creation / edit. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as lines 1761/1192/1352/1219/1681) and
        // corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (GuildCreationInfoMessageComposer = 973, GuildEditorDataMessageComposer = 1132,
        // GuildCreatedMessageComposer = 2138).
        this._events.set(973, GuildCreationInfoMessageEvent);
        this._events.set(1288, GuildEditInfoMessageEvent);
        this._events.set(1132, GuildEditorDataMessageEvent);
        this._events.set(2138, GuildCreatedMessageEvent);
        this._events.set(496, GuildEditFailedMessageEvent);
        // Kick/leave step two: how much furni the target still has in the HQ. Header read
        // from WIN63's own registry (habbo/communication/_SafeCls_2046.as line 1241,
        // _SafeStr_4546[1402] = _SafeCls_2145) and corroborated by vortex-emulator
        // Vortex.Revisions/Revision20260701/Headers.cs (GuildMemberFurniCountInHQMessageComposer = 1402).
        this._events.set(1402, GuildMemberFurniCountInHQMessageEvent);
        // The personal word filter's two replies. Registering them here is what lets
        // WordFilterSettingsView's own addHabboConnectionMessageEvent() resolve a header:
        // MessageRegistry maps an event INSTANCE to an id through this class table, and
        // warns "Unknown message event class" for anything missing from it. Headers read
        // from WIN63's own registry (_SafeStr_4546[2231]/[3622]); the emulator names both
        // differently and implements neither.
        // The navigator's remaining replies. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as, _SafeStr_4546[2051]/[2902]/[1172]/[735]/[1122]/[3208]/[3715])
        // and corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // for all but 1172, which has no constant there at all - hence the derived name on
        // RoomMuteAllMessageEvent.
        // 2051 (FlatAccessible) is registered above, with the room/session events.
        // 2902 is `Game2GameStartedMessageEvent`, registered with the other snow-war events
        // below. It used to be a second port of the same AS3 class (`_SafeCls_3582`) under the
        // emulator's name, in `incoming/navigator/`, with a parser of its own and no subscriber
        // — and while that duplicate held the id, the snow-war handler's own event class would
        // have been rejected by MessageRegistry as unknown. Both files were removed.
        // The spam-wall post-it pair. Headers read from WIN63's own registry
        // (_SafeStr_4546[2816] and _composers[2684]) and corroborated by vortex-emulator
        // (RequestSpamWallPostItMessageComposer = 2816, AddSpamWallPostItMessageEvent = 2684).
        this._events.set(2816, RequestSpamWallPostItMessageEvent);
        this._events.set(1172, RoomMuteAllMessageEvent);
        this._events.set(735, NoOwnedRoomsAlertMessageEvent);
        this._events.set(1122, NoSuchFlatMessageEvent);
        this._events.set(3208, RoomFilterSettingsMessageEvent);
        this._events.set(3715, RoomSettingsErrorMessageEvent);
        this._events.set(2231, GetCustomFilterResultMessageEvent);
        this._events.set(3622, ModifyCustomFilterResultMessageEvent);
        // The members window's five replies. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as, _SafeStr_4546[403]/[3477]/[1735]/[595]/[2087])
        // and corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (GuildMembersMessageComposer = 403, GuildMembershipUpdatedMessageComposer = 3477,
        // GuildMemberMgmtFailedMessageComposer = 1735, GuildMembershipRejectedMessageComposer = 595,
        // GroupMembershipRequestedMessageComposer = 2087).
        this._events.set(403, GuildMembersMessageEvent);
        this._events.set(3477, GuildMembershipUpdatedMessageEvent);
        this._events.set(1735, GuildMemberMgmtFailedMessageEvent);
        this._events.set(595, GuildMembershipRejectedMessageEvent);
        this._events.set(2087, GroupMembershipRequestedMessageEvent);
        this._events.set(1292, HabboUserBadgesMessageEvent);
        this._events.set(3874, HandItemReceivedMessageEvent);
        this._events.set(1554, InClientLinkMessageEvent);
        this._events.set(1918, ExtendedProfileMessageEvent);
        this._events.set(3369, ExtendedProfileChangedMessageEvent);
        this._events.set(3360, RelationshipStatusInfoEvent);
        this._events.set(3887, ScrSendKickbackInfoMessageEvent);
        // AS3: header corrected 1948 -> 1097 (_SafeCls_2180, onClubStatus,
        // com/sulake/habbo/inventory/_SafeCls_1951.as:462, parser _SafeCls_1956 - exact
        // field-for-field match with this TS parser). Header 1948 there is really
        // onGroupDeactivated (_SafeCls_2104, com/sulake/habbo/groups/HabboGroupsManager.as:199),
        // an unrelated, unported message.
        this._events.set(1097, ScrSendUserInfoEvent);
        this._events.set(2343, EmailStatusResultEvent);
        this._events.set(253, IgnoreResultMessageEvent);
        this._events.set(191, IgnoredUsersMessageEvent);
        this._events.set(505, BlockListMessageEvent);
        this._events.set(1825, BlockUserUpdateMessageEvent);
        this._events.set(1259, FavoriteMembershipUpdateMessageEvent);

        // === HELP (name change) ===
        this._events.set(2319, UserNameChangedMessageEvent);
        this._events.set(1621, ChangeUserNameResultMessageEvent);

        // === ONBOARDING (new user flow) ===
        // ID from WIN63's registry (`_SafeStr_4546[3624] = _SafeCls_3056`), corroborated by the
        // emulator as SelectInitialRoomComposer. Answers RoomPicker's starter-room pick.
        this._events.set(3624, SelectInitialRoomMessageEvent);
        // The name-check answer, `_SafeStr_4546[382] = _SafeCls_3600`. Without it the onboarding
        // name dialog spins its wait indicator forever — the reply arrives and is dropped.
        this._events.set(382, CheckUserNameResultMessageEvent);

        // === LANDING VIEW ELEMENTS ===
        // Three more that were subscribed and never routed. Each id is resolved through the
        // *element* that registers it, which is how they were told apart: WIN63 names them
        // `_SafeCls_4528` ("click_submittedroom"), `_SafeCls_4534` (the countdown) and
        // `_SafeCls_4537` ("click_requestbadge_"), and two of the three answer a handler
        // called `onInfo`, so the handler name alone could not have separated them.
        //
        // win63_version lists these at 1685/1557/2295 — all three stale. Its registry is a
        // different build and is never the authority.
        this._events.set(1148, IsUserPartOfCompetitionMessageEvent);
        this._events.set(3620, SecondsUntilMessageEvent);
        this._events.set(2121, IsBadgeRequestFulfilledEvent);

        // === MODERATION TOOLS ===
        // The whole incoming set: ported, subscribed by `ModerationMessageHandler`, and in
        // no header table, so the mod tools received nothing at all. Each id is the WIN63
        // registry entry for the class that handler registers, with the readable name from
        // win63_version, which spells the same handler identically.
        this._events.set(2557, BanInfoMessageEvent);
        // The reply to GetMyCfhReportStatus (1834), which the client already sent and then had
        // nothing registered to read. WIN63 registry: _SafeStr_4546[3809] = _SafeCls_1752, the
        // class HabboHelp.as:485 subscribes to.
        this._events.set(3809, MyCfhReportStatusMessageEvent);
        this._events.set(757, ModeratorInitMessageEvent);
        this._events.set(1898, ModeratorToolPreferencesMessageEvent);
        this._events.set(2589, ModeratorUserInfoMessageEvent);
        this._events.set(251, ModeratorRoomInfoMessageEvent);
        this._events.set(2960, ModeratorActionResultMessageEvent);
        this._events.set(3585, IssueInfoMessageEvent);
        this._events.set(122, IssueDeletedMessageEvent);
        this._events.set(940, IssuePickFailedMessageEvent);
        this._events.set(3880, CfhChatlogMessageEvent);
        this._events.set(2886, RoomChatlogMessageEvent);
        this._events.set(3732, UserChatlogMessageEvent);
        this._events.set(497, RoomVisitsMessageEvent);
        this._events.set(543, UserClassificationMessageEvent);

        // Three more the audit found unwired. Their ids come from the AS3 registry's *incoming*
        // table (`_SafeStr_4546`, not `_composers`) — grepping the wrong map is what made them
        // look absent at first.
        this._events.set(1746, SanctionStatusMessageEvent);
        // 2518, not 3222: `_SafeStr_4546[2518] = _SafeCls_2772`, whose parser `_SafeCls_4396`
        // is the one with `get prizes()`. 3222 belongs to CompetitionEntrySubmitResultMessageEvent
        // (`_SafeCls_2536` → `_SafeCls_3313`, the goalId/goalCode/result parser).
        this._events.set(2518, CompetitionEntryMessageEvent);
        this._events.set(3547, EpicPopupMessageEvent);
        this._events.set(1634, CfhSanctionMessageEvent);

        // === HELP / GUIDE / CALL FOR HELP ===
        // Twenty-four answers that were ported, parsed and — for twenty of them —
        // subscribed, but were **in no header table at all**, so the dispatcher had
        // nothing to route the packet to and the whole guide/CFH system received
        // nothing. Each id is the WIN63 registry entry for the class `habbo/help`
        // registers against that handler; the readable class name comes from
        // win63_version, which spells the same handler identically.
        this._events.set(421, CallForHelpDisabledNotifyMessageEvent);
        this._events.set(2807, CallForHelpReplyMessageEvent);
        this._events.set(2631, CallForHelpResultMessageEvent);
        this._events.set(2987, CallForHelpPendingCallsMessageEvent);
        this._events.set(2440, CallForHelpPendingCallsDeletedMessageEvent);
        this._events.set(1762, CfhTopicsInitMessageEvent);
        this._events.set(3943, IssueCloseNotificationMessageEvent);
        this._events.set(286, ChatReviewSessionStartedMessageEvent);
        this._events.set(508, ChatReviewSessionResultsMessageEvent);
        this._events.set(645, ChatReviewSessionDetachedMessageEvent);
        this._events.set(734, ChatReviewSessionOfferedToGuideMessageEvent);
        this._events.set(1881, ChatReviewSessionVotingStatusMessageEvent);
        this._events.set(1923, GuideOnDutyStatusMessageEvent);
        this._events.set(3725, GuideReportingStatusMessageEvent);
        this._events.set(3274, GuideSessionAttachedMessageEvent);
        this._events.set(2755, GuideSessionDetachedMessageEvent);
        this._events.set(776, GuideSessionInvitedToGuideRoomMessageEvent);
        this._events.set(485, GuideSessionMessageMessageEvent);
        this._events.set(3656, GuideSessionPartnerIsTypingMessageEvent);
        this._events.set(2022, GuideSessionRequesterRoomMessageEvent);
        this._events.set(1167, GuideTicketCreationResultMessageEvent);
        this._events.set(667, GuideTicketResolutionMessageEvent);
        this._events.set(3999, QuizDataMessageEvent);
        this._events.set(548, QuizResultsMessageEvent);
        // The two NUX dialog notices. IDs from WIN63's registry (`_SafeStr_4546[752] =
        // _SafeCls_3189`, `_SafeStr_4546[3307] = _SafeCls_2677`), corroborated by the emulator as
        // NewUserExperienceNotCompleteComposer / NewUserExperienceGiftOfferComposer. Both are
        // handled by HabboNuxDialogs; 752 carries no payload.
        this._events.set(752, NewUserExperienceNotCompleteEvent);
        this._events.set(3307, NewUserExperienceGiftOfferEvent);

        // === ROOM WIDGETS ===
        // The furniture-refusal / failed-respect notice, `_events[169] = _SafeCls_3982`,
        // corroborated by the emulator as CustomUserNotificationMessageComposer. Two handlers read
        // it: CustomUserNotificationWidgetHandler opens the dialog, AvatarInfoWidgetHandler refunds
        // the respect on codes 4-5.
        this._events.set(169, CustomUserNotificationMessageEvent);
        // The rentable-space answers, `_events[2800]/[2158]/[3117]`, all three corroborated by the
        // emulator (RentableSpaceStatus/RentOk/RentFailed MessageComposer).
        this._events.set(2800, RentableSpaceStatusMessageEvent);
        this._events.set(2158, RentableSpaceRentOkMessageEvent);
        this._events.set(3117, RentableSpaceRentFailedMessageEvent);

        // === PHONE NUMBER (SMS identity verification) ===
        // IDs from WIN63's registry (`_events[2833]/[2845]/[712]`). The emulator corroborates
        // 2845 and 712 (TryPhoneNumberResultMessageComposer / TryVerificationCodeResultMessageComposer)
        // but has no constant at all for 2833, so that one rests on the client registry alone.
        // All three are handled by HabboPhoneNumber, and 2833 is what starts the whole flow.
        this._events.set(2833, PhoneCollectionStateMessageEvent);
        this._events.set(2845, TryPhoneNumberResultMessageEvent);
        this._events.set(712, TryVerificationCodeResultMessageEvent);

        // === HELP (FAQ) ===
        // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/HabboMessages.as
        // (name recovered via sources/PRODUCTION-201601012205-226667486/OriginalClassNames.txt; obfuscated in primary dump
        // as _SafeStr_4546[2913] = _SafeCls_3480, sources/WIN63-202607011411-782849652/src/unknowns/
        // _SafePkg_1843/_SafeCls_3480.as, whose parser is the real, non-obfuscated
        // com/sulake/habbo/communication/messages/parser/help/_SafeCls_4068.as - exact field match:
        // questionId/answerText - vs. sources/PRODUCTION-201601012205-226667486's FaqTextMessageParser). Response to
        // GetFaqTextMessageComposer(questionId), not yet ported.
        this._events.set(2913, FaqTextMessageEvent);

        // === GUIDE SESSIONS (room-side markers) ===
        // Headers from the WIN63 registry: _SafeStr_4546[3649] = _SafeCls_3061 (started),
        // [2126] = _SafeCls_2956 (ended), [2377] = _SafeCls_3662 (error). RoomMessageHandler
        // subscribes to all three to paint the guide/requester marker on the two avatars.
        this._events.set(3649, GuideSessionStartedMessageEvent);
        this._events.set(2126, GuideSessionEndedMessageEvent);
        this._events.set(2377, GuideSessionErrorMessageEvent);

        // === PREFERENCES ===
        this._events.set(724, AccountPreferencesEvent);

        // === DISCORD ===
        // `_SafeStr_4546[2767] = _SafeCls_2938` in WIN63's registry. The emulator implements the
        // round-trip for real (`DiscordPreferencesHandlers.cs`, backed by `PlayerAccountPreferences`)
        // — it answers both 2883 and 2304 with this event.
        this._events.set(2767, DiscordPreferencesMessageEvent);

        // === PERK ===
        this._events.set(1535, PerkAllowancesMessageEvent);

        // === NFT ===
        this._events.set(2996, UserNftChatStylesMessageEvent);
        this._events.set(3774, UserPurchasableChatStylesMessageEvent);
        this._events.set(3971, UserPurchasableChatStyleChangedMessageEvent);
        this._events.set(3159, NftEmeraldConvertResultMessageEvent);

        // === CAMPAIGN ===
        this._events.set(2503, BadgeLeaderboardMessageEvent);
        this._events.set(1641, SeasonalCalendarDailyOfferMessageEvent);

        // Treasure hunt. Ids from the WIN63 registry, joined to the class each one maps to via
        // the notification manager's own subscriptions (_SafeCls_1951.as:118, 132, 147).
        this._events.set(377, TreasureHuntUpdateMessageEvent);
        this._events.set(3790, TreasureHuntFailMessageEvent);
        this._events.set(3257, TreasureHuntFirstWinnerMessageEvent);

        // === YOUTUBE DISPLAY FURNI (incoming) ===
        this._events.set(1227, YoutubeDisplayVideoMessageEvent);
        this._events.set(807, YoutubeDisplayPlaylistsMessageEvent);
        this._events.set(2958, YoutubeControlVideoMessageEvent);

        // === CRAFTING (incoming) ===
        // Four ids from WIN63's registry, corroborated by the emulator's Headers.cs. The
        // emulator's crafting handlers are empty stubs today, so nothing answers yet.
        this._events.set(3155, CraftableProductsMessageEvent);
        this._events.set(425, CraftingRecipeMessageEvent);
        this._events.set(2999, CraftingResultMessageEvent);
        this._events.set(3282, CraftingRecipesAvailableMessageEvent);
        this._events.set(3794, RewardTracksMessageEvent);
        this._events.set(522, RewardTrackClaimResultMessageEvent);
        this._events.set(58, RewardTrackPremiumPurchaseResultMessageEvent);
        this._events.set(2017, RewardTrackProgressMessageEvent);
        this._events.set(1028, CampaignCalendarDataMessageEvent);
        this._events.set(2164, CampaignCalendarDoorOpenedMessageEvent);

        // === SNOW WAR (habbo/game) ===
        // The 32 replies `SnowWarIncomingMessages` subscribes to. Every id is WIN63's own registry
        // (`_SafeStr_4546[...]` in _SafeCls_2046.as); the emulator corroborates about half and has
        // no constant for the rest, which is why the class names come from win63_version's readable
        // filenames rather than from Headers.cs. Two more the handler needs — `RoomEntryInfo` (2914)
        // and `ScrSendUserInfo` (1097) — are registered elsewhere and shared.
        // The emulator's snow-war handlers are empty stubs, so none of these arrive yet.
        this._events.set(3251, Game2GameDirectoryStatusMessageEvent);
        this._events.set(683, Game2AccountGameStatusMessageEvent);
        this._events.set(413, Game2GameCreatedMessageEvent);
        this._events.set(3539, Game2GameLongDataMessageEvent);
        this._events.set(2902, Game2GameStartedMessageEvent);
        this._events.set(3352, Game2UserJoinedGameMessageEvent);
        this._events.set(606, Game2UserLeftGameMessageEvent);
        this._events.set(1145, Game2UserBlockedMessageEvent);
        this._events.set(2756, Game2InArenaQueueMessageEvent);
        this._events.set(2008, Game2StartCounterMessageEvent);
        this._events.set(2747, Game2StopCounterMessageEvent);
        this._events.set(2334, Game2GameCancelledMessageEvent);
        this._events.set(493, Game2JoiningGameFailedMessageEvent);
        this._events.set(1140, Game2StartingGameFailedMessageEvent);

        this._events.set(620, Game2EnterArenaMessageEvent);
        this._events.set(2668, Game2EnterArenaFailedMessageEvent);
        this._events.set(3354, Game2ArenaEnteredMessageEvent);
        this._events.set(755, Game2StageLoadMessageEvent);
        this._events.set(2571, Game2StageStillLoadingMessageEvent);
        this._events.set(3295, Game2StageStartingMessageEvent);
        this._events.set(3695, Game2StageRunningMessageEvent);
        this._events.set(2182, Game2StageEndingMessageEvent);
        this._events.set(3446, Game2GameEndingMessageEvent);
        this._events.set(1376, Game2GameRejoinMessageEvent);
        this._events.set(1301, Game2PlayerExitedGameArenaMessageEvent);
        this._events.set(1742, Game2PlayerRematchesMessageEvent);
        this._events.set(2010, Game2GameChatFromPlayerMessageEvent);

        this._events.set(1739, Game2FullGameStatusMessageEvent);
        this._events.set(498, Game2GameStatusMessageEvent);

        this._events.set(2272, Game2FriendsLeaderboardEvent);
        this._events.set(733, Game2TotalLeaderboardEvent);
        this._events.set(2417, Game2TotalGroupLeaderboardEvent);
        this._events.set(273, Game2WeeklyLeaderboardEvent);
        this._events.set(2802, Game2WeeklyFriendsLeaderboardEvent);
        this._events.set(2876, Game2WeeklyGroupLeaderboardEvent);

        // === ADVERTISEMENT ===
        this._events.set(3898, InterstitialMessageEvent);
        // AS3: header corrected 2247 -> 2396 (_SafeCls_3880, onRoomAdError,
        // com/sulake/habbo/navigator/inroom/RoomEventViewCtrl.as:172, parser _SafeCls_2955 -
        // errorCode, filteredText - exact match with this TS parser). Header 2247 there is
        // really onCollectibles (_SafeCls_3840, com/sulake/habbo/inventory/_SafeCls_1951.as:166),
        // an unrelated, unported message.
        this._events.set(2396, RoomAdErrorMessageEvent);

        // === TRACKING ===
        this._events.set(188, LatencyPingResponseMessageEvent);

        // === FRIENDLIST / MESSENGER ===
        this._events.set(1590, MessengerInitEvent);
        this._events.set(468, NewConsoleMessageEvent);
        this._events.set(933, ConsoleMessageHistoryEvent);
        this._events.set(3501, InstantMessageErrorEvent);
        this._events.set(358, MessengerErrorEvent);
        this._events.set(3194, RoomInviteEvent);
        // Registered by `HabboMessenger` only behind `client.minimail.embed.enabled`, as
        // AS3 does; the registry entries themselves are unconditional.
        // Friendship furni. The emulator sends none of these three yet — it only has the
        // client->server side (3318) — so the confirm panel stays shut against it.
        this._events.set(2716, FriendFurniStartConfirmationEvent);
        this._events.set(3451, FriendFurniOtherLockConfirmedEvent);
        this._events.set(267, FriendFurniCancelLockEvent);
        // Guild-customised furni: the bubble's own data, answering composer 826.
        this._events.set(3220, GuildFurniContextMenuInfoMessageEvent);
        this._events.set(3884, MiniMailNewMessageEvent);
        this._events.set(74, MiniMailUnreadCountEvent);
        this._events.set(2641, FriendListFragmentMessageEvent);
        this._events.set(3611, FriendListUpdateMessageEvent);
        this._events.set(1120, FriendRequestsMessageEvent);
        this._events.set(1860, NewFriendRequestMessageEvent);
        // 3707, not 3407. WIN63's registry has `_SafeStr_4546[3707] = _SafeCls_2256`, and
        // `HabboFriendList` subscribes exactly that class as `onAcceptFriendResult`; 3407 is
        // `SelfDonationResultMessageEvent`, whose name survived obfuscation and is unambiguous. The
        // two were registered on the same id, so the later `set` silently unregistered the earlier —
        // self-donation results never fired. **vortex-emulator disagrees** (`AcceptFriendResultComposer
        // = 3407`); the registry wins, and the emulator needs the same correction.
        this._events.set(3707, AcceptFriendResultMessageEvent);
        this._events.set(2094, FriendNotificationMessageEvent);
        this._events.set(2642, FindFriendsProcessResultMessageEvent);
        this._events.set(2637, HabboSearchResultMessageEvent);
        this._events.set(240, FollowFriendFailedMessageEvent);
        this._events.set(3065, RoomInviteErrorMessageEvent);

        // === NOTIFICATIONS (extended) ===
        this._events.set(1330, MOTDNotificationEvent);
        this._events.set(334, HabboBroadcastMessageEvent);
        // AS3: sources/win63_version/habbo/communication/class_1881.as — name_1[2806] = ElementPointerMessageEvent
        this._events.set(1807, ElementPointerMessageEvent);
        this._events.set(3885, ModeratorMessageEvent);
        this._events.set(2243, NotificationDialogMessageEvent);
        this._events.set(2686, RespectNotificationMessageEvent);
        this._events.set(1702, PetLevelNotificationEvent);
        this._events.set(639, HabboAchievementNotificationMessageEvent);
        // AS3: header corrected 1737 -> 184 - was swapped with MaintenanceStatusMessageEvent
        // (see AVAILABILITY section above). sources/WIN63-202607011411-782849652
        // unknowns/_SafePkg_2018/_SafeCls_2483.as (minutesUntilClosing only) matches this
        // parser exactly and is registered at 184, not 1737.
        this._events.set(184, InfoHotelClosingMessageEvent);
        this._events.set(3058, InfoHotelClosedMessageEvent);
        this._events.set(3621, UserBannedMessageEvent);
        this._events.set(2619, ModeratorCautionEvent);
        this._events.set(1023, ClubGiftNotificationEvent);
        this._events.set(3345, RestoreClientMessageEvent);
        // AS3: header corrected 70 -> 3913 - was swapped with NoobnessLevelMessageEvent.
        // _SafeCls_2046.as: _SafeStr_4546[3913] = _SafeCls_1995, parser _SafeCls_2001 (`status:int`
        // plus the two status constants); 70 carries `noobnessLevel`.
        this._events.set(3913, AccountSafetyLockStatusChangeMessageEvent);
        this._events.set(1692, PetReceivedMessageEvent);
        this._events.set(31, PetRespectFailedEvent);
        this._events.set(1784, PetRespectNotificationEvent);
        this._events.set(1842, ClubGiftSelectedEvent);
        // AS3: header corrected 160 -> 1740 (_SafeCls_3168, onRoomMessagesNotification,
        // com/sulake/habbo/notifications/_SafeCls_1951.as:112, parser _SafeCls_3790 -
        // roomId, roomName, messageCount - exact field-for-field match, including default
        // flush values, with this TS parser). Header 160 there is really
        // onGuestRoomSearchResult (_SafeCls_3509, com/sulake/habbo/navigator/_SafeCls_1951.as),
        // an unrelated, unported message.
        this._events.set(1740, RoomMessageNotificationMessageEvent);

        // === POLL / WORD QUIZ ===
        this._events.set(579, PollOfferEvent);
        this._events.set(969, PollErrorEvent);
        this._events.set(1297, PollContentsEvent);
        this._events.set(2157, QuestionEvent);
        this._events.set(1659, QuestionAnsweredEvent);
        this._events.set(2108, QuestionFinishedEvent);

        // === ERROR ===
        this._events.set(1107, ErrorReportEvent);

        // === LANDING VIEW ===
        this._events.set(1082, PromoArticlesMessageEvent);
        this._events.set(2524, CommunityVoteReceivedEvent);

        // === COMPETITION ===
        this._events.set(3076, CurrentTimingCodeMessageEvent);
        // RoomCompetitionController registers both of these, but neither had a header, so
        // MessageRegistry dropped them with "Unknown message event class" and the room-competition
        // voting/submit replies never arrived. IDs read from WIN63's registry
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as,
        // matching each event to the parser it constructs (member names are not obfuscated):
        //   2617 -> _SafeCls_2434, parser _SafeCls_4063 (goalId/goalCode/resultCode/votesRemaining)
        //   3222 -> _SafeCls_2536, parser _SafeCls_3313 (goalId/goalCode/requiredFurnis/missingFurnis)
        this._events.set(2617, CompetitionVotingInfoMessageEvent);
        this._events.set(3222, CompetitionEntrySubmitResultMessageEvent);

        // === CATALOG (bonus rare) ===
        this._events.set(3573, BonusRareInfoMessageEvent);
        // The reply to GetProductOfferComposer (1692). Header from the primary registry
        // (`_events[1911] = _SafeCls_2066`); the emulator already answers on it.
        this._events.set(1911, ProductOfferMessageEvent);
        // Two payload-less purchase signals. Headers from the primary registry
        // (`_events[533]`/`_events[2735]`); the emulator sends both from its gift-purchase handler.
        this._events.set(533, LimitedEditionSoldOutMessageEvent);
        this._events.set(2735, GiftReceiverNotFoundMessageEvent);
        // The room list a room ad can point at (`_events[3787]`), read by RoomAdsCatalogWidget.
        this._events.set(3787, RoomAdPurchaseInfoMessageEvent);
        // The targeted-offer pair (`_events[2155]`/`_events[2013]`), read by OfferController.
        // The two collectible currencies. Both were being sent by the emulator's wallet module
        // and its NFT handlers with nothing on this side listening.
        // The mute countdown, read by RoomChatHandler.
        // The limited-edition raffle: entered (the dialog starts its "raffling..." animation) and
        // then drawn. Both read by HabboCatalog.
        this._events.set(2901, LtdRaffleEnteredMessageEvent);
        // The snow-war token bundles, read by HabboCatalog.
        this._events.set(904, SnowWarGameTokensMessageEvent);
        this._events.set(3526, LtdRaffleResultMessageEvent);
        this._events.set(2129, RemainingMutePeriodMessageEvent);
        // The badge-point limits table, read by HabboInventory into the localization manager.
        this._events.set(3510, BadgePointLimitsMessageEvent);
        // The post-it sheet count, read by HabboInventory into the furni model.
        this._events.set(2145, PostItPlacedMessageEvent);
        this._events.set(3727, SilverBalanceMessageEvent);
        this._events.set(583, EmeraldBalanceMessageEvent);
        // The collectibles (NFT) inventory and its trade-side twin, both handled by
        // HabboInventory: 2247 -> onCollectibles, 850 -> onTradeNfts
        // (habbo/inventory/_SafeCls_1951.as:166 and :204). Header 2247 is the one the RoomAdError
        // correction above named as "unported"; it is ported now.
        this._events.set(2247, NftAssetsMessageEvent);
        this._events.set(850, TradeNftAssetsMessageEvent);
        // The collectibles CATALOG tab (habbo/catalog/collectibles). Every header below is from
        // WIN63's own registry; the emulator agrees on 14 of the 18 and has no entry for the rest.
        this._events.set(448, NftStorePurchaseMessageEvent);
        this._events.set(2357, NftTransferAssetsResultMessageEvent);
        this._events.set(1091, CollectibleMintingEnabledMessageEvent);
        this._events.set(1857, NftCollectionsScoreMessageEvent);
        this._events.set(3601, NftClaimResultMessageEvent);
        this._events.set(1741, CollectibleWalletAddressesMessageEvent);
        this._events.set(233, NftRewardItemClaimResultMessageEvent);
        this._events.set(1770, CollectibleMintTokenCountMessageEvent);
        this._events.set(19, CollectibleMintableItemResultMessageEvent);
        this._events.set(3332, RedeemNftLootBoxResultMessageEvent);
        this._events.set(3700, NftTransferFeeMessageEvent);
        this._events.set(3498, NftBonusItemClaimResultMessageEvent);
        this._events.set(3942, NftCollectionsMessageEvent);
        this._events.set(108, NftClaimsMessageEvent);
        this._events.set(3272, NftStoreOffersMessageEvent);
        this._events.set(2462, CollectibleMintTokenOffersMessageEvent);
        this._events.set(1902, CollectableMintableItemTypesMessageEvent);
        this._events.set(3164, RedeemNftLootBoxStateMessageEvent);
        this._events.set(2155, TargetedOfferMessageEvent);
        this._events.set(2013, TargetedOfferNotFoundMessageEvent);
        this._events.set(1073, BundleDiscountRulesetMessageEvent);
        this._events.set(1369, GiftWrappingConfigurationEvent);
        this._events.set(773, CatalogPublishedMessageEvent);
        this._events.set(1084, LimitedOfferAppearingNextMessageEvent);
        this._events.set(3389, CatalogPageWithEarliestExpiryMessageEvent);
        this._events.set(3422, ClubGiftInfoEvent);
        this._events.set(3666, CatalogIndexMessageEvent);
        this._events.set(1660, CatalogPageMessageEvent);
        this._events.set(1570, PurchaseOKMessageEvent);
        this._events.set(1029, PurchaseErrorMessageEvent);
        this._events.set(2493, PurchaseNotAllowedMessageEvent);
        this._events.set(1038, NotEnoughBalanceMessageEvent);
        this._events.set(1771, VoucherRedeemOkMessageEvent);
        this._events.set(133, VoucherRedeemErrorMessageEvent);
        this._events.set(419, HabboClubOffersMessageEvent);
        this._events.set(3689, HabboClubExtendOfferMessageEvent);
        this._events.set(2442, MarketPlaceOffersEvent);
        this._events.set(88, MarketPlaceOwnOffersEvent);
        this._events.set(2249, MarketplaceBuyOfferResultEvent);
        this._events.set(2448, MarketplaceCancelOfferResultEvent);
        this._events.set(921, MarketplaceCancelAllOffersResultEvent);
        this._events.set(1760, MarketplaceClearOwnHistoryResultEvent);
        this._events.set(1397, MarketplaceConfigurationEvent);
        this._events.set(2821, MarketplaceItemStatsEvent);
        this._events.set(789, MarketplaceCanMakeOfferResultEvent);
        this._events.set(2954, MarketplaceMakeOfferResultEvent);
        this._events.set(1127, RentOrBuyoutOfferMessageEvent);
        // The three recycler pushes were on invented ids (2166→1919, 3617→281, 3367→3783), taken
        // from the emulator, which had them wrong too — none of 1919/281/3783 has an entry in
        // WIN63's registry at all, and each of 2166/3617/3367 has exactly one. Parser shapes
        // confirm the mapping: _SafeCls_2004 (recyclerStatus, recyclerTimeoutSeconds),
        // _SafeCls_2078 (recyclerFinishedStatus, prizeId), _SafeCls_2027 (prizeLevels).
        // The emulator's constants were corrected in the same pass.
        this._events.set(2166, RecyclerStatusMessageEvent);
        this._events.set(3617, RecyclerFinishedMessageEvent);
        this._events.set(3367, RecyclerPrizesMessageEvent);
        this._events.set(3350, SellablePetPalettesMessageEvent);

        // === QUEST ===
        this._events.set(363, CommunityGoalHallOfFameMessageEvent);
        this._events.set(1417, QuestDailyMessageEvent);
        this._events.set(283, CommunityGoalProgressMessageEvent);
        this._events.set(1003, ConcurrentUsersGoalProgressMessageEvent);
        // AS3: WIN63-202607011411 registry _SafeCls_2046.as — _SafeStr_4546[id] = event class
        // (the obfuscated class each maps to is named by its QuestMessageHandler callback).
        this._events.set(54, QuestMessageEvent);            // _SafeCls_2832 → onQuest
        this._events.set(3398, QuestsMessageEvent);         // _SafeCls_3591 → onQuests
        this._events.set(1390, SeasonalQuestsMessageEvent); // _SafeCls_2664 → onSeasonalQuests
        this._events.set(1272, QuestCompletedMessageEvent); // _SafeCls_3714 → onQuestCompleted
        this._events.set(1425, QuestCancelledMessageEvent); // _SafeCls_3681 → onQuestCancelled
        // 1584 is WIN63-only: neither `win63_version` nor the emulator's Headers.cs carries it, so
        // both the event and its payload-less parser are named from their single subscriber,
        // `CitizenshipVipQuestsPromoExtension.onCitizenshipQuestPromoEnabled()`.
        this._events.set(1584, CitizenshipQuestPromoEnabledMessageEvent); // _SafeCls_3105

        // === DAILY TASKS ===
        // The three events habbo/quest/dailytasks/DailyTasksController.as registers in its
        // constructor, with the ids from WIN63's own registry _SafeCls_2046.as:
        //   1824 -> _SafeCls_3179 → onActiveDailyTasks  (line 1295)
        //   2506 -> _SafeCls_2859 → onTasksAdded        (line 1414)
        //   1065 -> _SafeCls_3449 → onTaskUpdated       (line 1177)
        // The emulator disagreed on two of the three (2507 and 1762), and 1762 is really
        // CfhTopics — it declares that header twice. WIN63's registry wins; the emulator's
        // Headers.cs has been corrected to match.
        // DailyTasksController subscribes to all three (2026-08-12), views included. Before that
        // commit every one of these three was received and dropped: registered here, with nothing
        // at the other end.
        this._events.set(1824, DailyTasksActiveListMessageEvent);
        this._events.set(2506, DailyTasksTasksAddedMessageEvent);
        this._events.set(1065, DailyTasksTaskUpdateMessageEvent);

        // === ACHIEVEMENTS ===
        this._events.set(1969, AchievementsMessageEvent);   // _SafeCls_2687 → onAchievements
        this._events.set(3981, AchievementMessageEvent);    // _SafeCls_2786 → onAchievement
        // AchievementsResolutionController's three messages, registered by QuestMessageHandler but
        // headerless until now. Same method as the competition pair above — each event class was
        // identified through the parser it constructs, then looked up in _SafeCls_2046.as:
        //   3143 -> _SafeCls_3258, parser _SafeCls_3983 (stuffId/achievements/endTime)
        //   1844 -> _SafeCls_3814, parser _SafeCls_3262 (stuffId/achievementId/requiredLevelBadgeCode)
        //   1166 -> _SafeCls_3558, parser _SafeCls_3054 (stuffCode/badgeCode)
        this._events.set(3143, AchievementResolutionsMessageEvent);
        this._events.set(1844, AchievementResolutionProgressMessageEvent);
        this._events.set(1166, AchievementResolutionCompletedMessageEvent);

        // === ROOM SETTINGS ===
        this._events.set(791, RoomSettingsDataEvent);
        this._events.set(726, FlatControllersEvent);
        this._events.set(845, BannedUsersFromRoomEvent);
        this._events.set(1359, FlatControllerAddedEvent);
        this._events.set(3335, FlatControllerRemovedEvent);
        // AS3: header corrected 2631 -> 1783 (_SafeCls_2385, onRoomSettingsSaved,
        // com/sulake/habbo/navigator/_SafeCls_1951.as / _SafeCls_2208.as). Header 2631
        // there is really onCallForHelpResult (_SafeCls_3126,
        // com/sulake/habbo/help/CallForHelpManager.as:81), an unrelated, unported message.
        // Header 1783 was freed by ExpressionMessageEvent moving to 1036 (see ROOM ACTION).
        this._events.set(1783, RoomSettingsSavedEvent);
        this._events.set(879, RoomSettingsSaveErrorEvent);
        this._events.set(2089, UserUnbannedFromRoomEvent);
        this._events.set(2944, ShowEnforceRoomCategoryDialogEvent);

        // === VORTEX-SPECIFIC (no AS3 backing) ===
        // The furni editor's incoming half. These headers exist in no Habbo client; they are matched
        // by hand against the emulator's Vortex.Revisions/Revision20260701/Headers.cs. The 8000-8999
        // band was chosen because it is empty in both registries. Never renumber one side alone.
        this._events.set(8002, VortexFurniEditorDataMessageEvent);
        this._events.set(8004, VortexFurniEditorRightsMessageEvent);
        this._events.set(8006, VortexFurniDefinitionMessageEvent);

        // Fishing takes 8100-8199 of the same band, leaving the furni editor room to grow. Even for
        // events, odd for composers, so a request and its reply sit next to each other.
        // 8102 is re-sendable: the server broadcasts it again whenever an operator reloads the
        // tables, and FishingDefinitions.apply() drops a push whose version is not newer.
        // See docs/vortex-original/fishing.md §3 and §6.
        this._events.set(8102, VortexFishingDefinitionsMessageEvent);
        this._events.set(8104, VortexFishingPlayerStateMessageEvent);
        this._events.set(8106, VortexFishSightedMessageEvent);
        this._events.set(8108, VortexFishingCatchResultMessageEvent);
        // 8110 was CatchFailed. Origins has no per-cast miss: catches keep coming until the spot
        // runs dry, so the id now carries the end of the session instead.
        this._events.set(8110, VortexFishingSpotDepletedMessageEvent);
        this._events.set(8112, VortexFishingDerbyStandingMessageEvent);
        this._events.set(8114, VortexFishingErrorMessageEvent);
        this._events.set(8116, VortexFishingRecordsMessageEvent);
        this._events.set(8118, VortexHookHavocStartedMessageEvent);
        this._events.set(8120, VortexHookHavocResultMessageEvent);
    }

    /**
     * Register outgoing message composers (Client -> Server)
     */
    private registerComposers(): void
    {
        // === WIRED ===
        // ID read directly from WIN63's registry
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // (`_composers[1953] = _SafeCls_2111`, the WiredClickUser composer).
        this._composers.set(1953, WiredClickUserMessageComposer);
        // OpenMessageComposer: WIN63 registry _SafeCls_2046.as `_composers[1869] = _SafeCls_3966`.
        this._composers.set(1869, OpenMessageComposer);
        // `_composers[3608] = _SafeCls_3004`. Its own class doc used to say it had no header
        // because the command travels in the payload; the registry disagrees. The emulator has no
        // handler for it, so this only makes the developer action addressable, not answered.
        this._composers.set(3608, WiredDebugCommandMessageComposer);
        // Wired save composers (ids from WIN63 registry _SafeCls_2046.as):
        //   _composers[3953]=_SafeCls_2484 (trigger), [2197]=_SafeCls_2689 (action),
        //   [767]=_SafeCls_3197 (condition), [1138]=_SafeCls_3344 (addon),
        //   [2475]=_SafeCls_3053 (variable), [510]=UpdateSelectorMessageComposer (selector),
        //   [2790]=_SafeCls_3118 (applySnapshot).
        this._composers.set(3953, UpdateTriggerMessageComposer);
        this._composers.set(2197, UpdateActionMessageComposer);
        this._composers.set(767, UpdateConditionMessageComposer);
        this._composers.set(1138, UpdateAddonMessageComposer);
        this._composers.set(2475, UpdateVariableMessageComposer);
        this._composers.set(510, UpdateSelectorMessageComposer);
        this._composers.set(2790, ApplySnapshotMessageComposer);
        // Wired web API — AIR-1.0.31 only; see the events block for how these two ids were
        // settled. 2819 is free as a composer AND as an event in the WIN63 registry (2818 is
        // WiredTradeAccept), in this file and in the emulator, so AIR's own number is kept.
        this._composers.set(2819, GenerateWiredApiKeyMessageComposer);
        this._composers.set(984, GetAllVariablesMessageComposer);
        this._composers.set(797, GetAllVariablesDiffMessageComposer);
        this._composers.set(3124, SetWiredMenuPreferencesComposer);
        this._composers.set(706, RequestWiredRoomLogsComposer);
        this._composers.set(2553, SaveWiredMenuSettingsComposer);
        this._composers.set(501, WiredUpdateRoomComposer);
        this._composers.set(1862, RequestWiredMenuSettingsComposer);
        this._composers.set(427, RequestWiredRoomStatsComposer);
        this._composers.set(452, RequestWiredErrorLogsComposer);
        this._composers.set(2386, ClearWiredErrorLogsComposer);
        // Wired trading, same source and same caveat as the four events above.
        this._composers.set(3111, WiredTradeUpdateItemsComposer);
        // Wired chests: request a page of transaction logs, and lock/unlock chests (WIN63 registry:
        // 2016 -> _SafeCls_2406, 1630 -> _SafeCls_3599). Both names derived, same reason as 2910.
        // Sandbox self-donation (WIN63 registry: 1119 -> _SafeCls_3986). Name derived; the tool
        // refuses to send it outside a sandbox environment.
        this._composers.set(1119, SelfDonationComposer);
        // Wired contracts: save one, and ask for its contents (WIN63 registry: 1908, 1594).
        // === WIRED CHESTS ===
        // Eleven client->server messages. 3407 is also a server->client header here
        // (SelfDonationResultMessageEvent), and 3611 is FriendListUpdateComposer in the emulator's
        // server->client table; independent tables, so neither is a collision.
        this._composers.set(806, OpenWiredChestComposer);
        this._composers.set(2935, CloseWiredChestComposer);
        this._composers.set(3514, StartWiredChestDepositComposer);
        this._composers.set(3611, WithdrawAllWiredChestContentsComposer);
        this._composers.set(2843, WithdrawWiredChestCoinsComposer);
        this._composers.set(3407, UpgradeWiredChestComposer);
        this._composers.set(1999, RequestWiredChestLogsComposer);
        this._composers.set(2907, SetWiredChestOptionsComposer);
        this._composers.set(2905, SetWiredChestNotificationSettingsComposer);
        this._composers.set(873, WithdrawChestItemsByTypeComposer);
        this._composers.set(3830, SaveWiredChestSettingsComposer);
        this._composers.set(1908, SaveWiredContractComposer);
        this._composers.set(1594, RequestWiredContractContentsComposer);
        this._composers.set(2016, RequestWiredTransactionLogsComposer);
        this._composers.set(475, RequestWiredTransactionDetailsComposer);
        this._composers.set(1630, SetWiredChestsLockedComposer);
        this._composers.set(2818, WiredTradeAcceptComposer);
        this._composers.set(2646, WiredTradeCancelComposer);
        // Collectibles. Headers from WIN63's registry; the emulator defines neither.
        this._composers.set(1646, RequestNftAssetsComposer);
        this._composers.set(2481, AddNftToTradeComposer);
        this._composers.set(521, RemoveNftFromTradeComposer);
        // Snow-war token bundles: ask, then buy.
        this._composers.set(2447, GetSnowWarGameTokensOfferComposer);
        this._composers.set(3243, PurchaseSnowWarGameTokensOfferComposer);
        this._composers.set(1749, NftTransferAssetsComposer);
        this._composers.set(3638, GetMintTokenOffersComposer);
        this._composers.set(1614, GetCollectorScoreComposer);
        this._composers.set(2898, ClaimNftClaimsComposer);
        this._composers.set(1809, GetNftStoreOffersComposer);
        this._composers.set(261, GetCollectibleWalletAddressesComposer);
        this._composers.set(708, GetNftCollectionsComposer);
        this._composers.set(3856, GetCollectibleMintableItemTypesComposer);
        this._composers.set(813, GetCollectibleMintingEnabledComposer);
        this._composers.set(3153, GetNftClaimsComposer);
        this._composers.set(2815, MintItemComposer);
        this._composers.set(1166, NftCollectiblesClaimRewardItemComposer);
        this._composers.set(3484, GetNftTransferFeeComposer);
        this._composers.set(1977, NftCollectiblesClaimBonusItemComposer);
        this._composers.set(1554, GetCollectibleMintTokensComposer);
        // The monitor tab's "wf15" report is the same AS3 class as the wired dialog's developer
        // action (`_SafeCls_3004`), already registered at 3608 above as
        // WiredDebugCommandMessageComposer. Registering it twice under two derived names left the
        // first one headerless.
        // Overview tab (WIN63 registry _SafeCls_2046.as): 113 -> _SafeCls_3916 (request variable
        // holders), 2221 -> _SafeCls_3265 (open variable management).
        this._composers.set(113, RequestVariableHoldersComposer);
        this._composers.set(2221, RequestVariableManagementComposer);
        // Inspection tab (WIN63 registry _SafeCls_2046.as): 3466 -> _SafeCls_3097 (request variables for
        // object), 689 -> _SafeCls_3855 (set/create/delete variable).
        this._composers.set(3466, RequestWiredVariablesForObjectComposer);
        this._composers.set(689, UpdateWiredVariableComposer);
        // Variable-management overview: open the detail view for one holder (WIN63 registry
        // _SafeCls_2046.as: 3777 -> _SafeCls_2724).
        //
        // The class name is this port's own. `win63_version` names the file
        // `WiredGetUserPermanentVariablesComposer.as`, so the real name IS recoverable and the
        // header comment claiming it is "fully obfuscated in AS3" is wrong; left unrenamed to
        // avoid churning its call sites, corrected at the declaration.
        this._composers.set(3777, RequestVariableManagementDetailComposer);
        // Its write-side sibling: set / create / delete one permanent variable, all three through
        // the same message with a `mode` discriminator.
        this._composers.set(625, WiredSetUserPermanentVariableComposer);

        // === HANDSHAKE ===
        this._composers.set(4000, ClientHelloMessageComposer);
        this._composers.set(2022, InitDiffieHandshakeMessageComposer);
        this._composers.set(2526, CompleteDiffieHandshakeMessageComposer);
        this._composers.set(3584, VersionCheckMessageComposer);
        // Header from _SafeCls_2052 (via sendConnectionParameters()). The shape warning that used
        // to sit here was wrong: AS3's constructor takes only the ticket, but its body pushes
        // *two* values — the ticket then getTimer() — so the wire really does carry both. The TS
        // composer takes the timer as an optional second parameter defaulting to the same call,
        // which produces an identical payload.
        this._composers.set(882, SSOTicketMessageComposer);
        this._composers.set(2309, UniqueIDMessageComposer);

        // === SESSION ===
        this._composers.set(362, PongMessageComposer);
        this._composers.set(2864, DisconnectMessageComposer);
        this._composers.set(756, InfoRetrieveMessageComposer);

        // === TRACKING ===
        this._composers.set(3809, EventLogMessageComposer);

        // === NAVIGATOR ===
        this._composers.set(2603, GetGuestRoomMessageComposer);
        // Raid protection — AIR-1.0.31 only; see the incoming block above for how the ids were
        // assigned. Unlike the three events, both composer ids are free in this revision and in
        // the emulator, so AIR's own numbers are kept verbatim.
        this._composers.set(206, GetRaidProtectionSettingsMessageComposer);
        this._composers.set(2687, SaveRaidProtectionSettingsMessageComposer);
        this._composers.set(354, CreateFlatMessageComposer);
        this._composers.set(3169, AddFavouriteRoomMessageComposer);
        this._composers.set(1654, DeleteFavouriteRoomMessageComposer);
        this._composers.set(3487, RoomTextSearchMessageComposer);
        this._composers.set(2857, PopularRoomsSearchMessageComposer);
        this._composers.set(361, MyRoomsSearchMessageComposer);
        this._composers.set(2334, MyFavouriteRoomsSearchMessageComposer);
        this._composers.set(3942, GetOfficialRoomsMessageComposer);
        this._composers.set(2617, CanCreateRoomMessageComposer);
        this._composers.set(235, GetUserFlatCatsMessageComposer);
        this._composers.set(3018, GetUserEventCatsMessageComposer);
        this._composers.set(1817, UpdateHomeRoomMessageComposer);
        // Onboarding: the starter-room pick sends a room TYPE, and the figure save sends
        // gender-then-figure. IDs from WIN63's registry (`_composers[3267] = _SafeCls_3967`,
        // `_composers[3339] = _SafeCls_3021`), corroborated by the emulator.
        this._composers.set(3267, SelectInitialRoomMessageComposer);
        this._composers.set(3339, UpdateFigureDataMessageComposer);
        // The NUX gift claim, `_composers[3490] = _SafeCls_2936`, corroborated by the emulator as
        // NewUserExperienceGetGiftsMessageEvent. Its length prefix counts integers, not items —
        // see the composer.
        this._composers.set(3490, NewUserExperienceGetGiftsMessageComposer);
        // Name check/claim. The onboarding dialog claims on 879 (`_composers[879] = _SafeCls_3401`);
        // the paid rename in habbo/help/namechange uses 1703 and a different composer class, so the
        // two are not interchangeable. The check is shared: `_composers[413] = _SafeCls_3569`.
        this._composers.set(413, CheckUserNameMessageComposer);
        this._composers.set(2210, GetWardrobeMessageComposer);
        this._composers.set(116, SaveWardrobeOutfitMessageComposer);
        this._composers.set(3834, GetHotLooksMessageComposer);
        this._composers.set(2203, GetUserNftWardrobeMessageComposer);
        this._composers.set(3428, SaveUserNftWardrobeMessageComposer);
        this._composers.set(3521, GetSelectedNftWardrobeOutfitMessageComposer);
        // 879 is ClaimNewUserName in WIN63's registry (`_composers[879] = _SafeCls_3401`), a
        // different message that happens to take the same single string — so the wrong id here
        // would have been accepted and handled as a *claim* rather than a change. ChangeUserName
        // is 1703; the emulator agrees. Latent until now: nothing constructs this composer yet.
        this._composers.set(1703, ChangeUserNameMessageComposer);
        this._composers.set(407, RateFlatMessageComposer);
        this._composers.set(2985, ToggleStaffPickMessageComposer);
        this._composers.set(3214, GetPopularRoomTagsMessageComposer);
        this._composers.set(1903, MyFriendsRoomsSearchMessageComposer);
        this._composers.set(3427, ForwardToSomeRoomMessageComposer);
        this._composers.set(584, ConvertGlobalRoomIdMessageComposer);
        this._composers.set(3551, ForwardToARandomPromotedRoomMessageComposer);
        this._composers.set(3402, CancelEventMessageComposer);
        this._composers.set(2117, EditEventMessageComposer);
        this._composers.set(1307, CompetitionRoomsSearchMessageComposer);
        this._composers.set(2135, RoomsWithHighestScoreSearchMessageComposer);
        this._composers.set(2517, RoomsWhereMyFriendsAreSearchMessageComposer);
        this._composers.set(632, MyRoomHistorySearchMessageComposer);
        this._composers.set(2174, MyFrequentRoomHistorySearchMessageComposer);
        this._composers.set(1091, MyRoomRightsSearchMessageComposer);
        this._composers.set(2224, MyGuildBasesSearchMessageComposer);
        // AS3-verified (vortex-emulator Turbo.Revisions/Revision20260701/Headers.cs:184/181):
        // "GetGuildMembershipsMessageEvent = 3918 ... registerGuildSelectorWidget()" and
        // "GetGuildCreationInfoMessageEvent = 2989 ... BuyGuildWidget::onButtonClicked()".
        this._composers.set(3918, GetGuildMembershipsMessageComposer);
        this._composers.set(2989, GetGuildCreationInfoMessageComposer);
        // Group creation / edit. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as lines 968/759/749/1058/975/1034) and
        // corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (GetGuildEditorDataMessageEvent = 3398, CreateGuildMessageEvent = 207).
        this._composers.set(3398, GetGuildEditorDataMessageComposer);
        this._composers.set(207, CreateGuildMessageComposer);
        this._composers.set(874, GetGuildEditInfoMessageComposer);
        this._composers.set(2009, UpdateGuildIdentityMessageComposer);
        this._composers.set(3882, UpdateGuildBadgeMessageComposer);
        this._composers.set(3421, UpdateGuildColorsMessageComposer);
        this._composers.set(3716, UpdateGuildSettingsMessageComposer);
        // Guild deletion and the two-step kick/leave. Headers read from WIN63's own
        // registry (habbo/communication/_SafeCls_2046.as lines 855/1138/926) and
        // corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (DeactivateGuildMessageEvent = 2725, GetMemberGuildItemCountMessageEvent = 781,
        // KickMemberMessageEvent = 3156 — whose comment records that 781 was once
        // mistaken for the kick itself).
        this._composers.set(2725, DeactivateGuildMessageComposer);
        this._composers.set(781, GetMemberGuildItemCountMessageComposer);
        this._composers.set(3156, KickMemberMessageComposer);
        // Everything the members window can send. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as lines for _SafeCls_2908/2681/2867/3648/3129/3772/2425)
        // and corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs.
        this._composers.set(1337, GetGuildMembersMessageComposer);
        this._composers.set(3200, RejectMembershipRequestMessageComposer);
        this._composers.set(2580, UnblockGroupMemberMessageComposer);
        this._composers.set(3999, RemoveAdminRightsFromMemberMessageComposer);
        this._composers.set(2152, AddAdminRightsToMemberMessageComposer);
        this._composers.set(3505, ApproveMembershipRequestMessageComposer);
        this._composers.set(1621, ApproveAllMembershipRequestsMessageComposer);
        this._composers.set(184, MyRecommendedRoomsMessageComposer);
        this._composers.set(3744, GuildBaseSearchMessageComposer);
        this._composers.set(3101, SetRoomSessionTagsMessageComposer);
        this._composers.set(1971, RoomAdSearchMessageComposer);
        this._composers.set(260, RemoveOwnRoomRightsRoomMessageComposer);
        this._composers.set(759, RoomAdEventTabAdClickedComposer);
        this._composers.set(3729, RoomAdEventTabViewedComposer);

        // === NEW NAVIGATOR ===
        this._composers.set(1590, NewNavigatorInitComposer);
        this._composers.set(81, NewNavigatorSearchComposer);
        this._composers.set(1188, NavigatorAddSavedSearchComposer);
        this._composers.set(2444, NavigatorDeleteSavedSearchComposer);
        this._composers.set(3920, NavigatorAddCollapsedCategoryMessageComposer);
        this._composers.set(3449, NavigatorRemoveCollapsedCategoryMessageComposer);
        this._composers.set(3681, NavigatorSetSearchCodeViewModeMessageComposer);

        // === ROOM SESSION ===
        this._composers.set(3234, OpenFlatConnectionMessageComposer);
        this._composers.set(2704, ChangeQueueMessageComposer);
        // AS3: sources/win63_version/habbo/communication/class_1881.as:628 — was incorrectly
        // registered as 2722 (that ID actually belongs to the unported groupforums
        // PostMessageMessageComposer, per class_1881.as:747).
        this._composers.set(3061, QuitMessageComposer);
        this._composers.set(2045, RoomNetworkOpenConnectionMessageComposer);

        // === ROOM AVATAR ===
        this._composers.set(2659, ChangeMottoMessageComposer);
        this._composers.set(2912, AvatarExpressionMessageComposer);
        this._composers.set(211, SignMessageComposer);
        this._composers.set(48, DanceMessageComposer);
        this._composers.set(2508, LookToMessageComposer);
        this._composers.set(3181, ChangePostureMessageComposer);

        // === ROOM ACTION ===
        this._composers.set(3361, AmbassadorAlertMessageComposer);
        this._composers.set(2748, KickUserMessageComposer);
        this._composers.set(120, BanUserWithDurationMessageComposer);
        this._composers.set(2339, MuteUserMessageComposer);
        this._composers.set(32, MuteAllInRoomComposer);
        this._composers.set(498, UnmuteUserMessageComposer);
        this._composers.set(3946, UpdateRoomCategoryAndTradeSettingsComposer);
        this._composers.set(1622, UpdateRoomFilterMessageComposer);
        this._composers.set(790, GetCustomRoomFilterMessageComposer);
        this._composers.set(373, AssignRightsMessageComposer);
        this._composers.set(3444, RemoveRightsMessageComposer);
        this._composers.set(963, LetUserInMessageComposer);

        // === ROOM RESPECT ===
        this._composers.set(3770, RespectUserMessageComposer);
        this._composers.set(576, RespectPetMessageComposer);

        // === ROOM FURNITURE ===
        this._composers.set(434, CreditFurniRedeemMessageComposer);
        this._composers.set(2485, PresentOpenMessageComposer);
        // AS3: _SafeCls_1821.as::useObject() — the six ROFCAE_* furniture actions. Headers from
        // WIN63's registry; all but 350 and 3422 are corroborated by vortex-emulator, whose
        // comments cite these same useObject() cases.
        this._composers.set(1673, ThrowDiceMessageComposer);
        this._composers.set(259, DiceOffMessageComposer);
        this._composers.set(3625, SpinWheelOfFortuneMessageComposer);
        this._composers.set(1753, EnterOneWayDoorMessageComposer);
        this._composers.set(3422, ClaimNftRewardBoxMessageComposer);
        // 350 disagrees with the emulator, which listens on 204 — see the composer's own note.
        this._composers.set(350, GetItemDataMessageComposer);
        // AS3: _SafeCls_1821.as::modifyWallItemData() / deleteWallItem()
        this._composers.set(3498, SetItemDataMessageComposer);
        this._composers.set(141, RemoveItemMessageComposer);
        // AS3: BackgroundColorFurniWidget.as::windowProcedure() apply_button
        this._composers.set(1647, SetRoomBackgroundColorDataMessageComposer);
        this._composers.set(1884, OpenPetPackageMessageComposer);
        this._composers.set(3145, RoomDimmerGetPresetsComposer);
        this._composers.set(130, RoomDimmerSavePresetComposer);
        this._composers.set(3894, RoomDimmerChangeStateComposer);
        this._composers.set(1220, UpdateClothingChangeFurnitureComposer);
        this._composers.set(3353, UseFurnitureMessageComposer);
        // AS3: AreaHideFurniWidget.as::updateData() — the area-hide rectangle and its three flags.
        this._composers.set(1954, SetAreaHideDataMessageComposer);
        // AS3: _SafeCls_1821.as::changeRoomObjectState() — the three siblings of UseFurniture
        // above. Floor items split on the isRandom flag (3353 / 1942); wall items take 3590.
        this._composers.set(1942, SetRandomStateMessageComposer);
        // 3590 disagrees with the emulator, which listens on 1540 — see the composer's own note.
        this._composers.set(3590, UseWallItemMessageComposer);
        // AS3: _SafeCls_1821.as::modifyRoomObjectData() "OBJECT_SAVE_STUFF_DATA"
        this._composers.set(246, SetObjectDataMessageComposer);

        // The floor plan editor's three. The two GETs have a real handler waiting on the emulator;
        // UpdateFloorProperties is accepted and dropped there today, so saving is a no-op server-side.
        this._composers.set(3426, GetOccupiedTilesMessageComposer);
        this._composers.set(880, GetRoomEntryTileMessageComposer);
        this._composers.set(2937, UpdateFloorPropertiesMessageComposer);

        // The special-items display's pair: ask, then claim. Its result is 431, already registered.
        this._composers.set(2668, HasClaimedProductComposer);
        this._composers.set(145, ClaimProductComposer);
        // AS3: MysteryTrophyOpenDialogView.as::onMouseClick() "ok"
        this._composers.set(2242, OpenMysteryTrophyMessageComposer);

        // === MYSTERY BOX ===
        // AS3: MysteryBoxOpenDialogView.as::waitWindowProcedure() cancel_button
        this._composers.set(1063, MysteryBoxWaitingCanceledMessageComposer);
        this._composers.set(826, GetGuildFurniContextMenuInfoMessageComposer);
        // Vortex-custom (not in official AS3 dumps): vortex-client commit f3bba54 "feat(rentablespace):
        // add config message, compositors and updated display widget"
        this._composers.set(4600, GetRentableSpaceConfigMessageComposer);
        this._composers.set(4601, ConfigureRentableSpaceMessageComposer);

        // === ROOM PET ===
        // Headers read directly out of WIN63's own outgoing registry,
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // (`_composers[id] = _SafeCls_N`). The composer classes are package-obfuscated, so each was
        // identified from the RoomSession/handler method that sends it — RoomSession.as:507-560,
        // UserDataManager.as:231, InfoStandWidgetHandler.as:460-470/799, PetsModel.as:117/229,
        // habbo/room/_SafeCls_1821.as:2236 — whose names are not obfuscated:
        //
        //   1640 -> _SafeCls_2851 (RemovePetFromFlat, RoomSession::pickUpPet)
        //   1018 -> _SafeCls_2777 (PlacePet, PetsModel::placePet)
        //    432 -> _SafeCls_2560 (MovePet, _SafeCls_1821::sendMoveUserObjectMessage, monsterplant)
        //   3899 -> _SafeCls_2625 (GetPetInfo, UserDataManager::requestPetInfo)
        //   2757 -> _SafeCls_3264 (PetSelected, InfoStandWidgetHandler::handleGetPetInfoMessage)
        //   1996 -> _SafeCls_3238 (MountPet, RoomSession::mountPet/dismountPet)
        //   3713 -> _SafeCls_3089 (TogglePetRidingPermission)
        //   2884 -> _SafeCls_3921 (RemoveSaddleFromPet)
        //   2425 -> _SafeCls_2559 (GetPetCommands)
        //   1210 -> _SafeCls_2914 (HarvestPet)
        //    144 -> _SafeCls_3539 (TogglePetBreedingPermission)
        //   1989 -> _SafeCls_3384 (CompostPlant)
        //   2099 -> _SafeCls_2749 (CustomizePetWithFurni, RoomSession::useProductForPet)
        //   1694 -> _SafeCls_2695 (GiveSupplementToPet)
        //   1922 -> _SafeCls_2980 (BreedPets, AvatarInfoWidget::breedPets/accept/cancel)
        //
        // MovePet used to be registered at 2761 as "Vortex-custom": that is the *secondary* tree's
        // header (win63_version/habbo/communication/class_1881.as:754), a different build. 2761 does
        // not exist in this revision's outgoing registry at all, so every monster-plant move was
        // being sent to nothing. IssuePetCommandMessageComposer (3072) is gone entirely — AS3 has no
        // such message; commands are issued as ordinary chat, "<pet name> <command>", by
        // InfoStandWidgetHandler's "RWPCM_PET_COMMAND" branch.
        this._composers.set(1640, PickUpPetComposer);
        this._composers.set(1018, PlacePetComposer);
        this._composers.set(432, MovePetMessageComposer);
        this._composers.set(3899, GetPetInfoMessageComposer);
        this._composers.set(2757, PetSelectedMessageComposer);
        this._composers.set(1996, MountPetComposer); // Also used for dismount — AS3 sends an explicit `mount` boolean, same message ID for both

        // === RENTABLE BOTS ===
        // AS3: _SafeCls_1821.as::placeObject() category 100 / typeId 4 — the sibling of PlacePet
        // (1018) one branch up. RoomEngine's TODO named 1295 for this; 1295 is the user-move
        // composer. See PlaceBotMessageComposer's own note.
        this._composers.set(2102, PlaceBotMessageComposer);
        // AS3: _SafeCls_1821.as::sendMoveUserObjectMessage() "rentable_bot" branch — the sibling of
        // MovePet (432) above. `_composers[1295] = _SafeCls_2801` in the registry; the Turbo server
        // has bots but no handler at this id. See MoveBotMessageComposer's own note.
        this._composers.set(1295, MoveBotMessageComposer);
        // AS3: _SafeCls_1821.as::modifyRoomObject() "OBJECT_PICKUP_BOT" — takes webID, not objectId.
        this._composers.set(2743, RemoveBotFromFlatMessageComposer);
        // The bot context menu's two senders. Both ids read straight out of WIN63's registry
        // (`_composers[3813] = _SafeCls_2928`, `_composers[2311] = _SafeCls_3415`) and corroborated
        // by vortex-emulator (CommandBotEvent / GetBotCommandConfigurationDataEvent).
        this._composers.set(3813, CommandBotComposer);
        this._composers.set(2311, GetBotCommandConfigurationDataComposer);
        this._composers.set(3713, TogglePetRidingPermissionComposer);
        this._composers.set(2884, RemoveSaddleFromPetComposer);
        this._composers.set(2425, GetPetCommandsComposer);
        this._composers.set(1210, HarvestPetComposer);
        this._composers.set(144, TogglePetBreedingPermissionComposer);
        this._composers.set(1989, CompostPlantComposer);
        this._composers.set(2099, UseProductForPetComposer);
        this._composers.set(1694, GiveSupplementToPetMessageComposer);
        this._composers.set(1922, BreedPetsMessageComposer);
        // Breeding-nest lifecycle, same registry, from AvatarInfoWidget.as:1789/1794:
        //   3367 -> _SafeCls_3504 (CancelPetBreeding)
        //   2872 -> _SafeCls_3418 (ConfirmPetBreeding)
        this._composers.set(3367, CancelPetBreedingComposer);
        this._composers.set(2872, ConfirmPetBreedingComposer);
        // Hand the carried item to a pet, from InfoStandWidgetHandler.as "RWUAM_GIVE_CARRY_ITEM_TO_PET":
        //   1429 -> _SafeCls_2543 (PassCarryItemToPet)
        this._composers.set(1429, PassCarryItemToPetMessageComposer);
        this._composers.set(1101, PassCarryItemMessageComposer);
        this._composers.set(1545, DropCarryItemMessageComposer);

        // === POLL ===
        this._composers.set(743, PollStartComposer);
        this._composers.set(1088, PollRejectComposer);
        this._composers.set(3386, PollAnswerComposer);

        // === NOTIFICATIONS ===
        this._composers.set(3163, GetMOTDMessageComposer);

        // === TRACKING ===
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // registers this composer's real class (_SafeCls_2653, confirmed via LatencyTracker.as's
        // single-int-param usage) at 544, not 1242 - 1242 belongs to
        // ClearOwnMarketplaceHistoryMessageComposer, a different composer in the same registry.
        this._composers.set(544, LatencyPingRequestMessageComposer);
        this._composers.set(1744, LatencyPingReportMessageComposer);
        this._composers.set(481, LagWarningReportMessageComposer);
        this._composers.set(3983, PerformanceLogMessageComposer);

        // === FRIENDLIST ===
        this._composers.set(1515, VisitUserMessageComposer);
        this._composers.set(3357, SendMsgMessageComposer);
        this._composers.set(727, GetMessengerHistoryComposer);
        this._composers.set(886, FollowFriendMessageComposer);
        this._composers.set(3278, MessengerInitMessageComposer);
        // Both headers verified (_SafeCls_3920 / _SafeCls_3339), and both shapes re-checked: AS3
        // builds the id list by mutation (addAcceptedRequest/addDeclinedRequest) where the TS
        // composers take varargs, but getMessageArray() emits the same payload either way —
        // [count, ...ids] for accept, [declineAll, count, ...ids] for decline.
        //
        // One edge case survives: AS3 derives declineAll from an empty id list, so
        // `new DeclineFriendMessageComposer(false)` with no ids sends [false, 0] where the real
        // client would send [true, 0]. No caller does that today.
        this._composers.set(1772, AcceptFriendMessageComposer);
        this._composers.set(2778, DeclineFriendMessageComposer);
        this._composers.set(546, FindNewFriendsMessageComposer);
        this._composers.set(3679, FriendListUpdateMessageComposer);
        this._composers.set(3797, GetFriendRequestsMessageComposer);
        this._composers.set(3219, GetRelationshipStatusInfoMessageComposer);
        this._composers.set(3686, HabboSearchMessageComposer);
        this._composers.set(3005, RemoveFriendMessageComposer);
        this._composers.set(1, RequestFriendMessageComposer);
        this._composers.set(617, SendRoomInviteMessageComposer);
        this._composers.set(1773, SetRelationshipStatusMessageComposer);

        // === USERS ===
        this._composers.set(1211, ApproveNameMessageComposer);
        this._composers.set(3706, ChangeEmailComposer);
        this._composers.set(306, DeselectFavouriteHabboGroupMessageComposer);
        this._composers.set(2306, GetEmailStatusComposer);
        this._composers.set(321, GetExtendedProfileByNameMessageComposer);
        this._composers.set(847, GetExtendedProfileMessageComposer);
        this._composers.set(1683, GetHabboGroupDetailsMessageComposer);

        // === GROUP FORUMS ===
        // Every id read from WIN63's own registry (_SafeCls_2046.as), and every one corroborated
        // by vortex-emulator's MessageEvent constants. The obfuscated classes behind them were
        // identified through GroupForumController, which is unobfuscated in the primary tree and
        // names each one at its call site — the same method the competition composers needed.
        this._composers.set(488, GetForumsListMessageComposer);
        this._composers.set(3592, GetForumStatsMessageComposer);
        this._composers.set(3218, GetThreadMessageComposer);
        this._composers.set(3668, GetThreadsMessageComposer);
        this._composers.set(225, GetMessagesMessageComposer);
        this._composers.set(1076, GetUnreadForumsCountMessageComposer);
        this._composers.set(2811, PostMessageMessageComposer);
        this._composers.set(3206, UpdateThreadMessageComposer);
        this._composers.set(3320, ModerateThreadMessageComposer);
        this._composers.set(3373, ModerateMessageMessageComposer);
        this._composers.set(2793, UpdateForumSettingsMessageComposer);
        this._composers.set(429, UpdateForumReadMarkerMessageComposer);
        // HabboGroupInfoManager has been sending this on every room entry since it was
        // ported, into nothing: the composer existed but was never registered, so every
        // send was dropped and BadgeImageWidget never learned any group's badge code.
        // 3346 is WIN63's own registry (_SafeCls_2046.as:957, _SafeCls_2839), corroborated
        // by vortex-emulator's GetHabboGroupBadgesMessageEvent = 3346. Not win63_version's
        // 2767 - that is an older build - and not the 2317 the composer's docblock claimed,
        // which matches no tree.
        this._composers.set(3346, GetHabboGroupBadgesMessageComposer);
        this._composers.set(1026, GetIgnoredUsersMessageComposer);
        this._composers.set(3726, GetSelectedBadgesMessageComposer);
        this._composers.set(3642, GetUserNftChatStylesMessageComposer);
        // AS3: SessionDataManager.as::initSessionData() sends this immediately after 3642 above.
        this._composers.set(4100, GetDailyTasksComposer);
        // AS3: DailyTasksController.as::claimTask()
        this._composers.set(4101, ClaimDailyTaskComposer);
        // AS3: HabboFreeFlowChat.as::sendChatPreferences()
        this._composers.set(1149, SetChatPreferencesMessageComposer);
        this._composers.set(2070, IgnoreUserMessageComposer);
        this._composers.set(1469, JoinHabboGroupMessageComposer);
        this._composers.set(1111, ScrGetKickbackInfoMessageComposer);
        this._composers.set(1071, ScrGetUserInfoMessageComposer);
        this._composers.set(1887, SelectFavouriteHabboGroupMessageComposer);
        this._composers.set(2512, UnblockUserMessageComposer);
        this._composers.set(483, BlockUserMessageComposer);
        this._composers.set(798, BlockListInitComposer);
        this._composers.set(426, ReplenishRespectMessageComposer);
        this._composers.set(3542, UnignoreUserMessageComposer);

        // === CAMPAIGN ===
        this._composers.set(3643, OpenCampaignCalendarDoorComposer);
        this._composers.set(3863, OpenCampaignCalendarDoorAsStaffComposer);

        // === CAMERA ===
        // Headers read from WIN63's own registry (habbo/communication/_SafeCls_2046.as,
        // _composers[3332]/[1985]/[375]/[753]/[2707]/[3010]) and corroborated by vortex-emulator
        // Vortex.Revisions/Revision20260701/Headers.cs. 3332 is also a *server→client* header
        // there (the loot-box result); the two tables are independent, so that is not a collision.
        this._composers.set(3332, RenderRoomMessageComposer);
        this._composers.set(1985, RenderRoomThumbnailMessageComposer);
        this._composers.set(375, PublishPhotoMessageComposer);
        this._composers.set(753, PurchasePhotoMessageComposer);
        this._composers.set(2707, PhotoCompetitionMessageComposer);
        this._composers.set(3010, RequestCameraConfigurationMessageComposer);

        // === ADVERTISEMENT ===
        // NOTE: GetInterstitialMessageComposer had ID 3698 in win63 source, but that conflicts
        // with OpenPetPackageMessageComposer (also 3698). Removed to avoid collision.
        // GetInterstitialMessageComposer can be re-added with the correct ID if needed.
        this._composers.set(1408, InterstitialShownMessageComposer);

        // === PREFERENCES ===
        this._composers.set(3653, SetUIFlagsMessageComposer);
        // The other-settings checkboxes. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as, _composers[1332]/[3917]/[2056]) and
        // corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (SetIgnoreRoomInvitesMessageEvent = 1332, SetRoomCameraPreferencesMessageEvent = 3917,
        // ResetPhoneNumberStateMessageEvent = 2056).
        // === DISCORD ===
        // `_composers[2883] = _SafeCls_2988` (the request) and `_composers[2304] = _SafeCls_3638`
        // (the write-back) in WIN63's registry. No emulator counterpart yet.
        this._composers.set(2883, GetDiscordPreferencesMessageComposer);
        this._composers.set(2304, UpdateDiscordPreferencesMessageComposer);

        this._composers.set(1332, SetIgnoreRoomInvitesMessageComposer);
        this._composers.set(3917, SetRoomCameraPreferencesMessageComposer);
        this._composers.set(2056, ResetPhoneNumberStateMessageComposer);
        // The answer to the phone-verification offer, `_composers[1983] = _SafeCls_2666`,
        // corroborated as SetPhoneNumberVerificationStatusMessageEvent. Shared by HabboNuxDialogs
        // (statuses 0 and 2) and habbo/phonenumber.
        this._composers.set(1983, SetPhoneNumberVerificationStatusMessageComposer);
        // The two submissions of the SMS flow, `_composers[2890] = _SafeCls_2910` and
        // `_composers[1846] = _SafeCls_2748`, corroborated as TryPhoneNumberMessageEvent /
        // VerifyCodeMessageEvent.
        this._composers.set(2890, TryPhoneNumberMessageComposer);
        this._composers.set(1846, VerifyCodeMessageComposer);
        // The rentable-space requests, `_composers[2626]/[3165]/[61]`, corroborated by the emulator
        // as RentableSpaceStatus/Rent/CancelRent MessageEvent.
        this._composers.set(2626, RentableSpaceStatusMessageComposer);
        this._composers.set(3165, RentableSpaceRentMessageComposer);
        this._composers.set(61, RentableSpaceCancelRentMessageComposer);
        // The personal word filter. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as, _composers[801]/[2656]/[2209]).
        // vortex-emulator's Headers.cs names all three differently, with no verification
        // comment and no handler or parser behind them, so it corroborates nothing here.
        this._composers.set(2684, AddSpamWallPostItMessageComposer);
        this._composers.set(801, GetCustomFilterMessageComposer);
        this._composers.set(2656, AddToCustomFilterMessageComposer);
        this._composers.set(2209, RemoveFromCustomFilterMessageComposer);
        this._composers.set(1276, SetNewNavigatorWindowPreferencesMessageComposer);
        this._composers.set(2634, SetChatStylePreferenceComposer);

        // === SOUND ===
        this._composers.set(541, GetSoundSettingsComposer);
        // Mannequin (widget/furniture/mannequin) — 606 is also a *server*-side id for
        // Game2UserLeftGame in the emulator, which is a different direction and so not a clash.
        this._composers.set(3318, FriendFurniConfirmLockMessageComposer);
        this._composers.set(3045, SetCustomStackingHeightMessageComposer);
        this._composers.set(3637, RedeemPurchasableClothingMessageComposer);
        // 3315 has no emulator counterpart — the two nudge-height arrows send into the void.
        this._composers.set(3315, MoveFurnitureToAdjacentHeightMessageComposer);
        this._composers.set(2301, SetMannequinFigureMessageComposer);
        this._composers.set(606, SetMannequinNameMessageComposer);
        this._composers.set(3662, SetSoundSettingsComposer);

        // === ROOM ENGINE ===
        this._composers.set(1901, GetFurnitureAliasesMessageComposer);
        // GetHeightMapMessageComposer removed 2026-08-27. The earlier TODO here was right that
        // 1935 is in no registry table and that nothing constructs it — but it stopped one step
        // short: the class is in **no AS3 tree at all**. It came from
        // `sources/NITRO/packages/nitro-shared/src/packets/outgoing/Room/Engine/GetHeightMapComposer.ts`,
        // which is not one of this project's three sources. In the 2026 protocol the server sends
        // the heightmap unprompted; there is nothing to request.
        this._composers.set(2364, MoveAvatarMessageComposer);
        // Header from sources/WIN63-202607011411-782849652 (_SafeCls_2135 via HabboCatalog.as's
        // placement send). The constructor now carries AS3's full six arguments — id, category,
        // wallLocation, x, y, rotation — and the category picks between the floor and wall shapes.
        this._composers.set(1974, PlaceObjectMessageComposer);
        // AS3: _SafeCls_1821.as::placeObject() — the "furniture_is_stickie" branch, checked
        // before the generic PlaceObject fallback above.
        this._composers.set(1122, PlacePostItMessageComposer);
        // AS3: _SafeCls_2046.as::_composers[2999] = _SafeCls_2682 — the wall-item move, sent by
        // modifyRoomObject()'s "OBJECT_MOVE_TO" case when the moved object is category 20.
        // Corroborated by vortex-emulator's MoveWallItemMessageEvent = 2999.
        this._composers.set(2999, MoveWallItemMessageComposer);
        this._composers.set(1482, MoveObjectMessageComposer);
        // AS3: ClickFurniMessageComposer header 443 (win63 registry); sent on a plain furni click.
        this._composers.set(443, ClickFurniMessageComposer);
        // AS3: _SafeCls_2046.as::_composers[3244] = _SafeCls_2770 — the avatar-category branch of
        // the same clickRoomObject(); corroborated by vortex-emulator's ClickCharacterEvent = 3244.
        this._composers.set(3244, ClickCharacterComposer);
        // AS3: header corrected 443 -> 1919 (sources/WIN63-202607011411-782849652
        // unknowns/_SafePkg_2136/_SafeCls_3412.as, real construction confirmed at
        // com/sulake/habbo/room/_SafeCls_1821.as:2329 and _SafeCls_1984.as:316).
        // Header 443 there is the unrelated, readable ClickFurniMessageComposer.
        this._composers.set(1919, PickupObjectMessageComposer);

        // === ROOM CHAT ===
        this._composers.set(3034, ChatMessageComposer);
        this._composers.set(1763, ShoutMessageComposer);
        this._composers.set(1697, WhisperMessageComposer);
        this._composers.set(2106, StartTypingMessageComposer);
        this._composers.set(2718, CancelTypingMessageComposer);
        this._composers.set(3083, Game2GameChatMessageComposer);

        // === INVENTORY ===
        this._composers.set(41, RequestFurniInventoryComposer);
        // The out-of-room variant of 41. `FurniModel.requestInitialization()` picks between the two
        // on `_isInRoom`; nothing registered this one, so opening the inventory from the hotel view
        // sent the in-room request.
        this._composers.set(3862, RequestFurniInventoryWhenNotInRoomComposer);
        // Wallpaper/floor/landscape are applied, never placed: FurniModel and HabboCatalog
        // both route those three categories here instead of to the object mover.
        this._composers.set(2292, RequestRoomPropertySetComposer);
        // The request behind BadgePointLimits (3510). Nothing sent it, so the levelled-badge
        // progress table the localization manager reads stayed empty.
        this._composers.set(2944, GetBadgePointLimitsComposer);
        // Acknowledges the new-additions badge. Without it the server re-flags new additions
        // on every login, however many times the catalog was opened.
        this._composers.set(3835, MarkCatalogNewAdditionsPageOpenedComposer);
        this._composers.set(540, GetCreditsInfoComposer);
        // AS3: WIN63's registry, `_composers[2069]`/`[394]` — two of the few composer classes that
        // kept their real names through obfuscation. `HabboInventory.initComponent()` sends both at
        // boot, right after 540; neither existed in this port, so the two balances were never asked
        // for. Corroborated by vortex-emulator, whose handlers for both are real.
        this._composers.set(2069, GetNftCreditsMessageComposer);
        this._composers.set(394, GetSilverMessageComposer);
        this._composers.set(770, GetBadgesComposer);
        // AS3: WIN63's registry, `_composers[3159] = _SafeCls_3448`. The emulator's only 3159
        // is an unrelated server->client composer, a different table, so not a conflict.
        this._composers.set(3159, GetBadgeInformationComposer);
        this._composers.set(2764, SetActivatedBadgesComposer);
        // `_composers[2236]` in WIN63's registry, resolved through `_SafeCls_4537` — the landing
        // view's badge-request element, identified by the unobfuscated `requestCode` it compares
        // against. win63_version says 2545, which this build gives to something else.
        this._composers.set(2236, GetIsBadgeRequestFulfilledComposer);
        this._composers.set(3891, GetPetInventoryComposer);
        this._composers.set(3148, GetBotInventoryComposer);
        this._composers.set(3022, AvatarEffectActivatedComposer);
        this._composers.set(2362, AvatarEffectSelectedComposer);
        // Header 699 (_SafeCls_3363, constructed at UnseenItemTracker.as:209). The extra-fields
        // warning that used to sit here is closed — ResetUnseenItemsComposer now sends [category]
        // and nothing else, matching AS3.
        this._composers.set(699, ResetUnseenItemsComposer);
        this._composers.set(3771, ResetUnseenItemIdsComposer);
        this._composers.set(3258, RequestABadgeComposer);

        // === LANDING VIEW ===
        this._composers.set(3152, GetPromoArticlesComposer);
        this._composers.set(2055, CommunityGoalVoteMessageComposer);

        // === CATALOG (bonus rare) ===
        this._composers.set(251, GetBonusRareInfoMessageComposer);
        this._composers.set(3682, GetLimitedOfferAppearingNextComposer);
        this._composers.set(287, GetCatalogPageWithEarliestExpiryComposer);
        this._composers.set(472, GetClubGiftMessageComposer);
        this._composers.set(317, GetBundleDiscountRulesetComposer);
        this._composers.set(940, GetGiftWrappingConfigurationComposer);
        this._composers.set(2232, GetCatalogIndexComposer);
        // The discounted club-extension offer, asked for by the two toolbar promo bars. Neither
        // could send it before: both were shells with no window and therefore no button to click.
        this._composers.set(2931, GetHabboClubExtendOfferMessageComposer);
        this._composers.set(2093, GetCatalogPageComposer);
        this._composers.set(1692, GetProductOfferComposer);
        this._composers.set(1706, PurchaseFromCatalogComposer);
        // Builders-club direct placement (_composers[3849] = _SafeCls_1996,
        // _composers[2740] = _SafeCls_1748 in the WIN63 registry).
        this._composers.set(3849, PlaceObjectFromCatalogComposer);
        this._composers.set(2740, PlaceWallItemFromCatalogComposer);
        this._composers.set(1739, BuildersClubQueryFurniCountMessageComposer);
        this._composers.set(2779, RedeemVoucherMessageComposer);
        this._composers.set(667, GetClubOffersMessageComposer);
        this._composers.set(2441, PurchaseVipMembershipExtensionComposer);
        this._composers.set(3561, PurchaseBasicMembershipExtensionComposer);
        this._composers.set(2087, SelectClubGiftComposer);
        this._composers.set(3342, GetSellablePetPalettesComposer);
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        this._composers.set(3196, PurchaseNftOfferMessageComposer);
        this._composers.set(67, PurchaseMintTokensMessageComposer);
        this._composers.set(2564, CheckGiftableMessageComposer);
        this._composers.set(366, GetRoomAdsPurchaseInfoMessageComposer);
        // The room-ad purchase pair (`_composers[2928]`/`_composers[3607]` in the WIN63 registry).
        // 3607 is analytics only - the emulator's handler for it is a deliberate no-op.
        // Targeted offers. 848 is from WIN63's registry and the emulator does NOT match it - it
        // listens on a 9004 placeholder its own comment admits is unresolved, so the request
        // currently reaches nothing. The registry is the authority; the emulator needs the fix.
        this._composers.set(848, GetNextTargetedOfferComposer);
        this._composers.set(2874, SetTargetedOfferStateComposer);
        this._composers.set(2497, PurchaseTargetedOfferComposer);
        this._composers.set(3046, ShopTargetedOfferViewedComposer);
        this._composers.set(2928, PurchaseRoomAdMessageComposer);
        this._composers.set(3607, RoomAdPurchaseInitiatedMessageComposer);
        this._composers.set(2909, PurchaseProductAsGiftMessageComposer);
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        this._composers.set(780, GetMarketplaceConfigurationMessageComposer);
        this._composers.set(2731, GetMarketplaceOffersMessageComposer);
        this._composers.set(2086, GetMarketplaceOwnOffersMessageComposer);
        this._composers.set(831, CancelAllMarketplaceOffersMessageComposer);
        this._composers.set(1242, ClearOwnMarketplaceHistoryMessageComposer);
        this._composers.set(252, BuyMarketplaceOfferMessageComposer);
        this._composers.set(3546, RedeemMarketplaceOfferCreditsMessageComposer);
        this._composers.set(2096, CancelMarketplaceOfferMessageComposer);
        this._composers.set(1552, GetMarketplaceItemStatsComposer);
        this._composers.set(1493, GetMarketplaceCanMakeOfferMessageComposer);
        this._composers.set(3419, BuyMarketplaceTokensMessageComposer);
        this._composers.set(3695, MakeOfferMessageComposer);

        // AS3: the rent extend/buyout quote round trip — request, then one of two confirmations
        // depending on whether the item stands in a room or sits in the inventory strip.
        this._composers.set(1583, GetRentOrBuyoutOfferMessageComposer);
        this._composers.set(1427, ExtendRentOrBuyoutFurniMessageComposer);
        this._composers.set(1029, ExtendRentOrBuyoutStripItemMessageComposer);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // Every moderation composer was ported and none was registered, so a moderator could
        // receive the whole tool (all 14 incoming events are wired) and send nothing — each
        // button reached a composer the connection had no header for. Ids are the primary
        // registry's, and each constructor arity was checked against the class it maps to.
        this._composers.set(1631, CloseIssueDefaultActionMessageComposer);
        this._composers.set(3986, CloseIssuesMessageComposer);
        this._composers.set(2375, DefaultSanctionMessageComposer);
        this._composers.set(1580, GetCfhChatlogMessageComposer);
        this._composers.set(1504, GetModeratorRoomInfoMessageComposer);
        this._composers.set(3230, GetModeratorUserInfoMessageComposer);
        this._composers.set(1346, GetRoomChatlogMessageComposer);
        this._composers.set(903, GetRoomVisitsMessageComposer);
        this._composers.set(1686, GetUserChatlogMessageComposer);
        this._composers.set(2183, ModAlertMessageComposer);
        this._composers.set(2507, ModBanMessageComposer);
        this._composers.set(1401, ModKickMessageComposer);
        this._composers.set(2579, ModMessageMessageComposer);
        this._composers.set(2862, ModMuteMessageComposer);
        this._composers.set(1415, ModToolPreferencesComposer);
        this._composers.set(2476, ModToolSanctionComposer);
        this._composers.set(3495, ModTradingLockMessageComposer);
        this._composers.set(2939, ModerateRoomMessageComposer);
        // Moved header: 396 in the 2023 build (win63_version's own registry), 2735 here. The
        // reference server has no handler for it — its 2735 is a *server→client* gift message,
        // a separate namespace — so this one sends into the void until the emulator implements
        // it. Registered anyway: the client registry is the authority on what the client sends.
        this._composers.set(2735, ModeratorActionMessageComposer);
        this._composers.set(628, PeerUsersClassificationMessageComposer);
        this._composers.set(3400, PickIssuesMessageComposer);
        this._composers.set(3977, ReleaseIssuesMessageComposer);
        this._composers.set(157, RoomUsersClassificationMessageComposer);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // The player half of moderation — reporting and the guide/helper system — had the same
        // defect as the tool itself: 20 composers ported, 2 registered. Only the ones whose
        // constructor shape still matches the primary tree are registered here; see the TODO
        // below for the seven that do not.
        this._composers.set(201, CallForHelpFromSelfieMessageComposer);
        this._composers.set(3423, DeletePendingCallsForHelpMessageComposer);
        // Bully report, sent by the guardians-gated bully_report form. Header from the primary
        // registry (`_composers[293] = _SafeCls_3410`); the emulator defines no handler for it.
        this._composers.set(293, ReportBullyMessageComposer);
        // Quiz pair, both from the primary registry and both defined by the emulator.
        this._composers.set(1982, GetQuizQuestionsComposer);
        this._composers.set(1387, PostQuizAnswersComposer);
        this._composers.set(2455, GetGuideReportingStatusMessageComposer);
        this._composers.set(92, GetPendingCallsForHelpMessageComposer);
        this._composers.set(2181, GuideSessionCreateMessageComposer);
        this._composers.set(150, GuideSessionFeedbackMessageComposer);
        this._composers.set(3914, GuideSessionGetRequesterRoomMessageComposer);
        this._composers.set(300, GuideSessionGuideDecidesMessageComposer);
        this._composers.set(296, GuideSessionIsTypingMessageComposer);
        this._composers.set(1561, GuideSessionMessageMessageComposer);
        this._composers.set(958, GuideSessionOnDutyUpdateMessageComposer);
        this._composers.set(2847, GuideSessionRequesterCancelsMessageComposer);
        this._composers.set(3831, GuideSessionResolvedMessageComposer);
        // The four `GuideSessionController` sends that had no composer until 2026-08-11. Headers
        // from the primary registry, all four corroborated by the emulator's own AS3-traced names.
        // The player's own report history. `vortex-emulator` had the reply composer and no
        // header for the request until 2026-08-11.
        this._composers.set(1834, GetMyCfhReportStatusMessageComposer);
        // WIN63 registry: _composers[3028] = _SafeCls_3470, sent by MyReportStatus::onClickAppeal().
        this._composers.set(3028, AppealCfhMessageComposer);
        // WIN63 registry: _composers[879] = _SafeCls_3401, the onboarding name claim. Distinct
        // from ChangeUserName (1703), which is the help-side rename — see the composer's header.
        this._composers.set(879, ClaimNewUserNameMessageComposer);
        this._composers.set(3336, GuideSessionInviteRequesterMessageComposer);
        this._composers.set(2545, ChatReviewGuideDecidesOnOfferMessageComposer);
        this._composers.set(349, ChatReviewGuideDetachedMessageComposer);
        this._composers.set(1801, ChatReviewGuideVoteMessageComposer);

        // The remaining seven, whose bodies were re-ported against the primary tree on
        // 2026-08-09 — every one of them was missing fields or had the wrong parameter
        // order, so registering them before the fix would have put a malformed report on
        // the wire. Arity re-checked against the mapped class after the rewrite.
        this._composers.set(732, CallForHelpMessageComposer);
        this._composers.set(838, CallForHelpFromIMMessageComposer);
        this._composers.set(1964, CallForHelpFromPhotoMessageComposer);
        this._composers.set(2991, CallForHelpFromForumMessageMessageComposer);
        this._composers.set(380, CallForHelpFromForumThreadMessageComposer);
        this._composers.set(3970, ChatReviewSessionCreateMessageComposer);
        this._composers.set(3458, GetCfhStatusMessageComposer);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // The rest of what `scripts/unwired-messages.mjs` turned up: classes this port wrote
        // and never plugged in. Room competitions were the whole of it — entering, voting and
        // submitting a room were all unreachable.
        this._composers.set(431, ForwardToACompetitionRoomMessageComposer);
        this._composers.set(1814, GetSecondsUntilMessageComposer);
        this._composers.set(1477, RoomCompetitionInitMessageComposer);
        this._composers.set(2612, SubmitRoomToCompetitionMessageComposer);
        this._composers.set(2615, VoteForRoomMessageComposer);

        this._composers.set(1369, GetInterstitialMessageComposer);
        this._composers.set(3074, FriendRequestQuestCompleteMessageComposer);

        // All three ids corrected 2026-08-27 against the WIN63 registry
        // (habbo/communication/_SafeCls_2046.as) joined to their sender in HabboCatalog.as:
        // _composers[1730] = _SafeCls_2061 (getRecyclerStatus), [3669] = _SafeCls_1777
        // (getRecyclerPrizes), [1796] = _SafeCls_2312 (sendRecycleItems). The previous 1246 /
        // 2516 / 2956 appear in no registry table at all — the recycler could not talk to the
        // server, which is why the emulator corrected the same three on its side 2026-08-22.
        this._composers.set(1730, GetRecyclerStatusMessageComposer);
        this._composers.set(3669, GetRecyclerPrizesMessageComposer);
        this._composers.set(1796, RecycleItemsMessageComposer);

        // === QUEST ===
        this._composers.set(2252, GetCommunityGoalHallOfFameMessageComposer);
        this._composers.set(397, GetDailyQuestMessageComposer);
        this._composers.set(555, ActivateQuestMessageComposer);
        this._composers.set(1221, CancelQuestMessageComposer);
        this._composers.set(1815, GetCommunityGoalProgressMessageComposer);
        this._composers.set(2167, GetConcurrentUsersGoalProgressMessageComposer);
        this._composers.set(2451, GetConcurrentUsersRewardMessageComposer);
        // AS3: WIN63-202607011411 registry _SafeCls_2046.as — _composers[id] = composer class.
        this._composers.set(2895, GetQuestsMessageComposer);            // _SafeCls_1837 (requestQuests)
        // The resolution-furni pair. 1760 asks for the achievement list *and*, with a non-zero
        // second field, commits the player's choice; 916 clears it. Both are sent by
        // AchievementsResolutionController, which had no window to send them from.
        this._composers.set(1760, GetResolutionAchievementsMessageComposer);
        this._composers.set(916, ResetResolutionAchievementMessageComposer);
        this._composers.set(1236, GetSeasonalQuestsOnlyMessageComposer); // _SafeCls_1847 (requestSeasonalQuests)
        this._composers.set(985, AcceptQuestMessageComposer);           // _SafeCls_2865 (QuestsList.onAcceptQuest)
        this._composers.set(20, RejectQuestMessageComposer);            // _SafeCls_3635 (QuestsList.onCancelQuest)
        this._composers.set(588, OpenQuestTrackerMessageComposer);      // _SafeCls_3460 (QuestTracker "next quest")
        this._composers.set(3969, StartCampaignMessageComposer);       // _SafeCls_3041 (QuestTracker.onStartQuestTimer)

        // === ACHIEVEMENTS ===
        this._composers.set(2435, GetAchievementsComposer);            // _SafeCls_3287 (AchievementController.show)

        // === TALENT ===
        this._composers.set(3757, GetTalentTrackMessageComposer);
        this._composers.set(1850, GuideAdvertisementReadMessageComposer);

        // The level-only request. Its emulator handler is an empty stub, so nothing answers it —
        // ported because AS3's TalentPromoCtrl sends it on every user-object update.
        this._composers.set(2280, GetTalentTrackLevelMessageComposer);

        // === TALENT (incoming) ===
        // Three ids from WIN63's registry, all corroborated by the emulator's header table.
        this._events.set(3909, TalentTrackMessageEvent);
        this._events.set(2210, TalentTrackLevelMessageEvent);
        this._events.set(1564, TalentLevelUpMessageEvent);

        // === COMPETITION ===
        this._composers.set(1503, GetCurrentTimingCodeMessageComposer);
        // The three the landing view's competition elements send. Every one of these had drifted
        // between builds, so none could be taken from win63_version's registry: it puts them at
        // 2055 / 2517 / 2732 against 1917 / 3109 / 128 here. Each class was identified in the
        // primary tree by its caller — `_SafeCls_4528` and `_SafeCls_4538`, which match
        // win63_version's `class_4150`/`class_4146` line for line — and not by arity, which is
        // ambiguous for a one-String composer.
        this._composers.set(1917, ForwardToASubmittableRoomMessageComposer);
        this._composers.set(3109, ForwardToRandomCompetitionRoomMessageComposer);
        this._composers.set(128, GetIsUserPartOfCompetitionMessageComposer);

        // === INVENTORY - TRADING ===
        this._composers.set(1865, OpenTradingComposer);
        this._composers.set(3639, CloseTradingComposer);
        this._composers.set(490, AcceptTradingComposer);
        this._composers.set(1030, UnacceptTradingComposer);
        this._composers.set(2662, ConfirmAcceptTradingComposer);
        this._composers.set(1217, ConfirmDeclineTradingComposer);
        this._composers.set(2177, AddItemToTradeComposer);
        this._composers.set(573, RemoveItemFromTradeComposer);
        // The bulk add and the silver-fee toggle, `_composers[3370]`/`_composers[2717]` in WIN63's
        // registry, both corroborated by the emulator. 3370 is NOT interchangeable with 2177: AS3
        // sends the single-item composer when exactly one item survives its filter.
        this._composers.set(3370, AddItemsToTradeComposer);
        this._composers.set(2717, SilverFeeMessageComposer);

        // === SOUND (Trax) ===
        // `_composers[3130]`/`[1685]`/`[1281]` in WIN63's registry. 3130 carries the whole pending
        // song-info queue at once; the other two have no payload.
        this._composers.set(3130, GetSongInfoMessageComposer);
        this._composers.set(1685, GetUserSongDisksMessageComposer);
        this._composers.set(1281, GetJukeboxPlayListMessageComposer);
        // `_composers[1637]`/`[2003]`/`[1723]` in WIN63's registry: put a disc in a jukebox slot,
        // take one out, and resolve an official song code to its numeric id. The first two are the
        // playlist editor's, which has no port yet; the third is sent by
        // SongDiskProductViewCatalogWidget. Arity checked against each obfuscated class before
        // registering — `_SafeCls_3368(int,int)`, `_SafeCls_3444(int)`, `_SafeCls_2775(String)`.
        this._composers.set(1637, AddJukeboxDiskComposer);
        this._composers.set(2003, RemoveJukeboxDiskComposer);
        this._composers.set(1723, GetOfficialSongIdMessageComposer);
        // `_composers[3707]`/`[3633]`: the jukebox's now-playing request (which is what fetches
        // its list) and the sound machine's list request. Neither carries a payload.
        this._composers.set(3707, GetNowPlayingMessageComposer);
        this._composers.set(3633, GetSoundMachinePlayListMessageComposer);

        // === INVENTORY - VAULT / REWARD ===
        // GiveStarGemToUserMessageComposer removed 2026-09-03, the same way
        // GetHeightMapMessageComposer went on 2026-08-27: it is in no AS3 tree at all. It came
        // from `sources/NITRO`, an unrelated TypeScript client, and its `@see` cited a
        // `win63_version` member that does not exist. Its only caller was
        // `SessionDataManager.giveStarGem()`, which nothing called; both are gone. 1111 belongs
        // to ScrGetKickbackInfoMessageComposer.
        this._composers.set(1645, CreditVaultStatusMessageComposer);
        this._composers.set(1105, WithdrawCreditVaultMessageComposer);
        this._composers.set(3417, IncomeRewardStatusMessageComposer);
        this._composers.set(809, IncomeRewardClaimMessageComposer);

        // === HABBICONS ===
        // See the incoming block above: registry-only ids, derived names.
        this._composers.set(272, GetHabbiconShopDataMessageComposer);
        this._composers.set(1494, GetHabbiconInfoMessageComposer);
        this._composers.set(3980, BuyHabbiconMessageComposer);
        this._composers.set(3036, BuyHabbiconCollectionMessageComposer);
        this._composers.set(662, ClaimHabbiconMessageComposer);
        this._composers.set(1808, FavoriteHabbiconMessageComposer);
        this._composers.set(75, UnfavoriteHabbiconMessageComposer);
        // Posts a habbicon into a messenger conversation — the habbicon twin of
        // SendMsgMessageComposer. Name derived, same reason as the six above.
        this._composers.set(1163, SendHabbiconMessageComposer);
        // Triggers a habbicon bubble over your own avatar, sent by the chat-input selector.
        // AS3: _SafeCls_2046.as::_composers[1176] = _SafeCls_3701, one int. Name derived — the
        // emulator has no habbicon header at all, so there is nothing to corroborate against.
        this._composers.set(1176, TriggerHabbiconMessageComposer);

        // === BADGE LEADERBOARD ===
        // Both ids come from WIN63's own registry (1225 -> _SafeCls_3493, 2503 -> _SafeCls_3446).
        // The emulator has no header for either, so the names are derived — flagged at each
        // declaration, same as the habbicon set above.
        this._composers.set(1225, GetBadgeLeaderboardMessageComposer);

        // === SEASONAL CALENDAR ===
        // Both ids from WIN63's own registry (1012 -> _SafeCls_3869, 1641 -> _SafeCls_2647), names
        // recovered from win63_version's own filenames and corroborated by the emulator's table.
        this._composers.set(1012, GetSeasonalCalendarDailyComposer);

        // === REWARD TRACK ===
        // Six ids, all from WIN63's own registry. The reward track postdates win63_version and the
        // emulator has no header for any of them, so every name here is derived from the
        // unobfuscated handler or call site — flagged as such at each declaration.
        this._composers.set(1376, ClaimRewardTrackPrizeMessageComposer);
        this._composers.set(1789, PurchaseRewardTrackPremiumMessageComposer);

        // === NUX ===
        this._composers.set(2048, NewUserExperienceScriptProceedComposer);

        // === ROOM SETTINGS ===
        this._composers.set(256, GetRoomSettingsMessageComposer);
        this._composers.set(725, SaveRoomSettingsMessageComposer);
        this._composers.set(342, GetFlatControllersMessageComposer);
        this._composers.set(2702, GetBannedUsersFromRoomMessageComposer);
        this._composers.set(701, DeleteRoomMessageComposer);
        this._composers.set(159, RemoveAllRightsMessageComposer);
        this._composers.set(2804, UnbanUserFromRoomMessageComposer);

        // === YOUTUBE / VIMEO DISPLAY FURNI ===
        // Ids from WIN63's registry; names recovered from win63_version's readable filenames.
        // Vimeo reuses SetObjectDataMessageComposer (246) rather than a composer of its own,
        // which is what AS3's Vimeo handler does too.
        this._composers.set(273, GetYoutubeDisplayStatusMessageComposer);
        this._composers.set(1672, SetYoutubeDisplayPlaylistMessageComposer);
        this._composers.set(1727, ControlYoutubeDisplayPlaybackMessageComposer);

        // === CRAFTING ===
        // All five ids from WIN63's own registry and corroborated by the emulator's
        // Headers.cs. Note the emulator's crafting handlers are all empty stubs, so these
        // reach a server that accepts and drops them — the client side is correct regardless.
        this._composers.set(369, GetCraftableProductsComposer);
        this._composers.set(1398, GetCraftingRecipeComposer);
        this._composers.set(1302, GetCraftingRecipesAvailableComposer);
        this._composers.set(3274, CraftComposer);
        this._composers.set(323, CraftSecretComposer);

        // === SNOW WAR (habbo/game) ===
        // Every id below is WIN63's own registry (`_composers[...] = ...` in _SafeCls_2046.as) and
        // every one is corroborated by the emulator's Headers.cs. Three of the five classes in the
        // directory group are obfuscated in the primary tree — 1506, 1847 and 2109 — and their
        // names come from win63_version's readable filenames; the emulator carries the same
        // recovery, including the note that 2109 and 1506 had been swapped, which sent every named
        // arena join into the quick-join handler.
        // The emulator's snow-war handlers are empty stubs, so these reach a server that accepts
        // and drops them. That is a server gap, not a reason to leave the client unable to speak.
        this._composers.set(1115, Game2CheckGameDirectoryStatusMessageComposer);
        this._composers.set(3377, Game2GetAccountGameStatusMessageComposer);
        this._composers.set(2109, Game2StartSnowWarMessageComposer);
        this._composers.set(1506, Game2QuickJoinGameMessageComposer);
        this._composers.set(1847, Game2LeaveGameMessageComposer);
        this._composers.set(1320, Game2LoadStageReadyMessageComposer);
        this._composers.set(3510, Game2ExitGameMessageComposer);
        this._composers.set(855, Game2PlayAgainMessageComposer);
        this._composers.set(172, Game2SetUserMoveTargetMessageComposer);
        this._composers.set(2604, Game2MakeSnowballMessageComposer);
        this._composers.set(3738, Game2ThrowSnowballAtHumanMessageComposer);
        this._composers.set(2567, Game2ThrowSnowballAtPositionMessageComposer);
        this._composers.set(3147, Game2RequestFullStatusUpdateMessageComposer);
        this._composers.set(3467, Game2GetFriendsLeaderboardComposer);
        this._composers.set(3383, Game2GetTotalLeaderboardComposer);
        this._composers.set(1479, Game2GetTotalGroupLeaderboardComposer);
        this._composers.set(1741, Game2GetWeeklyLeaderboardComposer);
        this._composers.set(3867, Game2GetWeeklyFriendsLeaderboardComposer);
        this._composers.set(1480, Game2GetWeeklyGroupLeaderboardComposer);

        // === VORTEX-SPECIFIC (no AS3 backing) ===
        // See the matching note in registerEvents() for why these headers sit at 8000+.
        this._composers.set(8001, VortexGetFurniEditorDataComposer);
        this._composers.set(8003, VortexApplyFurniEditComposer);
        this._composers.set(8005, VortexGetFurniDefinitionComposer);
        this._composers.set(8007, VortexApplyFurniDefinitionComposer);

        // Fishing's outgoing half — 8100-8199, odd for composers. The client sends three things and
        // decides none of them; see docs/vortex-original/fishing.md §5.
        // Origins fishing is a session, not a cast per fish: the client starts one and then only
        // listens. 8101 was VortexFishingCastComposer and modelled the wrong interaction.
        this._composers.set(8101, VortexStartFishingComposer);
        this._composers.set(8103, VortexFishingMountCatchComposer);
        this._composers.set(8105, VortexFishingJoinDerbyComposer);
        this._composers.set(8107, VortexStopFishingComposer);
        this._composers.set(8109, VortexHookHavocInputComposer);
    }
}
