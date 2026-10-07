/**
 * RoomPlaneBitmapMaskData
 *
 * @see source_as_win63/habbo/room/object/RoomPlaneBitmapMaskData.as
 *
 * Data container for a bitmap mask applied to a room plane (door, window).
 */
import type {IVector3d} from '../../utils/IVector3d';
import {Vector3d} from '../../utils/Vector3d';

export class RoomPlaneBitmapMaskData
{
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::MASK_CATEGORY_WINDOW
    public static readonly MASK_CATEGORY_WINDOW = 'window';
    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::MASK_CATEGORY_HOLE
    public static readonly MASK_CATEGORY_HOLE = 'hole';

    constructor(type: string, location: IVector3d, category: string)
    {
        this._type = type;
        this._category = category;
        this._loc = new Vector3d();
        this._loc.assign(location);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::_type
    private _type: string;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::set type()
    set type(value: string)
    {
        this._type = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::_loc
    private _loc: Vector3d | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::get loc()
    get loc(): IVector3d | null
    {
        return this._loc;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::set loc()
    set loc(value: IVector3d)
    {
        if(this._loc === null)
        {
            this._loc = new Vector3d();
        }
        this._loc.assign(value);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::_category
    private _category: string;

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::get category()
    get category(): string
    {
        return this._category;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::set category()
    set category(value: string)
    {
        this._category = value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomPlaneBitmapMaskData.as::dispose()
    dispose(): void
    {
        this._loc = null;
    }
}
