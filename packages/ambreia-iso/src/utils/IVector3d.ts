/**
 * IVector3d Interface
 *
 * Based on AS3: com.sulake.room.utils.IVector3d
 *
 * Read-only interface for a 3D vector.
 */
export interface IVector3d
{
    // AS3: .../src/com/sulake/room/utils/IVector3d.as::get x()
    readonly x: number;
    // AS3: .../src/com/sulake/room/utils/IVector3d.as::get y()
    readonly y: number;
    // AS3: .../src/com/sulake/room/utils/IVector3d.as::get z()
    readonly z: number;
    // AS3: .../src/com/sulake/room/utils/IVector3d.as::get length()
    readonly length: number;
}
