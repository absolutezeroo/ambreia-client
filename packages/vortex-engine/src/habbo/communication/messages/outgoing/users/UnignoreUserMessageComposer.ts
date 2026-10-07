import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Unignore a user.
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/users/UnignoreUserMessageComposer.as
 */
export class UnignoreUserMessageComposer extends MessageComposer<ConstructorParameters<typeof UnignoreUserMessageComposer>>
{
    private _data: ConstructorParameters<typeof UnignoreUserMessageComposer>;

    constructor(userId: number)
    {
        super();

        this._data = [userId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/UnignoreUserMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
