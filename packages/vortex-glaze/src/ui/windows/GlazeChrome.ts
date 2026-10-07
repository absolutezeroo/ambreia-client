import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import type {IHabboWindowManager} from '@habbo/window';
import type {EditorState} from '../../state/EditorState';
import {Logger} from '@ambreia/common/utils/Logger';
import type {GlazeLayoutName} from '../GlazeLayoutSlots';
import {slotsOf} from '../LayoutSlots';

const log = Logger.getLogger('glaze.ui.windows.GlazeChrome');

const HIERARCHY = slotsOf('glaze_hierarchy_xml');
const PROPERTY = slotsOf('glaze_property_xml');
const SPLITTER = slotsOf('glaze_splitter_xml');

/** Desktop layer the editor chrome lives on (above the edited layout on layer 1). */
const CHROME_LAYER = 2;
const TOOLBAR_H = 78;
const BOTTOM_H = 28;
const LEFT_W = 330;
const PROP_W = 356;
const MIN_LEFT_W = 200;
const MIN_PROP_W = 240;
/** Width of the "drag to resize" strip Glaze puts on each panel's right edge. */
const SPLIT_W = 14;
/** Height of that strip's rotated caption, and the breathing room around it. */
const SPLIT_LABEL_H = 90;
const SPLIT_RULE_GAP = 4;
/** The canvas never gives up more than this to the panels. */
const MIN_CANVAS_W = 240;

/** The panels' header band; their content starts under it, edge to edge. */
const PANEL_HEADER_H = 22;

/** Height of the Hierarchy View's action strip above the tree (three 24px rows). */
const HIERARCHY_CONTROLS_H = 88;

interface IContainerLike { addChild(child: IWindow): IWindow; }
interface IBitmapLike { bitmapData: ImageBitmap | null; invalidate(): void; }

/**
 * GlazeChrome — the editor shell, built entirely from Habbo window widgets.
 *
 * The toolbar and the two titled Illumina frames (Hierarchy View, Property
 * Editor) are authored as XML layouts and built onto desktop layer 2, above the
 * edited layout (layer 1). The centre is left empty so the edited layout shows
 * through; the opaque panels cover its overflow. Everything composites onto the
 * same 2D canvas as the game UI — no DOM.
 */
export class GlazeChrome
{
    private readonly _state: EditorState;
    private readonly _wm: IHabboWindowManager;

    private _toolbar: IWindow | null = null;
    private _hierarchy: IWindow | null = null;
    private _property: IWindow | null = null;
    private _bottom: IWindow | null = null;
    private _splitLeft: IWindow | null = null;
    private _splitProp: IWindow | null = null;
    private _toolbarSizer: ((width: number) => number) | null = null;
    private _bottomSizer: ((width: number) => void) | null = null;
    private _toolbarHeight = TOOLBAR_H;
    /** Widths the user asked for through the splitters; the layout clamps them. */
    private _leftWidth = LEFT_W;
    private _propWidth = PROP_W;
    private _shownLeft = LEFT_W;
    private _shownProp = PROP_W;

    /** The rotated caption, drawn once and shared by both strips. */
    private static _label: ImageBitmap | null = null;
    private static _labelDrawn = false;

    public constructor(state: EditorState)
    {
        this._state = state;
        this._wm = state.runtime.windowManager;
    }

    /**
     * Both panels dock to the left, as Glaze has them, so the canvas is the one
     * open area on the right and `right` is always 0.
     */
    public get contentInsets(): { top: number; left: number; right: number; bottom: number }
    {
        return {
            top: this._toolbarHeight,
            left: this._shownLeft + this._shownProp + SPLIT_W * 2,
            right: 0,
            bottom: BOTTOM_H
        };
    }

    /**
     * Registers the toolbar's reflow. The bar packs itself into the canvas width
     * and reports the height it needs, which decides where the panels start —
     * so the chrome cannot be laid out until the toolbar exists (it is built
     * after `mount()`), and registering re-runs the layout.
     */
    public setToolbarSizer(sizer: ((width: number) => number) | null): void
    {
        this._toolbarSizer = sizer;
        this.layout();
    }

