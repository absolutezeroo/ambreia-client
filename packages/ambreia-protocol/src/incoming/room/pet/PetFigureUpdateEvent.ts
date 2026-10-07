import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {PetFigureUpdateEventParser} from '../../../parser/room/pet/PetFigureUpdateEventParser';

/**
 * A pet's figure changed — saddle, riding state, or custom parts (header 3796).
 *
 * The server currently sends this with an empty body — see PetFigureUpdateEventParser's header.
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/room/pets/PetFigureUpdateEvent.as
 */
export class PetFigureUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PetFigureUpdateEventParser);
    }
}
