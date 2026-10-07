import {EventEmitter} from 'eventemitter3';
import {Logger} from '@ambreia/common/utils/Logger';
import {ElementRegistry} from './ElementRegistry';
import {HabboWindowTrackingEvent} from './enum/HabboWindowTrackingEvent';
import type {IElementDescriptionData} from './IElementDescriptor';
import type {AssetUrlSource} from '../IResourceManager';
import type {IWindow} from '../IWindow';
import type {IWindowContainer} from '../IWindowContainer';
import type {IWindowContext} from '../IWindowContext';
import type {IInputEventTracker} from '../IInputEventTracker';
import type {IWindowFactory} from '../IWindowFactory';
import type {IWidgetWindow} from '../components/IWidgetWindow';
import type {IWidget} from '../IWidget';
import type {IThemeManager} from '../theme/IThemeManager';
import {WindowContext} from '../WindowContext';
import {Classes} from '../Classes';
import {WindowType} from '../enum/WindowType';
import {DesktopController} from '../components/DesktopController';
import {FrameController} from '../components/FrameController';
import {WindowParser} from '../utils/WindowParser';
import {MouseCursorControl} from '../utils/MouseCursorControl';
import type {WindowEvent} from '../events/WindowEvent';
import {WindowMouseEvent} from '../events/WindowMouseEvent';
import {SkinContainer} from '../graphics/SkinContainer';
import {WindowComposite} from '../graphics/WindowComposite';
import {WindowRenderer} from '../graphics/WindowRenderer';
import {BitmapDataRenderer} from '../graphics/renderer/BitmapDataRenderer';
import {FillSkinRenderer} from '../graphics/renderer/FillSkinRenderer';
import {LabelRenderer} from '../graphics/renderer/LabelRenderer';
import {NullSkinRenderer} from '../graphics/renderer/NullSkinRenderer';
import {SkinRenderer} from '../graphics/renderer/SkinRenderer';
import {TextSkinRenderer} from '../graphics/renderer/TextSkinRenderer';
import {ShapeSkinRenderer} from '../graphics/renderer/ShapeSkinRenderer';
import {GradientSkinRenderer} from '../graphics/renderer/GradientSkinRenderer';
import {StrokeSkinRenderer} from '../graphics/renderer/StrokeSkinRenderer';
import {BitmapFillSkinRenderer} from '../graphics/renderer/BitmapFillSkinRenderer';
import type {ISkinRenderer} from '../graphics/renderer/ISkinRenderer';
import type {ISkinData} from '../graphics/renderer/BitmapSkinParser';
import {BitmapSkinParser} from '../graphics/renderer/BitmapSkinParser';
import {DefaultAttStruct} from '../utils/DefaultAttStruct';
import {ThemeManager} from './theme/ThemeManager';
import {ServiceManager} from '../services/ServiceManager';
import {ErrorReportStorage} from '@ambreia/common/utils/ErrorReportStorage';
import type {IModalDialog} from './utils/IModalDialog';
import {ModalDialog} from './utils/ModalDialog';
import {ResourceManager} from './ResourceManager';
import {HintManager} from './HintManager';
import type {AlertDialogCallback, IAlertDialog} from './utils/AlertDialog';
import {AlertDialog} from './utils/AlertDialog';
import type {IAlertDialogWithLink} from './utils/AlertDialogWithLink';
import {AlertDialogWithLink} from './utils/AlertDialogWithLink';
import type {IConfirmDialog} from './utils/ConfirmDialog';
import {ConfirmDialog} from './utils/ConfirmDialog';

import type {IWindowManager} from './IWindowManager';
import type {IWindowManagerOptions} from './IWindowManagerOptions';
import type {IWindowLocalization} from '../IWindowLocalization';
import {WidgetRegistry, registerKitWidgets} from './WidgetRegistry';
import type {IWindowUpdateReceiver} from '../IWindowUpdateReceiver';

const log = Logger.getLogger('ui.WindowManager');

/**
 * The window manager: four window contexts (layers), XML layouts, dialogs, rendering, assets, hints
 * and widgets. A plain class (spec §3 rule 1): the host passes its options in and calls update()
 * every frame. The engine extends it with the game services (HabboWindowManager).
 *
 * In AS3 this was HabboWindowManagerComponent, a Component that also held the game services.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as
 */
// DEVIATION: AS3's manager is one Component with the game services; here the generic part is this
//   plain class in @ambreia/ui and the engine's HabboWindowManager adds the services (J3).
export class WindowManager implements IWindowManager
{
    // TS-only: was the Component's; the tracking events (input, render, sleep) are emitted here.
    private readonly _events: EventEmitter = new EventEmitter();
    // TS-only: receivers the windows register (Countdown, RunningNumber…); ticked by update().
    private readonly _updateReceivers: IWindowUpdateReceiver[] = [];
    protected _disposed: boolean = false;
    // TS-only: see IWindowManagerOptions.
    protected readonly _options: IWindowManagerOptions;
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_localization
    protected _localization: IWindowLocalization | null = null;

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::NUMBER_OF_CONTEXT_LAYERS
    private static readonly NUMBER_OF_CONTEXT_LAYERS: number = 4;
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::DEFAULT_CONTEXT_LAYER_INDEX
    private static readonly DEFAULT_CONTEXT_LAYER_INDEX: number = 1;

    private _skinContainer: SkinContainer = new SkinContainer();
    private _themeManager: ThemeManager | null = null;
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_windowContextArray
    private _windowContextArray: IWindowContext[] = [];
    private _defaultContext: IWindowContext | null = null;

    private _widgetLayouts: Map<string, string> = new Map();

