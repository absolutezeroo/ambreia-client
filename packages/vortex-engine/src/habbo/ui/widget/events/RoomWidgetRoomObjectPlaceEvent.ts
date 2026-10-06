import {RoomWidgetRoomObjectUpdateEvent} from './RoomWidgetRoomObjectUpdateEvent';

/**
 * "An object was just dropped somewhere" — the widget-side translation of the room engine's
 * `REOE_PLACED`, carrying where it landed and who started the drag.
 *
 * `placementSource` is the interesting field: the same event reaches every widget, and each one
 * acts only on its own string (`info_stand`, `catalog`, …). In AS3 that is how the Builders Club
 * place-from-infostand flow told its own drop apart from a catalog purchase being placed; the RPG
 * fork removed that flow, so nothing listens for this event any more.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetRoomObjectPlaceEvent.as
 */
export class RoomWidgetRoomObjectPlaceEvent extends RoomWidgetRoomObjectUpdateEvent
{
    /** Derived name — `_SafeStr_11623`, named from its value. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_11623
    public static readonly OBJECT_PLACED: string = 'RWROUE_OBJECT_PLACED';

    /** Derived name — `_SafeStr_8549`: the wall coordinate string, empty for a floor item. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_8549
    private _wallLocation: string;

    /** Derived name — `_SafeStr_4555`. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_4555
    private _x: number;

    /** Derived name — `_SafeStr_4557`. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_4557
    private _y: number;

    /** Derived name — `_SafeStr_4713`. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_4713
    private _z: number;

    /** Derived name — `_SafeStr_4615`. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_4615
    private _direction: number;

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_placedInRoom
    private _placedInRoom: boolean;

    /** Derived name — `_SafeStr_9554`, the counterpart of the unobfuscated `_placedOnWall`. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_9554
    private _placedOnFloor: boolean;

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_placedOnWall
    private _placedOnWall: boolean;

    /** Derived name — `_SafeStr_9184`. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_9184
    private _instanceData: string | null;

    /** Derived name — `_SafeStr_9546`. */
    // AS3: RoomWidgetRoomObjectPlaceEvent.as::_SafeStr_9546
    private _placementSource: string | null;

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::RoomWidgetRoomObjectPlaceEvent()
    constructor(
        type: string,
        id: number,
        category: number,
        roomId: number,
        wallLocation: string,
        x: number,
        y: number,
        z: number,
        direction: number,
        placedInRoom: boolean,
        placedOnFloor: boolean,
        placedOnWall: boolean,
        instanceData: string | null,
        placementSource: string | null
    )
    {
        super(type, id, category, roomId);

        this._wallLocation = wallLocation;
        this._x = x;
        this._y = y;
        this._z = z;
        this._direction = direction;
        this._placedInRoom = placedInRoom;
        this._placedOnFloor = placedOnFloor;
        this._placedOnWall = placedOnWall;
        this._instanceData = instanceData;
        this._placementSource = placementSource;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get wallLocation()
    public get wallLocation(): string
    {
        return this._wallLocation;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get x()
    public get x(): number
    {
        return this._x;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get y()
    public get y(): number
    {
        return this._y;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get z()
    public get z(): number
    {
        return this._z;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get direction()
    public get direction(): number
    {
        return this._direction;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get placedInRoom()
    public get placedInRoom(): boolean
    {
        return this._placedInRoom;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get placedOnFloor()
    public get placedOnFloor(): boolean
    {
        return this._placedOnFloor;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get placedOnWall()
    public get placedOnWall(): boolean
    {
        return this._placedOnWall;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get instanceData()
    public get instanceData(): string | null
    {
        return this._instanceData;
    }

    // AS3: RoomWidgetRoomObjectPlaceEvent.as::get placementSource()
    public get placementSource(): string | null
    {
        return this._placementSource;
    }
}
