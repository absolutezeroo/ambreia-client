import type {ILocalizable} from './ILocalizable';

/**
 * What the window system asks of a localisation: keep a window's `${key}` text up to date. The
 * engine's localisation manager has these two methods already, so it is passed in as is.
 */
export interface IWindowLocalization
{
    registerLocalizationListener(key: string, target: ILocalizable): void;
    removeLocalizationListener(key: string, target: ILocalizable): void;
}
