/**
 * ShoreMaskCreatorUtility
 *
 * Builds the alpha masks that cut a water area's `shore` sprite down to the edges that actually
 * border dry land. Every mask is a 2x2-tile stencil drawn once per size and cached in the
 * visualization's asset collection under `mask_<size>_<edge>_<borderType>`; the per-object result
 * lives under `instance_mask_<instanceId>_<size>`.
 *
 * The eight `edge` slots are the four sides plus their diagonals, and only two are drawn: slot 0
 * (left) and slot 1 (right). The other six are those two flipped, which is why `storeLeftMask()`
 * and `storeRightMask()` each register four names off one bitmap.
 *
 * AS3 does all of this on `flash.display.BitmapData`; this port uses `OffscreenCanvas`, and an
 * asset built from one keeps that canvas as its texture source, so drawing into the canvas and
 * calling `texture.source.update()` is what AS3 gets for free by mutating the BitmapData in place.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as
 */
import {Texture} from 'pixi.js';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import type {IGraphicAssetCollection} from '@ambreia/common/graphics/IGraphicAssetCollection';
import {Rasterizer} from '../../utils/Rasterizer';

export class ShoreMaskCreatorUtility
{
    // Name recovered from PRODUCTION l.13 (`public static const OUTER_CUT:int = 0`); the primary
    //   tree obfuscates it to `_SafeStr_11428` and win63_version to `const_1166`.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::OUTER_CUT
    static readonly OUTER_CUT: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::STRAIGHT_CUT
    static readonly STRAIGHT_CUT: number = 1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::INNER_CUT
    static readonly INNER_CUT: number = 2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::CUT_TYPE_COUNT
    private static readonly CUT_TYPE_COUNT: number = 3;

