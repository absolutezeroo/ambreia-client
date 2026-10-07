import type {IEncryptedLocalStorage} from './IEncryptedLocalStorage';
import {MD5} from '../../hurlant/crypto/hash/MD5';
import {Hex} from '../../hurlant/util/Hex';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.utils.CommunicationUtils');

/**
 * Communication and local storage utility.
 *
 * Provides static methods for persistent storage (using localStorage
 * as the web equivalent of Flash SharedObjects), XOR cipher operations,
 * fingerprint generation, and protocol manipulation.
 *
 * @see source_as_win63/habbo/utils/CommunicationUtils.as
 */
export class CommunicationUtils
{
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_ENVIRONMENT
    public static readonly SOL_PROPERTY_ENVIRONMENT: string = 'environment';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_LOGIN_NAME
    public static readonly SOL_PROPERTY_LOGIN_NAME: string = 'login';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_CHARACTER_ID
    public static readonly SOL_PROPERTY_CHARACTER_ID: string = 'userid';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_CHARACTER_UNIQUE_ID
    public static readonly SOL_PROPERTY_CHARACTER_UNIQUE_ID: string = 'useruniqueid';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_REMEMBER_LOGIN
    public static readonly SOL_PROPERTY_REMEMBER_LOGIN: string = 'autologin';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_LOGIN_METHOD
    public static readonly SOL_PROPERTY_LOGIN_METHOD: string = 'loginmethod';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_MACHINE_ID
    public static readonly SOL_PROPERTY_MACHINE_ID: string = 'machineid';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_APP_RATER_STATUS
    public static readonly SOL_PROPERTY_APP_RATER_STATUS: string = 'ratingstatus';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_APP_RATER_TIMESTAMP
    public static readonly SOL_PROPERTY_APP_RATER_TIMESTAMP: string = 'ratingstatustime';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::LOGIN_METHOD_HABBO
    public static readonly LOGIN_METHOD_HABBO: string = 'habbo';
    public static readonly LOGIN_METHOD_FACEBOOK: string = 'facebook';

    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_ID
    private static readonly SOL_ID: string = 'fuselogin';
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::SOL_PROPERTY_PASSWORD
    private static readonly SOL_PROPERTY_PASSWORD: string = 'password';

    private static _forcedAutoLoginEnabled: boolean = false;

    /**
	 * Whether forced auto-login is enabled.
	 */
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::get forcedAutoLoginEnabled()
    static get forcedAutoLoginEnabled(): boolean
    {
        return CommunicationUtils._forcedAutoLoginEnabled;
    }

    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::set forcedAutoLoginEnabled()
    static set forcedAutoLoginEnabled(value: boolean)
    {
        CommunicationUtils._forcedAutoLoginEnabled = value;
    }

    private static _encryptedLocalStorage: IEncryptedLocalStorage | null = null;

    /**
	 * Set the encrypted local storage implementation.
	 *
	 * @param storage The encrypted storage provider
	 */
    static set encryptedLocalStorage(storage: IEncryptedLocalStorage)
    {
        CommunicationUtils._encryptedLocalStorage = storage;
    }

    /**
	 * Write a value to persistent storage.
	 *
	 * @param key The storage key
	 * @param value The value to store (null to remove)
	 */
    static writeProperty(key: string, value: string | null): void
    {
        try
        {
            const storageKey = CommunicationUtils.SOL_ID + '.' + key;

            if(value === null)
            {
                localStorage.removeItem(storageKey);
            }
            else
            {
                localStorage.setItem(storageKey, value);
            }
        }
        catch (_e)
        {
            log.error('Error writing property \'' + key + '\' with value \'' + value + '\'');
        }
    }

    /**
	 * Read a string value from persistent storage.
	 *
	 * @param key The storage key
	 * @param defaultValue The default value if not found
	 * @returns The stored value or the default value
	 */
    static readProperty(key: string, defaultValue: string | null = null): string | null
    {
        try
        {
            const storageKey = CommunicationUtils.SOL_ID + '.' + key;
            let value = localStorage.getItem(storageKey);

            if(value === null)
            {
                value = defaultValue;
            }

            if(key === 'environment' && value)
            {
                value = value.replace('hh', '');
                value = value.replace('br', 'pt');
                value = value.replace('us', 'en');
            }

            return value;
        }
        catch (_e)
        {
            log.error('Error reading property \'' + key + '\'');
        }

        return defaultValue;
    }

    /**
	 * Read a boolean value from persistent storage.
	 *
	 * @param key The storage key
	 * @param defaultValue The default value if not found
	 * @returns The boolean value
	 */
    static readPropertyBoolean(key: string, defaultValue: string | null = null): boolean
    {
        const value = CommunicationUtils.readProperty(key, defaultValue);

        return value !== null && (value.toLowerCase() === 'true' || value === '1');
    }

    /**
	 * Read an integer value from persistent storage.
	 *
	 * @param key The storage key
	 * @param defaultValue The default value if not found
	 * @returns The integer value
	 */
    static readPropertyInt(key: string, defaultValue: string | null = null): number
    {
        const value = CommunicationUtils.readProperty(key, defaultValue);

        return parseInt(String(value)) || 0;
    }

    /**
	 * Check if a storage property exists.
	 *
	 * @param key The storage key
	 * @returns True if the property exists
	 */
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::propertyExists()
    static propertyExists(key: string): boolean
    {
        try
        {
            const storageKey = CommunicationUtils.SOL_ID + '.' + key;

            return localStorage.getItem(storageKey) !== null;
        }
        catch (_e)
        {
            return false;
        }
    }

