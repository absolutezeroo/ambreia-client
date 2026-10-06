import type EventEmitter from 'eventemitter3';
import {Component, type IContext} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets';
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {Logger} from '@core/utils/Logger';

import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import {RoomEngineObjectPlaySoundEvent} from '@habbo/room/events/RoomEngineObjectPlaySoundEvent';
import {AccountPreferencesEvent} from '@habbo/communication/messages/incoming/preferences/AccountPreferencesEvent';
import type {AccountPreferencesParser} from '@habbo/communication/messages/parser/preferences/AccountPreferencesParser';
import {GetSoundSettingsComposer} from '@habbo/communication/messages/outgoing/sound/GetSoundSettingsComposer';
import {SetSoundSettingsComposer} from '@habbo/communication/messages/outgoing/sound/SetSoundSettingsComposer';

import {releaseProvider} from '@core/runtime/releaseProvider';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_HabboNotifications} from '@iid/IIDHabboNotifications';

import type {IHabboSoundManager} from './IHabboSoundManager';
import {FurniSamplePlaybackManager} from './furni/FurniSamplePlaybackManager';
import type {IHabboSound} from './IHabboSound';
import {HabboSoundBase} from './HabboSoundBase';
import {HabboSoundWithPitch} from './HabboSoundWithPitch';

const log = Logger.getLogger('habbo.sound.HabboSoundManagerFlash10');

/**
 * HabboSoundManagerFlash10
 *
 * The sound manager. Three volume channels, a cache of generic effects keyed by sound id,
 * and ownership of the furniture sample player. AS3 also owns the music controller and the
 * song-sample manager; the RPG fork removed jukebox music, so both are gone.
 *
 * Two things about it are easy to misread:
 *
 * - **`genericVolume` starts at 0**, not 1, unlike trax and furni. Nothing is audible until
 *   `AccountPreferences` arrives and `onSoundSettingsEvent()` sets the real value. That is
 *   AS3's own initialiser, and it is why the manager asks for the settings in `init()`.
 * - **the dependencies are queued, not required.** AS3 uses `queueInterface()` here rather
 *   than the blocking dependency list, so the manager exists and answers immediately and
 *   simply plays nothing while the room engine is still coming up.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/sound/HabboSoundManagerFlash10.as
 */