    // TS-only: bound on the snapshot drain loop in renderWindowSnapshot(). Eight is well past what
    //   a settling tree needs (measured: two) and still returns promptly if one never settles.
    private static readonly MAX_SNAPSHOT_RENDER_PASSES: number = 8;

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_windowRenderer
    private _windowRenderer: WindowRenderer | null = null;
    private _windowComposite: WindowComposite | null = null;
    private _serviceManager: ServiceManager | null = null;
    // TS-only: AS3's WidgetClasses map, per manager so a host can add its own widgets.
    private readonly _widgets: WidgetRegistry = new WidgetRegistry();
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::_hintManager
    private _hintManager: HintManager | null = null;
    private _initialized: boolean = false;

    constructor(options: IWindowManagerOptions)
    {
        this._options = options;
        registerKitWidgets(this._widgets, this);
    }

    // TS-only: see _events.
    public get events(): EventEmitter
    {
        return this._events;
    }

    // TS-only: true once dispose() ran.
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * The localisation the windows resolve their `${key}` texts against. In AS3 a dependency of the
     * component; here the host sets it when it has one (the engine as soon as the DI provides it).
     */
    // TS-only: was the IID_HabboLocalizationManager dependency setter.
    public setLocalization(localization: IWindowLocalization | null): void
    {
        this._localization = localization;

        // The default has to be empty, not the key: this resolver is the one in force between the
        // manager being injected and its texts finishing their download, which is exactly when the
        // early-built windows read it. Handing back the key reports a hit, and
        // `resolveLocalizationTokens()` then bakes it in instead of leaving the `${...}` for the
        // text child's listener to pick up later.
        WindowParser.localizationResolver = localization
            ? ((key: string) => localization.getResolvedLocalization(key))
            : null;

        for(const context of this._windowContextArray)
        {
            context.setLocalizationManager(localization);
        }
    }

    // AS3: sources/win63_version/habbo/window/class_38.as::registerUpdateReceiver()
    public registerUpdateReceiver(receiver: IWindowUpdateReceiver, _priority: number): void
    {
        if(!this._updateReceivers.includes(receiver)) this._updateReceivers.push(receiver);
    }

    // Derived name: `removeUpdateReceiver` is declared in no AS3 tree.
    // AS3: sources/win63_version/habbo/window/class_38.as::removeUpdateReceiver()
    public removeUpdateReceiver(receiver: IWindowUpdateReceiver): void
    {
        const index = this._updateReceivers.indexOf(receiver);

        if(index >= 0) this._updateReceivers.splice(index, 1);
    }

    /** The `widget` types this manager builds: the kit's, plus whatever the host registers. */
    // TS-only: see _widgets.
    public get widgets(): WidgetRegistry
    {
        return this._widgets;
    }

    /** What a frame's `?` button opens; nothing here, the engine opens its help pages. */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::openHelpPage()
    public openHelpPage(_pageId: string): void
    {
    }

    /**
     * Builds the four contexts. The host calls it once its assets and localisation are in — the
     * engine when the DI dependencies have resolved, Glaze and the sandbox right away.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::initComponent()
    public initialize(): void
    {
        this.initContexts();
        this.addMouseEventTracker(this);
    }

    private _resourceManager: ResourceManager | null = null;

    /**
     * Assets registered before `initContexts()` built the ResourceManager, replayed into it the
     * moment it exists.
     *
     * TS-only. AS3 needs no such buffer: `HabboWindowManagerComponent` is handed its already-filled
     * `AssetLibrary` as a constructor argument, so there is no window in which the component is
     * alive and its images are not. Here the images arrive from a downloaded bundle and are pushed
     * in from `VortexMain.applyWindowAssets()`, which must run *before* the manager is attached so
     * that the windows built during component init can resolve their `asset_uri` — and at that
     * point `_resourceManager` is still null, because it is created in `initComponent()`. Without
     * the buffer those calls are silently dropped.
     */
    // TS-only: see above.
    private _pendingAssetUrls: Map<string, AssetUrlSource> = new Map();

    // TS-only: see `_pendingAssetUrls`.
    private _pendingAssets: Map<string, ImageBitmap> = new Map();

    /**
     * ResourceManager accessor (AS3 parity).
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::get resourceManager()
    public get resourceManager(): ResourceManager | null 
    {
        return this._resourceManager;
    }

    private _elementRegistry: ElementRegistry = new ElementRegistry();

    /**
     * The element registry.
     */
    get elementRegistry(): ElementRegistry 
    {
        return this._elementRegistry;
    }

    /**
     * Constructs the non-asset-backed skin renderer for an element descriptor's
     * `renderer` attribute (asset-backed "skin" renderers are created later by
     * {@link loadSkinAssets} via {@link BitmapSkinParser}, replacing the
     * `NullSkinRenderer` placeholder built here).
     *
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/_SafeCls_1859.as::parse()
     * (renderer name → class Dictionary)
     */
    private static createRendererForType(rendererType: string, rendererName: string): ISkinRenderer
    {
        switch(rendererType)
        {
            case 'fill':
                return new FillSkinRenderer(rendererName);
            case 'shape':
                return new ShapeSkinRenderer(rendererName);
            case 'gradient':
                return new GradientSkinRenderer(rendererName);
            case 'stroke':
                return new StrokeSkinRenderer(rendererName);
            case 'bitmap_fill':
                return new BitmapFillSkinRenderer(rendererName);
            case 'bitmap':
                return new BitmapDataRenderer(rendererName);
            case 'text':
                return new TextSkinRenderer(rendererName);
            case 'label':
                return new LabelRenderer(rendererName);
            // AS3 maps "unknown" to the SkinRenderer base itself, whose draw() is a
            // no-op and whose isStateDrawable() is `false` — i.e. a descriptor that
            // names no renderer still gets an object, it just never draws.
            case 'unknown':
                return new SkinRenderer(rendererName);
            case 'null':
                return new NullSkinRenderer(rendererName);
            // "skin" is deliberately absent: BitmapSkinRenderer needs the atlas and
            // template data that only arrive later, so loadSkinAssets() replaces this
            // placeholder once they do.
            default:
                return new NullSkinRenderer(rendererName);
        }
    }

