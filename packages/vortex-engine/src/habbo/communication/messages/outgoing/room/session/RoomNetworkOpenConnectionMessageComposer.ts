import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Open a room connection via network (for room forwarding).
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/roomdirectory/RoomNetworkOpenConnectionMessageComposer.as
 */
export class RoomNetworkOpenConnectionMessageComposer extends MessageComposer<[number, number]>
{
    private _data: [number, number];

    constructor(roomId: number, homeRoomId: number)
    {
        super();
        this._data = [roomId, homeRoomId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/roomdirectory/RoomNetworkOpenConnectionMessageComposer.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return this._data;
    }
}
