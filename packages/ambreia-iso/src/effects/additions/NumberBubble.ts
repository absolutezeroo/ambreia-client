/**
 * NumberBubble
 *
 * Avatar addition that shows a number above the avatar, used for
 * game queue positions and similar numbered indicators.
 * Supports fade-in and fade-out animations with vertical movement.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as
 */
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {IAvatarAddition} from '../../avatar/visualization/additions/IAvatarAddition';
import type {AvatarVisualization} from '../../avatar/visualization/AvatarVisualization';

export class NumberBubble implements IAvatarAddition 
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::_avatar
    private _avatar: AvatarVisualization;
    private _assetName: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::_scale
    private _scale: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::_number
    private _number: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::_numberValueFadeDirection
    private _numberValueFadeDirection: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::_numberValueMoving
    private _numberValueMoving: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::_numberValueMoveCounter
    private _numberValueMoveCounter: number = 0;

    constructor(id: number, value: number, avatar: AvatarVisualization) 
    {
        this._id = id;
        this._number = value;
        this._avatar = avatar;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::_id
    private _id: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::get id()
    get id(): number 
    {
        return this._id;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::get disposed()
    get disposed(): boolean 
    {
        return this._avatar == null;
    }

    /**
     * Updates the number bubble position and asset based on scale, posture, and number value.
     *
     * @param sprite - The sprite to update
     * @param scale - The current visualization scale
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::update()
    update(sprite: IRoomObjectSprite | null, scale: number): void 
    {
        if(!sprite) 
        {
            return;
        }

        let offsetX: number;
        let offsetY: number;

        this._scale = scale;

        if(this._number > 0) 
        {
            let fullSize = 64;

            if(scale < 48) 
            {
                this._assetName = `number_${this._number}_small_png`;
                offsetX = -6;
                offsetY = -52;
                fullSize = 32;
            }
            else 
            {
                this._assetName = `number_${this._number}_png`;
                offsetX = -8;
                offsetY = -105;
            }

            if(this._avatar.posture === 'sit') 
            {
                offsetY = offsetY + (fullSize / 2);
            }
            else if(this._avatar.posture === 'lay') 
            {
                offsetY = offsetY + fullSize;
            }

            if(this._assetName != null) 
            {
                sprite.visible = true;
                sprite.assetName = this._assetName;
                sprite.offsetX = offsetX;
                sprite.offsetY = offsetY;
                sprite.relativeDepth = -0.01;
                this._numberValueFadeDirection = 1;
                this._numberValueMoving = true;
                this._numberValueMoveCounter = 0;
                sprite.alpha = 0;
            }
            else 
            {
                sprite.visible = false;
            }
        }
        else 
        {
            if(sprite.visible) 
            {
                this._numberValueFadeDirection = -1;
            }
        }
    }

    /**
     * Animates the number bubble fade and vertical movement.
     *
     * @param sprite - The sprite to animate
     * @returns True if the animation caused a visual change
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean 
    {
        if(!sprite) 
        {
            return false;
        }

        if(this._assetName) 
        {
            sprite.assetName = this._assetName;
        }

        let alpha = sprite.alpha;
        let changed = false;

        if(this._numberValueMoving) 
        {
            this._numberValueMoveCounter++;

            if(this._numberValueMoveCounter < 10) 
            {
                return false;
            }

            if(this._numberValueFadeDirection < 0) 
            {
                if(this._scale < 48) 
                {
                    sprite.offsetY = sprite.offsetY - 2;
                }
                else 
                {
                    sprite.offsetY = sprite.offsetY - 4;
                }
            }
            else 
            {
                let interval = 4;

                if(this._scale < 48) 
                {
                    interval = 8;
                }

                if((this._numberValueMoveCounter % interval) === 0) 
                {
                    sprite.offsetY = sprite.offsetY - 1;
                    changed = true;
                }
            }
        }

        if(this._numberValueFadeDirection > 0) 
        {
            if(alpha < 255) 
            {
                alpha = alpha + 32;
            }

            if(alpha >= 255) 
            {
                alpha = 255;
                this._numberValueFadeDirection = 0;
            }

            sprite.alpha = alpha;

            return true;
        }

        if(this._numberValueFadeDirection < 0) 
        {
            if(alpha >= 0) 
            {
                alpha = alpha - 32;
            }

            if(alpha <= 0) 
            {
                this._numberValueFadeDirection = 0;
                this._numberValueMoving = false;
                alpha = 0;
                sprite.visible = false;
            }

            sprite.alpha = alpha;

            return true;
        }

        return changed;
    }

    /**
     * Disposes of this addition and releases references.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/NumberBubble.as::dispose()
    dispose(): void 
    {
        this._avatar = null!;
        this._assetName = null;
    }
}
