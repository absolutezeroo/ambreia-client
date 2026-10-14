import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgQuestResultMessage} from '../../../incoming/rpg/quests/RpgQuestResultMessage';

/** Reads RpgQuestResultMessage in the order of the server's RpgQuestResultMessageComposerSerializer. */
export class RpgQuestResultMessageParser implements IIncomingParser<RpgQuestResultMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgQuestResultMessage
    {
        return new RpgQuestResultMessage(wrapper.readString(), wrapper.readString(), wrapper.readString());
    }
}
