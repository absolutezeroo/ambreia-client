import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Hold up a sign
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.avatar.SignMessageComposer
 */
export class SignMessageComposer extends MessageComposer<[number]>
{
    private _data: [number];

    constructor(signId: number)
    {
        super();
        this._data = [signId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/avatar/SignMessageComposer.as::getMessageArray()
    getMessageArray(): [number]
    {
        return this._data;
    }
}
