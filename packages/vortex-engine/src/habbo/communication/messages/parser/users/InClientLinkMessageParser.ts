import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for in-client link messages sent by the server
 *
 * @see source_as_win63/habbo/communication/messages/parser/users/InClientLinkMessageEventParser.as
 */
export class InClientLinkMessageParser implements IMessageParser
{
    private _link: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/InClientLinkMessageEventParser.as::get link()
    get link(): string
    {
        return this._link;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/InClientLinkMessageEventParser.as::flush()
    flush(): boolean
    {
        this._link = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/InClientLinkMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._link = wrapper.readString();

        return true;
    }
}
