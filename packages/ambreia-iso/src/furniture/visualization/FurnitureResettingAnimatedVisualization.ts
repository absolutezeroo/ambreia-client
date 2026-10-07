/**
 * FurnitureResettingAnimatedVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3450
 *
 * Animated furniture that resets its animation on each state change.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureResettingAnimatedVisualization extends AnimatedFurnitureVisualization
{
    protected override usesAnimationResetting(): boolean
    {
        return true;
    }
}
