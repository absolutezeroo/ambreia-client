import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgCharacterCreateMessage} from '../../../outgoing/rpg/characters/RpgCharacterCreateMessage';

/** Writes RpgCharacterCreateMessage in the order of the server's RpgCharacterCreateMessageParser. */
export class RpgCharacterCreateMessageSerializer implements IOutgoingSerializer<RpgCharacterCreateMessage>
{
    serialize(message: RpgCharacterCreateMessage): unknown[]
    {
        return [message.name, message.figure, message.gender];
    }
}
