import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IIterable} from './utils/IIterable';

/**
 * Base widget interface.
 *
 * Widgets are embedded in WidgetWindowController and provide custom
 * behavior. The host controller delegates properties to the widget.
 *
 * In AS3 this was class_3420: IDisposable + IIterable + properties.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWidget.as
 */
export interface IWidget extends IDisposable, IIterable
{
    properties: unknown[];
}
