import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for identity accounts event (multi-avatar selection)
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/IdentityAccountsEventParser.as
 */
export class IdentityAccountsEventParser implements IMessageParser
{
    private _accounts: Map<number, string> = new Map();

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/IdentityAccountsEventParser.as::get accounts()
    get accounts(): Map<number, string>
    {
        return this._accounts;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/IdentityAccountsEventParser.as::flush()
    flush(): boolean
    {
        this._accounts = new Map();
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/IdentityAccountsEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._accounts = new Map();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const id = wrapper.readInt();
            const name = wrapper.readString();

            this._accounts.set(id, name);
        }

        return true;
    }
}
