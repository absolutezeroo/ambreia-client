import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parses guide session error data from the server.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/help/GuideSessionErrorMessageEventParser.as
 */
export class GuideSessionErrorMessageParser implements IMessageParser
{
    public static readonly ERROR_NO_AVAILABLE_GUIDES: number = 0;
    public static readonly ERROR_REQUEST_PENDING: number = 1;
    public static readonly ERROR_SESSION_ACTIVE: number = 2;
    public static readonly ERROR_GUIDE_UNAVAILABLE: number = 3;
    public static readonly ERROR_INVALID_REQUEST: number = 4;

    private _errorCode: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionErrorMessageEventParser.as::get errorCode()
    get errorCode(): number
    {
        return this._errorCode;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionErrorMessageEventParser.as::flush()
    flush(): boolean
    {
        this._errorCode = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionErrorMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._errorCode = wrapper.readInt();
        return true;
    }
}
