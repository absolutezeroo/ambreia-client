import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for generic error messages
 * Message ID: 598
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/GenericErrorEventParser.as
 */
export class GenericErrorMessageParser implements IMessageParser
{
    private _errorCode: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/GenericErrorEventParser.as::get errorCode()
    get errorCode(): number
    {
        return this._errorCode;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/GenericErrorEventParser.as::flush()
    flush(): boolean
    {
        this._errorCode = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/GenericErrorEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper.bytesAvailable >= 4)
        {
            this._errorCode = wrapper.readInt();
        }
        return true;
    }
}
