import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Remove room rights from users
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.action.RemoveRightsMessageComposer
 */
export class RemoveRightsMessageComposer extends MessageComposer<unknown[]>
{
    private _userIds: number[];

    constructor(userIds: number[])
    {
        super();
        this._userIds = userIds;
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/action/RemoveRightsMessageComposer.as::getMessageArray()
    getMessageArray(): unknown[]
    {
        return [this._userIds.length, ...this._userIds];
    }
}
