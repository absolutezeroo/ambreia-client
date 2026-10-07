/**
 * ObjectAddMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.ObjectAddMessageEventParser
 *
 * Parser for adding a single floor furniture object.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {FurnitureFloorData} from '../../../incoming/room/engine/FurnitureFloorData';
import {FurnitureDataParser} from './FurnitureDataParser';

export class ObjectAddMessageParser implements IMessageParser
{
    private _object: FurnitureFloorData | null = null;

    get object(): FurnitureFloorData | null
    {
        return this._object;
    }

    flush(): boolean
    {
        this._object = null;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._object = FurnitureDataParser.parseObjectData(wrapper);

        if(this._object !== null)
        {
            this._object.ownerName = wrapper.readString();
        }

        return true;
    }
}
