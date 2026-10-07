import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {PetExperienceEventParser} from '../../../parser/room/pet/PetExperienceEventParser';

/**
 * A pet gained experience (header 946).
 *
 * The server's field set does not match the AS3's and this message fails **silently** — treat the
 * parser's values as untrustworthy until the emulator is fixed. See PetExperienceEventParser's
 * header for the detail.
 *
 * AS3: sources/win63_version/habbo/communication/messages/incoming/room/pets/PetExperienceEvent.as
 */
export class PetExperienceEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PetExperienceEventParser);
    }
}
