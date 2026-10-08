import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgCharacterListRequestMessage} from '../../../outgoing/rpg/characters/RpgCharacterListRequestMessage';

/** Writes RpgCharacterListRequestMessage in the order of the server's RpgCharacterListRequestMessageParser. */
export class RpgCharacterListRequestMessageSerializer implements IOutgoingSerializer<RpgCharacterListRequestMessage>
{
    serialize(_message: RpgCharacterListRequestMessage): unknown[]
    {
        return [];
    }
}
