import type {EventEmitter} from 'eventemitter3';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IMessageComposer} from '@ambreia/net/messages/IMessageComposer';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {IHabboLocalizationManager} from '../localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IAvatarEffect} from '../communication/messages/parser/inventory/AvatarEffectsMessageParser';
import type {IUserDataManager} from './IUserDataManager';
import type {IPerkManager} from './IPerkManager';
import type {IIgnoredUsersManager} from './IIgnoredUsersManager';
import type {IHabboGroupInfoManager} from './IHabboGroupInfoManager';
import type {IRoomSessionManager} from './IRoomSessionManager';
import type {IFurnitureData} from './furniture/IFurnitureData';
import type {IFurniDataListener} from './furniture/IFurniDataListener';
import type {IProductData} from './product/IProductData';
import type {IProductDataListener} from './product/IProductDataListener';
import type {BadgeInfo} from './BadgeInfo';

/**
 * Interface for session data manager
 * Manages user session data after authentication
 * @see source_as_win63/habbo/session/ISessionDataManager.as
 */
export interface ISessionDataManager extends IDisposable
{
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get events()
    readonly events: EventEmitter;
    readonly communication: IHabboCommunicationManager | null;
    readonly userDataManager: IUserDataManager;
    readonly perkManager: IPerkManager;
    readonly ignoredUsersManager: IIgnoredUsersManager;
    readonly groupInfoManager: IHabboGroupInfoManager;
    readonly roomSessionManager: IRoomSessionManager | null;
    readonly windowManager: IHabboWindowManager | null;
    readonly localization: IHabboLocalizationManager | null;

    // System status
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get systemOpen()
    readonly systemOpen: boolean;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get systemShutDown()
    readonly systemShutDown: boolean;
    readonly isAuthenticHabbo: boolean;

    // User data
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get userId()
    readonly userId: number;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get userName()
    readonly userName: string;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get realName()
    readonly realName: string;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get figure()
    readonly figure: string;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get gender()
    readonly gender: string;
    readonly motto: string;

    // Security & status
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get clubLevel()
    readonly clubLevel: number;
    readonly securityLevel: number;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get topSecurityLevel()
    readonly topSecurityLevel: number;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get isAmbassador()
    readonly isAmbassador: boolean;
    readonly noobnessLevel: number;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get hasVip()
    readonly hasVip: boolean;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get hasClub()
    readonly hasClub: boolean;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get isNoob()
    readonly isNoob: boolean;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get isRealNoob()
    readonly isRealNoob: boolean;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get isAnyRoomController()
    readonly isAnyRoomController: boolean;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get nameChangeAllowed()
    readonly nameChangeAllowed: boolean;
    readonly canChangeName: boolean;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get isEmailVerified()
    readonly isEmailVerified: boolean;

    // Respect
    readonly respectTotal: number;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get respectLeft()
    readonly respectLeft: number;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get respectReplenishesLeft()
    readonly respectReplenishesLeft: number;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get petRespectLeft()
    readonly petRespectLeft: number;
    readonly respectsReceived: number;
    readonly respectsRemaining: number;
    readonly respectsPetRemaining: number;

    // Safety
    readonly accountSafetyLocked: boolean;
    readonly safetyLocked: boolean;

    // Stream & access
    readonly streamPublishingAllowed: boolean;
    readonly lastAccessDate: string;
    readonly isFirstLoginOfDay: boolean;

    // Navigator
    readonly homeRoomId: number;
    readonly roomIdToEnter: number;
    readonly favouriteRooms: number[];
    readonly favouriteRoomsLimit: number;

    // Currency & achievements
    readonly activityPoints: Map<number, number>;
    readonly achievementScore: number;

    // UI preferences
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get uiFlags()
    readonly uiFlags: number;
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get isRoomCameraFollowDisabled()
    readonly isRoomCameraFollowDisabled: boolean;
    readonly infoFeedEnabled: boolean;

    // Figure & effects
    readonly figureSetIds: number[];
    readonly boundFurnitureNames: string[];
    readonly avatarEffects: IAvatarEffect[];

    // Perks
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get perksReady()
    readonly perksReady: boolean;

    // Talent
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::get currentTalentTrack()
    readonly currentTalentTrack: string;
    newFurniDataHash: string;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::hasSecurity()
    hasSecurity(level: number): boolean;

    send(composer: IMessageComposer<unknown[]>): void;

    // Respect
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::giveRespect()
    giveRespect(userId: number): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::givePetRespect()
    givePetRespect(petId: number): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::giveRespectFailed()
    giveRespectFailed(): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::replenishRespect()
    replenishRespect(): void;

