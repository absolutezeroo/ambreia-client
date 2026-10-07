/**
 * The room-plane data the camera serializes into the render-room payload.
 *
 * The interface is obfuscated in both WIN63 trees (`_SafeCls_2550` in the primary,
 * `class_2507` in the secondary); the name here is the real one, recovered from
 * `sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/visualization/IPlaneDrawingData.as`,
 * whose member names are in turn obfuscated and come from the WIN63 side. Neither tree alone
 * gives both halves.
 *
 * `cornerPoints` is `{x, y}[] | null` rather than AS3's non-null `Vector.<Point>` because that is
 * what the port's `PlaneDrawingData` already exposes; narrowing it here would make the existing
 * implementation stop type-checking against its own interface.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/_SafeCls_2550.as
 */
export interface IPlaneDrawingData
{
    // AS3: .../room/object/visualization/_SafeCls_2550.as::get z()
    z: number;

    // AS3: .../room/object/visualization/_SafeCls_2550.as::get cornerPoints()
    cornerPoints: { x: number; y: number }[] | null;

    // AS3: .../room/object/visualization/_SafeCls_2550.as::get color()
    readonly color: number;

    // AS3: .../room/object/visualization/_SafeCls_2550.as::get maskAssetNames()
    readonly maskAssetNames: string[];

    // AS3: .../room/object/visualization/_SafeCls_2550.as::get maskAssetLocations()
    readonly maskAssetLocations: { x: number; y: number }[];

    // AS3: .../room/object/visualization/_SafeCls_2550.as::get maskAssetFlipHs()
    readonly maskAssetFlipHs: boolean[];

    // AS3: .../room/object/visualization/_SafeCls_2550.as::get maskAssetFlipVs()
    readonly maskAssetFlipVs: boolean[];

    // AS3: .../room/object/visualization/_SafeCls_2550.as::get assetNameColumns()
    readonly assetNameColumns: string[][];

    // AS3: .../room/object/visualization/_SafeCls_2550.as::isBottomAligned()
    isBottomAligned(): boolean;
}
