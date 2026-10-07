import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Unmute a user in the room
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.action.UnmuteUserMessageComposer
 */
export class UnmuteUserMessageComposer extends MessageComposer<[number, number]>
{
    private _data: [number, number];

    constructor(userId: number, roomId: number)
    {
        super();
        this._data = [userId, roomId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/action/UnmuteUserMessageComposer.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return this._data;
    }
}
