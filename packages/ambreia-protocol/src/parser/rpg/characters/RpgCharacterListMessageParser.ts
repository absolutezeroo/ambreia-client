import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgCharacterListMessage} from '../../../incoming/rpg/characters/RpgCharacterListMessage';
import type {IRpgCharacterListEntry} from '../../../incoming/rpg/characters/IRpgCharacterListEntry';

/** Reads RpgCharacterListMessage in the order of the server's RpgCharacterListMessageComposerSerializer. */
export class RpgCharacterListMessageParser implements IIncomingParser<RpgCharacterListMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCharacterListMessage
    {
        const maxCharacters = wrapper.readInt();
        const characters: IRpgCharacterListEntry[] = [];

        for(let count = wrapper.readInt(); count > 0; count--)
        {
            characters.push({
                playerId: wrapper.readInt(),
                name: wrapper.readString(),
                figure: wrapper.readString(),
                gender: wrapper.readString(),
                classId: wrapper.readString(),
                specializationId: wrapper.readString(),
                level: wrapper.readInt(),
                starter: wrapper.readBoolean()
            });
        }

        return new RpgCharacterListMessage(maxCharacters, characters);
    }
}
