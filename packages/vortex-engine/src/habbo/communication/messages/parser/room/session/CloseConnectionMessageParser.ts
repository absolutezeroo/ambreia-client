/**
 * CloseConnectionMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.CloseConnectionMessageEventParser
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

export class CloseConnectionMessageParser implements IMessageParser
{
    public flush(): boolean
    {
        return true;
    }

    public parse(_wrapper: IMessageDataWrapper): boolean
    {
        return true;
    }
}
