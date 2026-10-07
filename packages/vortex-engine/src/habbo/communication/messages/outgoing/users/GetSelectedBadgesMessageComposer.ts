import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * GetSelectedBadgesMessageComposer
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.users.GetSelectedBadgesMessageComposer
 */
export class GetSelectedBadgesMessageComposer extends MessageComposer<ConstructorParameters<typeof GetSelectedBadgesMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetSelectedBadgesMessageComposer>;

    constructor(userId: number)
    {
        super();

        this._data = [userId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/GetSelectedBadgesMessageComposer.as::getMessageArray()
    getMessageArray(): [number]
    {
        return this._data;
    }
}
