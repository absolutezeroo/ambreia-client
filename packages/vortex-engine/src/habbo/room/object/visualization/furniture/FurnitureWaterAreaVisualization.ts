/**
 * FurnitureWaterAreaVisualization
 *
 * A pool tile. Its `shore` sprite is a full ring of water's-edge artwork, and only the sides that
 * actually border dry land may be drawn — otherwise two adjoining pool tiles each paint a shore
 * between them and the pool reads as a grid of separate puddles.
 *
 * Which sides those are is not sent as a list: the server packs it into the object's state as a bit
 * per edge cell, walked anticlockwise from the top-right. `updateBorderData()` unpacks that into a
 * (sizeX+2) x (sizeY+2) occupancy grid, and the four `update*Border()` passes read each edge cell
 * together with its two neighbours to decide how the corner is cut — straight, outer or inner.
 * `ShoreMaskCreatorUtility` turns those decisions into an alpha mask, and the shore is drawn
 * through it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as
 */
import type {Texture} from 'pixi.js';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';
import {ShoreMaskCreatorUtility} from './ShoreMaskCreatorUtility';

export class FurnitureWaterAreaVisualization extends AnimatedFurnitureVisualization
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::SHORE_SPRITE_TAG
    private static readonly SHORE_SPRITE_TAG: string = 'shore';

    // Every name below is recovered from PRODUCTION l.13-23, which declares all eleven of them
    //   unobfuscated; the primary tree obfuscates nine, and each carries the identifier it has there
    //   so the mapping is checkable rather than asserted.
    // Obfuscated as `_SafeStr_7527` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_hasSomeBorder
    private _hasSomeBorder: boolean = true;
    // Obfuscated as `_SafeStr_5396` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_hasBorder
    private _hasBorder: boolean[] = [];
    // Obfuscated as `_SafeStr_5710` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_borderType
    private _borderType: number[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_createdInstanceMaskSizes
    private _createdInstanceMaskSizes: number[] = [];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_needsShoreUpdate
    private _needsShoreUpdate: boolean = false;
    // Obfuscated as `_SafeStr_5754` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_sizeX
    private _sizeX: number = 0;
    // Obfuscated as `_SafeStr_5712` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_sizeY
    private _sizeY: number = 0;
    // Obfuscated as `_SafeStr_8643` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_shoreSpriteIndex
    private _shoreSpriteIndex: number = 0;
    // Obfuscated as `_SafeStr_9595` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_shoreSpriteScale
    private _shoreSpriteScale: number = -1;
    // Obfuscated as `_SafeStr_9602` in the primary tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_shoreSpriteDirection
    private _shoreSpriteDirection: number = -1;
    // Obfuscated as `_SafeStr_4637` in the primary tree. AS3 holds a BitmapData here; this port
    //   holds the OffscreenCanvas it draws the stencil into.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::_maskBitmapData
    private _maskBitmapData: OffscreenCanvas | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateObject()
    protected override updateObject(scale: number, geometryDirection: number): boolean
    {
        if(super.updateObject(scale, geometryDirection))
        {
            this._needsShoreUpdate = true;

            this.updateBorderData();

            return true;
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateAnimation()
    protected override updateAnimation(scale: number): number
    {
        let changed = super.updateAnimation(scale);

        if(this.updateInstanceShoreMask(scale))
        {
            const index = this.getShoreSpriteIndex(scale);

            changed |= 1 << index;
        }

        return changed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::getSpriteAssetName()
    protected override getSpriteAssetName(scale: number, layerIndex: number): string
    {
        if(scale === 1 || layerIndex !== this.getShoreSpriteIndex(scale))
        {
            return super.getSpriteAssetName(scale, layerIndex);
        }

        if(this._hasSomeBorder)
        {
            const roomObject = this.object;

            if(roomObject === null) return '';

            return ShoreMaskCreatorUtility.getInstanceMaskName(roomObject.getInstanceId(), this.getSize(scale));
        }

        // AS3 returns null here — the shore layer draws nothing at all when no side of this tile
        // borders land. The port's callers test `assetName.length === 0` for the same thing.
        return '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::setAnimation()
    protected override setAnimation(_animationId: number): void
    {
        // AS3 discards the argument: a water area has exactly one animation and any request to
        // switch is answered with animation 0.
        super.setAnimation(0);
    }

    /**
     * The layer index carrying the `shore` tag, searched from the top layer down and cached per
     * (scale, direction) pair because the answer only changes when one of those does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::getShoreSpriteIndex()
    private getShoreSpriteIndex(scale: number): number
    {
        if(this._shoreSpriteScale === scale && this._shoreSpriteDirection === this.direction)
        {
            return this._shoreSpriteIndex;
        }

        let index = this.spriteCount - 1;

        while(index >= 0)
        {
            if(this.getSpriteTag(scale, this.direction, index) === FurnitureWaterAreaVisualization.SHORE_SPRITE_TAG)
            {
                this._shoreSpriteIndex = index;
                this._shoreSpriteScale = scale;
                this._shoreSpriteDirection = this.direction;

                return this._shoreSpriteIndex;
            }

            index--;
        }

        return -1;
    }

    /**
     * The unmasked shore artwork — `super.getSpriteAssetName()`, deliberately, because this class's
     * own override answers with the instance mask instead.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::getShoreAsset()
    private getShoreAsset(scale: number): IGraphicAsset | null
    {
        const name = super.getSpriteAssetName(scale, this.getShoreSpriteIndex(scale));

        return this.assetCollection?.getAsset(name) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::getInstanceMask()
    private getInstanceMask(scale: number): IGraphicAsset | null
    {
        const collection = this.assetCollection;
        const roomObject = this.object;

        if(collection === null || roomObject === null) return null;

        const size = this.getSize(scale);
        const asset = ShoreMaskCreatorUtility.getInstanceMask(
            roomObject.getInstanceId(), size, collection, this.getShoreAsset(scale)
        );

        if(asset !== null)
        {
            if(this._createdInstanceMaskSizes.indexOf(size) < 0)
            {
                this._createdInstanceMaskSizes.push(size);
            }
        }

        return asset;
    }

    /**
     * Unpacks the object's state bits into an occupancy grid and runs the four edge passes over it.
     *
     * The bits are consumed in exactly the order AS3 consumes them, and the order is the whole
     * point: the bottom row right-to-left, then each middle row's right cell followed by its left
     * cell working upwards, then the top row right-to-left. Read it in any other order and the
     * shore is cut on the wrong sides.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateBorderData()
    private updateBorderData(): void
    {
        this.resetBorders();

        const roomObject = this.object;

        if(roomObject === null) return;

        let state = roomObject.getState(0);

        const area = this.getAreaData();
        const width = this._sizeX + 2;
        const height = this._sizeY + 2;

        let row = area[height - 1];
        let index = width - 1;

        while(index >= 0)
        {
            if(state & 1) row[index] = true;

            state >>= 1;
            index--;
        }

        index = height - 2;

        while(index >= 1)
        {
            row = area[index];

            if(state & 1) row[width - 1] = true;

            state >>= 1;

            if(state & 1) row[0] = true;

            state >>= 1;
            index--;
        }

        row = area[0];
        index = width - 1;

        while(index >= 0)
        {
            if(state & 1) row[index] = true;

            state >>= 1;
            index--;
        }

        let cursor = 0;

        cursor = this.updateTopBorder(area, cursor);
        cursor = this.updateRightBorder(area, cursor);
        cursor = this.updateBottomBorder(area, cursor);
        this.updateLeftBorder(area, cursor);

        this._hasSomeBorder = false;

        index = 0;

        while(index < this._hasBorder.length)
        {
            if(this._hasBorder[index] === true)
            {
                this._hasSomeBorder = true;
            }

            index++;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateTopBorder()
    private updateTopBorder(area: boolean[][], cursor: number): number
    {
        const width = this._sizeX + 2;
        const edge = area[0];
        const inner = area[1];

        let index = 1;

        while(index < width - 1)
        {
            if(edge[index] === false)
            {
                this._hasBorder[cursor] = true;

                const previous = FurnitureWaterAreaVisualization.cutTypeFor(inner[index - 1], edge[index - 1]);
                const next = FurnitureWaterAreaVisualization.cutTypeFor(inner[index + 1], edge[index + 1]);

                this._borderType[cursor] = ShoreMaskCreatorUtility.getBorderType(previous, next);
            }

            cursor++;
            index++;
        }

        return cursor;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateRightBorder()
    private updateRightBorder(area: boolean[][], cursor: number): number
    {
        const width = this._sizeX + 2;
        const height = this._sizeY + 2;

        let index = 1;

        while(index < height - 1)
        {
            const edge = area[index];
            const before = area[index - 1];
            const after = area[index + 1];

            if(edge[width - 1] === false)
            {
                this._hasBorder[cursor] = true;

                const previous = FurnitureWaterAreaVisualization.cutTypeFor(before[width - 2], before[width - 1]);
                const next = FurnitureWaterAreaVisualization.cutTypeFor(after[width - 2], after[width - 1]);

                this._borderType[cursor] = ShoreMaskCreatorUtility.getBorderType(previous, next);
            }

            cursor++;
            index++;
        }

        return cursor;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateBottomBorder()
    private updateBottomBorder(area: boolean[][], cursor: number): number
    {
        const width = this._sizeX + 2;
        const height = this._sizeY + 2;
        const edge = area[height - 1];
        const inner = area[height - 2];

        let index = width - 2;

        while(index >= 1)
        {
            if(edge[index] === false)
            {
                this._hasBorder[cursor] = true;

                const previous = FurnitureWaterAreaVisualization.cutTypeFor(inner[index + 1], edge[index + 1]);
                const next = FurnitureWaterAreaVisualization.cutTypeFor(inner[index - 1], edge[index - 1]);

                this._borderType[cursor] = ShoreMaskCreatorUtility.getBorderType(previous, next);
            }

            cursor++;
            index--;
        }

        return cursor;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateLeftBorder()
    private updateLeftBorder(area: boolean[][], cursor: number): number
    {
        const height = this._sizeY + 2;

        let index = height - 2;

        while(index >= 1)
        {
            const edge = area[index];
            const before = area[index + 1];
            const after = area[index - 1];

            if(edge[0] === false)
            {
                this._hasBorder[cursor] = true;

                const previous = FurnitureWaterAreaVisualization.cutTypeFor(before[1], before[0]);
                const next = FurnitureWaterAreaVisualization.cutTypeFor(after[1], after[0]);

                this._borderType[cursor] = ShoreMaskCreatorUtility.getBorderType(previous, next);
            }

            cursor++;
            index--;
        }

        return cursor;
    }

    /**
     * How this edge cell meets one neighbour: nothing there at all is an outer corner, water in the
     * neighbouring edge cell is an inner corner, and water only diagonally behind it is a straight
     * run. AS3 spells this three-way test out eight times across the four passes; it is one function
     * because all eight are identical bar which two cells they read.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateTopBorder()
    private static cutTypeFor(diagonal: boolean, neighbour: boolean): number
    {
        if(diagonal === false && neighbour === false) return ShoreMaskCreatorUtility.OUTER_CUT;

        if(neighbour === true) return ShoreMaskCreatorUtility.INNER_CUT;

        return ShoreMaskCreatorUtility.STRAIGHT_CUT;
    }

    /**
     * Sizes the two per-edge arrays to the tile's perimeter and clears them. AS3 reads the furni's
     * size out of the model only once, on the first call that finds it still zero.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::resetBorders()
    private resetBorders(): void
    {
        if(this._sizeX === 0 || this._sizeY === 0)
        {
            const roomObject = this.object;
            const model = roomObject?.getModel() ?? null;

            if(model === null) return;

            this._sizeX = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_X);
            this._sizeY = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Y);
        }

        this._hasBorder = [];
        this._borderType = [];

        let index = 0;

        while(index < this._sizeX * 2 + this._sizeY * 2)
        {
            this._hasBorder.push(false);
            this._borderType.push(ShoreMaskCreatorUtility.STRAIGHT_CUT);

            index++;
        }
    }

    /**
     * A (sizeX+2) x (sizeY+2) grid, false everywhere except the interior, which is the tile itself.
     * The extra ring is where the state bits land: a true there means the neighbouring tile is also
     * water, so this side needs no shore.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::getAreaData()
    private getAreaData(): boolean[][]
    {
        const width = this._sizeX + 2;
        const height = this._sizeY + 2;
        const area: boolean[][] = [];

        let row = 0;

        while(row < height)
        {
            const cells: boolean[] = [];
            let column = width - 1;

            while(column >= 0)
            {
                cells.push(false);
                column--;
            }

            area.push(cells);
            row++;
        }

        row = 1;

        while(row < height - 1)
        {
            const cells = area[row];
            let column = 1;

            while(column < width - 1)
            {
                cells[column] = true;
                column++;
            }

            row++;
        }

        return area;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::initializeShoreMasks()
    private initializeShoreMasks(scale: number): boolean
    {
        return ShoreMaskCreatorUtility.initializeShoreMasks(
            this.getSize(scale), this.assetCollection, this.getShoreAsset(scale)
        );
    }

    /**
     * Builds the stencil for the current border layout, growing the reusable surface if the shore
     * artwork is bigger than last time.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::createShoreMask()
    private createShoreMask(width: number, height: number, scale: number): OffscreenCanvas | null
    {
        const collection = this.assetCollection;

        if(collection === null) return null;

        if(this._maskBitmapData === null || this._maskBitmapData.width < width || this._maskBitmapData.height < height)
        {
            // AS3 disposes the old BitmapData here; an OffscreenCanvas is collected on its own once
            // the last reference goes, and dropping it is that reference.
            this._maskBitmapData = ShoreMaskCreatorUtility.createEmptyMask(width, height);
        }

        return ShoreMaskCreatorUtility.createShoreMask2x2(
            this._maskBitmapData, this.getSize(scale), this._hasBorder, this._borderType, collection
        );
    }

    /**
     * Redraws this object's own mask: the shore artwork, cut to the sides that border land.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::updateInstanceShoreMask()
    private updateInstanceShoreMask(scale: number): boolean
    {
        if(!this._needsShoreUpdate) return false;

        const instanceMask = this.getInstanceMask(scale);
        const instanceTexture = instanceMask?.texture ?? null;

        if(instanceMask === null || instanceTexture === null || !this.initializeShoreMasks(scale))
        {
            return false;
        }

        // AS3 reads `asset.content as BitmapData` and paints into it; the port's equivalent is the
        // OffscreenCanvas the texture was built from, which getInstanceMask() put there.
        const target = FurnitureWaterAreaVisualization.getCanvas(instanceTexture);

        if(target !== null)
        {
            const stencil = this.createShoreMask(target.width, target.height, scale);
            const shoreAsset = this.getShoreAsset(scale);
            const shoreTexture = shoreAsset?.texture ?? null;

            if(shoreAsset !== null && shoreTexture !== null)
            {
                const shore = FurnitureWaterAreaVisualization.getDrawableSource(shoreTexture);
                const context = target.getContext('2d');

                if(shore !== null && stencil !== null && context !== null)
                {
                    context.setTransform(1, 0, 0, 1, 0, 0);
                    context.globalCompositeOperation = 'source-over';
                    context.clearRect(0, 0, target.width, target.height);
                    context.drawImage(shore, 0, 0);

                    // AS3's copyPixels() with an alpha bitmap and mergeAlpha: keep the shore only
                    // where the stencil is opaque.
                    context.globalCompositeOperation = 'destination-in';
                    context.drawImage(stencil, 0, 0);
                    context.globalCompositeOperation = 'source-over';

                    // Nothing tells pixi the canvas changed; AS3 mutates a BitmapData the display
                    // list re-reads every frame, and this is that.
                    instanceTexture.source.update();
                }

                this._needsShoreUpdate = false;
            }
        }

        return true;
    }

    // TS-only: the OffscreenCanvas an asset's texture was built from, where AS3 reads
    //   `asset.content as BitmapData` off the same asset.
    private static getCanvas(texture: Texture): OffscreenCanvas | null
    {
        const resource = (texture as unknown as {source?: {resource?: unknown}}).source?.resource;

        return (resource instanceof OffscreenCanvas) ? resource : null;
    }

    // TS-only: see ShoreMaskCreatorUtility.getDrawableSource() — a pixi Texture keeps its pixels on
    //   its source's resource, which is what Canvas2D can draw from.
    private static getDrawableSource(texture: Texture): CanvasImageSource | null
    {
        const source = (texture as unknown as {source?: {resource?: unknown}}).source;

        return (source?.resource as CanvasImageSource) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureWaterAreaVisualization.as::dispose()
    override dispose(): void
    {
        const collection = this.assetCollection;
        const roomObject = this.object;

        if(collection !== null && roomObject !== null)
        {
            for(const size of this._createdInstanceMaskSizes)
            {
                ShoreMaskCreatorUtility.disposeInstanceMask(roomObject.getInstanceId(), size, collection);
            }

            this._createdInstanceMaskSizes = [];
        }

        this._maskBitmapData = null;

        super.dispose();
    }
}
