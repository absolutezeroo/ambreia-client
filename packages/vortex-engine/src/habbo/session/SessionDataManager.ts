import {Component, ComponentDependency, type IContext} from '@core/runtime';
import {Logger} from '@core/utils/Logger';
import type {IWindow} from '@core/window/IWindow';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {ISessionDataManager} from './ISessionDataManager';
import {HabboClubLevelEnum, hasClub as clubLevelHasClub, hasVip as clubLevelHasVip, UIFlagsEnum} from './enum';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboNotifications} from '@iid/IIDHabboNotifications';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {FurnitureDataParser} from './furniture/FurnitureDataParser';
import {ProductDataParser} from './product/ProductDataParser';
import {BadgeInfo} from './BadgeInfo';
import {BadgeImageManager} from './BadgeImageManager';
import {FurniIconImageManager} from './FurniIconImageManager';

import type {IHabboLocalizationManager} from '../localization/IHabboLocalizationManager';
import type {IHabboNotifications} from '../notifications/IHabboNotifications';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IFurnitureData} from './furniture/IFurnitureData';
import type {IFurniDataListener} from './furniture/IFurniDataListener';
import type {IProductData} from './product/IProductData';
import type {IProductDataListener} from './product/IProductDataListener';
import type {IRoomSessionManager} from './IRoomSessionManager';
import type {IHabboConfigurationManager} from '../configuration/IHabboConfigurationManager';

// Events - Handshake
import {UserObjectMessageEvent} from '../communication/messages/incoming/handshake/UserObjectMessageEvent';
import {UserRightsMessageEvent} from '../communication/messages/incoming/handshake/UserRightsMessageEvent';
import {NoobnessLevelMessageEvent} from '../communication/messages/incoming/handshake/NoobnessLevelMessageEvent';
import {
    IsFirstLoginOfDayMessageEvent
} from '../communication/messages/incoming/handshake/IsFirstLoginOfDayMessageEvent';

// Events - Availability
import {
    AvailabilityStatusMessageEvent
} from '../communication/messages/incoming/availability/AvailabilityStatusMessageEvent';

// Events - Avatar
import {FigureUpdateMessageEvent} from '../communication/messages/incoming/avatar/FigureUpdateMessageEvent';

// Events - Navigator
import {
    NavigatorSettingsMessageEvent
} from '../communication/messages/incoming/navigator/NavigatorSettingsMessageEvent';
import {FavouritesMessageEvent} from '../communication/messages/incoming/navigator/FavouritesMessageEvent';

// Events - Notifications
import {ActivityPointsMessageEvent} from '../communication/messages/incoming/notifications/ActivityPointsMessageEvent';
import {InfoFeedEnableMessageEvent} from '../communication/messages/incoming/notifications/InfoFeedEnableMessageEvent';
import {
    AccountSafetyLockStatusChangeMessageEvent
} from '../communication/messages/incoming/notifications/AccountSafetyLockStatusChangeMessageEvent';
import {PetRespectFailedEvent} from '../communication/messages/incoming/notifications/PetRespectFailedEvent';

// Events - Inventory
import {
    AchievementsScoreMessageEvent
} from '../communication/messages/incoming/inventory/AchievementsScoreMessageEvent';
import {FigureSetIdsMessageEvent} from '../communication/messages/incoming/inventory/FigureSetIdsMessageEvent';
import {AvatarEffectsMessageEvent} from '../communication/messages/incoming/inventory/AvatarEffectsMessageEvent';

// Events - Mystery Box
import {MysteryBoxKeysMessageEvent} from '../communication/messages/incoming/mysterybox/MysteryBoxKeysMessageEvent';

// Events - Catalog
import {
    BuildersClubSubscriptionStatusMessageEvent
} from '../communication/messages/incoming/catalog/BuildersClubSubscriptionStatusMessageEvent';

// Events - Users
import {InClientLinkMessageEvent} from '../communication/messages/incoming/users/InClientLinkMessageEvent';
import {EmailStatusResultEvent} from '../communication/messages/incoming/users/EmailStatusResultEvent';

// Events - Help (name change)
import {
    ChangeUserNameResultMessageEvent
} from '../communication/messages/incoming/help/ChangeUserNameResultMessageEvent';
import {UserNameChangedMessageEvent} from '../communication/messages/incoming/help/UserNameChangedMessageEvent';

// Events - Room
import {RoomReadyMessageEvent} from '../communication/messages/incoming/room/session/RoomReadyMessageEvent';
import {UserChangeMessageEvent} from '../communication/messages/incoming/room/action/UserChangeMessageEvent';

// Events - Preferences & NFT
import {AccountPreferencesEvent} from '../communication/messages/incoming/preferences/AccountPreferencesEvent';
import {UserNftChatStylesMessageEvent} from '../communication/messages/incoming/nft/UserNftChatStylesMessageEvent';
import {
    UserPurchasableChatStyleChangedMessageEvent
} from '../communication/messages/incoming/nft/UserPurchasableChatStyleChangedMessageEvent';
import {
    UserPurchasableChatStylesMessageEvent
} from '../communication/messages/incoming/nft/UserPurchasableChatStylesMessageEvent';

// Parsers
import type {UserObjectMessageParser} from '../communication/messages/parser/handshake/UserObjectMessageParser';
import type {UserRightsMessageParser} from '../communication/messages/parser/handshake/UserRightsMessageParser';
import type {NoobnessLevelMessageParser} from '../communication/messages/parser/handshake/NoobnessLevelMessageParser';
import type {
    IsFirstLoginOfDayMessageParser
} from '../communication/messages/parser/handshake/IsFirstLoginOfDayMessageParser';
import type {
    AvailabilityStatusMessageParser
} from '../communication/messages/parser/availability/AvailabilityStatusMessageParser';
import type {FigureUpdateMessageParser} from '../communication/messages/parser/avatar/FigureUpdateMessageParser';
import type {
    NavigatorSettingsMessageParser
} from '../communication/messages/parser/navigator/NavigatorSettingsMessageParser';
import type {FavouritesMessageParser} from '../communication/messages/parser/navigator/FavouritesMessageParser';
import type {
    ActivityPointsMessageParser
} from '../communication/messages/parser/notifications/ActivityPointsMessageParser';
import type {
    InfoFeedEnableMessageParser
} from '../communication/messages/parser/notifications/InfoFeedEnableMessageParser';
import type {
    AccountSafetyLockStatusChangeMessageEventParser
} from '../communication/messages/parser/notifications/AccountSafetyLockStatusChangeMessageEventParser';
import type {
    AchievementsScoreMessageParser
} from '../communication/messages/parser/inventory/AchievementsScoreMessageParser';
import type {FigureSetIdsMessageParser} from '../communication/messages/parser/inventory/FigureSetIdsMessageParser';
import type {
    AvatarEffectsMessageParser,
    IAvatarEffect
} from '../communication/messages/parser/inventory/AvatarEffectsMessageParser';
import type {
    MysteryBoxKeysMessageParser
} from '../communication/messages/parser/mysterybox/MysteryBoxKeysMessageParser';
import type {
    BuildersClubSubscriptionStatusMessageParser
} from '../communication/messages/parser/catalog/BuildersClubSubscriptionStatusMessageParser';
import type {InClientLinkMessageParser} from '../communication/messages/parser/users/InClientLinkMessageParser';
import type {EmailStatusResultParser} from '../communication/messages/parser/users/EmailStatusResultParser';
import type {
    ChangeUserNameResultMessageParser
} from '../communication/messages/parser/help/ChangeUserNameResultMessageParser';
import type {UserNameChangedMessageParser} from '../communication/messages/parser/help/UserNameChangedMessageParser';
import type {RoomReadyMessageParser} from '../communication/messages/parser/room/session/RoomReadyMessageParser';
import type {AccountPreferencesParser} from '../communication/messages/parser/preferences/AccountPreferencesParser';
import type {UserNftChatStylesMessageParser} from '../communication/messages/parser/nft/UserNftChatStylesMessageParser';
import type {
    UserPurchasableChatStyleChangedMessageParser
} from '../communication/messages/parser/nft/UserPurchasableChatStyleChangedMessageParser';
import type {
    UserPurchasableChatStylesMessageParser
} from '../communication/messages/parser/nft/UserPurchasableChatStylesMessageParser';

