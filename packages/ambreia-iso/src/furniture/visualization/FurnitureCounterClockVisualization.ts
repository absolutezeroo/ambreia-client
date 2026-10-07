/**
 * FurnitureCounterClockVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3476
 *
 * Counter clock display - shows time using sprite tag digit decomposition.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureCounterClockVisualization extends AnimatedFurnitureVisualization
{
    private static readonly SECONDS_SPRITE_TAG: string = 'seconds_sprite';
    private static readonly TEN_SECONDS_SPRITE_TAG: string = 'ten_seconds_sprite';
    private static readonly MINUTES_SPRITE_TAG: string = 'minutes_sprite';
    private static readonly TEN_MINUTES_SPRITE_TAG: string = 'ten_minutes_sprite';

    override get animationId(): number
    {
        return 0;
    }

    protected override getFrameNumber(scale: number, layerIndex: number): number
    {
        const tag = this.getSpriteTag(scale, this.direction, layerIndex);
        const value = super.animationId;

        switch(tag)
        {
            case FurnitureCounterClockVisualization.SECONDS_SPRITE_TAG:
                return (value % 60) % 10;
            case FurnitureCounterClockVisualization.TEN_SECONDS_SPRITE_TAG:
                return Math.trunc((value % 60) / 10);
            case FurnitureCounterClockVisualization.MINUTES_SPRITE_TAG:
                return Math.trunc(value / 60) % 10;
            case FurnitureCounterClockVisualization.TEN_MINUTES_SPRITE_TAG:
                return Math.trunc(Math.trunc(value / 60) / 10) % 10;
            default:
                return super.getFrameNumber(scale, layerIndex);
        }
    }

    protected getSpriteTag(scale: number, direction: number, layerIndex: number): string
    {
        return super.getSpriteTag(scale, direction, layerIndex);
    }
}
