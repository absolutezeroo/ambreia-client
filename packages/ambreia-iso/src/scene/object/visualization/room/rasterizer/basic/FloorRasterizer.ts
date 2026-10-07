/**
 * FloorRasterizer
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.FloorRasterizer
 *
 * Parses floor plane definitions and renders floor textures.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {PlaneBitmapData} from '../../utils/PlaneBitmapData';
import {PlaneRasterizer} from './PlaneRasterizer';
import {FloorPlane} from './FloorPlane';
import type {IAssetPlane} from './PlaneRasterizerTypes';

export class FloorRasterizer extends PlaneRasterizer
{
    override render(
        canvas: HTMLCanvasElement | null,
        id: string,
        leftLen: number,
        rightLen: number,
        scale: number,
        normal: IVector3d,
        hasTexture: boolean,
        offsetU: number = 0,
        offsetV: number = 0,
        _maxU: number = 0,
        _maxV: number = 0,
        _time: number = 0
    ): PlaneBitmapData | null
    {
        let plane = this.getPlane(id) as FloorPlane | null;
        if(plane === null)
        {
            plane = this.getPlane('default') as FloorPlane | null;
        }

        if(plane === null) return null;

        if(canvas !== null)
        {
            const ctx = canvas.getContext('2d')!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        let result = plane.render(canvas, leftLen, rightLen, scale, normal, hasTexture, offsetU, offsetV);

        if(result !== null && result !== canvas)
        {
            // Clone the result
            const clone = document.createElement('canvas');
            clone.width = result.width;
            clone.height = result.height;
            const ctx = clone.getContext('2d')!;
            ctx.drawImage(result, 0, 0);
            result = clone;
        }

        return new PlaneBitmapData(result, -1);
    }

    protected override initializePlanes(): void
    {
        if(this.data === null) return;

        const planes = this.data.planes;
        if(planes)
        {
            this.parseFloors(planes);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/FloorRasterizer.as::parseFloors()
    private parseFloors(planes: IAssetPlane[]): void
    {
        if(planes === null) return;

        for(const planeData of planes)
        {
            if(planeData.id === undefined) continue;

            const id = planeData.id;
            const visualizations = planeData.visualizations ?? [];
            const floorPlane = new FloorPlane();

            this.parseVisualizations(floorPlane, visualizations);

            if(!this.addPlane(id, floorPlane))
            {
                floorPlane.dispose();
            }
        }
    }
}
