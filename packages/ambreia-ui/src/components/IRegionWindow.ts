import type {IInteractiveWindow} from './IInteractiveWindow';
import type {IWindowContainer} from '../IWindowContainer';

/**
 * Interface for region windows.
 *
 * A region is an interactive container that captures mouse events
 * with tooltip and cursor support. The concrete `RegionController` extends
 * `ContainerController`, so this interface exposes child management too.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IRegionWindow.as
 */
export interface IRegionWindow extends IInteractiveWindow, IWindowContainer
{
}
