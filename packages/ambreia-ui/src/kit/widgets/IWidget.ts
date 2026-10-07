import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IIterable} from '../../utils/IIterable';
import type {PropertyStruct} from '../../utils/PropertyStruct';

/**
 * Base interface for all Habbo window widgets.
 *
 * Obfuscated to `_SafeCls_2028` in the primary tree, and declared in `core/window/`, not
 * with the widgets — `IWidgetWindow.widget` is typed by it, which is what makes it the
 * base of every widget interface under `habbo/window/widgets/`. It extends `IDisposable`
 * and `IIterable` and adds the property bag; `HabboWindowManagerComponent` builds widgets
 * through the factory and hands the `PropertyStruct` array to them.
 *
 * An earlier revision of this file cited `win63_version/core/window/class_3420.as`, which
 * is a class, not this interface, and is one of the unresolvable citations
 * `audit-as3-traces.mjs` reports.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_2028.as
 */
export interface IWidget extends IDisposable, IIterable
{
    /**
	 * Widget properties getter/setter.
	 *
	 * Get: returns current widget properties as PropertyStruct array.
	 * Set: applies PropertyStruct array to update widget state.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_2028.as::get properties()
    properties: PropertyStruct[];
}
