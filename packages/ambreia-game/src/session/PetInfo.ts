import type {IPetInfo} from './IPetInfo';

/**
 * Pet info implementation
 *
 * @see source_as_win63/habbo/session/PetInfo.as
 *
 * The RPG fork removed pet breeding and monsterplants: AS3's canBreed, canHarvest, canRevive,
 * rarityLevel, hasBreedingPermission and the three monsterplant timers (maxWellBeingSeconds,
 * remainingWellBeingSeconds, remainingGrowingSeconds) are not ported. Energy and nutrition stay.
 */
export class PetInfo implements IPetInfo
{
    private _petId: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set petId()
    set petId(value: number)
    {
        this._petId = value;
    }

    private _level: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get level()
    get level(): number
    {
        return this._level;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set level()
    set level(value: number)
    {
        this._level = value;
    }

    private _levelMax: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get levelMax()
    get levelMax(): number
    {
        return this._levelMax;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set levelMax()
    set levelMax(value: number)
    {
        this._levelMax = value;
    }

    private _experience: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get experience()
    get experience(): number
    {
        return this._experience;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set experience()
    set experience(value: number)
    {
        this._experience = value;
    }

    private _experienceMax: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get experienceMax()
    get experienceMax(): number
    {
        return this._experienceMax;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set experienceMax()
    set experienceMax(value: number)
    {
        this._experienceMax = value;
    }

    private _energy: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get energy()
    get energy(): number
    {
        return this._energy;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set energy()
    set energy(value: number)
    {
        this._energy = value;
    }

    private _energyMax: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get energyMax()
    get energyMax(): number
    {
        return this._energyMax;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set energyMax()
    set energyMax(value: number)
    {
        this._energyMax = value;
    }

    private _nutrition: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get nutrition()
    get nutrition(): number
    {
        return this._nutrition;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set nutrition()
    set nutrition(value: number)
    {
        this._nutrition = value;
    }

    private _nutritionMax: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get nutritionMax()
    get nutritionMax(): number
    {
        return this._nutritionMax;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set nutritionMax()
    set nutritionMax(value: number)
    {
        this._nutritionMax = value;
    }

    private _ownerId: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get ownerId()
    get ownerId(): number
    {
        return this._ownerId;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set ownerId()
    set ownerId(value: number)
    {
        this._ownerId = value;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::_ownerName
    private _ownerName: string = '';

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get ownerName()
    get ownerName(): string
    {
        return this._ownerName;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set ownerName()
    set ownerName(value: string)
    {
        this._ownerName = value;
    }

    private _respect: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get respect()
    get respect(): number
    {
        return this._respect;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set respect()
    set respect(value: number)
    {
        this._respect = value;
    }

    private _age: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get age()
    get age(): number
    {
        return this._age;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set age()
    set age(value: number)
    {
        this._age = value;
    }

    private _breedId: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get breedId()
    get breedId(): number
    {
        return this._breedId;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set breedId()
    set breedId(value: number)
    {
        this._breedId = value;
    }

    private _hasFreeSaddle: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get hasFreeSaddle()
    get hasFreeSaddle(): boolean
    {
        return this._hasFreeSaddle;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set hasFreeSaddle()
    set hasFreeSaddle(value: boolean)
    {
        this._hasFreeSaddle = value;
    }

    private _isRiding: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get isRiding()
    get isRiding(): boolean
    {
        return this._isRiding;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set isRiding()
    set isRiding(value: boolean)
    {
        this._isRiding = value;
    }

    private _skillTresholds: number[] = [];

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get skillTresholds()
    get skillTresholds(): number[]
    {
        return this._skillTresholds;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set skillTresholds()
    set skillTresholds(value: number[])
    {
        this._skillTresholds = value;
    }

    private _accessRights: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get accessRights()
    get accessRights(): number
    {
        return this._accessRights;
    }

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::set accessRights()
    set accessRights(value: number)
    {
        this._accessRights = value;
    }

    private _adultLevel: number = 0;

    // AS3: .../src/com/sulake/habbo/session/PetInfo.as::get adultLevel()
    get adultLevel(): number
    {
        return this._adultLevel;
    }

    set adultLevel(value: number)
    {
        this._adultLevel = value;
    }
}
