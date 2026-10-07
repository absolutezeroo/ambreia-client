/**
 * StuffDataBase
 *
 * Based on AS3: com.sulake.habbo.room.object.data.StuffDataBase
 *
 * Base class for furniture data implementations.
 */
import type {IStuffDataReader} from './IStuffDataReader';
import type {IRoomObjectModel} from '../../../object/IRoomObjectModel';
import type {IRoomObjectModelController} from '../../../object/IRoomObjectModelController';
import {RoomObjectVariableEnum} from '../RoomObjectVariableEnum';
import type {IStuffData} from './IStuffData';

export abstract class StuffDataBase implements IStuffData
{
    protected static readonly UNIQUE_SERIAL_FLAG = 256;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::_flags
    private _flags: number = 0;

    get flags(): number
    {
        return this._flags;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::set flags()
    set flags(value: number)
    {
        this._flags = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::_uniqueSerialNumber
    private _uniqueSerialNumber: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::get uniqueSerialNumber()
    get uniqueSerialNumber(): number
    {
        return this._uniqueSerialNumber;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::set uniqueSerialNumber()
    set uniqueSerialNumber(value: number)
    {
        this._uniqueSerialNumber = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::_uniqueSeriesSize
    private _uniqueSeriesSize: number = 0;

    get uniqueSeriesSize(): number
    {
        return this._uniqueSeriesSize;
    }

    set uniqueSeriesSize(value: number)
    {
        this._uniqueSeriesSize = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::get rarityLevel()
    get rarityLevel(): number
    {
        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/data/_SafeCls_1944.as::get contentsCount()
    get contentsCount(): number
    {
        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/data/_SafeCls_1944.as::get chestName()
    get chestName(): string
    {
        return '';
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::get state()
    get state(): number
    {
        const value = Number(this.getLegacyString());

        return isNaN(value) ? -1 : Math.floor(value);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::initializeFromIncomingMessage()
    initializeFromIncomingMessage(wrapper: IStuffDataReader): void
    {
        if((this._flags & StuffDataBase.UNIQUE_SERIAL_FLAG) > 0)
        {
            this._uniqueSerialNumber = wrapper.readInt();
            this._uniqueSeriesSize = wrapper.readInt();
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::initializeFromRoomObjectModel()
    initializeFromRoomObjectModel(model: IRoomObjectModel): void
    {
        this._uniqueSerialNumber = model.getNumber(RoomObjectVariableEnum.FURNITURE_UNIQUE_SERIAL_NUMBER);
        this._uniqueSeriesSize = model.getNumber(RoomObjectVariableEnum.FURNITURE_UNIQUE_EDITION_SIZE);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::writeRoomObjectModel()
    writeRoomObjectModel(model: IRoomObjectModelController): void
    {
        model.setNumber(RoomObjectVariableEnum.FURNITURE_UNIQUE_SERIAL_NUMBER, this._uniqueSerialNumber);
        model.setNumber(RoomObjectVariableEnum.FURNITURE_UNIQUE_EDITION_SIZE, this._uniqueSeriesSize);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::getLegacyString()
    getLegacyString(): string
    {
        return '';
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::compare()
    compare(_data: IStuffData): boolean
    {
        return false;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/data/StuffDataBase.as::getJSONValue()
    getJSONValue(key: string): string
    {
        try
        {
            const json = JSON.parse(this.getLegacyString());

            return String(json[key] ?? '');
        }
        catch
        {
            return '';
        }
    }
}
