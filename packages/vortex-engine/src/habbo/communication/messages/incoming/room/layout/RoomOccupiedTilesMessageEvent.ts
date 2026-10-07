import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    RoomOccupiedTilesMessageParser
} from '@habbo/communication/messages/parser/room/layout/RoomOccupiedTilesMessageParser';

/**
 * The tiles a room already has furniture on — header 1235 in WIN63's registry
 * (`_SafeCls_2046.as::_events[1235]`). Answers `GetOccupiedTilesMessageComposer`, and its only
 * subscriber is the floor plan editor, which greys those tiles out and refuses to draw on them.
 *
 * Name recovered from
 * `sources/win63_version/habbo/communication/messages/incoming/room/layout/RoomOccupiedTilesMessageEvent.as`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2612/_SafeCls_3062.as
 */
export class RoomOccupiedTilesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, RoomOccupiedTilesMessageParser);
    }
}
