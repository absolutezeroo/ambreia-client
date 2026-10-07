/**
 * FloorHeightMapMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.FloorHeightMapMessageEventParser
 *
 * Parser for room floor height map (tile layout).
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {AreaHideMessageData} from './AreaHideMessageData';

export class FloorHeightMapMessageParser implements IMessageParser
{
    private static readonly TILE_BLOCKED = -110;

    private _tiles: number[][] = [];
    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::_width
    private _width: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get width()
    get width(): number
    {
        return this._width;
    }

    private _height: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get height()
    get height(): number
    {
        return this._height;
    }

    private _scale: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get scale()
    get scale(): number
    {
        return this._scale;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::_text
    private _text: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get text()
    get text(): string
    {
        return this._text;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::_fixedWallsHeight
    private _fixedWallsHeight: number = -1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get fixedWallsHeight()
    get fixedWallsHeight(): number
    {
        return this._fixedWallsHeight;
    }

    private _areaHideData: AreaHideMessageData[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get areaHideData()
    get areaHideData(): AreaHideMessageData[]
    {
        return this._areaHideData;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get cameraInitX()
    private _cameraInitX: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get cameraInitX()
    get cameraInitX(): number
    {
        return this._cameraInitX;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get cameraInitY()
    private _cameraInitY: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get cameraInitY()
    get cameraInitY(): number
    {
        return this._cameraInitY;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get cameraInitZ()
    private _cameraInitZ: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::get cameraInitZ()
    get cameraInitZ(): number
    {
        return this._cameraInitZ;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::getTileHeight()
    getTileHeight(x: number, y: number): number
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height)
        {
            return FloorHeightMapMessageParser.TILE_BLOCKED;
        }

        const row = this._tiles[y];

        return row[x];
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::flush()
    flush(): boolean
    {
        this._tiles = [];
        this._width = 0;
        this._height = 0;
        this._text = '';
        this._fixedWallsHeight = -1;
        this._areaHideData = [];
        this._cameraInitX = 0;
        this._cameraInitY = 0;
        this._cameraInitZ = 0;

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        const isSmallScale = wrapper.readBoolean();
        this._fixedWallsHeight = wrapper.readInt();
        this._text = wrapper.readString();

        // Split and filter empty trailing row
        const rows = this._text.split('\r').filter((row, i, arr) =>
            !(i === arr.length - 1 && row === '')
        );

        const rowCount = rows.length;
        const maxWidth = Math.max(0, ...rows.map(row => row.length));

        this._width = maxWidth;
        this._height = rowCount;
        this._scale = isSmallScale ? 32 : 64;

        // Parse tiles in single pass: map each row string to number array
        const blocked = FloorHeightMapMessageParser.TILE_BLOCKED;

        this._tiles = rows.map(rowStr =>
        {
            const row = new Array<number>(maxWidth).fill(blocked);

            for(let x = 0; x < rowStr.length; x++)
            {
                const char = rowStr.charAt(x);
                row[x] = (char === 'x' || char === 'X') ? blocked : parseInt(char, 36);
            }

            return row;
        });

        // Parse area hide data
        const areaHideCount = wrapper.readInt();

        this._areaHideData = Array.from(
            {length: areaHideCount},
            () => new AreaHideMessageData(wrapper)
        );

        // AS3: sources/win63_version/habbo/communication/messages/parser/room/engine/FloorHeightMapMessageEventParser.as::parse()
        this._cameraInitX = wrapper.readInt();
        this._cameraInitY = wrapper.readInt();
        this._cameraInitZ = wrapper.readFloat();

        return true;
    }
}
