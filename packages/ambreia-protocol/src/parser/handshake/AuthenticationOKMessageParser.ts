import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for successful authentication response
 * Message ID: 2323
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/AuthenticationOKMessageEventParser.as
 */
export class AuthenticationOKMessageParser implements IMessageParser
{
    private _accountId: number = -1;
    private _suggestedLoginActions: number[] = [];
    private _identityId: number = -1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/AuthenticationOKMessageEventParser.as::flush()
    flush(): boolean
    {
        this._accountId = -1;
        this._suggestedLoginActions = [];
        this._identityId = -1;

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/AuthenticationOKMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._accountId = wrapper.readInt();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._suggestedLoginActions.push(wrapper.readShort());
        }

        this._identityId = wrapper.readInt();

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/AuthenticationOKMessageEventParser.as::get accountId()
    get accountId(): number
    {
        return this._accountId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/AuthenticationOKMessageEventParser.as::get suggestedLoginActions()
    get suggestedLoginActions(): number[]
    {
        return this._suggestedLoginActions;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/AuthenticationOKMessageEventParser.as::get identityId()
    get identityId(): number
    {
        return this._identityId;
    }
}
