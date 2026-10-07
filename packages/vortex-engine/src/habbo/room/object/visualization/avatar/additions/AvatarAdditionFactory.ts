import type {AvatarVisualization} from '../AvatarVisualization';
import type {IAvatarAddition} from './IAvatarAddition';
import type {IExpressionAddition} from './IExpressionAddition';
import type {IAvatarAdditionFactory, ITypingAddition} from './IAvatarAdditionFactory';
import {FloatingIdleZ} from './FloatingIdleZ';
import {MutedBubble} from './MutedBubble';
import {TypingBubble} from './TypingBubble';
import {GuideStatusBubble} from './GuideStatusBubble';
import {NumberBubble} from './NumberBubble';
import {ExpressionAdditionFactory} from './ExpressionAdditionFactory';

/** The additions AvatarVisualization built itself before J4, now behind the effects module. */
export class AvatarAdditionFactory implements IAvatarAdditionFactory
{
    public idle(id: number, visualization: AvatarVisualization): IAvatarAddition
    {
        return new FloatingIdleZ(id, visualization);
    }

    public muted(id: number, visualization: AvatarVisualization): IAvatarAddition
    {
        return new MutedBubble(id, visualization);
    }

    public typing(id: number, visualization: AvatarVisualization): ITypingAddition
    {
        return new TypingBubble(id, visualization);
    }

    public guide(id: number, visualization: AvatarVisualization, status: number): IAvatarAddition
    {
        return new GuideStatusBubble(id, visualization, status);
    }

    public number(id: number, visualization: AvatarVisualization, value: number): IAvatarAddition
    {
        return new NumberBubble(id, value, visualization);
    }

    public expression(id: number, type: number, visualization: AvatarVisualization): IExpressionAddition | null
    {
        return ExpressionAdditionFactory.make(id, type, visualization);
    }
}
