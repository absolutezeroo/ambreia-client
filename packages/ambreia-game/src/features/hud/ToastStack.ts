import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {Ticker} from '../../ui/kit/Ticker';
import type {WindowBits} from '../../ui/kit/WindowBits';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import {LAYER} from './hudLayout';
import type {IToast} from './IToast';
import {ToastQueue} from './ToastQueue';

const ICONS = 'rpg/ui-icons/';
/** Each kind's frame tint and icon (the owner's toasts of the HUD sheet). */
const LOOK: Readonly<Record<IToast['kind'], {color: number; icon: string}>> = {
    info: {color: 0x2a6fd6, icon: `${ICONS}tools_crafting_writing_parchment_scroll_document_icon`},
    success: {color: 0x2f7a2f, icon: `${ICONS}software_signs_checkmark_checkbox_ticked_todo_icon`},
    error: {color: 0xb02a2a, icon: `${ICONS}software_sign_crossout_cancel_forbidden_illegal_1_icon`}
};

/** Every icon a toast can show: decoded at load (IGameFeature.images). */
export const TOAST_IMAGES: readonly string[] = Object.values(LOOK).map(look => look.icon);

const MAX_VISIBLE = 3;
/** Below the top bar, centred; one toast under the other. */
const TOP = 64;
const GAP = 6;
const TICK_MS = 250;

/** The toasts on screen (vortex_hud_toast_xml): up to three stacked at the top, each gone after its time. */
export class ToastStack
{
    private readonly _queue = new ToastQueue(MAX_VISIBLE);
    private readonly _frames: IWindowContainer[] = [];
    private _ticker: {clear(): void} | null = null;
    private _disposed = false;

    constructor(private readonly _windows: () => IHabboWindowManager | null, private readonly _bits: WindowBits, private readonly _tick: Ticker, private readonly _now: () => number) {}

    push(toast: IToast): void
    {
        if(this._disposed) return;

        if(this._queue.push(toast, this._now())) this.render();

        this._ticker ??= this._tick(this._onTick, TICK_MS);
    }

    private readonly _onTick = (): void =>
    {
        if(this._queue.tick(this._now())) this.render();

        if(this._queue.visible.length > 0) return;

        this._ticker?.clear();
        this._ticker = null;
    };

    private render(): void
    {
        const windows = this._windows();
        const desktop = (windows?.getDesktop(LAYER) ?? null) as IWindowContainer | null;

        if(!windows || !desktop) return;

        const visible = this._queue.visible;

        while(this._frames.length < visible.length)
        {
            const frame = windows.buildWidgetLayout('vortex_hud_toast_xml', LAYER) as IWindowContainer | null;

            if(!frame) return;

            desktop.addChild(frame);
            this._frames.push(frame);
        }

        this._frames.forEach((frame, i) =>
        {
            const toast = visible[i];

            frame.visible = toast !== undefined;

            if(!toast) return;

            const look = LOOK[toast.kind];
            const icon = frame.findChildByName('toast_icon') as IStaticBitmapWrapperWindow | null;

            this._bits.setColor(frame, 'toast_frame', look.color);
            this._bits.setText(frame, 'toast_title', toast.title);
            this._bits.setText(frame, 'toast_txt', toast.text);
            this._bits.setVisible(frame, false, 'toast_mark');

            if(icon)
            {
                if(icon.assetUri !== look.icon) icon.assetUri = look.icon;
                icon.color = 0xffffff;
            }

            frame.x = Math.round((desktop.width - frame.width) / 2);
            frame.y = TOP + i * (frame.height + GAP);
        });
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._ticker?.clear();
        this._ticker = null;

        for(const frame of this._frames) frame.destroy();

        this._frames.length = 0;
    }
}
