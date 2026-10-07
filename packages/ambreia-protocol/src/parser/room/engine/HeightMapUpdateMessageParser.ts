/**
 * HeightMapUpdateMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.HeightMapUpdateMessageEventParser
 *
 * Parser for height map tile updates (single tiles).
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class HeightMapUpdateMessageParser implements IMessageParser
{
    private _wrapper: IMessageDataWrapper | null = null;
    private _count: number = 0;
    private _value: number = 0;
    private _stackingHeightMask: number = 16383;

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

    private _stackingBlockedMaskBit: number = 16384;

    set stackingBlockedMaskBit(value: number)
    {
        this._stackingBlockedMaskBit = 1 << value;
        this._stackingHeightMask = this._stackingBlockedMaskBit - 1;
    }

    get tileHeight(): number
    {
        return HeightMapUpdateMessageParser.decodeTileHeight(this._value, this._stackingHeightMask);
    }

    get isStackingBlocked(): boolean
    {
        return HeightMapUpdateMessageParser.decodeIsStackingBlocked(this._value, this._stackingBlockedMaskBit);
    }

    get isRoomTile(): boolean
    {
        return HeightMapUpdateMessageParser.decodeIsRoomTile(this._value);
    }

    static decodeTileHeight(value: number, mask: number): number
    {
        if(value < 0)
        {
            return -1;
        }
        return (value & mask) / 256;
    }

    static decodeIsStackingBlocked(value: number, maskBit: number): boolean
    {
        return (value & maskBit) !== 0;
    }

    static decodeIsRoomTile(value: number): boolean
    {
        return value >= 0;
    }

    /**
	 * Move to next tile in the update batch.
	 * Returns false when no more tiles.
	 */
    next(): boolean
    {
        if(this._count === 0 || this._wrapper === null)
        {
            return false;
        }

        this._count--;
        this._x = this._wrapper.readByte();
        this._y = this._wrapper.readByte();
        this._value = this._wrapper.readShort();

        return true;
    }

    flush(): boolean
    {
        this._count = 0;
        this._wrapper = null;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._wrapper = wrapper;
        this._count = wrapper.readByte();

        return true;
    }
}
