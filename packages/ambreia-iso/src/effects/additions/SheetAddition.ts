import type {Texture} from 'pixi.js';
import {AlphaTolerance} from '../../object/enum/AlphaTolerance';
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {IAvatarAddition} from '../../avatar/visualization/additions/IAvatarAddition';

/**
 * A sprite sheet played on the ground under an avatar (a sigil, a circle of light): one
 * frame after another, `ms` each, once or in a loop, drawn behind the avatar like its shadow
 * (relativeDepth 1, as SelectionRing) with the sheet's anchor on the avatar's location. Done once a
 * single play ends; whoever added it removes it (AvatarVisualization.removeExternalAddition()).
 */
// TS-only: Habbo has no ground effect.
export class SheetAddition implements IAvatarAddition
{
    private readonly _born = performance.now();
    private _frame = -1;
    private _disposed = false;

    constructor(
        readonly id: number,
        private readonly _frames: readonly Texture[],
        private readonly _ms: number,
        private readonly _loop: boolean,
        private readonly _anchorX: number,
        private readonly _anchorY: number
    ) {}

    get disposed(): boolean
    {
        return this._disposed;
    }

    /** A single play has ended. */
    get done(): boolean
    {
        return !this._loop && performance.now() - this._born >= this._frames.length * this._ms;
    }

    update(sprite: IRoomObjectSprite | null, _scale: number): void
    {
        if(!sprite) return;

        sprite.visible = true;
        // No name: AvatarVisualization.applyAdditionTexture() keeps a texture an addition set itself.
        sprite.assetName = '';
        sprite.texture = this._frames[Math.max(0, this._frame)];
        sprite.offsetX = -this._anchorX;
        sprite.offsetY = -this._anchorY;
        sprite.relativeDepth = 1;
        sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;
    }

    animate(sprite: IRoomObjectSprite | null): boolean
    {
        if(!sprite || this._frames.length === 0) return false;

        const elapsed = Math.floor((performance.now() - this._born) / this._ms);
        const frame = this._loop ? elapsed % this._frames.length : Math.min(elapsed, this._frames.length - 1);

        if(frame === this._frame) return false;

        this._frame = frame;
        sprite.texture = this._frames[frame];
        // Hidden once a single play ends, until it is removed.
        sprite.visible = this._loop || elapsed < this._frames.length;

        return true;
    }

    dispose(): void
    {
        this._disposed = true;
    }
}
