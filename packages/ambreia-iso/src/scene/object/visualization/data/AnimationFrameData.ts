/**
 * AnimationFrameData
 *
 * @see com.sulake.habbo.room.object.visualization.data.AnimationFrameData
 *
 * Static frame data definition: id, x, y, randomX, randomY, repeats.
 */
export class AnimationFrameData
{
    constructor(id: number, x: number, y: number, randomX: number, randomY: number, repeats: number)
    {
        this._id = id;
        this._x = x;
        this._y = y;
        this._randomX = randomX;
        this._randomY = randomY;
        this._repeats = repeats;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::_id
    private _id: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::_x
    private _x: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::get x()
    get x(): number
    {
        return this._x;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::_y
    private _y: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::get y()
    get y(): number
    {
        return this._y;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::_randomX
    private _randomX: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::get randomX()
    get randomX(): number
    {
        return this._randomX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::_randomY
    private _randomY: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::get randomY()
    get randomY(): number
    {
        return this._randomY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::_repeats
    private _repeats: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::get repeats()
    get repeats(): number
    {
        return this._repeats;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::hasDirectionalOffsets()
    hasDirectionalOffsets(): boolean
    {
        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::getX()
    getX(_direction: number): number
    {
        return this._x;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrameData.as::getY()
    getY(_direction: number): number
    {
        return this._y;
    }
}
