/**
 * SelectedRoomObjectData
 *
 * @see source_as_flash/com/sulake/habbo/room/utils/SelectedRoomObjectData.as
 *
 * Read-only data container for the currently selected room object state.
 * Used when moving/placing furniture to track the object being manipulated.
 */
import {Vector3d} from '../../utils/Vector3d';
import type {IVector3d} from '../../utils/IVector3d';
import type {IStuffData} from '../object/data/IStuffData';

export class SelectedRoomObjectData
{
    /**
	 * `operation`, `loc` and `dir` are nullable because AS3's constructor is called that way:
	 * `placeObject()` builds a record of what was just dropped with all three null. `Vector3d
	 * .assign(null)` is already a no-op, and the null operation is stored as the empty string the
	 * AS3 field is initialised to — no consumer distinguishes the two, they all compare against
	 * OBJECT_MOVE / OBJECT_PLACE.
	 */
    constructor(
        id: number,
        category: number,
        operation: string | null,
        loc: IVector3d | null,
        dir: IVector3d | null,
        typeId: number = 0,
        instanceData: string | null = null,
        stuffData: IStuffData | null = null,
        state: number = -1,
        animFrame: number = -1,
        posture: string | null = null
    )
    {
        this._id = id;
        this._category = category;
        this._operation = operation ?? '';
        this._loc = new Vector3d();
        this._loc.assign(loc);
        this._dir = new Vector3d();
        this._dir.assign(dir);
        this._typeId = typeId;
        this._instanceData = instanceData;
        this._stuffData = stuffData;
        this._state = state;
        this._animFrame = animFrame;
        this._posture = posture;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_id
    private _id: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_category
    private _category: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get category()
    get category(): number
    {
        return this._category;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_operation
    private _operation: string;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get operation()
    get operation(): string
    {
        return this._operation;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_loc
    private _loc: Vector3d | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get loc()
    get loc(): Vector3d | null
    {
        return this._loc;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_dir
    private _dir: Vector3d | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get dir()
    get dir(): Vector3d | null
    {
        return this._dir;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_typeId
    private _typeId: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get typeId()
    get typeId(): number
    {
        return this._typeId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_instanceData
    private _instanceData: string | null;

    get instanceData(): string | null
    {
        return this._instanceData;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_stuffData
    private _stuffData: IStuffData | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get stuffData()
    get stuffData(): IStuffData | null
    {
        return this._stuffData;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_state
    private _state: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get state()
    get state(): number
    {
        return this._state;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_animFrame
    private _animFrame: number;

    get animFrame(): number
    {
        return this._animFrame;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::_posture
    private _posture: string | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::get posture()
    get posture(): string | null
    {
        return this._posture;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/SelectedRoomObjectData.as::dispose()
    dispose(): void
    {
        this._loc = null;
        this._dir = null;
    }
}
