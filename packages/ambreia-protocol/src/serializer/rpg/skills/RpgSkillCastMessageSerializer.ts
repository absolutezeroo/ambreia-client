import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgSkillCastMessage} from '../../../outgoing/rpg/skills/RpgSkillCastMessage';

/** Writes RpgSkillCastMessage in the order of the server's RpgSkillCastMessageParser. */
export class RpgSkillCastMessageSerializer implements IOutgoingSerializer<RpgSkillCastMessage>
{
    serialize(message: RpgSkillCastMessage): unknown[]
    {
        return [message.skillId, message.targetObjectId, message.x, message.y];
    }
}
