/**
 * FurnitureFurniChestVisualization
 *
 * Draws up to four item icons floating above an open furni chest.
 *
 * The icons are extra sprite layers appended past the visualization's own: the logic writes the
 * comma-joined asset names into `furniture_furni_chest_shown_asset_names`, and every per-sprite
 * hook below answers for layer indices in the last four slots. Their offsets, alpha, flip and
 * bob phase are randomised once per contents change in `createIconAssets()` and then read back
 * from `_iconData`, so the arrangement is stable until the chest's contents change.
 *
 * Name DERIVED: `_SafeCls_1802` in the primary tree, absent from the 2016 one — named for the
 * `furniture_furnichest` visualization type the factory maps to it.
 *
 * Two AS3 constants are deliberately not ported: `_SafeStr_11449` (1200) and
 * `INDIVIDUAL_FLOATING_ENABLED` (false) are declared and never read in the AS3 body either.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as
 */
import type {IGraphicAsset} from '@room/object/visualization/utils/IGraphicAsset';
import {GlowFilter} from '@core/utils/GlowFilter';
import {FurnitureChestVisualization} from './FurnitureChestVisualization';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';

export class FurnitureFurniChestVisualization extends FurnitureChestVisualization
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::FLOATING_ICON_TAG_PREFIX
    private static readonly FLOATING_ICON_TAG_PREFIX: string = 'floating_icon_';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::_SafeStr_11652
    // (name DERIVED from the value: it is the extra sprite count and the cap on the icons drawn.)
    private static readonly MAX_FLOATING_ICONS: number = 4;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::FLOATING_PIXELS
    private static readonly FLOATING_PIXELS: number = 2;

    /**
	 * AS3 builds the array at class-load time; this port defers it to first use, the way
	 * `RoomObjectHighLighter` already defers its own shared filters.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::FLOATING_ICON_GLOW_FILTER
    private static _floatingIconGlowFilter: unknown[] | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::ICON_POSITIONING
    // Indexed by icon count, then by icon: [x, y, xJitter, yJitter].
    private static readonly ICON_POSITIONING: number[][][] = [
        [],
        [[0, -68, 17, 17]],
        [[16, -70, 4, 4], [-14, -59, 4, 4]],
        [[12, -52, 2, 2], [-17, -70, 3, 2], [17, -87, 7, 2]],
        [[14, -50, 2, 2], [-14, -59, 2, 2], [19, -78, 4, 2], [-20, -90, 4, 2]]
    ];

    // Name DERIVED from what it holds; the AS3 field is obfuscated in every tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::_SafeStr_5778
    private _icons: (IGraphicAsset | null)[] | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::_lastAssetsStr
    private _lastAssetsStr: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::_assetNames
    // Renamed: AS3 privates do not collide across a class hierarchy, TypeScript's do, and
    // FurnitureVisualization already declares an unrelated `_assetNames`.
    private _iconAssetNames: string[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::_SafeStr_8446
    // (name DERIVED: the per-chest random that decides which way the icon offsets start out.)
    private _flipBase: boolean = false;

    /**
	 * One entry per icon: [x, y, flip, width, height, alpha, zOffset, phaseOffset].
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::_SafeStr_5165
    private _iconData: [number, number, boolean, number, number, number, number, number][] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::_SafeStr_6021
    // (name DERIVED: the bob counter `getSpriteYOffset()` folds into a triangle wave.)
    private _floatPhase: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::_lastFloatUpdate
    private _lastFloatUpdate: number = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::updateModel()
    protected override updateModel(scale: number): boolean
    {
        let changed = super.updateModel(scale);

        let names = this.object?.getModel()?.getString(RoomObjectVariableEnum.FURNITURE_FURNI_CHEST_SHOWN_ASSET_NAMES) ?? null;

        // Only the 64 scale draws icons at all.
        if(names === null || scale !== 64) names = '';

        if(this._lastAssetsStr !== names)
        {
            this._lastAssetsStr = names;
            this._iconAssetNames = this._lastAssetsStr.length === 0 ? [] : this._lastAssetsStr.split(',');

            this.createIconAssets();

            changed = true;
        }

        return changed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::updateObject()
    protected override updateObject(scale: number, geometryDirection: number): boolean
    {
        let changed = super.updateObject(scale, geometryDirection);

        if(this._lastUpdateTime - this._lastFloatUpdate > 300)
        {
            changed = true;

            this._lastFloatUpdate = this._lastUpdateTime;

            this._floatPhase += 1;

            if(this._floatPhase >= 2 * FurnitureFurniChestVisualization.FLOATING_PIXELS) this._floatPhase = 0;
        }

        return changed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getAdditionalSpriteCount()
    protected override getAdditionalSpriteCount(scale: number): number
    {
        return super.getAdditionalSpriteCount(scale) + FurnitureFurniChestVisualization.MAX_FLOATING_ICONS;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteAssetName()
    protected override getSpriteAssetName(scale: number, layerIndex: number): string
    {
        if(!this.isFloatingIcon(layerIndex) || scale !== 64) return super.getSpriteAssetName(scale, layerIndex);

        const index = this.iconIndex(layerIndex);

        if(index < 0 || index >= this._iconAssetNames.length) return super.getSpriteAssetName(scale, layerIndex);

        return this._iconAssetNames[index];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::isFloatingIcon()
    private isFloatingIcon(layerIndex: number): boolean
    {
        const index = this.iconIndex(layerIndex);

        return index >= 0 && index < this._iconData.length;
    }

    // TS-only: AS3 repeats `param3 - spriteCount + 4` inline in ten places.
    private iconIndex(layerIndex: number): number
    {
        return layerIndex - this.spriteCount + FurnitureFurniChestVisualization.MAX_FLOATING_ICONS;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::reset()
    protected override reset(): void
    {
        super.reset();

        this.clearIconAssets();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::clearIconAssets()
    private clearIconAssets(): void
    {
        this._icons = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::createIconAssets()
    private createIconAssets(): void
    {
        if(this._icons !== null) this.clearIconAssets();

        this._icons = [];
        this._iconData = [];
        this._flipBase = Math.random() < 0.5;
        this._floatPhase = 0;
        this._lastFloatUpdate = this._lastUpdateTime;

        const count = Math.min(FurnitureFurniChestVisualization.MAX_FLOATING_ICONS, this._iconAssetNames.length);

        for(let i = 0; i < count; i++)
        {
            const layerIndex = this.spriteCount - FurnitureFurniChestVisualization.MAX_FLOATING_ICONS + i;
            const asset = this.getSpriteAssetName(64, layerIndex);
            const graphic = this.assetCollection?.getAsset(asset) ?? null;

            this._icons.push(graphic);

            const position = FurnitureFurniChestVisualization.ICON_POSITIONING[count][i];

            // AS3 types every one of these as int, so they truncate toward zero rather than round.
            const x = Math.trunc(position[0] + Math.random() * (position[2] + 1) - position[2] / 2);
            const y = Math.trunc(position[1] + Math.random() * (position[3] + 1) - position[3] / 2);
            const flip = Math.random() < 0.5;
            const width = Math.trunc(graphic?.width ?? 0);
            const height = Math.trunc(graphic?.height ?? 0);
            const alpha = FurnitureFurniChestVisualization.calculateAlphaForYOffset(y);
            const zOffset = 0.001 + y / 10000;

            this._iconData.push([x, y, flip, width, height, alpha, zOffset, 0]);
        }
    }

    /**
	 * The higher an icon floats, the fainter it gets — clamped to the 0.4..0.9 band.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::calculateAlphaForYOffset()
    private static calculateAlphaForYOffset(y: number): number
    {
        const ratio = (y - -40) / (-100 - -40);

        return Math.min(Math.max(0.9 + (0.4 - 0.9) * ratio, 0.4), 0.9);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getAsset()
    protected override getAsset(name: string, layerIndex: number = -1): IGraphicAsset | null
    {
        if(this.isFloatingIcon(layerIndex))
        {
            const index = this.iconIndex(layerIndex);

            if(this._icons === null) this.createIconAssets();

            const icon = this._icons?.[index] ?? null;

            if(icon !== null) return icon;
        }

        return super.getAsset(name, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteTag()
    protected override getSpriteTag(scale: number, direction: number, layerIndex: number): string
    {
        if(this.isFloatingIcon(layerIndex))
        {
            return FurnitureFurniChestVisualization.FLOATING_ICON_TAG_PREFIX + this.iconIndex(layerIndex);
        }

        return super.getSpriteTag(scale, direction, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteAlpha()
    protected override getSpriteAlpha(scale: number, direction: number, layerIndex: number): number
    {
        const alpha = super.getSpriteAlpha(scale, direction, layerIndex);

        if(this.isFloatingIcon(layerIndex))
        {
            return Math.trunc(this._iconData[this.iconIndex(layerIndex)][5] * alpha);
        }

        return alpha;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteMouseCapture()
    protected override getSpriteMouseCapture(scale: number, direction: number, layerIndex: number): boolean
    {
        if(this.isFloatingIcon(layerIndex)) return false;

        return super.getSpriteMouseCapture(scale, direction, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteXOffset()
    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(!this.isFloatingIcon(layerIndex)) return super.getSpriteXOffset(scale, direction, layerIndex);

        const data = this._iconData[this.iconIndex(layerIndex)];
        const mirrored = (direction / 2) % 2 === 1;

        let x = data[0];

        if(this._flipBase !== mirrored) x = -x;

        return Math.trunc(x - data[3] / 2);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteYOffset()
    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(!this.isFloatingIcon(layerIndex)) return super.getSpriteYOffset(scale, direction, layerIndex);

        const data = this._iconData[this.iconIndex(layerIndex)];
        const pixels = FurnitureFurniChestVisualization.FLOATING_PIXELS;

        // The counter runs 0..2*FLOATING_PIXELS and folds back on itself, so the icon bobs up
        // and down rather than snapping back to the bottom.
        let bob = (this._floatPhase + data[7]) % (2 * pixels);

        if(bob > pixels) bob = pixels - (bob - pixels);

        return Math.trunc(data[1] + data[4] / 2 - bob);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteZOffset()
    protected override getSpriteZOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(this.isFloatingIcon(layerIndex)) return this._iconData[this.iconIndex(layerIndex)][6];

        return super.getSpriteZOffset(scale, direction, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteInk()
    protected override getSpriteInk(scale: number, direction: number, layerIndex: number): number
    {
        if(this.isFloatingIcon(layerIndex)) return 0;

        return super.getSpriteInk(scale, direction, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteFilters()
    protected override getSpriteFilters(scale: number, direction: number, layerIndex: number): unknown[] | null
    {
        if(this.isFloatingIcon(layerIndex))
        {
            if(FurnitureFurniChestVisualization._floatingIconGlowFilter === null)
            {
                FurnitureFurniChestVisualization._floatingIconGlowFilter = [
                    new GlowFilter(0xFFFFFF, 1, 2, 2, 10, 1, false, false)
                ];
            }

            return FurnitureFurniChestVisualization._floatingIconGlowFilter;
        }

        return super.getSpriteFilters(scale, direction, layerIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1802.as::getSpriteFlipH()
    protected override getSpriteFlipH(scale: number, direction: number, layerIndex: number): boolean
    {
        if(!this.isFloatingIcon(layerIndex)) return super.getSpriteFlipH(scale, direction, layerIndex);

        const mirrored = (direction / 2) % 2 === 1;
        const own = this._iconData[this.iconIndex(layerIndex)][2];

        // AS3 chains the comparison — `_flipBase != mirrored != own` — with the left half
        // coercing to 1/0 against the icon's own flip.
        return (this._flipBase !== mirrored) !== own;
    }
}
