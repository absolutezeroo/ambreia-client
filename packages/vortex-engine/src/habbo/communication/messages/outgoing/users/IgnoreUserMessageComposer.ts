import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Ignore a user.
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/users/IgnoreUserMessageComposer.as
 */
export class IgnoreUserMessageComposer extends MessageComposer<ConstructorParameters<typeof IgnoreUserMessageComposer>>
{
    private _data: ConstructorParameters<typeof IgnoreUserMessageComposer>;

    constructor(userId: number)
    {
        super();

        this._data = [userId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/IgnoreUserMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