    /**
     * Load element description data into the registry.
     */
    loadElementDescription(data: IElementDescriptionData): void 
    {
        this._elementRegistry.load(data);

        // Populate SkinContainer from element descriptors
        for(const element of data.elements) 
        {
            if(element.typeId < 0) continue;

            const defaults = new DefaultAttStruct(
                element.defaults.blend,
                element.defaults.threshold,
                element.defaults.background,
                element.defaults.color,
                element.defaults.widthMin,
                element.defaults.widthMax,
                element.defaults.heightMin,
                element.defaults.heightMax
            );

            const rendererType = element.renderer || 'null';
            const rendererName = `${element.typeId}_${element.style}`;
            const renderer = WindowManager.createRendererForType(rendererType, rendererName);

            this._skinContainer.addSkinRenderer(
                element.typeId,
                element.style,
                element.intent,
                renderer,
                null,
                defaults
            );
        }

        // Create ThemeManager now that SkinContainer is populated
        this.registerTextRenderersMissingFromElementDescription();

        this._themeManager = new ThemeManager(this._skinContainer, this._widgets.types());

        log.info(`Element registry loaded: ${data.elements.length} descriptors, ThemeManager initialized`);
    }

    /**
	 * Registers a text renderer for the two text-bearing window types the element
	 * description does not declare one for.
	 *
	 * **DO NOT REMOVE** without giving textfield/html another way to draw, and do
	 * not "restore fidelity" by deleting it: the element description is right, and
	 * this port still needs the entry. Why the two disagree:
	 *
	 * Flash's TextField was one object that both captured input and displayed it,
	 * and AS3 simply adds it to the display list as a child — which is why the
	 * descriptor names a renderer for text/formatted_text/password/label/link and
	 * nothing at all for `textfield` or `html`. There is no TextField to port: it
	 * is a Flash runtime primitive, not Habbo code. So this port splits its two
	 * jobs — TextFieldController.createInputElement() overlays a hidden
	 * `<input>` (opacity 0, pointer-events none) to capture keys, IME, paste and
	 * mobile keyboards, none of which are worth reimplementing; and the glyphs are
	 * drawn on the canvas, because they have to sit inside window compositing at
	 * the right z-order with the right font and etching. The input displays
	 * nothing. Without a renderer here, so does the canvas — every field in the
	 * client goes blank while still accepting what you type.
	 *
	 * Learned by deleting it. These types used to be dispatched from
	 * WindowComposite; when that dispatch moved into createRendererForType() they
	 * had no descriptor entry to move to, and every input went blank.
	 */
    private registerTextRenderersMissingFromElementDescription(): void
    {
        for(const type of [WindowType.TEXTFIELD, WindowType.HTML])
        {
            if(this._skinContainer.getSkinRendererByTypeAndStyle(type, 0) != null) continue;

            this._skinContainer.addSkinRenderer(
                type,
                0,
                'default',
                new TextSkinRenderer(`${type}_0`),
                null,
                new DefaultAttStruct()
            );
        }
    }

    /**
     * Create a window using the core factory.
     *
     * In AS3: create(name, type, style, param, rect, procedure, dynamicStyle, id, tags, parent, properties)
     * Delegates to the default context layer.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::create()
    public create(
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
    ): IWindow 
    {
        return this._defaultContext!.create(
            name, '', type, style, param, rect,
            procedure ?? null, parent ?? null,
            id ?? 0, tags ?? null, dynamicStyle ?? '', properties ?? null
        );
    }

    /**
     * Destroy a window.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::destroy()
    public destroy(window: IWindow): void 
    {
        window.destroy();
    }

    /**
     * AS3-compatible parser serialization.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::windowToXMLString()
    public windowToXMLString(window: IWindow): string 
    {
        if(!this._defaultContext) 
        {
            return '';
        }

        return this._defaultContext.getWindowParser().windowToXMLString(window);
    }

    /**
     * Build a window tree from an XML layout definition.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::buildFromXML()
    public buildFromXML(xml: string | Document | Element, layer: number = 1, _vars?: Map<string, string> | null): IWindow
    {
        const context = this.getWindowContext(layer);
        const parser = context.getWindowParser();
        const desktop = context.getDesktopWindow();

        if(parser && desktop)
        {
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::buildFromXML()
            // AS3 passes `null` as parent here, not the desktop - the constructed window is
            // returned standalone, unattached, for the caller to place wherever it belongs (see
            // WindowParser's constructor note for how it still resolves a context/theme without a
            // parent to read `.context` off of).
            const result = parser.parseAndConstruct(xml, null, null) as IWindow;

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::buildFromXML()
            // Every frame built this way gets its help button wired to openHelpPage().
            if(result instanceof FrameController) 
            {
                result.helpButtonAction = this.openHelpPage.bind(this);
            }

            return result;
        }

        throw new Error('Window parser or desktop not available');
    }

    /**
     * Show a notify dialog.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::notify()
    public notify(
        title: string,
        message: string,
        callback: AlertDialogCallback | null,
        flags: number = 0
    ): IAlertDialog 
    {
        return this.alert(title, message, flags, callback);
    }

    /**
     * Show an alert dialog.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::alert()
    public alert(
        title: string,
        message: string,
        flags: number,
        callback: AlertDialogCallback | null
    ): IAlertDialog 
    {
        const layout = this.requireWidgetLayout('habbo_window_alert_xml', 'alert dialog');

        return new AlertDialog(this, layout, title, message, flags, callback, false);
    }

    /**
     * Show a modal alert dialog.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::alertWithModal()
    public alertWithModal(
        title: string,
        message: string,
        flags: number,
        callback: AlertDialogCallback | null
    ): IAlertDialog 
    {
        const layout = this.requireWidgetLayout('habbo_window_alert_xml', 'alert dialog');

        return new AlertDialog(this, layout, title, message, flags, callback, true);
    }

    /**
     * Show an alert dialog with link.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::alertWithLink()
    public alertWithLink(
        title: string,
        message: string,
        linkTitle: string,
        linkUrl: string,
        flags: number,
        callback: AlertDialogCallback | null
    ): IAlertDialogWithLink 
    {
        const layout = this.requireWidgetLayout('habbo_window_alert_link_xml', 'alert link dialog');

        return new AlertDialogWithLink(this, layout, title, message, linkTitle, linkUrl, flags, callback);
    }

    /**
     * Show a confirm dialog.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::confirm()
    public confirm(
        title: string,
        message: string,
        flags: number,
        callback: AlertDialogCallback | null
    ): IConfirmDialog 
    {
        const layout = this.requireWidgetLayout('habbo_window_confirm_xml', 'confirm dialog');

        return new ConfirmDialog(this, layout, title, message, flags, callback, false);
    }

    /**
     * Show a modal confirm dialog.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::confirmWithModal()
    public confirmWithModal(
        title: string,
        message: string,
        flags: number,
        callback: AlertDialogCallback | null
    ): IConfirmDialog 
    {
        const layout = this.requireWidgetLayout('habbo_window_confirm_xml', 'confirm dialog');

        return new ConfirmDialog(this, layout, title, message, flags, callback, true);
    }

    /**
     * Register a widget layout XML asset by name.
     *
     * @param name - The layout asset name (e.g. "hover_bitmap", "avatar_image")
     * @param xml - The XML layout source
     */
    public registerWidgetLayout(name: string, xml: string): void 
    {
        this._widgetLayouts.set(name, xml);
    }