    /** Same contract for the status bar, which packs its readouts right. */
    public setBottomSizer(sizer: ((width: number) => void) | null): void
    {
        this._bottomSizer = sizer;
        this.layout();
    }

    public get hierarchyList(): IWindow | null
    {
        return HIERARCHY.find(this._hierarchy, 'glaze_hierarchy_list');
    }

    public get hierarchyControls(): IWindow | null
    {
        return HIERARCHY.find(this._hierarchy, 'glaze_hierarchy_controls');
    }

    public get propertyList(): IWindow | null
    {
        return PROPERTY.find(this._property, 'glaze_property_list');
    }

    public get toolbar(): IWindow | null
    {
        return this._toolbar;
    }

    public get bottomBar(): IWindow | null
    {
        return this._bottom;
    }

    public mount(): void
    {
        this._toolbar = this.build('glaze_toolbar_xml');
        this._hierarchy = this.build('glaze_hierarchy_xml');
        this._property = this.build('glaze_property_xml');
        this._bottom = this.build('glaze_bottombar_xml');
        this._splitLeft = this.splitter('left');
        this._splitProp = this.splitter('prop');

        this.layout();
        window.addEventListener('resize', this._onResize);
    }

    /**
     * The strip's rotated caption. The window system has no text rotation, so
     * Glaze's vertical "drag to resize" is drawn once into a bitmap and shown
     * through a `static_bitmap` — the same route the Image Gallery thumbnails
     * take, and it keeps the strip inside the window system.
     */
    private static splitterLabel(): ImageBitmap | null
    {
        if(GlazeChrome._labelDrawn) return GlazeChrome._label;

        GlazeChrome._labelDrawn = true;

        const canvas = new OffscreenCanvas(SPLIT_W - 2, SPLIT_LABEL_H);
        const ctx = canvas.getContext('2d');

        if(!ctx) return null;

        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
        ctx.font = '10px Verdana, Tahoma, sans-serif';
        ctx.fillStyle = '#4a4a58';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('drag to resize', SPLIT_LABEL_H / 2, canvas.width / 2);

        GlazeChrome._label = canvas.transferToImageBitmap();

        return GlazeChrome._label;
    }

