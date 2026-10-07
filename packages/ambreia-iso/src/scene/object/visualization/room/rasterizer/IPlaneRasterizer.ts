/**
 * IPlaneRasterizer
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.class_3625
 *
 * Interface for plane rasterizers that generate textured plane bitmaps.
 */
import type {IVector3d} from '../../../../../utils/IVector3d';
import type {PlaneBitmapData} from '../utils/PlaneBitmapData';

export interface IPlaneRasterizer
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/IPlaneRasterizer.as::initializeDimensions()
    initializeDimensions(width: number, height: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/IPlaneRasterizer.as::render()
    render(
        canvas: HTMLCanvasElement | null,
        id: string,
        leftLen: number,
        rightLen: number,
        scale: number,
        normal: IVector3d,
        hasTexture: boolean,
        offsetU?: number,
        offsetV?: number,
        maxU?: number,
        maxV?: number,
        time?: number
    ): PlaneBitmapData | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/IPlaneRasterizer.as::getTextureIdentifier()
    getTextureIdentifier(scale: number, normal: IVector3d): string;

    getLayers(id: string): (unknown | null)[];

    reinitialize(): void;
}
