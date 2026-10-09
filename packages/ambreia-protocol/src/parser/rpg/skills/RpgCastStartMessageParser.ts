import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgCastStart} from '../../../incoming/rpg/skills/RpgCastStartMessage';
import {RpgCastStartMessage} from '../../../incoming/rpg/skills/RpgCastStartMessage';

/** Reads RpgCastStartMessage in the order of the server's RpgCastStartMessageComposerSerializer. */
export class RpgCastStartMessageParser implements IIncomingParser<RpgCastStartMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCastStartMessage
    {
        const casts: IRpgCastStart[] = [];

        for(let i = wrapper.readInt(); i > 0; i--)
        {
            casts.push({
                casterObjectId: wrapper.readInt(),
                skillId: wrapper.readString(),
                durationMs: wrapper.readInt(),
                channel: wrapper.readBoolean(),
                targetObjectId: wrapper.readInt(),
                x: wrapper.readInt(),
                y: wrapper.readInt()
            });
        }

        return new RpgCastStartMessage(casts);
    }
}
