import type {Texture} from 'pixi.js';
import type {AvatarVisualization} from '../../avatar/visualization/AvatarVisualization';
import type {IAvatarAddition} from '../../avatar/visualization/additions/IAvatarAddition';
import type {IExpressionAddition} from '../../avatar/visualization/additions/IExpressionAddition';
import type {IAvatarAdditionFactory, ITypingAddition} from '../../avatar/visualization/additions/IAvatarAdditionFactory';
import {FloatingIdleZ} from './FloatingIdleZ';
import {MutedBubble} from './MutedBubble';
import {TypingBubble} from './TypingBubble';
import {GuideStatusBubble} from './GuideStatusBubble';
import {NumberBubble} from './NumberBubble';
import {SheetAddition} from './SheetAddition';
import {SelectionRing} from './SelectionRing';
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

    public selectionRing(id: number): IAvatarAddition
    {
        return new SelectionRing(id);
    }

    public sheet(id: number, frames: readonly Texture[], ms: number, loop: boolean, anchorX: number, anchorY: number): IAvatarAddition
    {
        return new SheetAddition(id, frames, ms, loop, anchorX, anchorY);
    }

    public expression(id: number, type: number, visualization: AvatarVisualization): IExpressionAddition | null
    {
        return ExpressionAdditionFactory.make(id, type, visualization);
    }
}
