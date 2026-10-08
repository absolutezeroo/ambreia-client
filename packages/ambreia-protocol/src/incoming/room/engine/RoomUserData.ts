/**
 * RoomUserData
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.class_1668
 *
 * Data structure for room users (avatars, pets, bots).
 */
export class RoomUserData
{
    public static readonly USER_TYPE_USER = 1;
    public static readonly USER_TYPE_PET = 2;
    public static readonly USER_TYPE_OLD_BOT = 3;
    public static readonly USER_TYPE_BOT = 4;
    private _readOnly: boolean = false;

    constructor(roomIndex: number)
    {
        this._roomIndex = roomIndex;
    }

    private _roomIndex: number;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get roomIndex()
    get roomIndex(): number
    {
        return this._roomIndex;
    }

    private _x: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get x()
    get x(): number
    {
        return this._x;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set x()
    set x(value: number)
    {
        if(!this._readOnly) this._x = value;
    }

    private _y: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get y()
    get y(): number
    {
        return this._y;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set y()
    set y(value: number)
    {
        if(!this._readOnly) this._y = value;
    }

    private _z: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get z()
    get z(): number
    {
        return this._z;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set z()
    set z(value: number)
    {
        if(!this._readOnly) this._z = value;
    }

    private _dir: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get dir()
    get dir(): number
    {
        return this._dir;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set dir()
    set dir(value: number)
    {
        if(!this._readOnly) this._dir = value;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::_name
    private _name: string = '';

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get name()
    get name(): string
    {
        return this._name;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set name()
    set name(value: string)
    {
        if(!this._readOnly) this._name = value;
    }

    private _custom: string = '';

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get custom()
    get custom(): string
    {
        return this._custom;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set custom()
    set custom(value: string)
    {
        if(!this._readOnly) this._custom = value;
    }

    private _figure: string = '';

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get figure()
    get figure(): string
    {
        return this._figure;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set figure()
    set figure(value: string)
    {
        if(!this._readOnly) this._figure = value;
    }

    private _sex: string = 'M';

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get sex()
    get sex(): string
    {
        return this._sex;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set sex()
    set sex(value: string)
    {
        if(!this._readOnly) this._sex = value;
    }

    private _webID: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get webID()
    get webID(): number
    {
        return this._webID;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set webID()
    set webID(value: number)
    {
        if(!this._readOnly) this._webID = value;
    }

    private _userType: number = 1;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get userType()
    get userType(): number
    {
        return this._userType;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set userType()
    set userType(value: number)
    {
        if(!this._readOnly) this._userType = value;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::_achievementScore
    private _achievementScore: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get achievementScore()
    get achievementScore(): number
    {
        return this._achievementScore;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set achievementScore()
    set achievementScore(value: number)
    {
        if(!this._readOnly) this._achievementScore = value;
    }

    private _isModerator: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get isModerator()
    get isModerator(): boolean
    {
        return this._isModerator;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set isModerator()
    set isModerator(value: boolean)
    {
        if(!this._readOnly) this._isModerator = value;
    }

    private _subType: string = '';

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get subType()
    get subType(): string
    {
        return this._subType;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set subType()
    set subType(value: string)
    {
        if(!this._readOnly) this._subType = value;
    }

    private _ownerId: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get ownerId()
    get ownerId(): number
    {
        return this._ownerId;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set ownerId()
    set ownerId(value: number)
    {
        if(!this._readOnly) this._ownerId = value;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::_ownerName
    private _ownerName: string = '';

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get ownerName()
    get ownerName(): string
    {
        return this._ownerName;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set ownerName()
    set ownerName(value: string)
    {
        if(!this._readOnly) this._ownerName = value;
    }

    private _hasSaddle: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get hasSaddle()
    get hasSaddle(): boolean
    {
        return this._hasSaddle;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set hasSaddle()
    set hasSaddle(value: boolean)
    {
        if(!this._readOnly) this._hasSaddle = value;
    }

    private _isRiding: boolean = false;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get isRiding()
    get isRiding(): boolean
    {
        return this._isRiding;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set isRiding()
    set isRiding(value: boolean)
    {
        if(!this._readOnly) this._isRiding = value;
    }

    private _petLevel: number = 0;

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get petLevel()
    get petLevel(): number
    {
        return this._petLevel;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set petLevel()
    set petLevel(value: number)
    {
        if(!this._readOnly) this._petLevel = value;
    }

    private _petPosture: string = '';

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get petPosture()
    get petPosture(): string
    {
        return this._petPosture;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set petPosture()
    set petPosture(value: string)
    {
        if(!this._readOnly) this._petPosture = value;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::_botSkills
    private _botSkills: number[] = [];

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::get botSkills()
    get botSkills(): number[]
    {
        return this._botSkills;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::set botSkills()
    set botSkills(value: number[])
    {
        if(!this._readOnly) this._botSkills = value;
    }

    // AS3: .../src/unknowns/_SafePkg_2102/_SafeCls_2262.as::setReadOnly()
    setReadOnly(): void
    {
        this._readOnly = true;
    }
}
