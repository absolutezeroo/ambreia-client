import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {PetCommandsMessageEventParser} from '../../../parser/room/pet/PetCommandsMessageEventParser';

/**
 * The command set a pet knows and which are enabled (header 332) — feeds the pet training view.
 *
 * One of only two pet messages whose wire format the server currently matches.
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/room/pets/PetCommandsMessageEvent.as
 */
export class PetCommandsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PetCommandsMessageEventParser);
    }
}
