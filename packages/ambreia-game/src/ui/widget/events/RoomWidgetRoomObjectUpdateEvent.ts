/**
 * RoomWidgetRoomObjectUpdateEvent
 *
 * @see sources/win63_version/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as
 */
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

export class RoomWidgetRoomObjectUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::const_990
    public static readonly OBJECT_SELECTED: string = 'RWROUE_OBJECT_SELECTED';

    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::const_838
    public static readonly OBJECT_DESELECTED: string = 'RWROUE_OBJECT_DESELECTED';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::USER_REMOVED
    public static readonly USER_REMOVED: string = 'RWROUE_USER_REMOVED';

    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::const_959
    public static readonly FURNI_REMOVED: string = 'RWROUE_FURNI_REMOVED';

    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::const_847
    public static readonly FURNI_ADDED: string = 'RWROUE_FURNI_ADDED';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::USER_ADDED
    public static readonly USER_ADDED: string = 'RWROUE_USER_ADDED';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::OBJECT_ROLL_OVER
    public static readonly OBJECT_ROLL_OVER: string = 'RWROUE_OBJECT_ROLL_OVER';

    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::const_1062
    public static readonly OBJECT_ROLL_OUT: string = 'RWROUE_OBJECT_ROLL_OUT';

    private _id: number;
    private _category: number;
    private _roomId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::RoomWidgetRoomObjectUpdateEvent()
    constructor(type: string, id: number, category: number, roomId: number)
    {
        super(type);
        this._id = id;
        this._category = category;
        this._roomId = roomId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::get id()
    public get id(): number
    {
        return this._id;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::get category()
    public get category(): number
    {
        return this._category;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent.as::get roomId()
    public get roomId(): number
    {
        return this._roomId;
    }
}
