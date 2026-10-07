import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Give room rights to a user
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.action.AssignRightsMessageComposer
 */
export class AssignRightsMessageComposer extends MessageComposer<[number]>
{
    private _data: [number];

    constructor(userId: number)
    {
        super();
        this._data = [userId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/action/AssignRightsMessageComposer.as::getMessageArray()
    getMessageArray(): [number]
    {
        return this._data;
    }
}
