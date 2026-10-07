import type {IWindow} from '../IWindow';

/**
 * Focus manager service interface.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/services/IFocusManagerService.as
 */
export interface IFocusManagerService
{
    setFocus(window: IWindow | null): void;

    getFocus(): IWindow | null;
}
