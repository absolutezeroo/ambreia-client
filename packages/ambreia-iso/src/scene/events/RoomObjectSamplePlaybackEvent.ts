/**
 * RoomObjectSamplePlaybackEvent
 *
 * @see source_as_win63/habbo/room/events/RoomObjectSamplePlaybackEvent.as
 *
 * Event dispatched from room object for sample playback (sound machine tracks).
 */
import {RoomObjectFurnitureActionEvent} from './RoomObjectFurnitureActionEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectSamplePlaybackEvent extends RoomObjectFurnitureActionEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectSamplePlaybackEvent.as::ROOM_OBJECT_INITIALIZED
    public static readonly ROOM_OBJECT_INITIALIZED = 'ROPSPE_ROOM_OBJECT_INITIALIZED';
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectSamplePlaybackEvent.as::ROOM_OBJECT_DISPOSED
    public static readonly ROOM_OBJECT_DISPOSED = 'ROPSPE_ROOM_OBJECT_DISPOSED';
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectSamplePlaybackEvent.as::PLAY_SAMPLE
    public static readonly PLAY_SAMPLE = 'ROPSPE_PLAY_SAMPLE';
    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectSamplePlaybackEvent.as::CHANGE_PITCH
    public static readonly CHANGE_PITCH = 'ROPSPE_CHANGE_PITCH';

    constructor(type: string, object: IRoomObject, sampleId: number, pitch: number = 1)
    {
        super(type, object);
        this._sampleId = sampleId;
        this._pitch = pitch;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectSamplePlaybackEvent.as::_sampleId
    private _sampleId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectSamplePlaybackEvent.as::get sampleId()
    get sampleId(): number
    {
        return this._sampleId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectSamplePlaybackEvent.as::_pitch
    private _pitch: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectSamplePlaybackEvent.as::get pitch()
    get pitch(): number
    {
        return this._pitch;
    }
}
