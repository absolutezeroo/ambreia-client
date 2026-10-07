import {TYPE_NAME_TO_CODE} from '@ambreia/ui/enum/WindowType';

/**
 * A widget the editor can drop into the tree: the window type plus the geometry,
 * caption and style it should be born with (a `button` with no caption and a
 * 60×30 box is not recognisable as a button).
 */
export interface IWidgetSpec
{
    type: string;
    label: string;
    width: number;
    height: number;
    category?: string;
    caption?: string;
    style?: number;
    params?: number;
}

/**
 * The widget library — one entry per window type the engine can actually build.
 *
 * Coverage is measured against `TYPE_NAME_TO_CODE`, the tag table the layout
 * parser itself reads, and {@link assertCatalogCoverage} reports any drift in dev.
 * Four tags are deliberately absent, and they are the whole reason this is a
 * hand-written list rather than a loop over that table:
 *
 * - `null` — the parser's fallback for an unresolved tag, not a widget.
 * - `itemlist` — the same type code (50) as `itemlist_vertical`; the reverse map
 *   resolves 50 back to `itemlist_vertical`, so an `itemlist` node would save
 *   itself out under the other name.
 * - `button_icon` — type 62, which `Classes` leaves unregistered exactly as AS3
 *   does. `create()` on it returns nothing. The live icon button is `iconbutton`
 *   (79), which is here.
 * - `itemgrid_horizontal` — `ItemGridController`'s constructor throws
 *   "Horizontal item grid not yet implemented!" on this type, so offering it
 *   would put an unbuildable row in the library. Restore it here once that
 *   controller handles the horizontal case.
 *
 * `params` follows the convention the shipped layouts use for each family rather
 * than any single element's value: `1` (INPUT_EVENT_PROCESSOR) for a control that
 * must see the mouse, `17` (+ USE_PARENT_GRAPHIC_CONTEXT) for a clickable that
 * draws into its parent's context, `16` for a pure visual, `0` for the lists that
 * arrange their own children. Where a type has a well-known composite value in
 * the layouts — `input` at 2177, `tab_context` at 2064, `tab_container_button` at
 * 147473 — that value is used verbatim.
 */
