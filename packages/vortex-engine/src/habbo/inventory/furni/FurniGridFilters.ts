import type {GroupItem} from '@habbo/inventory/items/GroupItem';
import type {FurnitureItem} from '@habbo/inventory/items/FurnitureItem';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import {FurnitureCategory} from '@habbo/inventory/enum/FurnitureCategory';

/**
 * The inventory grid's two dropdowns, as predicates.
 *
 * Every filter the furni grid offers is one of these: a *main* filter (all / floor / wall / room
 * layout) and a *type* filter (sittable, wired, tradable, …). `FurniGridView.passFilter()` asks one
 * of each and nothing else decides whether a group shows.
 *
 * The predicates read three sources and it is worth knowing which, because they disagree: the
 * furniture *data* (`canSitOn`, `furniLine`, the tile size) describes the type, the group's
 * `category` is the inventory's own bucketing, and the *item* (`peek()`) carries what only a
 * specific copy knows — its serial number, whether it can be recycled. A predicate that asked the
 * wrong one would be right for most items and wrong for the interesting ones.
 *
 * **Class name DERIVED.** The AS3 class is `_SafeCls_4087`, obfuscated in the primary tree and
 * present in no other: `win63_version`, PRODUCTION and the 2026-01 dump all have nothing matching
 * `tiles_or_rugs`. Named after what it is — the filter predicates `FurniGridView` asks. Its
 * *members* are readable and are ported under their own names; the six type constants whose names
 * are obfuscated too (`_SafeStr_10907` and friends) are named after their string values, which is
 * what the dropdowns and the wired trade UI pass.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as
 */
export class FurniGridFilters
{
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::MAIN_ALL
    public static readonly MAIN_ALL: string = 'all';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::MAIN_FLOOR_ITEMS
    public static readonly MAIN_FLOOR_ITEMS: string = 'floor_items';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::MAIN_WALL_ITEMS
    public static readonly MAIN_WALL_ITEMS: string = 'wall_items';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::MAIN_ROOM_LAYOUT
    public static readonly MAIN_ROOM_LAYOUT: string = 'room_layout';

    // Name DERIVED (`_SafeStr_10907`): named after its value, which is what the dropdown passes.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_10907
    public static readonly TYPE_ANY: string = 'any';
    // Name DERIVED (`_SafeStr_11381`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_11381
    public static readonly TYPE_SITTABLE: string = 'sittable';
    // Name DERIVED (`_SafeStr_10590`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_10590
    public static readonly TYPE_LAYABLE: string = 'layable';
    // Name DERIVED (`_SafeStr_11171`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_11171
    public static readonly TYPE_TILES_OR_RUGS: string = 'tiles_or_rugs';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_LTD
    public static readonly TYPE_LTD: string = 'ltd';
    // Name DERIVED (`_SafeStr_11696`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_11696
    public static readonly TYPE_WIRED: string = 'wired';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_CREDIT_FURNI
    public static readonly TYPE_CREDIT_FURNI: string = 'credit_furni';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_CLOTHES
    public static readonly TYPE_CLOTHES: string = 'clothes';
    // Name DERIVED (`_SafeStr_11426`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_11426
    public static readonly TYPE_PET_FOOD: string = 'pet_food';
    // Name DERIVED (`_SafeStr_11095`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_11095
    public static readonly TYPE_TRADABLE: string = 'tradable';
    // Name DERIVED (`_SafeStr_11516`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_11516
    public static readonly TYPE_NON_TRADABLE: string = 'non_tradable';
    // Name DERIVED (`_SafeStr_11010`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_11010
    public static readonly TYPE_RECYCLABLE: string = 'recyclable';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_WINDOWS
    public static readonly TYPE_WINDOWS: string = 'windows';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_DIMMERS
    public static readonly TYPE_DIMMERS: string = 'dimmers';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_STICKIES
    public static readonly TYPE_STICKIES: string = 'stickies';
    // Name DERIVED (`_SafeStr_11189`): named after its value.
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::_SafeStr_11189
    public static readonly TYPE_PAINTINGS: string = 'paintings';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_FLOORS
    public static readonly TYPE_FLOORS: string = 'floors';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_WALLPAPERS
    public static readonly TYPE_WALLPAPERS: string = 'wallpapers';
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::TYPE_LANDSCAPE
    public static readonly TYPE_LANDSCAPE: string = 'landscape';

    /** Height at or under which a floor item counts as something you walk over, not around. */
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isTilesOrRugs() (0.2)
    private static readonly RUG_MAX_HEIGHT: number = 0.2;

