import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {VariableFxConfigUpdateParser} from '../../parser/userdefinedroomevents/VariableFxConfigUpdateParser';

/**
 * Class name derived — the AS3 class is obfuscated (`_SafeCls_2739`) and exists in no other tree.
 * Named after its parser.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/communication/messages/incoming/userdefinedroomevents/_SafeCls_2739.as
 */
export class VariableFxConfigUpdateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, VariableFxConfigUpdateParser);
    }
}
