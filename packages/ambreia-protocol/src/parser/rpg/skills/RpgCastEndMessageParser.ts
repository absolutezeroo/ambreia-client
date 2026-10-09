import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgCastEnd} from '../../../incoming/rpg/skills/RpgCastEndMessage';
import {RpgCastEndMessage} from '../../../incoming/rpg/skills/RpgCastEndMessage';

/** Reads RpgCastEndMessage in the order of the server's RpgCastEndMessageComposerSerializer. */
export class RpgCastEndMessageParser implements IIncomingParser<RpgCastEndMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCastEndMessage
    {
        const ends: IRpgCastEnd[] = [];

        for(let i = wrapper.readInt(); i > 0; i--) ends.push({casterObjectId: wrapper.readInt(), skillId: wrapper.readString(), reason: wrapper.readString()});

        return new RpgCastEndMessage(ends);
    }
}
