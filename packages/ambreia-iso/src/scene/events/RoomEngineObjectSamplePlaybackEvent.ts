/**
 * RoomEngineObjectSamplePlaybackEvent
 *
 * @see source_as_win63/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as
 *
 * Event dispatched for sample playback from room objects (furni that play a sound sample).
 */
import {RoomEngineObjectEvent} from './RoomEngineObjectEvent';

export class RoomEngineObjectSamplePlaybackEvent extends RoomEngineObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as::ROOM_OBJECT_INITIALIZED
    public static readonly ROOM_OBJECT_INITIALIZED = 'REOSPE_ROOM_OBJECT_INITIALIZED';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as::ROOM_OBJECT_DISPOSED
    public static readonly ROOM_OBJECT_DISPOSED = 'REOSPE_ROOM_OBJECT_DISPOSED';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as::PLAY_SAMPLE
    public static readonly PLAY_SAMPLE = 'REOSPE_PLAY_SAMPLE';
    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as::CHANGE_PITCH
    public static readonly CHANGE_PITCH = 'REOSPE_CHANGE_PITCH';

    constructor(
        type: string,
        roomId: number,
        objectId: number,
        category: number,
        sampleId: number,
        pitch: number = 1
    )
    {
        super(type, roomId, objectId, category);
        this._sampleId = sampleId;
        this._pitch = pitch;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as::_sampleId
    private _sampleId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as::get sampleId()
    get sampleId(): number
    {
        return this._sampleId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as::_pitch
    private _pitch: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectSamplePlaybackEvent.as::get pitch()
    get pitch(): number
    {
        return this._pitch;
    }
}
