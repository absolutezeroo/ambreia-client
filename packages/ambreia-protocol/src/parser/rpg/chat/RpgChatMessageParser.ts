import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgChatMessage} from '../../../incoming/rpg/chat/RpgChatMessage';

/** Reads RpgChatMessage in the order of the server's RpgChatMessageComposerSerializer. */
export class RpgChatMessageParser implements IIncomingParser<RpgChatMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgChatMessage
    {
        return new RpgChatMessage(wrapper.readString(), wrapper.readInt(), wrapper.readString(), wrapper.readString(), wrapper.readInt(), wrapper.readString());
    }
}
