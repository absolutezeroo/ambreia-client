/**
 * FurnitureHabboWheelVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureHabboWheelVisualization
 *
 * Habbo wheel with queued spin/slow-down/stop animation transitions.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureHabboWheelVisualization extends AnimatedFurnitureVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureHabboWheelVisualization.as::ANIMATION_ID_OFFSET_SLOW1
    private static readonly ANIMATION_ID_OFFSET_SLOW1: number = 10;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureHabboWheelVisualization.as::ANIMATION_ID_OFFSET_SLOW2
    private static readonly ANIMATION_ID_OFFSET_SLOW2: number = 20;
    private static readonly ANIMATION_ID_ROLL: number = 31;
    private static readonly ANIMATION_ID_BOUNCE: number = 32;

    private _animationQueue: number[] = [];
    private _isRunning: boolean = false;

    protected override setAnimation(animationId: number): void
    {
        if(animationId === -1)
        {
            if(!this._isRunning)
            {
                this._isRunning = true;
                this._animationQueue = [];
                this._animationQueue.push(FurnitureHabboWheelVisualization.ANIMATION_ID_ROLL);
                this._animationQueue.push(FurnitureHabboWheelVisualization.ANIMATION_ID_BOUNCE);

                return;
            }
        }

        if(animationId > 0 && animationId <= 10)
        {
            if(this._isRunning)
            {
                this._isRunning = false;
                this._animationQueue = [];
                this._animationQueue.push(FurnitureHabboWheelVisualization.ANIMATION_ID_OFFSET_SLOW1 + animationId);
                this._animationQueue.push(FurnitureHabboWheelVisualization.ANIMATION_ID_OFFSET_SLOW2 + animationId);
                this._animationQueue.push(animationId);

                return;
            }

            super.setAnimation(animationId);
        }
    }

    protected override updateAnimation(scale: number): number
    {
        if(super.getLastFramePlayed(1) && super.getLastFramePlayed(2) && super.getLastFramePlayed(3))
        {
            if(this._animationQueue.length > 0)
            {
                super.setAnimation(this._animationQueue.shift()!);
            }
        }

        return super.updateAnimation(scale);
    }
}
