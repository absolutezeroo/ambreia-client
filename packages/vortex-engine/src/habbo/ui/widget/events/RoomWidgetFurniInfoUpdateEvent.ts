/**
 * RoomWidgetFurniInfoUpdateEvent
 *
 * @see sources/win63_version/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as
 */
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

export class RoomWidgetFurniInfoUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::FURNI
    public static readonly FURNI: string = 'RWFIUE_FURNI';

    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get id()
    public id: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get category()
    public category: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get name()
    public name: string = '';
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get description()
    public description: string = '';
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get image()
    public image: unknown = null;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get classId()
    public classId: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get isWallItem()
    public isWallItem: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get isStickie()
    public isStickie: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get isRoomOwner()
    public isRoomOwner: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get roomControllerLevel()
    public roomControllerLevel: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get isAnyRoomController()
    public isAnyRoomController: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get expiration()
    // AS3 initialises its backing field (_SafeStr_9024) to -1, not 0 - matches the `event.expiration >= 0` gate on
    // InfoStandFurniView.ts:608, though handleGetFurniInfoMessage() always assigns a real value
    // before emitting, so the default itself is never observed today.
    public expiration: number = -1;
    // AS3 (_SafeStr_9402) initialises this to -1, not 0: 0 reads as "offer id 0 exists"
    // and shows a phantom purchase button; -1 means no offer.
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get purchaseOfferId()
    public purchaseOfferId: number = -1;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get bcOfferId()
    public bcOfferId: number = -1;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get extraParam()
    public extraParam: string = '';
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get isOwner()
    public isOwner: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get/set tradeable()
    // Write-only in AS3 too - InfoStandWidgetHandler writes it, nothing in ui/ ever reads it back.
    public tradeable: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get stuffData()
    public stuffData: IStuffData | null = null;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get groupId()
    public groupId: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get ownerId()
    public ownerId: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get ownerName()
    public ownerName: string = '';
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get usagePolicy()
    public usagePolicy: number = 0;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get rentOfferId()
    public rentOfferId: number = -1;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get purchaseCouldBeUsedForBuyout()
    public purchaseCouldBeUsedForBuyout: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get rentCouldBeUsedForBuyout()
    public rentCouldBeUsedForBuyout: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get availableForBuildersClub()
    public availableForBuildersClub: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::get isNft()
    public isNft: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent.as::RoomWidgetFurniInfoUpdateEvent()
    constructor(type: string)
    {
        super(type);
    }
}
