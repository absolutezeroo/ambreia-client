/**
 * FlatAccessibleMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.FlatAccessibleMessageEventParser
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

export class FlatAccessibleMessageParser implements IMessageParser
{
    private _flatId: number = 0;

    public get flatId(): number
    {
        return this._flatId;
    }

    private _userName: string | null = null;

    public get userName(): string | null
    {
        return this._userName;
    }

    public flush(): boolean
    {
        this._flatId = 0;
        this._userName = null;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._flatId = wrapper.readInt();
        this._userName = wrapper.readString();
        return true;
    }
}
