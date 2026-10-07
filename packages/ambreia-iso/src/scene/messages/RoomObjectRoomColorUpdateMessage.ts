/**
 * RoomObjectRoomColorUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as
 *
 * Update message for room background color changes.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectRoomColorUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::BACKGROUND_COLOR
    public static readonly BACKGROUND_COLOR = 'RORCUM_BACKGROUND_COLOR';

    constructor(type: string, color: number, light: number, bgOnly: boolean)
    {
        super(null, null);
        this._type = type;
        this._color = color;
        this._light = light;
        this._bgOnly = bgOnly;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::_type
    private _type: string = '';

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::_color
    private _color: number = 0;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::get color()
    get color(): number
    {
        return this._color;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::_light
    private _light: number = 0;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::get light()
    get light(): number
    {
        return this._light;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::_bgOnly
    private _bgOnly: boolean = true;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectRoomColorUpdateMessage.as::get bgOnly()
    get bgOnly(): boolean
    {
        return this._bgOnly;
    }
}
