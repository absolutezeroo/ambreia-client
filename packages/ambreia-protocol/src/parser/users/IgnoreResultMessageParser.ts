import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * Parser for ignore/unignore results.
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.users.IgnoreResultMessageEventParser
 */
export class IgnoreResultMessageParser implements IMessageParser
{
    private _result: number = -1;
    private _ignoredUserId: number = 0;

    get result(): number
    {
        return this._result;
    }

    get ignoredUserId(): number
    {
        return this._ignoredUserId;
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

        this._result = wrapper.readInt();
        this._ignoredUserId = wrapper.readInt();
        return true;
    }
}
