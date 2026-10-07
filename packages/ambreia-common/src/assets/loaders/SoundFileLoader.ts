import {BinaryFileLoader} from './BinaryFileLoader';
import {Logger} from '../../utils/Logger';

/**
 * SoundFileLoader
 *
 * Based on AS3: com.sulake.core.assets.loaders.SoundFileLoader
 *
 * Loader for audio files. Decodes content to AudioBuffer using Web Audio API.
 */
export class SoundFileLoader extends BinaryFileLoader
{
    private _audioContext: AudioContext | null = null;

    constructor(mimeType: string, url?: string, id: number = -1)
    {
        super(mimeType, url, id);
    }

    private _audioBuffer: AudioBuffer | null = null;

    /**
	 * The decoded audio buffer
	 */
    get audioBuffer(): AudioBuffer | null
    {
        return this._audioBuffer;
    }

    /**
	 * The loaded content
	 */
    override get content(): unknown
    {
        return this._audioBuffer;
    }

    /**
	 * Dispose of this loader
	 */
    override dispose(): void
    {
        if(!this._disposed)
        {
            this._audioBuffer = null;

            if(this._audioContext)
            {
                this._audioContext.close().catch(() =>
                {
                });

                this._audioContext = null;
            }

            super.dispose();
        }
    }

    /**
	 * Override to decode audio after loading
	 */
    protected override handleLoadEvent(type: string, httpStatus?: number): void
    {
        if(type === 'complete' && this._data)
        {
            this.decodeAudio();

            return; // Don't emit complete until audio is decoded
        }

        super.handleLoadEvent(type, httpStatus);
    }

    /**
	 * Decode binary content to AudioBuffer
	 */
    private async decodeAudio(): Promise<void>
    {
        if(!this._data)
        {
            super.handleLoadEvent('complete');

            return;
        }

        try
        {
            // Create or reuse AudioContext
            if(!this._audioContext)
            {
                this._audioContext = new AudioContext();
            }

            // Decode the audio data
            this._audioBuffer = await this._audioContext.decodeAudioData(this._data.slice(0));

            super.handleLoadEvent('complete');
        }
        catch (e)
        {
            Logger.getLogger('core.assets.loaders.SoundFileLoader').error('Error decoding audio:', e);

            super.handleLoadEvent('ioError');
        }
    }
}
