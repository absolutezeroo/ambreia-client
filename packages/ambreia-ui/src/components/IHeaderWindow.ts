import type {IWindowContainer} from '../IWindowContainer';
import type {ILabelWindow} from './ILabelWindow';
import type {IItemListWindow} from './IItemListWindow';

/**
 * Interface for header windows.
 *
 * A header window contains a title label and an item list of controls
 * (close button, minimize, etc.).
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IHeaderWindow.as
 */
export interface IHeaderWindow extends IWindowContainer
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IHeaderWindow.as::get title()
    readonly title: ILabelWindow;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IHeaderWindow.as::get controls()
    readonly controls: IItemListWindow;
}
