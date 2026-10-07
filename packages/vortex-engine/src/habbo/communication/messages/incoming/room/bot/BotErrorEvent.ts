import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {BotErrorParser} from '@habbo/communication/messages/parser/room/bot/BotErrorParser';

/**
 * A refused bot action (header 520).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2511/_SafeCls_2510.as
 * (obfuscated; subscribed as `onBotError` by RoomUsersHandler).
 */
export class BotErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, BotErrorParser);
    }
}
