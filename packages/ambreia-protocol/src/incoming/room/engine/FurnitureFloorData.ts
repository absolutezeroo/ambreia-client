/**
 * FurnitureFloorData
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.class_1765
 *
 * Data structure for floor furniture objects.
 */
import type {IStuffData} from '@ambreia/iso/scene/object/data/IStuffData';
import {LegacyStuffData} from '@ambreia/iso/scene/object/data/LegacyStuffData';

export class FurnitureFloorData
{
    private _readOnly: boolean = false;

    constructor(id: number)
    {
        this._id = id;
        this._data = new LegacyStuffData();
    }

    private _id: number;

    get id(): number
    {
        return this._id;
    }

    private _x: number = 0;

    get x(): number
    {
        return this._x;
    }

    set x(value: number)
    {
        if(!this._readOnly) this._x = value;
    }

    private _y: number = 0;

    get y(): number
    {
        return this._y;
    }

    set y(value: number)
    {
        if(!this._readOnly) this._y = value;
    }

    private _z: number = 0;

    get z(): number
    {
        return this._z;
    }

    set z(value: number)
    {
        if(!this._readOnly) this._z = value;
    }

    private _dir: number = 0;

    get dir(): number
    {
        return this._dir;
    }

    set dir(value: number)
    {
        if(!this._readOnly) this._dir = value;
    }

    private _sizeX: number = 0;

    get sizeX(): number
    {
        return this._sizeX;
    }

    set sizeX(value: number)
    {
        if(!this._readOnly) this._sizeX = value;
    }

    private _sizeY: number = 0;

    get sizeY(): number
    {
        return this._sizeY;
    }

    set sizeY(value: number)
    {
        if(!this._readOnly) this._sizeY = value;
    }

    private _sizeZ: number = 0;

    get sizeZ(): number
    {
        return this._sizeZ;
    }

    set sizeZ(value: number)
    {
        if(!this._readOnly) this._sizeZ = value;
    }

    private _type: number = 0;

    get type(): number
    {
        return this._type;
    }

    set type(value: number)
    {
        if(!this._readOnly) this._type = value;
    }

    private _state: number = 0;

    get state(): number
    {
        return this._state;
    }

    set state(value: number)
    {
        if(!this._readOnly) this._state = value;
    }

    private _data: IStuffData;

    get data(): IStuffData
    {
        return this._data;
    }

    set data(value: IStuffData)
    {
        if(!this._readOnly) this._data = value;
    }

    private _extra: number = -1;

    get extra(): number
    {
        return this._extra;
    }

    set extra(value: number)
    {
        if(!this._readOnly) this._extra = value;
    }

    private _usagePolicy: number = 0;

    get usagePolicy(): number
    {
        return this._usagePolicy;
    }

    set usagePolicy(value: number)
    {
        this._usagePolicy = value;
    }

    private _ownerId: number = 0;

    get ownerId(): number
    {
        return this._ownerId;
    }

    set ownerId(value: number)
    {
        this._ownerId = value;
    }

    private _ownerName: string = '';

    get ownerName(): string
    {
        return this._ownerName;
    }

    set ownerName(value: string)
    {
        this._ownerName = value;
    }

    private _expiryTime: number = 0;

    get expiryTime(): number
    {
        return this._expiryTime;
    }

    set expiryTime(value: number)
    {
        if(!this._readOnly) this._expiryTime = value;
    }

    private _staticClass: string | null = null;

    get staticClass(): string | null
    {
        return this._staticClass;
    }

    set staticClass(value: string | null)
    {
        if(!this._readOnly) this._staticClass = value;
    }

    private _trustedSender: boolean = false;

    get trustedSender(): boolean
    {
        return this._trustedSender;
    }

    set trustedSender(value: boolean)
    {
        this._trustedSender = value;
    }

    setReadOnly(): void
    {
        this._readOnly = true;
    }
}
