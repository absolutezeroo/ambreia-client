import type {ILocalizable} from './ILocalizable';

/**
 * What the window system asks of a localisation: resolve a `${key}` text and keep a window's text
 * up to date. The engine's localisation manager has these methods already, so it is passed in as is.
 */
export interface IWindowLocalization
{
    getResolvedLocalization(key: string): string | null;
    registerLocalizationListener(key: string, target: ILocalizable): void;
    removeLocalizationListener(key: string, target: ILocalizable): void;
}
