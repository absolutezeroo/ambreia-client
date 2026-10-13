import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgTargetEntry} from '../../../incoming/rpg/combat/RpgTargetsMessage';
import {RpgTargetsMessage} from '../../../incoming/rpg/combat/RpgTargetsMessage';
import {readCount} from '../../readCount';

/** Reads RpgTargetsMessage in the order of the server's RpgTargetsMessageComposerSerializer. */
export class RpgTargetsMessageParser implements IIncomingParser<RpgTargetsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgTargetsMessage
    {
        const count = readCount(wrapper, 8);
        const entries: IRpgTargetEntry[] = [];

        for(let i = 0; i < count; i++) entries.push({objectId: wrapper.readInt(), targetObjectId: wrapper.readInt()});

        return new RpgTargetsMessage(entries);
    }
}
