/**
 * FurnitureScoreBoardVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3449
 *
 * Score board display - shows 4-digit score via sprite tag decomposition.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureScoreBoardVisualization extends AnimatedFurnitureVisualization
{
    private static readonly ONES_SPRITE_TAG: string = 'ones_sprite';
    private static readonly TENS_SPRITE_TAG: string = 'tens_sprite';
    private static readonly HUNDREDS_SPRITE_TAG: string = 'hundreds_sprite';
    private static readonly THOUSANDS_SPRITE_TAG: string = 'thousands_sprite';

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
            case FurnitureScoreBoardVisualization.ONES_SPRITE_TAG:
                return value % 10;
            case FurnitureScoreBoardVisualization.TENS_SPRITE_TAG:
                return Math.trunc(value / 10) % 10;
            case FurnitureScoreBoardVisualization.HUNDREDS_SPRITE_TAG:
                return Math.trunc(value / 100) % 10;
            case FurnitureScoreBoardVisualization.THOUSANDS_SPRITE_TAG:
                return Math.trunc(value / 1000) % 10;
            default:
                return super.getFrameNumber(scale, layerIndex);
        }
    }

    protected getSpriteTag(scale: number, direction: number, layerIndex: number): string
    {
        return super.getSpriteTag(scale, direction, layerIndex);
    }
}
