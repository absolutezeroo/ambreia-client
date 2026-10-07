import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Notify that user stopped typing
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.chat.CancelTypingMessageComposer
 */
export class CancelTypingMessageComposer extends MessageComposer<[]>
{
    constructor()
    {
        super();
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/chat/CancelTypingMessageComposer.as::getMessageArray()
    getMessageArray(): []
    {
        return [];
    }
}
