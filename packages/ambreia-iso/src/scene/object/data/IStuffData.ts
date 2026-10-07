/**
 * IStuffData Interface
 *
 * Based on AS3: com.sulake.habbo.room.IStuffData
 *
 * Interface for furniture data storage.
 */
import type {IStuffDataReader} from './IStuffDataReader';
import type {IRoomObjectModel} from '../../../object/IRoomObjectModel';
import type {IRoomObjectModelController} from '../../../object/IRoomObjectModelController';

export interface IStuffData
{
    flags: number;
    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::get uniqueSerialNumber()
    uniqueSerialNumber: number;
    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::get uniqueSeriesSize()
    uniqueSeriesSize: number;
    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::get rarityLevel()
    readonly rarityLevel: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IStuffData.as::get contentsCount()
    readonly contentsCount: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IStuffData.as::get chestName()
    readonly chestName: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IStuffData.as::get state()
    readonly state: number;

    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::initializeFromIncomingMessage()
    initializeFromIncomingMessage(wrapper: IStuffDataReader): void;

    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::initializeFromRoomObjectModel()
    initializeFromRoomObjectModel(model: IRoomObjectModel): void;

    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::writeRoomObjectModel()
    writeRoomObjectModel(model: IRoomObjectModelController): void;

    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::getLegacyString()
    getLegacyString(): string;

    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::getJSONValue()
    getJSONValue(key: string): string;

    // AS3: .../src/com/sulake/habbo/room/IStuffData.as::compare()
    compare(data: IStuffData): boolean;
}
