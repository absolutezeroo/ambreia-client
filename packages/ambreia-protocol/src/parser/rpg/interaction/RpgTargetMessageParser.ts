import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgTargetMessage} from '../../../incoming/rpg/interaction/RpgTargetMessage';

/** Reads RpgTargetMessage in the order of the server's RpgTargetMessageComposerSerializer. */
export class RpgTargetMessageParser implements IIncomingParser<RpgTargetMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgTargetMessage
    {
        return new RpgTargetMessage(wrapper.readInt(), wrapper.readString(), wrapper.readString(), wrapper.readInt(), wrapper.readString(), wrapper.readString());
    }
}
