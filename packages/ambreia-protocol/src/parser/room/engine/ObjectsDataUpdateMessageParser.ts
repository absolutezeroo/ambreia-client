/**
 * ObjectsDataUpdateMessageParser — the plural "objects data update" (incoming header 632): a batch of
 * floor-furniture state/stuff-data updates. Unlike the singular ObjectDataUpdate (2329, one object keyed
 * by a String id), this reads a count then, per object, an int id + parsed stuff data (state derived from
 * the legacy string). Sent e.g. when wired effects change multiple furni at once.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2377.as (parser)
 *      sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3191.as (ObjectData)
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IStuffData} from '@ambreia/iso/scene/object/data/IStuffData';
import {FurnitureDataParser} from './FurnitureDataParser';

/**
 * ObjectData — one object's update: furni id, state, and stuff data.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3191.as
 */
export class ObjectData
{
    // AS3: _SafeCls_3191.as::_SafeStr_4872 (name derived from getter id)
    private readonly _id: number;

    // AS3: _SafeCls_3191.as::_SafeStr_4597 (name derived from getter state)
    private readonly _state: number;

    // AS3: _SafeCls_3191.as::_SafeStr_4556 (name derived from getter data)
    private readonly _data: IStuffData;

    // AS3: _SafeCls_3191.as::_SafeCls_3191()
    constructor(id: number, state: number, data: IStuffData)
    {
        this._id = id;
        this._state = state;
        this._data = data;
    }

    // AS3: _SafeCls_3191.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: _SafeCls_3191.as::get state()
    get state(): number
    {
        return this._state;
    }

    // AS3: _SafeCls_3191.as::get data()
    get data(): IStuffData
    {
        return this._data;
    }
}

export class ObjectsDataUpdateMessageParser implements IMessageParser
{
    // AS3: _SafeCls_2377.as::_SafeStr_4940 (the parsed objects)
    private _objects: ObjectData[] = [];

    // AS3: _SafeCls_2377.as::get objectCount()
    get objectCount(): number
    {
        return this._objects.length;
    }

    // AS3: _SafeCls_2377.as::getObjectData()
    getObjectData(index: number): ObjectData | null
    {
        if(index < 0 || index >= this.objectCount)
        {
            return null;
        }

        return this._objects[index];
    }

    // AS3: _SafeCls_2377.as::flush()
    flush(): boolean
    {
        this._objects = [];
        return true;
    }

    // AS3: _SafeCls_2377.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const id = wrapper.readInt();
            const data = FurnitureDataParser.parseStuffData(wrapper);
            let state = 0;
            const legacy = parseFloat(data.getLegacyString());

            if(!isNaN(legacy))
            {
                state = parseInt(data.getLegacyString(), 10);
            }

            this._objects.push(new ObjectData(id, state, data));
        }

        return true;
    }
}
