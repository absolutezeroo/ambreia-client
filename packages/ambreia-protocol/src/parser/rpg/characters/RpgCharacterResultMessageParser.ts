import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgCharacterResultMessage} from '../../../incoming/rpg/characters/RpgCharacterResultMessage';

/** Reads RpgCharacterResultMessage in the order of the server's RpgCharacterResultMessageComposerSerializer. */
export class RpgCharacterResultMessageParser implements IIncomingParser<RpgCharacterResultMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCharacterResultMessage
    {
        return new RpgCharacterResultMessage(wrapper.readInt(), wrapper.readString(), wrapper.readInt());
    }
}
