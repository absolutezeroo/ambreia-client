import type {IPropertyMap} from './IPropertyMap';
import type {IThemeAndIntent} from './IThemeAndIntent';

/**
 * Resolves a window's visual style: which theme and intent an element type maps to, and the
 * property defaults that come with it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/theme/IThemeManager.as
 */
export interface IThemeManager
{
    /**
	 * The style id for a (theme, element type, intent) triple — the lookup every window does to
	 * find its skin.
	 */
    // AS3: .../src/com/sulake/core/window/theme/IThemeManager.as::getStyle()
    getStyle(themeName: string, elementType: number, intent: string): number;

    /**
	 * The reverse lookup: which theme and intent produced this style id.
	 *
	 * AS3 returns a bare `Object` with two fields; the port names the shape `IThemeAndIntent`.
	 */
    // AS3: .../src/com/sulake/core/window/theme/IThemeManager.as::getThemeAndIntent()
    getThemeAndIntent(elementType: number, style: number): IThemeAndIntent;

    // AS3: .../src/com/sulake/core/window/theme/IThemeManager.as::getIntents()
    getIntents(elementType: number, themeName: string, fallbackStyle: number): string[];

    // AS3: .../src/com/sulake/core/window/theme/IThemeManager.as::getPropertyDefaults()
    getPropertyDefaults(style: number): IPropertyMap | null;

    // AS3: .../src/com/sulake/core/window/theme/IThemeManager.as::getThemes()
    getThemes(): string[];
}
