/**
 * WallPlane
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.WallPlane
 *
 * Wall plane - converts world coordinates to screen dimensions via geometry.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {Vector3d} from '../../../../../../utils/Vector3d';
import {Plane} from './Plane';

export class WallPlane extends Plane
{
    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/WallPlane.as::DEFAULT_COLOR
    public static readonly DEFAULT_COLOR: number = 0xFFFFFF;
    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/WallPlane.as::HORIZONTAL_ANGLE_DEFAULT
    public static readonly HORIZONTAL_ANGLE_DEFAULT: number = 45;
    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/WallPlane.as::VERTICAL_ANGLE_DEFAULT
    public static readonly VERTICAL_ANGLE_DEFAULT: number = 30;

    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/WallPlane.as::render()
    render(
        canvas: HTMLCanvasElement | null,
        leftLen: number,
        rightLen: number,
        scale: number,
        normal: IVector3d,
        hasTexture: boolean
    ): HTMLCanvasElement | null
    {
        const vis = this.getPlaneVisualization(scale);
        if(vis === null || vis.geometry === null)
        {
            return null;
        }

        const geo = vis.geometry;
        const originPt = geo.getScreenPoint(new Vector3d(0, 0, 0));
        const heightPt = geo.getScreenPoint(new Vector3d(0, 0, rightLen / geo.scale));
        const widthPt = geo.getScreenPoint(new Vector3d(0, leftLen / geo.scale, 0));

        if(originPt !== null && heightPt !== null && widthPt !== null)
        {
            leftLen = Math.round(Math.abs(originPt.x - widthPt.x));
            rightLen = Math.round(Math.abs(originPt.y - heightPt.y));
        }

        return vis.render(canvas, leftLen, rightLen, normal, hasTexture);
    }
}
