/**
 * HeightMapMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.HeightMapMessageEventParser
 *
 * Parser for room height map data.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class HeightMapMessageParser implements IMessageParser
{
    private _tileHeightMask: number = 16383;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::_data
    private _data: number[] = [];

    private _stackingBlockedMaskBit: number = 16384;

    set stackingBlockedMaskBit(value: number)
    {
        this._stackingBlockedMaskBit = 1 << value;
        this._tileHeightMask = this._stackingBlockedMaskBit - 1;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::_width
    private _width: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::get width()
    get width(): number
    {
        return this._width;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::_height
    private _height: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::get height()
    get height(): number
    {
        return this._height;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::decodeTileHeight()
    static decodeTileHeight(value: number, mask: number): number
    {
        return value === -1 ? -1 : (value & mask) / 256;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::decodeIsStackingBlocked()
    static decodeIsStackingBlocked(value: number, mask: number): boolean
    {
        return Boolean(value & mask);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::decodeIsRoomTile()
    static decodeIsRoomTile(value: number): boolean
    {
        return value !== -1;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::decodeTileHeight()
    decodeTileHeight(value: number): number
    {
        return HeightMapMessageParser.decodeTileHeight(value, this._tileHeightMask);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::decodeIsStackingBlocked()
    decodeIsStackingBlocked(value: number): boolean
    {
        return HeightMapMessageParser.decodeIsStackingBlocked(value, this._stackingBlockedMaskBit);
    }

    getTileHeight(x: number, y: number): number
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height)
        {
            return -1;
        }

        return this.decodeTileHeight(this._data[y * this._width + x]);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::getStackingBlocked()
    getStackingBlocked(x: number, y: number): boolean
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height)
        {
            return true;
        }

        return this.decodeIsStackingBlocked(this._data[y * this._width + x]);
    }

    isRoomTile(x: number, y: number): boolean
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height)
        {
            return false;
        }

        return HeightMapMessageParser.decodeIsRoomTile(this._data[y * this._width + x]);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::flush()
    flush(): boolean
    {
        this._data = [];
        this._width = 0;
        this._height = 0;
        return true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/HeightMapMessageParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._width = wrapper.readInt();
        const total = wrapper.readInt();
        this._height = Math.trunc(total / this._width);
        this._data = new Array(total);

        for(let i = 0; i < total; i++)
        {
            this._data[i] = wrapper.readShort();
        }

        return true;
    }
}
