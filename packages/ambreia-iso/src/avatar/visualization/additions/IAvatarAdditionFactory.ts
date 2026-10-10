import type {Texture} from 'pixi.js';
import type {AvatarVisualization} from '../AvatarVisualization';
import type {IAvatarAddition} from './IAvatarAddition';
import type {IExpressionAddition} from './IExpressionAddition';

/** The typing bubble's depth follows the avatar's posture (AvatarVisualization sets it). */
export interface ITypingAddition extends IAvatarAddition
{
    relativeDepth: number;
}

/**
 * Builds an avatar's additions: the bubbles, hearts and Zs drawn over it. The effects module
 * provides one (AvatarAdditionFactory); without it AvatarVisualization draws none (J4, spec D4).
 */
export interface IAvatarAdditionFactory
{
    idle(id: number, visualization: AvatarVisualization): IAvatarAddition;
    muted(id: number, visualization: AvatarVisualization): IAvatarAddition;
    typing(id: number, visualization: AvatarVisualization): ITypingAddition;
    guide(id: number, visualization: AvatarVisualization, status: number): IAvatarAddition;
    number(id: number, visualization: AvatarVisualization, value: number): IAvatarAddition;
    /** TS-only (RPG F3b §7.3): the ring under the player's target. */
    target(id: number): IAvatarAddition;
    /**
     * TS-only (RPG): a sprite sheet played on the ground under the avatar, `ms` a frame, once or in
     * a loop, its anchor (in frame pixels) on the avatar's location.
     */
    sheet(id: number, frames: readonly Texture[], ms: number, loop: boolean, anchorX: number, anchorY: number): IAvatarAddition;
    expression(id: number, type: number, visualization: AvatarVisualization): IExpressionAddition | null;
}
