import type {IVector3d} from '../../utils/IVector3d';
import type {RoomPlaneParser} from '../object/RoomPlaneParser';

/**
 * One room's initialization data, held until the room engine is ready to build it.
 *
 * `RoomEngine.initializeRoom()` is routinely called before `RoomManager` finishes loading its
 * placeholder object content — the room previewer inside a window built at DI time does exactly
 * that. AS3 does not fail there: it parks the data in `RoomEngine._roomDatas` and replays it from
 * `roomManagerInitialized()`. The same object is also where `updateObjectRoom()` buffers a
 * floor/wall/landscape push that arrives before the room object exists, which is why the three
 * types are settable rather than constructor arguments.
 *
 * The class name comes from `PRODUCTION-201601012205-226667486` (obfuscated to `_SafeCls_1852` in
 * the primary tree, which is where the member names are readable — PRODUCTION obfuscates those and
 * predates `cameraInitPosition` entirely).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as
 */
export class RoomData
{
    // Every field in _SafeCls_1852 is obfuscated; its accessors are not. Each name below is
    // therefore derived from the accessor that returns the field, read from the accessor's body
    // rather than inferred from declaration order.
    //
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::_SafeStr_6722
    // (name derived from its accessor `get roomId()`)
    private _roomId: number;

    /**
     * AS3 holds the room XML here and re-passes it to `initializeRoom()`. This port passes a
     * parsed `RoomPlaneParser` in that argument's place, so that is what is parked.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::_SafeStr_4556
    // (name derived from its accessor `get data()`)
    private _data: RoomPlaneParser | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::_SafeStr_7517
    // (name derived from its accessor `get floorType()`)
    private _floorType: string | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::_SafeStr_8099
    // (name derived from its accessor `get wallType()`)
    private _wallType: string | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::_SafeStr_7601
    // (name derived from its accessor `get landscapeType()`)
    private _landscapeType: string | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::_SafeStr_9922
    // (name derived from its accessor `get cameraInitPosition()`)
    private _cameraInitPosition: IVector3d | null = null;

    /**
     * The door, which AS3 does not carry here.
     *
     * AS3 reads it back out of the parked room XML when it replays the call; this port takes it as
     * four separate `initializeRoom()` arguments instead, so replaying the same call means parking
     * them too. Null when the caller passed none, exactly as an absent argument.
     */
    // TS-only: AS3's `data` XML carries the door; this port's `initializeRoom()` signature does not.
    private _doorX: number | null = null;

    // TS-only: see `_doorX`.
    private _doorY: number | null = null;

    // TS-only: see `_doorX`.
    private _doorZ: number | null = null;

    // TS-only: see `_doorX`.
    private _doorDir: number | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::_SafeCls_1852()
    constructor(roomId: number, data: RoomPlaneParser | null)
    {
        this._roomId = roomId;
        this._data = data;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::get roomId()
    get roomId(): number
    {
        return this._roomId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::get data()
    get data(): RoomPlaneParser | null
    {
        return this._data;
    }

    // TS-only: AS3's `data` is set once by the constructor, because the XML it parks is the whole
    // argument. Here a later `initializeRoom()` can bring the plane parser a `updateObjectRoom()`
    // buffer was created without — see `RoomEngine.initializeRoom()`.
    set data(data: RoomPlaneParser | null)
    {
        this._data = data;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::get floorType()
    get floorType(): string | null
    {
        return this._floorType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::set floorType()
    set floorType(floorType: string | null)
    {
        this._floorType = floorType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::get wallType()
    get wallType(): string | null
    {
        return this._wallType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::set wallType()
    set wallType(wallType: string | null)
    {
        this._wallType = wallType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::get landscapeType()
    get landscapeType(): string | null
    {
        return this._landscapeType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::set landscapeType()
    set landscapeType(landscapeType: string | null)
    {
        this._landscapeType = landscapeType;
    }

    /**
     * Where the server asked the camera to start, parked with the rest of the room until the
     * engine is ready to build it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::get cameraInitPosition()
    get cameraInitPosition(): IVector3d | null
    {
        return this._cameraInitPosition;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_1852.as::set cameraInitPosition()
    set cameraInitPosition(cameraInitPosition: IVector3d | null)
    {
        this._cameraInitPosition = cameraInitPosition;
    }

    // TS-only: see `_doorX`.
    get doorX(): number | null
    {
        return this._doorX;
    }

    // TS-only: see `_doorX`.
    get doorY(): number | null
    {
        return this._doorY;
    }

    // TS-only: see `_doorX`.
    get doorZ(): number | null
    {
        return this._doorZ;
    }

    // TS-only: see `_doorX`.
    get doorDir(): number | null
    {
        return this._doorDir;
    }

    // TS-only: see `_doorX`. Set as a group because the four are one argument list, and a partial
    // replay would place the door somewhere the server never said.
    setDoor(x?: number, y?: number, z?: number, dir?: number): void
    {
        this._doorX = x ?? null;
        this._doorY = y ?? null;
        this._doorZ = z ?? null;
        this._doorDir = dir ?? null;
    }
}
