import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgSkillResultMessage} from '../../../incoming/rpg/skills/RpgSkillResultMessage';

/** Reads RpgSkillResultMessage in the order of the server's RpgSkillResultMessageComposerSerializer. */
export class RpgSkillResultMessageParser implements IIncomingParser<RpgSkillResultMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgSkillResultMessage
    {
        return new RpgSkillResultMessage(wrapper.readString(), wrapper.readString());
    }
}
