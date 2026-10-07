import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Let a user in (doorbell response)
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.action.LetUserInMessageComposer
 */
export class LetUserInMessageComposer extends MessageComposer<[string, boolean]>
{
    private _data: [string, boolean];

    constructor(userName: string, allow: boolean)
    {
        super();
        this._data = [userName, allow];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/action/LetUserInMessageComposer.as::getMessageArray()
    getMessageArray(): [string, boolean]
    {
        return this._data;
    }
}
