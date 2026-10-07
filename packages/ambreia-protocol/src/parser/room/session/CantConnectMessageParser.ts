import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * CantConnectMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.CantConnectMessageEventParser
 * Secondary reference: com.sulake.habbo.communication.messages.parser.room.session.CantConnectMessageParser
 */
export class CantConnectMessageParser implements IMessageParser
{
    public static readonly REASON_FULL = 1;
    public static readonly REASON_CLOSED = 2;
    public static readonly REASON_QUEUE_ERROR = 3;
    public static readonly REASON_BANNED = 4;

    private _reason: number = 0;
    private _parameter: string = '';

    get reason(): number
    {
        return this._reason;
    }

    get parameter(): string
    {
        return this._parameter;
    }

    flush(): boolean
    {
        this._reason = 0;
        this._parameter = '';
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper)
        {
            return false;
        }

        this._reason = wrapper.readInt();

        if(this._reason === CantConnectMessageParser.REASON_QUEUE_ERROR)
        {
            this._parameter = wrapper.readString();
        }
        else
        {
            this._parameter = '';
        }

        return true;
    }
}