    /**
     * Probe whether a widget layout is registered, without logging a miss.
     *
     * Equivalent to AS3's `assets.hasAsset(name)` pre-check ahead of a buildFromXML() call.
     */
    public hasWidgetLayout(name: string): boolean 
    {
        return this._widgetLayouts.has(name);
    }

    /**
     * Lists every registered widget layout name.
     *
     * TS-only: used by dev tooling (the visual window debugger) to browse
     * every buildable layout — not part of the AS3 API.
     */
    public getRegisteredWidgetLayoutNames(): string[] 
    {
        return Array.from(this._widgetLayouts.keys());
    }

    /**
     * Build a widget's internal window tree from a registered layout asset.
     *
     * Equivalent to AS3:
     * `buildFromXML(assets.getAssetByName("widget_xml").content as XML)`
     *
     * @param name - The layout asset name
     * @param layer - Context layer (default 1)
     * @returns The root IWindow of the built tree, or null
     */
    public buildWidgetLayout(name: string, layer: number = 1): IWindow | null 
    {
        const xml = this._widgetLayouts.get(name);

        if(!xml) 
        {
            log.warn(`Widget layout not found: ${name}`);

            return null;
        }

        return this.buildFromXML(xml, layer);
    }

    /**
     * Build a modal dialog from an XML layout definition.
     *
     * Creates a dimmed background overlay and a centered content
     * window. Delegates to ModalDialog which manages the shared
     * modal container.
     *
     * In AS3: buildModalDialogFromXML(xml: XML): IModalDialog
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::buildModalDialogFromXML()
    public buildModalDialogFromXML(xml: string): IModalDialog
    {
        return new ModalDialog(this, xml);
    }

    /**
     * Build a modal dialog from a registered layout name.
     *
     * The modal twin of `buildWidgetLayout()`: same name→XML lookup, `buildModalDialogFromXML()`
     * instead of `buildFromXML()`. AS3 has no single method for this — every caller does the
     * asset lookup itself and then picks one of the two builders, which is exactly what
     * `getModalXmlWindow()` and `getXmlWindow()` are on each component. Without this the layout
     * map stays private and a by-name modal cannot be built at all.
     */
    // TS-only: composes two existing AS3 steps so callers of `getModalXmlWindow()` have something
    // to delegate to, mirroring `buildWidgetLayout()`.
    public buildModalWidgetLayout(name: string): IModalDialog | null
    {
        const xml = this._widgetLayouts.get(name);

        if(!xml)
        {
            log.warn(`Widget layout not found: ${name}`);

            return null;
        }

        return this.buildModalDialogFromXML(xml);
    }

