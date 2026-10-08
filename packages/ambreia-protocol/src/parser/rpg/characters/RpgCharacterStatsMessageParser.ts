import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgCharacterStatsMessage} from '../../../incoming/rpg/characters/RpgCharacterStatsMessage';
import {readRpgStatBlock} from './RpgStatBlockReader';

/** Reads RpgCharacterStatsMessage in the order of the server's RpgCharacterStatsMessageComposerSerializer. */
export class RpgCharacterStatsMessageParser implements IIncomingParser<RpgCharacterStatsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCharacterStatsMessage
    {
        return new RpgCharacterStatsMessage(readRpgStatBlock(wrapper));
    }
}
