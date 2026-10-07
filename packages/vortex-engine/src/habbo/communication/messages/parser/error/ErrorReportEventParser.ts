import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for error report event
 *
 * @see source_as_win63/habbo/communication/messages/parser/error/ErrorReportEventParser.as
 */
export class ErrorReportEventParser implements IMessageParser
{
    private _errorCode: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/error/ErrorReportEventParser.as::get errorCode()
    get errorCode(): number
    {
        return this._errorCode;
    }

    private _messageId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/error/ErrorReportEventParser.as::get messageId()
    get messageId(): number
    {
        return this._messageId;
    }

    private _timestamp: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/error/ErrorReportEventParser.as::get timestamp()
    get timestamp(): string
    {
        return this._timestamp;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/error/ErrorReportEventParser.as::flush()
    flush(): boolean
    {
        this._errorCode = 0;
        this._messageId = 0;
        this._timestamp = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/error/ErrorReportEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._messageId = wrapper.readInt();
        this._errorCode = wrapper.readInt();
        this._timestamp = wrapper.readString();
        return true;
    }
}
