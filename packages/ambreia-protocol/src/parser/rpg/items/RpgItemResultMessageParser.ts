import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgItemResultMessage} from '../../../incoming/rpg/items/RpgItemResultMessage';

/** Reads RpgItemResultMessage in the order of the server's RpgItemResultMessageComposerSerializer. */
export class RpgItemResultMessageParser implements IIncomingParser<RpgItemResultMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgItemResultMessage
    {
        return new RpgItemResultMessage(wrapper.readInt(), wrapper.readString());
    }
}
