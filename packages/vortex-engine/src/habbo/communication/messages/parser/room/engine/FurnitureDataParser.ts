/**
 * FurnitureDataParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.class_1642
 *
 * Utility class for parsing furniture data from messages.
 */
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import {StuffDataFactory} from '@habbo/room/object/data/StuffDataFactory';
import {FurnitureFloorData} from '@habbo/communication/messages/incoming/room/engine/FurnitureFloorData';

export class FurnitureDataParser
{
    static parseObjectData(wrapper: IMessageDataWrapper): FurnitureFloorData | null
    {
        if(wrapper === null)
        {
            return null;
        }

        const id = wrapper.readInt();
        const data = new FurnitureFloorData(id);

        const type = wrapper.readInt();
        data.type = type;
        data.x = wrapper.readInt();
        data.y = wrapper.readInt();
        data.dir = (wrapper.readInt() % 8) * 45;
        data.z = parseFloat(wrapper.readString());
        data.sizeZ = parseFloat(wrapper.readString());
        data.extra = wrapper.readInt();
        data.data = FurnitureDataParser.parseStuffData(wrapper);

        const state = parseFloat(data.data.getLegacyString());

        if(!isNaN(state))
        {
            data.state = parseInt(data.data.getLegacyString(), 10);
        }

        data.expiryTime = wrapper.readInt();
        data.usagePolicy = wrapper.readInt();
        data.ownerId = wrapper.readInt();

        if(type < 0)
        {
            data.staticClass = wrapper.readString();
        }

        return data;
    }

    static parseStuffData(wrapper: IMessageDataWrapper): IStuffData
    {
        const typeFlags = wrapper.readInt();
        const stuffData = StuffDataFactory.getStuffDataForType(typeFlags);

        if(stuffData !== null)
        {
            stuffData.initializeFromIncomingMessage(wrapper);
        }

        return stuffData!;
    }
}
