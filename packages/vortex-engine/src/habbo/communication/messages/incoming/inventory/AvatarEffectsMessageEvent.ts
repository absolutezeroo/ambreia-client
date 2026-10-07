import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AvatarEffectsMessageParser} from '../../parser/inventory/AvatarEffectsMessageParser';

/**
 * Event handler for AvatarEffects message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/inventory/avatareffect/AvatarEffectsMessageEvent.as
 */
export class AvatarEffectsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AvatarEffectsMessageParser);
    }
}
