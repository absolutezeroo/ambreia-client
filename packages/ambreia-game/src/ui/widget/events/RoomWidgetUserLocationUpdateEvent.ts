import type {IRoomEngineRectangle} from '../../../room/RoomEngine';
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

/**
 * Where an object sits on screen: its bounding box and its projected location, both already
 * offset into room-view coordinates.
 *
 * Unlike the rest of the update events this one is never dispatched on the bus — it is the return
 * value of `ObjectLocationRequestHandler.processWidgetMessage()`.
 *
 * Both fields can be null: AS3 still builds the event when the user is not in the room, so the
 * caller distinguishes "not found" from "no answer" by the rectangle rather than by a null event.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetUserLocationUpdateEvent.as
 */
export class RoomWidgetUserLocationUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: .../widget/events/RoomWidgetUserLocationUpdateEvent.as::USER_LOCATION_UPDATE
    public static readonly USER_LOCATION_UPDATE: string = 'RWULUE_USER_LOCATION_UPDATE';

    // AS3: .../widget/events/RoomWidgetUserLocationUpdateEvent.as::_userId
    private _userId: number;

    // AS3: .../widget/events/RoomWidgetUserLocationUpdateEvent.as::_rectangle
    private _rectangle: IRoomEngineRectangle | null;

    // AS3: .../widget/events/RoomWidgetUserLocationUpdateEvent.as::_screenLocation
    private _screenLocation: {x: number; y: number} | null;

    // AS3: .../widget/events/RoomWidgetUserLocationUpdateEvent.as::RoomWidgetUserLocationUpdateEvent()
    // The type is fixed rather than passed — this event has exactly one.
    constructor(
        userId: number,
        rectangle: IRoomEngineRectangle | null,
        screenLocation: {x: number; y: number} | null
    )
    {
        super(RoomWidgetUserLocationUpdateEvent.USER_LOCATION_UPDATE);

        this._userId = userId;
        this._rectangle = rectangle;
        this._screenLocation = screenLocation;
    }

    // AS3: .../widget/events/RoomWidgetUserLocationUpdateEvent.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    // AS3: .../widget/events/RoomWidgetUserLocationUpdateEvent.as::get rectangle()
    get rectangle(): IRoomEngineRectangle | null
    {
        return this._rectangle;
    }

    // AS3: .../widget/events/RoomWidgetUserLocationUpdateEvent.as::get screenLocation()
    get screenLocation(): {x: number; y: number} | null
    {
        return this._screenLocation;
    }
}
