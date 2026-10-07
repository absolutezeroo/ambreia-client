import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for flat access denied message
 *
 * @see source_as_win63/habbo/communication/messages/parser/navigator/FlatAccessDeniedMessageEventParser.as
 */
export class FlatAccessDeniedMessageParser implements IMessageParser
{
    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FlatAccessDeniedMessageEventParser.as::_flatId
    private _flatId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FlatAccessDeniedMessageEventParser.as::get flatId()
    get flatId(): number
    {
        return this._flatId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FlatAccessDeniedMessageEventParser.as::_userName
    private _userName: string | null = null;

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FlatAccessDeniedMessageEventParser.as::get userName()
    get userName(): string | null
    {
        return this._userName;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FlatAccessDeniedMessageEventParser.as::flush()
    flush(): boolean
    {
        this._flatId = 0;
        this._userName = null;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/FlatAccessDeniedMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._flatId = wrapper.readInt();
        if(wrapper.bytesAvailable > 0)
        {
            this._userName = wrapper.readString();
        }
        return true;
    }
}
