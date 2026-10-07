/**
 * StringArrayStuffData
 *
 * Based on AS3: com.sulake.habbo.room.object.data.StringArrayStuffData
 *
 * String array based furniture data (format type 2).
 */
import type {IStuffDataReader} from './IStuffDataReader';
import type {IRoomObjectModel} from '../../../object/IRoomObjectModel';
import type {IRoomObjectModelController} from '../../../object/IRoomObjectModelController';
import {RoomObjectVariableEnum} from '../RoomObjectVariableEnum';
import type {IStuffData} from './IStuffData';
import {StuffDataBase} from './StuffDataBase';

export class StringArrayStuffData extends StuffDataBase implements IStuffData
{
    // AS3: .../src/com/sulake/habbo/room/object/data/StringArrayStuffData.as::FORMAT_KEY
    public static readonly FORMAT_KEY = 2;

    private _data: string[] = [];

    get length(): number
    {
        return this._data.length;
    }

    override initializeFromIncomingMessage(wrapper: IStuffDataReader): void
    {
        this._data = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._data.push(wrapper.readString());
        }

        super.initializeFromIncomingMessage(wrapper);
    }

    override initializeFromRoomObjectModel(model: IRoomObjectModel): void
    {
        super.initializeFromRoomObjectModel(model);

        const data = model.getStringArray(RoomObjectVariableEnum.FURNITURE_DATA);
        this._data = data ? [...data] : [];
    }

    override writeRoomObjectModel(model: IRoomObjectModelController): void
    {
        super.writeRoomObjectModel(model);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA_FORMAT, StringArrayStuffData.FORMAT_KEY);
        model.setStringArray(RoomObjectVariableEnum.FURNITURE_DATA, this._data);
    }

    override getLegacyString(): string
    {
        if(this._data.length > 0)
        {
            return this._data[0];
        }

        return '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/data/StringArrayStuffData.as::compare()
    override compare(data: IStuffData): boolean
    {
        // AS3 casts to the same type (else false), then compares every element
        // *except* index 0 (`if(_loc3_ != 0)`). The old body did the exact opposite —
        // it compared only index 0 via getLegacyString() — so inventory stacks grouped
        // on the wrong field.
        if(!(data instanceof StringArrayStuffData))
        {
            return false;
        }

        for(let index = 0; index < this._data.length; index++)
        {
            if(index !== 0 && this._data[index] !== data.getValue(index))
            {
                return false;
            }
        }

        return true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/data/StringArrayStuffData.as::getValue()
    getValue(index: number): string
    {
        if(index >= 0 && index < this._data.length)
        {
            return this._data[index];
        }

        return '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/data/StringArrayStuffData.as::setArray()
    setArray(data: string[]): void
    {
        this._data = data;
    }
}
