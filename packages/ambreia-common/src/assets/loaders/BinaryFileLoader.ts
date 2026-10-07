import {BaseFileLoader} from './BaseFileLoader';

/**
 * BinaryFileLoader
 *
 * Based on AS3: com.sulake.core.assets.loaders.BinaryFileLoader
 *
 * Loader for binary files. Loads content as ArrayBuffer.
 */
export class BinaryFileLoader extends BaseFileLoader 
{
    protected _abortController: AbortController | null = null;

    constructor(mimeType: string, url?: string, id: number = -1) 
    {
        super(mimeType, url, id);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/loaders/BinaryFileLoader.as::_data
    protected _data: ArrayBuffer | null = null;

    /**
     * The loaded data as ArrayBuffer
     */
    get data(): ArrayBuffer | null 
    {
        return this._data;
    }

    /**
     * The loaded content
     */
    // AS3: .../src/com/sulake/core/assets/loaders/BinaryFileLoader.as::get content()
    get content(): unknown 
    {
        return this._data;
    }

    /**
     * The raw bytes loaded
     */
    // AS3: .../src/com/sulake/core/assets/loaders/BinaryFileLoader.as::get bytes()
    get bytes(): ArrayBuffer | null 
    {
        return this._data;
    }

    /**
     * Load content from a URL
     */
    // AS3: .../src/com/sulake/core/assets/loaders/BinaryFileLoader.as::load()
    load(url: string): void 
    {
        this._url = url;
        this._data = null;
        this._errorCode = 0;

        // Abort any pending request
        if(this._abortController) 
        {
            this._abortController.abort();
        }

        this._abortController = new AbortController();

        this.handleLoadEvent('open');

        fetch(this._url, {signal: this._abortController.signal})
            .then(async (response) => 
            {
                if(!response.ok) 
                {
                    this._status = response.status;
                    this.handleLoadEvent('ioError', response.status);
                    return;
                }

                this._status = response.status;
                this.handleLoadEvent('status', response.status);

                // Get content length for progress tracking
                const contentLength = response.headers.get('content-length');
                this._bytesTotal = contentLength ? parseInt(contentLength, 10) : 0;

                // Read the response as ArrayBuffer
                this._data = await response.arrayBuffer();
                this._bytesLoaded = this._data.byteLength;

                this.handleLoadEvent('complete');
            })
            .catch((error) => 
            {
                if(error.name === 'AbortError') 
                {
                    // Request was aborted, don't report as error
                    return;
                }

                if(error.name === 'TypeError' && error.message.includes('network')) 
                {
                    this.handleLoadEvent('ioError');
                }
                else 
                {
                    this.handleLoadEvent('securityError');
                }
            });
    }

    /**
     * Dispose of this loader
     */
    // AS3: .../src/com/sulake/core/assets/loaders/BinaryFileLoader.as::dispose()
    dispose(): void 
    {
        if(!this._disposed) 
        {
            // Abort any pending request
            if(this._abortController) 
            {
                this._abortController.abort();
                this._abortController = null;
            }

            this._data = null;
            super.dispose();
        }
    }
}
