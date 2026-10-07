import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * HandItemReceivedMessageParser
 *
 * Based on AS3:
 * - com.sulake.habbo.communication.messages.parser.users.HandItemReceivedMessageEventParser
 * - com.sulake.habbo.communication.messages.parser.users.HandItemReceivedMessageParser
 */
export class HandItemReceivedMessageParser implements IMessageParser
{
    private _giverUserId: number = -1;
    private _handItemType: number = 0;

    get giverUserId(): number
    {
        return this._giverUserId;
    }

    get handItemType(): number
    {
        return this._handItemType;
    }

    flush(): boolean
    {
        this._giverUserId = -1;
        this._handItemType = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._giverUserId = wrapper.readInt();
        this._handItemType = wrapper.readInt();
        return true;
    }
}
