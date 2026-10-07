import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {NavigatorSettingsMessageParser} from '../../parser/navigator/NavigatorSettingsMessageParser';

/**
 * @see source_as_win63/habbo/communication/messages/incoming/navigator/NavigatorSettingsEvent.as
 */
export class NavigatorSettingsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, NavigatorSettingsMessageParser);
    }
}
