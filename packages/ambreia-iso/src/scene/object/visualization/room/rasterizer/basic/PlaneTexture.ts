/**
 * PlaneTexture
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.PlaneTexture
 *
 * Collection of PlaneTextureBitmaps, selects appropriate bitmap by normal vector.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {PlaneTextureBitmap} from './PlaneTextureBitmap';

export class PlaneTexture
{
    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/PlaneTexture.as::_bitmaps
    private _bitmaps: PlaneTextureBitmap[] = [];

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTexture.as::dispose()
    dispose(): void
    {
        if(this._bitmaps !== null)
        {
            for(const bitmap of this._bitmaps)
            {
                if(bitmap !== null)
                {
                    bitmap.dispose();
                }
            }
            this._bitmaps = [];
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTexture.as::addBitmap()
    addBitmap(
        bitmap: HTMLCanvasElement,
        normalMinX: number = -1,
        normalMaxX: number = 1,
        normalMinY: number = -1,
        normalMaxY: number = 1,
        assetName: string | null = null
    ): void
    {
        const textureBitmap = new PlaneTextureBitmap(bitmap, normalMinX, normalMaxX, normalMinY, normalMaxY, assetName);
        this._bitmaps.push(textureBitmap);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTexture.as::getBitmap()
    getBitmap(normal: IVector3d): HTMLCanvasElement | null
    {
        const textureBitmap = this.getPlaneTextureBitmap(normal);
        return textureBitmap === null ? null : textureBitmap.bitmap;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTexture.as::getPlaneTextureBitmap()
    getPlaneTextureBitmap(normal: IVector3d): PlaneTextureBitmap | null
    {
        if(normal === null)
        {
            return null;
        }

        for(const bitmap of this._bitmaps)
        {
            if(bitmap !== null)
            {
                if(normal.x >= bitmap.normalMinX &&
					normal.x <= bitmap.normalMaxX &&
					normal.y >= bitmap.normalMinY &&
					normal.y <= bitmap.normalMaxY)
                {
                    return bitmap;
                }
            }
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneTexture.as::getAssetName()
    getAssetName(normal: IVector3d): string | null
    {
        const bitmap = this.getPlaneTextureBitmap(normal);
        return bitmap === null ? null : bitmap.assetName;
    }
}
