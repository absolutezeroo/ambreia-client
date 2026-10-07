/**
 * Plane
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.rasterizer.basic.Plane
 *
 * Base class for rasterizer planes. Manages PlaneVisualizations per scale.
 */
import type {IRoomGeometry} from '../../../../../../utils/IRoomGeometry';
import {PlaneVisualization} from './PlaneVisualization';

export class Plane
{
    private _visualizations: Map<string, PlaneVisualization> = new Map();
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/Plane.as::_sizes
    private _sizes: number[] = [];
    private _cachedVisualization: PlaneVisualization | null = null;
    private _cachedSize: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/Plane.as::isStatic()
    isStatic(_size: number): boolean
    {
        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/Plane.as::dispose()
    dispose(): void
    {
        for(const vis of this._visualizations.values())
        {
            if(vis !== null)
            {
                vis.dispose();
            }
        }
        this._visualizations.clear();
        this._cachedVisualization = null;
        this._sizes = [];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/Plane.as::clearCache()
    clearCache(): void
    {
        for(const vis of this._visualizations.values())
        {
            if(vis !== null)
            {
                vis.clearCache();
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/Plane.as::createPlaneVisualization()
    createPlaneVisualization(size: number, layerCount: number, geometry: IRoomGeometry): PlaneVisualization | null
    {
        const key = String(size);
        if(this._visualizations.has(key))
        {
            return null;
        }

        const vis = new PlaneVisualization(size, layerCount, geometry);
        this._visualizations.set(key, vis);
        this._sizes.push(size);
        this._sizes.sort((a, b) => a - b);
        return vis;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/Plane.as::getLayers()
    getLayers(): (unknown | null)[]
    {
        const vis = this.getPlaneVisualization(this._cachedSize);
        if(vis !== null)
        {
            return vis.getLayers();
        }
        return [];
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/Plane.as::getPlaneVisualization()
    protected getPlaneVisualization(size: number): PlaneVisualization | null
    {
        if(size === this._cachedSize)
        {
            return this._cachedVisualization;
        }

        const sizeIndex = this.getSizeIndex(size);

        if(sizeIndex < this._sizes.length)
        {
            this._cachedVisualization = this._visualizations.get(String(this._sizes[sizeIndex])) ?? null;
        }
        else
        {
            this._cachedVisualization = null;
        }

        this._cachedSize = size;
        return this._cachedVisualization;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/rasterizer/basic/Plane.as::getSizeIndex()
    private getSizeIndex(size: number): number
    {
        let index = 0;

        for(let i = 1; i < this._sizes.length; i++)
        {
            if(this._sizes[i] > size)
            {
                if(this._sizes[i] - size < size - this._sizes[i - 1])
                {
                    index = i;
                }
                break;
            }
            index = i;
        }

        return index;
    }
}
