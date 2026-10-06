/**
 * InfoStandFurniData
 *
 * @see sources/win63_version/habbo/ui/widget/infostand/InfoStandFurniData.as
 */
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {RoomWidgetFurniInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent';

export class InfoStandFurniData
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get id()
    public id: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get category()
    public category: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get name()
    public name: string = '';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get description()
    public description: string = '';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get image()
    public image: unknown = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get classId()
    public classId: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get purchaseOfferId()
    public purchaseOfferId: number = -1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get extraParam()
    public extraParam: string = '';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get stuffData()
    public stuffData: IStuffData | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get groupId()
    public groupId: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get ownerId()
    public ownerId: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get ownerName()
    public ownerName: string = '';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get rentOfferId()
    public rentOfferId: number = -1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::get tradeable()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::set tradeable()
    public tradeable: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniData.as::setData()
    public setData(event: RoomWidgetFurniInfoUpdateEvent): void
    {
        this.id = event.id;
        this.category = event.category;
        this.name = event.name;
        this.description = event.description;
        this.image = event.image;
        this.purchaseOfferId = event.purchaseOfferId;
        this.extraParam = event.extraParam;
        this.stuffData = event.stuffData;
        this.groupId = event.groupId;
        this.ownerName = event.ownerName;
        this.ownerId = event.ownerId;
        this.rentOfferId = event.rentOfferId;
        this.classId = event.classId;
        this.tradeable = event.tradeable;
    }
}
