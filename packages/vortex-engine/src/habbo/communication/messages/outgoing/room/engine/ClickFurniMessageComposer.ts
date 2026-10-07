import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Tells the server a furniture item was clicked (a plain, unmodified click).
 *
 * Floor items send their object id; wall items send its negation (the sign is how the server tells
 * the two apart — see the emulator's ClickFurniMessageHandler). `param` is 0 for an ordinary click.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/engine/ClickFurniMessageComposer.as
 */
export class ClickFurniMessageComposer extends MessageComposer<[number, number]>
{
    private _objectId: number;
    private _param: number;

    constructor(objectId: number, param: number = 0)
    {
        super();

        this._objectId = objectId;
        this._param = param;
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/ClickFurniMessageComposer.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return [this._objectId, this._param];
    }
}
