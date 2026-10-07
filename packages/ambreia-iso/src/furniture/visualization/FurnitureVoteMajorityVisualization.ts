/**
 * FurnitureVoteMajorityVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3426
 *
 * Vote majority display - shows 3-digit result, hides when inactive.
 */
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureVoteMajorityVisualization extends AnimatedFurnitureVisualization
{
    private static readonly ONES_SPRITE_TAG: string = 'ones_sprite';
    private static readonly TENS_SPRITE_TAG: string = 'tens_sprite';
    private static readonly HUNDREDS_SPRITE_TAG: string = 'hundreds_sprite';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureVoteMajorityVisualization.as::HIDE_RESULTS_STATES
    private static readonly HIDE_RESULTS_STATES: number[] = [-1, 1];
    private static readonly HIDE_RESULT_VALUE: number = -1;

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

        const result = Math.trunc(model.getNumber('furniture_vote_majority_result'));
        const tag = this.getSpriteTag(scale, this.direction, layerIndex);

        switch(tag)
        {
            case FurnitureVoteMajorityVisualization.ONES_SPRITE_TAG:
                return result % 10;
            case FurnitureVoteMajorityVisualization.TENS_SPRITE_TAG:
                return Math.trunc(result / 10) % 10;
            case FurnitureVoteMajorityVisualization.HUNDREDS_SPRITE_TAG:
                return Math.trunc(result / 100) % 10;
            default:
                return super.getFrameNumber(scale, layerIndex);
        }
    }

    protected override getSpriteAlpha(scale: number, direction: number, layerIndex: number): number
    {
        const model = this.object?.getModel();

        if(model !== null && model !== undefined)
        {
            const result = Math.trunc(model.getNumber('furniture_vote_majority_result'));
            const state = this.object!.getState(0);

            if(FurnitureVoteMajorityVisualization.HIDE_RESULTS_STATES.indexOf(state) !== -1 ||
				result === FurnitureVoteMajorityVisualization.HIDE_RESULT_VALUE)
            {
                const tag = this.getSpriteTag(scale, direction, layerIndex);

                switch(tag)
                {
                    case FurnitureVoteMajorityVisualization.ONES_SPRITE_TAG:
                    case FurnitureVoteMajorityVisualization.TENS_SPRITE_TAG:
                    case FurnitureVoteMajorityVisualization.HUNDREDS_SPRITE_TAG:
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
