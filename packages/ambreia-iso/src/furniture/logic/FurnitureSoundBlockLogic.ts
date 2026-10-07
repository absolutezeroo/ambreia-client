/**
 * FurnitureSoundBlockLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureSoundBlockLogic.as
 *
 * Logic for sound block furniture (sample playback with semitone pitch).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectSamplePlaybackEvent} from '../../scene/events/RoomObjectSamplePlaybackEvent';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureSoundBlockLogic extends FurnitureMultiStateLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureSoundBlockLogic.as::HIGHEST_SEMITONE
    private static readonly HIGHEST_SEMITONE = 12;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureSoundBlockLogic.as::LOWEST_SEMITONE
    private static readonly LOWEST_SEMITONE = -12;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureSoundBlockLogic.as::STATE_UNINITIALIZED
    private static readonly STATE_UNINITIALIZED = -1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureSoundBlockLogic.as::_state
    private _state: number = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureSoundBlockLogic.as::_sampleId
    private _sampleId: number = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureSoundBlockLogic.as::_noPitch
    private _noPitch: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureSoundBlockLogic.as::_lastLocZ
    private _lastLocZ: number = 0;

    override dispose(): void
    {
        if(this._state !== FurnitureSoundBlockLogic.STATE_UNINITIALIZED && this.object !== null)
        {
            this.eventDispatcher?.emit(
                RoomObjectSamplePlaybackEvent.ROOM_OBJECT_DISPOSED,
                new RoomObjectSamplePlaybackEvent(RoomObjectSamplePlaybackEvent.ROOM_OBJECT_DISPOSED, this.object, this._sampleId)
            );
        }

        super.dispose();
    }

    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectSamplePlaybackEvent.PLAY_SAMPLE,
            RoomObjectSamplePlaybackEvent.ROOM_OBJECT_DISPOSED,
            RoomObjectSamplePlaybackEvent.ROOM_OBJECT_INITIALIZED
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(data === null)
        {
            return;
        }

        const config = data as { sound?: { sample?: { id?: number; nopitch?: string } } };

        if(!config.sound?.sample)
        {
            return;
        }

        this._sampleId = config.sound.sample.id ?? -1;
        this._noPitch = config.sound.sample.nopitch === 'true';

        this.object?.getModelController()?.setNumber(
            RoomObjectVariableEnum.FURNITURE_SOUNDBLOCK_RELATIVE_ANIMATION_SPEED,
            1
        );
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if(this.object === null)
        {
            return;
        }

        const location = this.object.getLocation();
        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && typeof dataMessage.state === 'number')
        {
            if(this._state === FurnitureSoundBlockLogic.STATE_UNINITIALIZED &&
				this.object.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) === 1)
            {
                this._lastLocZ = location.z;

                this.eventDispatcher?.emit(
                    RoomObjectSamplePlaybackEvent.ROOM_OBJECT_INITIALIZED,
                    new RoomObjectSamplePlaybackEvent(RoomObjectSamplePlaybackEvent.ROOM_OBJECT_INITIALIZED, this.object, this._sampleId, this.calculatePitch(location.z))
                );
            }

            if(this._state !== FurnitureSoundBlockLogic.STATE_UNINITIALIZED && location !== null)
            {
                if(this._lastLocZ !== location.z)
                {
                    this.eventDispatcher?.emit(
                        RoomObjectSamplePlaybackEvent.CHANGE_PITCH,
                        new RoomObjectSamplePlaybackEvent(RoomObjectSamplePlaybackEvent.CHANGE_PITCH, this.object, this._sampleId, this.calculatePitch(location.z))
                    );

                    this._lastLocZ = location.z;
                }
            }

            if(this._state !== FurnitureSoundBlockLogic.STATE_UNINITIALIZED &&
				dataMessage.state !== this._state && location !== null)
            {
                this.playSample(location.z);
            }

            this._state = dataMessage.state;
        }
    }

    private playSample(height: number): void
    {
        if(this.object === null)
        {
            return;
        }

        const pitch = this.calculatePitch(height);

        this.object.getModelController()?.setNumber(
            RoomObjectVariableEnum.FURNITURE_SOUNDBLOCK_RELATIVE_ANIMATION_SPEED,
            pitch
        );

        this.eventDispatcher?.emit(
            RoomObjectSamplePlaybackEvent.PLAY_SAMPLE,
            new RoomObjectSamplePlaybackEvent(RoomObjectSamplePlaybackEvent.PLAY_SAMPLE, this.object, this._sampleId, pitch)
        );
    }

    private calculatePitch(height: number): number
    {
        let semitone = Math.trunc(height * 2);

        if(semitone > FurnitureSoundBlockLogic.HIGHEST_SEMITONE)
        {
            semitone = Math.min(0, FurnitureSoundBlockLogic.LOWEST_SEMITONE + (semitone - FurnitureSoundBlockLogic.HIGHEST_SEMITONE) - 1);
        }

        return this._noPitch ? 1 : Math.pow(2, semitone / 12);
    }
}