    /**
     * Wallpaper, floor and landscape together — the three that change the room rather than sit in
     * it.
     */
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isRoomLayout()
    public static isRoomLayout(item: GroupItem | null): boolean
    {
        return FurniGridFilters.hasCategory(
            item, FurnitureCategory.WALL_PAPER, FurnitureCategory.FLOOR, FurnitureCategory.LANDSCAPE
        );
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isWallpaper()
    public static isWallpaper(item: GroupItem | null): boolean
    {
        return FurniGridFilters.hasCategory(item, FurnitureCategory.WALL_PAPER);
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isFloor()
    public static isFloor(item: GroupItem | null): boolean
    {
        return FurniGridFilters.hasCategory(item, FurnitureCategory.FLOOR);
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isLandscape()
    public static isLandscape(item: GroupItem | null): boolean
    {
        return FurniGridFilters.hasCategory(item, FurnitureCategory.LANDSCAPE);
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isSittable()
    public static isSittable(item: GroupItem | null): boolean
    {
        return FurniGridFilters.getFurnitureData(item)?.canSitOn === true;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isLayable()
    public static isLayable(item: GroupItem | null): boolean
    {
        return FurniGridFilters.getFurnitureData(item)?.canLayOn === true;
    }

    /**
     * Anything you can drop furniture on top of and walk across — a rug, a tile, a carpet.
     *
     * The most particular predicate of the twenty, and each clause rules out a specific thing. Two
     * class names are excluded outright (`tile_walkmagic*` teleports, `hole` swallows). A declared
     * `rug`/`floor` category or a `carpet*` class name is enough on its own. Everything else has to
     * *look* like a rug: low, walkable, and at least two tiles on each side — a one-tile item that
     * happens to be flat is a plate, not a rug.
     */
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isTilesOrRugs()
    public static isTilesOrRugs(item: GroupItem | null): boolean
    {
        const data = FurniGridFilters.getFurnitureData(item);

        if(data === null) return false;
        if(data.className.startsWith('tile_walkmagic') || data.className === 'hole') return false;
        if(!data.canPutStuffOn) return false;
        if(data.furniDataCategory === 'rug' || data.furniDataCategory === 'floor') return true;
        if(data.className.startsWith('carpet')) return true;

        return !(data.height > FurniGridFilters.RUG_MAX_HEIGHT
            || !data.canStandOn
            || data.tileSizeX <= 1
            || data.tileSizeY <= 1);
    }

    /**
     * A limited edition — decided by the *copy*, not by the type: a serial number lives on the
     * item's stuff data, so `peek()` is the only source that can answer.
     */
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isLtd()
    public static isLtd(item: GroupItem | null): boolean
    {
        const furniture = FurniGridFilters.getFurnitureItem(item);

        return (furniture?.stuffData?.uniqueSerialNumber ?? 0) > 0;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isWired()
    public static isWired(item: GroupItem | null): boolean
    {
        const data = FurniGridFilters.getFurnitureData(item);

        if(data === null) return false;

        return data.className.startsWith('wf_') || data.furniDataCategory.startsWith('wired_');
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isCreditFurni()
    public static isCreditFurni(item: GroupItem | null): boolean
    {
        return FurniGridFilters.hasCategory(item, FurnitureCategory.CREDIT_FURNI)
            || FurniGridFilters.getClassName(item).startsWith('CF_');
    }

    /** Category 23 — the port calls it `FIGURE_PURCHASABLE_SET`, which is what clothes are. */
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isClothes()
    public static isClothes(item: GroupItem | null): boolean
    {
        return FurniGridFilters.hasCategory(item, FurnitureCategory.FIGURE_PURCHASABLE_SET);
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isPetFood()
    public static isPetFood(item: GroupItem | null): boolean
    {
        const data = FurniGridFilters.getFurnitureData(item);

        if(data === null) return false;

        return data.className.startsWith('petfood') || data.furniLine === 'pet_food';
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isTradable()
    public static isTradable(item: GroupItem | null): boolean
    {
        return FurniGridFilters.getFurnitureData(item)?.tradeable === true;
    }

    /**
     * Not simply `!isTradable()`: an item with no furniture data is neither, and AS3 answers false
     * to both rather than putting it in the non-tradable bucket by default.
     */
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isNonTradable()
    public static isNonTradable(item: GroupItem | null): boolean
    {
        const data = FurniGridFilters.getFurnitureData(item);

        return data !== null && !data.tradeable;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isRecyclable()
    public static isRecyclable(item: GroupItem | null): boolean
    {
        return FurniGridFilters.getFurnitureItem(item)?.recyclable === true;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isWindow()
    public static isWindow(item: GroupItem | null): boolean
    {
        const data = FurniGridFilters.getFurnitureData(item);

        if(data === null) return false;

        return data.className.startsWith('window_')
            || data.furniLine === 'windows'
            || data.furniDataCategory === 'window';
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isDimmer()
    public static isDimmer(item: GroupItem | null): boolean
    {
        const data = FurniGridFilters.getFurnitureData(item);

        if(data === null) return false;

        return data.className.startsWith('dimmer_')
            || data.furniDataCategory === 'dimmer'
            || data.furniLine === 'dimmers';
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isStickie()
    public static isStickie(item: GroupItem | null): boolean
    {
        return FurniGridFilters.hasCategory(item, FurnitureCategory.POST_IT);
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::isPainting()
    public static isPainting(item: GroupItem | null): boolean
    {
        return FurniGridFilters.getClassName(item).startsWith('diamond_painting');
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::getFurnitureData()
    private static getFurnitureData(item: GroupItem | null): IFurnitureData | null
    {
        return item?.furniData ?? null;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::getClassName()
    private static getClassName(item: GroupItem | null): string
    {
        return item?.className ?? '';
    }

    /**
     * The first item in the group, which is what the copy-specific predicates read. Every copy in a
     * group shares a type, so any of them answers for serial number and recyclability alike.
     */
    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::getFurnitureItem()
    private static getFurnitureItem(item: GroupItem | null): FurnitureItem | null
    {
        return item?.peek() ?? null;
    }

    // AS3: .../src/com/sulake/habbo/inventory/furni/_SafeCls_4087.as::hasCategory()
    private static hasCategory(item: GroupItem | null, ...categories: number[]): boolean
    {
        if(item === null) return false;

        return categories.indexOf(item.category) !== -1;
    }
}