export class HabboSoundManagerFlash10 extends Component implements IHabboSoundManager
{
    // DEVIATION: AS3 also listens for the song-download completion and registers itself as an
    //   update receiver, whose `update()` only drives the song-sample decoder and the song download
    //   queue. The RPG fork removed jukebox music, so neither is registered.
    // AS3: .../sound/HabboSoundManagerFlash10.as::HabboSoundManagerFlash10()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null, queueDependencies: boolean = true)
    {
        super(context, flags, assetLibrary);

        if(queueDependencies)
        {
            this.queueInterface(IID_HabboCommunicationManager, (_iid, communication: IHabboCommunicationManager) =>
            {
                this.onCommunicationManagerReady(communication);
            });
            this.queueInterface(IID_RoomEngine, (_iid, roomEngine: IRoomEngine) =>
            {
                this.onRoomEngineReady(roomEngine);
            });
            this.queueInterface(IID_HabboNotifications, (_iid, notifications: IHabboNotifications) =>
            {
                this.onNotificationsReady(notifications);
            });
        }

        log.debug('Sound manager 10 init');
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::_communication
    private _communication: IHabboCommunicationManager | null = null;

    // AS3: .../sound/HabboSoundManagerFlash10.as::_SafeStr_4568
    private _connection: IConnection | null = null;

    // AS3: .../sound/HabboSoundManagerFlash10.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;

    // AS3: .../sound/HabboSoundManagerFlash10.as::_notifications
    private _notifications: IHabboNotifications | null = null;

    /** Zero until the server's stored settings arrive — see the class comment. */
    // AS3: .../sound/HabboSoundManagerFlash10.as::_genericVolume
    private _genericVolume: number = 0;

    // AS3: .../sound/HabboSoundManagerFlash10.as::_traxVolume
    private _traxVolume: number = 1;

    // AS3: .../sound/HabboSoundManagerFlash10.as::_furniVolume
    private _furniVolume: number = 1;

    /** Effect instances, cached by sound id so a repeat play reuses one buffer. */
    // AS3: .../sound/HabboSoundManagerFlash10.as::_genericSamples
    private _genericSamples: Map<string, IHabboSound> = new Map();

    /** Last play time per sound id, in ms — the 200 ms retrigger guard in `playSound()`. */
    // AS3: .../sound/HabboSoundManagerFlash10.as::_SafeStr_5953
    private _lastPlayedAt: Map<string, number> = new Map();

    // AS3: .../sound/HabboSoundManagerFlash10.as::_furniSamplePlaybackManager
    private _furniSamplePlaybackManager: FurniSamplePlaybackManager | null = null;

    // AS3: .../sound/HabboSoundManagerFlash10.as::_SafeStr_9792
    private _muted: boolean = false;

    // TS-only: the sound-settings listener, kept so dispose() can unregister it.
    private _accountPreferencesEvent: IMessageEvent | null = null;

    // TS-only: bound room-engine listener, kept so dispose() removes the same reference.
    private readonly _onRoomEngineObjectPlaySound = (event: RoomEngineObjectPlaySoundEvent): void =>
    {
        this.onRoomEngineObjectPlaySound(event);
    };

    // AS3: .../sound/HabboSoundManagerFlash10.as::get genericVolume()
    get genericVolume(): number
    {
        return this._genericVolume;
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::set genericVolume()
    set genericVolume(value: number)
    {
        this.updateVolumeSetting(value, this._furniVolume, this._traxVolume);
        this.storeVolumeSetting();
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::get traxVolume()
    get traxVolume(): number
    {
        return this._traxVolume;
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::set traxVolume()
    set traxVolume(value: number)
    {
        this.updateVolumeSetting(this._genericVolume, this._furniVolume, value);
        this.storeVolumeSetting();
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::get furniVolume()
    get furniVolume(): number
    {
        return this._furniVolume;
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::set furniVolume()
    set furniVolume(value: number)
    {
        this.updateVolumeSetting(this._genericVolume, value, this._traxVolume);
        this.storeVolumeSetting();
    }

    /** Applies volumes without persisting them — what the settings sliders drag against. */
    // AS3: .../sound/HabboSoundManagerFlash10.as::previewVolume()
    previewVolume(generic: number, furni: number, trax: number): void
    {
        this.updateVolumeSetting(generic, furni, trax);
    }

    /**
     * Plays a generic effect, at most once every 200 ms per sound id — the guard exists
     * because several of these fire off packet arrival and would otherwise stack.
     */
    // AS3: .../sound/HabboSoundManagerFlash10.as::playSound()
    playSound(soundId: string, loops: number = 0): void
    {
        const now = Date.now();
        const lastPlayed = this._lastPlayedAt.get(soundId);

        if(lastPlayed !== undefined && (now - lastPlayed) <= 200)
        {
            return;
        }

        let sound = this._genericSamples.get(soundId) ?? null;

        if(sound === null)
        {
            const buffer = this.getSoundBySoundId(soundId);

            if(buffer !== null)
            {
                sound = new HabboSoundBase(buffer, loops);

                this._genericSamples.set(soundId, sound);
            }
        }

        if(sound === null)
        {
            // AS3 dereferences `_loc4_` unguarded on the next line and throws when the sound
            // is unknown; getSoundBySoundId() has already logged what was asked for.
            return;
        }

        sound.volume = this._genericVolume;

        this._lastPlayedAt.delete(soundId);
        this._lastPlayedAt.set(soundId, now);

        sound.play();
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::playSoundAtPitch()
    playSoundAtPitch(soundId: string, pitch: number): IHabboSound | null
    {
        const buffer = this.getSoundBySoundId(soundId);

        if(buffer === null)
        {
            return null;
        }

        const sound = new HabboSoundWithPitch(buffer, pitch);

        sound.volume = this._genericVolume;
        sound.play();

        return sound;
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::stopSound()
    stopSound(soundId: string): void
    {
        this._genericSamples.get(soundId)?.stop();
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::mute()
    mute(muted: boolean): void
    {
        this._muted = muted;

        this.updateVolumeSetting(this._genericVolume, this._furniVolume, this._traxVolume);
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::get events()
    override get events(): EventEmitter
    {
        return super.events;
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::onCommunicationManagerReady()
    private onCommunicationManagerReady(communication: IHabboCommunicationManager | null): void
    {
        if(communication === null)
        {
            return;
        }

        this._communication = communication;

        const connection = communication.connection;

        if(connection !== null)
        {
            this.onConnectionReady(connection);
            this.init();
        }
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::onRoomEngineReady()
    private onRoomEngineReady(roomEngine: IRoomEngine | null): void
    {
        if(roomEngine === null)
        {
            return;
        }

        this._roomEngine = roomEngine;

        this.init();
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::onNotificationsReady()
    private onNotificationsReady(notifications: IHabboNotifications | null): void
    {
        if(notifications === null)
        {
            return;
        }

        this._notifications = notifications;
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::onConnectionReady()
    private onConnectionReady(connection: IConnection | null): void
    {
        if(this.disposed)
        {
            return;
        }

        if(connection !== null)
        {
            this._connection = connection;
        }

        this.init();
    }

    /**
     * Runs once, when both the connection and the room engine are up — the guard is what makes
     * the three `queueInterface` callbacks safe to fire in any order.
     */
    // DEVIATION: AS3 builds the music controller and the song-sample manager here too, and its
    //   run-once guard is "the music controller exists". The RPG fork removed jukebox music, so the
    //   furniture sample player — built in the same call — is the guard instead.
    // AS3: .../sound/HabboSoundManagerFlash10.as::init()
    private init(): void
    {
        if(this._connection === null || this._roomEngine === null || this._furniSamplePlaybackManager !== null)
        {
            return;
        }

        // AS3: HabboSoundManagerFlash10.as:425 — the furniture sample player, on the room
        // engine's own event bus.
        this._furniSamplePlaybackManager = new FurniSamplePlaybackManager(this, this._roomEngine.events);
        this._roomEngine.events.on(RoomEngineObjectPlaySoundEvent.PLAY_SOUND, this._onRoomEngineObjectPlaySound);
        this._roomEngine.events.on(RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH, this._onRoomEngineObjectPlaySound);

        this._accountPreferencesEvent = new AccountPreferencesEvent(this.onSoundSettingsEvent.bind(this));

        this._connection.addMessageEvent(this._accountPreferencesEvent);
        this._connection.send(new GetSoundSettingsComposer());
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::storeVolumeSetting()
    private storeVolumeSetting(): void
    {
        this._connection?.send(new SetSoundSettingsComposer(
            Math.trunc(this._traxVolume * 100),
            Math.trunc(this._furniVolume * 100),
            Math.trunc(this._genericVolume * 100)
        ));
    }

    /**
     * The single point where the three volumes change. Muting zeroes all three without
     * touching what was stored, so unmuting restores them.
     */
    // DEVIATION: AS3 also pushes the trax volume to the music controller; the RPG fork removed
    //   jukebox music, so the trax channel is only stored (the server still persists it).
    // AS3: .../sound/HabboSoundManagerFlash10.as::updateVolumeSetting()
    private updateVolumeSetting(generic: number, furni: number, trax: number): void
    {
        if(this._muted)
        {
            this._genericVolume = 0;
            this._furniVolume = 0;
            this._traxVolume = 0;

            this._furniSamplePlaybackManager?.updateVolume(0);

            return;
        }

        this._genericVolume = generic;
        this._furniVolume = furni;
        this._traxVolume = trax;

        this._furniSamplePlaybackManager?.updateVolume(furni);
    }

    /**
     * The server stores each channel as 0-100. The `uiVolume == 1` branch is AS3's own
     * workaround for accounts whose stored value is the old boolean-ish 1 rather than a
     * percentage — it is read as "full", not as 1%.
     */
    // AS3: .../sound/HabboSoundManagerFlash10.as::onSoundSettingsEvent()
    private onSoundSettingsEvent(event: IMessageEvent): void
    {
        const parser = event.parser as AccountPreferencesParser;

        let uiVolume = parser.uiVolume;

        if(uiVolume === 1)
        {
            uiVolume = 100;
        }

        this.updateVolumeSetting(uiVolume / 100, parser.furniVolume / 100, parser.traxVolume / 100);
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::onRoomEngineObjectPlaySound()
    private onRoomEngineObjectPlaySound(event: RoomEngineObjectPlaySoundEvent): void
    {
        if(event.type === RoomEngineObjectPlaySoundEvent.PLAY_SOUND)
        {
            this.playSound(event.soundId);
        }

        if(event.type === RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH)
        {
            this.playSoundAtPitch(event.soundId, event.pitch);
        }
    }

    /**
     * Maps a sound id onto the asset the mp3 is registered under. Every id the client can
     * ask for is listed; an unknown one is logged and plays nothing, as in AS3.
     */
    // AS3: .../sound/HabboSoundManagerFlash10.as::getSoundBySoundId()
    private getSoundBySoundId(soundId: string): AudioBuffer | null
    {
        // AS3 initialises this to "" and the `default:` returns before it is read; the
        // empty initialiser is dropped here because every other branch assigns.
        let assetName: string;

        switch(soundId)
        {
            case 'HBST_call_for_help':
                assetName = 'sound_call_for_help';
                break;
            case 'HBST_guide_invitation':
                assetName = 'sound_guide_received_invitation';
                break;
            case 'HBST_guide_request':
                assetName = 'sound_guide_help_requested';
                break;
            case 'HBST_message_received':
                assetName = 'sound_console_new_message';
                break;
            case 'HBST_message_sent':
                assetName = 'sound_console_message_sent';
                break;
            case 'HBST_pixels':
                assetName = 'sound_catalogue_duckets';
                break;
            case 'HBST_purchase':
                assetName = 'sound_catalogue_cash';
                break;
            case 'HBST_respect':
                assetName = 'sound_respect_received';
                break;
            case 'CAMERA_shutter':
                assetName = 'sound_camera_shutter';
                break;
            case 'HBSTG_snowwar_get_snowball':
            case 'HBSTG_snowwar_hit1':
            case 'HBSTG_snowwar_hit2':
            case 'HBSTG_snowwar_hit3':
            case 'HBSTG_snowwar_make_snowball':
            case 'HBSTG_snowwar_miss':
            case 'HBSTG_snowwar_throw':
            case 'HBSTG_snowwar_walk':
            case 'HBSTG_ig_countdown':
            case 'HBSTG_ig_winning':
            case 'HBSTG_ig_losing':
                assetName = soundId;
                break;
            case 'FURNITURE_cuckoo_clock':
                assetName = soundId;
                break;
            default:
                log.warn(`Unknown sound request: ${soundId}`);

                return null;
        }

        return this.getSoundByAssetName(assetName);
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::getSoundByAssetName()
    private getSoundByAssetName(assetName: string): AudioBuffer | null
    {
        const asset = this.assets?.getAssetByName(assetName) ?? null;
        const content = asset?.content ?? null;

        if(!(content instanceof AudioBuffer))
        {
            log.warn(`Sound asset "${assetName}" is missing - run \`pnpm import:crypted-sounds\` in vortex-client`);

            return null;
        }

        return content;
    }

    // AS3: .../sound/HabboSoundManagerFlash10.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        if(this._connection !== null && this._accountPreferencesEvent !== null)
        {
            this._connection.removeMessageEvent(this._accountPreferencesEvent);
        }

        this._accountPreferencesEvent = null;
        this._connection = null;

        if(this._furniSamplePlaybackManager !== null)
        {
            this._furniSamplePlaybackManager.dispose();
            this._furniSamplePlaybackManager = null;
        }

        for(const sound of this._genericSamples.values())
        {
            sound.stop();
        }

        this._genericSamples.clear();
        this._lastPlayedAt.clear();

        // 🐛 These three used to read `this.release(IID_…)`, under a comment claiming this port
        // "keeps the reference count on the *holder*". It does not: `Component.queueInterface()`
        // only bumps a count on `this` when **this component provides that interface itself**,
        // and otherwise delegates to the context, which bumps it on the *provider*. The sound
        // manager provides none of these three, so `this.release()` looked for a struct that was
        // never there and threw "Attempting to release unknown interface" on every teardown.
        //
        // AS3 has it right and is followed here — it releases through the instance
        // (`_communication.release(new IIDHabboCommunicationManager())`). The cast is because the
        // three interfaces do not declare `IUnknown` in this port even though their implementations
        // are Components; releasing is a no-op on anything that is not one.
        //
        // The `HabboFriendBar.dispose()` the old comment cited as precedent is *correct*, and does
        // not generalise: that component lists `IID_HabboFriendBarView` in its own provided
        // interfaces, so `this.release()` there really does find its own struct.
        if(this._communication !== null)
        {
            releaseProvider(this._communication, IID_HabboCommunicationManager);
            this._communication = null;
        }

        if(this._roomEngine !== null)
        {
            this._roomEngine.events.off(RoomEngineObjectPlaySoundEvent.PLAY_SOUND, this._onRoomEngineObjectPlaySound);
            this._roomEngine.events.off(RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH, this._onRoomEngineObjectPlaySound);
            releaseProvider(this._roomEngine, IID_RoomEngine);
            this._roomEngine = null;
        }

        if(this._notifications !== null)
        {
            releaseProvider(this._notifications, IID_HabboNotifications);
            this._notifications = null;
        }

        super.dispose();
    }
}
