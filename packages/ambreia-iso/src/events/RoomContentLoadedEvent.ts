/**
 * RoomContentLoadedEvent
 *
 * Dispatched when room content (furniture, placeholders, etc.) finishes loading.
 *
 * @see sources/win63_version/room/events/RoomContentLoadedEvent.as
 */
export class RoomContentLoadedEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/events/RoomContentLoadedEvent.as::CONTENT_LOAD_SUCCESS
    public static readonly CONTENT_LOAD_SUCCESS = 'RCLE_SUCCESS';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/events/RoomContentLoadedEvent.as::CONTENT_LOAD_FAILURE
    public static readonly CONTENT_LOAD_FAILURE = 'RCLE_FAILURE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/events/RoomContentLoadedEvent.as::CONTENT_LOAD_CANCEL
    public static readonly CONTENT_LOAD_CANCEL = 'RCLE_CANCEL';

    private _contentType: string;

    constructor(contentType: string)
    {
        this._contentType = contentType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/events/RoomContentLoadedEvent.as::get contentType()
    get contentType(): string
    {
        return this._contentType;
    }
}
