import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Sends a walk-to-tile request to the server.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/engine/MoveAvatarMessageComposer.as
 */
export class MoveAvatarMessageComposer extends MessageComposer<[number, number, number]>
{
    // TS-only: no AS3 counterpart - the AS3 composer builds its array inline in getMessageArray()
    //   and stores nothing.
    private _data: [number, number, number];

    // DEVIATION: AS3 sends (x, y) only. That was enough while a tile held one surface; with the
    //   server's 3D height map it no longer is - the floor under a platform and the platform's top
    //   are the same (x, y), so "walk up onto it" and "walk down under it" arrived identical and
    //   the server had to guess, which it did by always taking the highest reachable surface. A
    //   third field carries the altitude actually clicked. Hundredths of a tile height, because
    //   that is the unit RoomPathingSystem already keys altitudes by (ZKeyOf). The server reads it
    //   only if present, so a two-int sender still parses.
    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/MoveAvatarMessageComposer.as::MoveAvatarMessageComposer()
    constructor(x: number, y: number, z: number)
    {
        super();
        this._data = [x, y, Math.round(z * 100)];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/MoveAvatarMessageComposer.as::getMessageArray()
    getMessageArray(): [number, number, number]
    {
        return this._data;
    }
}
