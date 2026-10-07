/**
 * FloatingHeart
 *
 * Avatar addition that shows a floating heart effect for the "blow a kiss"
 * expression. Implements a three-stage animation: delay, fade-in, and
 * floating upward while fading out.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as
 */
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {AvatarVisualization} from '../../avatar/visualization/AvatarVisualization';
import {ExpressionAddition} from './ExpressionAddition';

export class FloatingHeart extends ExpressionAddition 
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::DELAY_BEFORE_ANIMATION
    private static readonly DELAY_BEFORE_ANIMATION: number = 300;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::STATE_DELAY
    private static readonly STATE_DELAY: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::STATE_FADE_IN
    private static readonly STATE_FADE_IN: number = 1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::STATE_FLOAT
    private static readonly STATE_FLOAT: number = 2;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::STATE_COMPLETE
    private static readonly STATE_COMPLETE: number = 3;

    private _assetName: string | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::_startTime
    private _startTime: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::_delta
    private _delta: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::_offsetY
    private _offsetY: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::_scale
    private _scale: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingHeart.as::_state
    private _state: number = -1;

    constructor(id: number, type: number, visualization: AvatarVisualization) 
    {
        super(id, type, visualization);
        this._startTime = performance.now();
        this._state = FloatingHeart.STATE_DELAY;
    }

    /**
     * Animates the floating heart through delay, fade-in, and float stages.
     *
     * @param sprite - The sprite to animate
     * @returns True if the animation caused a visual change
     */
    override animate(sprite: IRoomObjectSprite | null): boolean 
    {
        if(!sprite) 
        {
            return false;
        }

        if(this._assetName) 
        {
            sprite.assetName = this._assetName;
        }

        const now = performance.now();

        if(this._state === FloatingHeart.STATE_DELAY) 
        {
            if((now - this._startTime) < FloatingHeart.DELAY_BEFORE_ANIMATION) 
            {
                return false;
            }

            this._state = FloatingHeart.STATE_FADE_IN;
            sprite.alpha = 0;
            sprite.visible = true;
            this._delta = 0;

            return true;
        }

        if(this._state === FloatingHeart.STATE_FADE_IN) 
        {
            this._delta = this._delta + 0.1;
            sprite.offsetY = this._offsetY;
            sprite.alpha = Math.floor(Math.pow(this._delta, 0.9) * 255);

            if(this._delta >= 1) 
            {
                this._delta = 0;
                sprite.alpha = 255;
                this._state = FloatingHeart.STATE_FLOAT;
            }

            return true;
        }

        if(this._state === FloatingHeart.STATE_FLOAT) 
        {
            const eased = Math.pow(this._delta, 0.9);
            this._delta = this._delta + 0.05;

            const floatDistance = (this._scale < 48) ? -30 : -40;
            sprite.offsetY = this._offsetY + (((this._delta < 1) ? eased : 1) * floatDistance);
            sprite.alpha = Math.floor((1 - eased) * 255);

            if(sprite.alpha <= 0) 
            {
                sprite.visible = false;
                this._state = FloatingHeart.STATE_COMPLETE;
            }

            return true;
        }

        return false;
    }

    /**
     * Updates the floating heart position and asset based on scale and posture.
     *
     * @param sprite - The sprite to update
     * @param scale - The current visualization scale
     */
    override update(sprite: IRoomObjectSprite | null, scale: number): void 
    {
        if(!sprite) 
        {
            return;
        }

        let offsetX: number;

        this._scale = scale;

        let fullSize = 64;

        if(scale < 48) 
        {
            this._assetName = 'user_blowkiss_small_png';

            if(this._visualization.angle === 90 || this._visualization.angle === 270) 
            {
                offsetX = 0;
            }
            else if(this._visualization.angle === 135 || this._visualization.angle === 180 ||
                this._visualization.angle === 225) 
            {
                offsetX = 6;
            }
            else 
            {
                offsetX = -6;
            }

            this._offsetY = -38;
            fullSize = 32;
        }
        else 
        {
            this._assetName = 'user_blowkiss_png';

            if(this._visualization.angle === 90 || this._visualization.angle === 270) 
            {
                offsetX = -3;
            }
            else if(this._visualization.angle === 135 || this._visualization.angle === 180 ||
                this._visualization.angle === 225) 
            {
                offsetX = 22;
            }
            else 
            {
                offsetX = -30;
            }

            this._offsetY = -70;
        }

        if(this._visualization.posture === 'sit') 
        {
            this._offsetY = this._offsetY + (fullSize / 2);
        }
        else if(this._visualization.posture === 'lay') 
        {
            this._offsetY = this._offsetY + fullSize;
        }

        if(this._assetName != null) 
        {
            sprite.assetName = this._assetName;
            sprite.offsetX = offsetX;
            sprite.offsetY = this._offsetY;
            sprite.relativeDepth = -0.02;
            sprite.alpha = 0;

            const savedDelta = this._delta;
            this.animate(sprite);
            this._delta = savedDelta;
        }
    }
}
