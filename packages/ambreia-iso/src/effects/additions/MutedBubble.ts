/**
 * MutedBubble
 *
 * Avatar addition that shows a muted icon above the avatar when the
 * user has been muted by a moderator.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as
 */
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {IAvatarAddition} from '../../avatar/visualization/additions/IAvatarAddition';
import type {AvatarVisualization} from '../../avatar/visualization/AvatarVisualization';

export class MutedBubble implements IAvatarAddition 
{
    private _assetName: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::_avatar
    private _avatar: AvatarVisualization;

    constructor(id: number, avatar: AvatarVisualization) 
    {
        this._id = id;
        this._avatar = avatar;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::_id
    private _id: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::get id()
    get id(): number 
    {
        return this._id;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::_relativeDepth
    private _relativeDepth: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::set relativeDepth()
    set relativeDepth(value: number) 
    {
        this._relativeDepth = value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::get disposed()
    get disposed(): boolean 
    {
        return this._avatar == null;
    }

    /**
     * Animates the muted bubble (keeps asset updated).
     *
     * @param sprite - The sprite to animate
     * @returns Always false (no dynamic animation)
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean 
    {
        if(this._assetName && sprite) 
        {
            sprite.assetName = this._assetName;
        }

        return false;
    }

    /**
     * Updates the muted bubble position and asset based on scale and posture.
     *
     * @param sprite - The sprite to update
     * @param scale - The current visualization scale
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::update()
    update(sprite: IRoomObjectSprite | null, scale: number): void 
    {
        if(!sprite) 
        {
            return;
        }

        let offsetX: number;
        let offsetY: number;

        sprite.visible = true;
        sprite.relativeDepth = this._relativeDepth;
        sprite.alpha = 255;

        let fullSize = 64;

        if(scale < 48) 
        {
            this._assetName = 'user_muted_small_png';
            offsetX = -12;
            offsetY = -66;
            fullSize = 32;
        }
        else 
        {
            this._assetName = 'user_muted_png';
            offsetX = -15;
            offsetY = -110;
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
            sprite.assetName = this._assetName;
            sprite.offsetX = offsetX;
            sprite.offsetY = offsetY;
            sprite.relativeDepth = -0.02;
        }
    }

    /**
     * Disposes of this addition and releases references.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/MutedBubble.as::dispose()
    dispose(): void 
    {
        this._avatar = null!;
        this._assetName = null;
    }
}
