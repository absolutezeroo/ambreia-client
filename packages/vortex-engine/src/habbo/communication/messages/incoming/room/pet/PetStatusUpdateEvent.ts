import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {PetStatusUpdateEventParser} from '@habbo/communication/messages/parser/room/pet/PetStatusUpdateEventParser';

/**
 * A pet's breed/harvest/revive availability changed (header 2753). The RPG fork removed pet
 * breeding and monsterplants: the server still sends it with every flag false, the parser still
 * reads them all, and only the pet id goes further.
 *
 * The server currently sends this with an empty body — see PetStatusUpdateEventParser's header.
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/room/pets/PetStatusUpdateEvent.as
 */
export class PetStatusUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PetStatusUpdateEventParser);
    }
}
