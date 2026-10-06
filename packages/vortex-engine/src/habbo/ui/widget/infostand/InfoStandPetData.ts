/**
 * InfoStandPetData
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as
 *
 * AS3 backs every field with a private var + read-only getter; this port keeps the
 * existing plain-public-field shape used by the sibling InfoStand*Data classes.
 * The field set is AS3's — note it deliberately drops the event's
 * petRespectLeft/hasFreeSaddle/isRiding, which AS3's setData() does not copy either
 * (petRespectLeft goes to InfoStandUserData instead, see InfoStandWidget.onPetInfo()).
 *
 * The RPG fork removed pet breeding and monsterplants: AS3's rarityLevel,
 * hasBreedingPermission and the three monsterplant timers are not ported.
 */
import type {RoomWidgetPetInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent';

export class InfoStandPetData
{
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get name()
    public name: string = '';
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get id()
    public id: number = -1;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get type()
    public type: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get race()
    public race: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get image()
    public image: ImageBitmap | null = null;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get isOwnPet()
    public isOwnPet: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get ownerId()
    public ownerId: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get ownerName()
    public ownerName: string = '';
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get canRemovePet()
    public canRemovePet: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get age()
    public age: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get breedId()
    public breedId: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get skillTresholds()
    public skillTresholds: number[] = [];
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get accessRights()
    public accessRights: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get level()
    public level: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get levelMax()
    public levelMax: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get experience()
    public experience: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get experienceMax()
    public experienceMax: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get energy()
    public energy: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get energyMax()
    public energyMax: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get nutrition()
    public nutrition: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get nutritionMax()
    public nutritionMax: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get petRespect()
    public petRespect: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::get roomIndex()
    public roomIndex: number = 0;

    // DEVIATION: AS3 also copies the rarity, the breeding permission and the three monsterplant
    //   timers; the RPG fork removed pet breeding and monsterplants.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandPetData.as::setData()
    public setData(event: RoomWidgetPetInfoUpdateEvent): void
    {
        this.name = event.name;
        this.id = event.id;
        this.type = event.petType;
        this.race = event.petRace;
        this.image = event.image;
        this.isOwnPet = event.isOwnPet;
        this.ownerId = event.ownerId;
        this.ownerName = event.ownerName;
        this.canRemovePet = event.canRemovePet;
        this.level = event.level;
        this.levelMax = event.levelMax;
        this.experience = event.experience;
        this.experienceMax = event.experienceMax;
        this.energy = event.energy;
        this.energyMax = event.energyMax;
        this.nutrition = event.nutrition;
        this.nutritionMax = event.nutritionMax;
        this.petRespect = event.petRespect;
        this.roomIndex = event.roomIndex;
        this.age = event.age;
        this.breedId = event.breedId;
        this.skillTresholds = event.skillTresholds;
        this.accessRights = event.accessRights;
    }
}
