import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgDialogueChoice} from '../../../incoming/rpg/quests/IRpgDialogueChoice';
import {RpgDialogueMessage} from '../../../incoming/rpg/quests/RpgDialogueMessage';
import {readCount} from '../../readCount';

/** Reads RpgDialogueMessage in the order of the server's RpgDialogueMessageComposerSerializer. */
export class RpgDialogueMessageParser implements IIncomingParser<RpgDialogueMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgDialogueMessage
    {
        const npcObjectId = wrapper.readInt();
        const speaker = wrapper.readString();
        const text = wrapper.readString();
        const count = readCount(wrapper, 4);
        const choices: IRpgDialogueChoice[] = [];

        for(let i = 0; i < count; i++) choices.push({text: wrapper.readString(), kind: wrapper.readString()});

        return new RpgDialogueMessage(npcObjectId, speaker, text, choices);
    }
}
