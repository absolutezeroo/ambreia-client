import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for account safety lock status change message
 *
 * Parses the safety lock status code.
 *
 * @see source_as_win63/habbo/communication/messages/parser/users/AccountSafetyLockStatusChangeMessageEventParser.as
 */
export class AccountSafetyLockStatusChangeMessageEventParser implements IMessageParser
{
    public static readonly UNLOCKED: number = 0;
    public static readonly LOCKED: number = 1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/AccountSafetyLockStatusChangeMessageEventParser.as::_status
    private _status: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/AccountSafetyLockStatusChangeMessageEventParser.as::get status()
    get status(): number
    {
        return this._status;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/AccountSafetyLockStatusChangeMessageEventParser.as::flush()
    flush(): boolean
    {
        this._status = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/AccountSafetyLockStatusChangeMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._status = wrapper.readInt();

        return true;
    }
}
