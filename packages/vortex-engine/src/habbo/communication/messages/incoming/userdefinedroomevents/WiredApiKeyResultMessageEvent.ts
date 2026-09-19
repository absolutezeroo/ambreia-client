import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {WiredApiKeyResultParser} from '../../parser/userdefinedroomevents/WiredApiKeyResultParser';

/**
 * Class name derived — the AS3 class is obfuscated (`_SafeCls_3726`) and exists in no other tree.
 * Named after its parser, itself named after the readable handler that takes it.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/communication/messages/incoming/userdefinedroomevents/_SafeCls_3726.as
 */
export class WiredApiKeyResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, WiredApiKeyResultParser);
    }
}
