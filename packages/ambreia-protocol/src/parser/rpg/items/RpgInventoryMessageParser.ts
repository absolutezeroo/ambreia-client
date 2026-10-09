import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgItemEntry} from '../../../incoming/rpg/items/IRpgItemEntry';
import {RpgInventoryMessage} from '../../../incoming/rpg/items/RpgInventoryMessage';

/** Reads RpgInventoryMessage in the order of the server's RpgInventoryMessageComposerSerializer. */
export class RpgInventoryMessageParser implements IIncomingParser<RpgInventoryMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgInventoryMessage
    {
        const bagSize = wrapper.readInt();
        const maxParcels = wrapper.readInt();
        const count = wrapper.readInt();
        const items: IRpgItemEntry[] = [];

        for(let i = 0; i < count; i++)
        {
            items.push({
                itemId: wrapper.readInt(),
                definitionId: wrapper.readString(),
                quantity: wrapper.readInt(),
                durability: wrapper.readInt(),
                bound: wrapper.readBoolean(),
                container: wrapper.readInt(),
                slot: wrapper.readInt()
            });
        }

        return new RpgInventoryMessage(bagSize, maxParcels, items);
    }
}
