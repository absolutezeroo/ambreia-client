import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgNpcMarker} from '../../../incoming/rpg/quests/IRpgNpcMarker';
import {RpgNpcsMessage} from '../../../incoming/rpg/quests/RpgNpcsMessage';
import {readCount} from '../../readCount';

/** Reads RpgNpcsMessage in the order of the server's RpgNpcsMessageComposerSerializer. */
export class RpgNpcsMessageParser implements IIncomingParser<RpgNpcsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgNpcsMessage
    {
        const count = readCount(wrapper, 6);
        const npcs: IRpgNpcMarker[] = [];

        for(let i = 0; i < count; i++) npcs.push({objectId: wrapper.readInt(), marker: wrapper.readString()});

        return new RpgNpcsMessage(npcs);
    }
}
