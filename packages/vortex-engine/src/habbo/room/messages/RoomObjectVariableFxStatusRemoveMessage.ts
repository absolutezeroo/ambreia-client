import {RoomObjectUpdateMessage} from '@room/messages/RoomObjectUpdateMessage';

/**
 * Retracts one VariableFx value from the room object it was on.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/messages/RoomObjectVariableFxStatusRemoveMessage.as
 */
export class RoomObjectVariableFxStatusRemoveMessage extends RoomObjectUpdateMessage
{
    private _configId: number;
    private _variableId: string;

    // AS3: .../room/messages/RoomObjectVariableFxStatusRemoveMessage.as::RoomObjectVariableFxStatusRemoveMessage()
    constructor(configId: number, variableId: string)
    {
        super(null, null);

        this._configId = configId;
        this._variableId = variableId;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusRemoveMessage.as::get configId()
    get configId(): number
    {
        return this._configId;
    }

    // AS3: .../room/messages/RoomObjectVariableFxStatusRemoveMessage.as::get variableId()
    get variableId(): string
    {
        return this._variableId;
    }
}
