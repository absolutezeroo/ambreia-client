import type {IWindow} from '../IWindow';
import type {IDropMenuWindow} from './IDropMenuWindow';

/**
 * Interface for drop list item windows.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListItemWindow.as
 */
export interface IDropListItemWindow extends IWindow
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListItemWindow.as::get menu()
    readonly menu: IDropMenuWindow | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDropListItemWindow.as::get value()
    value: IWindow | null;
}
