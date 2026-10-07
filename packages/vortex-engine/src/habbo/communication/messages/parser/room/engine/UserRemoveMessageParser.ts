/**
 * UserRemoveMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.UserRemoveMessageEventParser
 *
 * Parser for removing a user from the room.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class UserRemoveMessageParser implements IMessageParser
{
    private _roomIndex: number = 0;

    get roomIndex(): number
    {
        return this._roomIndex;
    }

    flush(): boolean
    {
        this._roomIndex = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        const value = wrapper.readString();
        this._roomIndex = parseInt(value, 10);

        return true;
    }
}
