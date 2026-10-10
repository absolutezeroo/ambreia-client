import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindowUpdateReceiver} from '../IWindowUpdateReceiver';
import type {EventEmitter} from 'eventemitter3';
import type {IElementDescriptionData} from './IElementDescriptor';
import type {ElementRegistry} from './ElementRegistry';
import type {AssetUrlSource} from '../IResourceManager';
import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IInputEventTracker} from '../IInputEventTracker';
import type {IWidgetWindow} from '../components/IWidgetWindow';
import type {IWidget} from '../IWidget';
import type {IWindowRenderer} from '../graphics/IWindowRenderer';
import type {ISkinRenderer} from '../graphics/renderer/ISkinRenderer';
import type {ISkinContainer} from '../graphics/ISkinContainer';
import type {IResourceManager} from '../IResourceManager';
import type {ISkinData} from '../graphics/renderer/BitmapSkinParser';
import type {WindowEvent} from '../events/WindowEvent';
import type {IModalDialog} from './utils/IModalDialog';
import type {IInternalWindowServices} from "../index";
import type {AlertDialogCallback, IAlertDialog} from './utils/AlertDialog';
import type {IAlertDialogWithLink} from './utils/AlertDialogWithLink';
import type {IConfirmDialog} from './utils/ConfirmDialog';

/**
 * The window manager: contexts, XML layouts, dialogs, rendering, assets, hints, widgets. Holds no game
 * service; the engine extends it (`IHabboWindowManager`).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as
 */
export interface IWindowManager extends IDisposable {
    // TS-only: the manager's own events (tracking: input, render, sleep); was the Component's.
    readonly events: EventEmitter;

    // TS-only: called once per frame by the host (the engine's update loop, Glaze's or the sandbox's).
    update(deltaTime: number): void;

    // TS-only: no AS3 counterpart. The loading side of the element descriptors; AS3 parses
    // the same data into a private `SkinContainer` inside `initComponent()` and exposes
    // nothing. See `ElementRegistry` — it does not replace the port's own `SkinContainer`.
    readonly elementRegistry: ElementRegistry;
    // AS3: sources/win63_version/habbo/window/class_38.as::resourceManager
    readonly resourceManager: IResourceManager | null;

    /**
     * TS-only: no AS3 counterpart. AS3 does this inline in `initComponent()` — read the
     * `habbo_element_description_xml` asset, `new SkinContainer()`, then
     * `habbo/window/utils/_SafeCls_1859.parse(xml, assets, skinContainer)` — because the
     * asset is embedded and available the moment the component initializes. This port
     * fetches its window assets over HTTP, so the parse has to be a call the boot sequence
     * makes once they have landed.
     */
    // TS-only: no AS3 counterpart; see the block above.
    loadElementDescription(data: IElementDescriptionData): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::create()
    create(
        name: string,
        type: number,
        style: number,
        param: number,
        rect: { x: number; y: number; width: number; height: number },
        procedure?: ((event: unknown, window: IWindow) => void) | null,
        dynamicStyle?: string,
        id?: number,
        tags?: string[] | null,
        parent?: IWindow | null,
        properties?: unknown[] | null
    ): IWindow;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::buildFromXML()
    buildFromXML(layout: string | Document | Element, layer?: number, vars?: Map<string, string> | null): IWindow;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::windowToXMLString()
    windowToXMLString(window: IWindow): string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::destroy()
    destroy(window: IWindow): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::notify()
    notify(title: string, message: string, callback: AlertDialogCallback | null, flags?: number): IAlertDialog;

    // AS3: sources/win63_version/habbo/window/class_38.as::alert()
    alert(title: string, message: string, flags: number, callback: AlertDialogCallback | null): IAlertDialog;

    // AS3: sources/win63_version/habbo/window/class_38.as::alertWithModal()
    alertWithModal(title: string, message: string, flags: number, callback: AlertDialogCallback | null): IAlertDialog;

    // AS3: sources/win63_version/habbo/window/class_38.as::alertWithLink()
    alertWithLink(
        title: string,
        message: string,
        linkTitle: string,
        linkUrl: string,
        flags: number,
        callback: AlertDialogCallback | null
    ): IAlertDialogWithLink;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::confirm()
    confirm(title: string, message: string, flags: number, callback: AlertDialogCallback | null): IConfirmDialog;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::confirmWithModal()
    confirmWithModal(title: string, message: string, flags: number, callback: AlertDialogCallback | null): IConfirmDialog;

