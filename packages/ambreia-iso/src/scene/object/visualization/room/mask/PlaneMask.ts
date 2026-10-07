/**
 * PlaneMask
 *
 * @see com.sulake.habbo.room.object.visualization.room.mask.PlaneMask
 *
 * Manager for mask visualizations at different sizes.
 * Maps size → PlaneMaskVisualization and caches current visualization.
 */
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import type {IVector3d} from '../../../../../utils/IVector3d';
import {PlaneMaskVisualization} from './PlaneMaskVisualization';

export class PlaneMask
{
    private _visualizations: Map<string, PlaneMaskVisualization> = new Map();
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::_sizes
    private _sizes: number[] = [];
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::_assetNames
    private _assetNames: Map<number, string> = new Map();
    private _cachedVisualization: PlaneMaskVisualization | null = null;
    private _cachedSize: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::dispose()
    dispose(): void
    {
        for(const viz of this._visualizations.values())
        {
            viz.dispose();
        }

        this._visualizations.clear();
        this._sizes = [];
        this._cachedVisualization = null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::createMaskVisualization()
    createMaskVisualization(size: number): PlaneMaskVisualization | null
    {
        const key = String(size);

        if(this._visualizations.has(key))
        {
            return null;
        }

        const viz = new PlaneMaskVisualization();
        this._visualizations.set(key, viz);
        this._sizes.push(size);
        this._sizes.sort((a, b) => a - b);

        return viz;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::getGraphicAsset()
    getGraphicAsset(scale: number, position: IVector3d): IGraphicAsset | null
    {
        const viz = this.getMaskVisualization(scale);

        if(viz === null)
        {
            return null;
        }

        return viz.getAsset(position);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::getAssetName()
    getAssetName(size: number): string | null
    {
        return this._assetNames.get(size) || null;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::setAssetName()
    setAssetName(size: number, name: string): void
    {
        this._assetNames.set(size, name);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::getMaskVisualization()
    protected getMaskVisualization(scale: number): PlaneMaskVisualization | null
    {
        if(scale === this._cachedSize)
        {
            return this._cachedVisualization;
        }

        const sizeIndex = this.getSizeIndex(scale);

        if(sizeIndex < this._sizes.length)
        {
            this._cachedVisualization = this._visualizations.get(String(this._sizes[sizeIndex])) || null;
        }
        else
        {
            this._cachedVisualization = null;
        }

        this._cachedSize = scale;

        return this._cachedVisualization;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/mask/PlaneMask.as::getSizeIndex()
    private getSizeIndex(scale: number): number
    {
        let index = 0;

        for(let i = 1; i < this._sizes.length; i++)
        {
            if(this._sizes[i] > scale)
            {
                if(this._sizes[i] - scale < scale - this._sizes[i - 1])
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
