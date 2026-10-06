/**
 * Layout window names matched by `CatalogPage.createWidget()`'s switch to pick a widget class.
 *
 * TS-only: these are data-driven layout/asset names baked into the compiled window JSON (the
 * AS3 switch matches the same raw string literals directly, with no source-level constant of
 * its own to port) - not an AS3 member.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/CatalogPage.as::createWidget()
 */
export class CatalogWidgetName
{
    // Ported (registered in CatalogPage.createWidget()).
    static readonly ITEM_GRID: string = 'itemGridWidget';
    static readonly SIMPLE_PRICE: string = 'simplePriceWidget';
    static readonly PRODUCT_VIEW: string = 'productViewWidget';
    static readonly SINGLE_VIEW: string = 'singleViewWidget';
    static readonly PURCHASE: string = 'purchaseWidget';
    static readonly SPINNER: string = 'spinnerWidget';
    static readonly TOTAL_PRICE: string = 'totalPriceWidget';
    static readonly LIMITED_ITEM: string = 'limitedItemWidget';
    static readonly TEXT_INPUT: string = 'textInputWidget';
    static readonly SPECIAL_INFO: string = 'specialInfoWidget';
    static readonly WARNING: string = 'warningWidget';
    static readonly FIRST_PRODUCT_AUTO_SELECTOR: string = 'firstProductAutoSelectorWidget';
    static readonly SOLD_LTD_ITEMS: string = 'soldLtdItemsWidget';
    static readonly MAD_MONEY: string = 'madMoneyWidget';
    static readonly ADD_ON_BADGE_VIEW: string = 'addOnBadgeViewWidget';
    static readonly FEATURED_ITEMS: string = 'featuredItemsWidget';
    static readonly COLOUR_GRID: string = 'colourGridWidget';
    static readonly BUNDLE_GRID_SCROLL: string = 'bundleGridScrollWidget';
    static readonly ACTIVITY_POINT_DISPLAY: string = 'activityPointDisplayWidget';
    static readonly REDEEM_ITEM_CODE: string = 'redeemItemCodeWidget';
    static readonly SPACES_NEW: string = 'spacesNewWidget';
    static readonly CLUB_GIFT: string = 'clubGiftWidget';
    static readonly CLUB_BUY: string = 'clubBuyWidget';
    static readonly VIP_BUY: string = 'vipBuyWidget';
    static readonly LOYALTY_VIP_BUY: string = 'loyaltyVipBuyWidget';
    static readonly VIP_GIFT: string = 'vipGiftWidget';
    static readonly MARKET_PLACE: string = 'marketPlaceWidget';
    static readonly MARKET_PLACE_OWN_ITEMS: string = 'marketPlaceOwnItemsWidget';
    static readonly RECYCLER: string = 'recyclerWidget';
    static readonly RECYCLER_PRIZES: string = 'recyclerPrizesWidget';
    // TS-only: see the class note - these are raw layout names, not AS3 members.
    static readonly ROOM_ADS_CATALOG: string = 'roomAdsCatalogWidget';

    // Not ported yet - listed so future work registers its case via this constant instead of a
    // raw string literal (see this session's roadmap in docs/IMPLEMENTATION_STATUS.md).
    static readonly SONG_DISK_PRODUCT_VIEW: string = 'songDiskProductViewWidget';
    static readonly TRAX_PREVIEW: string = 'traxPreviewWidget';
    static readonly ROOM_PREVIEW: string = 'roomPreviewWidget';
    static readonly TROPHY: string = 'trophyWidget';
    static readonly PETS: string = 'petsWidget';
    static readonly NEW_PETS: string = 'newPetsWidget';
    static readonly BUY_GUILD: string = 'buyGuildWidget';
    static readonly GUILD_BADGE_VIEW: string = 'guildBadgeViewWidget';
    static readonly GUILD_SELECTOR: string = 'guildSelectorWidget';
    static readonly GUILD_FORUM_SELECTOR: string = 'guildForumSelectorWidget';
    static readonly PET_PREVIEW: string = 'petPreviewWidget';
    static readonly BUNDLE_PURCHASE_EXTRA_INFO: string = 'bundlePurchaseExtraInfoWidget';
    static readonly USER_BADGE_SELECTOR: string = 'userBadgeSelectorWidget';
}
