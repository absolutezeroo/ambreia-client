/**
 * OpenConnectionMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.OpenConnectionMessageEventParser
 *
 * Parser for room connection opened message.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class OpenConnectionMessageParser implements IMessageParser
{
    private _flatId: number = 0;

    get flatId(): number
    {
        return this._flatId;
    }

    flush(): boolean
    {
        this._flatId = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._flatId = wrapper.readInt();
        return true;
    }
}
