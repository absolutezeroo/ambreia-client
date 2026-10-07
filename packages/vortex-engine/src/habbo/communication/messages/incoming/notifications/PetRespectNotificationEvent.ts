import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {PetRespectNotificationEventParser} from '../../parser/notifications/PetRespectNotificationEventParser';

/**
 * Event for pet respect notification
 *
 * @see source_as_win63/habbo/communication/messages/incoming/users/PetRespectNotificationEvent.as
 */
export class PetRespectNotificationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, PetRespectNotificationEventParser);
    }
}
