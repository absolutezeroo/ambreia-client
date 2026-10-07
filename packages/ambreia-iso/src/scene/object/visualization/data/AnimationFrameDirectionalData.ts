/**
 * AnimationFrameDirectionalData
 *
 * @see com.sulake.habbo.room.object.visualization.data.AnimationFrameDirectionalData
 *
 * Extends AnimationFrameData with per-direction offset overrides.
 */
import {AnimationFrameData} from './AnimationFrameData';
import type {DirectionalOffsetData} from './DirectionalOffsetData';

export class AnimationFrameDirectionalData extends AnimationFrameData
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrameDirectionalData.as::_directionalOffsets
    private _directionalOffsets: DirectionalOffsetData;

    constructor(
        id: number,
        x: number,
        y: number,
        randomX: number,
        randomY: number,
        directionalOffsets: DirectionalOffsetData,
        repeats: number
    )
    {
        super(id, x, y, randomX, randomY, repeats);

        this._directionalOffsets = directionalOffsets;
    }

    override hasDirectionalOffsets(): boolean
    {
        return this._directionalOffsets !== null;
    }

    override getX(direction: number): number
    {
        if(this._directionalOffsets !== null)
        {
            return this._directionalOffsets.getOffsetX(direction, super.getX(direction));
        }

        return super.getX(direction);
    }

    override getY(direction: number): number
    {
        if(this._directionalOffsets !== null)
        {
            return this._directionalOffsets.getOffsetY(direction, super.getY(direction));
        }

        return super.getY(direction);
    }
}
