/**
 * FurnitureWallData
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.class_1710
 *
 * Data class for wall furniture items.
 */
export class FurnitureWallData
{
    private _readOnly: boolean = false;

    constructor(id: number, type: number, isOldFormat: boolean)
    {
        this._id = id;
        this._type = type;
        this._isOldFormat = isOldFormat;
    }

    private _id: number;

    get id(): number
    {
        return this._id;
    }

    private _type: number;

    get type(): number
    {
        return this._type;
    }

    set type(value: number)
    {
        if(!this._readOnly)
        {
            this._type = value;
        }
    }

    private _isOldFormat: boolean;

    get isOldFormat(): boolean
    {
        return this._isOldFormat;
    }

    private _wallX: number = 0;

    get wallX(): number
    {
        return this._wallX;
    }

    set wallX(value: number)
    {
        if(!this._readOnly)
        {
            this._wallX = value;
        }
    }

    private _wallY: number = 0;

    get wallY(): number
    {
        return this._wallY;
    }

    set wallY(value: number)
    {
        if(!this._readOnly)
        {
            this._wallY = value;
        }
    }

    private _localX: number = 0;

    get localX(): number
    {
        return this._localX;
    }

    set localX(value: number)
    {
        if(!this._readOnly)
        {
            this._localX = value;
        }
    }

    private _localY: number = 0;

    get localY(): number
    {
        return this._localY;
    }

    set localY(value: number)
    {
        if(!this._readOnly)
        {
            this._localY = value;
        }
    }

    private _y: number = 0;

    get y(): number
    {
        return this._y;
    }

    set y(value: number)
    {
        if(!this._readOnly)
        {
            this._y = value;
        }
    }

    private _z: number = 0;

    get z(): number
    {
        return this._z;
    }

    set z(value: number)
    {
        if(!this._readOnly)
        {
            this._z = value;
        }
    }

    private _dir: string = '';

    get dir(): string
    {
        return this._dir;
    }

    set dir(value: string)
    {
        if(!this._readOnly)
        {
            this._dir = value;
        }
    }

    private _state: number = 0;

    get state(): number
    {
        return this._state;
    }

    set state(value: number)
    {
        if(!this._readOnly)
        {
            this._state = value;
        }
    }

    private _data: string = '';

    get data(): string
    {
        return this._data;
    }

    set data(value: string)
    {
        if(!this._readOnly)
        {
            this._data = value;
        }
    }

    private _usagePolicy: number = 0;

    get usagePolicy(): number
    {
        return this._usagePolicy;
    }

    set usagePolicy(value: number)
    {
        if(!this._readOnly)
        {
            this._usagePolicy = value;
        }
    }

    private _ownerId: number = 0;

    get ownerId(): number
    {
        return this._ownerId;
    }

    set ownerId(value: number)
    {
        if(!this._readOnly)
        {
            this._ownerId = value;
        }
    }

    private _ownerName: string = '';

    get ownerName(): string
    {
        return this._ownerName;
    }

    set ownerName(value: string)
    {
        if(!this._readOnly)
        {
            this._ownerName = value;
        }
    }

    private _secondsToExpiration: number = 0;

    get secondsToExpiration(): number
    {
        return this._secondsToExpiration;
    }

    set secondsToExpiration(value: number)
    {
        if(!this._readOnly)
        {
            this._secondsToExpiration = value;
        }
    }

    setReadOnly(): void
    {
        this._readOnly = true;
    }
}
