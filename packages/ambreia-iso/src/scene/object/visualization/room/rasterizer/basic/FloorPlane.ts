/**
 * FloorPlane
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.FloorPlane
 *
 * Floor plane - converts world coordinates to screen dimensions via geometry.
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {Vector3d} from '../../../../../../utils/Vector3d';
import {Plane} from './Plane';

export class FloorPlane extends Plane
{
    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/FloorPlane.as::DEFAULT_COLOR
    public static readonly DEFAULT_COLOR: number = 0xFFFFFF;
    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/FloorPlane.as::HORIZONTAL_ANGLE_DEFAULT
    public static readonly HORIZONTAL_ANGLE_DEFAULT: number = 45;
    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/FloorPlane.as::VERTICAL_ANGLE_DEFAULT
    public static readonly VERTICAL_ANGLE_DEFAULT: number = 30;

    // AS3: sources/win63_version/habbo/room/object/visualization/room/rasterizer/basic/FloorPlane.as::render()
    render(
        canvas: HTMLCanvasElement | null,
        leftLen: number,
        rightLen: number,
        scale: number,
        normal: IVector3d,
        hasTexture: boolean,
        offsetU: number,
        offsetV: number
    ): HTMLCanvasElement | null
    {
        const vis = this.getPlaneVisualization(scale);
        if(vis === null || vis.geometry === null)
        {
            return null;
        }

        const geo = vis.geometry;
        const originPt = geo.getScreenPoint(new Vector3d(0, 0, 0));
        const rightPt = geo.getScreenPoint(new Vector3d(0, rightLen / geo.scale, 0));
        const leftPt = geo.getScreenPoint(new Vector3d(leftLen / geo.scale, 0, 0));

        let screenOffsetU = 0;
        let screenOffsetV = 0;

        if(originPt !== null && rightPt !== null && leftPt !== null)
        {
            leftLen = Math.round(Math.abs(originPt.x - leftPt.x));
            rightLen = Math.round(Math.abs(originPt.x - rightPt.x));

            const pixelsPerUnit = originPt.x - geo.getScreenPoint(new Vector3d(1, 0, 0))!.x;
            screenOffsetU = offsetU * Math.floor(Math.abs(pixelsPerUnit));
            screenOffsetV = offsetV * Math.floor(Math.abs(pixelsPerUnit));
        }

        return vis.render(canvas, leftLen, rightLen, normal, hasTexture, screenOffsetU, screenOffsetV);
    }
}
