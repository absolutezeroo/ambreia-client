/**
 * Interface for focusable windows.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFocusWindow.as
 */
export interface IFocusWindow
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFocusWindow.as::get focused()
    readonly focused: boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFocusWindow.as::focus()
    focus(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFocusWindow.as::unfocus()
    unfocus(): boolean;
}
