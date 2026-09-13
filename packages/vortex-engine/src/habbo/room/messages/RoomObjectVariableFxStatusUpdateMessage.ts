import {RoomObjectUpdateMessage} from '@room/messages/RoomObjectUpdateMessage';
import type {OrderedMap} from '@core/utils/OrderedMap';

/**
 * Delivers one VariableFx value to the room object it belongs to. The engine resolves the entity
 * id to an object and hands this to its event handler; the object's logic is what stores it.
 *
 * Carries no location or direction — `super(null, null)` — because it changes neither.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/room/messages/RoomObjectVariableFxStatusUpdateMessage.as
 */
export class RoomObjectVariableFxStatusUpdateMessage extends RoomObjectUpdateMessage
{
    private _configId: number;
    private _variableId: string;
    private _value: number;
    private _overrideMinValue: number | null;
    private _overrideMaxValue: number | null;
    private _extra: OrderedMap | null;
    private _initialize: boolean;

    // AS3: .../room/messages/RoomObjectVariableFxStatusUpdateMessage.as::RoomObjectVariableFxStatusUpdateMessage()
    constructor(
        configId: number,
        variableId: string,
        value: number,
        overrideMinValue: number | null,
        overrideMaxValue: number | null,
        extra: OrderedMap | null,
        initialize: boolean
    )
    {
        super(null, null);

        this._configId = configId;
        this._variableId = variableId;
        this._value = value;
        this._overrideMinValue = overrideMinValue;
        this._overrideMaxValue = overrideMaxValue;
        this._extra = extra;
        this._initialize = initialize;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusUpdateMessage.as::get configId()
    get configId(): number
    {
        return this._configId;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusUpdateMessage.as::get variableId()
    get variableId(): string
    {
        return this._variableId;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusUpdateMessage.as::get value()
    get value(): number
    {
        return this._value;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusUpdateMessage.as::get overrideMinValue()
    get overrideMinValue(): number | null
    {
        return this._overrideMinValue;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusUpdateMessage.as::get overrideMaxValue()
    get overrideMaxValue(): number | null
    {
        return this._overrideMaxValue;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusUpdateMessage.as::get extra()
    get extra(): OrderedMap | null
    {
        return this._extra;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusUpdateMessage.as::get initialize()
    get initialize(): boolean
    {
        return this._initialize;
    }
}
