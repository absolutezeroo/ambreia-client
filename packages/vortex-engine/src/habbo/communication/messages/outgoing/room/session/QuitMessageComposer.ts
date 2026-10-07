import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Quit the current room
 *
 * Based on AS3: com.sulake.habbo.communication.messages.outgoing.room.session.QuitMessageComposer
 */
export class QuitMessageComposer extends MessageComposer<[]>
{
    constructor()
    {
        super();
    }

    // AS3: sources/win63_version/habbo/communication/messages/outgoing/room/session/QuitMessageComposer.as::getMessageArray()
    getMessageArray(): []
    {
        return [];
    }
}
