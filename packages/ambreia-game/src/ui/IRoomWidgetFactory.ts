/**
 * IRoomWidgetFactory
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetFactory.as
 *
 * Factory interface for creating room widgets.
 */
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IRoomWidgetHandler} from './IRoomWidgetHandler';

export interface IRoomWidgetFactory extends IDisposable
{
    /**
	 * Creates a widget of the given type with the given handler.
	 *
	 * @param type - Widget type code (e.g. "RWE_INFOSTAND")
	 * @param handler - The handler for the widget
	 * @returns The created widget, or null if type is unknown
	 */
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetFactory.as::createWidget()
    createWidget(type: string, handler: IRoomWidgetHandler): unknown | null;

    /** The handler of a widget type, or null when no enabled feature declares it. */
    createHandler(type: string): IRoomWidgetHandler | null;
}
