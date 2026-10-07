import {GlazeBoot} from './boot/GlazeBoot';
import {CanvasSurface} from './canvas/CanvasSurface';
import {EditorCanvasLayer} from './canvas/EditorCanvasLayer';
import {EditorState} from './state/EditorState';
import {GlazeChrome} from './ui/windows/GlazeChrome';
import {WindowHierarchy} from './ui/windows/WindowHierarchy';
import {WindowHierarchyControls} from './ui/windows/WindowHierarchyControls';
import {WindowProperty} from './ui/windows/WindowProperty';
import {WindowToolbar} from './ui/windows/WindowToolbar';
import {WindowBottomBar} from './ui/windows/WindowBottomBar';
import {WindowGallery} from './ui/windows/WindowGallery';
import {WindowPalette} from './ui/windows/WindowPalette';
import {WindowColorPicker} from './ui/windows/WindowColorPicker';
import {GlazeShortcuts} from './input/GlazeShortcuts';
import {layoutPngDataUrl} from './ops/ScreenshotOps';
import {importLayoutXml} from './ops/LayoutSerializer';
import {Scheduler} from '@ambreia/common/reactive/index';
import {HabboWindowTrackingEvent} from '@ambreia/ui/kit/enum/HabboWindowTrackingEvent';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('glaze.main');

async function main(): Promise<void>
{
    const root = document.getElementById('glaze-root');

    if(!root) throw new Error('#glaze-root missing');

    root.textContent = 'Booting window engine…';

    const runtime = await new GlazeBoot().boot();

    // Reactive-layer flush boundary: the window manager emits its RENDER
    // tracking event between input dispatch and rendering, and queued effects
    // run exactly there (docs/REACTIVE-UI.md §5). Consumer-side wiring — no
    // ported file is edited for this.
    Scheduler.attach(
        runtime.windowManager.events,
        HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_RENDER
    );

    root.innerHTML = '';

    const host = document.createElement('div');

    host.style.cssText = 'position:fixed;inset:0;background:#e7e7f4;';
    root.appendChild(host);

    // The whole editor renders through the window system onto one 2D canvas.
    const surface = new CanvasSurface(runtime.windowManager, host);

    surface.mount();

    const state = new EditorState(runtime);

    // Editor chrome (toolbar + Hierarchy View + Property Editor) as Habbo windows.
    const chrome = new GlazeChrome(state);

    chrome.mount();

    // Both panels dock to the left, so a layout centred on the whole desktop
    // would sit half-under them; the state centres inside the free canvas.
    state.contentInsets = () => chrome.contentInsets;

    const hierarchyList = chrome.hierarchyList;
    const hierarchy = hierarchyList ? new WindowHierarchy(state, hierarchyList, surface) : null;

    // The palette doubles as the strip's type picker, so it exists before the strip.
    const palette = new WindowPalette(state);

    const hcBar = chrome.hierarchyControls;
    const hierarchyControls = hcBar ? new WindowHierarchyControls(state, hcBar, hierarchy, palette) : null;

    const colorPicker = new WindowColorPicker(state);
    const propertyList = chrome.propertyList;
    const property = propertyList ? new WindowProperty(state, propertyList, colorPicker) : null;

    const gallery = new WindowGallery(state);
    const toolbar = chrome.toolbar ? new WindowToolbar(state, chrome.toolbar, gallery, palette) : null;

    // The bar reflows to the canvas width and reports its height, which is where
    // the panels below start — so the chrome lays itself out through it.
    chrome.setToolbarSizer(toolbar ? (width) => toolbar.layout(width) : null);
    surface.setResizeHandler(() => chrome.relayout());
    const bottomBar = chrome.bottomBar ? new WindowBottomBar(state, chrome.bottomBar, colorPicker) : null;

    chrome.setBottomSizer(bottomBar ? (width) => bottomBar.layout(width) : null);

    // Direct manipulation (select/move/resize + handles) in the canvas centre.
    const editorCanvas = new EditorCanvasLayer(state, surface, () => chrome.contentInsets);

    // Keyboard shortcuts (undo/redo, copy/cut/paste, duplicate, delete, nudge, save).
    const shortcuts = new GlazeShortcuts(state);

    // Open a starting layout (renders on layer 1, under the chrome).
    const names = state.getLayoutNames();
    const initial = names.find((n) => n === 'add_friends_tab_xml')
        ?? names.find((n) => /achievement_competition_prizes/i.test(n))
        ?? names[0];

    if(initial)
    {
        state.openLayout(initial);
    }

    log.info(`Ready — ${names.length} layouts, chrome mounted`);

    // `preview` + `screenshot` are the headless halves of Import Layout and Save Screenshot:
    // together they let `render.mjs` (see the design-habbo-window skill) push authored XML in
    // over CDP and pull the cropped pixels back out, with no human clicking and no reload —
    // the XML need not be a registered layout, or even a file in the project yet.
    (window as unknown as { glaze: unknown }).glaze = {runtime, state, chrome, hierarchy, hierarchyControls, property, toolbar, bottomBar, gallery, palette, colorPicker, editorCanvas, shortcuts, surface, screenshot: () => layoutPngDataUrl(state), preview: (xml: string, name: string) => importLayoutXml(state, xml, name)};
}

void main().catch((error) =>
{
    log.error('Glaze boot failed:', error);

    const root = document.getElementById('glaze-root');

    if(root)
    {
        root.textContent = `Glaze boot failed: ${error instanceof Error ? error.message : String(error)}`;
    }
});
