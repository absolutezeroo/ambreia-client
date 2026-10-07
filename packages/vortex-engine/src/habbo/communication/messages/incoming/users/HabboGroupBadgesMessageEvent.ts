import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {HabboGroupBadgesMessageParser} from "@habbo/communication";

/**
 * Event for in-client link messages sent by the server
 *
 * The server sends a link string that should be routed to the appropriate
 * link event tracker via ComponentContext.createLinkEvent().
 *
 * @see source_as_win63/habbo/communication/messages/incoming/users/HabboGroupBadgesMessageEvent.as
 */
export class HabboGroupBadgesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, HabboGroupBadgesMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/HabboGroupBadgesMessageEvent.as::get badges()
    get badges(): Map<number, string> | null
    {
        return (this._parser as HabboGroupBadgesMessageParser).badges;
    }
}