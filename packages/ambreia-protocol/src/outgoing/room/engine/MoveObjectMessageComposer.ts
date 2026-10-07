import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Moves/rotates a floor furniture object to a new position and/or direction.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/engine/MoveObjectMessageComposer.as
 */
export class MoveObjectMessageComposer extends MessageComposer<[number, number, number, number]>
{
    private _objectId: number;
    private _x: number;
    private _y: number;
    private _direction: number;

    constructor(objectId: number, x: number, y: number, direction: number)
    {
        super();

        this._objectId = objectId;
        this._x = x;
        this._y = y;
        this._direction = direction;
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/engine/MoveObjectMessageComposer.as::getMessageArray()
    getMessageArray(): [number, number, number, number]
    {
        return [this._objectId, this._x, this._y, this._direction];
    }
}
