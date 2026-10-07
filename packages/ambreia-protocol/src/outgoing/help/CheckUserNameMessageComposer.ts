import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Checks if a user name is available for use.
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/avatar/CheckUserNameMessageComposer.as
 */
export class CheckUserNameMessageComposer extends MessageComposer<ConstructorParameters<typeof CheckUserNameMessageComposer>>
{
    private _data: ConstructorParameters<typeof CheckUserNameMessageComposer>;

    constructor(name: string)
    {
        super();
        this._data = [name];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/avatar/CheckUserNameMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
