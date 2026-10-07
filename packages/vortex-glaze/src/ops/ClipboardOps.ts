import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import {deleteSelected} from './StructuralOps';
import type {EditorState} from '../state/EditorState';

interface IContainerLike { addChild(child: IWindow): IWindow; }

/**
 * Clipboard for node subtrees (Ctrl+C / Ctrl+X / Ctrl+V). No AS3 equivalent —
 * Glaze authoring tooling built on the engine's own `clone()` primitive.
 *
 * Copy stores a detached deep-clone of the selection, independent of the live
 * tree, so it survives edits, deletes and layout switches (all within the one
 * shared window context). Paste clones the stored node again, so the same copy
 * can be pasted repeatedly.
 */
let clipboard: WindowController[] = [];

export function hasClipboard(): boolean
{
    return clipboard.some((win) => !win.disposed);
}

/** Stores a detached clone of every selected node. */
export function copySelected(state: EditorState): void
{
    const nodes = state.selection.filter((win) => !win.disposed);

    if(nodes.length === 0)
    {
        return;
    }

    const previous = clipboard;

    clipboard = nodes.map((win) => (win as unknown as WindowController).clone() as unknown as WindowController);

    for(const stale of previous)
    {
        if(!stale.disposed)
        {
            stale.destroy();
        }
    }
}

/** Copies then deletes the selection (delete records its own undo step). */
export function cutSelected(state: EditorState): void
{
    const nodes = state.selection.filter((win) => !win.disposed && win !== state.rootWindow);

    if(nodes.length === 0)
    {
        return;
    }

    copySelected(state);
    deleteSelected(state);
}

/**
 * Pastes the clipboard as a sibling of the selection (or a child of the root when
 * the root is selected), offset by the grid, and selects the new node.
 */
export function pasteClipboard(state: EditorState): void
{
    const stored = clipboard.filter((win) => !win.disposed);

    if(stored.length === 0)
    {
        return;
    }

    const selected = (state.selected ?? state.rootWindow) as unknown as WindowController | null;

    if(!selected || selected.disposed)
    {
        return;
    }

    const parentWin = ((selected as unknown as IWindow) === state.rootWindow || !selected.parent)
        ? (selected as unknown as IWindow)
        : selected.parent;
    const container = parentWin.getLayoutChildTarget() as unknown as IContainerLike;
    const offset = state.snap || 8;

    state.pushHistory();

    const pasted: IWindow[] = [];

    for(const source of stored)
    {
        const copy = source.clone() as unknown as WindowController;

        container.addChild(copy as unknown as IWindow);
        copy.rectangle = {x: copy.x + offset, y: copy.y + offset, width: copy.width, height: copy.height};
        pasted.push(copy as unknown as IWindow);
    }

    state.notifyTreeChanged();
    state.selectMany(pasted);
}
