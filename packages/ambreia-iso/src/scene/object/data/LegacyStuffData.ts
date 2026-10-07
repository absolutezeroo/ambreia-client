/**
 * LegacyStuffData
 *
 * Based on AS3: com.sulake.habbo.room.object.data.LegacyStuffData
 *
 * Simple string-based furniture data (format type 0).
 */
import type {IStuffDataReader} from './IStuffDataReader';
import type {IRoomObjectModel} from '../../../object/IRoomObjectModel';
import type {IRoomObjectModelController} from '../../../object/IRoomObjectModelController';
import {RoomObjectVariableEnum} from '../RoomObjectVariableEnum';
import type {IStuffData} from './IStuffData';
import {StuffDataBase} from './StuffDataBase';

export class LegacyStuffData extends StuffDataBase implements IStuffData
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/LegacyStuffData.as::FORMAT_KEY
    public static readonly FORMAT_KEY = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/LegacyStuffData.as::_data
    private _data: string = '';

    override initializeFromIncomingMessage(wrapper: IStuffDataReader): void
    {
        this._data = wrapper.readString();
        super.initializeFromIncomingMessage(wrapper);
    }

    override initializeFromRoomObjectModel(model: IRoomObjectModel): void
    {
        super.initializeFromRoomObjectModel(model);
        this._data = model.getString(RoomObjectVariableEnum.FURNITURE_DATA);
    }

    override writeRoomObjectModel(model: IRoomObjectModelController): void
    {
        super.writeRoomObjectModel(model);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA_FORMAT, LegacyStuffData.FORMAT_KEY);
        model.setString(RoomObjectVariableEnum.FURNITURE_DATA, this._data);
    }

    override getLegacyString(): string
    {
        return this._data;
    }

    override compare(data: IStuffData): boolean
    {
        return this._data === data.getLegacyString();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/LegacyStuffData.as::setString()
    setString(value: string): void
    {
        this._data = value;
    }
}