    /**
     * Create a window by name, type, style, param in a given context layer.
     *
     * In AS3: createWindow(name, caption, type, style, param, rect, procedure, id, layer, dynamicStyle)
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createWindow()
    public createWindow(
        name: string,
        caption: string = '',
        type: number = 0,
        style: number = 0,
        param: number = 0,
        rect: { x: number; y: number; width: number; height: number } | null = null,
        procedure: ((event: unknown, window: IWindow) => void) | null = null,
        id: number = 0,
        layer: number = 1,
        dynamicStyle: string = ''
    ): IWindow 
    {
        return this._windowContextArray[layer].create(
            name, caption, type, style, param, rect,
            procedure, null, id, null, dynamicStyle, null
        );
    }

    /**
     * Remove a window by name from a context layer.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::removeWindow()
    public removeWindow(name: string, layer: number = 1): void 
    {
        const desktop = this._windowContextArray[layer]?.getDesktopWindow();

        if(!desktop) return;

        const child = (desktop as IWindowContainer).getChildByName?.(name) ?? null;

        if(child) 
        {
            child.destroy();
        }
    }

    /**
     * Get a window by name from a context layer.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getWindowByName()
    public getWindowByName(name: string, layer: number = 1): IWindow | null 
    {
        const desktop = this._windowContextArray[layer]?.getDesktopWindow();

        if(!desktop) return null;

        return (desktop as IWindowContainer).getChildByName?.(name) ?? null;
    }

    /**
     * Get the topmost active window in a context layer.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getActiveWindow()
    public getActiveWindow(layer: number = 1): IWindow | null 
    {
        const desktop = this._windowContextArray[layer]?.getDesktopWindow();

        if(!desktop) return null;

        const container = desktop as IWindowContainer;
        const activeDesktop = this._defaultContext?.getDesktopWindow() as IWindowContainer | null;
        const requestedIndex = (activeDesktop?.numChildren ?? container.numChildren) - 1;
        const count = container.numChildren;

        if(count <= 0) return null;

        if((requestedIndex < 0) || (requestedIndex >= count)) 
        {
            return container.getChildAt(count - 1);
        }

        return container.getChildAt(requestedIndex);
    }

    /**
     * Get a window context by layer index.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getWindowContext()
    public getWindowContext(layer: number): IWindowContext 
    {
        return this._windowContextArray[layer];
    }

    /**
     * Get the desktop window for a given context layer.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getDesktop()
    public getDesktop(layer: number): IWindow | null 
    {
        const context = this._windowContextArray[layer];

        return context ? context.getDesktopWindow() : null;
    }

    /**
     * Search for a window by name across all context layers.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::findWindowByName()
    public findWindowByName(name: string): IWindow | null 
    {
        for(const context of this._windowContextArray) 
        {
            const found = context.findWindowByName(name);

            if(found) return found;
        }

        return null;
    }

    /**
     * Search for a window by tag across all context layers.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::findWindowByTag()
    public findWindowByTag(tag: string): IWindow | null 
    {
        for(const context of this._windowContextArray) 
        {
            const found = context.findWindowByTag(tag);

            if(found) return found;
        }

        return null;
    }

    /**
     * Group windows with a matching tag across contexts.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::groupWindowsWithTag()
    public groupWindowsWithTag(tag: string, windows: IWindow[], depth: number = 0): number 
    {
        let count = 0;

        for(const context of this._windowContextArray) 
        {
            count += context.groupChildrenWithTag(tag, windows, depth);
        }

        return count;
    }

    /**
     * Add an input event tracker to all context layers.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::addMouseEventTracker()
    public addMouseEventTracker(tracker: IInputEventTracker): void 
    {
        for(const context of this._windowContextArray) 
        {
            context.addMouseEventTracker(tracker);
        }
    }

    /**
     * Remove an input event tracker from all context layers.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::removeMouseEventTracker()
    public removeMouseEventTracker(tracker: IInputEventTracker): void 
    {
        for(const context of this._windowContextArray) 
        {
            context.removeMouseEventTracker(tracker);
        }
    }

    /**
     * Input event tracker callback.
     *
     * Mirrors AS3 behavior by storing click/mouse-up metadata for crash reports.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::eventReceived()
    public eventReceived(event: WindowEvent, window: IWindow): void 
    {
        if(!window) 
        {
            return;
        }

        if(event.type === WindowMouseEvent.CLICK) 
        {
            ErrorReportStorage.addDebugData('click_time', Date.now().toString());
            ErrorReportStorage.addDebugData('click_target', `${window.name}: ${window.toString()}`);
        }
        else if(event.type === WindowMouseEvent.UP) 
        {
            ErrorReportStorage.addDebugData('mouse_up_time', Date.now().toString());
            ErrorReportStorage.addDebugData('mouse_up_target', `${window.name}: ${window.toString()}`);
        }
    }

    /**
     * Interpolates a string against runtime configuration values.
     *
     * AS3 ResourceManager resolves asset names through
     * HabboWindowManagerComponent.interpolate().
     */
    public interpolate(value: string): string 
    {
        return this._options.interpolate(value);
    }

