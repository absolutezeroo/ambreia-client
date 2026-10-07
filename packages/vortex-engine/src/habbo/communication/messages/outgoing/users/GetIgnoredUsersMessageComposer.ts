import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Request ignored users list.
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/users/GetIgnoredUsersMessageComposer.as
 */
export class GetIgnoredUsersMessageComposer extends MessageComposer<ConstructorParameters<typeof GetIgnoredUsersMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetIgnoredUsersMessageComposer>;

    constructor()
    {
        super();

        this._data = [];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/GetIgnoredUsersMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
