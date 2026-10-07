import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {PetPlacingErrorEventParser} from '@habbo/communication/messages/parser/room/pet/PetPlacingErrorEventParser';

/**
 * Placing a pet in the room failed (header 3195).
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/room/pets/PetPlacingErrorEvent.as
 */
export class PetPlacingErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PetPlacingErrorEventParser);
    }
}