    /**
     * Create a widget by type identifier.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::createWidget()
    public createWidget(type: string, window: IWidgetWindow): IWidget | null 
    {
        const widget = this._widgets.createWidget(type, window) ?? null;

        if(!widget) 
        {
            throw new Error(`Unknown widget type ${type}! You might need to update Glaze to be able to work on this layout.`);
        }

        return widget as IWidget;
    }

    /**
     * Register a hint window.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::registerHintWindow()
    public registerHintWindow(hintId: string, window: IWindow, direction: number = 1): void 
    {
        this._hintManager?.registerWindow(hintId, window, direction);
    }

    /**
     * Unregister a hint window.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::unregisterHintWindow()
    public unregisterHintWindow(hintId: string): void 
    {
        this._hintManager?.unregisterWindow(hintId);
    }

    /**
     * Show a hint by ID.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::showHint()
    public showHint(hintId: string, rect?: { x: number; y: number; width: number; height: number } | null): void 
    {
        this._hintManager?.showHint(hintId, rect);
    }

    /**
     * Hide the current hint.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::hideHint()
    public hideHint(): void 
    {
        this._hintManager?.hideHint();
    }

    /**
     * Hide a hint matching the given ID.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::hideMatchingHint()
    public hideMatchingHint(hintId: string): void 
    {
        this._hintManager?.hideMatchingHint(hintId);
    }

    /**
     * Per-frame window update.
     *
     * Mirrors AS3 update ordering:
     * - Process input/update from top-most context to bottom
     * - Render from bottom context to top-most
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::update()
    public update(deltaTime: number): void 
    {
        for(const receiver of [...this._updateReceivers])
        {
            if(receiver.disposed) this.removeUpdateReceiver(receiver);
            else receiver.update(deltaTime);
        }

        // AS3: only emits TRACKING_EVENT_INPUT when there are queued input events
        if(WindowContext.inputEventQueue && WindowContext.inputEventQueue.length > 0) 
        {
            this.events.emit(HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_INPUT);
        }

        for(let i = this._windowContextArray.length - 1; i >= 0; i--) 
        {
            this._windowContextArray[i].update(deltaTime);
        }

        this.events.emit(HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_RENDER);

        for(let i = 0; i < this._windowContextArray.length; i++) 
        {
            this._windowContextArray[i].render(deltaTime);
        }

        WindowContext.inputEventQueue?.flush();

        // AS3: ModalDialog.onEnterFrame() is driven by Stage enterFrame — equivalent here
        ModalDialog.onUpdate();

        MouseCursorControl.change();
        this.events.emit(HabboWindowTrackingEvent.HABBO_WINDOW_TRACKING_EVENT_SLEEP);
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::purge()
    public purge(): void 
    {
        this._windowRenderer?.purge();
    }

    /**
     * Composites all window layers into a single OffscreenCanvas buffer.
     *
     * Delegates to WindowComposite.composite() with the full context array.
     *
     * @param width - The target buffer width
     * @param height - The target buffer height
     * @returns The composited buffer, or null if renderer is unavailable
     */
    public compositeToBuffer(width: number, height: number): OffscreenCanvas | null
    {
        if(!this._windowRenderer || !this._windowComposite) return null;

        // Process the render queue first (AS3: context.render() → renderer.render())
        this._windowRenderer.render();

        return this._windowComposite.composite(this._windowContextArray, width, height);
    }

    /**
     * Composites only the first `layerCount` window-context layers (e.g. the
     * non-modal desktop layers below ModalDialog's layer) into a scratch
     * buffer. Used by ModalDialog to snapshot the desktop before darkening it
     * behind a dialog.
     */
    public compositeLayers(layerCount: number, width: number, height: number): OffscreenCanvas | null
    {
        if(!this._windowRenderer || !this._windowComposite) return null;

        this._windowRenderer.render();

        return this._windowComposite.composite(this._windowContextArray.slice(0, layerCount), width, height);
    }

    /**
     * Renders a single window (and its children) into its own scratch
     * canvas, optionally darkened. See WindowComposite.renderWindowToCanvas().
     *
     * The render queue is drained first, which this did not do — it composited whatever the
     * buffers happened to hold, so a snapshot taken before the frame's own `render()` caught
     * half-drawn windows. `compositeLayers()` beside it always did call `render()`; this one was
     * the odd one out, and the difference is invisible until you compare two snapshots.
     *
     * Draining loops because rendering *causes* invalidation: a text window measures itself and
     * resizes, an asset finishes loading and marks its bitmap dirty, a list re-lays out its rows.
     * One pass leaves that second wave for the next frame — which is exactly the non-determinism
     * that made the Glaze screenshot harness return two different images for the same layout from
     * identical code. The bound stops a pathological invalidate-on-render loop from hanging the
     * caller; reaching it means the tree never settles and is worth knowing about.
     */
    // TS-only: AS3 has no snapshot path — Flash's display list drew the window tree directly.
    public renderWindowSnapshot(window: IWindow, width: number, height: number, darken: boolean = false): OffscreenCanvas | null
    {
        if(!this._windowComposite) return null;

        if(this._windowRenderer)
        {
            let passes = 0;

            do
            {
                this._windowRenderer.render();
            }
            while(this._windowRenderer.hasPendingUpdates() && ++passes < WindowManager.MAX_SNAPSHOT_RENDER_PASSES);

            if(passes >= WindowManager.MAX_SNAPSHOT_RENDER_PASSES)
            {
                log.warn(`Window tree still dirty after ${passes} render passes; snapshot may be incomplete`);
            }
        }

        return this._windowComposite.renderWindowToCanvas(window, width, height, darken);
    }

    /**
     * Darkens an existing captured buffer. See WindowComposite.darken().
     */
    public darkenSnapshot(source: OffscreenCanvas | ImageBitmap, width: number, height: number): OffscreenCanvas | null
    {
        if(!this._windowComposite) return null;

        return this._windowComposite.darken(source, width, height);
    }

    /**
     * Finds the deepest visible window at the given screen point.
     *
     * Delegates to WindowComposite.findWindowAtPoint() with the full context array.
     *
     * @param x - The global X coordinate
     * @param y - The global Y coordinate
     * @returns The deepest window at the point, or null
     */
    public findWindowAtPoint(x: number, y: number): IWindow | null 
    {
        if(!this._windowComposite) return null;

        return this._windowComposite.findWindowAtPoint(this._windowContextArray, x, y);
    }

    /**
     * Returns the shared service manager for mouse drag/scale operations.
     *
     * Used by the client renderer to forward DOM mouse events.
     */
    public getServiceManager(): ServiceManager | null 
    {
        return this._serviceManager;
    }

    /**
     * Returns the theme manager.
     *
     * @returns The theme manager instance
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getThemeManager()
    public getThemeManager(): IThemeManager 
    {
        return this._themeManager!;
    }

    /**
     * Registers a bitmap asset with the resource manager.
     *
     * Called by the client layer after loading images. Assets registered
     * here are available to StaticBitmapWrapperController via `assetUri`.
     *
     * @param name - The asset name
     * @param bitmap - The decoded ImageBitmap
     */
    // TS-only: no AS3 counterpart — there the images are `[Embed]`s in the component's own SWF
    // library, so nothing ever pushes a decoded bitmap in from outside.
    public registerAsset(name: string, bitmap: ImageBitmap): void
    {
        if(this._resourceManager)
        {
            this._resourceManager.registerAsset(name, bitmap);

            return;
        }

        this._pendingAssets.set(name, bitmap);
    }

