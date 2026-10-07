/**
 * SlideObjectData
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.class_1693
 *
 * Data class for sliding object (roller) movement.
 */
import type {IVector3d} from '@ambreia/iso/utils/IVector3d';

export class SlideObjectData
{
    public static readonly MOVE_TYPE_MOVE = 'mv';
    public static readonly MOVE_TYPE_SLIDE = 'sld';
    private _readOnly: boolean = false;

    constructor(id: number, loc: IVector3d, target: IVector3d, moveType: string | null = null)
    {
        this._id = id;
        this._loc = loc;
        this._target = target;
        this._moveType = moveType;
    }

    private _id: number;

    get id(): number
    {
        return this._id;
    }

    private _loc: IVector3d;

    get loc(): IVector3d
    {
        return this._loc;
    }

    set loc(value: IVector3d)
    {
        if(!this._readOnly)
        {
            this._loc = value;
        }
    }

    private _target: IVector3d;

    get target(): IVector3d
    {
        return this._target;
    }

    set target(value: IVector3d)
    {
        if(!this._readOnly)
        {
            this._target = value;
        }
    }

    private _moveType: string | null;

    get moveType(): string | null
    {
        return this._moveType;
    }

    set moveType(value: string | null)
    {
        if(!this._readOnly)
        {
            this._moveType = value;
        }
    }

    setReadOnly(): void
    {
        this._readOnly = true;
    }
}
