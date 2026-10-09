import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgChatResultMessage} from '../../../incoming/rpg/chat/RpgChatResultMessage';

/** Reads RpgChatResultMessage in the order of the server's RpgChatResultMessageComposerSerializer. */
export class RpgChatResultMessageParser implements IIncomingParser<RpgChatResultMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgChatResultMessage
    {
        return new RpgChatResultMessage(wrapper.readString(), wrapper.readString());
    }
}
