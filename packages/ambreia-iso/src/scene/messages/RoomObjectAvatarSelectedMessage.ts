/**
 * RoomObjectAvatarSelectedMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarSelectedMessage
 *
 * Update message for avatar selection state.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarSelectedMessage extends RoomObjectUpdateMessage
{
    constructor(selected: boolean)
    {
        super(null, null);
        this._selected = selected;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarSelectedMessage.as::_selected
    private _selected: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarSelectedMessage.as::get selected()
    get selected(): boolean
    {
        return this._selected;
    }
}
