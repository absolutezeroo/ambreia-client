import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parses an element pointer (hint) message from the server.
 *
 * The server sends a single string key identifying the UI element
 * to point at. An empty key means hide the current hint.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/notifications/ElementPointerMessageEventParser.as
 */
export class ElementPointerMessageEventParser implements IMessageParser
{
    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/ElementPointerMessageEventParser.as::_key
    private _key: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/ElementPointerMessageEventParser.as::get key()
    public get key(): string
    {
        return this._key;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/ElementPointerMessageEventParser.as::flush()
    public flush(): boolean
    {
        this._key = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/ElementPointerMessageEventParser.as::parse()
    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._key = wrapper.readString();
        return true;
    }
}
