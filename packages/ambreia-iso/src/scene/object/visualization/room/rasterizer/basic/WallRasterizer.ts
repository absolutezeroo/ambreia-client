/**
 * WallRasterizer
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.WallRasterizer
 *
 * Parses wall plane definitions and renders wall textures.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {PlaneBitmapData} from '../../utils/PlaneBitmapData';
import {PlaneRasterizer} from './PlaneRasterizer';
import {WallPlane} from './WallPlane';
import type {IAssetPlane} from './PlaneRasterizerTypes';

export class WallRasterizer extends PlaneRasterizer
{
    override render(
        canvas: HTMLCanvasElement | null,
        id: string,
        leftLen: number,
        rightLen: number,
        scale: number,
        normal: IVector3d,
        hasTexture: boolean,
        _offsetU: number = 0,
        _offsetV: number = 0,
        _maxU: number = 0,
        _maxV: number = 0,
        _time: number = 0
    ): PlaneBitmapData | null
    {
        let plane = this.getPlane(id) as WallPlane | null;
        if(plane === null)
        {
            plane = this.getPlane('default') as WallPlane | null;
        }

        if(plane === null) return null;

        if(canvas !== null)
        {
            const ctx = canvas.getContext('2d')!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        let result = plane.render(canvas, leftLen, rightLen, scale, normal, hasTexture);

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

    override getTextureIdentifier(scale: number, normal: IVector3d): string
    {
        if(normal !== null)
        {
            return `${scale}_${normal.x}_${normal.y}_${normal.z}`;
        }
        return super.getTextureIdentifier(scale, normal);
    }

    protected override initializePlanes(): void
    {
        if(this.data === null) return;

        const planes = this.data.planes;
        if(planes)
        {
            this.parseWalls(planes);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/WallRasterizer.as::parseWalls()
    protected parseWalls(planes: IAssetPlane[]): void
    {
        if(planes === null) return;

        for(const planeData of planes)
        {
            if(planeData.id === undefined) continue;

            const id = planeData.id;
            const visualizations = planeData.visualizations ?? [];
            const wallPlane = new WallPlane();

            this.parseVisualizations(wallPlane, visualizations);

            if(!this.addPlane(id, wallPlane))
            {
                wallPlane.dispose();
            }
        }
    }
}
