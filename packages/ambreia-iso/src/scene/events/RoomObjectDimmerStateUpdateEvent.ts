/**
 * RoomObjectDimmerStateUpdateEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as
 *
 * Event dispatched from room object when dimmer state is updated.
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectDimmerStateUpdateEvent extends RoomObjectEvent
{
    public static readonly CYCLED = 'RODSUE_DIMMER_STATE';

    constructor(
        object: IRoomObject,
        state: number,
        presetId: number,
        effectId: number,
        color: number,
        brightness: number
    )
    {
        super(RoomObjectDimmerStateUpdateEvent.CYCLED, object);
        this._state = state;
        this._presetId = presetId;
        this._effectId = effectId;
        this._color = color;
        this._brightness = brightness;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::_state
    private _state: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::get state()
    get state(): number
    {
        return this._state;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::_presetId
    private _presetId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::get presetId()
    get presetId(): number
    {
        return this._presetId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::_effectId
    private _effectId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::get effectId()
    get effectId(): number
    {
        return this._effectId;
    }

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::_color
    private _color: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::get color()
    get color(): number
    {
        return this._color;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::_brightness
    private _brightness: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectDimmerStateUpdateEvent.as::get brightness()
    get brightness(): number
    {
        return this._brightness;
    }
}
