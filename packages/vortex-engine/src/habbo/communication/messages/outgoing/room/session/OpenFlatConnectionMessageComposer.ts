import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Opens a flat (room) connection to enter a room
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.session.OpenFlatConnectionMessageComposer
 *
 * This message initiates the room entry sequence. After sending this,
 * the server will respond with room data messages (HeightMap, FloorHeightMap,
 * Objects, Users, etc.)
 */
export class OpenFlatConnectionMessageComposer extends MessageComposer<ConstructorParameters<typeof OpenFlatConnectionMessageComposer>>
{
    private _data: ConstructorParameters<typeof OpenFlatConnectionMessageComposer>;

    constructor(roomId: number, password: string = '', unknown: number = -1)
    {
        super();
        this._data = [roomId, password, unknown];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/session/OpenFlatConnectionMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
