import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgResurrectOfferMessage} from '../../../incoming/rpg/combat/RpgResurrectOfferMessage';

/** Reads RpgResurrectOfferMessage in the order of the server's RpgResurrectOfferMessageComposerSerializer. */
export class RpgResurrectOfferMessageParser implements IIncomingParser<RpgResurrectOfferMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgResurrectOfferMessage
    {
        return new RpgResurrectOfferMessage(wrapper.readInt(), wrapper.readInt(), wrapper.readInt());
    }
}