export const WIDGET_CATALOG: IWidgetSpec[] = [
    // ── Structure ────────────────────────────────────────────────────────────
    {category: 'Structure', type: 'container', label: 'Container', width: 160, height: 90, params: 16},
    {category: 'Structure', type: 'region', label: 'Region (clickable)', width: 120, height: 40, params: 17},
    {category: 'Structure', type: 'boxsizer', label: 'Box sizer', width: 180, height: 60, params: 16},
    {category: 'Structure', type: 'widget', label: 'Widget', width: 120, height: 60, params: 16},
    {category: 'Structure', type: 'background', label: 'Background', width: 160, height: 24, params: 16},
    {category: 'Structure', type: 'header', label: 'Header', width: 180, height: 24, caption: 'Header', params: 16},
    {category: 'Structure', type: 'toolbar', label: 'Toolbar', width: 200, height: 28, params: 16},
    {category: 'Structure', type: 'activator', label: 'Activator', width: 120, height: 24, params: 17},

    // ── Frames & borders ─────────────────────────────────────────────────────
    {category: 'Frames', type: 'frame', label: 'Frame', width: 200, height: 140, caption: 'Frame', params: 1},
    {category: 'Frames', type: 'frame_thin', label: 'Frame (thin)', width: 200, height: 140, caption: 'Frame', params: 1},
    {category: 'Frames', type: 'frame_thick', label: 'Frame (thick)', width: 200, height: 140, caption: 'Frame', params: 1},
    {category: 'Frames', type: 'frame_notify', label: 'Frame (notify)', width: 200, height: 140, caption: 'Frame', params: 1},
    {category: 'Frames', type: 'border', label: 'Border', width: 140, height: 60, params: 16},
    {category: 'Frames', type: 'border_thin', label: 'Border (thin)', width: 140, height: 60, params: 16},
    {category: 'Frames', type: 'border_thick', label: 'Border (thick)', width: 140, height: 60, params: 16},
    {category: 'Frames', type: 'border_notify', label: 'Border (notify)', width: 140, height: 60, params: 16},

    // ── Bubbles & popups ─────────────────────────────────────────────────────
    {category: 'Bubbles', type: 'bubble', label: 'Bubble', width: 160, height: 90, params: 1},
    {category: 'Bubbles', type: 'bubble_pointer_up', label: 'Bubble pointer (up)', width: 16, height: 10, params: 16},
    {category: 'Bubbles', type: 'bubble_pointer_right', label: 'Bubble pointer (right)', width: 11, height: 18, params: 16},
    {category: 'Bubbles', type: 'bubble_pointer_down', label: 'Bubble pointer (down)', width: 16, height: 11, params: 16},
    {category: 'Bubbles', type: 'bubble_pointer_left', label: 'Bubble pointer (left)', width: 11, height: 18, params: 16},
    {category: 'Bubbles', type: 'tooltip', label: 'Tooltip', width: 140, height: 24, caption: 'Tooltip', params: 16},
    {category: 'Bubbles', type: 'notify', label: 'Notify', width: 180, height: 60, params: 16},

    // ── Text ─────────────────────────────────────────────────────────────────
    {category: 'Text', type: 'text', label: 'Text', width: 140, height: 32, caption: 'Text', params: 16},
    {category: 'Text', type: 'label', label: 'Label', width: 110, height: 16, caption: 'Label', params: 16},
    {category: 'Text', type: 'formatted_text', label: 'Formatted text', width: 160, height: 48, caption: 'Formatted', params: 16},
    {category: 'Text', type: 'html', label: 'HTML text', width: 200, height: 40, caption: 'HTML', params: 1},
    {category: 'Text', type: 'link', label: 'Link', width: 110, height: 16, caption: 'Link', params: 17},
    {category: 'Text', type: 'icon', label: 'Icon', width: 16, height: 16, params: 16},

    // ── Buttons ──────────────────────────────────────────────────────────────
    {category: 'Buttons', type: 'button', label: 'Button', width: 90, height: 26, caption: 'Button', params: 1},
    {category: 'Buttons', type: 'button_thick', label: 'Button (thick)', width: 90, height: 28, caption: 'Button', params: 1},
    {category: 'Buttons', type: 'iconbutton', label: 'Icon button', width: 26, height: 26, params: 1},
    {category: 'Buttons', type: 'container_button', label: 'Container button', width: 110, height: 30, params: 17},
    {category: 'Buttons', type: 'closebutton', label: 'Close button', width: 20, height: 20, params: 1},
    {category: 'Buttons', type: 'minimizebox', label: 'Minimize box', width: 20, height: 20, params: 1},
    {category: 'Buttons', type: 'maximizebox', label: 'Maximize box', width: 20, height: 20, params: 1},
    {category: 'Buttons', type: 'restorebox', label: 'Restore box', width: 20, height: 20, params: 1},
    {category: 'Buttons', type: 'button_up', label: 'Button (up)', width: 22, height: 22, params: 1},
    {category: 'Buttons', type: 'button_down', label: 'Button (down)', width: 22, height: 22, params: 1},
    {category: 'Buttons', type: 'button_left', label: 'Button (left)', width: 22, height: 22, params: 1},
    {category: 'Buttons', type: 'button_right', label: 'Button (right)', width: 22, height: 22, params: 1},
    {category: 'Buttons', type: 'button_group_left', label: 'Button group (left)', width: 60, height: 24, caption: 'Left', params: 1},
    {category: 'Buttons', type: 'button_group_center', label: 'Button group (center)', width: 60, height: 24, caption: 'Mid', params: 1},
    {category: 'Buttons', type: 'button_group_right', label: 'Button group (right)', width: 60, height: 24, caption: 'Right', params: 1},
    {category: 'Buttons', type: 'checkbox', label: 'Checkbox', width: 19, height: 20, params: 17},
    {category: 'Buttons', type: 'radiobutton', label: 'Radio button', width: 19, height: 20, params: 17},
    {category: 'Buttons', type: 'selector', label: 'Selector', width: 120, height: 24, caption: 'Selector', params: 1},
    {category: 'Buttons', type: 'selector_list', label: 'Selector list', width: 200, height: 60, params: 1},

    // ── Input ────────────────────────────────────────────────────────────────
    {category: 'Input', type: 'input', label: 'Input field', width: 150, height: 20, params: 2177},
    {category: 'Input', type: 'password', label: 'Password field', width: 150, height: 20, params: 2177},
    {category: 'Input', type: 'dropmenu', label: 'Drop menu', width: 150, height: 22, params: 1},
    {category: 'Input', type: 'droplist', label: 'Drop list', width: 150, height: 26, params: 1},
    {category: 'Input', type: 'slider', label: 'Slider', width: 140, height: 20, params: 1},
    {category: 'Input', type: 'slider_horizontal', label: 'Slider (horizontal)', width: 140, height: 20, params: 1},
    {category: 'Input', type: 'slider_vertical', label: 'Slider (vertical)', width: 20, height: 140, params: 1},
    {category: 'Input', type: 'scaler', label: 'Scaler', width: 50, height: 10, params: 1},
    {category: 'Input', type: 'scaler_horizontal', label: 'Scaler (horizontal)', width: 50, height: 10, params: 1},
    {category: 'Input', type: 'scaler_vertical', label: 'Scaler (vertical)', width: 10, height: 50, params: 1},

    // ── Lists & grids ────────────────────────────────────────────────────────
    {category: 'Lists', type: 'itemlist_vertical', label: 'Item list (vertical)', width: 160, height: 90, params: 0},
    {category: 'Lists', type: 'itemlist_horizontal', label: 'Item list (horizontal)', width: 160, height: 40, params: 0},
    {category: 'Lists', type: 'itemgrid', label: 'Item grid', width: 160, height: 90, params: 0},
    {category: 'Lists', type: 'itemgrid_vertical', label: 'Item grid (vertical)', width: 160, height: 90, params: 0},
    {category: 'Lists', type: 'scrollable_itemlist', label: 'Scrollable list', width: 170, height: 110, params: 16},
    {category: 'Lists', type: 'scrollable_itemlist_vertical', label: 'Scrollable list (vertical)', width: 170, height: 110, params: 16},
    {category: 'Lists', type: 'scrollable_itemlist_horizontal', label: 'Scrollable list (horizontal)', width: 170, height: 60, params: 16},
    {category: 'Lists', type: 'scrollable_itemgrid_vertical', label: 'Scrollable grid (vertical)', width: 170, height: 110, params: 16},

    // ── Tabs ─────────────────────────────────────────────────────────────────
    {category: 'Tabs', type: 'tab_context', label: 'Tab context', width: 220, height: 140, params: 2064},
    {category: 'Tabs', type: 'tab_content', label: 'Tab content', width: 200, height: 120, params: 16},
    {category: 'Tabs', type: 'tab_selector', label: 'Tab selector', width: 200, height: 30, params: 1},
    {category: 'Tabs', type: 'tab_button', label: 'Tab button', width: 90, height: 26, caption: 'Tab', params: 17},
    {category: 'Tabs', type: 'tab_container_button', label: 'Tab container button', width: 90, height: 26, caption: 'Tab', params: 147473},

    // ── Menus ────────────────────────────────────────────────────────────────
    {category: 'Menus', type: 'menu', label: 'Menu', width: 160, height: 120, params: 16},
    {category: 'Menus', type: 'submenu', label: 'Submenu', width: 160, height: 100, params: 16},
    {category: 'Menus', type: 'menu_item', label: 'Menu item', width: 150, height: 20, caption: 'Item', params: 17},
    {category: 'Menus', type: 'dropmenu_item', label: 'Drop menu item', width: 150, height: 20, caption: 'Item', params: 17},
    {category: 'Menus', type: 'droplist_item', label: 'Drop list item', width: 150, height: 20, caption: 'Item', params: 17},

    // ── Graphics ─────────────────────────────────────────────────────────────
    {category: 'Graphics', type: 'static_bitmap', label: 'Static bitmap', width: 48, height: 48, params: 16},
    {category: 'Graphics', type: 'bitmap', label: 'Bitmap', width: 48, height: 48, params: 16},
    {category: 'Graphics', type: 'shape', label: 'Shape', width: 80, height: 40, params: 16},
    {category: 'Graphics', type: 'gradient', label: 'Gradient', width: 160, height: 16, params: 16},
    {category: 'Graphics', type: 'stroke', label: 'Stroke', width: 160, height: 4, params: 16},
    {category: 'Graphics', type: 'bitmap_fill', label: 'Bitmap fill', width: 120, height: 60, params: 16},
    {category: 'Graphics', type: 'display_object_wrapper', label: 'Display object wrapper', width: 120, height: 80, params: 16},

    // ── Scrollbars ───────────────────────────────────────────────────────────
    {category: 'Scrollbars', type: 'scrollbar_vertical', label: 'Scrollbar (vertical)', width: 17, height: 90, params: 16},
    {category: 'Scrollbars', type: 'scrollbar_horizontal', label: 'Scrollbar (horizontal)', width: 90, height: 17, params: 16},
    {category: 'Scrollbars', type: 'dragbar', label: 'Drag bar', width: 90, height: 17, params: 16},
    {category: 'Scrollbars', type: 'scrollbar_slider_bar_vertical', label: 'Slider bar (vertical)', width: 9, height: 40, params: 16},
    {category: 'Scrollbars', type: 'scrollbar_slider_bar_horizontal', label: 'Slider bar (horizontal)', width: 40, height: 9, params: 16},
    {category: 'Scrollbars', type: 'scrollbar_slider_track_vertical', label: 'Slider track (vertical)', width: 9, height: 40, params: 16},
    {category: 'Scrollbars', type: 'scrollbar_slider_track_horizontal', label: 'Slider track (horizontal)', width: 40, height: 9, params: 16},
    {category: 'Scrollbars', type: 'scrollbar_slider_button_up', label: 'Slider button (up)', width: 17, height: 16, params: 1},
    {category: 'Scrollbars', type: 'scrollbar_slider_button_down', label: 'Slider button (down)', width: 17, height: 16, params: 1},
    {category: 'Scrollbars', type: 'scrollbar_slider_button_left', label: 'Slider button (left)', width: 16, height: 17, params: 1},
    {category: 'Scrollbars', type: 'scrollbar_slider_button_right', label: 'Slider button (right)', width: 16, height: 17, params: 1}
];

