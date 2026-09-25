/**
 * LandscapeRasterizer
 *
 * @see com.sulake.habbo.room.object.visualization.room.rasterizer.animated.LandscapeRasterizer
 *
 * Extends PlaneRasterizer for landscape planes with animated layers.
 * Landscape planes can have both static visualization layers and
 * animated layers (scrolling clouds, birds, etc.).
 */
import type {IVector3d} from '@room/utils/IVector3d';
import {PlaneRasterizer} from '../basic/PlaneRasterizer';
import {PlaneBitmapData} from '../../utils/PlaneBitmapData';
import {Randomizer} from '../../utils/Randomizer';
import {LandscapePlane} from './LandscapePlane';
import type {IAnimationItemData} from './PlaneVisualizationAnimationLayer';
import type {
    IAssetPlane,
    IAssetPlaneAnimationItem,
    IAssetPlaneVisualizationLayer,
} from '../basic/PlaneRasterizerTypes';

export class LandscapeRasterizer extends PlaneRasterizer
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapeRasterizer.as::UPDATE_INTERVAL
    private static readonly UPDATE_INTERVAL: number = 500;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapeRasterizer.as::_landscapeWidth
    private _landscapeWidth: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapeRasterizer.as::_landscapeHeight
    private _landscapeHeight: number = 0;

    override initializeDimensions(width: number, height: number): boolean
    {
        if(width < 0) width = 0;
        if(height < 0) height = 0;

        this._landscapeWidth = width;
        this._landscapeHeight = height;
        return true;
    }

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
        maxU: number = 0,
        maxV: number = 0,
        time: number = 0
    ): PlaneBitmapData | null
    {
        let plane = this.getPlane(id) as LandscapePlane | null;

        if(plane === null)
        {
            plane = this.getPlane('default') as LandscapePlane | null;
        }

        if(plane === null) return null;

        if(canvas !== null)
        {
            const ctx = canvas.getContext('2d')!;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        let result = plane.render(canvas, leftLen, rightLen, scale, normal, hasTexture, offsetU, offsetV, maxU, maxV, time);

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

        // Static planes get cached indefinitely (-1), animated planes get timed updates
        if(!plane.isStatic(scale))
        {
            return new PlaneBitmapData(result, Math.round(time / LandscapeRasterizer.UPDATE_INTERVAL) * LandscapeRasterizer.UPDATE_INTERVAL + LandscapeRasterizer.UPDATE_INTERVAL);
        }

        return new PlaneBitmapData(result, -1);
    }

    override getTextureIdentifier(scale: number, normal: IVector3d): string
    {
        if(normal !== null)
        {
            if(normal.x < 0)
            {
                return scale + '_0';
            }

            return scale + '_1';
        }

        return super.getTextureIdentifier(scale, normal);
    }

    protected override initializePlanes(): void
    {
        if(this.data === null) return;

        const planes = this.data.planes;

        if(planes)
        {
            this.parseLandscapes(planes);
        }
    }

    /**
	 * Parse landscape plane definitions from data.
	 *
	 * Each landscape can have both static visualization layers and
	 * animated layers containing scrolling animation items.
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapeRasterizer.as::parseLandscapes()
    private parseLandscapes(planes: IAssetPlane[]): void
    {
        if(planes === null) return;

        const seed = Math.floor(Math.random() * 654321);

        for(const planeData of planes)
        {
            if(planeData.id === undefined) continue;

            const id = planeData.id;
            // AS3 reads `<animatedVisualization>`, and so does the bundle: `animatedVisualization`.
            // Reading `visualizations` (the floor/wall key) left every landscape plane empty, so the
            // rasterizer drew nothing and no window ever showed its view.
            const visualizations = planeData.animatedVisualization ?? [];
            const landscapePlane = new LandscapePlane();

            for(const visData of visualizations)
            {
                if(visData.size === undefined) continue;

                const size = visData.size;
                const horizontalAngle = visData.horizontalAngle ?? LandscapePlane.HORIZONTAL_ANGLE_DEFAULT;
                const verticalAngle = visData.verticalAngle ?? LandscapePlane.VERTICAL_ANGLE_DEFAULT;
                const layers = visData.allLayers ?? [];

                const vis = landscapePlane.createPlaneVisualization(
                    size,
                    layers.length,
                    this.getGeometry(size, horizontalAngle, verticalAngle)
                );

                if(vis !== null)
                {
                    Randomizer.setSeed(seed);

                    for(let layerIndex = 0; layerIndex < layers.length; layerIndex++)
                    {
                        const layerData = layers[layerIndex] as IAssetPlaneVisualizationLayer;

                        // AS3 tells `<visualizationLayer>` from `<animationLayer>` by element name. The
                        // bundle flattens both into `allLayers` with no type field; only an
                        // animation layer carries `items`.
                        if(layerData.items !== undefined)
                        {
                            const items = this.parseAnimationItems(layerData.items);
                            vis.setAnimationLayer(layerIndex, items, this.assetCollection);
                        }
                        else
                        {
                            // Regular visualization layer
                            let material = null;
                            let align = 1; // ALIGN_TOP

                            if(layerData.materialId !== undefined)
                            {
                                material = this.getMaterial(layerData.materialId);
                            }

                            const offset = layerData.offset ?? 0;
                            const color = layerData.color ?? 0xFFFFFF;

                            if(layerData.align === 'bottom')
                            {
                                align = 2;
                            }
                            else if(layerData.align === 'top')
                            {
                                align = 1;
                            }

                            vis.setLayer(layerIndex, material, color, align, offset);
                        }
                    }
                }
            }

            if(!this.addPlane(id, landscapePlane))
            {
                landscapePlane.dispose();
            }
        }
    }

    /**
	 * Parse animation items from data, resolving coordinate values with random offsets.
	 */
    private parseAnimationItems(items: IAssetPlaneAnimationItem[]): IAnimationItemData[]
    {
        const result: IAnimationItemData[] = [];

        for(const itemData of items)
        {
            if(itemData.assetId === undefined) continue;

            const x = this.getCoordinateValue(itemData.x ?? '', itemData.randomX ?? '');
            const y = this.getCoordinateValue(itemData.y ?? '', itemData.randomY ?? '');
            const speedX = itemData.speedX ?? 0;
            const speedY = itemData.speedY ?? 0;

            result.push({
                asset: itemData.assetId,
                x,
                y,
                speedX,
                speedY,
            });
        }

        return result;
    }

    /**
	 * Parse a coordinate value with optional random offset.
	 *
	 * Values ending in '%' are interpreted as percentages (0-100 → 0-1).
	 * Random values add a random offset using the seeded Randomizer.
	 *
	 * @see AS3 LandscapeRasterizer.getCoordinateValue()
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/animated/LandscapeRasterizer.as::getCoordinateValue()
    private getCoordinateValue(value: string, random: string): number
    {
        let result = 0;

        if(value.length > 0)
        {
            if(value.charAt(value.length - 1) === '%')
            {
                const numStr = value.substring(0, value.length - 1);
                result = parseFloat(numStr) / 100;
            }
        }

        if(random.length > 0)
        {
            const maxRandom = 10000;
            const values = Randomizer.getValues(1, 0, maxRandom);
            const randomFactor = values[0] / maxRandom;

            if(random.charAt(random.length - 1) === '%')
            {
                const numStr = random.substring(0, random.length - 1);
                result += randomFactor * parseFloat(numStr) / 100;
            }
        }

        return result;
    }
}
