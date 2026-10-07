/**
 * FurnitureQueueTileVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureQueueTileVisualization
 *
 * Queue tile furniture with queued animation and resetting support.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureQueueTileVisualization extends AnimatedFurnitureVisualization
{
    private static readonly STATE_ACTIVATE: number = 2;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureQueueTileVisualization.as::ANIMATION_ID_NORMAL
    private static readonly ANIMATION_ID_NORMAL: number = 1;
    private static readonly QUEUE_DELAY: number = 15;

    private _animationQueue: number[] = [];
    private _queueDelay: number = 0;

    protected override setAnimation(animationId: number): void
    {
        if(animationId === FurnitureQueueTileVisualization.STATE_ACTIVATE)
        {
            this._animationQueue = [];
            this._animationQueue.push(FurnitureQueueTileVisualization.ANIMATION_ID_NORMAL);
            this._queueDelay = FurnitureQueueTileVisualization.QUEUE_DELAY;
        }

        super.setAnimation(animationId);
    }

    protected override updateAnimation(scale: number): number
    {
        if(this._queueDelay > 0)
        {
            this._queueDelay--;
        }

        if(this._queueDelay === 0)
        {
            if(this._animationQueue.length > 0)
            {
                super.setAnimation(this._animationQueue.shift()!);
            }
        }

        return super.updateAnimation(scale);
    }

    protected override usesAnimationResetting(): boolean
    {
        return true;
    }
}