    // AS3 writes these as BitmapData fill colours; here they are the Canvas2D equivalents —
    //   "transparent" is a clear rather than a colour, so only the solid one has a value.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::MASK_COLOR_SOLID
    private static readonly MASK_COLOR_SOLID: string = '#ffffff';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::createEmptyMask()
    static createEmptyMask(width: number, height: number): OffscreenCanvas
    {
        return new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::getInstanceMaskName()
    static getInstanceMaskName(instanceId: number, size: number): string
    {
        return `instance_mask_${instanceId}_${size}`;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::getBorderType()
    static getBorderType(previousCut: number, nextCut: number): number
    {
        return previousCut + nextCut * ShoreMaskCreatorUtility.CUT_TYPE_COUNT;
    }

    /**
     * The per-object mask this water area draws its shore through, created empty on first ask at
     * the shore asset's own size and offsets so it lines up with it exactly.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::getInstanceMask()
    static getInstanceMask(
        instanceId: number,
        size: number,
        collection: IGraphicAssetCollection,
        shoreAsset: IGraphicAsset | null
    ): IGraphicAsset | null
    {
        const name = ShoreMaskCreatorUtility.getInstanceMaskName(instanceId, size);
        let asset = collection.getAsset(name);

        if(asset === null)
        {
            if(shoreAsset !== null)
            {
                const source = shoreAsset.texture;

                if(source !== null)
                {
                    const canvas = ShoreMaskCreatorUtility.createEmptyMask(source.width, source.height);

                    collection.addAsset(
                        name, Texture.from(canvas), false, shoreAsset.offsetX, shoreAsset.offsetY
                    );

                    asset = collection.getAsset(name);
                }
            }
        }

        return asset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::disposeInstanceMask()
    static disposeInstanceMask(instanceId: number, size: number, collection: IGraphicAssetCollection): void
    {
        collection.disposeAsset(ShoreMaskCreatorUtility.getInstanceMaskName(instanceId, size));
    }

    /**
     * Stamps every edge that borders land into one stencil, which is then used as the alpha channel
     * for the shore sprite.
     */
    // DEVIATION: AS3 calls `copyPixels(mask, mask.rect, (0,0), mask, (0,0), true)` — passing the
    //   same bitmap as both source and alpha channel, which multiplies its alpha by itself. That
    //   is a no-op for a stencil that is either fully solid or fully clear, which every mask built
    //   here is, so the port draws it plainly. Reproducing the self-multiply would darken nothing
    //   and cost a second surface.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::createShoreMask2x2()
    static createShoreMask2x2(
        target: OffscreenCanvas,
        size: number,
        hasBorder: boolean[],
        borderType: number[],
        collection: IGraphicAssetCollection
    ): OffscreenCanvas
    {
        const context = target.getContext('2d');

        if(context === null) return target;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, target.width, target.height);

        let index = 0;

        while(index < hasBorder.length)
        {
            if(hasBorder[index] === true)
            {
                const name = `mask_${size}_${index}_${borderType[index]}`;
                const asset = collection.getAsset(name);
                const texture = asset?.texture ?? null;

                if(texture !== null)
                {
                    const source = ShoreMaskCreatorUtility.getDrawableSource(texture);

                    if(source !== null) context.drawImage(source, 0, 0);
                }
            }

            index++;
        }

        return target;
    }

    /**
     * Draws the six cut variants for a size, once, and marks the size done with a 1x1 sentinel
     * asset so the next mannequin-sized water area does not rebuild them.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::initializeShoreMasks()
    static initializeShoreMasks(
        size: number,
        collection: IGraphicAssetCollection | null,
        shoreAsset: IGraphicAsset | null
    ): boolean
    {
        if(collection === null) return false;

        const doneName = `masks_done_${size}`;

        if(collection.getAsset(doneName) !== null) return true;

        if(shoreAsset === null) return false;

        const shoreTexture = shoreAsset.texture;

        if(shoreTexture !== null)
        {
            // AS3 walks two parallel arrays: the six (previousCut, nextCut) pairs that a shore edge
            // can meet its neighbours with. `_loc9_`/`_loc8_` in the source.
            const previousCuts = [0, 1, 2, 0, 1, 2];
            const nextCuts = [1, 1, 1, 2, 2, 2];

            const width = shoreTexture.width;
            const height = shoreTexture.height;

            let index = 0;

            while(index < previousCuts.length && index < nextCuts.length)
            {
                const left = ShoreMaskCreatorUtility.createMaskLeft(width, height);

                ShoreMaskCreatorUtility.cutLeftMask(left, size, previousCuts[index], nextCuts[index]);
                ShoreMaskCreatorUtility.storeLeftMask(collection, left, size, previousCuts[index], nextCuts[index]);

                const right = ShoreMaskCreatorUtility.createMaskRight(width, height);

                ShoreMaskCreatorUtility.cutRightMask(right, size, nextCuts[index], previousCuts[index]);
                ShoreMaskCreatorUtility.storeRightMask(collection, right, size, nextCuts[index], previousCuts[index]);

                index++;
            }
        }

        // AS3 registers the sentinel whether or not the shore bitmap resolved, so a shore asset
        // that never arrives is not retried on every frame.
        collection.addAsset(doneName, Texture.from(new OffscreenCanvas(1, 1)), false);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::createMaskLeft()
    private static createMaskLeft(width: number, height: number): OffscreenCanvas
    {
        const canvas = ShoreMaskCreatorUtility.createEmptyMask(width, height);

        ShoreMaskCreatorUtility.fillTopLeftCorner(
            canvas, canvas.width / 2, canvas.height / 2 - 1, 1, ShoreMaskCreatorUtility.MASK_COLOR_SOLID
        );

        return canvas;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::cutLeftMask()
    private static cutLeftMask(mask: OffscreenCanvas, size: number, previousCut: number, nextCut: number): void
    {
        if(previousCut === ShoreMaskCreatorUtility.STRAIGHT_CUT)
        {
            ShoreMaskCreatorUtility.cutLeftMaskOuterCorner(mask, size, false);
        }
        else if(previousCut === ShoreMaskCreatorUtility.INNER_CUT)
        {
            ShoreMaskCreatorUtility.cutLeftMaskOuterCorner(mask, size, true);
        }

        if(nextCut === ShoreMaskCreatorUtility.INNER_CUT)
        {
            ShoreMaskCreatorUtility.cutLeftMaskInnerCorner(mask, size);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::cutLeftMaskOuterCorner()
    private static cutLeftMaskOuterCorner(mask: OffscreenCanvas, size: number, square: boolean): void
    {
        const bottom = Math.trunc(mask.height / 2 - size / 2);
        const left = Math.trunc(mask.width / 2);

        if(square)
        {
            ShoreMaskCreatorUtility.clearRect(mask, left, 0, mask.width, bottom);
        }
        else
        {
            ShoreMaskCreatorUtility.fillTopLeftCorner(mask, left, bottom - 1, 1, null);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::cutLeftMaskInnerCorner()
    private static cutLeftMaskInnerCorner(mask: OffscreenCanvas, size: number): void
    {
        const left = Math.trunc(mask.width / 2 + size / 2);

        ShoreMaskCreatorUtility.clearRect(mask, left, 0, mask.width, mask.height / 2);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::createMaskRight()
    private static createMaskRight(width: number, height: number): OffscreenCanvas
    {
        const canvas = ShoreMaskCreatorUtility.createEmptyMask(width, height);

        ShoreMaskCreatorUtility.fillBottomRightCorner(
            canvas, canvas.width / 2 + 1, canvas.height / 2 - 1, ShoreMaskCreatorUtility.MASK_COLOR_SOLID
        );

        return canvas;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::cutRightMask()
    private static cutRightMask(mask: OffscreenCanvas, size: number, nextCut: number, previousCut: number): void
    {
        if(previousCut === ShoreMaskCreatorUtility.STRAIGHT_CUT)
        {
            ShoreMaskCreatorUtility.cutRightMaskOuterCorner(mask, size, false);
        }
        else if(previousCut === ShoreMaskCreatorUtility.INNER_CUT)
        {
            ShoreMaskCreatorUtility.cutRightMaskOuterCorner(mask, size, true);
        }

        if(nextCut === ShoreMaskCreatorUtility.INNER_CUT)
        {
            ShoreMaskCreatorUtility.cutRightMaskInnerCorner(mask, size);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::cutRightMaskInnerCorner()
    private static cutRightMaskInnerCorner(mask: OffscreenCanvas, size: number): void
    {
        const left = Math.trunc(mask.width / 2 + size / 2);

        ShoreMaskCreatorUtility.clearRect(mask, left, 0, mask.width, mask.height / 2 - size / 4);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::cutRightMaskOuterCorner()
    private static cutRightMaskOuterCorner(mask: OffscreenCanvas, size: number, square: boolean): void
    {
        const bottom = Math.trunc(mask.height / 2);
        const left = Math.trunc(mask.width / 2 + size);

        if(square)
        {
            ShoreMaskCreatorUtility.clearRect(mask, left, 0, mask.width, bottom);
        }
        else
        {
            ShoreMaskCreatorUtility.fillBottomRightCorner(mask, left + 1, bottom - 1, null);
        }
    }

    /**
     * Registers the left stencil under its own slot and under the three slots that are it flipped.
     * Note the argument order swaps for the flipped names: a corner mirrored meets its neighbours
     * the other way round.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::storeLeftMask()
    private static storeLeftMask(
        collection: IGraphicAssetCollection,
        mask: OffscreenCanvas,
        size: number,
        previousCut: number,
        nextCut: number
    ): void
    {
        const add = (slot: number, type: number, canvas: OffscreenCanvas | null): void =>
        {
            if(canvas === null) return;

            collection.addAsset(`mask_${size}_${slot}_${type}`, Texture.from(canvas), false);
        };

        add(0, ShoreMaskCreatorUtility.getBorderType(previousCut, nextCut), mask);
        add(3, ShoreMaskCreatorUtility.getBorderType(nextCut, previousCut), Rasterizer.getFlipVBitmapData(mask));
        add(4, ShoreMaskCreatorUtility.getBorderType(previousCut, nextCut), Rasterizer.getFlipHVBitmapData(mask));
        add(7, ShoreMaskCreatorUtility.getBorderType(nextCut, previousCut), Rasterizer.getFlipHBitmapData(mask));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::storeRightMask()
    private static storeRightMask(
        collection: IGraphicAssetCollection,
        mask: OffscreenCanvas,
        size: number,
        previousCut: number,
        nextCut: number
    ): void
    {
        const add = (slot: number, type: number, canvas: OffscreenCanvas | null): void =>
        {
            if(canvas === null) return;

            collection.addAsset(`mask_${size}_${slot}_${type}`, Texture.from(canvas), false);
        };

        add(1, ShoreMaskCreatorUtility.getBorderType(previousCut, nextCut), mask);
        add(2, ShoreMaskCreatorUtility.getBorderType(nextCut, previousCut), Rasterizer.getFlipVBitmapData(mask));
        add(5, ShoreMaskCreatorUtility.getBorderType(previousCut, nextCut), Rasterizer.getFlipHVBitmapData(mask));
        add(6, ShoreMaskCreatorUtility.getBorderType(nextCut, previousCut), Rasterizer.getFlipHBitmapData(mask));
    }

    /**
     * Walks a 2:1 isometric staircase up and to the right from (x, y), filling everything above and
     * to the left of it — one column, then one more, then a row up, which is what makes the diagonal
     * read as an isometric edge rather than a 45-degree one.
     *
     * @param color - The fill, or null to erase instead, which is AS3 filling with colour 0
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::fillTopLeftCorner()
    private static fillTopLeftCorner(
        mask: OffscreenCanvas,
        x: number,
        y: number,
        step: number,
        color: string | null
    ): void
    {
        const context = mask.getContext('2d');

        if(context === null) return;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalCompositeOperation = color === null ? 'destination-out' : 'source-over';
        context.fillStyle = color ?? '#000000';

        let column = Math.trunc(x);
        let row = Math.trunc(y);
        let stepCount = step;

        while(row >= 0)
        {
            // AS3 sets the pixels one by one from `row` down to 0; a single fillRect covers the
            // same column span.
            context.fillRect(column, 0, 1, row + 1);

            stepCount++;

            if(stepCount >= 2)
            {
                row--;
                stepCount = 0;
            }

            column++;
        }

        context.globalCompositeOperation = 'source-over';
    }

    /**
     * The mirror of fillTopLeftCorner: a staircase down and to the right, filling everything to the
     * right of it. AS3 advances two columns per row here, where the top-left version advances one
     * row per two columns — the same 2:1 slope seen from the other end.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/ShoreMaskCreatorUtility.as::fillBottomRightCorner()
    private static fillBottomRightCorner(
        mask: OffscreenCanvas,
        x: number,
        y: number,
        color: string | null
    ): void
    {
        const context = mask.getContext('2d');

        if(context === null) return;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalCompositeOperation = color === null ? 'destination-out' : 'source-over';
        context.fillStyle = color ?? '#000000';

        let column = Math.trunc(x);
        let row = Math.trunc(y);

        while(column < mask.width)
        {
            // AS3 walks from `column` to the right edge setting one pixel per step on row `row`.
            context.fillRect(column, row, mask.width - column, 1);

            row--;
            column += 2;
        }

        context.globalCompositeOperation = 'source-over';
    }

    // TS-only: AS3 erases with `fillRect(rect, MASK_COLOR_TRANSPARENT)`, which writes colour 0 over
    //   the pixels. Canvas2D's fillRect cannot write transparency, so an erase is clearRect.
    private static clearRect(mask: OffscreenCanvas, x: number, y: number, width: number, height: number): void
    {
        const context = mask.getContext('2d');

        if(context === null) return;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(Math.trunc(x), Math.trunc(y), Math.trunc(width), Math.trunc(height));
    }

    // TS-only: AS3 reads `asset.content as BitmapData` and draws it; a pixi Texture keeps its pixels
    //   on its source's resource, which is what Canvas2D can draw from.
    private static getDrawableSource(texture: Texture): CanvasImageSource | null
    {
        const source = (texture as unknown as {source?: {resource?: unknown}}).source;

        return (source?.resource as CanvasImageSource) ?? null;
    }
}
