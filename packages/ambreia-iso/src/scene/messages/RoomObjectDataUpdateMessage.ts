/**
 * RoomObjectDataUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectDataUpdateMessage
 *
 * Update message for furniture state and data.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IStuffData} from '../object/data/IStuffData';

export class RoomObjectDataUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(state: number, data: IStuffData | null, extra: number = NaN)
    {
        super(null, null);
        this._state = state;
        this._data = data;
        this._extra = extra;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectDataUpdateMessage.as::_state
    private _state: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectDataUpdateMessage.as::get state()
    get state(): number
    {
        return this._state;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectDataUpdateMessage.as::_data
    private _data: IStuffData | null;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectDataUpdateMessage.as::get data()
    get data(): IStuffData | null
    {
        return this._data;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectDataUpdateMessage.as::_extra
    private _extra: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectDataUpdateMessage.as::get extra()
    get extra(): number
    {
        return this._extra;
    }
}