    /**
     * The layout map — the four members below have no AS3 counterpart between them.
     *
     * AS3 has no central registry of layouts: each component owns its own `IAssetLibrary`
     * and every view does the lookup itself, `assets.getAssetByName(name).content` then
     * `windowManager.buildFromXML(...)`. This port ships the layouts as loose XML assets
     * with no per-component library to put them in, so the map lives here and the
     * lookup+build pair is exposed as one call.
     */
    // TS-only: no AS3 counterpart; see the block above.
    registerWidgetLayout(name: string, xml: string): void;

    // TS-only: no AS3 counterpart; the `getAssetByName()` + `buildFromXML()` pair AS3
    // views write out themselves.
    buildWidgetLayout(name: string, layer?: number): IWindow | null;

    // TS-only: no AS3 counterpart; stands in for AS3's `assets.getAssetByName(name) != null`.
    hasWidgetLayout(name: string): boolean;

    // TS-only: no AS3 counterpart; used by the dev tooling (window debugger, glaze) to
    // browse what is registered. Nothing in the ported client calls it.
    getRegisteredWidgetLayoutNames(): string[];

    /**
     * Look up a registered widget layout's raw XML by name, throwing if missing.
     *
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as
     * fetches these directly via `assets.getAssetByName(name).content as XML` inline at each call
     * site (alert/confirm/simpleAlert/etc) and has no equivalent named method; this centralizes
     * that lookup + the "missing asset" throw shared by all of them.
     */
    requireWidgetLayout(name: string, purpose: string): string;

    // AS3: sources/win63_version/habbo/window/class_38.as::createWindow()
    createWindow(
        name: string,
        caption?: string,
        type?: number,
        style?: number,
        param?: number,
        rect?: { x: number; y: number; width: number; height: number } | null,
        procedure?: ((event: unknown, window: IWindow) => void) | null,
        id?: number,
        layer?: number,
        dynamicStyle?: string
    ): IWindow;

    // AS3: sources/win63_version/habbo/window/class_38.as::removeWindow()
    removeWindow(name: string, layer?: number): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::getWindowByName()
    getWindowByName(name: string, layer?: number): IWindow | null;

    // AS3: sources/win63_version/habbo/window/class_38.as::getActiveWindow()
    getActiveWindow(layer?: number): IWindow | null;

    // AS3: sources/win63_version/habbo/window/class_38.as::getWindowContext()
    getWindowContext(layer: number): IWindowContext;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getDesktop()
    getDesktop(layer: number): IWindow | null;

    // AS3: sources/win63_version/habbo/window/class_38.as::registerUpdateReceiver()
    registerUpdateReceiver(receiver: IWindowUpdateReceiver, priority: number): void;

    // Derived name: `removeUpdateReceiver` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/class_38.as::removeUpdateReceiver()
    removeUpdateReceiver(receiver: IWindowUpdateReceiver): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::findWindowByName()
    findWindowByName(name: string): IWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::findWindowByTag()
    findWindowByTag(tag: string): IWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::groupWindowsWithTag()
    groupWindowsWithTag(tag: string, windows: IWindow[], depth?: number): number;

    // AS3: sources/win63_version/habbo/window/class_38.as::addMouseEventTracker()
    addMouseEventTracker(tracker: IInputEventTracker): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::removeMouseEventTracker()
    removeMouseEventTracker(tracker: IInputEventTracker): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::eventReceived()
    eventReceived(event: WindowEvent, window: IWindow): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::registerHintWindow()
    registerHintWindow(hintId: string, window: IWindow, direction?: number): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::unregisterHintWindow()
    unregisterHintWindow(hintId: string): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::showHint()
    showHint(hintId: string, rect?: { x: number; y: number; width: number; height: number } | null): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::hideHint()
    hideHint(): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::hideMatchingHint()
    hideMatchingHint(hintId: string): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::buildModalDialogFromXML()
    buildModalDialogFromXML(layout: string): IModalDialog;

    // Frees the render buffers of hidden and detached windows; called when a room ends.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::purge()
    purge(): void;

    // TS-only: the modal twin of `buildWidgetLayout()`. AS3 components do the asset lookup
    // themselves inside their own `getModalXmlWindow()`; this port keeps the layout map private,
    // so the pair is exposed here instead.
    buildModalWidgetLayout(name: string): IModalDialog | null;

