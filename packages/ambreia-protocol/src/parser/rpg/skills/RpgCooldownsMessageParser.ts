import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgCooldownsMessage} from '../../../incoming/rpg/skills/RpgCooldownsMessage';

/** Reads RpgCooldownsMessage in the order of the server's RpgCooldownsMessageComposerSerializer. */
export class RpgCooldownsMessageParser implements IIncomingParser<RpgCooldownsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCooldownsMessage
    {
        const globalRemainingMs = wrapper.readInt();
        const skills: {skillId: string; remainingMs: number}[] = [];

        for(let i = wrapper.readInt(); i > 0; i--) skills.push({skillId: wrapper.readString(), remainingMs: wrapper.readInt()});

        return new RpgCooldownsMessage(globalRemainingMs, skills);
    }
}