// Composers
import {RespectUserMessageComposer} from '../communication/messages/outgoing/room/RespectUserMessageComposer';
import {RespectPetMessageComposer} from '../communication/messages/outgoing/room/RespectPetMessageComposer';
import {ChatMessageComposer} from '../communication/messages/outgoing/room/chat/ChatMessageComposer';
import {SetUIFlagsMessageComposer} from '../communication/messages/outgoing/preferences/SetUIFlagsMessageComposer';
import {
    CreditVaultStatusMessageComposer
} from '../communication/messages/outgoing/inventory/CreditVaultStatusMessageComposer';
import {
    WithdrawCreditVaultMessageComposer
} from '../communication/messages/outgoing/inventory/WithdrawCreditVaultMessageComposer';
import {
    IncomeRewardStatusMessageComposer
} from '../communication/messages/outgoing/inventory/IncomeRewardStatusMessageComposer';
import {
    IncomeRewardClaimMessageComposer
} from '../communication/messages/outgoing/inventory/IncomeRewardClaimMessageComposer';
import {
    GetUserNftChatStylesMessageComposer
} from '../communication/messages/outgoing/users/GetUserNftChatStylesMessageComposer';
import {
    GetDailyTasksComposer
} from '../communication/messages/outgoing/users/GetDailyTasksComposer';
import {
    ReplenishRespectMessageComposer
} from '../communication/messages/outgoing/users/ReplenishRespectMessageComposer';

// Session events
import {UserNameUpdateEvent} from './events/UserNameUpdateEvent';
import {SessionDataPreferencesEvent} from './events/SessionDataPreferencesEvent';
import {MysteryBoxKeysUpdateEvent} from './events/MysteryBoxKeysUpdateEvent';
import {SessionDataToWidgetEvent} from './events/SessionDataToWidgetEvent';

// Sub-managers
import type {IUserDataManager} from './IUserDataManager';
import type {IPerkManager} from './IPerkManager';
import type {IIgnoredUsersManager} from './IIgnoredUsersManager';
import type {IHabboGroupInfoManager} from './IHabboGroupInfoManager';
import {UserDataManager} from './UserDataManager';
import {PerkManager} from './PerkManager';
import {IgnoredUsersManager} from './IgnoredUsersManager';
import {BlockedUsersManager} from './BlockedUsersManager';
import {HabboGroupInfoManager} from './HabboGroupInfoManager';
import {PerkType} from '../communication/enum/PerkType';

const log = Logger.getLogger('habbo.session.SessionDataManager');

/**
 * Session data manager
 * Manages user session data after authentication
 * Based on AS3 com.sulake.habbo.session.SessionDataManager
 */
