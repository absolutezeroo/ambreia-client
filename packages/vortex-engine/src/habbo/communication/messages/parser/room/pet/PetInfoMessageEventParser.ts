import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Full information about one pet (header 3192), sent in response to GetPetInfo and used to populate
 * the pet infostand.
 *
 * The field names below are the AS3 getters' own - the backing fields are obfuscated in every tree,
 * but the public accessors are not, so these are recovered names rather than invented ones. Read
 * order was cross-checked against the emulator's PetInfoMessageComposerSerializer, which matches
 * the AS3 field-for-field.
 *
 * The secondary tree's parse() carries the same `while(0 < count)` decompiler corruption seen in
 * HabboClubOffersMessageEventParser and SellablePetPalettesMessageEventParser - an index declared
 * and incremented but never compared, i.e. an infinite loop the real client plainly does not have.
 * The correct loop is ported here.
 *
 * AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetInfoMessageEventParser.as
 */
export class PetInfoMessageEventParser implements IMessageParser
{
    private _petId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetInfoMessageEventParser.as::_name
    private _name: string = '';

    private _level: number = 0;

    private _maxLevel: number = 0;

    private _experience: number = 0;

    private _experienceRequiredToLevel: number = 0;

    private _energy: number = 0;

    private _maxEnergy: number = 0;

    private _nutrition: number = 0;

    private _maxNutrition: number = 0;

    private _respect: number = 0;

    private _ownerId: number = 0;

    private _age: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetInfoMessageEventParser.as::_ownerName
    private _ownerName: string = '';

    private _breedId: number = 0;

    private _hasFreeSaddle: boolean = false;

    private _isRiding: boolean = false;

    private _skillTresholds: number[] = [];

    private _accessRights: number = 0;

    private _canBreed: boolean = false;

    private _canHarvest: boolean = false;

    private _canRevive: boolean = false;

    private _rarityLevel: number = 0;

    private _maxWellBeingSeconds: number = 0;

    private _remainingWellBeingSeconds: number = 0;

    private _remainingGrowingSeconds: number = 0;

    private _hasBreedingPermission: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetInfoMessageEventParser.as::flush()
    flush(): boolean
    {
        this._petId = 0;
        this._name = '';
        this._level = 0;
        this._maxLevel = 0;
        this._experience = 0;
        this._experienceRequiredToLevel = 0;
        this._energy = 0;
        this._maxEnergy = 0;
        this._nutrition = 0;
        this._maxNutrition = 0;
        this._respect = 0;
        this._ownerId = 0;
        this._age = 0;
        this._ownerName = '';
        this._breedId = 0;
        this._hasFreeSaddle = false;
        this._isRiding = false;
        this._skillTresholds = [];
        this._accessRights = 0;
        this._canBreed = false;
        this._canHarvest = false;
        this._canRevive = false;
        this._rarityLevel = 0;
        this._maxWellBeingSeconds = 0;
        this._remainingWellBeingSeconds = 0;
        this._remainingGrowingSeconds = 0;
        this._hasBreedingPermission = false;

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetInfoMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._petId = wrapper.readInt();
        this._name = wrapper.readString();
        this._level = wrapper.readInt();
        this._maxLevel = wrapper.readInt();
        this._experience = wrapper.readInt();
        this._experienceRequiredToLevel = wrapper.readInt();
        this._energy = wrapper.readInt();
        this._maxEnergy = wrapper.readInt();
        this._nutrition = wrapper.readInt();
        this._maxNutrition = wrapper.readInt();
        this._respect = wrapper.readInt();
        this._ownerId = wrapper.readInt();
        this._age = wrapper.readInt();
        this._ownerName = wrapper.readString();
        this._breedId = wrapper.readInt();
        this._hasFreeSaddle = wrapper.readBoolean();
        this._isRiding = wrapper.readBoolean();

        const skillCount = wrapper.readInt();

        for(let i = 0; i < skillCount; i++)
        {
            this._skillTresholds.push(wrapper.readInt());
        }

        // AS3 sorts with Array.NUMERIC (16); the TS equivalent needs an explicit comparator, as the
        // default sort is lexicographic.
        this._skillTresholds.sort((a, b) => a - b);

        this._accessRights = wrapper.readInt();
        this._canBreed = wrapper.readBoolean();
        this._canHarvest = wrapper.readBoolean();
        this._canRevive = wrapper.readBoolean();
        this._rarityLevel = wrapper.readInt();
        this._maxWellBeingSeconds = wrapper.readInt();
        this._remainingWellBeingSeconds = wrapper.readInt();
        this._remainingGrowingSeconds = wrapper.readInt();
        this._hasBreedingPermission = wrapper.readBoolean();

        return true;
    }

