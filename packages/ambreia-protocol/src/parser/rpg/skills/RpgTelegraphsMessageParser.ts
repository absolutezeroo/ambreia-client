import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgTelegraph} from '../../../incoming/rpg/skills/RpgTelegraphsMessage';
import {RpgTelegraphsMessage} from '../../../incoming/rpg/skills/RpgTelegraphsMessage';
import {readCount} from '../../readCount';

/** Reads RpgTelegraphsMessage in the order of the server's RpgTelegraphsMessageComposerSerializer. */
export class RpgTelegraphsMessageParser implements IIncomingParser<RpgTelegraphsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgTelegraphsMessage
    {
        const count = readCount(wrapper);
        const telegraphs: IRpgTelegraph[] = [];

        for(let i = 0; i < count; i++)
        {
            const casterObjectId = wrapper.readInt();
            const skillId = wrapper.readString();
            const shape = wrapper.readString();
            const delayMs = wrapper.readInt();
            const cellCount = readCount(wrapper);
            const cells: {x: number; y: number}[] = [];

            for(let j = 0; j < cellCount; j++) cells.push({x: wrapper.readInt(), y: wrapper.readInt()});

            telegraphs.push({casterObjectId, skillId, shape, delayMs, cells});
        }

        return new RpgTelegraphsMessage(telegraphs);
    }
}
