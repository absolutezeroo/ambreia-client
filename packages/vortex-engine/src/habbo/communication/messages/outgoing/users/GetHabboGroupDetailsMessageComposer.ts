import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * GetHabboGroupDetailsMessageComposer
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.users.GetHabboGroupDetailsMessageComposer
 */
export class GetHabboGroupDetailsMessageComposer extends MessageComposer<ConstructorParameters<typeof GetHabboGroupDetailsMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetHabboGroupDetailsMessageComposer>;

    constructor(groupId: number, openDetails: boolean)
    {
        super();

        this._data = [groupId, openDetails];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/users/GetHabboGroupDetailsMessageComposer.as::getMessageArray()
    getMessageArray(): [number, boolean]
    {
        return this._data;
    }
}
