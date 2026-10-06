import type EventEmitter from 'eventemitter3';
import {OrderedMap} from '@core/utils/OrderedMap';
import {Logger} from '@core/utils/Logger';
import {SoundContext} from '../SoundContext';
import {HabboSoundWithPitch} from '../HabboSoundWithPitch';
import {RoomEngineObjectSamplePlaybackEvent} from '@habbo/room/events/RoomEngineObjectSamplePlaybackEvent';
import type {HabboSoundManagerFlash10} from '../HabboSoundManagerFlash10';

const log = Logger.getLogger('habbo.sound.furni.FurniSamplePlaybackManager');

/**
 * The sound a piece of furniture makes. The room engine says when a sample-playing object appears,
 * plays, changes pitch or goes; this loads the sample once per object and keeps it until the
 * object is disposed.
 *
 * Two maps rather than one, as in AS3: a sample already downloading is not downloaded again, and
 * the pitch an object was initialised with is remembered separately because the sound it applies
 * to does not exist yet when the initialisation event arrives.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/sound/furni/FurniSamplePlaybackManager.as
 */
export class FurniSamplePlaybackManager
{
    // AS3: .../FurniSamplePlaybackManager.as::_soundManager
    private _soundManager: HabboSoundManagerFlash10 | null;

    // AS3: .../FurniSamplePlaybackManager.as::_roomEvents
    private _roomEvents: EventEmitter | null;

    private _disposed: boolean = false;

    // AS3: .../FurniSamplePlaybackManager.as::_loadedSamples
    // Room object id → its sound.
    private _loadedSamples: OrderedMap<number, HabboSoundWithPitch> | null = new OrderedMap();

    // AS3: .../FurniSamplePlaybackManager.as::_loadingSamples
    // AS3 keys this by the `Sound` it started, holding the object id as the value; the fetch is
    // keyed by object id here, which is the same set with one less indirection.
    private _loadingSamples: Set<number> = new Set();

    // AS3: .../FurniSamplePlaybackManager.as::_pitches
    // Name DERIVED (`_SafeStr_5858`): object id → the pitch it was initialised with, kept because
    // the sound it belongs to has not finished loading when that event arrives.
    private _pitches: OrderedMap<number, number> | null = new OrderedMap();

    // AS3: .../FurniSamplePlaybackManager.as::_volume
    private _volume: number = 1;

    // AS3: .../FurniSamplePlaybackManager.as::FurniSamplePlaybackManager()
    constructor(soundManager: HabboSoundManagerFlash10, roomEvents: EventEmitter)
    {
        this._soundManager = soundManager;
        this._roomEvents = roomEvents;

        this._roomEvents.on(RoomEngineObjectSamplePlaybackEvent.ROOM_OBJECT_INITIALIZED, this.onRoomObjectInitialized);
        this._roomEvents.on(RoomEngineObjectSamplePlaybackEvent.ROOM_OBJECT_DISPOSED, this.onRoomObjectDisposed);
        this._roomEvents.on(RoomEngineObjectSamplePlaybackEvent.PLAY_SAMPLE, this.onRoomObjectPlaySample);
        this._roomEvents.on(RoomEngineObjectSamplePlaybackEvent.CHANGE_PITCH, this.onRoomObjectChangeSamplePitch);
    }

    // AS3: .../FurniSamplePlaybackManager.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../FurniSamplePlaybackManager.as::updateVolume()
    updateVolume(volume: number): void
    {
        this._volume = volume;

        if(this._loadedSamples === null) return;

        for(const sound of this._loadedSamples.values())
        {
            sound.volume = volume;
        }
    }

    /**
     * AS3: .../FurniSamplePlaybackManager.as::onRoomObjectInitializedEvent()
     *
     * A sample id of -1 means the object makes no sound at all. The pitch is re-registered rather
     * than updated — AS3 removes the key first, which moves it to the end of its map.
     */
    private onRoomObjectInitialized = (event: RoomEngineObjectSamplePlaybackEvent): void =>
    {
        if(event.sampleId === -1) return;

        this.addSampleForFurni(event.objectId, event.sampleId);

        if(this._pitches?.getValue(event.objectId) !== null) this._pitches?.remove(event.objectId);

        this._pitches?.add(event.objectId, event.pitch);
    };

    // AS3: .../FurniSamplePlaybackManager.as::onRoomObjectDisposedEvent()
    private onRoomObjectDisposed = (event: RoomEngineObjectSamplePlaybackEvent): void =>
    {
        this.removeSampleForFurni(event.objectId);
    };

    // AS3: .../FurniSamplePlaybackManager.as::onRoomObjectPlaySampleEvent()
    private onRoomObjectPlaySample = (event: RoomEngineObjectSamplePlaybackEvent): void =>
    {
        if(this._loadedSamples?.getValue(event.objectId) == null) return;

        this.playSample(event.objectId);
    };

