import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for disconnect reason
 * Message ID: 4000
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/DisconnectReasonEventParser.as
 */
export class DisconnectReasonMessageParser implements IMessageParser
{
    private _reason: number = -1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/DisconnectReasonEventParser.as::get reason()
    get reason(): number
    {
        return this._reason;
    }

    /**
	 * Get human-readable disconnect reason
	 */
    get reasonText(): string
    {
        switch(this._reason)
        {
            case -2:
                return 'Maintenance';
            case 0:
                return 'Logged out';
            case 1:
                return 'Just banned';
            case 2:
            case 11:
            case 13:
            case 18:
                return 'Concurrent login';
            case 10:
                return 'Still banned';
            case 12:
            case 19:
                return 'Hotel closed';
            case 20:
                return 'Incorrect password';
            case 22:
                return 'Incompatible client version';
            default:
                return `Unknown reason (${this._reason})`;
        }
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/DisconnectReasonEventParser.as::flush()
    flush(): boolean
    {
        this._reason = -1;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/DisconnectReasonEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper.bytesAvailable >= 4)
        {
            this._reason = wrapper.readInt();
        }
        return true;
    }
}
