/**
 * YouAreOwnerMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.permissions.YouAreOwnerMessageEventParser
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

export class YouAreOwnerMessageParser implements IMessageParser
{
    private _flatId: number = 0;

    public get flatId(): number
    {
        return this._flatId;
    }

    public flush(): boolean
    {
        this._flatId = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._flatId = wrapper.readInt();
        return true;
    }
}
