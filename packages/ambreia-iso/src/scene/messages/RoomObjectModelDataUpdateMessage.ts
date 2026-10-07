/**
 * RoomObjectModelDataUpdateMessage
 *
 * @see source_as_win63/habbo/room/messages/RoomObjectModelDataUpdateMessage.as
 *
 * Update message for model key-value data on room objects.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectModelDataUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(numberKey: string, numberValue: number)
    {
        super(null, null);
        this._numberKey = numberKey;
        this._numberValue = numberValue;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectModelDataUpdateMessage.as::_numberKey
    private _numberKey: string;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectModelDataUpdateMessage.as::get numberKey()
    get numberKey(): string
    {
        return this._numberKey;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectModelDataUpdateMessage.as::_numberValue
    private _numberValue: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectModelDataUpdateMessage.as::get numberValue()
    get numberValue(): number
    {
        return this._numberValue;
    }
}
