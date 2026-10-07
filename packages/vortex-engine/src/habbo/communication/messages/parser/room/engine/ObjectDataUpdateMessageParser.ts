/**
 * ObjectDataUpdateMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.ObjectDataUpdateMessageEventParser
 *
 * Parser for updating furniture data/state.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IStuffData} from '@ambreia/iso/scene/object/data/IStuffData';
import {LegacyStuffData} from '@ambreia/iso/scene/object/data/LegacyStuffData';
import {FurnitureDataParser} from './FurnitureDataParser';

export class ObjectDataUpdateMessageParser implements IMessageParser
{
    private _id: number = 0;

    get id(): number
    {
        return this._id;
    }

    private _state: number = 0;

    get state(): number
    {
        return this._state;
    }

    private _data: IStuffData = new LegacyStuffData();

    get data(): IStuffData
    {
        return this._data;
    }

    flush(): boolean
    {
        this._state = 0;
        this._data = new LegacyStuffData();
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        const idStr = wrapper.readString();
        this._id = parseInt(idStr, 10);

        this._data = FurnitureDataParser.parseStuffData(wrapper);

        const stateNum = parseFloat(this._data.getLegacyString());
        if(!isNaN(stateNum))
        {
            this._state = parseInt(this._data.getLegacyString(), 10);
        }

        return true;
    }
}