    /**
     * One "drag to resize" strip. Dragging is tracked on the document rather
     * than through window events: the pointer leaves the narrow strip on the
     * very first move, and the window system stops reporting once it does.
     */
    private splitter(which: 'left' | 'prop'): IWindow | null
    {
        const win = this.build('glaze_splitter_xml');

        if(!win) return null;

        const label = SPLITTER.findAs<IBitmapLike>(win, 'glaze_splitter_label');

        if(label)
        {
            label.bitmapData = GlazeChrome.splitterLabel();
            label.invalidate();
        }

        (win as unknown as WindowController).procedure = (event: WindowEvent): void =>
        {
            if(event.type !== WindowMouseEvent.DOWN) return;

            const from = which === 'left' ? this._leftWidth : this._propWidth;
            let origin: number | null = null;

            const move = (e: MouseEvent): void =>
            {
                origin ??= e.clientX;

                const next = from + (e.clientX - origin);

                if(which === 'left') this._leftWidth = Math.max(MIN_LEFT_W, next);
                else this._propWidth = Math.max(MIN_PROP_W, next);

                this.layout();
            };
            const up = (): void =>
            {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        };

        return win;
    }

    private build(name: GlazeLayoutName): IWindow | null
    {
        const win = this._wm.buildWidgetLayout(name, CHROME_LAYER);

        if(!win)
        {
            log.warn(`Chrome layout "${name}" failed to build`);

            return null;
        }

        // buildFromXML can return the root detached; ensure it is on the layer-2 desktop.
        if(!win.parent)
        {
            const desktop = this._wm.getDesktop(CHROME_LAYER);

            if(desktop)
            {
                (desktop as unknown as IContainerLike).addChild(win);
            }
        }

        return win;
    }

    /** Re-runs the layout; the canvas calls this after it resizes the desktops. */
    public relayout(): void
    {
        this.layout();
    }

    private readonly _onResize = (): void => this.layout();

    private layout(): void
    {
        const desktop = this._wm.getDesktop(CHROME_LAYER);

        if(!desktop)
        {
            return;
        }

        const w = desktop.width;
        const h = desktop.height;

        // On a narrow canvas the two panels would leave no editing area at all,
        // so they give ground together before the centre does.
        const budget = Math.max(MIN_LEFT_W + MIN_PROP_W, w - MIN_CANVAS_W - SPLIT_W * 2);
        let left = Math.max(MIN_LEFT_W, this._leftWidth);
        let prop = Math.max(MIN_PROP_W, this._propWidth);

        if(left + prop > budget)
        {
            left = Math.max(MIN_LEFT_W, Math.floor(budget * (left / (left + prop))));
            prop = Math.max(MIN_PROP_W, budget - left);
        }

        this._shownLeft = left;
        this._shownProp = prop;
        this._toolbarHeight = this._toolbarSizer ? this._toolbarSizer(w) : TOOLBAR_H;

        const top = this._toolbarHeight;
        const midH = Math.max(80, h - top - BOTTOM_H);

        this.setRect(this._toolbar, 0, 0, w, top);
        this.setRect(this._hierarchy, 0, top, left, midH);
        this.setRect(this._splitLeft, left, top, SPLIT_W, midH);
        this.setRect(this._property, left + SPLIT_W, top, prop, midH);
        this.setRect(this._splitProp, left + SPLIT_W + prop, top, SPLIT_W, midH);
        this.setRect(this._bottom, 0, h - BOTTOM_H, w, BOTTOM_H);
        this.centerSplitterLabel(this._splitLeft, midH);
        this.centerSplitterLabel(this._splitProp, midH);
        this._bottomSizer?.(w);
        this.fitPanelContents(midH);
    }

    /**
     * Centres the caption and runs the rule from top to bottom around it — Glaze
     * breaks the line for the text rather than drawing over or beside it.
     */
    private centerSplitterLabel(splitter: IWindow | null, midH: number): void
    {
        const top = Math.max(0, Math.round((midH - SPLIT_LABEL_H) / 2));
        const bottom = top + SPLIT_LABEL_H;

        this.setRect(SPLITTER.find(splitter, 'glaze_splitter_label'), 1, top, SPLIT_W - 2, SPLIT_LABEL_H);
        this.setRect(SPLITTER.find(splitter, 'glaze_splitter_rule_top'), 6, 0, 1, Math.max(0, top - SPLIT_RULE_GAP));
        this.setRect(
            SPLITTER.find(splitter, 'glaze_splitter_rule_bottom'),
            6, bottom + SPLIT_RULE_GAP, 1, Math.max(0, midH - bottom - SPLIT_RULE_GAP)
        );
    }

    /**
     * Sizes each panel's list to its frame. The lists are authored at a fixed size
     * and carry no relative-scaling flags, so a resized frame leaves them behind:
     * short of the bottom on a tall window, past it on a short one.
     */
    private fitPanelContents(midH: number): void
    {
        const contentH = Math.max(60, midH - PANEL_HEADER_H);

        this.setRect(
            this.hierarchyControls,
            0, PANEL_HEADER_H,
            Math.max(120, this._shownLeft),
            HIERARCHY_CONTROLS_H
        );
        this.setRect(
            this.hierarchyList,
            0, PANEL_HEADER_H + HIERARCHY_CONTROLS_H,
            Math.max(120, this._shownLeft),
            Math.max(60, contentH - HIERARCHY_CONTROLS_H)
        );
        this.setRect(
            this.propertyList,
            0, PANEL_HEADER_H,
            Math.max(160, this._shownProp),
            contentH
        );
    }

    private setRect(win: IWindow | null, x: number, y: number, width: number, height: number): void
    {
        if(!win || win.disposed)
        {
            return;
        }

        (win as unknown as WindowController).rectangle = {x, y, width, height};
    }

    public dispose(): void
    {
        window.removeEventListener('resize', this._onResize);
        this._toolbar?.destroy();
        this._hierarchy?.destroy();
        this._property?.destroy();
        this._bottom?.destroy();
        this._splitLeft?.destroy();
        this._splitProp?.destroy();
    }
}
