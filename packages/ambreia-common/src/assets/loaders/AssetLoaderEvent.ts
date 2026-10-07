/**
 * AssetLoaderEvent
 *
 * Based on AS3: com.sulake.core.assets.loaders.AssetLoaderEvent
 *
 * Event types emitted by asset loaders during the loading process.
 */

/**
 * Asset loader event types
 */
export const AssetLoaderEventType = {
    /** Loading completed successfully */
    COMPLETE: 'AssetLoaderEventComplete',
    /** Loading progress update */
    PROGRESS: 'AssetLoaderEventProgress',
    /** Content was unloaded */
    UNLOAD: 'AssetLoaderEventUnload',
    /** HTTP status received */
    STATUS: 'AssetLoaderEventStatus',
    /** Loading failed with error */
    ERROR: 'AssetLoaderEventError',
    /** Connection opened */
    OPEN: 'AssetLoaderEventOpen',
} as const;

export type AssetLoaderEventType = typeof AssetLoaderEventType[keyof typeof AssetLoaderEventType];

/**
 * AssetLoaderEvent
 *
 * Event emitted by asset loaders during the loading process.
 */
export class AssetLoaderEvent
{
    /**
	 * Event type constants (for static access)
	 */
    static readonly COMPLETE = AssetLoaderEventType.COMPLETE;
    static readonly PROGRESS = AssetLoaderEventType.PROGRESS;
    static readonly UNLOAD = AssetLoaderEventType.UNLOAD;
    static readonly STATUS = AssetLoaderEventType.STATUS;
    static readonly ERROR = AssetLoaderEventType.ERROR;
    static readonly OPEN = AssetLoaderEventType.OPEN;

    private readonly _type: AssetLoaderEventType;
    // AS3: .../src/com/sulake/core/assets/loaders/AssetLoaderEvent.as::_status
    private readonly _status: number;

    /**
	 * Create a new asset loader event
	 * @param type The event type
	 * @param status HTTP status code or custom status
	 */
    constructor(type: AssetLoaderEventType, status: number = 0)
    {
        this._type = type;
        this._status = status;
    }

    /**
	 * The event type
	 */
    get type(): AssetLoaderEventType
    {
        return this._type;
    }

    /**
	 * The status code (HTTP status or custom)
	 */
    // AS3: .../src/com/sulake/core/assets/loaders/AssetLoaderEvent.as::get status()
    get status(): number
    {
        return this._status;
    }

    /**
	 * Create a clone of this event
	 */
    // AS3: .../src/com/sulake/core/assets/loaders/AssetLoaderEvent.as::clone()
    clone(): AssetLoaderEvent
    {
        return new AssetLoaderEvent(this._type, this._status);
    }

    /**
	 * String representation
	 */
    // AS3: .../src/com/sulake/core/assets/loaders/AssetLoaderEvent.as::toString()
    toString(): string
    {
        return `[AssetLoaderEvent type=${this._type} status=${this._status}]`;
    }
}
