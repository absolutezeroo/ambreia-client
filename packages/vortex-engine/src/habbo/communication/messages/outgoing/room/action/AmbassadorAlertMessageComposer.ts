import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Ambassador alert message
 *
 * @see source_as_win63/habbo/communication/messages/outgoing/room/action/AmbassadorAlertMessageComposer.as
 */
export class AmbassadorAlertMessageComposer extends MessageComposer<ConstructorParameters<typeof AmbassadorAlertMessageComposer>>
{
    private _data: ConstructorParameters<typeof AmbassadorAlertMessageComposer>;

    constructor(userId: number)
    {
        super();
        this._data = [userId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/action/AmbassadorAlertMessageComposer.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
