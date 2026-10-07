/**
 * RoomEntryTileMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.layout.RoomEntryTileMessageEventParser
 *
 * Parser for room entry tile position (where users spawn).
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class RoomEntryTileMessageParser implements IMessageParser
{
    private _x: number = 0;

    get x(): number
    {
        return this._x;
    }

    private _y: number = 0;

    get y(): number
    {
        return this._y;
    }

    private _dir: number = 0;

    get dir(): number
    {
        return this._dir;
    }

    flush(): boolean
    {
        this._x = 0;
        this._y = 0;
        this._dir = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._x = wrapper.readInt();
        this._y = wrapper.readInt();
        this._dir = wrapper.readInt();
        return true;
    }
}
