/**
 * WallAdRasterizer
 *
 * @see com.sulake.habbo.room.object.visualization.room.rasterizer.basic.WallAdRasterizer
 *
 * Extends WallRasterizer for wall advertisement planes.
 * Overrides parsing to use wallAd elements and skips caching
 * (each render produces a fresh PlaneBitmapData with timeStamp -1).
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {PlaneBitmapData} from '../../utils/PlaneBitmapData';
import {WallRasterizer} from './WallRasterizer';
import {WallPlane} from './WallPlane';
import type {IAssetPlane} from './PlaneRasterizerTypes';

export class WallAdRasterizer extends WallRasterizer
{
    override getTextureIdentifier(scale: number, _normal: IVector3d): string
    {
        return String(scale);
    }

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
            this.parseWalls(planes);
        }
    }

    protected override parseWalls(planes: IAssetPlane[]): void
    {
        if(planes === null) return;

        for(const planeData of planes)
        {
            if(planeData.id === undefined) continue;

            const id = planeData.id;
            const visualizations = planeData.visualizations ?? [];
            const wallPlane = new WallPlane();

            this.parseVisualizations(wallPlane, visualizations);

            if(this.getPlane(id) === null)
            {
                this.addPlane(id, wallPlane);
            }
            else
            {
                wallPlane.dispose();
            }
        }
    }
}
