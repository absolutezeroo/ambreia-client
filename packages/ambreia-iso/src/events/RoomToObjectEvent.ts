/**
 * RoomToObjectEvent
 *
 * @see source_as_win63/room/events/RoomToObjectEvent.as
 *
 * Base event for room-to-object communication.
 */
export class RoomToObjectEvent
{
    constructor(type: string)
    {
        this._type = type;
    }

    private _type: string;

    get type(): string
    {
        return this._type;
    }
}
