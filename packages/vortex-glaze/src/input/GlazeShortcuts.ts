import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import {Logger} from '@ambreia/common/utils/Logger';
import {cloneSelected, deleteSelected} from '../ops/StructuralOps';
import {copySelected, cutSelected, pasteClipboard} from '../ops/ClipboardOps';
import {saveLayout} from '../ops/LayoutSerializer';
import {ZOOM_STEPS, type EditorState} from '../state/EditorState';

const log = Logger.getLogger('glaze.input.GlazeShortcuts');

/**
 * GlazeShortcuts — keyboard bindings for the editor, à la Glaze.
 *
 * Undo/redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z), clipboard (Ctrl+C/X/V), duplicate
 * (Ctrl+D), delete (Del/Backspace), save (Ctrl+S), select siblings (Ctrl+A), zoom
 * (Ctrl +/− and Ctrl+0), 1px nudge of the whole selection (arrows; ×snap with
 * Shift) and deselect (Esc). The listener is global but stands down whenever a
 * text field is focused — the Illumina `input` widgets bridge to a hidden DOM
 * `<input>`, so Ctrl+C/V and arrows there must edit text, not the node tree.
 */
export class GlazeShortcuts
{
    private readonly _state: EditorState;

    public constructor(state: EditorState)
    {
        this._state = state;
        window.addEventListener('keydown', this._onKeyDown, true);
    }

    private readonly _onKeyDown = (event: KeyboardEvent): void =>
    {
        if(this.isEditingText())
        {
            return;
        }

        const ctrl = event.ctrlKey || event.metaKey;
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

        if(ctrl && key === 'z' && !event.shiftKey)
        {
            event.preventDefault();
            this._state.undo();
        }
        else if(ctrl && (key === 'y' || (key === 'z' && event.shiftKey)))
        {
            event.preventDefault();
            this._state.redo();
        }
        else if(ctrl && key === 'c')
        {
            event.preventDefault();
            copySelected(this._state);
        }
        else if(ctrl && key === 'x')
        {
            event.preventDefault();
            cutSelected(this._state);
        }
        else if(ctrl && key === 'v')
        {
            event.preventDefault();
            pasteClipboard(this._state);
        }
        else if(ctrl && key === 'd')
        {
            event.preventDefault();
            cloneSelected(this._state);
        }
        else if(ctrl && key === 's')
        {
            event.preventDefault();
            void this.save();
        }
        else if(ctrl && key === 'a')
        {
            event.preventDefault();
            this.selectAllSiblings();
        }
        else if(ctrl && (key === '+' || key === '=' ))
        {
            event.preventDefault();
            this.stepZoom(1);
        }
        else if(ctrl && key === '-')
        {
            event.preventDefault();
            this.stepZoom(-1);
        }
        else if(ctrl && key === '0')
        {
            event.preventDefault();
            this._state.zoom = 1;
        }
        else if(key === 'Delete' || key === 'Backspace')
        {
            event.preventDefault();
            deleteSelected(this._state);
        }
        else if(key === 'ArrowUp')
        {
            event.preventDefault();
            this.nudge(0, -this.step(event));
        }
        else if(key === 'ArrowDown')
        {
            event.preventDefault();
            this.nudge(0, this.step(event));
        }
        else if(key === 'ArrowLeft')
        {
            event.preventDefault();
            this.nudge(-this.step(event), 0);
        }
        else if(key === 'ArrowRight')
        {
            event.preventDefault();
            this.nudge(this.step(event), 0);
        }
        else if(key === 'Escape')
        {
            this._state.select(null);
        }
    };

    /** Shift nudges by the grid step (or 10px if snapping is off); otherwise 1px. */
    private step(event: KeyboardEvent): number
    {
        return event.shiftKey ? (this._state.snap || 10) : 1;
    }

    private nudge(dx: number, dy: number): void
    {
        const nodes = this._state.selection.filter((win) => !win.disposed);

        if(nodes.length === 0)
        {
            return;
        }

        this._state.pushHistory('nudge');

        for(const node of nodes)
        {
            const win = node as unknown as WindowController;

            win.rectangle = {x: win.x + dx, y: win.y + dy, width: win.width, height: win.height};
        }

        this._state.notifyGeometryChanged();
    }

    /**
     * Ctrl+A selects the primary node's siblings — the set an align or distribute
     * is normally meant for. With only the root open it selects the root's own
     * children instead.
     */
    private selectAllSiblings(): void
    {
        const primary = this._state.selected;
        const parent = (primary && primary !== this._state.rootWindow ? primary.parent : this._state.rootWindow) ?? null;

        if(!parent || parent.disposed)
        {
            return;
        }

        const container = parent as unknown as { numChildren?: number; getChildAt?: (index: number) => IWindow | null };

        if(typeof container.numChildren !== 'number' || typeof container.getChildAt !== 'function')
        {
            return;
        }

        const siblings: IWindow[] = [];

        for(let i = 0; i < container.numChildren; i++)
        {
            const child = container.getChildAt(i);

            if(child && !child.disposed)
            {
                siblings.push(child);
            }
        }

        this._state.selectMany(siblings);
    }

    /** Moves the zoom one step up or down the toolbar's ladder. */
    private stepZoom(direction: number): void
    {
        const current = ZOOM_STEPS.reduce((best, step, index) =>
            Math.abs(step - this._state.zoom) < Math.abs(ZOOM_STEPS[best] - this._state.zoom) ? index : best, 0);

        this._state.zoom = ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, current + direction))];
    }

    private async save(): Promise<void>
    {
        const result = await saveLayout(this._state);

        log.info(`Save: ${result.message}`);
    }

    /** True when a DOM text field (the input-widget bridge) has focus. */
    private isEditingText(): boolean
    {
        const el = document.activeElement as HTMLElement | null;

        if(!el)
        {
            return false;
        }

        return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
    }

    public dispose(): void
    {
        window.removeEventListener('keydown', this._onKeyDown, true);
    }
}
