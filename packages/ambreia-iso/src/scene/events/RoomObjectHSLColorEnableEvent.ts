/**
 * RoomObjectHSLColorEnableEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectHSLColorEnableEvent.as
 *
 * Event dispatched from room object to enable/change HSL background color.
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectHSLColorEnableEvent extends RoomObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::ROOM_BACKGROUND_COLOR
    public static readonly ROOM_BACKGROUND_COLOR = 'ROHSLCEE_ROOM_BACKGROUND_COLOR';

    constructor(
        type: string,
        object: IRoomObject,
        enable: boolean,
        hue: number,
        saturation: number,
        lightness: number
    )
    {
        super(type, object);
        this._enable = enable;
        this._hue = hue;
        this._saturation = saturation;
        this._lightness = lightness;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::_enable
    private _enable: boolean;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::get enable()
    get enable(): boolean
    {
        return this._enable;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::_hue
    private _hue: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::get hue()
    get hue(): number
    {
        return this._hue;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::_saturation
    private _saturation: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::get saturation()
    get saturation(): number
    {
        return this._saturation;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::_lightness
    private _lightness: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectHSLColorEnableEvent.as::get lightness()
    get lightness(): number
    {
        return this._lightness;
    }
}
