import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Request the current dimmer presets for the room
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/furniture/RoomDimmerGetPresetsMessageComposer.as
 */
export class RoomDimmerGetPresetsComposer extends MessageComposer<[number]>
{
    private _data: [number];

    constructor(objectId: number)
    {
        super();
        this._data = [objectId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/furniture/RoomDimmerGetPresetsMessageComposer.as::getMessageArray()
    getMessageArray(): [number]
    {
        return this._data;
    }
}
