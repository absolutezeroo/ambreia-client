import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IDesktopWindow} from './components/IDesktopWindow';
import type {WindowEvent} from './events/WindowEvent';
import type {IWindow} from './IWindow';

/**
 * The callback `notify()`, `confirm()` and `confirmWithModal()` take
 *
 * AS3 types all three as a bare `Function`, so this shape is derived, not recovered: it is the
 * one every implementer in this port uses — `HabboWindowManager.notify()/confirm()` pass
 * `AlertDialogCallback`, which is exactly `(dialog, event)`. Both parameter types are core, so
 * declaring it here costs the core layer no knowledge of `habbo/`.
 */
export type CoreWindowManagerDialogCallback = (dialog: IDisposable, event: WindowEvent) => void;

/**
 * Core window manager interface.
 *
 * Top-level manager that creates/destroys windows across contexts,
 * provides desktop access, notification, and window search.
 *
 * Nothing implements this interface yet — `HabboWindowManager` satisfies the parallel
 * `IHabboWindowManager` instead — which is how three declarations here drifted from the source
 * without anything failing to compile. All three are corrected below against the primary tree.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as
 * (obfuscated; identified as `ICoreWindowManager` by member match against the unobfuscated
 * sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/ICoreWindowManager.as,
 * which declares the same `create`/`buildFromXML`/`getDesktop`/`notify` set)
 */
export interface ICoreWindowManager
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::create()
    create(
        name: string,
        type: number,
        style: number,
        param: number,
        rect: { x: number; y: number; width: number; height: number },
        procedure?: ((event: unknown, window: IWindow) => void) | null,
        dynamicStyle?: string,
        id?: number,
        tags?: string[] | null,
        parent?: IWindow | null,
        properties?: unknown[] | null,
        layerName?: string
    ): IWindow;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::destroy()
    destroy(window: IWindow): void;

    /**
     * Build a window tree from a layout
     *
     * The third parameter was declared `namedWindows: Map<string, IWindow>`, as if it collected
     * the built windows by name. It does not: AS3's third argument is `_SafeCls_481`, the
     * ordered-map class from `core/utils`, holding the `<var>` substitutions applied to the
     * layout — the same `vars` map `IHabboWindowManager.buildFromXML()` already declares.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::buildFromXML()
    buildFromXML(
        layout: string | Document | Element,
        contextLayer?: number,
        vars?: Map<string, string> | null
    ): IWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::windowToXMLString()
    windowToXMLString(window: IWindow): string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::getDesktop()
    // Returns `_SafeCls_1829` (`IDesktopWindow`), not the plain `IWindow` this used to declare.
    getDesktop(contextLayer: number): IDesktopWindow | null;

    /**
     * Open a notification dialog
     *
     * AS3 returns `core.window.utils.INotify`, which is not ported; `INotify extends _SafeCls_47`
     * (`IDisposable`), and the habbo-side dialog interfaces extend `IDisposable` too, so that is
     * the honest common return type until `INotify` itself is ported.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::notify()
    notify(title: string, message: string, callback: CoreWindowManagerDialogCallback, flags?: number): IDisposable | null;

    /**
     * Open a confirmation dialog
     *
     * The flags come *third* and the callback fourth. This used to declare them the other way
     * round, contradicting both the source and `IHabboWindowManager.confirm()`, which every
     * caller in the port already uses in AS3 order.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::confirm()
    confirm(title: string, message: string, flags: number, callback: CoreWindowManagerDialogCallback): IDisposable | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::confirmWithModal()
    confirmWithModal(title: string, message: string, flags: number, callback: CoreWindowManagerDialogCallback): IDisposable | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::findWindowByName()
    findWindowByName(name: string): IWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::findWindowByTag()
    findWindowByTag(tag: string): IWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/_SafeCls_62.as::groupWindowsWithTag()
    groupWindowsWithTag(tag: string, result: IWindow[], depth?: number): number;
}
