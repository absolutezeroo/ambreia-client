/**
 * RoomEngineHSLColorEnableEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineHSLColorEnableEvent.as
 *
 * Event dispatched when HSL room background color is enabled/changed.
 */
import {RoomEngineEvent} from './RoomEngineEvent';

export class RoomEngineHSLColorEnableEvent extends RoomEngineEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineHSLColorEnableEvent.as::ROOM_BACKGROUND_COLOR
    public static readonly ROOM_BACKGROUND_COLOR = 'ROHSLCEE_ROOM_BACKGROUND_COLOR';

    constructor(
        type: string,
        roomId: number,
        enable: boolean,
        hue: number,
        saturation: number,
        lightness: number
    )
    {
        super(type, roomId);
        this._enable = enable;
        this._hue = hue;
        this._saturation = saturation;
        this._lightness = lightness;
    }

    private _enable: boolean;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineHSLColorEnableEvent.as::get enable()
    get enable(): boolean
    {
        return this._enable;
    }

    private _hue: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineHSLColorEnableEvent.as::get hue()
    get hue(): number
    {
        return this._hue;
    }

    private _saturation: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineHSLColorEnableEvent.as::get saturation()
    get saturation(): number
    {
        return this._saturation;
    }

    private _lightness: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineHSLColorEnableEvent.as::get lightness()
    get lightness(): number
    {
        return this._lightness;
    }
}
