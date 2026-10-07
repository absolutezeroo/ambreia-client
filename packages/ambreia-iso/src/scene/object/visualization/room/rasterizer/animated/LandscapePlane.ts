/**
 * LandscapePlane
 *
 * @see AS3 class_3787 (deobfuscated from LandscapeRasterizer usage)
 *
 * Extends Plane with landscape-specific rendering. Transforms world coordinates
 * through geometry before delegating to PlaneVisualization.render().
 */
import type {IVector3d} from '../../../../../../utils/IVector3d';
import {Vector3d} from '../../../../../../utils/Vector3d';
import {Plane} from '../basic/Plane';

export class LandscapePlane extends Plane
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapePlane.as::DEFAULT_COLOR
    public static readonly DEFAULT_COLOR: number = 0xFFFFFF;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapePlane.as::HORIZONTAL_ANGLE_DEFAULT
    public static readonly HORIZONTAL_ANGLE_DEFAULT: number = 45;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapePlane.as::VERTICAL_ANGLE_DEFAULT
    public static readonly VERTICAL_ANGLE_DEFAULT: number = 30;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapePlane.as::_width
    private _width: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapePlane.as::_height
    private _height: number = 0;

    override isStatic(size: number): boolean
    {
        const vis = this.getPlaneVisualization(size);

        if(vis !== null)
        {
            return !vis.hasAnimationLayers;
        }

        return super.isStatic(size);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapePlane.as::initializeDimensions()
    initializeDimensions(width: number, height: number): void
    {
        if(width < 0) width = 0;
        if(height < 0) height = 0;

        if(width !== this._width || height !== this._height)
        {
            this._width = width;
            this._height = height;
        }
    }

    /**
	 * Render the landscape plane.
	 *
	 * Transforms world-space lengths to screen-space using geometry,
	 * then delegates to PlaneVisualization.render().
	 *
	 * @param canvas - Target canvas
	 * @param leftLen - Left side length in world units
	 * @param rightLen - Right side length in world units
	 * @param scale - Visualization scale
	 * @param normal - Surface normal
	 * @param hasTexture - Whether the plane has a texture
	 * @param offsetU - U texture offset
	 * @param offsetV - V texture offset
	 * @param maxU - Maximum U extent
	 * @param maxV - Maximum V extent
	 * @param time - Current time in ms
	 * @returns Rendered canvas or null
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapePlane.as::render()
    render(
        canvas: HTMLCanvasElement | null,
        leftLen: number,
        rightLen: number,
        scale: number,
        normal: IVector3d,
        hasTexture: boolean,
        offsetU: number,
        offsetV: number,
        maxU: number,
        maxV: number,
        time: number
    ): HTMLCanvasElement | null
    {
        const vis = this.getPlaneVisualization(scale);

        if(vis === null || vis.geometry === null)
        {
            return null;
        }

        const origin = vis.geometry.getScreenPoint(new Vector3d(0, 0, 0));
        const zUnit = vis.geometry.getScreenPoint(new Vector3d(0, 0, 1));
        const yUnit = vis.geometry.getScreenPoint(new Vector3d(0, 1, 0));

        if(origin !== null && zUnit !== null && yUnit !== null)
        {
            const xScale = Math.abs(origin.x - yUnit.x);
            const yScale = Math.abs(origin.y - zUnit.y);

            const width = Math.round(Math.abs(xScale * leftLen / vis.geometry.scale));
            const height = Math.round(Math.abs(yScale * rightLen / vis.geometry.scale));

            const pixelOffsetX = Math.floor(offsetU * xScale);
            const pixelOffsetY = Math.floor(offsetV * yScale);
            const tileWidth = Math.floor(maxU * xScale);
            const tileHeight = Math.floor(maxV * yScale);

            return vis.render(canvas, width, height, normal, hasTexture, pixelOffsetX, pixelOffsetY, tileWidth, tileHeight, maxU, maxV, time);
        }

        return null;
    }
}
