/**
 * MapStuffData
 *
 * Based on AS3: com.sulake.habbo.room.object.data.MapStuffData
 *
 * Key-value map based furniture data (format type 1).
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IRoomObjectModel} from '@room/object/IRoomObjectModel';
import type {IRoomObjectModelController} from '@room/object/IRoomObjectModelController';
import {RoomObjectVariableEnum} from '../RoomObjectVariableEnum';
import type {IStuffData} from './IStuffData';
import {StuffDataBase} from './StuffDataBase';

export class MapStuffData extends StuffDataBase implements IStuffData
{
    // AS3: .../src/com/sulake/habbo/room/object/data/MapStuffData.as::FORMAT_KEY
    public static readonly FORMAT_KEY = 1;

    private static readonly STATE_KEY = 'state';
    private static readonly RARITY_KEY = 'rarity';
    private static readonly CONTENTS_COUNT_KEY = 'contents_count';
    private static readonly CHEST_NAME_KEY = 'chest_name';

    private _data: Map<string, string> = new Map();

    constructor(data?: Map<string, string>)
    {
        super();

        if(data)
        {
            this._data = data;
        }
    }

    override get rarityLevel(): number
    {
        const rarity = this._data.get(MapStuffData.RARITY_KEY);

        if(rarity)
        {
            return parseInt(rarity, 10);
        }

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/data/MapStuffData.as::get contentsCount()
    override get contentsCount(): number
    {
        const count = this._data.get(MapStuffData.CONTENTS_COUNT_KEY);

        // AS3 tests the string for truthiness, so "" and "0" both fall through to 0.
        if(count)
        {
            return parseInt(count, 10);
        }

        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/data/MapStuffData.as::get chestName()
    override get chestName(): string
    {
        const name = this._data.get(MapStuffData.CHEST_NAME_KEY);

        // AS3 tests `!= null` here, not truthiness — an explicit "" is returned as "".
        if(name !== undefined)
        {
            return name;
        }

        return '';
    }

    override initializeFromIncomingMessage(wrapper: IMessageDataWrapper): void
    {
        this._data = new Map();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const key = wrapper.readString();
            const value = wrapper.readString();

            this._data.set(key, value);
        }

        super.initializeFromIncomingMessage(wrapper);
    }

    override initializeFromRoomObjectModel(model: IRoomObjectModel): void
    {
        super.initializeFromRoomObjectModel(model);
        this._data = model.getStringToStringMap(RoomObjectVariableEnum.FURNITURE_DATA);
    }

    override writeRoomObjectModel(model: IRoomObjectModelController): void
    {
        super.writeRoomObjectModel(model);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA_FORMAT, MapStuffData.FORMAT_KEY);
        model.setStringToStringMap(RoomObjectVariableEnum.FURNITURE_DATA, this._data);
    }

    override getLegacyString(): string
    {
        const state = this._data.get(MapStuffData.STATE_KEY);

        if(state !== undefined)
        {
            return state;
        }

        return '';
    }

    override compare(_data: IStuffData): boolean
    {
        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/data/MapStuffData.as::getValue()
    getValue(key: string): string | null
    {
        return this._data.get(key) ?? null;
    }
}
