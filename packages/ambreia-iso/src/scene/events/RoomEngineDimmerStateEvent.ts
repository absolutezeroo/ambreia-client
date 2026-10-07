/**
 * RoomEngineDimmerStateEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineDimmerStateEvent.as
 *
 * Event dispatched when dimmer state changes in a room.
 */
import {RoomEngineEvent} from './RoomEngineEvent';

export class RoomEngineDimmerStateEvent extends RoomEngineEvent
{
    public static readonly CYCLED = 'REDSE_ROOM_COLOR';

    constructor(
        roomId: number,
        objectId: number,
        state: number,
        presetId: number,
        effectId: number,
        color: number,
        brightness: number
    )
    {
        super(RoomEngineDimmerStateEvent.CYCLED, roomId);
        this._objectId = objectId;
        this._state = state;
        this._presetId = presetId;
        this._effectId = effectId;
        this._color = color;
        this._brightness = brightness;
    }

    private _objectId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::get objectId()
    get objectId(): number
    {
        return this._objectId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::_state
    private _state: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::get state()
    get state(): number
    {
        return this._state;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::_presetId
    private _presetId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::get presetId()
    get presetId(): number
    {
        return this._presetId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::_effectId
    private _effectId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::get effectId()
    get effectId(): number
    {
        return this._effectId;
    }

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::_color
    private _color: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::get color()
    get color(): number
    {
        return this._color;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::_brightness
    private _brightness: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineDimmerStateEvent.as::get brightness()
    get brightness(): number
    {
        return this._brightness;
    }
}
