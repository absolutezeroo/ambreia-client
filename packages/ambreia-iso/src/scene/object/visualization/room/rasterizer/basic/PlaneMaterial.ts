/**
 * PlaneMaterial
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.PlaneMaterial
 *
 * Collection of PlaneMaterialCellMatrices, selects by normal vector.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {PlaneMaterialCellMatrix} from './PlaneMaterialCellMatrix';

export class PlaneMaterial
{
    private _matrices: PlaneMaterialCellMatrix[] = [];
    private _cacheUsed: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterial.as::dispose()
    dispose(): void
    {
        if(this._matrices !== null)
        {
            for(const matrix of this._matrices)
            {
                if(matrix !== null)
                {
                    matrix.dispose();
                }
            }
            this._matrices = [];
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterial.as::clearCache()
    clearCache(): void
    {
        if(!this._cacheUsed) return;

        for(const matrix of this._matrices)
        {
            if(matrix !== null)
            {
                matrix.clearCache();
            }
        }
        this._cacheUsed = false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterial.as::addMaterialCellMatrix()
    addMaterialCellMatrix(
        numColumns: number,
        repeatMode: number,
        align: number,
        normalMinX: number = -1,
        normalMaxX: number = 1,
        normalMinY: number = -1,
        normalMaxY: number = 1
    ): PlaneMaterialCellMatrix
    {
        const matrix = new PlaneMaterialCellMatrix(numColumns, repeatMode, align, normalMinX, normalMaxX, normalMinY, normalMaxY);
        this._matrices.push(matrix);
        return matrix;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterial.as::getMaterialCellMatrix()
    getMaterialCellMatrix(normal: IVector3d): PlaneMaterialCellMatrix | null
    {
        if(normal === null) return null;

        for(const matrix of this._matrices)
        {
            if(matrix !== null)
            {
                if(normal.x >= matrix.normalMinX &&
					normal.x <= matrix.normalMaxX &&
					normal.y >= matrix.normalMinY &&
					normal.y <= matrix.normalMaxY)
                {
                    return matrix;
                }
            }
        }

        return null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/PlaneMaterial.as::render()
    render(
        canvas: HTMLCanvasElement | null,
        width: number,
        height: number,
        normal: IVector3d,
        hasTexture: boolean,
        offsetX: number,
        offsetY: number,
        isTopAligned: boolean
    ): HTMLCanvasElement | null
    {
        if(width < 1) width = 1;
        if(height < 1) height = 1;

        const matrix = this.getMaterialCellMatrix(normal);
        if(matrix !== null)
        {
            this._cacheUsed = true;
            return matrix.render(canvas, width, height, normal, hasTexture, offsetX, offsetY, isTopAligned);
        }

        return null;
    }
}