    // AS3: .../PetInfoMessageEventParser.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: .../PetInfoMessageEventParser.as::get name()
    get name(): string
    {
        return this._name;
    }

    // AS3: .../PetInfoMessageEventParser.as::get level()
    get level(): number
    {
        return this._level;
    }

    // AS3: .../PetInfoMessageEventParser.as::get maxLevel()
    get maxLevel(): number
    {
        return this._maxLevel;
    }

    // AS3: .../PetInfoMessageEventParser.as::get experience()
    get experience(): number
    {
        return this._experience;
    }

    // AS3: .../PetInfoMessageEventParser.as::get experienceRequiredToLevel()
    get experienceRequiredToLevel(): number
    {
        return this._experienceRequiredToLevel;
    }

    // AS3: .../PetInfoMessageEventParser.as::get energy()
    get energy(): number
    {
        return this._energy;
    }

    // AS3: .../PetInfoMessageEventParser.as::get maxEnergy()
    get maxEnergy(): number
    {
        return this._maxEnergy;
    }

    // AS3: .../PetInfoMessageEventParser.as::get nutrition()
    get nutrition(): number
    {
        return this._nutrition;
    }

    // AS3: .../PetInfoMessageEventParser.as::get maxNutrition()
    get maxNutrition(): number
    {
        return this._maxNutrition;
    }

    // AS3: .../PetInfoMessageEventParser.as::get respect()
    get respect(): number
    {
        return this._respect;
    }

    // AS3: .../PetInfoMessageEventParser.as::get ownerId()
    get ownerId(): number
    {
        return this._ownerId;
    }

    // AS3: .../PetInfoMessageEventParser.as::get age()
    get age(): number
    {
        return this._age;
    }

    // AS3: .../PetInfoMessageEventParser.as::get ownerName()
    get ownerName(): string
    {
        return this._ownerName;
    }

    // AS3: .../PetInfoMessageEventParser.as::get breedId()
    get breedId(): number
    {
        return this._breedId;
    }

    // AS3: .../PetInfoMessageEventParser.as::get hasFreeSaddle()
    get hasFreeSaddle(): boolean
    {
        return this._hasFreeSaddle;
    }

    // AS3: .../PetInfoMessageEventParser.as::get isRiding()
    get isRiding(): boolean
    {
        return this._isRiding;
    }

    // AS3: .../PetInfoMessageEventParser.as::get skillTresholds()
    // Spelling is AS3's own ("Tresholds"), kept so the member matches the source.
    get skillTresholds(): number[]
    {
        return this._skillTresholds;
    }

    // AS3: .../PetInfoMessageEventParser.as::get accessRights()
    get accessRights(): number
    {
        return this._accessRights;
    }

    // AS3: .../PetInfoMessageEventParser.as::get canBreed()
    get canBreed(): boolean
    {
        return this._canBreed;
    }

    // AS3: .../PetInfoMessageEventParser.as::get canHarvest()
    get canHarvest(): boolean
    {
        return this._canHarvest;
    }

    // AS3: .../PetInfoMessageEventParser.as::get canRevive()
    get canRevive(): boolean
    {
        return this._canRevive;
    }

    // AS3: .../PetInfoMessageEventParser.as::get rarityLevel()
    get rarityLevel(): number
    {
        return this._rarityLevel;
    }

    // AS3: .../PetInfoMessageEventParser.as::get maxWellBeingSeconds()
    get maxWellBeingSeconds(): number
    {
        return this._maxWellBeingSeconds;
    }

    // AS3: .../PetInfoMessageEventParser.as::get remainingWellBeingSeconds()
    get remainingWellBeingSeconds(): number
    {
        return this._remainingWellBeingSeconds;
    }

    // AS3: .../PetInfoMessageEventParser.as::get remainingGrowingSeconds()
    get remainingGrowingSeconds(): number
    {
        return this._remainingGrowingSeconds;
    }

    // AS3: .../PetInfoMessageEventParser.as::get hasBreedingPermission()
    get hasBreedingPermission(): boolean
    {
        return this._hasBreedingPermission;
    }
}
