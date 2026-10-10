import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgZoneInteractivesMessage, type IRpgZoneInteractive} from '../../../incoming/rpg/interaction/RpgZoneInteractivesMessage';
import {readCount} from '../../readCount';

/** Reads RpgZoneInteractivesMessage in the order of the server's RpgZoneInteractivesMessageComposerSerializer. */
export class RpgZoneInteractivesMessageParser implements IIncomingParser<RpgZoneInteractivesMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgZoneInteractivesMessage
    {
        const count = readCount(wrapper);
        const objects: IRpgZoneInteractive[] = [];

        for(let i = 0; i < count; i++) objects.push({objectId: wrapper.readInt(), interaction: wrapper.readString()});

        return new RpgZoneInteractivesMessage(objects);
    }
}
