import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgCharacterProgressMessage} from '../../../incoming/rpg/characters/RpgCharacterProgressMessage';

/** Reads RpgCharacterProgressMessage in the order of the server's RpgCharacterProgressMessageComposerSerializer. */
export class RpgCharacterProgressMessageParser implements IIncomingParser<RpgCharacterProgressMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCharacterProgressMessage
    {
        return new RpgCharacterProgressMessage(wrapper.readInt(), wrapper.readInt(), wrapper.readInt());
    }
}
