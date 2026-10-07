export class RoomId 
{
    // AS3: .../src/com/sulake/room/utils/RoomId.as::PREVIEW_ROOM_ID_BASE
    private static readonly PREVIEW_ROOM_ID_BASE = 2_147_418_112;

    // AS3: .../src/com/sulake/room/utils/RoomId.as::makeRoomPreviewerId()
    public static makeRoomPreviewerId(id: number): number
    {
        return (id & 0xFFFF) + this.PREVIEW_ROOM_ID_BASE;
    }

    // AS3: .../src/com/sulake/room/utils/RoomId.as::isRoomPreviewerId()
    public static isRoomPreviewerId(id: number): boolean
    {
        return id >= this.PREVIEW_ROOM_ID_BASE;
    }
}