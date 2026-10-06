import type {IUserData} from './IUserData';
import type {BotSkillData} from '@habbo/communication/messages/parser/room/bot/BotSkillData';

/**
 * User data type constants
 */
export const UserDataType = {
    USER: 1,
    PET: 2,
    BOT: 3,
    RENTABLE_BOT: 4
} as const;

/**
 * Room user data
 * Based on AS3 com.sulake.habbo.session.UserData
 *
 * The RPG fork removed pet breeding and monsterplants: AS3's rarityLevel, canBreed, canHarvest,
 * canRevive and hasBreedingPermission are not ported.
 */
export class UserData implements IUserData
{
    private readonly _roomObjectId: number;

    constructor(roomObjectId: number)
    {
        this._roomObjectId = roomObjectId;
    }

    private _type: number = 0;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get type()
    get type(): number
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set type()
    set type(value: number)
    {
        this._type = value;
    }

    private _webID: number = 0;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get webID()
    get webID(): number
    {
        return this._webID;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set webID()
    set webID(value: number)
    {
        this._webID = value;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::_name
    private _name: string = '';

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get name()
    get name(): string
    {
        if(this._isBlocked) return '';

        return this._name;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set name()
    set name(value: string)
    {
        this._name = value;
    }

    private _figure: string = '';

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get figure()
    get figure(): string
    {
        if(this._isBlocked) return '';

        return this._figure;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set figure()
    set figure(value: string)
    {
        this._figure = value;
    }

    private _sex: string = '';

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get sex()
    get sex(): string
    {
        if(this._isBlocked) return 'M';

        return this._sex;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set sex()
    set sex(value: string)
    {
        this._sex = value;
    }

    private _custom: string = '';

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get custom()
    get custom(): string
    {
        if(this._isBlocked) return '';

        return this._custom;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set custom()
    set custom(value: string)
    {
        this._custom = value;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::_achievementScore
    private _achievementScore: number = 0;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get achievementScore()
    get achievementScore(): number
    {
        if(this._isBlocked) return 0;

        return this._achievementScore;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set achievementScore()
    set achievementScore(value: number)
    {
        this._achievementScore = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/UserData.as::badgesRank
    private _badgesRank: number = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/UserData.as::get badgesRank()
    get badgesRank(): number
    {
        if(this._isBlocked) return -1;

        return this._badgesRank;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/UserData.as::set badgesRank()
    set badgesRank(value: number)
    {
        this._badgesRank = value;
    }

    private _groupID: string = '';

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get groupID()
    get groupID(): string
    {
        if(this._isBlocked) return '';

        return this._groupID;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set groupID()
    set groupID(value: string)
    {
        this._groupID = value;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::_groupName
    private _groupName: string = '';

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get groupName()
    get groupName(): string
    {
        if(this._isBlocked) return '';

        return this._groupName;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set groupName()
    set groupName(value: string)
    {
        this._groupName = value;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::_groupStatus
    private _groupStatus: number = 0;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get groupStatus()
    get groupStatus(): number
    {
        if(this._isBlocked) return 0;

        return this._groupStatus;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set groupStatus()
    set groupStatus(value: number)
    {
        this._groupStatus = value;
    }

    private _ownerId: number = 0;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get ownerId()
    get ownerId(): number
    {
        return this._ownerId;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set ownerId()
    set ownerId(value: number)
    {
        this._ownerId = value;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::_ownerName
    private _ownerName: string = '';

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get ownerName()
    get ownerName(): string
    {
        return this._ownerName;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set ownerName()
    set ownerName(value: string)
    {
        this._ownerName = value;
    }

    private _petLevel: number = 0;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get petLevel()
    get petLevel(): number
    {
        return this._petLevel;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set petLevel()
    set petLevel(value: number)
    {
        this._petLevel = value;
    }

    private _hasSaddle: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get hasSaddle()
    get hasSaddle(): boolean
    {
        return this._hasSaddle;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set hasSaddle()
    set hasSaddle(value: boolean)
    {
        this._hasSaddle = value;
    }

    private _isRiding: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get isRiding()
    get isRiding(): boolean
    {
        return this._isRiding;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set isRiding()
    set isRiding(value: boolean)
    {
        this._isRiding = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/UserData.as::_botSkills
    private _botSkills: number[] = [];

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get botSkills()
    get botSkills(): number[]
    {
        return this._botSkills;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set botSkills()
    set botSkills(value: number[])
    {
        this._botSkills = value;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::_botSkillData
    private _botSkillData: BotSkillData[] = [];

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get botSkillData()
    get botSkillData(): BotSkillData[]
    {
        return this._botSkillData;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set botSkillData()
    set botSkillData(value: BotSkillData[])
    {
        this._botSkillData = value;
    }

    private _isModerator: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get isModerator()
    get isModerator(): boolean
    {
        return this._isModerator;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set isModerator()
    set isModerator(value: boolean)
    {
        this._isModerator = value;
    }

    private _isBlocked: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get isBlocked()
    get isBlocked(): boolean
    {
        return this._isBlocked;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::set isBlocked()
    set isBlocked(value: boolean)
    {
        this._isBlocked = value;
    }

    // AS3: .../src/com/sulake/habbo/session/UserData.as::get roomObjectId()
    get roomObjectId(): number
    {
        return this._roomObjectId;
    }
}
