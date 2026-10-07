import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Send a shout message in the room
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.chat.ShoutMessageComposer
 */
export class ShoutMessageComposer extends MessageComposer<[string, number]>
{
    private _data: [string, number];

    constructor(message: string, styleId: number = 0)
    {
        super();
        this._data = [message, styleId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/chat/ShoutMessageComposer.as::getMessageArray()
    getMessageArray(): [string, number]
    {
        return this._data;
    }
}
