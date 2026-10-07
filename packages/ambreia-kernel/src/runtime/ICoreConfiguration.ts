/**
 * Core Configuration Interface
 *
 * Base interface for configuration management with property storage,
 * interpolation, and URL protocol handling.
 *
 * Seven members, and the port declares all seven — the file simply carried no `AS3:` traces, so
 * `as3-member-coverage.mjs` could not see it as the owner of `_SafeCls_49.as` and charged the whole
 * surface to `FurniIconImageManager.ts`, the one file that cites `getProperty()` off it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as
 */
export interface ICoreConfiguration
{
    /**
	 * Check if a property exists
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as::propertyExists()
    propertyExists(key: string): boolean;

    /**
	 * Get a string property value
	 * @param key Property key
	 * @param params Optional parameters for %param% replacement
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as::getProperty()
    getProperty(key: string, params?: Record<string, string>): string;

    /**
	 * Set a property value
	 * @param key Property key
	 * @param value Property value
	 * @param persistent If true, cannot be overwritten by non-persistent sets
	 * @param log If true, log when setting new properties
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as::setProperty()
    setProperty(key: string, value: string, persistent?: boolean, log?: boolean): void;

    /**
	 * Get a boolean property value
	 * Returns true if value is "1" or "true"
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as::getBoolean()
    getBoolean(key: string): boolean;

    /**
	 * Get an integer property value
	 * @param key Property key
	 * @param defaultValue Default value if key doesn't exist or is not a number
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as::getInteger()
    getInteger(key: string, defaultValue: number): number;

    /**
	 * Interpolate a string, replacing ${key} with property values
	 * Supports up to 3 levels of nesting
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as::interpolate()
    interpolate(value: string): string;

    /**
	 * Update URL protocol (HTTP to HTTPS if configured)
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as::updateUrlProtocol()
    updateUrlProtocol(url: string): string;
}
