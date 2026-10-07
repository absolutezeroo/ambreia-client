/**
 * Platform detection utilities.
 *
 * Provides static methods and constants for detecting the current
 * platform, device type, and display characteristics. Simplified
 * for web usage where the client always runs in a browser.
 *
 * @see source_as_win63/habbo/utils/class_497.as
 */
export class PlatformUtils
{
    public static readonly DEVICE_TYPE_PHONE: number = 0;
    public static readonly DEVICE_TYPE_TABLET: number = 1;
    public static readonly DEVICE_TYPE_DESKTOP: number = 2;

    public static readonly PLATFORM_DESKTOP: number = -1;
    public static readonly PLATFORM_ANDROID: number = 0;
    public static readonly PLATFORM_IOS: number = 1;

    /**
	 * Get the display scale factor (device pixel ratio).
	 *
	 * @returns The device pixel ratio
	 */
    static get scale(): number
    {
        return window.devicePixelRatio || 1;
    }

    /**
	 * Check if the current platform is a desktop.
	 * In the web client, this always returns true.
	 *
	 * @returns True if running on a desktop
	 */
    static isDesktop(): boolean
    {
        return true;
    }

    /**
	 * Check if the current device is a phone based on screen width.
	 *
	 * @returns True if the screen width suggests a phone
	 */
    static isPhone(): boolean
    {
        return window.innerWidth <= 768;
    }

    /**
	 * Check if the current device is a tablet based on screen width.
	 *
	 * @returns True if the screen width suggests a tablet
	 */
    static isTablet(): boolean
    {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    /**
	 * Get the device type constant for the current device.
	 *
	 * @returns The device type: DEVICE_TYPE_PHONE, DEVICE_TYPE_TABLET, or DEVICE_TYPE_DESKTOP
	 */
    static deviceType(): number
    {
        if(PlatformUtils.isPhone())
        {
            return PlatformUtils.DEVICE_TYPE_PHONE;
        }

        if(PlatformUtils.isTablet())
        {
            return PlatformUtils.DEVICE_TYPE_TABLET;
        }

        return PlatformUtils.DEVICE_TYPE_DESKTOP;
    }

    /**
	 * Check if the display is high DPI (retina / 2x or higher).
	 *
	 * @returns True if the device pixel ratio is 2 or higher
	 */
    static isHighDPI(): boolean
    {
        return PlatformUtils.scale >= 2;
    }

    /**
	 * Get the platform string identifier for logging.
	 *
	 * @returns A platform string (e.g. "WEB.DESKTOP")
	 */
    static getDeviceStringForLogging(): string
    {
        let result = 'WEB.';

        if(PlatformUtils.isPhone())
        {
            result += 'PHONE';
        }
        else if(PlatformUtils.isTablet())
        {
            result += 'TABLET';
        }
        else
        {
            result += 'DESKTOP';
        }

        return result;
    }
}