/** Tags the catalog leaves out on purpose — see the catalog's own doc comment. */
const EXCLUDED_TYPES = new Set(['null', 'itemlist', 'button_icon', 'itemgrid_horizontal']);

const BY_TYPE = new Map(WIDGET_CATALOG.map((spec) => [spec.type, spec]));

/** The catalog entry for a type name, or null when it has none. */
export function specFor(type: string): IWidgetSpec | null
{
    return BY_TYPE.get(type) ?? null;
}

/** The catalog's entries grouped by category, in catalog order. */
export function catalogByCategory(): Array<{ category: string; specs: IWidgetSpec[] }>
{
    const groups: Array<{ category: string; specs: IWidgetSpec[] }> = [];

    for(const spec of WIDGET_CATALOG)
    {
        const category = spec.category ?? 'Other';
        const last = groups[groups.length - 1];

        if(last && last.category === category)
        {
            last.specs.push(spec);

            continue;
        }

        groups.push({category, specs: [spec]});
    }

    return groups;
}

/**
 * Reports the gap between the catalog and the parser's tag table, both ways.
 *
 * The catalog is hand-written so it can carry per-type geometry and captions,
 * which means a type added to the engine would silently never appear here. This
 * turns that into a message; {@link WindowPalette} logs it once at startup in
 * dev builds.
 */
export function assertCatalogCoverage(): { missing: string[]; unknown: string[] }
{
    const known = Object.keys(TYPE_NAME_TO_CODE);

    return {
        missing: known.filter((type) => !EXCLUDED_TYPES.has(type) && !BY_TYPE.has(type)),
        unknown: WIDGET_CATALOG
            .map((spec) => spec.type)
            .filter((type) => TYPE_NAME_TO_CODE[type] === undefined)
    };
}
