/**
 * YouAreNotControllerMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.permissions.YouAreNotControllerMessageEventParser
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

export class YouAreNotControllerMessageParser implements IMessageParser
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
        if(wrapper === null)
        {
            return false;
        }

        this._flatId = wrapper.readInt();
        return true;
    }
}
