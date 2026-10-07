import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {PetInfoMessageEventParser} from '../../../parser/room/pet/PetInfoMessageEventParser';

/**
 * Full pet information (header 3192), sent in response to GetPetInfoComposer.
 *
 * AS3 exposes a typed getParser(); this port's MessageEvent already declares a generic
 * `getParser<T>()` and its callbacks read `event.parser`, so no override is added here - matching
 * PetVocalMessageEvent and every other ported event.
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/room/pets/PetInfoMessageEvent.as
 */
export class PetInfoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PetInfoMessageEventParser);
    }
}