    // TS-only: no AS3 counterpart; forwards to `ResourceManager`, which holds the images
    // AS3 keeps in the component's own `IAssetLibrary`. See `ResourceManager.registerAsset()`.
    registerAsset(name: string, bitmap: ImageBitmap): void;

    // TS-only: no AS3 counterpart; the deferred-fetch half of the pair above. AS3 never
    // defers — `ResourceManager.retrieveAsset()` calls `assets.loadAssetFromFile()` on the spot.
    registerAssetUrl(name: string, url: AssetUrlSource): void;

    // TS-only: stands in for AS3's `assets.getAssetByName(name) != null` pre-check, which
    // the port cannot make for images - they live in the ResourceManager, not in a
    // component asset library.
    hasAsset(name: string): boolean;

    // TS-only: the decoded bitmap behind `hasAsset()`, for callers that must composite
    // synchronously — see `IResourceManager.getAsset()`.
    getAsset(name: string): ImageBitmap | null;

    // TS-only: no AS3 counterpart; same reason as `loadElementDescription()` — AS3's skins
    // arrive with the embedded asset library, this port's arrive over HTTP.
    loadSkinAssets(skins: Map<string, ISkinData>, atlases: Map<string, ImageBitmap>): void;

    // TS-only: no AS3 counterpart; AS3 keeps its `SkinContainer` private
    // (`HabboWindowManagerComponent.as::_SafeStr_5462`) and hands it to the `ThemeManager`
    // and the `WindowRenderer` at construction rather than letting anything read it back.
    getSkinContainer(): ISkinContainer;

    /**
     * TS-only: no AS3 counterpart. AS3 builds the renderer in `initComponent()`
     * (`_windowRenderer = new WindowRenderer(skinContainer)`), keeps the field private and
     * passes it into each of the four `WindowContext`s — nothing ever reads it back,
     * because Flash's display list draws itself. Here the render loop is driven from
     * outside the engine (`vortex-client/src/App.ts`, the window debugger, glaze's canvas
     * surface), so the renderer has to be reachable.
     */
    // TS-only: no AS3 counterpart; see the block above.
    getWindowRenderer(): IWindowRenderer | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getRendererByTypeAndStyle()
    getRendererByTypeAndStyle(type: number, style: number): ISkinRenderer | null;

    // TS-only: no AS3 counterpart; composites every window-context layer into one buffer.
    // AS3 had `BitmapData.draw(stage)` for this, which has no equivalent here — rendering
    // is Canvas2D-composited per context. Same family as `compositeLayers()` below.
    compositeToBuffer(width: number, height: number): OffscreenCanvas | null;

    // TS-only: composites only the first `layerCount` window-context layers
    // (e.g. the non-modal desktop layers below ModalDialog's layer). Used by
    // ModalDialog to snapshot the desktop before darkening it behind a dialog —
    // AS3 captured this via BitmapData.draw(stage), which has no equivalent
    // here since rendering is Canvas2D-composited per context.
    compositeLayers(layerCount: number, width: number, height: number): OffscreenCanvas | null;

    // TS-only: renders a single window (and its children) into its own
    // scratch canvas, optionally darkened. Used by ModalDialog to freeze a
    // previous dialog's appearance into the accumulated background when a
    // new dialog stacks on top of it.
    renderWindowSnapshot(window: IWindow, width: number, height: number, darken?: boolean): OffscreenCanvas | null;

    // TS-only: darkens an existing captured buffer.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ModalDialog.as::COLOR_TRANSFORM
    darkenSnapshot(source: OffscreenCanvas | ImageBitmap, width: number, height: number): OffscreenCanvas | null;

    // TS-only: no AS3 counterpart; AS3 resolves the window under the pointer inside Flash's
    // own display-list hit test, which dispatches straight to the target. The port's canvas
    // gets raw coordinates, so the client resolves the target itself before dispatching —
    // see the pointer handlers in `vortex-client/src/App.ts`.
    findWindowAtPoint(x: number, y: number): IWindow | null;

    // TS-only: no AS3 counterpart on the component; AS3's window services are reached
    // through the `WindowContext` each window already holds, where this port's contexts
    // share one service manager owned by the window manager.
    getServiceManager(): IInternalWindowServices | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createWidget()
    createWidget(type: string, window: IWidgetWindow): IWidget | null;
}
