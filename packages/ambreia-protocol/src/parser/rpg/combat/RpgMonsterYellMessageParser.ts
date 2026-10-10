import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgMonsterYellMessage} from '../../../incoming/rpg/combat/RpgMonsterYellMessage';

/** Reads RpgMonsterYellMessage in the order of the server's RpgMonsterYellMessageComposerSerializer. */
export class RpgMonsterYellMessageParser implements IIncomingParser<RpgMonsterYellMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgMonsterYellMessage
    {
        return new RpgMonsterYellMessage(wrapper.readInt(), wrapper.readString());
    }
}
