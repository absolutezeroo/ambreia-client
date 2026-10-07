import type {IVector3d} from '../../utils/IVector3d';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {IPlaneDrawingData} from './IPlaneDrawingData';

/**
 * A room plane as everything outside the visualisation sees it: an id, a corner and two sides, and
 * the colour it is tinted with. `RoomPlane` is the implementation.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/IRoomPlane.as
 */
export interface IRoomPlane
{
    // AS3: .../src/com/sulake/room/object/visualization/IRoomPlane.as::get uniqueId()
    readonly uniqueId: number;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomPlane.as::get location()
    readonly location: IVector3d;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomPlane.as::get leftSide()
    readonly leftSide: IVector3d;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomPlane.as::get rightSide()
    readonly rightSide: IVector3d;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomPlane.as::get color()
    readonly color: number;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomPlane.as::getDrawingDatas()
    getDrawingDatas(geometry: IRoomGeometry): IPlaneDrawingData[];
}
