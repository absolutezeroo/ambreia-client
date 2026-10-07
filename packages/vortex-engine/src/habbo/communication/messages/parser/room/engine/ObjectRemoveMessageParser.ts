/**
 * ObjectRemoveMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.ObjectRemoveMessageEventParser
 *
 * Parser for removing a floor furniture object.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class ObjectRemoveMessageParser implements IMessageParser
{
    private _objectId: number = 0;

    get objectId(): number
    {
        return this._objectId;
    }

    private _isExpired: boolean = false;

    get isExpired(): boolean
    {
        return this._isExpired;
    }

    private _pickerId: number = 0;

    get pickerId(): number
    {
        return this._pickerId;
    }

    private _delay: number = 0;

    get delay(): number
    {
        return this._delay;
    }

    flush(): boolean
    {
        this._objectId = 0;
        this._isExpired = false;
        this._pickerId = 0;
        this._delay = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        const idStr = wrapper.readString();
        this._objectId = parseInt(idStr, 10);
        this._isExpired = wrapper.readBoolean();
        this._pickerId = wrapper.readInt();
        this._delay = wrapper.readInt();

        return true;
    }
}
