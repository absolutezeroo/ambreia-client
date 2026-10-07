import type {IInteractiveWindow} from './IInteractiveWindow';

/**
 * Interface for drag bar windows.
 *
 * Provides scrollbar offset values for the draggable lift (thumb)
 * element within a scrollbar.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDragBarWindow.as
 */
export interface IDragBarWindow extends IInteractiveWindow
{
    scrollbarOffsetX: number;
    scrollbarOffsetY: number;
}
