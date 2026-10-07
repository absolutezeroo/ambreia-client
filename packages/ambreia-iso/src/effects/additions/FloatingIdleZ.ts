/**
 * FloatingIdleZ
 *
 * Avatar addition that shows a floating "Z" animation when the avatar is
 * idle/sleeping. Alternates between two animation frames with a delay.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as
 */
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {IAvatarAddition} from '../../avatar/visualization/additions/IAvatarAddition';
import type {AvatarVisualization} from '../../avatar/visualization/AvatarVisualization';

export class FloatingIdleZ implements IAvatarAddition 
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::DELAY_BEFORE_ANIMATION
    private static readonly DELAY_BEFORE_ANIMATION: number = 2000;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::DELAY_PER_FRAME
    private static readonly DELAY_PER_FRAME: number = 2000;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::STATE_DELAY
    private static readonly STATE_DELAY: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::STATE_FRAME_A
    private static readonly STATE_FRAME_A: number = 1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::STATE_FRAME_B
    private static readonly STATE_FRAME_B: number = 2;

    protected _visualization: AvatarVisualization;
    private _assetName: string | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::_startTime
    private _startTime: number;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::_offsetY
    private _offsetY: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::_scale
    private _scale: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::_state
    private _state: number = -1;

    constructor(id: number, visualization: AvatarVisualization) 
    {
        this._id = id;
        this._visualization = visualization;
        this._startTime = performance.now();
        this._state = FloatingIdleZ.STATE_DELAY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::_id
    protected _id: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::get id()
    get id(): number 
    {
        return this._id;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::get disposed()
    get disposed(): boolean 
    {
        return this._visualization == null;
    }

    /**
     * Animates the floating Z between frames with timing delays.
     *
     * @param sprite - The sprite to animate
     * @returns True if a visual change occurred
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean 
    {
        if(!sprite) 
        {
            return false;
        }

        const now = performance.now();

        if(this._state === FloatingIdleZ.STATE_DELAY) 
        {
            if((now - this._startTime) >= FloatingIdleZ.DELAY_BEFORE_ANIMATION) 
            {
                this._state = FloatingIdleZ.STATE_FRAME_A;
                this._startTime = now;
                this._assetName = this.getAssetNameForFrame(1);
            }
        }

        if(this._state === FloatingIdleZ.STATE_FRAME_A) 
        {
            if((now - this._startTime) >= FloatingIdleZ.DELAY_PER_FRAME) 
            {
                this._state = FloatingIdleZ.STATE_FRAME_B;
                this._startTime = now;
                this._assetName = this.getAssetNameForFrame(2);
            }
        }

        if(this._state === FloatingIdleZ.STATE_FRAME_B) 
        {
            if((now - this._startTime) >= FloatingIdleZ.DELAY_PER_FRAME) 
            {
                this._state = FloatingIdleZ.STATE_FRAME_A;
                this._startTime = now;
                this._assetName = this.getAssetNameForFrame(1);
            }
        }

        if(this._assetName) 
        {
            sprite.assetName = this._assetName;
            sprite.alpha = 255;
            sprite.visible = true;
        }
        else 
        {
            sprite.visible = false;
        }

        return false;
    }

    /**
     * Updates the sprite position and scale for the idle Z addition.
     *
     * @param sprite - The sprite to update
     * @param scale - The current visualization scale
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::update()
    update(sprite: IRoomObjectSprite | null, scale: number): void 
    {
        if(!sprite) 
        {
            return;
        }

        let offsetX: number;

        this._scale = scale;
        this._assetName = this.getAssetNameForFrame((this._state === FloatingIdleZ.STATE_FRAME_A) ? 1 : 2);

        let fullSize = 64;

        if(scale < 48) 
        {
            if(this._visualization.angle === 135 || this._visualization.angle === 180 ||
                this._visualization.angle === 225 || this._visualization.angle === 270) 
            {
                offsetX = 10;
            }
            else 
            {
                offsetX = -16;
            }

            this._offsetY = -38;
            fullSize = 32;
        }
        else 
        {
            if(this._visualization.angle === 135 || this._visualization.angle === 180 ||
                this._visualization.angle === 225 || this._visualization.angle === 270) 
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
            this._offsetY = this._offsetY + (fullSize - (0.3 * fullSize));
        }

        if(this._assetName != null) 
        {
            sprite.assetName = this._assetName;
            sprite.offsetX = offsetX;
            sprite.offsetY = this._offsetY;
            sprite.relativeDepth = -0.02;
            sprite.alpha = 0;
        }
    }

    /**
     * Disposes of this addition and releases references.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::dispose()
    dispose(): void 
    {
        this._visualization = null!;
        this._assetName = null;
    }

    /**
     * Builds the asset name for the given animation frame.
     *
     * @param frame - The frame number (1 or 2)
     * @returns The asset name string
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/FloatingIdleZ.as::getAssetNameForFrame()
    protected getAssetNameForFrame(frame: number): string 
    {
        let direction = 'left';

        if(this._visualization.angle === 135 || this._visualization.angle === 180 ||
            this._visualization.angle === 225 || this._visualization.angle === 270) 
        {
            direction = 'right';
        }

        return `user_idle_${direction}_${frame}${(this._scale < 48) ? '_small' : ''}_png`;
    }
}
