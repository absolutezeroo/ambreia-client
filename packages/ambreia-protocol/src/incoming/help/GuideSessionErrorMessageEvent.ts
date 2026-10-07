import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {GuideSessionErrorMessageParser} from '../../parser/help/GuideSessionErrorMessageParser';

/**
 * Event fired when a guide session error occurs.
 *
 * @see sources/win63_version/habbo/communication/messages/incoming/help/GuideSessionErrorMessageEvent.as
 */
export class GuideSessionErrorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: MessageEventCallback)
    {
        super(callBack, GuideSessionErrorMessageParser);
    }
}
