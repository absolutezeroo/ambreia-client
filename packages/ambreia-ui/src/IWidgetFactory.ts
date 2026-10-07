import type {IWidgetWindow} from './components/IWidgetWindow';

/**
 * Widget factory interface.
 *
 * Creates widget instances by type identifier.
 * In AS3, this was class_1798. HabboWindowManagerComponent implements it.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWidgetFactory.as
 */
export interface IWidgetFactory
{
    createWidget(type: string, window: IWidgetWindow): unknown;
}
