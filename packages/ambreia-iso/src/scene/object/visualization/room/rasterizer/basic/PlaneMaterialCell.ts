/**
 * PlaneMaterialCell
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.PlaneMaterialCell
 *
 * Single cell in a material that references a PlaneTexture.
 * Renders its texture bitmap with optional offset tiling.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import type {PlaneTexture} from './PlaneTexture';

export class PlaneMaterialCell
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCell.as::_texture
    private _texture: PlaneTexture | null;
    private _cachedBitmap: HTMLCanvasElement | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCell.as::_extraItemCount
    private _extraItemCount: number = 0;

    constructor(
        texture: PlaneTexture | null,
        _extraAssets: unknown[] | null = null,
        _extraOffsets: unknown[] | null = null,
        extraItemCount: number = 0
    )
    {
        this._texture = texture;
        this._extraItemCount = extraItemCount;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCell.as::get isStatic()
    get isStatic(): boolean
    {
        return this._extraItemCount === 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCell.as::dispose()
    dispose(): void
    {
        if(this._texture !== null)
        {
            this._texture.dispose();
            this._texture = null;
        }
        this._cachedBitmap = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCell.as::clearCache()
    clearCache(): void
    {
        this._cachedBitmap = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCell.as::getHeight()
    getHeight(normal: IVector3d): number
    {
        if(this._texture !== null)
        {
            const bitmap = this._texture.getBitmap(normal);
            if(bitmap !== null)
            {
                return bitmap.height;
            }
        }
        return 0;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCell.as::render()
    render(normal: IVector3d, offsetX: number, offsetY: number): HTMLCanvasElement | null
    {
        if(this._texture === null)
        {
            return null;
        }

        let bitmap = this._texture.getBitmap(normal);

        if(bitmap === null)
        {
            return null;
        }

        try
        {
            // Apply offset tiling (AS3: lines 107-119)
            if(offsetX !== 0 || offsetY !== 0)
            {
                const w = bitmap.width;
                const h = bitmap.height;

                if(w > 0 && h > 0)
                {
                    // Create 2x2 tiled version
                    const tiled = document.createElement('canvas');
                    tiled.width = w * 2;
                    tiled.height = h * 2;
                    const tiledCtx = tiled.getContext('2d')!;
                    tiledCtx.drawImage(bitmap, 0, 0);
                    tiledCtx.drawImage(bitmap, w, 0);
                    tiledCtx.drawImage(bitmap, 0, h);
                    tiledCtx.drawImage(bitmap, w, h);

                    // Extract shifted region
                    while(offsetX < 0) offsetX += w;
                    while(offsetY < 0) offsetY += h;

                    const result = document.createElement('canvas');
                    result.width = w;
                    result.height = h;
                    const resultCtx = result.getContext('2d')!;
                    resultCtx.drawImage(tiled, offsetX % w, offsetY % h, w, h, 0, 0, w, h);
                    bitmap = result;
                }
            }
        }
        catch (_e)
        {
            return null;
        }

        // For static cells, return the bitmap directly
        if(this.isStatic)
        {
            return bitmap;
        }

        // For non-static cells (extra items), clone and composite
        // Simplified: skip extra item rendering for now
        if(this._cachedBitmap !== null)
        {
            if(this._cachedBitmap.width !== bitmap.width || this._cachedBitmap.height !== bitmap.height)
            {
                this._cachedBitmap = null;
            }
            else
            {
                const ctx = this._cachedBitmap.getContext('2d')!;
                ctx.clearRect(0, 0, this._cachedBitmap.width, this._cachedBitmap.height);
                ctx.drawImage(bitmap, 0, 0);
            }
        }

        if(this._cachedBitmap === null)
        {
            this._cachedBitmap = document.createElement('canvas');
            this._cachedBitmap.width = bitmap.width;
            this._cachedBitmap.height = bitmap.height;
            const ctx = this._cachedBitmap.getContext('2d')!;
            ctx.drawImage(bitmap, 0, 0);
        }

        return this._cachedBitmap;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterialCell.as::getAssetName()
    getAssetName(normal: IVector3d): string | null
    {
        return this._texture === null ? null : this._texture.getAssetName(normal);
    }
}
