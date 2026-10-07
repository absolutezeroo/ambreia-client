import type {Container} from 'pixi.js';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';

/**
 * One live room-preview canvas and the window it visually belongs to.
 */
interface IPreviewCanvasEntry
{
    canvas: Container;
    window: IWindow;
}

/**
 * Orders every room-preview canvas on the shared PixiJS stage.
 *
 * TS-only, and it exists because of a deviation this port already carries:
 * `RoomEngine.createRoomCanvas()` parents a preview canvas directly onto the
 * root stage instead of into the window that hosts it. In AS3 the canvas is a
 * child of the widget's own window (`RoomPreviewerWidget.as`), so Flash's
 * display list orders these for free and nothing like this class is needed.
 *
 * Parented onto the stage, the canvases are siblings of each other AND of the
 * main room view, with no knowledge of the window z-order — so each previewer
 * used to re-assert front-of-stage for itself on every frame. That is right
 * with one previewer (it does have to sit above the room view) and wrong with
 * two: the inventory's and the catalog's fought over the same top slot, and
 * whichever synced last covered the other wherever their screen rects
 * overlapped. Dragging the inventory over the catalog's preview showed the
 * CATALOG's furniture inside the inventory's frame; clicking between the two
 * windows reshuffled it, which is what made it look intermittent.
 *
 * No canvas can resolve that alone — they cannot see each other. So they all
 * register here, and this class lifts them above the rest of the stage while
 * ordering them among themselves by their host windows' depth: the answer the
 * window system would have given had these been ordinary child windows.
 */
export class PreviewCanvasStack
{
    private static readonly ENTRIES: Map<Container, IPreviewCanvasEntry> = new Map();

    /** Above the chat bubble root's zIndex 1 (RoomEngine.addStageChild()). */
    private static readonly Z_INDEX: number = 2;

    /**
	 * Adds a canvas to the stack. `window` is the window whose z-order the
	 * canvas should follow — the wrapper the canvas is drawn inside.
	 */
    public static register(canvas: Container, window: IWindow): void
    {
        // RoomEngine.addStageChild() makes the stage sortable and puts the chat bubble root at
        // zIndex 1; PixiJS sorts by zIndex before child order, so at the default 0 every
        // setChildIndex() in restack() still left the room's chat bubbles drawn over the preview.
        // In AS3 the canvas sits inside its window, and windows are above the chat.
        canvas.zIndex = PreviewCanvasStack.Z_INDEX;
        PreviewCanvasStack.ENTRIES.set(canvas, {canvas, window});
    }

    public static unregister(canvas: Container | null): void
    {
        if(canvas) PreviewCanvasStack.ENTRIES.delete(canvas);
    }

    /**
	 * Re-orders the registered canvases if they are not already correct.
	 *
	 * Called from each previewer's per-frame position sync, so the no-op path
	 * matters: it runs several times a frame once more than one preview is
	 * open.
	 */
    public static restack(): void
    {
        if(PreviewCanvasStack.ENTRIES.size === 0) return;

        const ordered = [...PreviewCanvasStack.ENTRIES.values()]
            .filter((entry) => entry.canvas.parent)
            .map((entry) => ({entry, path: PreviewCanvasStack.zOrderPath(entry.window)}))
            .sort((a, b) => PreviewCanvasStack.comparePaths(a.path, b.path));

        if(ordered.length === 0) return;

        const stage = ordered[0].entry.canvas.parent;

        if(!stage) return;

        // All entries must share one parent for a single pass to order them;
        // if they somehow do not, fall back to lifting each within its own.
        const first = stage.children.length - ordered.length;
        let sorted = first >= 0;

        if(sorted)
        {
            for(let i = 0; i < ordered.length; i++)
            {
                if(stage.children[first + i] !== ordered[i].entry.canvas)
                {
                    sorted = false;
                    break;
                }
            }
        }

        if(sorted) return;

        // Raising each in ascending window order leaves the front-most window's
        // canvas last, and every preview above all other stage children.
        for(const {entry} of ordered)
        {
            const parent = entry.canvas.parent;

            if(parent) parent.setChildIndex(entry.canvas, parent.children.length - 1);
        }
    }

    /**
	 * A window's position in the desktop's z-order, as the chain of child
	 * indexes from the root down to it.
	 *
	 * Compared element by element, a larger path means "in front":
	 * `WindowRenderer.renderWindowBranch()` walks `getChildAt(0..n)` ascending,
	 * so a later child is drawn over an earlier one.
	 */
    private static zOrderPath(window: IWindow): number[]
    {
        const path: number[] = [];
        let node: IWindow | null = window;

        while(node)
        {
            const parent: IWindow | null = node.parent;

            if(!parent) break;

            path.push((parent as unknown as IWindowContainer).getChildIndex(node));
            node = parent;
        }

        return path.reverse();
    }

    /**
	 * Lexicographic compare of two z-order paths. A prefix sorts before the
	 * longer path it prefixes, i.e. an ancestor sits behind its own
	 * descendants — the order `WindowRenderer` draws them in.
	 */
    private static comparePaths(a: number[], b: number[]): number
    {
        const length = Math.min(a.length, b.length);

        for(let i = 0; i < length; i++)
        {
            if(a[i] !== b[i]) return a[i] - b[i];
        }

        return a.length - b.length;
    }
}
