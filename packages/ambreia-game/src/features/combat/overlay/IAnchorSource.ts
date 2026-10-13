/** What the overlay needs of the room: where above an object to draw (RoomEngine.getRpgAnchor()). */
export interface IAnchorSource
{
    getRpgAnchor(objectId: number, out: {x: number; y: number}): boolean;
}
