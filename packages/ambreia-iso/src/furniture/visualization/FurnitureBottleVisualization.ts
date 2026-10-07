/**
 * FurnitureBottleVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureBottleVisualization
 *
 * Bottle furniture with queued animation transitions (spinning effect).
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureBottleVisualization extends AnimatedFurnitureVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureBottleVisualization.as::ANIMATION_ID_OFFSET_SLOW1
    private static readonly ANIMATION_ID_OFFSET_SLOW1: number = 20;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureBottleVisualization.as::ANIMATION_ID_OFFSET_SLOW2
    private static readonly ANIMATION_ID_OFFSET_SLOW2: number = 9;
    private static readonly STATE_IDLE: number = -1;

    private _animationQueue: number[] = [];
    private _isIdle: boolean = false;

    protected override setAnimation(animationId: number): void
    {
        if(animationId === FurnitureBottleVisualization.STATE_IDLE)
        {
            if(!this._isIdle)
            {
                this._isIdle = true;
                this._animationQueue = [];
                this._animationQueue.push(FurnitureBottleVisualization.STATE_IDLE);

                return;
            }
        }

        if(animationId >= 0 && animationId <= 7)
        {
            if(this._isIdle)
            {
                this._isIdle = false;
                this._animationQueue = [];
                this._animationQueue.push(FurnitureBottleVisualization.ANIMATION_ID_OFFSET_SLOW1);
                this._animationQueue.push(FurnitureBottleVisualization.ANIMATION_ID_OFFSET_SLOW2 + animationId);
                this._animationQueue.push(animationId);

                return;
            }

            super.setAnimation(animationId);
        }
    }

    protected override updateAnimation(scale: number): number
    {
        if(super.getLastFramePlayed(0))
        {
            if(this._animationQueue.length > 0)
            {
                super.setAnimation(this._animationQueue.shift()!);
            }
        }

        return super.updateAnimation(scale);
    }
}
