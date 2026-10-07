/**
 * IRoomGeometry Interface
 *
 * Based on AS3: com.sulake.room.utils.IRoomGeometry
 *
 * Interface for isometric room geometry calculations.
 */
import type {IVector3d} from './IVector3d';

export interface IPoint
{
    x: number;
    y: number;
}

export interface IRoomGeometry
{
    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::get scale()
    readonly scale: number;
    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::get directionAxis()
    readonly directionAxis: IVector3d;
    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::get direction()
    readonly direction: IVector3d;
    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::get updateId()
    readonly updateId: number;

    z_scale: number;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::getCoordinatePosition()
    getCoordinatePosition(vector: IVector3d): IVector3d | null;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::getScreenPoint()
    getScreenPoint(vector: IVector3d): IPoint | null;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::getScreenPosition()
    getScreenPosition(vector: IVector3d): IVector3d | null;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::getPlanePosition()
    getPlanePosition(point: IPoint, loc: IVector3d, leftSide: IVector3d, rightSide: IVector3d): IPoint | null;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::setDisplacement()
    setDisplacement(location: IVector3d, displacement: IVector3d): void;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::adjustLocation()
    adjustLocation(location: IVector3d, z: number): void;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::performZoom()
    performZoom(): void;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::performZoomOut()
    performZoomOut(): void;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::performZoomIn()
    performZoomIn(): void;

    // AS3: .../src/com/sulake/room/utils/IRoomGeometry.as::isZoomedIn()
    isZoomedIn(): boolean;
}
