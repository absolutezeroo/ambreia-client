import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {BotSkillListUpdateParser} from '../../../parser/room/bot/BotSkillListUpdateParser';

/**
 * A rentable bot's skill list (header 1293).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2511/_SafeCls_2996.as
 * (obfuscated; subscribed by RoomDesktop, which forwards it as
 * RoomWidgetRentableBotSkillListUpdateEvent).
 */
export class BotSkillListUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, BotSkillListUpdateParser);
    }
}
