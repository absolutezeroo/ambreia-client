import type {IHabboSound} from './IHabboSound';
import {SoundContext} from './SoundContext';

/**
 * A generic sound effect: one decoded buffer, played from the start, optionally looping.
 *
 * Flash mapping. `flash.media.Sound` is an `AudioBuffer` here, and `SoundChannel` — which
 * Flash creates per `play()` and which owns the transform, the position and the "complete"
 * event — is an `AudioBufferSourceNode` plus the `GainNode` it runs through. Both are
 * discarded and rebuilt on every `play()`, exactly as Flash discards and rebuilds the
 * channel, because a source node is single-use.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/sound/HabboSoundBase.as
 */
export class HabboSoundBase implements IHabboSound
{
    // AS3: .../sound/HabboSoundBase.as::HabboSoundBase()
    constructor(soundObject: AudioBuffer, loops: number = 0)
    {
        this._soundObject = soundObject;
        this._volume = 1;
        this._complete = false;
        this._loops = loops;
    }

    /** The decoded buffer. AS3's `flash.media.Sound`. */
    // AS3: .../sound/HabboSoundBase.as::_soundObject
    protected _soundObject: AudioBuffer | null = null;

    /**
     * AS3's `SoundChannel`, in the two nodes that carry its responsibilities: the source
     * plays and reports completion, the gain holds what `SoundTransform` held.
     */
    // AS3: .../sound/HabboSoundBase.as::_SafeStr_5306
    private _soundChannel: {source: AudioBufferSourceNode; gain: GainNode; startedAt: number} | null = null;

    // AS3: .../sound/HabboSoundBase.as::_SafeStr_4819
    private _complete: boolean;

    // AS3: .../sound/HabboSoundBase.as::_volume
    private _volume: number;

    // AS3: .../sound/HabboSoundBase.as::_SafeStr_7674
    private _loops: number;

    // AS3: .../sound/HabboSoundBase.as::getSoundObject()
    protected getSoundObject(): AudioBuffer | null
    {
        return this._soundObject;
    }

    // AS3: .../sound/HabboSoundBase.as::getSoundChannel()
    protected getSoundChannel(): {source: AudioBufferSourceNode; gain: GainNode; startedAt: number} | null
    {
        return this._soundChannel;
    }

    // AS3: .../sound/HabboSoundBase.as::setSoundChannel()
    protected setSoundChannel(channel: {source: AudioBufferSourceNode; gain: GainNode; startedAt: number} | null): void
    {
        this._soundChannel = channel;
    }

    // AS3: .../sound/HabboSoundBase.as::setComplete()
    protected setComplete(complete: boolean): void
    {
        this._complete = complete;
    }

    /**
     * `_startPosition` is AS3's ignored `play()` argument: the base class always starts at 0
     * and passes the loop count instead, so the parameter is kept for the interface and not
     * read — as in AS3.
     */
    // AS3: .../sound/HabboSoundBase.as::play()
    play(_startPosition: number = 0): boolean
    {
        this._complete = false;

        this.startChannel(this._loops);
        this.setChannelVolume(this._volume);

        return true;
    }

    // AS3: .../sound/HabboSoundBase.as::stop()
    stop(): boolean
    {
        if(this._soundChannel !== null)
        {
            try
            {
                this._soundChannel.source.stop();
            }
            catch
            {
                // Already stopped or never started; Flash's SoundChannel.stop() is a no-op
                // in the same situation.
            }
        }

        return true;
    }

    // AS3: .../sound/HabboSoundBase.as::get volume()
    get volume(): number
    {
        return this._volume;
    }

    // AS3: .../sound/HabboSoundBase.as::set volume()
    set volume(value: number)
    {
        this._volume = value;

        this.setChannelVolume(value);
    }

    // AS3: .../sound/HabboSoundBase.as::setChannelVolume()
    protected setChannelVolume(value: number): void
    {
        if(this._soundChannel !== null)
        {
            this._soundChannel.gain.gain.value = value;
        }
    }

