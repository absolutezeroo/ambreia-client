/**
 * RoomReadyMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.RoomReadyMessageEventParser
 *
 * Parser for room ready message (room is loaded and ready).
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class RoomReadyMessageParser implements IMessageParser
{
    private _roomType: string = '';

    get roomType(): string
    {
        return this._roomType;
    }

    private _roomId: number = 0;

    get roomId(): number
    {
        return this._roomId;
    }

    flush(): boolean
    {
        this._roomType = '';
        this._roomId = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._roomType = wrapper.readString();
        this._roomId = wrapper.readInt();
        return true;
    }
}
