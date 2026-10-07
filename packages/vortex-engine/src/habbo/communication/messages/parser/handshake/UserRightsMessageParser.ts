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
    private _clubLevel: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::get clubLevel()
    get clubLevel(): number
    {
        return this._clubLevel;
    }

    private _securityLevel: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::get securityLevel()
    get securityLevel(): number
    {
        return this._securityLevel;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::_isAmbassador
    private _isAmbassador: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::get isAmbassador()
    get isAmbassador(): boolean
    {
        return this._isAmbassador;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::flush()
    flush(): boolean
    {
        this._clubLevel = 0;
        this._securityLevel = 0;
        this._isAmbassador = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserRightsMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper.bytesAvailable >= 4)
        {
            this._clubLevel = wrapper.readInt();
        }
        if(wrapper.bytesAvailable >= 4)
        {
            this._securityLevel = wrapper.readInt();
        }
        if(wrapper.bytesAvailable >= 1)
        {
            this._isAmbassador = wrapper.readBoolean();
        }
        return true;
    }
}
