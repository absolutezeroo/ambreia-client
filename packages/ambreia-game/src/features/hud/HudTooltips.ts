import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IDesktopWindow} from '@ambreia/ui/components/IDesktopWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {placeTip} from './hudRules';

/** The window system's tooltip delay (InteractiveController.toolTipDelay). */
const DELAY_MS = 500;

/** What a hovered window shows: a layout, and how to fill it before it is placed. */
export interface ITooltip
{
    layout: string;
    fill?: (tip: IWindowContainer) => void;
}

/**
 * The HUD's hover tooltips (mock-ups of 2026-10-10: the bars, the action slots, the effects, the
 * party, the equipment): one at a time, after the window system's delay, placed by the pointer and
 * gone on the way out. A view calls `over()` / `out()` from its procedure for WME_OVER / WME_OUT
 * with what the hovered window should show, or null for nothing.
 */
export class HudTooltips
{
    private _tip: IWindowContainer | null = null;
    private _timer: ReturnType<typeof setTimeout> | null = null;
    private _disposed = false;

    constructor(private readonly _windows: IHabboWindowManager, private readonly _layer: number) {}

    /** Hands a procedure's event here: true when it was a hover the caller need not look at. */
    handle(event: WindowEvent, describe: () => ITooltip | null): boolean
    {
        if(event.type === 'WME_OVER')
        {
            this.over(describe);

            return true;
        }

        if(event.type === 'WME_OUT')
        {
            this.out();

            return true;
        }

        // A click opens something: the tooltip would sit on it.
        if(event.type === 'WME_CLICK') this.out();

        return false;
    }

    over(describe: () => ITooltip | null): void
    {
        this.out();
        if(this._disposed) return;

        this._timer = setTimeout(() =>
        {
            this._timer = null;
            this.show(describe());
        }, DELAY_MS);
    }

    out(): void
    {
        if(this._timer !== null) clearTimeout(this._timer);
        this._timer = null;
        this._tip?.destroy();
        this._tip = null;
    }

    private show(tooltip: ITooltip | null): void
    {
        const desktop = this._windows.getDesktop(this._layer) as (IWindowContainer & IDesktopWindow) | null;

        if(!tooltip || !desktop) return;

        const tip = this._windows.buildWidgetLayout(tooltip.layout, this._layer) as IWindowContainer | null;

        if(!tip) return;

        tooltip.fill?.(tip);

        const at = placeTip(desktop.mouseX, desktop.mouseY, tip.width, tip.height, desktop.width, desktop.height);

        tip.x = at.x;
        tip.y = at.y;
        desktop.addChild(tip);
        this._tip = tip;
    }

    /** The window named `name` the event came from, or one of its ancestors under `root`. */
    static under(window: IWindow | null, root: IWindow, name: string): IWindow | null
    {
        for(let at = window; at && at !== root; at = at.parent) if(at.name === name) return at;

        return null;
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.out();
    }
}
