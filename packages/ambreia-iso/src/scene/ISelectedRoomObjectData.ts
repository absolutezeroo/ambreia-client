import type {IStuffData} from './object/data/IStuffData';

/**
 * Describes the room's currently selected/pending-placement object (which operation is in
 * effect, and enough data to resolve its icon/type) - returned by IRoomEngine.getSelectedObjectData().
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as
 */
export interface ISelectedRoomObjectData
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get id()
    readonly id: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get category()
    readonly category: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get operation()
    readonly operation: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get typeId()
    readonly typeId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get instanceData()
    readonly instanceData: string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get stuffData()
    readonly stuffData: IStuffData | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get state()
    readonly state: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get animFrame()
    readonly animFrame: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/ISelectedRoomObjectData.as::get posture()
    readonly posture: string | null;
}
