import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgEmoteMessage} from '../../../incoming/rpg/emote/RpgEmoteMessage';

/** Reads RpgEmoteMessage in the order of the server's RpgEmoteMessageComposerSerializer. */
export class RpgEmoteMessageParser implements IIncomingParser<RpgEmoteMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgEmoteMessage
    {
        return new RpgEmoteMessage(wrapper.readInt(), wrapper.readString());
    }
}
