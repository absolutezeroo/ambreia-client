/**
 * One area-hide rectangle: the furni that owns it, whether it is on, and the tile rectangle it
 * covers. `invert` flips the sense — hide everything *outside* the rectangle instead of inside it.
 *
 * `AreaHideMessageData` is the implementation; the room engine reads areas through this shape.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IAreaHideInfo.as
 */
export interface IAreaHideInfo
{
    // AS3: .../src/com/sulake/habbo/room/IAreaHideInfo.as::get furniId()
    readonly furniId: number;

    // AS3: .../src/com/sulake/habbo/room/IAreaHideInfo.as::get on()
    readonly on: boolean;

    // AS3: .../src/com/sulake/habbo/room/IAreaHideInfo.as::get rootX()
    readonly rootX: number;

    // AS3: .../src/com/sulake/habbo/room/IAreaHideInfo.as::get rootY()
    readonly rootY: number;

    // AS3: .../src/com/sulake/habbo/room/IAreaHideInfo.as::get width()
    readonly width: number;

    // AS3: .../src/com/sulake/habbo/room/IAreaHideInfo.as::get length()
    readonly length: number;

    // AS3: .../src/com/sulake/habbo/room/IAreaHideInfo.as::get invert()
    readonly invert: boolean;
}
