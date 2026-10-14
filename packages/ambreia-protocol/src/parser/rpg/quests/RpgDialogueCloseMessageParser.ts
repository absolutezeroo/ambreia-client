import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgDialogueCloseMessage} from '../../../incoming/rpg/quests/RpgDialogueCloseMessage';

/** Reads RpgDialogueCloseMessage in the order of the server's RpgDialogueCloseMessageComposerSerializer. */
export class RpgDialogueCloseMessageParser implements IIncomingParser<RpgDialogueCloseMessage>
{
    parse(_wrapper: IMessageDataWrapper): RpgDialogueCloseMessage
    {
        return new RpgDialogueCloseMessage();
    }
}