    /**
	 * Clear all login-related stored data.
	 */
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::clearAllLoginData()
    static clearAllLoginData(): void
    {
        CommunicationUtils.writeProperty('loginmethod', null);
        CommunicationUtils.writeProperty('environment', null);
        CommunicationUtils.writeProperty('userid', null);
        CommunicationUtils.writeProperty('autologin', null);
        CommunicationUtils.writeProperty('password', null);
        CommunicationUtils.forcedAutoLoginEnabled = false;
    }

    /**
	 * Reset the stored password.
	 */
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::resetPassword()
    static resetPassword(): void
    {
        if(CommunicationUtils._encryptedLocalStorage)
        {
            CommunicationUtils._encryptedLocalStorage.reset();
        }

        CommunicationUtils.writeProperty('password', '');
    }

    /**
	 * Store a password using encrypted storage if available, otherwise plain localStorage.
	 *
	 * @param password The password to store
	 */
    static storePassword(password: string | null): void
    {
        if(CommunicationUtils._encryptedLocalStorage)
        {
            if(password !== null && CommunicationUtils._encryptedLocalStorage.storeString('password', password))
            {
                CommunicationUtils.writeProperty('password', '');
            }
            else
            {
                CommunicationUtils.writeProperty('password', password);
            }
        }
        else
        {
            CommunicationUtils.writeProperty('password', password);
        }
    }

    /**
	 * Restore a stored password.
	 *
	 * @returns The restored password or null
	 */
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::restorePassword()
    static restorePassword(): string | null
    {
        let value: string | null = null;

        if(CommunicationUtils._encryptedLocalStorage)
        {
            value = CommunicationUtils._encryptedLocalStorage.restoreString('password');
        }

        if(!value)
        {
            value = CommunicationUtils.readProperty('password', '');
        }

        return value;
    }

    /**
	 * Generate a random hexadecimal string.
	 *
	 * @param length The number of random bytes to generate (default 16)
	 * @returns The random hex string
	 */
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::generateRandomHexString()
    static generateRandomHexString(length: number = 16): string
    {
        let result = '';

        for(let i = 0; i < length; i++)
        {
            const byte = Math.floor(Math.random() * 255);
            result += byte.toString(16);
        }

        return result;
    }

    /**
	 * Remove the protocol (http:// or https://) from a URL.
	 *
	 * @param url The URL to process
	 * @returns The URL without the protocol prefix
	 */
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::removeProtocol()
    static removeProtocol(url: string): string
    {
        url = url.replace('http://', '');

        return url.replace('https://', '');
    }

    /**
	 * Perform a simple XOR cipher on a string.
	 *
	 * @param str The string to cipher
	 * @param key The cipher key
	 * @returns The XOR ciphered string
	 */
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::xor()
    static xor(str: string, key: string): string
    {
        let result = '';
        let keyIndex = 0;

        for(let i = 0; i < str.length; i++)
        {
            const charCode = str.charCodeAt(i);
            result += String.fromCharCode(charCode ^ key.charCodeAt(keyIndex));
            keyIndex++;

            if(keyIndex === key.length)
            {
                keyIndex = 0;
            }
        }

        return result;
    }

    /**
	 * The device fingerprint sent with `UniqueIDMessageComposer`.
	 *
	 * AS3 joins five stable machine facts with `#` — user agent, `Capabilities.serverString`,
	 * timezone offset, plugin list, installed non-embedded regular fonts — MD5s the result, and
	 * prefixes the digest with `~` when the plugin list came back empty. The point of it is that
	 * the same machine produces the same string every time.
	 *
	 * @returns A fingerprint string
	 */
    // DEVIATION: the port had been returning `generateRandomHexString(32)`, which is a different
    //   value on every connection — the one property a fingerprint must not have, and it made
    //   every reconnect look like a new device to the server. The five inputs are rebuilt from
    //   their browser equivalents below; only the font list has none (the browser does not
    //   enumerate fonts), so that field stays empty. The `~` rule is AS3's own and is kept.
    // AS3: .../src/com/sulake/habbo/utils/CommunicationUtils.as::generateFingerprint()
    static generateFingerprint(): string
    {
        try
        {
            const userAgent = navigator.userAgent;
            const plugins = Array.from(navigator.plugins ?? []).map((plugin) => plugin.name).join(',');
            // `Capabilities.serverString` is Flash's own `&`-joined capability query string; these
            // are the browser facts that play the same role — stable per machine, coarse enough
            // not to change between sessions.
            const capabilities = [
                navigator.language,
                screen.width + 'x' + screen.height,
                String(screen.colorDepth),
                String(navigator.hardwareConcurrency ?? 0)
            ].join('&');
            const timezoneOffset = String(new Date().getTimezoneOffset());
            const fonts = '';

            const source = `${userAgent}#${capabilities}#${timezoneOffset}#${plugins}#${fonts}`;
            const digest = Hex.fromArray(new MD5().hash(new TextEncoder().encode(source)), false);

            return plugins.length === 0 ? '~' + digest : digest;
        }
        catch (error)
        {
            // AS3 swallows any failure and returns the empty string.
            log.warn(`Could not build a device fingerprint: ${String(error)}`);

            return '';
        }
    }
}
