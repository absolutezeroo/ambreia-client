import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for user rights/permissions
 * Message ID: 1416
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as
 */
export class UserRightsMessageParser implements IMessageParser
{
    private _securityLevel: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::get securityLevel()
    get securityLevel(): number
    {
        return this._securityLevel;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::flush()
    flush(): boolean
    {
        this._securityLevel = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::parse()
    // DEVIATION: AS3 reads a club level before the security level and an ambassador flag after it.
    // The RPG server has neither (no club, no ambassadors) and sends the security level alone.
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper.bytesAvailable >= 4)
        {
            this._securityLevel = wrapper.readInt();
        }
        return true;
    }
}
