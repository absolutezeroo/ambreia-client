/**
 * RoomObjectSelectedMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectSelectedMessage.as
 *
 * Message sent when a room object is selected/deselected.
 */
import {RoomObjectUpdateStateMessage} from './RoomObjectUpdateStateMessage';

export class RoomObjectSelectedMessage extends RoomObjectUpdateStateMessage
{
    constructor(selected: boolean)
    {
        super();
        this._selected = selected;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectSelectedMessage.as::_selected
    private _selected: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectSelectedMessage.as::get selected()
    get selected(): boolean
    {
        return this._selected;
    }
}
