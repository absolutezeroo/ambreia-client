import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {PetLevelUpdateEventParser} from '../../../parser/room/pet/PetLevelUpdateEventParser';

/**
 * A pet levelled up (header 3104).
 *
 * The server omits the leading roomIndex — see PetLevelUpdateEventParser's header.
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/room/pets/PetLevelUpdateEvent.as
 */
export class PetLevelUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PetLevelUpdateEventParser);
    }
}
