import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AchievementsScoreMessageParser} from '../../parser/inventory/AchievementsScoreMessageParser';

/**
 * Event handler for AchievementsScore message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/inventory/achievements/AchievementsScoreEvent.as
 */
export class AchievementsScoreMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AchievementsScoreMessageParser);
    }
}
