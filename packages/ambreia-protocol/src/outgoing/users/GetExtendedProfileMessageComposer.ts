import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Request an extended user profile.
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer.as
 */
export class GetExtendedProfileMessageComposer extends MessageComposer<ConstructorParameters<typeof GetExtendedProfileMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetExtendedProfileMessageComposer>;

    constructor(userId: number, openWindow: boolean = true)
    {
        super();

        this._data = [userId, openWindow];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
