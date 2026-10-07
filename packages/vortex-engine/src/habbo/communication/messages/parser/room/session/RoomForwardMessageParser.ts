import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * RoomForwardMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.RoomForwardMessageEventParser
 */
export class RoomForwardMessageParser implements IMessageParser
{
    private _roomId: number = 0;

    get roomId(): number
    {
        return this._roomId;
    }

    flush(): boolean
    {
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper)
        {
            return false;
        }

        this._roomId = wrapper.readInt();
        return true;
    }
}
