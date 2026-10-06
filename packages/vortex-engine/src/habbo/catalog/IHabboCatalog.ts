import type {IDragAndDropDoneReceiver} from './viewer/IDragAndDropDoneReceiver';
import type {IOfferCenter} from './offers/IOfferCenter';
import type {IOfferExtension} from './offers/IOfferExtension';
import type {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IVideoOfferManager} from './IVideoOfferManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboCatalogPurse} from './purse/IHabboCatalogPurse';
import type {IEarningsController} from './earnings/IEarningsController';
import type {IProductData} from '@habbo/session/product/IProductData';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IPurchasableOffer} from './IPurchasableOffer';
import type {HabboCatalogUtils} from './HabboCatalogUtils';
import type {ICatalogNavigator} from './navigation/ICatalogNavigator';
import type {FrontPageItem} from '@habbo/communication/messages/incoming/catalog/FrontPageItem';
import type {IMarketPlace} from './marketplace/IMarketPlace';
import type {IRecycler} from './recycler/IRecycler';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';

/**
 * Interface for the Habbo catalog.
 *
 * The purse-area implementation uses the same AS3 catalog-owned purse/event flow.
 *
 * @see sources/win63_version/habbo/catalog/IHabboCatalog.as
 */
export interface IHabboCatalog
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/IHabboCatalog.as::get assets()
    readonly assets: IAssetLibrary | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/IHabboCatalog.as::get videoOffers()
    readonly videoOffers: IVideoOfferManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/IHabboCatalog.as::get navigator()
    readonly navigator: IHabboNavigator | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get windowManager()
    readonly windowManager: IHabboWindowManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/IHabboCatalog.as::get events()
    readonly events: EventEmitter;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get localization()
    readonly localization: IHabboLocalizationManager | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get connection()
    readonly connection: IConnection | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get privateRoomSessionActive()
    readonly privateRoomSessionActive: boolean;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get tradingActive()
    readonly tradingActive: boolean;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get imageGalleryHost()
    readonly imageGalleryHost: string;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get catalogType()
    readonly catalogType: string;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get utils()
    readonly utils: HabboCatalogUtils;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get currentCatalogNavigator()
    readonly currentCatalogNavigator: ICatalogNavigator | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::get frontPageItems()
    readonly frontPageItems: FrontPageItem[] | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get specialItemsController()
    readonly specialItemsController: unknown;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get avatarEditor()
    readonly avatarEditor: unknown;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::get notifications()
    readonly notifications: IHabboNotifications | null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getSeasonalCurrencyActivityPointType()
    getSeasonalCurrencyActivityPointType(): number;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::redeemVoucher()
    redeemVoucher(voucher: string): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::loadCatalogPage()
    loadCatalogPage(pageId: number, offerId: number, catalogType: string): void;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::sendGetProductOffer()
    sendGetProductOffer(offerId: number): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getRecyclerStatus()
    getRecyclerStatus(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getRecyclerPrizes()
    getRecyclerPrizes(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::sendRecycleItems()
    sendRecycleItems(items: number[]): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::toggleCatalog()
    toggleCatalog(catalogType: string, forceOpen?: boolean, showMainWindow?: boolean): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openCatalog()
    openCatalog(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openCatalogPage()
    openCatalogPage(pageName: string, catalogType?: string | null): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openRoomAdCatalogPageInExtendedMode()
    openRoomAdCatalogPageInExtendedMode(
        roomId: string,
        roomName: string,
        flatId: string,
        description: string,
        expiration: Date,
        categoryId: number
    ): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openCatalogPageById()
    openCatalogPageById(pageId: number, offerId: number, catalogType: string): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openCatalogPageByOfferId()
    openCatalogPageByOfferId(offerId: number, catalogType: string): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openInventoryCategory()
    openInventoryCategory(category: string): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openCreditsHabblet()
    openCreditsHabblet(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::setupInventoryForRecycler()
    setupInventoryForRecycler(enabled: boolean): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::requestInventoryFurniToRecycler()
    requestInventoryFurniToRecycler(): number;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::returnInventoryFurniFromRecycler()
    returnInventoryFurniFromRecycler(itemId: number): boolean;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getProductData()
    getProductData(localizationId: string): IProductData | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getFurnitureData()
    getFurnitureData(classId: number, productType: string): IFurnitureData | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getPixelEffectIcon()
    getPixelEffectIcon(effectId: number): ImageBitmap | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getSubscriptionProductIcon()
    getSubscriptionProductIcon(productId: number): ImageBitmap | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::isDraggable()
    isDraggable(offer: IPurchasableOffer): boolean;

    /**
	 * Hands an offer to the room engine's inserter so the next click in the room places it. The
	 * receiver is told through `onDragAndDropDone()` once the placement lands or is cancelled.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::requestSelectedItemToMover()
    requestSelectedItemToMover(receiver: IDragAndDropDoneReceiver | null, offer: IPurchasableOffer, placeMany?: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalog.as::cancelFurniInMover()
    cancelFurniInMover(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::setImageFromAsset()
    setImageFromAsset(target: unknown, assetName: string | null, onAssetReady?: ((event: unknown) => void) | null): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getPurse()
    getPurse(): IHabboCatalogPurse;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getEarnings()
    getEarnings(): IEarningsController | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getRecycler()
    getRecycler(): IRecycler | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getMarketPlace()
    getMarketPlace(): IMarketPlace | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getPublicMarketPlaceOffers()
    getPublicMarketPlaceOffers(minPrice: number, maxPrice: number, searchString: string, category: number, combineUniques?: boolean): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getOwnMarketPlaceOffers()
    getOwnMarketPlaceOffers(category?: number): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::cancelAllMarketPlaceOffers()
    cancelAllMarketPlaceOffers(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::clearOwnMarketPlaceHistory()
    clearOwnMarketPlaceHistory(status: number): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::buyMarketPlaceOffer()
    buyMarketPlaceOffer(offerId: number): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::redeemSoldMarketPlaceOffers()
    redeemSoldMarketPlaceOffers(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::redeemExpiredMarketPlaceOffer()
    redeemExpiredMarketPlaceOffer(offerId: number): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getMarketplaceItemStats()
    getMarketplaceItemStats(category: number, furniId: number, extraData?: string | null): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::showNotEnoughCreditsAlert()
    showNotEnoughCreditsAlert(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::showNotEnoughActivityPointsAlert()
    showNotEnoughActivityPointsAlert(activityPointType: number): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getHabboClubOffers()
    getHabboClubOffers(clubType: number): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openClubCenter()
    openClubCenter(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openVault()
    openVault(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::verifyClubLevel()
    verifyClubLevel(clubLevel?: number): boolean;
    giftReceiver: string;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::showVipBenefits()
    showVipBenefits(): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::displayProductIcon()
    displayProductIcon(productType: string, classId: number, target: unknown): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::openRentConfirmationWindow()
    openRentConfirmationWindow(data: unknown, isWallItem: boolean, extraParam?: number, price?: number, rent?: boolean): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getCatalogNavigator()
    getCatalogNavigator(catalogType: string): ICatalogNavigator | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getOfferCenter()
    getOfferCenter(extension: IOfferExtension | null): IOfferCenter | null;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::itemAddedToInventory()
    itemAddedToInventory(classId: number, itemId: number, category: number): void;
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalog.as::getActivityPointName()
    getActivityPointName(activityPointType: number): string;
}
