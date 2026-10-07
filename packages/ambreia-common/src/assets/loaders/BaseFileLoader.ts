import {EventEmitter} from 'eventemitter3';
import {Logger} from '../../utils/Logger';
import type {IAssetLoader} from './IAssetLoader';
import {AssetLoaderErrorCodes} from './IAssetLoader';
import {AssetLoaderEvent, AssetLoaderEventType} from './AssetLoaderEvent';

const log = Logger.getLogger('core.assets.loaders.BaseFileLoader');

/**
 * BaseFileLoader
 *
 * Based on AS3: com.sulake.core.assets.loaders.class_37
 *
 * Base class for all file loaders. Provides common functionality
 * for error handling, retry logic, and event dispatching.
 */
export abstract class BaseFileLoader implements IAssetLoader
{
    /**
	 * Maximum number of retries on error
	 */
    protected static readonly MAX_RETRIES: number = 2;

    protected readonly _events: EventEmitter = new EventEmitter();
    protected _status: number = 0;
    protected _retryCount: number = 0;

    constructor(mimeType: string, url?: string, id: number = -1)
    {
        this._mimeType = mimeType;
        this._id = id;

        if(url)
        {
            this.load(url);
        }
    }

    protected _url: string = '';

    /**
	 * The URL being loaded
	 */
    get url(): string
    {
        return this._url;
    }

    protected _mimeType: string;

    /**
	 * The MIME type
	 */
    get mimeType(): string
    {
        return this._mimeType;
    }

    protected _errorCode: number = AssetLoaderErrorCodes.NONE;

    /**
	 * Error code if loading failed
	 */
    get errorCode(): number
    {
        return this._errorCode;
    }

    protected _bytesLoaded: number = 0;

    /**
	 * Number of bytes loaded
	 */
    get bytesLoaded(): number
    {
        return this._bytesLoaded;
    }

    protected _bytesTotal: number = 0;

    /**
	 * Total bytes to load
	 */
    get bytesTotal(): number
    {
        return this._bytesTotal;
    }

    protected _disposed: boolean = false;

    /**
	 * Whether this loader has been disposed
	 */
    get disposed(): boolean
    {
        return this._disposed;
    }

    protected _id: number;

    /**
	 * Loader ID
	 */
    get id(): number
    {
        return this._id;
    }

    /**
	 * Event emitter for loader events
	 */
    get events(): EventEmitter
    {
        return this._events;
    }

    /**
	 * The loaded content (override in subclass)
	 */
    abstract get content(): unknown;

    /**
	 * The raw bytes loaded (override in subclass)
	 */
    abstract get bytes(): ArrayBuffer | null;

    /**
	 * Load content from a URL (override in subclass)
	 */
    abstract load(url: string): void;

    /**
	 * Dispose of this loader
	 */
    dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._events.removeAllListeners();
        }
    }

    /**
	 * Handle loading events and dispatch appropriate AssetLoaderEvents
	 */
    protected handleLoadEvent(type: string, httpStatus?: number): void
    {
        if(this._disposed)
        {
            if(type === 'complete') log.warn(`handleLoadEvent('complete') skipped: loader already disposed (url=${this._url})`);

            return;
        }

        if(httpStatus !== undefined)
        {
            this._status = httpStatus;
        }

        switch(type)
        {
            case 'status':
                this._events.emit(AssetLoaderEventType.STATUS, new AssetLoaderEvent(AssetLoaderEventType.STATUS, this._status));
                break;

            case 'complete':
                this._events.emit(AssetLoaderEventType.COMPLETE, new AssetLoaderEvent(AssetLoaderEventType.COMPLETE, this._status));
                break;

            case 'unload':
                this._events.emit(AssetLoaderEventType.UNLOAD, new AssetLoaderEvent(AssetLoaderEventType.UNLOAD, this._status));
                break;

            case 'open':
                this._events.emit(AssetLoaderEventType.OPEN, new AssetLoaderEvent(AssetLoaderEventType.OPEN, this._status));
                break;

            case 'progress':
                this._events.emit(AssetLoaderEventType.PROGRESS, new AssetLoaderEvent(AssetLoaderEventType.PROGRESS, this._status));
                break;

            case 'ioError':
                this._errorCode = AssetLoaderErrorCodes.IO_ERROR;

                if(!this.retry())
                {
                    this._events.emit(AssetLoaderEventType.ERROR, new AssetLoaderEvent(AssetLoaderEventType.ERROR, this._status));
                }
                break;

            case 'securityError':
                this._errorCode = AssetLoaderErrorCodes.SECURITY_ERROR;

                if(!this.retry())
                {
                    this._events.emit(AssetLoaderEventType.ERROR, new AssetLoaderEvent(AssetLoaderEventType.ERROR, this._status));
                }
                break;
        }
    }

    /**
	 * Attempt to retry loading
	 * @returns true if retry was initiated, false if max retries reached
	 */
    protected retry(): boolean
    {
        if(!this._disposed && ++this._retryCount <= BaseFileLoader.MAX_RETRIES)
        {
            const separator = this._url.includes('?') ? '&' : '?';

            this.load(`${this._url}${separator}retry=${this._retryCount}`);

            return true;
        }

        return false;
    }
}
