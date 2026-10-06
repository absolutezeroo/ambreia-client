/**
 * RoomWidgetPetInfoUpdateEvent
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as
 *
 * AS3 splits these into constructor-assigned read-only getters and a second group
 * with getter/setter pairs that `InfoStandWidgetHandler.onPetInfo()` fills in after
 * construction; `readonly` vs mutable below preserves that split. AS3's trailing
 * `bubbles`/`cancelable` constructor params are dropped along with the rest of the
 * Flash Event base — see RoomWidgetUpdateEvent.ts.
 *
 * The RPG fork removed pet breeding and monsterplants: AS3's canBreed, canHarvest, canRevive,
 * rarityLevel, hasBreedingPermission and the three monsterplant timers are not ported.
 */
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

export class RoomWidgetPetInfoUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::PET_INFO
    public static readonly PET_INFO: string = 'RWPIUE_PET_INFO';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set canRemovePet()
    public canRemovePet: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set age()
    public age: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set hasFreeSaddle()
    public hasFreeSaddle: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set isRiding()
    public isRiding: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set skillTresholds()
    public skillTresholds: number[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set accessRights()
    public accessRights: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set level()
    public level: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set levelMax()
    public levelMax: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set experience()
    public experience: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set experienceMax()
    public experienceMax: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set energy()
    public energy: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set energyMax()
    public energyMax: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set nutrition()
    public nutrition: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set nutritionMax()
    public nutritionMax: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set petRespectLeft()
    public petRespectLeft: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::set petRespect()
    public petRespect: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::RoomWidgetPetInfoUpdateEvent()
    constructor(
        petType: number,
        petRace: number,
        name: string,
        id: number,
        image: ImageBitmap | null,
        isOwnPet: boolean,
        ownerId: number,
        ownerName: string,
        roomIndex: number,
        breedId: number
    )
    {
        super(RoomWidgetPetInfoUpdateEvent.PET_INFO);

        this._petType = petType;
        this._petRace = petRace;
        this._name = name;
        this._id = id;
        this._image = image;
        this._isOwnPet = isOwnPet;
        this._ownerId = ownerId;
        this._ownerName = ownerName;
        this._roomIndex = roomIndex;
        this._breedId = breedId;
    }

    private _petType: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get petType()
    public get petType(): number
    {
        return this._petType;
    }

    private _petRace: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get petRace()
    public get petRace(): number
    {
        return this._petRace;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::_name
    private _name: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get name()
    public get name(): string
    {
        return this._name;
    }

    private _id: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get id()
    public get id(): number
    {
        return this._id;
    }

    private _image: ImageBitmap | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get image()
    public get image(): ImageBitmap | null
    {
        return this._image;
    }

    private _isOwnPet: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get isOwnPet()
    public get isOwnPet(): boolean
    {
        return this._isOwnPet;
    }

    private _ownerId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get ownerId()
    public get ownerId(): number
    {
        return this._ownerId;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::_ownerName
    private _ownerName: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get ownerName()
    public get ownerName(): string
    {
        return this._ownerName;
    }

    private _roomIndex: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get roomIndex()
    public get roomIndex(): number
    {
        return this._roomIndex;
    }

    private _breedId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent.as::get breedId()
    public get breedId(): number
    {
        return this._breedId;
    }
}
