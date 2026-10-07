import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IUpdateReceiver} from '@core/runtime/IContext';
import type {IElementDescriptionData} from '@ambreia/ui/kit/IElementDescriptor';
import type {ElementRegistry} from '@ambreia/ui/kit/ElementRegistry';
import type {AssetUrlSource} from '@ambreia/ui/IResourceManager';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContext} from '@ambreia/ui/IWindowContext';
import type {IInputEventTracker} from '@ambreia/ui/IInputEventTracker';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IWidget} from '@ambreia/ui/IWidget';
import type {IWindowRenderer} from '@ambreia/ui/graphics/IWindowRenderer';
import type {ISkinRenderer} from '@ambreia/ui/graphics/renderer/ISkinRenderer';
import type {ISkinContainer} from '@ambreia/ui/graphics/ISkinContainer';
import type {IResourceManager} from '@ambreia/ui/IResourceManager';
import type {ISkinData} from '@ambreia/ui/graphics/renderer/BitmapSkinParser';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IModalDialog} from '@ambreia/ui/kit/utils/IModalDialog';
import type {IInternalWindowServices} from "@ambreia/ui/index";
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {AlertDialogCallback, IAlertDialog} from './utils/AlertDialog';
import type {IAlertDialogWithLink} from './utils/AlertDialogWithLink';
import type {IConfirmDialog} from './utils/ConfirmDialog';

/**
 * Interface for the Habbo Window Manager.
 *
 * Manages the lifecycle of declarative windows: opening from XML layouts,
 * resolving variables, tracking instances, and emitting events for the UI layer.
 *
 * Also provides the AS3-compatible ICoreWindowManager + IHabboWindowManager API
 * for creating windows programmatically, showing alerts/confirms, managing hints,
 * and accessing window contexts.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/IHabboWindowManager.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as
 */
export interface IHabboWindowManager extends IDisposable {
    // TS-only: no AS3 counterpart. The loading side of the element descriptors; AS3 parses
    // the same data into a private `SkinContainer` inside `initComponent()` and exposes
    // nothing. See `ElementRegistry` — it does not replace the port's own `SkinContainer`.
    readonly elementRegistry: ElementRegistry;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::avatarRenderer
    readonly avatarRenderer: IAvatarRenderManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::communication
    readonly communication: IHabboCommunicationManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::sessionDataManager
    readonly sessionDataManager: ISessionDataManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::roomEngine
    readonly roomEngine: IRoomEngine | null;
    // AS3: sources/win63_version/habbo/window/class_38.as::resourceManager
    readonly resourceManager: IResourceManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::localization
    readonly localization: IHabboLocalizationManager | null;
    // AS3: sources/win63_version/habbo/window/class_38.as::habboPagesStyleSheet
    readonly habboPagesStyleSheet: unknown | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as (context.configuration)
    readonly configuration: IHabboConfigurationManager | null;

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

    // AS3: sources/win63_version/habbo/window/class_38.as::toggleFullScreen()
    toggleFullScreen(): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::getWindowContext()
    getWindowContext(layer: number): IWindowContext;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getDesktop()
    getDesktop(layer: number): IWindow | null;

    // AS3: sources/win63_version/habbo/window/class_38.as::registerUpdateReceiver()
    registerUpdateReceiver(receiver: IUpdateReceiver, priority: number): void;

    // Derived name: `removeUpdateReceiver` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/class_38.as::removeUpdateReceiver()
    removeUpdateReceiver(receiver: IUpdateReceiver): void;

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

    // AS3: sources/win63_version/habbo/window/class_38.as::registerLocalizationParameter()
    registerLocalizationParameter(key: string, parameter: string, value: string, delimiter?: string): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::createUnseenItemCounter()
    createUnseenItemCounter(): IWindowContainer | null;

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

    // AS3: sources/win63_version/habbo/window/class_38.as::openHelpPage()
    openHelpPage(pageId: string): void;

    // AS3: sources/win63_version/habbo/window/class_38.as::buildModalDialogFromXML()
    buildModalDialogFromXML(layout: string): IModalDialog;

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

    // AS3: sources/win63_version/habbo/window/class_38.as::displayFloorPlanEditor()
    displayFloorPlanEditor(): void;

    // TS-only: no AS3 counterpart on the component; AS3's window services are reached
    // through the `WindowContext` each window already holds, where this port's contexts
    // share one service manager owned by the window manager.
    getServiceManager(): IInternalWindowServices | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createWidget()
    createWidget(type: string, window: IWidgetWindow): IWidget | null;

    /**
     * Open the illustrated alert dialog (`simple_alert_xml`)
     *
     * The second and third parameters used to be named `message, subtitle` — the wrong way round.
     * Positions were never wrong: this forwards straight to `SimpleAlertDialog`, whose second
     * argument fills the `subtitle` window and whose third fills the `message` one, exactly as
     * `HabboWindowManagerComponent.as::simpleAlert()` does. Every call site in the port already
     * passed them in AS3 order, so this is a rename with no behaviour change — but the old names
     * were a standing trap, and `HabboFriendList.simpleAlert()` carried a comment working around
     * them.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::simpleAlert()
    simpleAlert(
        title: string,
        subtitle: string,
        message: string,
        linkCaption?: string | null,
        linkUrl?: string | null,
        parameters?: Map<string, string> | null,
        illustrationUrl?: string | null,
        linkClickCallback?: (() => void) | null,
        closeCallback?: (() => void) | null
    ): void;
}
