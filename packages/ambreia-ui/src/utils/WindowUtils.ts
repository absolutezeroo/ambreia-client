import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import {BackgroundController} from '../components/BackgroundController';
import {BorderController} from '../components/BorderController';
import {ButtonController} from '../components/ButtonController';

/**
 * Generic window enable/disable helpers, including recursive "disable a
 * whole section" with blend-based dimming.
 *
 * The three window types AS3 special-cases here are declared as empty marker
 * interfaces, so the obfuscated source names nothing on its own; each is
 * identified by its single implementor:
 * `_SafeCls_2013` -> ButtonController, `_SafeCls_2254` -> BorderController,
 * `_SafeCls_2326` -> BackgroundController. This port matches on the concrete
 * classes, since it has no counterpart to the marker interfaces.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowUtils.as
 */
export class WindowUtils
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowUtils.as::disableButton()
    public static disableButton(window: IWindow, disabled: boolean): void
    {
        if(disabled)
        {
            window.disable();
        }
        else
        {
            window.enable();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowUtils.as::getBlend()
    // A BackgroundController carries its opacity in the top byte of `color`, not in
    // `blend` - reading `blend` there returns an unrelated value.
    private static getBlend(window: IWindow): number
    {
        if(window instanceof BackgroundController)
        {
            return ((window.color >>> 24) & 0xFF) / 255;
        }

        return window.blend;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowUtils.as::setBlend()
    private static setBlend(window: IWindow, blend: number): void
    {
        if(window instanceof BackgroundController)
        {
            // AS3 truncates with `int(param2 * 255)` before clamping - `Math.trunc`, not
            // `Math.round`, or a blend of 0.5 lands a pixel off the original's 127.
            const alpha = Math.max(0, Math.min(255, Math.trunc(blend * 255))) >>> 0;

            window.color = (window.color & 0xFFFFFF) | (alpha << 24);

            return;
        }

        window.blend = blend;
    }

    private static asContainer(window: IWindow): IWindowContainer | null
    {
        const container = window as unknown as Partial<IWindowContainer>;

        return typeof container.numChildren === 'number' && typeof container.getChildAt === 'function'
            ? (window as unknown as IWindowContainer)
            : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowUtils.as::disableSection()
    public static disableSection(window: IWindow, disabled: boolean = true, dimFactor: number = 0.5): void
    {
        if(window.tags.indexOf('DO_NOT_DISABLE') !== -1)
        {
            return;
        }

        let savedBlend = -1;

        for(const tag of window.tags)
        {
            if(tag.indexOf('BLEND=') === 0)
            {
                savedBlend = Number(tag.substring(6));
            }
        }

        if(savedBlend === -1)
        {
            savedBlend = WindowUtils.getBlend(window);

            const tag = `BLEND=${savedBlend}`;

            if(window.tags.indexOf(tag) === -1)
            {
                window.tags.push(tag);
            }
        }

        let targetBlend: number;

        if(disabled && window.tags.indexOf('INVIS_ON_DISABLE') !== -1)
        {
            targetBlend = 0;
        }
        else
        {
            targetBlend = disabled ? savedBlend * dimFactor : savedBlend;
        }

        const isIcon = window.tags.indexOf('#icon') !== -1;
        // AS3 param flag 16 = "shares parent's graphic context" (no own drawable surface).
        const ownsGraphicContext = !window.getParamFlag(16);

        // A ButtonController skips the whole recursion/blend block: it renders its own
        // disabled state from the state flag `disable()` sets below, so dimming it here
        // would apply the effect twice and dim its label and icon children as well.
        if(!(window instanceof ButtonController))
        {
            const container = WindowUtils.asContainer(window);

            if(container)
            {
                for(let i = 0; i < container.numChildren; i++)
                {
                    const child = container.getChildAt(i);

                    if(child)
                    {
                        WindowUtils.disableSection(child, disabled, ownsGraphicContext ? 1 : dimFactor);
                    }
                }

                // Borders and backgrounds are blended whether or not they own their graphic
                // context - they *are* the section's visible surface, so skipping them
                // leaves a fully-lit frame around dimmed contents.
                if(window instanceof BorderController || window instanceof BackgroundController || ownsGraphicContext)
                {
                    WindowUtils.setBlend(window, targetBlend);
                }
            }
            else if(!isIcon)
            {
                WindowUtils.setBlend(window, targetBlend);
            }
        }

        WindowUtils.disableButton(window, disabled);
    }
}
