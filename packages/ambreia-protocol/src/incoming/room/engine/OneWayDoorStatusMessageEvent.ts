import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {OneWayDoorStatusMessageParser} from '../../../parser/room/engine/OneWayDoorStatusMessageParser';

/**
 * OneWayDoorStatusMessageEvent — incoming one-way door (gate) status (WIN63 header 1778, from the registry
 * `_SafeStr_4546[1778] = _SafeCls_3899`).
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3899`); named for its role.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2437/_SafeCls_3899.as
 */
export class OneWayDoorStatusMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, OneWayDoorStatusMessageParser);
    }
}