    /**
     * Registers an asset URL for lazy loading.
     *
     * @param name - The asset name
     * @param url - The URL to fetch the image from
     */
    // TS-only: no AS3 counterpart; the deferred-fetch half of `registerAsset()`, forwarded to `ResourceManager`.
    public registerAssetUrl(name: string, url: AssetUrlSource): void
    {
        if(this._resourceManager)
        {
            this._resourceManager.registerAssetUrl(name, url);

            return;
        }

        this._pendingAssetUrls.set(name, url);
    }

    /**
     * Probe whether an image asset name is known, without requesting it.
     *
     * Equivalent to AS3's `assets.getAssetByName(name) != null` pre-check against the
     * window manager's own asset library - the port keeps images in the ResourceManager
     * instead, so callers that pick between a preferred and a fallback asset name (e.g.
     * WiredUIPreset.resolveAssetFullName) ask here.
     *
     * @param name - The asset name
     */
    public hasAsset(name: string): boolean
    {
        if(this._resourceManager) return this._resourceManager.hasAsset(name);

        // Not yet built: answer from the buffer, or a caller probing this early is told "unknown"
        // about an asset that is in fact already registered. See `_pendingAssetUrls`.
        return this._pendingAssetUrls.has(name) || this._pendingAssets.has(name);
    }

    // TS-only: forwards `IResourceManager.getAsset()`.
    public getAsset(name: string): ImageBitmap | null
    {
        if(!this._resourceManager) return this._pendingAssets.get(name) ?? null;

        return this._resourceManager.getAsset(name);
    }

    /**
     * Returns the default attributes for a given window type and style.
     *
     * @param type - The window type
     * @param style - The window style
     * @returns The default attributes, or null
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getDefaultsByTypeAndStyle()
    public getDefaultsByTypeAndStyle(type: number, style: number): DefaultAttStruct | null 
    {
        return this._skinContainer.getDefaultAttributesByTypeAndStyle(type, style);
    }

    /**
     * Returns the skin renderer for a given window type/style.
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getRendererByTypeAndStyle()
    public getRendererByTypeAndStyle(type: number, style: number): ISkinRenderer | null 
    {
        return this._skinContainer.getSkinRendererByTypeAndStyle(type, style);
    }

    /**
     * Returns the window layout for a given type and style.
     *
     * First checks the SkinContainer (populated during skin loading), then
     * falls back to the element descriptor's windowLayout reference resolved
     * against the registered widget layouts.
     *
     * @param type - The window type
     * @param style - The window style
     * @returns The layout object, or null
     */
    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::getLayoutByTypeAndStyle()
    public getLayoutByTypeAndStyle(type: number, style: number): string | null 
    {
        const layout = this._skinContainer.getWindowLayoutByTypeAndStyle(type, style);

        if(layout) return layout;

        // Fall back: resolve via element descriptor's windowLayout reference
        const descriptor = this._elementRegistry.getDescriptor(type, style);

        if(descriptor?.windowLayout) 
        {
            return this._widgetLayouts.get(descriptor.windowLayout) ?? null;
        }

        return null;
    }

    /**
     * Returns the skin container.
     *
     * @returns The skin container instance
     */
    public getSkinContainer(): SkinContainer 
    {
        return this._skinContainer;
    }

    /**
     * Returns the window renderer.
     *
     * @returns The window renderer instance, or null
     */
    public getWindowRenderer(): WindowRenderer | null 
    {
        return this._windowRenderer;
    }

    /**
     * Loads skin assets and creates BitmapSkinRenderers from skin XML data.
     *
     * For each skin JSON, the parser creates a BitmapSkinRenderer with all
     * templates, layouts, and state mappings. The renderer is then registered
     * in the SkinContainer, replacing the NullSkinRenderer placeholder
     * created during loadElementDescription().
     *
     * The skin map is keyed by the skin's `id` field (e.g. "habbo_skin_frame"),
     * which matches the element descriptor's `asset` field.
     *
     * @param skins - Map of skin id → skin JSON data
     * @param atlases - Map of atlas asset name → ImageBitmap
     */
    public loadSkinAssets(skins: Map<string, ISkinData>, atlases: Map<string, ImageBitmap>): void 
    {
        // Create the window renderer now that we have skins
        if(!this._windowRenderer) 
        {
            this._windowRenderer = new WindowRenderer(this._skinContainer);
            this._windowComposite = new WindowComposite((window: IWindow) => this._windowRenderer?.getDrawBufferForRenderable(window) ?? null);

            // Connect renderer to all WindowContexts (AS3: static var_1836)
            WindowContext.setRenderer(this._windowRenderer);
        }

        let loaded = 0;

        for(const [skinId, skinData] of skins) 
        {
            // Find all element descriptors that reference this skin asset
            const descriptors = this._elementRegistry.getDescriptorsByAsset(skinId);

            if(descriptors.length === 0) 
            {
                continue;
            }

            // Cache renderers by layout filter + states to avoid re-parsing identical configs.
            // AS3 creates a separate renderer per descriptor, filtered to its layout; several
            // descriptors can share the same `layout` name (e.g. icon16 is reused by arrow
            // styles 0-9) while still pointing at different `states`/`template`, so the layout
            // name alone is not a safe cache key — fold the descriptor's own states into it.
            const rendererCache = new Map<string, ReturnType<typeof BitmapSkinParser.parse>>();

            for(const descriptor of descriptors)
            {
                const defaults = this._skinContainer.getDefaultAttributesByTypeAndStyle(descriptor.typeId, descriptor.style);

                if(defaults)
                {
                    const layoutFilter = (descriptor.layout && descriptor.layout !== 'null') ? descriptor.layout : '';
                    const cacheKey = `${layoutFilter}::${JSON.stringify(descriptor.states ?? [])}`;
                    let renderer = rendererCache.get(cacheKey);

                    if(!renderer)
                    {
                        renderer = BitmapSkinParser.parse(skinData, atlases, layoutFilter, descriptor.states);
                        rendererCache.set(cacheKey, renderer);
                    }

                    this._skinContainer.addSkinRenderer(
                        descriptor.typeId,
                        descriptor.style,
                        descriptor.intent,
                        renderer,
                        null,
                        defaults
                    );

                    loaded++;
                }
            }
        }

        log.info(`Skin assets loaded: ${loaded} renderers registered from ${skins.size} skins`);
    }