    /**
     * Milliseconds since the channel started, matching `SoundChannel.position`. AS3
     * dereferences the channel unguarded and throws when nothing is playing; this returns 0
     * rather than throwing, since the only caller compares it against a length.
     */
    // AS3: .../sound/HabboSoundBase.as::get position()
    get position(): number
    {
        const context = SoundContext.context;

        if(this._soundChannel === null || context === null)
        {
            return 0;
        }

        return (context.currentTime - this._soundChannel.startedAt) * 1000;
    }

    // AS3: .../sound/HabboSoundBase.as::set position()
    set position(_value: number)
    {
    }

    /** Milliseconds, as Flash's `Sound.length` reports it — `AudioBuffer.duration` is seconds. */
    // AS3: .../sound/HabboSoundBase.as::get length()
    get length(): number
    {
        return (this._soundObject?.duration ?? 0) * 1000;
    }

    /**
     * AS3 answers `!isBuffering`: a Flash `Sound` streams and is only ready once enough has
     * arrived. An `AudioBuffer` exists only after `decodeAudioData()` resolved, so there is
     * nothing left to wait for.
     */
    // AS3: .../sound/HabboSoundBase.as::get ready()
    get ready(): boolean
    {
        return this._soundObject !== null;
    }

    /**
     * Inverted in AS3 — `finished` returns `!_complete`, so it is *true* while the sound is
     * still playing and *false* once the complete event has fired. Ported as written:
     * AS3's song sequencer read it this way, and flipping it would diverge from the source.
     */
    // AS3: .../sound/HabboSoundBase.as::get finished()
    get finished(): boolean
    {
        return !this._complete;
    }

    // AS3: .../sound/HabboSoundBase.as::get fadeOutSeconds()
    get fadeOutSeconds(): number
    {
        return 0;
    }

    // AS3: .../sound/HabboSoundBase.as::set fadeOutSeconds()
    set fadeOutSeconds(_value: number)
    {
    }

    // AS3: .../sound/HabboSoundBase.as::get fadeInSeconds()
    get fadeInSeconds(): number
    {
        return 0;
    }

    // AS3: .../sound/HabboSoundBase.as::set fadeInSeconds()
    set fadeInSeconds(_value: number)
    {
    }

    /**
     * Builds the channel Flash's `Sound.play(0, loops)` would have returned.
     *
     * TS-only helper: Flash's `loops` is a repeat count, Web Audio's `loop` is an unbounded
     * boolean, so the count is honoured by re-arming the source on completion rather than by
     * looping the node.
     */
    private startChannel(loops: number): void
    {
        const context = SoundContext.context;
        const buffer = this._soundObject;

        if(context === null || buffer === null)
        {
            return;
        }

        SoundContext.resume();

        // Detach the old channel's handler before stopping it: `stop()` fires `onended`, and
        // a previous channel with loops left would otherwise re-arm itself over this one.
        const previous = this.getSoundChannel();

        if(previous !== null)
        {
            previous.source.onended = null;
        }

        this.stop();

        const gain = context.createGain();
        const source = context.createBufferSource();

        source.buffer = buffer;
        gain.gain.value = this._volume;

        source.connect(gain);
        gain.connect(context.destination);

        let remaining = loops;

        source.onended = (): void =>
        {
            if(remaining > 0)
            {
                remaining -= 1;

                this.startChannel(remaining);

                return;
            }

            // AS3: HabboSoundBase.as::onComplete() — the Sound's "complete" event.
            this.setComplete(true);
        };

        source.start(0);

        this.setSoundChannel({source, gain, startedAt: context.currentTime});
    }

    // AS3: .../sound/HabboSoundBase.as::dispose()
    dispose(): void
    {
        this.stop();

        this._soundChannel = null;
        this._soundObject = null;
    }
}
