import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {ObjectRemoveMultipleMessageParser} from '../../../parser/room/engine/ObjectRemoveMultipleMessageParser';

/**
 * ObjectRemoveMultipleMessageEvent — incoming bulk floor-furniture removal (WIN63 header 2361, from the registry
 * `_SafeStr_4546[2361] = _SafeCls_3810`).
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_3810`); named for its role.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_3810.as
 */
export class ObjectRemoveMultipleMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, ObjectRemoveMultipleMessageParser);
    }
}
