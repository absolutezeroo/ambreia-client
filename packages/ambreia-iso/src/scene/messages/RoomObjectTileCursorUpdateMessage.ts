/**
 * RoomObjectTileCursorUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as
 *
 * Update message for tile cursor position and visibility.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {Vector3d} from '../../utils/Vector3d';

export class RoomObjectTileCursorUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(
        // AS3 passes null from toggleTileCursorVisibility(); the base already takes a null location.
        location: Vector3d | null,
        height: number,
        visible: boolean,
        sourceEventId: string,
        toggleVisibility: boolean = false
    )
    {
        super(location, null);

        this._height = height;
        this._visible = visible;
        this._sourceEventId = sourceEventId;
        this._toggleVisibility = toggleVisibility;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as::_height
    private _height: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as::get height()
    get height(): number
    {
        return this._height;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as::_visible
    private _visible: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as::get visible()
    get visible(): boolean
    {
        return this._visible;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as::_sourceEventId
    private _sourceEventId: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as::get sourceEventId()
    get sourceEventId(): string
    {
        return this._sourceEventId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as::_toggleVisibility
    private _toggleVisibility: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectTileCursorUpdateMessage.as::get toggleVisibility()
    get toggleVisibility(): boolean
    {
        return this._toggleVisibility;
    }
}
