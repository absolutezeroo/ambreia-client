import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Notify that user started typing
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.chat.StartTypingMessageComposer
 */
export class StartTypingMessageComposer extends MessageComposer<[]>
{
    constructor()
    {
        super();
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/chat/StartTypingMessageComposer.as::getMessageArray()
    getMessageArray(): []
    {
        return [];
    }
}
