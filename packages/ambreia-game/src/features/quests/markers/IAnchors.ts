/** Where above a room object to draw (RoomEngine.getRpgAnchor()): false when it is not on screen. */
export interface IAnchors
{
    getRpgAnchor(objectId: number, out: {x: number; y: number}): boolean;
}
