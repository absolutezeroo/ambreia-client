/**
 * What `IThemeManager.getThemeAndIntent()` hands back: the theme a style id belongs to, and the
 * intent within it.
 *
 * AS3 returns a bare `Object` with these two fields — `getThemeAndIntent(param1:uint, param2:uint)
 * : Object` — so the name is this port's, not the source's. It lives in `core` because
 * `IThemeManager` is a core interface and `core` imports nothing from `habbo`; the concrete
 * `habbo/window/theme/ThemeManager` re-exports it for the callers already importing it from there.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/theme/IThemeManager.as
 */
export interface IThemeAndIntent
{
    // TS-only: a field of AS3's anonymous return Object, which names no type to trace to.
    theme: string;
    // TS-only: a field of AS3's anonymous return Object, which names no type to trace to.
    intent: string | null;
}
