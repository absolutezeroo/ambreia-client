/**
 * GuideStatusBubble
 *
 * Avatar addition that shows a guide or requester status bubble
 * above the avatar, indicating participation in the guide system.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as
 */
import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import type {IAvatarAddition} from './IAvatarAddition';
import type {AvatarVisualization} from '../AvatarVisualization';
import {AvatarGuideStatus} from '@ambreia/avatar/enum/AvatarGuideStatus';

export class GuideStatusBubble implements IAvatarAddition 
{
    private _assetName: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::_avatar
    private _avatar: AvatarVisualization;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::_status
    private _status: number;

    constructor(id: number, avatar: AvatarVisualization, status: number) 
    {
        this._id = id;
        this._avatar = avatar;
        this._status = status;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::_id
    private _id: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::get id()
    get id(): number 
    {
        return this._id;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::_relativeDepth
    private _relativeDepth: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::set relativeDepth()
    set relativeDepth(value: number) 
    {
        this._relativeDepth = value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::get disposed()
    get disposed(): boolean 
    {
        return this._avatar == null;
    }

    /**
     * Animates the guide status bubble (keeps asset updated).
     *
     * @param sprite - The sprite to animate
     * @returns Always false (no dynamic animation)
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean 
    {
        if(this._assetName && sprite) 
        {
            sprite.assetName = this._assetName;
        }

        return false;
    }

    /**
     * Updates the guide status bubble position and asset based on scale, posture, and guide status.
     *
     * @param sprite - The sprite to update
     * @param scale - The current visualization scale
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::update()
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
        const assetBase = (this._status === AvatarGuideStatus.GUIDE)
            ? 'user_guide_bubble_png'
            : 'user_guide_requester_bubble_png';

        if(scale < 48) 
        {
            this._assetName = assetBase;
            offsetX = -19;
            offsetY = -80;
            fullSize = 32;
        }
        else 
        {
            this._assetName = assetBase;
            offsetX = -19;
            offsetY = -120;
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
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/additions/GuideStatusBubble.as::dispose()
    dispose(): void 
    {
        this._avatar = null!;
        this._assetName = null;
    }
}
