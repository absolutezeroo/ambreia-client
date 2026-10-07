/**
 * RoomEntryInfoMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.RoomEntryInfoMessageEventParser
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

export class RoomEntryInfoMessageParser implements IMessageParser
{
    private _guestRoomId: number = 0;

    public get guestRoomId(): number
    {
        return this._guestRoomId;
    }

    private _owner: boolean = false;

    public get owner(): boolean
    {
        return this._owner;
    }

    public flush(): boolean
    {
        this._guestRoomId = 0;
        this._owner = false;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._guestRoomId = wrapper.readInt();
        this._owner = wrapper.readBoolean();
        return true;
    }
}
