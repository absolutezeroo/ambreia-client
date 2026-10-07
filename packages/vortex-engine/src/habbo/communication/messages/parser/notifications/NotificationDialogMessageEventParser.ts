import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for notification dialog message
 *
 * Parses a dialog type string and a set of key-value parameter pairs.
 *
 * @see source_as_win63/habbo/communication/messages/parser/notifications/NotificationDialogMessageEventParser.as
 */
export class NotificationDialogMessageEventParser implements IMessageParser
{
    private _type: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/NotificationDialogMessageEventParser.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/NotificationDialogMessageEventParser.as::_parameters
    private _parameters: Map<string, string> = new Map();

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/NotificationDialogMessageEventParser.as::get parameters()
    get parameters(): Map<string, string>
    {
        return this._parameters;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/NotificationDialogMessageEventParser.as::flush()
    flush(): boolean
    {
        this._type = '';
        this._parameters = new Map();
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/NotificationDialogMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._type = wrapper.readString();
        this._parameters = new Map();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const key = wrapper.readString();
            const value = wrapper.readString();
            this._parameters.set(key, value);
        }

        return true;
    }
}
