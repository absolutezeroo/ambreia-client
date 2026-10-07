/**
 * RoomObjectPlaySoundIdEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectPlaySoundIdEvent.as
 *
 * Event dispatched from room object to play a sound by ID.
 */
import {RoomObjectFurnitureActionEvent} from './RoomObjectFurnitureActionEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectPlaySoundIdEvent extends RoomObjectFurnitureActionEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectPlaySoundIdEvent.as::PLAY_SOUND
    public static readonly PLAY_SOUND = 'ROPSIE_PLAY_SOUND';
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectPlaySoundIdEvent.as::PLAY_SOUND_AT_PITCH
    public static readonly PLAY_SOUND_AT_PITCH = 'ROPSIE_PLAY_SOUND_AT_PITCH';

    constructor(type: string, object: IRoomObject, soundId: string, pitch: number = 1)
    {
        super(type, object);
        this._soundId = soundId;
        this._pitch = pitch;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectPlaySoundIdEvent.as::_soundId
    private _soundId: string;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectPlaySoundIdEvent.as::get soundId()
    get soundId(): string
    {
        return this._soundId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectPlaySoundIdEvent.as::_pitch
    private _pitch: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectPlaySoundIdEvent.as::get pitch()
    get pitch(): number
    {
        return this._pitch;
    }
}