    /**
     * Initialize the 4 window context layers.
     *
     * Creates a WindowContext per layer, each with its own DesktopController
     * root and WindowParser for XML layout building.
     */
    protected initContexts(): void 
    {
        if(this._initialized) return;

        this._initialized = true;

        Classes.init();

        const factory = this as unknown as IWindowFactory;
        const serviceManager = new ServiceManager();
        const resourceManager = new ResourceManager(this);
        const hintManager = new HintManager(this);
        const resizeHost = this._options.resizeHost ?? {
            get width(): number
            {
                return window.innerWidth;
            },
            get height(): number
            {
                return window.innerHeight;
            },
            addEventListener: (type: string, listener: (event?: Event) => void): void =>
            {
                window.addEventListener(type, listener);

                // AS3: ModalDialog.onResize() is driven by Stage "resize" event
                if(type === 'resize')
                {
                    window.addEventListener('resize', () => ModalDialog.onResize());
                }
            },
            removeEventListener: (type: string, listener: (event?: Event) => void): void =>
            {
                window.removeEventListener(type, listener);
            }
        };

        this._serviceManager = serviceManager;
        this._resourceManager = resourceManager;
        this._hintManager = hintManager;

        // Replay whatever was registered before this point — in practice the entire images/
        // bundle, pushed in by VortexMain.applyWindowAssets() ahead of the component's attach.
        // See `_pendingAssetUrls`.
        for(const [name, bitmap] of this._pendingAssets)
        {
            resourceManager.registerAsset(name, bitmap);
        }

        for(const [name, url] of this._pendingAssetUrls)
        {
            resourceManager.registerAssetUrl(name, url);
        }

        this._pendingAssets.clear();
        this._pendingAssetUrls.clear();

        for(let i = 0; i < WindowManager.NUMBER_OF_CONTEXT_LAYERS; i++) 
        {
            const context = new WindowContext(`layer_${i}`, factory, null, resizeHost);

            // Inject shared service manager into each context
            context.setServices(serviceManager);

            // Inject widget factory for WidgetWindowController
            context.setWidgetFactory(this._widgets);

            // Inject resource manager for StaticBitmapWrapperController
            context.setResourceManager(resourceManager);

            // Inject localization manager for localization tokens in captions/text
            context.setLocalizationManager(this._localization);

            // Create desktop root for this layer. The constructor only stores
            // base fields now; completeConstruction() runs the theme/layout/
            // defaults phases the same way WindowContext.create() does for
            // every other window (the parser isn't set on `context` yet at
            // this point, but buildLayoutChildren() already no-ops without
            // one, matching this desktop's pre-refactor behavior).
            const desktop = new DesktopController(
                `desktop_${i}`,
                WindowType.CONTAINER,
                0,
                0,
                context,
                {x: 0, y: 0, width: 0, height: 0}
            );

            desktop.completeConstruction(null, null, null);

            context.setDesktop(desktop);

            // Create parser for XML layout building
            const parser = new WindowParser(context);

            context.setParser(parser);

            this._windowContextArray.push(context);
        }

        this._defaultContext = this._windowContextArray[WindowManager.DEFAULT_CONTEXT_LAYER_INDEX];

        log.info(`Window manager initialized with ${WindowManager.NUMBER_OF_CONTEXT_LAYERS} context layers (${Classes.getRegisteredTypes().length} types registered)`);
    }

    // AS3: .../src/com/sulake/habbo/window/HabboWindowManagerComponent.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this.removeMouseEventTracker(this);
        this._disposed = true;
        this._updateReceivers.length = 0;

        for(const context of this._windowContextArray)
        {
            context.dispose();
        }

        this._windowContextArray.length = 0;
        this._defaultContext = null;

        if(this._serviceManager)
        {
            this._serviceManager.dispose();
            this._serviceManager = null;
        }

        if(this._windowComposite)
        {
            this._windowComposite.dispose();
            this._windowComposite = null;
        }

        if(this._windowRenderer)
        {
            this._windowRenderer.dispose();
            this._windowRenderer = null;
            WindowContext.setRenderer(null);
        }

        this._pendingAssets.clear();
        this._pendingAssetUrls.clear();

        if(this._resourceManager)
        {
            this._resourceManager.dispose();
            this._resourceManager = null;
        }

        if(this._hintManager)
        {
            this._hintManager.dispose();
            this._hintManager = null;
        }

        this._skinContainer.dispose();
        this._themeManager = null;
        this._widgetLayouts.clear();
        this._localization = null;
        WindowParser.localizationResolver = null;
        this._elementRegistry.dispose();
        this._events.removeAllListeners();
    }

    public requireWidgetLayout(name: string, purpose: string): string 
    {
        const layout = this._widgetLayouts.get(name);

        if(!layout) 
        {
            throw new Error(`Failed to initialize ${purpose}; missing layout "${name}"!`);
        }

        return layout;
    }
}
