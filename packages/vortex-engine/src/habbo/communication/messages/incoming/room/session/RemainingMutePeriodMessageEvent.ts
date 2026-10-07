import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {RemainingMutePeriodMessageParser} from '../../../parser/room/session/RemainingMutePeriodMessageParser';

/**
 * The seconds left on this player's mute (header 2129).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2213/_SafeCls_3585.as
 * (obfuscated; `_SafeStr_4546[2129] = _SafeCls_3585` in the registry
 * sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as, and
 * `RoomChatHandler.as::onRemainingMutePeriod()` is its only handler.)
 */
export class RemainingMutePeriodMessageEvent extends MessageEvent implements IMessageEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2213/_SafeCls_3585.as::get secondsRemaining()
    // AS3 re-exposes the parser's field on the event itself; this port's MessageEvent subclasses
    // never do that (callers read `event.parser.secondsRemaining` instead - see
    // RoomChatHandler.ts::onRemainingMutePeriod()), so there is no forwarding getter to declare
    // here.

    // AS3: _SafeCls_3585.as::_SafeCls_3585()
    constructor(callback: MessageEventCallback)
    {
        super(callback, RemainingMutePeriodMessageParser);
    }
}
