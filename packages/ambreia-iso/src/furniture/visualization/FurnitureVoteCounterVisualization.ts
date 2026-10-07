/**
 * FurnitureVoteCounterVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3470
 *
 * Vote counter display - shows 3-digit score from room object model.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureVoteCounterVisualization extends AnimatedFurnitureVisualization
{
    private static readonly ONES_SPRITE_TAG: string = 'ones_sprite';
    private static readonly TENS_SPRITE_TAG: string = 'tens_sprite';
    private static readonly HUNDREDS_SPRITE_TAG: string = 'hundreds_sprite';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVoteCounterVisualization.as::HIDE_COUNTER_SCORE
    private static readonly HIDE_COUNTER_SCORE: number = -1;

    protected override updateObject(scale: number, geometryDirection: number): boolean
    {
        super.updateObject(scale, geometryDirection);

        return true;
    }

    protected override getFrameNumber(scale: number, layerIndex: number): number
    {
        const model = this.object?.getModel();

        if(model === null || model === undefined)
        {
            return super.getFrameNumber(scale, layerIndex);
        }

        const count = Math.trunc(model.getNumber('furniture_vote_counter_count'));
        const tag = this.getSpriteTag(scale, this.direction, layerIndex);

        switch(tag)
        {
            case FurnitureVoteCounterVisualization.ONES_SPRITE_TAG:
                return count % 10;
            case FurnitureVoteCounterVisualization.TENS_SPRITE_TAG:
                return Math.trunc(count / 10) % 10;
            case FurnitureVoteCounterVisualization.HUNDREDS_SPRITE_TAG:
                return Math.trunc(count / 100) % 10;
            default:
                return super.getFrameNumber(scale, layerIndex);
        }
    }

    protected override getSpriteAlpha(scale: number, direction: number, layerIndex: number): number
    {
        const model = this.object?.getModel();

        if(model !== null && model !== undefined)
        {
            const count = Math.trunc(model.getNumber('furniture_vote_counter_count'));

            if(count === FurnitureVoteCounterVisualization.HIDE_COUNTER_SCORE)
            {
                const tag = this.getSpriteTag(scale, direction, layerIndex);

                switch(tag)
                {
                    case FurnitureVoteCounterVisualization.ONES_SPRITE_TAG:
                    case FurnitureVoteCounterVisualization.TENS_SPRITE_TAG:
                    case FurnitureVoteCounterVisualization.HUNDREDS_SPRITE_TAG:
                        return 0;
                }
            }
        }

        return super.getSpriteAlpha(scale, direction, layerIndex);
    }

    protected getSpriteTag(scale: number, direction: number, layerIndex: number): string
    {
        return super.getSpriteTag(scale, direction, layerIndex);
    }
}
