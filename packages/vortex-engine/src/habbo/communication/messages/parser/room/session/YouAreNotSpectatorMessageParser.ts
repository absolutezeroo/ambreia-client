import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * YouAreNotSpectatorMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.YouAreNotSpectatorMessageEventParser
 */
export class YouAreNotSpectatorMessageParser implements IMessageParser
{
    private _flatId: number = 0;

    get flatId(): number
    {
        return this._flatId;
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

        this._flatId = wrapper.readInt();
        return true;
    }
}
