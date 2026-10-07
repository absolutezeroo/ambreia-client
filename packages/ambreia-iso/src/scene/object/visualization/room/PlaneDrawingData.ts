/**
 * PlaneDrawingData
 *
 * @see com.sulake.habbo.room.object.visualization.room.PlaneDrawingData
 *
 * Data object for plane drawing info - stores corner points, mask references,
 * color, z-depth, and asset columns.
 */
export class PlaneDrawingData
{
    private _bottomAligned: boolean;

    constructor(source: PlaneDrawingData | null = null, color: number = 0, bottomAligned: boolean = false)
    {
        this._assetNameColumns = [];

        if(source !== null)
        {
            this._maskAssetNames = [...source._maskAssetNames];
            this._maskAssetLocations = [...source._maskAssetLocations];
            this._maskAssetFlipHs = [...source._maskAssetFlipHs];
            this._maskAssetFlipVs = [...source._maskAssetFlipVs];
        }
        else
        {
            this._maskAssetNames = [];
            this._maskAssetLocations = [];
            this._maskAssetFlipHs = [];
            this._maskAssetFlipVs = [];
        }

        this._color = color;
        this._bottomAligned = bottomAligned;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::_z
    private _z: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::get z()
    get z(): number
    {
        return this._z;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::set z()
    set z(value: number)
    {
        this._z = value;
    }

    private _cornerPoints: { x: number; y: number }[] | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::get cornerPoints()
    get cornerPoints(): { x: number; y: number }[] | null
    {
        return this._cornerPoints;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::set cornerPoints()
    set cornerPoints(value: { x: number; y: number }[] | null)
    {
        this._cornerPoints = value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::_maskAssetNames
    private _maskAssetNames: string[];

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::get maskAssetNames()
    get maskAssetNames(): string[]
    {
        return this._maskAssetNames;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::_maskAssetLocations
    private _maskAssetLocations: { x: number; y: number }[];

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::get maskAssetLocations()
    get maskAssetLocations(): { x: number; y: number }[]
    {
        return this._maskAssetLocations;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::_maskAssetFlipHs
    private _maskAssetFlipHs: boolean[];

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::get maskAssetFlipHs()
    get maskAssetFlipHs(): boolean[]
    {
        return this._maskAssetFlipHs;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::_maskAssetFlipVs
    private _maskAssetFlipVs: boolean[];

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::get maskAssetFlipVs()
    get maskAssetFlipVs(): boolean[]
    {
        return this._maskAssetFlipVs;
    }

    private _assetNameColumns: string[][];

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::get assetNameColumns()
    get assetNameColumns(): string[][]
    {
        return this._assetNameColumns;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::_color
    private _color: number;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::get color()
    get color(): number
    {
        return this._color;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::addMask()
    addMask(name: string, location: { x: number; y: number }, flipH: boolean, flipV: boolean): void
    {
        this._maskAssetNames.push(name);
        this._maskAssetLocations.push(location);
        this._maskAssetFlipHs.push(flipH);
        this._maskAssetFlipVs.push(flipV);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::addAssetColumn()
    addAssetColumn(column: string[]): void
    {
        this._assetNameColumns.push(column);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/PlaneDrawingData.as::isBottomAligned()
    isBottomAligned(): boolean
    {
        return this._bottomAligned;
    }
}
