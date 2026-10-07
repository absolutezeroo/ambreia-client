/**
 * RoomEngineEvent
 *
 * Based on AS3: com.sulake.habbo.room.events.RoomEngineEvent
 *
 * Base event for room engine events.
 */
export class RoomEngineEvent
{
    public static readonly REE_INITIALIZED = 'REE_INITIALIZED';
    public static readonly REE_DISPOSED = 'REE_DISPOSED';
    public static readonly REE_ENGINE_INITIALIZED = 'REE_ENGINE_INITIALIZED';
    public static readonly REE_ROOM_ZOOMED = 'REE_ROOM_ZOOMED';
    public static readonly REE_OBJECTS_INITIALIZED = 'REE_OBJECTS_INITIALIZED';
    public static readonly REE_NORMAL_MODE = 'REE_NORMAL_MODE';
    public static readonly REE_GAME_MODE = 'REE_GAME_MODE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::leaveSpectate()
    public static readonly REE_ENTRANCE_AFTER_SPECTATE = 'REE_ENTRANCE_AFTER_SPECTATE';

    constructor(type: string, roomId: number)
    {
        this._type = type;
        this._roomId = roomId;
    }

    private _type: string;

    get type(): string
    {
        return this._type;
    }

    private _roomId: number;

    get roomId(): number
    {
        return this._roomId;
    }
}
