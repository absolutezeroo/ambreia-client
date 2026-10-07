/**
 * RoomObjectAvatarExpressionUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarExpressionUpdateMessage
 *
 * Update message for avatar expression (emotions).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarExpressionUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(expressionType: number)
    {
        super(null, null);
        this._expressionType = expressionType;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarExpressionUpdateMessage.as::_expressionType
    private _expressionType: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarExpressionUpdateMessage.as::get expressionType()
    get expressionType(): number
    {
        return this._expressionType;
    }
}
