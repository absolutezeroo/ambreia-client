/**
 * FurnitureSoundblockVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3379
 *
 * Sound block with variable-speed animation driven by model property.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureSoundblockVisualization extends AnimatedFurnitureVisualization
{
    private _frameIncreaseOverride: number = 1;
    private _frameAccumulator: number = 0;

    protected override get frameIncrease(): number
    {
        return this._frameIncreaseOverride;
    }

    protected override updateAnimations(scale: number): number
    {
        const model = this.object?.getModel();

        if(model !== null && model !== undefined)
        {
            this._frameAccumulator += model.getNumber('furniture_soundblock_relative_animation_speed') || 0;
            this._frameIncreaseOverride = Math.trunc(this._frameAccumulator);
            this._frameAccumulator -= this._frameIncreaseOverride;
        }

        return super.updateAnimations(scale);
    }
}