    // UI preferences
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::setRoomCameraFollowDisabled()
    setRoomCameraFollowDisabled(disabled: boolean): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::setFriendBarState()
    setFriendBarState(open: boolean): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::setRoomToolsState()
    setRoomToolsState(open: boolean): void;

    // Perks
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::isPerkAllowed()
    isPerkAllowed(perk: string): boolean;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getPerkErrorMessage()
    getPerkErrorMessage(perk: string): string;

    // Ignored users
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::isIgnored()
    isIgnored(userId: number): boolean;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::ignoreUser()
    ignoreUser(userId: number): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::unignoreUser()
    unignoreUser(userId: number): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::isBlocked()
    isBlocked(userId: number): boolean;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::blockUser()
    blockUser(userId: number): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::unblockUser()
    unblockUser(userId: number): void;

    // Safety
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::isAccountSafetyLocked()
    isAccountSafetyLocked(): boolean;

    // Badge images — every one of these delegates straight to BadgeImageManager in AS3.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getFurniIconImage()
    getFurniIconImage(wallItem: boolean, typeId: number, extra: string): HTMLImageElement | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getFurniIconImageAssetName()
    getFurniIconImageAssetName(wallItem: boolean, typeId: number, extra: string): string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getBadgeImage()
    getBadgeImage(badge: string): HTMLImageElement | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getBadgeSmallImage()
    getBadgeSmallImage(badge: string): HTMLImageElement | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getBadgeImageAssetName()
    getBadgeImageAssetName(badge: string): string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getBadgeImageSmallAssetName()
    getBadgeImageSmallAssetName(badge: string): string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::requestBadgeImage()
    requestBadgeImage(badge: string): HTMLImageElement | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getBadgeImageWithInfo()
    getBadgeImageWithInfo(badge: string): BadgeInfo;

    // Group badge images
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getGroupBadgeId()
    getGroupBadgeId(groupId: number): string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getGroupBadgeImage()
    getGroupBadgeImage(badge: string): HTMLImageElement | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getGroupBadgeSmallImage()
    getGroupBadgeSmallImage(badge: string): HTMLImageElement | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getGroupBadgeAssetName()
    getGroupBadgeAssetName(badge: string): string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getGroupBadgeSmallAssetName()
    getGroupBadgeSmallAssetName(badge: string): string | null;

    // Furniture data
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getProductData()
    getProductData(productCode: string): IProductData | null;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getFloorItemData()
    getFloorItemData(itemId: number): IFurnitureData | null;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getFloorItemsDataByCategory()
    getFloorItemsDataByCategory(category: number): IFurnitureData[];

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getWallItemData()
    getWallItemData(itemId: number): IFurnitureData | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getAllFloorItemDatas()
    getAllFloorItemDatas(): IFurnitureData[];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/ISessionDataManager.as::getAllWallItemDatas()
    getAllWallItemDatas(): IFurnitureData[];

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getFloorItemDataByName()
    getFloorItemDataByName(name: string, index?: number): IFurnitureData | null;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getWallItemDataByName()
    getWallItemDataByName(name: string, index?: number): IFurnitureData | null;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::loadProductData()
    loadProductData(listener?: IProductDataListener): boolean;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getFurniData()
    getFurniData(listener: IFurniDataListener): IFurnitureData[] | null;

    getXmlWindow(name: string): IWindow | null;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::addProductsReadyEventListener()
    addProductsReadyEventListener(listener: IProductDataListener): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::removeFurniDataListener()
    removeFurniDataListener(listener: IFurniDataListener): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::refreshFurniData()
    refreshFurniData(): void;

    // Configuration callback
    onConfigurationComplete(): void;

    // Room actions
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::openHabboHomePage()
    openHabboHomePage(userId: number, userName: string): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::pickAllFurniture()
    pickAllFurniture(roomId: number): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::resetScores()
    resetScores(roomId: number): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::ejectAllFurniture()
    ejectAllFurniture(roomId: number, message: string): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::ejectPets()
    ejectPets(roomId: number): void;

    // Credit vault & rewards
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getCreditVaultStatus()
    getCreditVaultStatus(): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::getIncomeRewardStatus()
    getIncomeRewardStatus(): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::withdrawCreditVault()
    withdrawCreditVault(): void;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::claimReward()
    claimReward(rewardId: number): void;

    // NFT
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::hasNftChatStyle()
    hasNftChatStyle(styleId: number): boolean;

    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::hasPurchasableChatStyle()
    hasPurchasableChatStyle(styleId: number): boolean;

    // Special command
    // AS3: .../src/com/sulake/habbo/session/ISessionDataManager.as::sendSpecialCommandMessage()
    sendSpecialCommandMessage(command: string): void;

    dispose(): void;
}
