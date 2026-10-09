import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgSelfVitalsMessage} from '../../../incoming/rpg/combat/RpgSelfVitalsMessage';

/** Reads RpgSelfVitalsMessage in the order of the server's RpgSelfVitalsMessageComposerSerializer. */
export class RpgSelfVitalsMessageParser implements IIncomingParser<RpgSelfVitalsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgSelfVitalsMessage
    {
        return new RpgSelfVitalsMessage(wrapper.readInt(), wrapper.readInt(), wrapper.readInt(), wrapper.readInt(), wrapper.readBoolean());
    }
}