export class SessionDataManager extends Component implements ISessionDataManager
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/SessionDataManager.as::_communicationManager
    private _communicationManager: IHabboCommunicationManager | null = null;
    private _messageEvents: IMessageEvent[] = [];
    private _customData: string = '';
    private _directMail: boolean = false;
    private _mysteryBoxKeyColor: string = '';
    private _nftChatStyleIds: Set<number> = new Set();
    private _purchasableChatStyleIds: Set<number> = new Set();
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_localization
    private _localization: IHabboLocalizationManager | null = null;
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_notifications
    private _notifications: IHabboNotifications | null = null;
    // Furniture data - owned by SessionDataManager (AS3 pattern)
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_floorItems
    private _floorItems: Map<number, IFurnitureData> = new Map();
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_wallItems
    private _wallItems: Map<number, IFurnitureData> = new Map();
    private _floorItemsByName: Map<string, number[]> = new Map();
    private _wallItemsByName: Map<string, number[]> = new Map();
    private _furnitureDataParser: FurnitureDataParser | null = null;
    private _loadingFurnitureDataParser: FurnitureDataParser | null = null;
    private _furniDataReady: boolean = false;
    private _furniDataListenersNotified: boolean = false;
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_furniDataListeners
    private _furniDataListeners: Set<IFurniDataListener> = new Set();
    // Product data - owned by SessionDataManager (AS3 pattern)
    private _products: Map<string, IProductData> = new Map();
    private _productDataParser: ProductDataParser | null = null;
    private _productDataReady: boolean = false;
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_productDataListeners
    private _productDataListeners: Set<IProductDataListener> = new Set();

    constructor(context: IContext)
    {
        super(context);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get communication()
    get communication(): IHabboCommunicationManager | null
    {
        return this._communicationManager;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get roomSessionManager()
    get roomSessionManager(): IRoomSessionManager | null
    {
        return this._roomSessionManager;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get localization()
    get localization(): IHabboLocalizationManager | null
    {
        return this._localization;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get notifications()
    get notifications(): IHabboNotifications | null
    {
        return this._notifications;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_newFurniDataHash
    private _newFurniDataHash: string | null = null;

    get newFurniDataHash(): string
    {
        return this._newFurniDataHash ?? '';
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::set newFurniDataHash()
    set newFurniDataHash(hash: string)
    {
        this._newFurniDataHash = hash;
    }

    // Sub-managers
    private _userDataManager: UserDataManager | null = null;

    get userDataManager(): IUserDataManager
    {
        return this._userDataManager!;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/SessionDataManager.as::_perkManager
    private _perkManager: PerkManager | null = null;

    get perkManager(): IPerkManager
    {
        return this._perkManager!;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/SessionDataManager.as::_ignoredUsersManager
    private _ignoredUsersManager: IgnoredUsersManager | null = null;

    get ignoredUsersManager(): IIgnoredUsersManager
    {
        return this._ignoredUsersManager!;
    }

    private _blockedUsersManager: BlockedUsersManager | null = null;

    private _groupInfoManager: HabboGroupInfoManager | null = null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/SessionDataManager.as::_badgeImageManager
    private _badgeImageManager: BadgeImageManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::_SafeStr_7936
    private _furniIconImageManager: FurniIconImageManager | null = null;

    get groupInfoManager(): IHabboGroupInfoManager
    {
        return this._groupInfoManager!;
    }

    // System status
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_systemOpen
    private _systemOpen: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get systemOpen()
    get systemOpen(): boolean
    {
        return this._systemOpen;
    }

    private _systemShutDown: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get systemShutDown()
    get systemShutDown(): boolean
    {
        return this._systemShutDown;
    }

    private _isAuthenticHabbo: boolean = false;

    get isAuthenticHabbo(): boolean
    {
        return this._isAuthenticHabbo;
    }

    // User data
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/SessionDataManager.as::_userId
    private _userId: number = 0;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    private _userName: string = '';

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get userName()
    get userName(): string
    {
        return this._userName;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_realName
    private _realName: string = '';

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get realName()
    get realName(): string
    {
        return this._realName;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/SessionDataManager.as::_figure
    private _figure: string = '';

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get figure()
    get figure(): string
    {
        return this._figure;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/SessionDataManager.as::_gender
    private _gender: string = '';

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get gender()
    get gender(): string
    {
        return this._gender;
    }

    // User status
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/SessionDataManager.as::_clubLevel
    private _clubLevel: number = 0;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get clubLevel()
    get clubLevel(): number
    {
        return this._clubLevel;
    }

    private _securityLevel: number = 0;

    get securityLevel(): number
    {
        return this._securityLevel;
    }

    private _topSecurityLevel: number = 0;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get topSecurityLevel()
    get topSecurityLevel(): number
    {
        return this._topSecurityLevel;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_isAmbassador
    private _isAmbassador: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get isAmbassador()
    get isAmbassador(): boolean
    {
        return this._isAmbassador;
    }

    // Derived name: `_noobnessLevel` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::_noobnessLevel
    // AS3 initialises this to -1, not 0, so isNoob() reads true until the server says
    // otherwise (see get isNoob()).
    private _noobnessLevel: number = -1;

    get noobnessLevel(): number
    {
        return this._noobnessLevel;
    }

    // Respect
    private _respectTotal: number = 0;

    get respectTotal(): number
    {
        return this._respectTotal;
    }

    private _respectLeft: number = 0;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get respectLeft()
    get respectLeft(): number
    {
        return this._respectLeft;
    }

    private _respectReplenishesLeft: number = 0;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get respectReplenishesLeft()
    get respectReplenishesLeft(): number
    {
        return this._respectReplenishesLeft;
    }

    private _maxRespectPerDay: number = 3;

    private _petRespectLeft: number = 0;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get petRespectLeft()
    get petRespectLeft(): number
    {
        return this._petRespectLeft;
    }

    // Safety & Verification
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_accountSafetyLocked
    private _accountSafetyLocked: boolean = false;

    get accountSafetyLocked(): boolean
    {
        return this._accountSafetyLocked;
    }

    private _nameChangeAllowed: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get nameChangeAllowed()
    get nameChangeAllowed(): boolean
    {
        return this._nameChangeAllowed;
    }

    private _isEmailVerified: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get isEmailVerified()
    get isEmailVerified(): boolean
    {
        return this._isEmailVerified;
    }

    // Stream & Access
    private _streamPublishingAllowed: boolean = false;

    get streamPublishingAllowed(): boolean
    {
        return this._streamPublishingAllowed;
    }

    private _lastAccessDate: string = '';

    get lastAccessDate(): string
    {
        return this._lastAccessDate;
    }

    private _isFirstLoginOfDay: boolean = false;

    get isFirstLoginOfDay(): boolean
    {
        return this._isFirstLoginOfDay;
    }

    // Navigator settings
    private _homeRoomId: number = 0;

    get homeRoomId(): number
    {
        return this._homeRoomId;
    }

    private _roomIdToEnter: number = 0;

    get roomIdToEnter(): number
    {
        return this._roomIdToEnter;
    }

    private _favouriteRooms: number[] = [];

    get favouriteRooms(): number[]
    {
        return this._favouriteRooms;
    }

    private _favouriteRoomsLimit: number = 30;

    get favouriteRoomsLimit(): number
    {
        return this._favouriteRoomsLimit;
    }

    // Currency & Achievements
    private _activityPoints: Map<number, number> = new Map();

    get activityPoints(): Map<number, number>
    {
        return this._activityPoints;
    }

    private _achievementScore: number = 0;

    get achievementScore(): number
    {
        return this._achievementScore;
    }

    // UI Preferences
    private _uiFlags: number = 0;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get uiFlags()
    get uiFlags(): number
    {
        return this._uiFlags;
    }

    private _isRoomCameraFollowDisabled: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get isRoomCameraFollowDisabled()
    get isRoomCameraFollowDisabled(): boolean
    {
        return this._isRoomCameraFollowDisabled;
    }

    private _infoFeedEnabled: boolean = false;

    get infoFeedEnabled(): boolean
    {
        return this._infoFeedEnabled;
    }

    // Figure & Effects
    private _figureSetIds: number[] = [];

    get figureSetIds(): number[]
    {
        return this._figureSetIds;
    }

    private _boundFurnitureNames: string[] = [];

    get boundFurnitureNames(): string[]
    {
        return this._boundFurnitureNames;
    }

    private _avatarEffects: IAvatarEffect[] = [];

    get avatarEffects(): IAvatarEffect[]
    {
        return this._avatarEffects;
    }

    // Mystery Box
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::_mysteryBoxColor
    private _mysteryBoxColor: string = '';

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get mysteryBoxColor()
    get mysteryBoxColor(): string
    {
        return this._mysteryBoxColor;
    }

    // Builders Club
    private _buildersClubSecondsLeft: number = 0;

    get buildersClubSecondsLeft(): number
    {
        return this._buildersClubSecondsLeft;
    }

    private _buildersClubFurniLimit: number = 0;

    get buildersClubFurniLimit(): number
    {
        return this._buildersClubFurniLimit;
    }

    private _buildersClubMaxFurniLimit: number = 0;

    get buildersClubMaxFurniLimit(): number
    {
        return this._buildersClubMaxFurniLimit;
    }

    private _buildersClubSecondsLeftWithGrace: number | null = null;

    get buildersClubSecondsLeftWithGrace(): number | null
    {
        return this._buildersClubSecondsLeftWithGrace;
    }

    get motto(): string
    {
        return this._customData;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::get hasVip()
    get hasVip(): boolean
    {
        return clubLevelHasVip(this._clubLevel);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::get hasClub()
    get hasClub(): boolean
    {
        return clubLevelHasClub(this._clubLevel);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::get isNoob()
    get isNoob(): boolean
    {
        // AS3 tests `!= 0`, not `> 0`: the -1 default and any negative level both count
        // as a noob until the server sends 0.
        return this._noobnessLevel !== 0;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get isRealNoob()
    get isRealNoob(): boolean
    {
        return this._noobnessLevel === 2;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get isAnyRoomController()
    get isAnyRoomController(): boolean
    {
        return this._securityLevel >= 5;
    }

    get canChangeName(): boolean
    {
        return this._nameChangeAllowed;
    }

    get respectsReceived(): number
    {
        return this._respectTotal;
    }

    get respectsRemaining(): number
    {
        return this._respectLeft;
    }

    get respectsPetRemaining(): number
    {
        return this._petRespectLeft;
    }

    get safetyLocked(): boolean
    {
        return this._accountSafetyLocked;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get mysteryKeyColor()
    get mysteryKeyColor(): string
    {
        return this._mysteryBoxKeyColor;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::get perksReady()
    get perksReady(): boolean
    {
        return this._perkManager?.isReady ?? false;
    }

    private _configurationManager: IHabboConfigurationManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::get currentTalentTrack()
    get currentTalentTrack(): string
    {
        const citizenshipEnabled = this._configurationManager?.getBoolean('talent.track.citizenship.enabled') ?? false;

        return citizenshipEnabled && !this.isPerkAllowed(PerkType.CITIZEN) ? 'citizenship' : 'helper';
    }

    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communicationManager = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (manager: IHabboConfigurationManager | null) =>
                {
                    this._configurationManager = manager;

                    // AS3's real HabboAir.as::prepareCore() registers every component library in
                    // one synchronous batch, well before HabboConfigurationManager's async download
                    // resolves, so every dependent's 'complete' listener (added below) is already
                    // attached by the time it fires. This port's VortexMain.ts::prepareCore()
                    // instead awaits initConfigurationDownload() before constructing later
                    // components (including this one), so by the time this dependency resolves,
                    // 'complete' has already fired to nobody and never will again - furniture data
                    // (and anything else driven by onConfigurationComplete()) silently never loads.
                    // Catch up instead of only listening for a signal that already passed - deferred
                    // to a microtask so the rest of this dependency array (in particular the
                    // required IID_HabboLocalizationManager entry below, which
                    // onConfigurationComplete()'s furniture data load needs already resolved) finishes
                    // resolving first, matching the order a genuinely-late 'complete' would arrive in.
                    if(manager?.isInitialized())
                    {
                        queueMicrotask(() => this.onConfigurationComplete());
                    }
                },
                true,
                [{type: 'complete', callback: this.onConfigurationComplete.bind(this)}]
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                },
                false
            ),
            // Required, as AS3 declares it — it omits the third argument here while
            // passing an explicit `false` on the very next dependency, so the
            // distinction is deliberate. It has to be: the furnidata parser is what
            // creates every `roomItem.name.<id>` key (from each item's localizedName),
            // and it skips that silently when localization has not arrived. Optional
            // here meant every furniture name in the catalog and the inventory was
            // empty.
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localization = manager;
                }
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
                IID_HabboNotifications,
                (manager: IHabboNotifications | null) =>
                {
                    this._notifications = manager;
                },
                false
            ),
        ];
    }

    /**
	 * Check if a user has a specific security level
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::hasSecurity()
    hasSecurity(level: number): boolean
    {
        return this._securityLevel >= level;
    }

    /**
	 * Send a message to the server
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::send()
    send(composer: IMessageComposer<unknown[]>): void
    {
        this._communicationManager?.connection?.send(composer);
    }

    /**
	 * Give respect to a user
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::giveRespect()
    giveRespect(userId: number): void
    {
        if(userId >= 0 && this._respectLeft > 0)
        {
            this.send(new RespectUserMessageComposer(userId));
            this._respectLeft--;
        }
    }

    /**
	 * Give respect to a pet
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::givePetRespect()
    givePetRespect(petId: number): void
    {
        if(petId >= 0 && this._petRespectLeft > 0)
        {
            this.send(new RespectPetMessageComposer(petId));
            this._petRespectLeft--;
        }
    }

    /**
	 * Called when giving respect fails - restore the counter
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::giveRespectFailed()
    giveRespectFailed(): void
    {
        this._respectLeft++;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::replenishRespect()
    replenishRespect(): void
    {
        this.send(new ReplenishRespectMessageComposer());
        this._respectReplenishesLeft--;
        this._respectLeft = this._maxRespectPerDay;
    }

    /**
	 * Set room camera follow disabled preference.
	 *
	 * Only updates the local flag. The SetUIFlagsMessageComposer is
	 * sent by setUIFlag() when the UI flags actually change.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as setRoomCameraFollowDisabled()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::setRoomCameraFollowDisabled()
    setRoomCameraFollowDisabled(disabled: boolean): void
    {
        this._isRoomCameraFollowDisabled = disabled;
    }

    /**
	 * Set friend bar state UI flag
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::setFriendBarState()
    setFriendBarState(open: boolean): void
    {
        this.setUIFlag(UIFlagsEnum.FRIEND_BAR_OPEN, open);
    }

    /**
	 * Set room tools state UI flag
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::setRoomToolsState()
    setRoomToolsState(open: boolean): void
    {
        this.setUIFlag(UIFlagsEnum.ROOM_TOOLS_OPEN, open);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::isPerkAllowed()
    isPerkAllowed(perk: string): boolean
    {
        return this._perkManager?.isPerkAllowed(perk) ?? false;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getPerkErrorMessage()
    getPerkErrorMessage(perk: string): string
    {
        return this._perkManager?.getPerkErrorMessage(perk) ?? '';
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::isIgnored()
    isIgnored(userId: number): boolean
    {
        return this._ignoredUsersManager?.isIgnored(userId) ?? false;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::ignoreUser()
    ignoreUser(userId: number): void
    {
        this._ignoredUsersManager?.ignoreUser(userId);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::unignoreUser()
    unignoreUser(userId: number): void
    {
        this._ignoredUsersManager?.unignoreUser(userId);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::isBlocked()
    isBlocked(userId: number): boolean
    {
        return this._blockedUsersManager?.isBlocked(userId) ?? false;
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::blockUser()
    blockUser(userId: number): void
    {
        this._blockedUsersManager?.blockUser(userId);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::unblockUser()
    unblockUser(userId: number): void
    {
        this._blockedUsersManager?.unblockUser(userId);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::isAccountSafetyLocked()
    isAccountSafetyLocked(): boolean
    {
        return this._accountSafetyLocked;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getFurniIconImage()
    getFurniIconImage(wallItem: boolean, typeId: number, extra: string): HTMLImageElement | null
    {
        return this._furniIconImageManager?.getFurniIconImage(wallItem, typeId, extra) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getFurniIconImageAssetName()
    getFurniIconImageAssetName(wallItem: boolean, typeId: number, extra: string): string | null
    {
        return this._furniIconImageManager?.getFurniIconImageAssetName(wallItem, typeId, extra) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getBadgeImage()
    getBadgeImage(badge: string): HTMLImageElement | null
    {
        return this._badgeImageManager?.getBadgeImage(badge) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getBadgeSmallImage()
    getBadgeSmallImage(badge: string): HTMLImageElement | null
    {
        return this._badgeImageManager?.getSmallBadgeImage(badge) ?? null;
    }

    /**
	 * Returns null while the image is still loading — these used to return the invented
	 * `<badge>_b` / `<badge>_s` names, which matched no asset the manager ever registers.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getBadgeImageAssetName()
    getBadgeImageAssetName(badge: string): string | null
    {
        return this._badgeImageManager?.getBadgeImageAssetName(badge) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getBadgeImageSmallAssetName()
    getBadgeImageSmallAssetName(badge: string): string | null
    {
        return this._badgeImageManager?.getSmallScaleBadgeAssetName(badge) ?? null;
    }

    /**
	 * Same lookup as getBadgeImage() but without the placeholder fallback — callers use this to
	 * ask for a badge they intend to draw themselves once BADGE_IMAGE_READY fires.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::requestBadgeImage()
    requestBadgeImage(badge: string): HTMLImageElement | null
    {
        return this._badgeImageManager?.getBadgeImage(badge, BadgeImageManager.TYPE_NORMAL, false) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getBadgeImageWithInfo()
    getBadgeImageWithInfo(badge: string): BadgeInfo
    {
        return this._badgeImageManager?.getBadgeImageWithInfo(badge) ?? new BadgeInfo(null, true);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getGroupBadgeId()
    getGroupBadgeId(_groupId: number): string
    {
        return this._groupInfoManager?.getBadgeId(_groupId) ?? '';
    }

    /**
	 * Group badges take the same four accessors as normal ones, differing only by the type
	 * passed down — the manager picks a different config URL and deduplicates the request.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getGroupBadgeImage()
    getGroupBadgeImage(badge: string): HTMLImageElement | null
    {
        return this._badgeImageManager?.getBadgeImage(badge, BadgeImageManager.TYPE_GROUP) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getGroupBadgeSmallImage()
    getGroupBadgeSmallImage(badge: string): HTMLImageElement | null
    {
        return this._badgeImageManager?.getSmallBadgeImage(badge, BadgeImageManager.TYPE_GROUP) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getGroupBadgeAssetName()
    getGroupBadgeAssetName(badge: string): string | null
    {
        return this._badgeImageManager?.getBadgeImageAssetName(badge, BadgeImageManager.TYPE_GROUP) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getGroupBadgeSmallAssetName()
    getGroupBadgeSmallAssetName(badge: string): string | null
    {
        return this._badgeImageManager?.getSmallScaleBadgeAssetName(badge, BadgeImageManager.TYPE_GROUP) ?? null;
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 808
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getProductData()
    getProductData(productCode: string): IProductData | null
    {
        if(!this._productDataReady)
        {
            this.loadProductData();
        }

        return this._products.get(productCode) ?? null;
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 817
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getFloorItemData()
    getFloorItemData(itemId: number): IFurnitureData | null
    {
        return this._floorItems.get(itemId) ?? null;
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as getFloorItemsDataByCategory()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getFloorItemsDataByCategory()
    getFloorItemsDataByCategory(category: number): IFurnitureData[]
    {
        const result: IFurnitureData[] = [];

        for(const furni of this._floorItems.values())
        {
            if(furni.category === category)
            {
                result.push(furni);
            }
        }

        return result;
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 842
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getWallItemData()
    getWallItemData(itemId: number): IFurnitureData | null
    {
        return this._wallItems.get(itemId) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getAllFloorItemDatas()
    getAllFloorItemDatas(): IFurnitureData[]
    {
        return Array.from(this._floorItems.values());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getAllWallItemDatas()
    getAllWallItemDatas(): IFurnitureData[]
    {
        return Array.from(this._wallItems.values());
    }

    /**
	 * Get floor item data by class name with color variant support
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 851
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getFloorItemDataByName()
    getFloorItemDataByName(name: string, index: number = 0): IFurnitureData | null
    {
        const ids = this._floorItemsByName.get(name);

        if(ids && index <= ids.length - 1)
        {
            const id = ids[index];
            return this.getFloorItemData(id);
        }

        return null;
    }

    /**
	 * Get wall item data by class name with color variant support
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 867
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getWallItemDataByName()
    getWallItemDataByName(name: string, index: number = 0): IFurnitureData | null
    {
        const ids = this._wallItemsByName.get(name);

        if(ids && index <= ids.length - 1)
        {
            const id = ids[index];
            return this.getWallItemData(id);
        }

        return null;
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 1024
	 */
    /**
	 * Load product data if not already loaded.
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 1024
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::loadProductData()
    loadProductData(listener?: IProductDataListener): boolean
    {
        if(this._productDataReady)
        {
            return true;
        }

        if(listener)
        {
            this._productDataListeners.add(listener);
        }

        return false;
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 1122
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getFurniData()
    getFurniData(listener: IFurniDataListener): IFurnitureData[] | null
    {
        if(this._floorItems.size === 0)
        {
            this._furniDataListeners.add(listener);

            return null;
        }

        const result: IFurnitureData[] = [];

        for(const furni of this._floorItems.values())
        {
            result.push(furni);
        }

        for(const furni of this._wallItems.values())
        {
            result.push(furni);
        }

        return result;
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 1037
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getXmlWindow()
    getXmlWindow(name: string): IWindow | null
    {
        try
        {
            return this._windowManager?.buildWidgetLayout(name) ?? null;
        }
        catch
        {
            return null;
        }
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::addProductsReadyEventListener()
    addProductsReadyEventListener(listener: IProductDataListener): void
    {
        if(this._productDataReady)
        {
            listener.productDataReady();

            return;
        }

        this._productDataListeners.add(listener);
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 1109
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::removeFurniDataListener()
    removeFurniDataListener(listener: IFurniDataListener): void
    {
        if(!this._furniDataListeners) return;

        this._furniDataListeners.delete(listener);
    }

    /**
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 1100
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::refreshFurniData()
    refreshFurniData(): void
    {
        this._floorItems = new Map();
        this._wallItems = new Map();
        this._floorItemsByName = new Map();
        this._wallItemsByName = new Map();
        this.initFurnitureData(false);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::openHabboHomePage()
    openHabboHomePage(_userId: number, _userName: string): void
    {
        // Opening external pages is not applicable in this client
        log.debug(`Open Habbo home page: ${_userName}`);
    }

    /**
	 * Pick up all furniture in a room via special chat command.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as pickAllFurniture()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::pickAllFurniture()
    pickAllFurniture(_roomId: number): void
    {
        this.sendSpecialCommandMessage(':pickall');
    }

    /**
	 * Reset game scores in a room via special chat command.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as resetScores()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::resetScores()
    resetScores(_roomId: number): void
    {
        this.sendSpecialCommandMessage(':resetscores');
    }

    /**
	 * Eject all furniture from a room via special chat command.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as ejectAllFurniture()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::ejectAllFurniture()
    ejectAllFurniture(_roomId: number, _message: string): void
    {
        this.sendSpecialCommandMessage(':ejectall');
    }

    /**
	 * Eject all pets from a room via special chat command.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as ejectPets()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::ejectPets()
    ejectPets(_roomId: number): void
    {
        this.sendSpecialCommandMessage(':ejectpets');
    }

    /**
	 * Pick up all builder club furniture via special chat command.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as pickAllBuilderFurniture()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::pickAllBuilderFurniture()
    pickAllBuilderFurniture(_roomId: number): void
    {
        this.sendSpecialCommandMessage(':pickallbc');
    }

    /**
	 * Request credit vault status from server.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as getCreditVaultStatus()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getCreditVaultStatus()
    getCreditVaultStatus(): void
    {
        this.send(new CreditVaultStatusMessageComposer());
    }

    /**
	 * Request income reward status from server.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as getIncomeRewardStatus()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::getIncomeRewardStatus()
    getIncomeRewardStatus(): void
    {
        this.send(new IncomeRewardStatusMessageComposer());
    }

    /**
	 * Withdraw credits from the credit vault.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as withdrawCreditVault()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::withdrawCreditVault()
    withdrawCreditVault(): void
    {
        this.send(new WithdrawCreditVaultMessageComposer());
    }

    /**
	 * Claim an income reward.
	 *
	 * @see sources/win63_version/habbo/session/SessionDataManager.as claimReward()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::claimReward()
    claimReward(rewardId: number): void
    {
        this.send(new IncomeRewardClaimMessageComposer(rewardId));
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::hasNftChatStyle()
    hasNftChatStyle(styleId: number): boolean
    {
        return this._nftChatStyleIds.has(styleId);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::hasPurchasableChatStyle()
    hasPurchasableChatStyle(styleId: number): boolean
    {
        return this._purchasableChatStyleIds.has(styleId);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::sendSpecialCommandMessage()
    sendSpecialCommandMessage(command: string): void
    {
        if(this._communicationManager?.connection)
        {
            this._communicationManager.connection.send(new ChatMessageComposer(command, 0, -1));
        }
    }

    /**
	 * Dispose of the session data manager
	 */
    override dispose(): void
    {
        if(this.disposed) return;

        // Dispose sub-managers
        this._userDataManager?.dispose();
        this._perkManager?.dispose();
        this._ignoredUsersManager?.dispose();
        this._blockedUsersManager?.dispose();
        this._groupInfoManager?.dispose();
        this._badgeImageManager?.dispose();

        this._userDataManager = null;
        this._perkManager = null;
        this._ignoredUsersManager = null;
        this._blockedUsersManager = null;
        this._groupInfoManager = null;
        this._badgeImageManager = null;
        this._roomSessionManager = null;
        this._windowManager = null;
        this._localization = null;
        this._notifications = null;
        this._nftChatStyleIds.clear();
        this._purchasableChatStyleIds.clear();

        // Dispose parsers
        this._furnitureDataParser?.dispose();
        this._loadingFurnitureDataParser?.dispose();
        this._productDataParser?.dispose();

        this._furnitureDataParser = null;
        this._loadingFurnitureDataParser = null;
        this._productDataParser = null;

        // Remove all message event handlers
        for(const event of this._messageEvents)
        {
            this._communicationManager?.removeMessageEvent(event);
        }

        this._messageEvents = [];

        log.debug('SessionDataManager disposed');

        super.dispose();
    }

    /**
	 * Called when configuration properties (furnidata.load.url, productdata.load.url) are available.
	 * Triggers furniture and product data loading.
	 *
	 * In AS3 this is the onConfigurationComplete callback from the
	 * IIDHabboConfigurationManager dependency.
	 *
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 191 onConfigurationComplete()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onConfigurationComplete()
    onConfigurationComplete(): void
    {
        this._products = new Map();
        this._floorItems = new Map();
        this._wallItems = new Map();
        this._floorItemsByName = new Map();
        this._wallItemsByName = new Map();

        this.initFurnitureData();
        this.initProductData();
        this.initBadgeImageManager();
        this.initFurniIconImageManager();
    }

    /**
	 * Idempotent, like AS3's — onConfigurationComplete() can fire more than once and the badge
	 * cache must survive it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::initBadgeImageManager()
    private initBadgeImageManager(): void
    {
        if(this._badgeImageManager !== null) return;

        this._badgeImageManager = new BadgeImageManager(this.assets, this.events, this);
    }

    /**
	 * Idempotent for the same reason as the badge one — onConfigurationComplete() can fire
	 * more than once and the icon cache must survive it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::initFurniIconImageManager()
    private initFurniIconImageManager(): void
    {
        if(this._furniIconImageManager !== null) return;

        this._furniIconImageManager = new FurniIconImageManager(this.assets, this.events, this, this);
    }

    protected override initComponent(): void
    {
        // Initialize sub-managers
        const sendCallback = this.send.bind(this);

        this._userDataManager = new UserDataManager();
        this._userDataManager.connection = this._communicationManager?.connection ?? null;
        this._perkManager = new PerkManager(this);
        this._ignoredUsersManager = new IgnoredUsersManager(this._communicationManager, sendCallback);
        this._blockedUsersManager = new BlockedUsersManager(this._communicationManager, sendCallback, this._notifications);
        this._groupInfoManager = new HabboGroupInfoManager(this._communicationManager, sendCallback);

        this._ignoredUsersManager.initIgnoreList();
        this._blockedUsersManager.initBlockList();
        this.send(new GetUserNftChatStylesMessageComposer());
        this.send(new GetDailyTasksComposer());

        this.registerMessageEvents();

        log.debug('SessionDataManager initialized');
    }

    /**
	 * Initialize furniture data parser and start loading
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 297 initFurnitureData()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::initFurnitureData()
    private initFurnitureData(critical: boolean = true): void
    {
        if(this._loadingFurnitureDataParser)
        {
            this._loadingFurnitureDataParser.dispose();
            this._loadingFurnitureDataParser = null;
        }

        this._loadingFurnitureDataParser = new FurnitureDataParser(
            this._floorItems,
            this._wallItems,
            this._floorItemsByName,
            this._wallItemsByName,
            this._localization,
            critical
        );

        this._loadingFurnitureDataParser.events.on('FDP_furniture_data_ready', () =>
        {
            this.onFurnitureReady();
        });

        if(this.propertyExists('furnidata.load.url'))
        {
            let url = this.getProperty('furnidata.load.url');

            log.debug(`Loading furnidata from: ${url}`);

            if(this._newFurniDataHash)
            {
                const lastSlash = url.lastIndexOf('/');
                const base = url.substring(0, lastSlash);

                url = base + '/' + this._newFurniDataHash;
            }

            this._loadingFurnitureDataParser.loadData(url);
        }
        else
        {
            log.warn('furnidata.load.url property not found in configuration');
        }
    }

    /**
	 * Initialize product data parser and start loading
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 325 initProductData()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::initProductData()
    private initProductData(): void
    {
        if(this._productDataParser)
        {
            this._productDataParser.dispose();
            this._productDataParser = null;
        }

        if(this.propertyExists('productdata.load.url'))
        {
            const url = this.getProperty('productdata.load.url');

            this._productDataParser = new ProductDataParser(url, this._products);
            this._productDataParser.events.on('PDP_product_data_ready', () =>
            {
                this.onProductsReady();
            });
        }
    }

    /**
	 * Handle furniture data ready
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 337 onFurnitureReady()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onFurnitureReady()
    private onFurnitureReady(): void
    {
        if(this._furnitureDataParser)
        {
            this._furnitureDataParser.dispose();
            this._furnitureDataParser = null;
        }

        this._furnitureDataParser = this._loadingFurnitureDataParser;
        this._loadingFurnitureDataParser = null;

        this._furniDataReady = true;

        if(!this._furniDataListenersNotified)
        {
            this._furniDataListenersNotified = true;
            this.notifyFurniDataListeners();
        }

        log.info(`Furniture data ready: ${this._floorItems.size} floor, ${this._wallItems.size} wall items`);
    }

    /**
	 * Handle product data ready
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 1050 onProductsReady()
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onProductsReady()
    private onProductsReady(): void
    {
        this._productDataReady = true;

        for(const listener of this._productDataListeners)
        {
            if(listener != null && !listener.disposed)
            {
                listener.productDataReady();
            }
        }

        this._productDataListeners.clear();

        log.info(`Product data ready: ${this._products.size} products`);
    }

    /**
	 * Set a UI flag
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::setUIFlag()
    private setUIFlag(flag: number, enabled: boolean): void
    {
        if(enabled)
        {
            if(this._uiFlags & flag) return;

            this._uiFlags |= flag;
        }
        else
        {
            if(!(this._uiFlags & flag)) return;

            this._uiFlags &= ~flag;
        }

        this.send(new SetUIFlagsMessageComposer(this._uiFlags));
    }

    /**
	 * Notify all pending furni data listeners
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 351
	 */
    private notifyFurniDataListeners(): void
    {
        for(const listener of this._furniDataListeners)
        {
            listener.furniDataReady();
        }
    }

    /**
	 * Register message event handlers
	 */
    private registerMessageEvents(): void
    {
        // User data events
        this.addMessageEvent(new UserObjectMessageEvent(this.onUserObject.bind(this)));
        this.addMessageEvent(new UserRightsMessageEvent(this.onUserRights.bind(this)));
        this.addMessageEvent(new NoobnessLevelMessageEvent(this.onNoobnessLevel.bind(this)));
        this.addMessageEvent(new IsFirstLoginOfDayMessageEvent(this.onIsFirstLoginOfDay.bind(this)));

        // Availability events
        this.addMessageEvent(new AvailabilityStatusMessageEvent(this.onAvailabilityStatus.bind(this)));

        // Avatar events
        this.addMessageEvent(new FigureUpdateMessageEvent(this.onFigureUpdate.bind(this)));

        // Navigator events
        this.addMessageEvent(new NavigatorSettingsMessageEvent(this.onNavigatorSettings.bind(this)));
        this.addMessageEvent(new FavouritesMessageEvent(this.onFavourites.bind(this)));

        // Notification events
        this.addMessageEvent(new ActivityPointsMessageEvent(this.onActivityPoints.bind(this)));
        this.addMessageEvent(new InfoFeedEnableMessageEvent(this.onInfoFeedEnable.bind(this)));

        // Inventory events
        this.addMessageEvent(new AchievementsScoreMessageEvent(this.onAchievementsScore.bind(this)));
        this.addMessageEvent(new FigureSetIdsMessageEvent(this.onFigureSetIds.bind(this)));
        this.addMessageEvent(new AvatarEffectsMessageEvent(this.onAvatarEffects.bind(this)));

        // Mystery box events
        this.addMessageEvent(new MysteryBoxKeysMessageEvent(this.onMysteryBoxKeys.bind(this)));

        // Catalog events
        this.addMessageEvent(new BuildersClubSubscriptionStatusMessageEvent(this.onBuildersClubStatus.bind(this)));

        // Users events
        this.addMessageEvent(new InClientLinkMessageEvent(this.onInClientLink.bind(this)));

        // Safety & name change events
        this.addMessageEvent(new AccountSafetyLockStatusChangeMessageEvent(this.onAccountSafetyLockStatusChanged.bind(this)));
        this.addMessageEvent(new ChangeUserNameResultMessageEvent(this.onChangeUserNameResult.bind(this)));
        this.addMessageEvent(new UserNameChangedMessageEvent(this.onUserNameChange.bind(this)));
        this.addMessageEvent(new EmailStatusResultEvent(this.onEmailStatus.bind(this)));

        // Room events
        this.addMessageEvent(new RoomReadyMessageEvent(this.onRoomReady.bind(this)));
        this.addMessageEvent(new UserChangeMessageEvent(this.onUserChange.bind(this)));

        // Notification events
        this.addMessageEvent(new PetRespectFailedEvent(this.onPetRespectFailed.bind(this)));

        // Preferences & NFT events
        this.addMessageEvent(new AccountPreferencesEvent(this.onAccountPreferences.bind(this)));
        this.addMessageEvent(new UserNftChatStylesMessageEvent(this.onNftChatStyles.bind(this)));
        this.addMessageEvent(new UserPurchasableChatStylesMessageEvent(this.onPurchasableChatStyles.bind(this)));
        this.addMessageEvent(new UserPurchasableChatStyleChangedMessageEvent(this.onPurchasableChatStyleChanged.bind(this)));
    }

    /**
	 * Add a message event handler
	 */
    private addMessageEvent(event: IMessageEvent): void
    {
        this._communicationManager!.addMessageEvent(event);
        this._messageEvents.push(event);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onUserObject()
    private onUserObject(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserObjectMessageParser;

        if(!parser) return;

        this._userId = parser.id;
        this._userName = parser.name;
        this._realName = parser.realName;
        this._figure = parser.figure;
        this._gender = parser.sex;
        this._customData = parser.customData;
        this._directMail = parser.directMail;
        this._respectTotal = parser.respectTotal;
        this._respectLeft = parser.respectLeft;
        this._respectReplenishesLeft = parser.respectReplenishesLeft;
        this._maxRespectPerDay = parser.maxRespectPerDay;
        this._petRespectLeft = parser.petRespectLeft;
        this._streamPublishingAllowed = parser.streamPublishingAllowed;
        this._lastAccessDate = parser.lastAccessDate;
        this._nameChangeAllowed = parser.nameChangeAllowed;
        this._accountSafetyLocked = parser.accountSafetyLocked;

        // log.info(`User loaded: ${this._userName} (ID: ${this._userId})`);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onUserRights()
    private onUserRights(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserRightsMessageParser;

        if(!parser) return;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::onUserRights()
        // AS3 collapses the server's club level to {0, 2}; it never stores 1.
        this._clubLevel = parser.clubLevel !== 0 ? HabboClubLevelEnum.VIP : HabboClubLevelEnum.NO_CLUB;
        this._securityLevel = parser.securityLevel;
        this._isAmbassador = parser.isAmbassador;

        // Track the highest security level ever seen
        this._topSecurityLevel = Math.max(this._topSecurityLevel, parser.securityLevel);

        log.debug(`Rights: Club=${this._clubLevel}, Security=${this._securityLevel}, Ambassador=${this._isAmbassador}`);
    }

    private onNoobnessLevel(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as NoobnessLevelMessageParser;

        if(!parser) return;

        this._noobnessLevel = parser.noobnessLevel;

        // AS3 sets the new.identity config flag whenever the level is non-zero; this
        // was missing, so nothing downstream that reads new.identity ever saw it.
        if(this._noobnessLevel !== 0)
        {
            this._configurationManager?.setProperty('new.identity', '1');
        }

        log.debug(`Noobness level: ${this._noobnessLevel}`);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onAvailabilityStatus()
    private onAvailabilityStatus(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as AvailabilityStatusMessageParser;

        if(!parser) return;

        this._systemOpen = parser.isOpen;
        this._systemShutDown = parser.onShutDown;
        this._isAuthenticHabbo = parser.isAuthenticHabbo;

        if(this._furniDataReady && !this._furniDataListenersNotified)
        {
            this._furniDataListenersNotified = true;
            this.notifyFurniDataListeners();
        }

        log.debug(`Availability: Open=${this._systemOpen}, ShutDown=${this._systemShutDown}`);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onFigureUpdate()
    private onFigureUpdate(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FigureUpdateMessageParser;

        if(!parser) return;

        this._figure = parser.figure;
        this._gender = parser.gender;

        log.debug(`Figure updated: ${this._figure}`);
    }

    private onIsFirstLoginOfDay(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as IsFirstLoginOfDayMessageParser;

        if(!parser) return;

        this._isFirstLoginOfDay = parser.isFirstLoginOfDay;

        log.debug(`First login of day: ${this._isFirstLoginOfDay}`);
    }

    private onNavigatorSettings(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as NavigatorSettingsMessageParser;

        if(!parser) return;

        this._homeRoomId = parser.homeRoomId;
        this._roomIdToEnter = parser.roomIdToEnter;

        log.debug(`Navigator: HomeRoom=${this._homeRoomId}, RoomToEnter=${this._roomIdToEnter}`);
    }

    private onFavourites(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FavouritesMessageParser;

        if(!parser) return;

        this._favouriteRoomsLimit = parser.limit;
        this._favouriteRooms = [...parser.favouriteRoomIds];

        log.debug(`Favourites: ${this._favouriteRooms.length}/${this._favouriteRoomsLimit}`);
    }

    private onActivityPoints(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as ActivityPointsMessageParser;

        if(!parser) return;

        this._activityPoints = new Map(parser.points);

        log.debug(`Activity points: ${this._activityPoints.size} types`);
    }

    private onInfoFeedEnable(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as InfoFeedEnableMessageParser;

        if(!parser) return;

        this._infoFeedEnabled = parser.enabled;

        log.debug(`Info feed enabled: ${this._infoFeedEnabled}`);
    }

    private onAchievementsScore(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as AchievementsScoreMessageParser;

        if(!parser) return;

        this._achievementScore = parser.score;

        log.debug(`Achievement score: ${this._achievementScore}`);
    }

    private onFigureSetIds(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as FigureSetIdsMessageParser;

        if(!parser) return;

        this._figureSetIds = [...parser.figureSetIds];
        this._boundFurnitureNames = [...parser.boundFurnitureNames];

        log.debug(`Figure sets: ${this._figureSetIds.length}, Bound furniture: ${this._boundFurnitureNames.length}`);
    }

    private onAvatarEffects(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as AvatarEffectsMessageParser;

        if(!parser) return;

        this._avatarEffects = [...parser.effects];

        log.debug(`Avatar effects: ${this._avatarEffects.length}`);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onMysteryBoxKeys()
    private onMysteryBoxKeys(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as MysteryBoxKeysMessageParser;

        if(!parser) return;

        this._mysteryBoxColor = parser.boxColor;
        this._mysteryBoxKeyColor = parser.keyColor;

        this.events.emit(
            MysteryBoxKeysUpdateEvent.MYSTERY_BOX_KEYS_UPDATE,
            new MysteryBoxKeysUpdateEvent(this._mysteryBoxColor, this._mysteryBoxKeyColor)
        );

        log.debug(`Mystery box: color=${this._mysteryBoxColor}, keyColor=${this._mysteryBoxKeyColor}`);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onInClientLink()
    private onInClientLink(event: IMessageEvent): void
    {
        const parser = event.parser as InClientLinkMessageParser;

        if(!parser) return;

        this.context.createLinkEvent(parser.link);

        log.debug('InClientLink: ' + parser.link);
    }

    private onBuildersClubStatus(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as BuildersClubSubscriptionStatusMessageParser;

        if(!parser) return;

        this._buildersClubSecondsLeft = parser.secondsLeft;
        this._buildersClubFurniLimit = parser.furniLimit;
        this._buildersClubMaxFurniLimit = parser.maxFurniLimit;
        this._buildersClubSecondsLeftWithGrace = parser.secondsLeftWithGrace;

        log.debug(`Builders club: ${this._buildersClubSecondsLeft}s left, furni ${this._buildersClubFurniLimit}/${this._buildersClubMaxFurniLimit}`);
    }

    /**
	 * Handle account safety lock status change
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 534
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onAccountSafetyLockStatusChanged()
    private onAccountSafetyLockStatusChanged(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as AccountSafetyLockStatusChangeMessageEventParser;

        if(!parser) return;

        this._accountSafetyLocked = (parser.status === 0);

        log.debug(`Account safety lock: ${this._accountSafetyLocked}`);
    }

    /**
	 * Handle user name change result
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 456
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onChangeUserNameResult()
    private onChangeUserNameResult(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as ChangeUserNameResultMessageParser;

        if(!parser) return;

        if(parser.resultCode === ChangeUserNameResultMessageEvent.NAME_OK)
        {
            this._nameChangeAllowed = false;

            this.events.emit(
                UserNameUpdateEvent.NAME_UPDATE,
                new UserNameUpdateEvent(parser.name)
            );
        }
    }

    /**
	 * Handle user name changed notification
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 440
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onUserNameChange()
    private onUserNameChange(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserNameChangedMessageParser;

        if(!parser) return;

        if(parser.webId === this._userId)
        {
            this._userName = parser.newName;
            this._nameChangeAllowed = false;

            this.events.emit(
                UserNameUpdateEvent.NAME_UPDATE,
                new UserNameUpdateEvent(this._userName)
            );
        }
    }

    /**
	 * Handle NFT chat styles
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 430
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onNftChatStyles()
    private onNftChatStyles(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserNftChatStylesMessageParser;

        if(!parser) return;

        this._nftChatStyleIds = new Set(parser.chatStyleIds);

        log.debug(`NFT chat styles: ${this._nftChatStyleIds.size}`);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onPurchasableChatStyles()
    private onPurchasableChatStyles(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserPurchasableChatStylesMessageParser;

        if(!parser) return;

        this._purchasableChatStyleIds = new Set(parser.chatStyleIds);
    }

    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onPurchasableChatStyleChanged()
    private onPurchasableChatStyleChanged(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as UserPurchasableChatStyleChangedMessageParser;

        if(!parser) return;

        if(parser.added)
        {
            this._purchasableChatStyleIds.add(parser.styleId);
        }
        else
        {
            this._purchasableChatStyleIds.delete(parser.styleId);
        }

        this.events.emit(
            SessionDataToWidgetEvent.PURCHASABLE_STYLES_UPDATED,
            new SessionDataToWidgetEvent(SessionDataToWidgetEvent.PURCHASABLE_STYLES_UPDATED)
        );
    }

    /**
	 * Handle email status result
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 501
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onEmailStatus()
    private onEmailStatus(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as EmailStatusResultParser;

        if(!parser) return;

        this._isEmailVerified = parser.isVerified;

        log.debug(`Email verified: ${this._isEmailVerified}`);
    }

    /**
	 * Handle room ready - tracks visited rooms
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 1064
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onRoomReady()
    private onRoomReady(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomReadyMessageParser;

        if(!parser) return;

        log.debug(`Room visited: ${parser.roomId}`);
    }

    /**
	 * Handle user change - update own figure if applicable
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 404
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onUserChange()
    private onUserChange(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as any;

        if(!parser) return;

        // id == -1 means it's the current user
        if(parser.id === -1)
        {
            if(parser.figure) this._figure = parser.figure;

            if(parser.sex) this._gender = parser.sex;

            log.debug(`User figure changed: ${this._figure}`);
        }
    }

    /**
	 * Handle pet respect failed - restore counter
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 525
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onPetRespectFailed()
    private onPetRespectFailed(_event: IMessageEvent): void
    {
        this._petRespectLeft++;

        log.debug('Pet respect failed, counter restored');
    }

    /**
	 * Handle account preferences
	 * @see source_as_win63/habbo/session/SessionDataManager.as line 493
	 */
    // AS3: .../src/com/sulake/habbo/session/SessionDataManager.as::onAccountPreferences()
    private onAccountPreferences(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as AccountPreferencesParser;

        if(!parser) return;

        this._isRoomCameraFollowDisabled = parser.roomCameraFollowDisabled;
        this._uiFlags = parser.uiFlags;

        this.events.emit(
            SessionDataPreferencesEvent.PREFERENCES_UPDATED,
            new SessionDataPreferencesEvent(this._uiFlags)
        );

        log.debug(`Preferences: cameraFollow=${this._isRoomCameraFollowDisabled}, uiFlags=${this._uiFlags}`);
    }
}
