import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {Category} from '../app/Category';
import type {EditorApp} from '../app/EditorApp';
import {child} from './bind';
import type {IPanelUi} from './IPanelUi';

type SlotName = 'left' | 'inspector' | 'bottom';

const SLOT_WINDOWS: Record<SlotName, string> = {left: 'left_slot', inspector: 'inspector_slot', bottom: 'bottom_slot'};

/**
 * Fills the main window's three slots with the layouts the current category asks for. A slot is
 * named by its layout, or `layout#key` when one layout serves several categories with different
 * content (left_npcs for the NPCs, the entries, the passages…): each key gets its own window.
 * A window is built once and kept: switching back finds its panel as it was left.
 */
export class SlotSwitcher implements IPanelUi
{
    private readonly _built = new Map<string, {window: IWindow; panel: IPanelUi | null}>();
    private readonly _shown: Partial<Record<SlotName, string>> = {};
    constructor(
        private readonly _manager: WindowManager,
        private readonly _main: IWindow,
        private readonly _app: EditorApp,
        private readonly _slots: (category: Category) => Record<SlotName, string>,
        private readonly _panels: (layout: string, window: IWindow) => IPanelUi | null
    )
    {
    }

    render(): void
    {
        const wanted = this._slots(this._app.category);

        for(const slot of Object.keys(SLOT_WINDOWS) as SlotName[])
        {
            const layout = wanted[slot];

            if(this._shown[slot] !== layout) this.show(slot, layout);
        }

        for(const slot of Object.keys(SLOT_WINDOWS) as SlotName[])
        {
            const layout = this._shown[slot];

            if(layout) this._built.get(layout)?.panel?.render();
        }
    }

    onViewChange(): void
    {
        for(const slot of Object.keys(SLOT_WINDOWS) as SlotName[])
        {
            const layout = this._shown[slot];

            if(layout) this._built.get(layout)?.panel?.onViewChange?.();
        }
    }

    private show(slot: SlotName, layout: string): void
    {
        const container = child<IWindowContainer>(this._main, SLOT_WINDOWS[slot]);

        if(!container) return;

        const previous = this._shown[slot];

        if(previous)
        {
            const old = this._built.get(previous);

            if(old) container.removeChild(old.window);
        }

        let entry = this._built.get(layout);

        if(!entry)
        {
            const window = this._manager.buildWidgetLayout(layout.split('#')[0]);

            if(!window)
            {
                this._shown[slot] = layout;

                return;
            }

            entry = {window, panel: this._panels(layout, window)};
            this._built.set(layout, entry);
        }

        // The slot follows the page's size: the panel takes the slot's, and its stretching parts follow.
        entry.window.rectangle = {x: 0, y: 0, width: container.width, height: container.height};
        container.addChild(entry.window);
        this._shown[slot] = layout;
    }
}
