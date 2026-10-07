import {BinaryFileLoader} from './BinaryFileLoader';
import {Logger} from '../../utils/Logger';

/**
 * TextFileLoader
 *
 * Based on AS3: com.sulake.core.assets.loaders.TextFileLoader
 *
 * Loader for text files. Extends BinaryFileLoader but converts
 * content to string.
 */
export class TextFileLoader extends BinaryFileLoader
{
    private _textContent: string | null = null;

    constructor(mimeType: string, url?: string, id: number = -1)
    {
        super(mimeType, url, id);
    }

    /**
	 * The loaded content
	 */
    override get content(): unknown
    {
        if(this._textContent === null && this._data)
        {
            this.decodeContent();
        }

        return this._textContent;
    }

    /**
	 * The loaded text content
	 */
    get text(): string | null
    {
        if(this._textContent === null && this._data)
        {
            this.decodeContent();
        }

        return this._textContent;
    }

    /**
	 * Load content from a URL
	 */
    override load(url: string): void
    {
        this._textContent = null;
        super.load(url);
    }

    /**
	 * Dispose of this loader
	 */
    override dispose(): void
    {
        if(!this._disposed)
        {
            this._textContent = null;
            super.dispose();
        }
    }

    /**
	 * Override to decode content after loading
	 */
    protected override handleLoadEvent(type: string, httpStatus?: number): void
    {
        if(type === 'complete')
        {
            this.decodeContent();
        }

        super.handleLoadEvent(type, httpStatus);
    }

    /**
	 * Decode binary content to string
	 */
    private decodeContent(): void
    {
        if(!this._data)
        {
            this._textContent = '';
            return;
        }

        try
        {
            const decoder = new TextDecoder('utf-8');
            this._textContent = decoder.decode(this._data);
        }
        catch (e)
        {
            Logger.getLogger('core.assets.loaders.TextFileLoader').error('Error decoding content:', e);
            this._textContent = '';
        }
    }
}
