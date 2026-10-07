/**
 * ObjectsMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.ObjectsMessageEventParser
 *
 * Parser for room floor furniture objects.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {FurnitureFloorData} from '@habbo/communication/messages/incoming/room/engine/FurnitureFloorData';
import {FurnitureDataParser} from './FurnitureDataParser';

export class ObjectsMessageParser implements IMessageParser
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/ObjectsMessageParser.as::_objects
    private _objects: FurnitureFloorData[] = [];
    private _ownerMap: Map<number, string> = new Map();

    get objectCount(): number
    {
        return this._objects.length;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/ObjectsMessageParser.as::getObject()
    getObject(index: number): FurnitureFloorData | null
    {
        if(index < 0 || index >= this._objects.length)
        {
            return null;
        }

        const data = this._objects[index];

        if(data !== null)
        {
            data.setReadOnly();
        }

        return data;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/ObjectsMessageParser.as::flush()
    flush(): boolean
    {
        this._objects.length = 0;
        return true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/ObjectsMessageParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._objects.length = 0;

        // Read owner name map (reuse field to avoid allocation)
        this._ownerMap.clear();
        const ownerMap = this._ownerMap;
        const ownerCount = wrapper.readInt();

        for(let i = 0; i < ownerCount; i++)
        {
            const ownerId = wrapper.readInt();
            const ownerName = wrapper.readString();
            ownerMap.set(ownerId, ownerName);
        }

        // Read objects
        const objectCount = wrapper.readInt();

        for(let i = 0; i < objectCount; i++)
        {
            const data = FurnitureDataParser.parseObjectData(wrapper);

            if(data !== null)
            {
                data.ownerName = ownerMap.get(data.ownerId) ?? '';
                this._objects.push(data);
            }
        }

        return true;
    }
}
