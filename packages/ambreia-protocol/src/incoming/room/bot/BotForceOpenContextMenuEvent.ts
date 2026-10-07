import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {BotForceOpenContextMenuParser} from '../../../parser/room/bot/BotForceOpenContextMenuParser';

/**
 * The server popping a bot's context menu open (header 2336).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2511/_SafeCls_2761.as
 * (obfuscated; subscribed by RoomDesktop, which forwards it as
 * RoomWidgetRentableBotForceOpenContextMenuEvent).
 */
export class BotForceOpenContextMenuEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, BotForceOpenContextMenuParser);
    }
}
