import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Use a furniture item (e.g., plant seeds).
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/engine/UseFurnitureMessageComposer.as
 */
export class UseFurnitureMessageComposer extends MessageComposer<[number, number]>
{
    private _data: [number, number];

    constructor(furnitureId: number, extraParam: number = 0)
    {
        super();
        this._data = [furnitureId, extraParam];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/UseFurnitureMessageComposer.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return this._data;
    }
}
