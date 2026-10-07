import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * Parser for email status result message
 *
 * @see source_as_win63/habbo/communication/messages/parser/users/EmailStatusResultEventParser.as
 */
export class EmailStatusResultParser implements IMessageParser
{
    private _email: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/EmailStatusResultEventParser.as::get email()
    get email(): string
    {
        return this._email;
    }

    private _isVerified: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/EmailStatusResultEventParser.as::get isVerified()
    get isVerified(): boolean
    {
        return this._isVerified;
    }

    private _allowChange: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/EmailStatusResultEventParser.as::get allowChange()
    get allowChange(): boolean
    {
        return this._allowChange;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/EmailStatusResultEventParser.as::flush()
    flush(): boolean
    {
        this._email = '';
        this._isVerified = false;
        this._allowChange = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/EmailStatusResultEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._email = wrapper.readString();
        this._isVerified = wrapper.readBoolean();
        this._allowChange = wrapper.readBoolean();

        return true;
    }
}
