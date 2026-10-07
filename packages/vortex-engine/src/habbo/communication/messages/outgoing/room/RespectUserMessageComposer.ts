import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Give respect to a user
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/avatar/RespectUserMessageComposer.as
 */
export class RespectUserMessageComposer extends MessageComposer<ConstructorParameters<typeof RespectUserMessageComposer>>
{
    private _data: ConstructorParameters<typeof RespectUserMessageComposer>;

    constructor(userId: number)
    {
        super();

        this._data = [userId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/RespectUserMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