    // AS3: .../FurniSamplePlaybackManager.as::onRoomObjectChangeSamplePitchEvent()
    private onRoomObjectChangeSamplePitch = (event: RoomEngineObjectSamplePlaybackEvent): void =>
    {
        if(this._loadedSamples?.getValue(event.objectId) == null) return;

        this.changeSamplePitch(event.objectId, event.pitch);
    };

    // AS3: .../FurniSamplePlaybackManager.as::addSampleForFurni()
    private addSampleForFurni(objectId: number, sampleId: number): void
    {
        if(this._loadedSamples?.getValue(objectId) != null) return;

        if(this._loadingSamples.has(objectId)) return;

        void this.loadSample(sampleId, objectId);
    }

    // AS3: .../FurniSamplePlaybackManager.as::removeSampleForFurni()
    // The sound is unregistered from the update loop before it is disposed — it is what drives its
    // own pitch envelope.
    private removeSampleForFurni(objectId: number): void
    {
        const sound = this._loadedSamples?.getValue(objectId) ?? null;

        if(sound === null) return;

        this._soundManager?.removeUpdateReceiver(sound);
        sound.dispose();
        this._loadedSamples?.remove(objectId);
    }

    // AS3: .../FurniSamplePlaybackManager.as::playSample()
    // Stopped first: a furni sample retriggers from the start rather than layering over itself.
    private playSample(objectId: number): void
    {
        const sound = this._loadedSamples?.getValue(objectId) ?? null;

        if(sound === null) return;

        sound.stop();
        sound.play();
    }

    // AS3: .../FurniSamplePlaybackManager.as::changeSamplePitch()
    private changeSamplePitch(objectId: number, pitch: number): void
    {
        this._loadedSamples?.getValue(objectId)?.setPitch(pitch);
    }

    /**
     * AS3: .../FurniSamplePlaybackManager.as::loadSample() + onSampleLoadComplete() + ioErrorHandler()
     *
     * The dynamic-download samples URL template, with `%typeid%` replaced. AS3 splits this across
     * a `Sound.load()` and two listeners; one round trip here.
     */
    private async loadSample(sampleId: number, objectId: number): Promise<void>
    {
        if(this._soundManager === null) return;

        const context = SoundContext.context;

        if(context === null) return;

        const base = this._soundManager.getProperty('flash.dynamic.download.url');
        const template = this._soundManager.getProperty('flash.dynamic.download.samples.template');
        const url = (base + template).replace('%typeid%', sampleId.toString());

        this._loadingSamples.add(objectId);

        try
        {
            const response = await fetch(url);

            if(!response.ok) throw new Error(`HTTP ${response.status}`);

            const buffer = await context.decodeAudioData(await response.arrayBuffer());

            // AS3 checks `disposed` first — a room left while a sample was in flight must not
            // register a sound against a manager that is gone.
            if(this._disposed || !this._loadingSamples.has(objectId)) return;

            const sound = new HabboSoundWithPitch(buffer, this._pitches?.getValue(objectId) ?? 1);

            this._soundManager.registerUpdateReceiver(sound, 0);
            sound.volume = this._volume;
            this._loadedSamples?.add(objectId, sound);
        }
        catch (error)
        {
            log.warn(`Error loading sound ${url} text ${String(error)}`);
        }
        finally
        {
            this._loadingSamples.delete(objectId);
        }
    }

    /**
     * AS3: .../FurniSamplePlaybackManager.as::dispose()
     *
     * **AS3 never sets `_disposed`** here either — a slip AS3 makes in its sample classes too, and
     * with the same consequence: `disposed` keeps answering false. Kept, because the flag is read
     * inside its own load callback (`onSampleLoadComplete`), so setting it would change behaviour
     * rather than merely tidy it.
     */
    dispose(): void
    {
        if(this._roomEvents !== null)
        {
            this._roomEvents.off(
                RoomEngineObjectSamplePlaybackEvent.ROOM_OBJECT_INITIALIZED, this.onRoomObjectInitialized
            );
            this._roomEvents.off(RoomEngineObjectSamplePlaybackEvent.ROOM_OBJECT_DISPOSED, this.onRoomObjectDisposed);
            this._roomEvents.off(RoomEngineObjectSamplePlaybackEvent.PLAY_SAMPLE, this.onRoomObjectPlaySample);
            this._roomEvents.off(
                RoomEngineObjectSamplePlaybackEvent.CHANGE_PITCH, this.onRoomObjectChangeSamplePitch
            );
            this._roomEvents = null;
        }

        this._loadedSamples?.dispose();
        this._loadedSamples = null;
        this._loadingSamples.clear();
        this._pitches?.dispose();
        this._pitches = null;
        this._soundManager = null;
    }
}
