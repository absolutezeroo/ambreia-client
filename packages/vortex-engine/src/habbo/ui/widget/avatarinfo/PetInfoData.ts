/**
 * PetInfoData — the pet state AvatarInfoWidget keeps between RWPIUE_PET_INFO events.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/PetInfoData.as
 *
 * Populated from RoomWidgetPetInfoUpdateEvent and read by PetMenuView/OwnPetMenuView to
 * decide which buttons the bubble offers. The sibling of AvatarInfoData for pets.
 *
 * The RPG fork removed pet breeding and monsterplants: AS3's canBreed, canHarvest, canRevive,
 * hasBreedingPermission and the three monsterplant timers are not ported.
 */
import type {RoomWidgetPetInfoUpdateEvent} from '../events/RoomWidgetPetInfoUpdateEvent';

export class PetInfoData
{
    // AS3: PetInfoData.as::age
    public age: number = 0;

    // AS3: PetInfoData.as::breedId
    public breedId: number = 0;

    // AS3: PetInfoData.as::canRemovePet
    public canRemovePet: boolean = false;

    // AS3: PetInfoData.as::energy
    public energy: number = 0;

    // AS3: PetInfoData.as::energyMax
    public energyMax: number = 0;

    // AS3: PetInfoData.as::experience
    public experience: number = 0;

    // AS3: PetInfoData.as::experienceMax
    public experienceMax: number = 0;

    // AS3: PetInfoData.as::id
    public id: number = 0;

    // AS3: PetInfoData.as::isOwnPet
    public isOwnPet: boolean = false;

    // AS3: PetInfoData.as::level
    public level: number = 0;

    // AS3: PetInfoData.as::levelMax
    public levelMax: number = 0;

    // AS3: PetInfoData.as::name
    public name: string = '';

    // AS3: PetInfoData.as::nutrition
    public nutrition: number = 0;

    // AS3: PetInfoData.as::nutritionMax
    public nutritionMax: number = 0;

    // AS3: PetInfoData.as::ownerId
    public ownerId: number = 0;

    // AS3: PetInfoData.as::ownerName
    public ownerName: string = '';

    // AS3: PetInfoData.as::petRace
    public petRace: number = 0;

    // AS3: PetInfoData.as::petRespect
    public petRespect: number = 0;

    // AS3: PetInfoData.as::petRespectLeft
    public petRespectLeft: number = 0;

    // AS3: PetInfoData.as::petType
    public petType: number = 0;

    // AS3: PetInfoData.as::hasFreeSaddle
    public hasFreeSaddle: boolean = false;

    // AS3: PetInfoData.as::isRiding
    public isRiding: boolean = false;

    // AS3: PetInfoData.as::skillTresholds
    public skillTresholds: number[] = [];

    // AS3: PetInfoData.as::accessRights
    public accessRights: number = 0;

    // AS3: PetInfoData.as::populate()
    public populate(event: RoomWidgetPetInfoUpdateEvent): void
    {
        this.age = event.age;
        this.breedId = event.breedId;
        this.canRemovePet = event.canRemovePet;
        this.energy = event.energy;
        this.energyMax = event.energyMax;
        this.experience = event.experience;
        this.experienceMax = event.experienceMax;
        this.id = event.id;
        this.isOwnPet = event.isOwnPet;
        this.level = event.level;
        this.levelMax = event.levelMax;
        this.name = event.name;
        this.nutrition = event.nutrition;
        this.nutritionMax = event.nutritionMax;
        this.ownerId = event.ownerId;
        this.ownerName = event.ownerName;
        this.petRace = event.petRace;
        this.petRespect = event.petRespect;
        this.petRespectLeft = event.petRespectLeft;
        this.petType = event.petType;
        this.hasFreeSaddle = event.hasFreeSaddle;
        this.isRiding = event.isRiding;
        this.skillTresholds = event.skillTresholds;
        this.accessRights = event.accessRights;
    }
}
