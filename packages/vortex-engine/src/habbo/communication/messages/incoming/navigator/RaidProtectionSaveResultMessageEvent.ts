import {MessageEvent} from '@core/communication/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@core/communication/messages/IMessageEvent';
import {RaidProtectionSaveResultMessageParser} from '../../parser/navigator/RaidProtectionSaveResultMessageParser';

/**
 * Class name derived — the AS3 class is obfuscated (`_SafePkg_3108._SafeCls_3107`) and exists in
 * no other tree. Named after its parser.
 *
 * @see sources/AIR-1.0.31/src/_SafePkg_3108/_SafeCls_3107.as
 */
export class RaidProtectionSaveResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, RaidProtectionSaveResultMessageParser);
    }
}
