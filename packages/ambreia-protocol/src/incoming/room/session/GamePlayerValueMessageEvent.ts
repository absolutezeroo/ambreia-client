import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {GamePlayerValueMessageParser} from '../../../parser/room/session/GamePlayerValueMessageParser';

/**
 * GamePlayerValueMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.GamePlayerValueMessageEvent
 */
export class GamePlayerValueMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, GamePlayerValueMessageParser);
    }
}
