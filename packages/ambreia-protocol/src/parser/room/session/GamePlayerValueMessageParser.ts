import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * GamePlayerValueMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.GamePlayerValueMessageEventParser
 */
export class GamePlayerValueMessageParser implements IMessageParser
{
    private _userId: number = 0;
    private _value: number = 0;

    get userId(): number
    {
        return this._userId;
    }

    get value(): number
    {
        return this._value;
    }

    flush(): boolean
    {
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper)
        {
            return false;
        }

        this._userId = wrapper.readInt();
        this._value = wrapper.readInt();
        return true;
    }
}
