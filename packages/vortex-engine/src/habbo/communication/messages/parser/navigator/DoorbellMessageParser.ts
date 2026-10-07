import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for doorbell message
 *
 * @see source_as_win63/habbo/communication/messages/parser/navigator/DoorbellMessageEventParser.as
 */
export class DoorbellMessageParser implements IMessageParser
{
    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/DoorbellMessageEventParser.as::_userName
    private _userName: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/DoorbellMessageEventParser.as::get userName()
    get userName(): string
    {
        return this._userName;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/DoorbellMessageEventParser.as::flush()
    flush(): boolean
    {
        this._userName = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/DoorbellMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._userName = wrapper.readString();
        return true;
    }
}
