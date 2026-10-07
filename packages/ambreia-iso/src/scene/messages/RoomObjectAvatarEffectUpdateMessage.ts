/**
 * RoomObjectAvatarEffectUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarEffectUpdateMessage
 *
 * Update message for avatar effect (enables, etc.).
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';

export class RoomObjectAvatarEffectUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(effect: number, delayMilliSeconds: number = 0)
    {
        super(null, null);
        this._effect = effect;
        this._delayMilliSeconds = delayMilliSeconds;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarEffectUpdateMessage.as::_effect
    private _effect: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarEffectUpdateMessage.as::get effect()
    get effect(): number
    {
        return this._effect;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectAvatarEffectUpdateMessage.as::_delayMilliSeconds
    private _delayMilliSeconds: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarEffectUpdateMessage.as::get delayMilliSeconds()
    get delayMilliSeconds(): number
    {
        return this._delayMilliSeconds;
    }
}
