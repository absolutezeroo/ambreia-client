import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Send a whisper message to a specific user.
 *
 * AS3 concatenates recipientName + " " + message into a single string,
 * and sends [concatenatedString, styleId].
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/chat/WhisperMessageComposer.as
 */
export class WhisperMessageComposer extends MessageComposer<[string, number]>
{
    private _data: [string, number];

    constructor(recipientName: string, message: string, styleId: number = 0)
    {
        super();
        this._data = [recipientName + ' ' + message, styleId];
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/chat/WhisperMessageComposer.as::getMessageArray()
    getMessageArray(): [string, number]
    {
        return this._data;
    }
}
