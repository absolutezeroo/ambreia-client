import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import {Theme} from '@ambreia/ui/kit/theme/Theme';
import type {EditorState} from '../state/EditorState';

interface IThemeManagerLike
{
    getStyle(themeName: string, elementType: number, intent: string): number;
    getThemeAndIntent(elementType: number, style: number): { theme: string; intent: string };
}

interface IContainerLike { numChildren: number; getChildAt(index: number): IWindow | null; }

/**
 * Themes a whole-layout remap can target: the five `ThemeManager` registers with
 * `isReal = true` (Volter 0-2, Ubuntu 3-7, Misc 10000-10007, Illumina Light
 * 100-199, Illumina Dark 200-299). The other three names it knows — `None`,
 * `Icon`, `Legacy border` — are virtual groupings of styles, not skins to convert
 * a window to.
 */
export const GLAZE_THEMES = [Theme.VOLTER, Theme.UBUNTU, Theme.MISC, Theme.ILLUMINA_LIGHT, Theme.ILLUMINA_DARK];

/**
 * Every theme name the engine knows, virtual ones included. The Property Editor
 * lists these rather than {@link GLAZE_THEMES} so a window that really is `Icon`
 * or `Legacy border` reads as such — with only the real themes in the list, the
 * dropdown fell back to index 0 and claimed every one of them was Volter.
 */
export function themeNames(state: EditorState): string[]
{
    const wm = state.runtime.windowManager as unknown as { getThemeManager?: () => { getThemes?: () => string[] } };
    const names = wm.getThemeManager?.()?.getThemes?.();

    return names && names.length > 0 ? names : [...GLAZE_THEMES];
}

/**
 * Re-themes the whole open layout by remapping every window's `style` to the
 * target theme, preserving each element's intent — exactly how Glaze's
 * "Set Theme" works. Uses the engine `ThemeManager`
 * (`getThemeAndIntent` → intent, `getStyle` → the target theme's equivalent).
 */
export function setTheme(state: EditorState, themeName: string): void
{
    const tm = (state.runtime.windowManager as unknown as { getThemeManager(): IThemeManagerLike }).getThemeManager();
    const root = state.rootWindow;

    if(!tm || !root || root.disposed)
    {
        return;
    }

    state.pushHistory();

    const visit = (win: IWindow): void =>
    {
        const wc = win as unknown as WindowController;
        const {intent} = tm.getThemeAndIntent(wc.type, wc.style);
        const style = tm.getStyle(themeName, wc.type, intent);

        wc.style = style;

        const container = win as unknown as IContainerLike;

        if(typeof container.numChildren === 'number' && typeof container.getChildAt === 'function')
        {
            for(let i = 0; i < container.numChildren; i++)
            {
                const child = container.getChildAt(i);

                if(child) visit(child);
            }
        }
    };

    visit(root);
    state.notifyTreeChanged();
}
