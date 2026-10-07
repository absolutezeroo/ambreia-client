/**
 * AnimationFrame
 *
 * @see com.sulake.habbo.room.object.visualization.data.AnimationFrame
 *
 * Runtime animation frame with object pooling. Tracks id, position, repeats, and sequence state.
 */
export class AnimationFrame
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::FRAME_REPEAT_FOREVER
    public static readonly FRAME_REPEAT_FOREVER: number = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::SEQUENCE_NOT_DEFINED
    public static readonly SEQUENCE_NOT_DEFINED: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::POOL_SIZE_LIMIT
    private static readonly POOL_SIZE_LIMIT: number = 3000;
    private static _pool: AnimationFrame[] = [];
    private _recycled: boolean = false;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::_id
    private _id: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get id()
    get id(): number
    {
        if(this._id >= 0)
        {
            return this._id;
        }

        return Math.floor(-this._id * Math.random());
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::_x
    private _x: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get x()
    get x(): number
    {
        return this._x;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::_y
    private _y: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get y()
    get y(): number
    {
        return this._y;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::_repeats
    private _repeats: number = 1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get repeats()
    get repeats(): number
    {
        return this._repeats;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::_frameRepeats
    private _frameRepeats: number = 1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get frameRepeats()
    get frameRepeats(): number
    {
        return this._frameRepeats;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::_remainingFrameRepeats
    private _remainingFrameRepeats: number = 1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get remainingFrameRepeats()
    get remainingFrameRepeats(): number
    {
        if(this._frameRepeats < 0)
        {
            return -1;
        }

        return this._remainingFrameRepeats;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::set remainingFrameRepeats()
    set remainingFrameRepeats(value: number)
    {
        if(value < 0) value = 0;

        if(this._frameRepeats > 0 && value > this._frameRepeats)
        {
            value = this._frameRepeats;
        }

        this._remainingFrameRepeats = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::_activeSequence
    private _activeSequence: number = -1;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get activeSequence()
    get activeSequence(): number
    {
        return this._activeSequence;
    }

    // AS3: sources/win63_version/habbo/room/object/visualization/data/AnimationFrame.as::_activeSequenceOffset
    private _activeSequenceOffset: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get activeSequenceOffset()
    get activeSequenceOffset(): number
    {
        return this._activeSequenceOffset;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::_isLastFrame
    private _isLastFrame: boolean = false;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::get isLastFrame()
    get isLastFrame(): boolean
    {
        return this._isLastFrame;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::allocate()
    static allocate(
        id: number,
        x: number,
        y: number,
        repeats: number,
        frameRepeats: number,
        isLastFrame: boolean,
        activeSequence: number = -1,
        activeSequenceOffset: number = 0
    ): AnimationFrame
    {
        const frame = AnimationFrame._pool.length > 0
            ? AnimationFrame._pool.pop()!
            : new AnimationFrame();

        frame._recycled = false;
        frame._id = id;
        frame._x = x;
        frame._y = y;
        frame._isLastFrame = isLastFrame;

        if(repeats < 1) repeats = 1;
        frame._repeats = repeats;

        if(frameRepeats < 0) frameRepeats = -1;
        frame._frameRepeats = frameRepeats;
        frame._remainingFrameRepeats = frameRepeats;

        if(activeSequence >= 0)
        {
            frame._activeSequence = activeSequence;
            frame._activeSequenceOffset = activeSequenceOffset;
        }

        return frame;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/data/AnimationFrame.as::recycle()
    recycle(): void
    {
        if(!this._recycled)
        {
            this._recycled = true;

            if(AnimationFrame._pool.length < AnimationFrame.POOL_SIZE_LIMIT)
            {
                AnimationFrame._pool.push(this);
            }
        }
    }
}
