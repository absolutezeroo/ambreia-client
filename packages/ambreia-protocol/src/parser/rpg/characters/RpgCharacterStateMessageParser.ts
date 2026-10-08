import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgCharacterStateMessage} from '../../../incoming/rpg/characters/RpgCharacterStateMessage';
import {readRpgStatBlock} from './RpgStatBlockReader';

/** Reads RpgCharacterStateMessage in the order of the server's RpgCharacterStateMessageComposerSerializer. */
export class RpgCharacterStateMessageParser implements IIncomingParser<RpgCharacterStateMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCharacterStateMessage
    {
        return new RpgCharacterStateMessage(
            wrapper.readInt(),
            wrapper.readString(),
            wrapper.readString(),
            wrapper.readInt(),
            wrapper.readInt(),
            wrapper.readInt(),
            wrapper.readInt(),
            readRpgStatBlock(wrapper)
        );
    }
}
