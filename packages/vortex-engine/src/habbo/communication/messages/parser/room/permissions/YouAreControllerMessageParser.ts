/**
 * YouAreControllerMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.permissions.YouAreControllerMessageEventParser
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

export class YouAreControllerMessageParser implements IMessageParser
{
    private _flatId: number = 0;

    public get flatId(): number
    {
        return this._flatId;
    }

    private _roomControllerLevel: number = 0;

    public get roomControllerLevel(): number
    {
        return this._roomControllerLevel;
    }

    public flush(): boolean
    {
        this._flatId = 0;
        this._roomControllerLevel = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._flatId = wrapper.readInt();
        this._roomControllerLevel = wrapper.readInt();
        return true;
    }
}
