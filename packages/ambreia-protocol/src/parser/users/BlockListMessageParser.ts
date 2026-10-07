import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * Parser for blocked users list.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/users/BlockListMessageEventParser.as
 */
export class BlockListMessageParser implements IMessageParser
{
    private _blockedUsers: number[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/BlockListMessageEventParser.as::get blockedUsers()
    get blockedUsers(): number[]
    {
        return this._blockedUsers.slice();
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/BlockListMessageEventParser.as::flush()
    flush(): boolean
    {
        this._blockedUsers = [];
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/BlockListMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._blockedUsers = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._blockedUsers.push(wrapper.readInt());
        }

        return true;
    }
}
