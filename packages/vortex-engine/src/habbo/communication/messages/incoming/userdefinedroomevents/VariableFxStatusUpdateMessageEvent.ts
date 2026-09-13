import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {VariableFxStatusUpdateParser} from '../../parser/userdefinedroomevents/VariableFxStatusUpdateParser';

/**
 * Class name derived — the AS3 class is obfuscated (`_SafeCls_2903`) and exists in no other tree.
 * Named after its parser.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/communication/messages/incoming/userdefinedroomevents/_SafeCls_2903.as
 */
export class VariableFxStatusUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, VariableFxStatusUpdateParser);
    }
}
