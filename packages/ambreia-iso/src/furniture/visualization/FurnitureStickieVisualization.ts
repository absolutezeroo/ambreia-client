/**
 * FurnitureStickieVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureStickieVisualization
 *
 * Sticky note furniture - overrides color to always use visualization data color.
 */
import type {IRoomObjectVisualizationData} from '../../object/visualization/IRoomObjectVisualizationData';
import type {FurnitureVisualizationData} from './FurnitureVisualizationData';
import {FurnitureVisualization} from './FurnitureVisualization';

export class FurnitureStickieVisualization extends FurnitureVisualization
{
    private _vizData: FurnitureVisualizationData | null = null;

    override initialize(data: IRoomObjectVisualizationData): boolean
    {
        this._vizData = data as unknown as FurnitureVisualizationData;

        return super.initialize(data);
    }

    protected override getSpriteColor(scale: number, layerIndex: number, colorId: number): number
    {
        if(this._vizData === null)
        {
            return 0xFFFFFF;
        }

        return this._vizData.getColor(scale, layerIndex, colorId);
    }
}
