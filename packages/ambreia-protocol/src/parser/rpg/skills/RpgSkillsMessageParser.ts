import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgSkillsMessage} from '../../../incoming/rpg/skills/RpgSkillsMessage';

/** Reads RpgSkillsMessage in the order of the server's RpgSkillsMessageComposerSerializer. */
export class RpgSkillsMessageParser implements IIncomingParser<RpgSkillsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgSkillsMessage
    {
        const known: string[] = [];
        const bar: string[] = [];

        for(let i = wrapper.readInt(); i > 0; i--) known.push(wrapper.readString());
        for(let i = wrapper.readInt(); i > 0; i--) bar.push(wrapper.readString());

        return new RpgSkillsMessage(known, bar);
    }
}
