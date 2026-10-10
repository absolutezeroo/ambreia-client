import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgClassListMessage} from '../../../incoming/rpg/characters/RpgClassListMessage';
import type {IRpgClassEntry} from '../../../incoming/rpg/characters/IRpgClassEntry';
import {readCount} from '../../readCount';

/** Reads RpgClassListMessage in the order of the server's RpgClassListMessageComposerSerializer. */
export class RpgClassListMessageParser implements IIncomingParser<RpgClassListMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgClassListMessage
    {
        const classes: IRpgClassEntry[] = [];

        for(let count = readCount(wrapper); count > 0; count--)
        {
            const id = wrapper.readString();
            const role = wrapper.readString();
            const range = wrapper.readInt();
            const primaryStat = wrapper.readString();
            const starter = wrapper.readBoolean();
            const specializations: string[] = [];

            for(let specs = readCount(wrapper); specs > 0; specs--) specializations.push(wrapper.readString());

            classes.push({id, role, range, primaryStat, starter, specializations});
        }

        return new RpgClassListMessage(classes);
    }
}
