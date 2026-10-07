import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {DiceValueMessageParser} from '../../../parser/room/engine/DiceValueMessageParser';

/**
 * DiceValueMessageEvent — incoming rolled dice value (WIN63 header 264, from the registry
 * `_SafeStr_4546[264] = _SafeCls_2946`). Consumed by RoomMessageHandler.onDiceValue.
 *
 * Name derived: fully obfuscated in AS3 (class `_SafeCls_2946`); named for its role.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2437/_SafeCls_2946.as
 */
export class DiceValueMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, DiceValueMessageParser);
    }
}
