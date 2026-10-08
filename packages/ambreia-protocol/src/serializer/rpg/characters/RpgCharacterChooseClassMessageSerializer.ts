import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgCharacterChooseClassMessage} from '../../../outgoing/rpg/characters/RpgCharacterChooseClassMessage';

/** Writes RpgCharacterChooseClassMessage in the order of the server's RpgCharacterChooseClassMessageParser. */
export class RpgCharacterChooseClassMessageSerializer implements IOutgoingSerializer<RpgCharacterChooseClassMessage>
{
    serialize(message: RpgCharacterChooseClassMessage): unknown[]
    {
        return [message.playerId, message.classId];
    }
}
