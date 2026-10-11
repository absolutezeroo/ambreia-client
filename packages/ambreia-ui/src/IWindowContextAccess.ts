/**
 * Minimal window-context surface exposed through `IWindow.context`.
 *
 * Keeping this contract separate prevents the core window interface from importing the full
 * `IWindowContext`, which itself owns factories and services that depend on windows. The concrete
 * context still implements the complete `IWindowContext`; callers that own a context directly keep
 * that richer type.
 */
export interface IWindowContextAccess<TWindow>
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::getDesktopWindow()
    getDesktopWindow(): TWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::create()
    create(
        name: string,
        caption: string,
        type: number,
        style: number,
        param: number,
        rect: { x: number; y: number; width: number; height: number } | null,
        procedure: ((event: unknown, window: TWindow) => void) | null,
        parent: TWindow | null,
        id: number,
        tags?: string[] | null,
        dynamicStyle?: string,
        properties?: unknown[] | null
    ): TWindow;
}
