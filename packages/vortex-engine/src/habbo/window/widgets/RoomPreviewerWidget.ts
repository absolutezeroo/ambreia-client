import type {Container} from 'pixi.js';
import {Graphics} from 'pixi.js';
import type {IRoomPreviewerWidget} from './IRoomPreviewerWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IDisplayObjectWrapper} from '@ambreia/ui/components/IDisplayObjectWrapper';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowEventListener} from '@ambreia/ui/events/WindowEventDispatcher';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {RoomPreviewer} from '@habbo/room/preview/RoomPreviewer';
import {PreviewCanvasStack} from '@habbo/room/preview/PreviewCanvasStack';
import {RoomEngineEvent} from '@habbo/room/events/RoomEngineEvent';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

/**
 * Room previewer widget.
 *
 * Renders a 3D room preview with configurable scale, zoom, and offset.
 * Creates a RoomPreviewer instance for rendering furniture, avatars,
 * and pets in a mini room view.
 *
 * In the AS3 version, uses RoomPreviewer with DisplayObject canvas.
 * In the TypeScript port, preview configuration is stored for the UI layer.
 *
 * @see sources/win63_version/habbo/window/widgets/RoomPreviewerWidget.as
 */
export class RoomPreviewerWidget implements IRoomPreviewerWidget 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::TYPE
    public static readonly TYPE: string = 'room_previewer';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::SCALE_KEY
    private static readonly SCALE_KEY: string = 'room_previewer:scale';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/preview/RoomPreviewer.as::SCALE_NORMAL
    // The larger of the two geometry scales `RoomPreviewer` offers; the other is 32.
    private static readonly GEOMETRY_SCALE_NORMAL: number = 64;
    private static readonly OFFSET_X_KEY: string = 'room_previewer:offsetx';
    private static readonly OFFSET_Y_KEY: string = 'room_previewer:offsety';
    private static readonly ZOOM_KEY: string = 'room_previewer:zoom';

    private static _roomIdCounter: number = 2;

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    private _root: IWindowContainer | null = null;
    private _canvasWrapper: IWindow | null = null;
    private _canvasDisplayObject: Container | null = null;
    private _onClickRoomViewBound: WindowEventListener;
    private _onResizeCanvasBound: WindowEventListener;
    private _roomEngine: IRoomEngine | null = null;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager) 
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        this._onClickRoomViewBound = this.onClickRoomView.bind(this);
        this._onResizeCanvasBound = this.onResizeCanvas.bind(this);

        const root = this._windowManager.buildWidgetLayout('room_previewer_xml') as IWindowContainer | null;

        if(root) 
        {
            this._root = root;

            root.addEventListener(WindowMouseEvent.CLICK, this._onClickRoomViewBound);
            root.addEventListener(WindowEvent.WE_RESIZE, this._onResizeCanvasBound);

            this._widgetWindow.rootWindow = root as unknown as IWindow;
            root.width = this._widgetWindow.width;
            root.height = this._widgetWindow.height;

            this.createRoomPreviewer(root);
        }
    }

    private _roomPreviewer: RoomPreviewer | null = null;

    /**
     * Clips the preview canvas to the widget's own rectangle.
     *
     * TS-only: in AS3 the canvas Bitmap is a child of this widget's window, so the window system
     * clips it for free. This port parents it onto the root PixiJS stage (see the deviation note in
     * `createRoomPreviewer`), where nothing clips it — and `room_previewer:zoom` then scales it past
     * the widget on every side. `RoomRenderingCanvas`'s own mask does not help: it is drawn at the
     * *canvas's* size and is scaled by the same zoom.
     */
    // TS-only: see the note above; AS3 needs no mask because its canvas is a window child.
    private _canvasMask: Graphics | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::get roomPreviewer()
    public get roomPreviewer(): RoomPreviewer | null 
    {
        return this._roomPreviewer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    private _scale: number = 64;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::get scale()
    public get scale(): number 
    {
        return this._scale;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::set scale()
    public set scale(value: number) 
    {
        this._scale = value;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::_offsetX
    private _offsetX: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::get offsetX()
    public get offsetX(): number 
    {
        return this._offsetX;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::set offsetX()
    public set offsetX(value: number) 
    {
        this._offsetX = value;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::_offsetY
    private _offsetY: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::get offsetY()
    public get offsetY(): number 
    {
        return this._offsetY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::set offsetY()
    public set offsetY(value: number) 
    {
        this._offsetY = value;
        this.refresh();
    }

    private _zoom: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::get zoom()
    public get zoom(): number 
    {
        return this._zoom;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::set zoom()
    public set zoom(value: number) 
    {
        this._zoom = value;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::get properties()
    public get properties(): PropertyStruct[] 
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(RoomPreviewerWidget.SCALE_KEY, this._scale),
            new PropertyStruct(RoomPreviewerWidget.OFFSET_X_KEY, this._offsetX),
            new PropertyStruct(RoomPreviewerWidget.OFFSET_Y_KEY, this._offsetY),
            new PropertyStruct(RoomPreviewerWidget.ZOOM_KEY, this._zoom),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::set properties()
    public set properties(values: PropertyStruct[]) 
    {
        for(const prop of values) 
        {
            switch(prop.key) 
            {
                case RoomPreviewerWidget.SCALE_KEY:
                    this.scale = Number(prop.value);
                    break;
                case RoomPreviewerWidget.OFFSET_X_KEY:
                    this.offsetX = Number(prop.value);
                    break;
                case RoomPreviewerWidget.OFFSET_Y_KEY:
                    this.offsetY = Number(prop.value);
                    break;
                case RoomPreviewerWidget.ZOOM_KEY:
                    this.zoom = Number(prop.value);
                    break;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::showPreview()
    public showPreview(image: HTMLCanvasElement): void 
    {
        const wrapper = this._root?.findChildByName('room_canvas') as unknown as IDisplayObjectWrapper | null;

        if(!wrapper) return;

        // The live room canvas is parented directly onto the shared root
        // PixiJS stage rather than into the window tree (see
        // createRoomPreviewer()), and needs continuous per-frame position
        // syncing to track its host window on screen. A static preview needs
        // neither: WindowComposite draws a plain bitmap display object
        // straight into the window's own composited buffer at the right
        // position automatically, so once we're showing one, the live canvas
        // and its sync callback can go entirely.
        if(this._canvasDisplayObject)
        {
            PreviewCanvasStack.unregister(this._canvasDisplayObject);
            this._roomEngine?.unregisterCanvasSyncCallback(this._syncCanvasPositionBound);
            this._canvasDisplayObject.mask = null;
            this._canvasMask?.parent?.removeChild(this._canvasMask);
            this._canvasMask?.destroy();
            this._canvasMask = null;
            this._canvasDisplayObject.parent?.removeChild(this._canvasDisplayObject);
            this._canvasDisplayObject = null;
            this._canvasWrapper = null;
        }

        // AS3: new Bitmap(param1) with scaleX = scaleY = 2. Baked into a
        // pre-scaled canvas here since this now goes through the normal
        // drawImage() compositing path (see WindowComposite.ts) rather than
        // a PixiJS Sprite.
        const scaled = document.createElement('canvas');

        scaled.width = image.width * 2;
        scaled.height = image.height * 2;

        const ctx = scaled.getContext('2d');

        if(!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0, scaled.width, scaled.height);

        wrapper.setDisplayObject(scaled);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

        PreviewCanvasStack.unregister(this._canvasDisplayObject);
        this._roomEngine?.unregisterCanvasSyncCallback(this._syncCanvasPositionBound);
        this._roomEngine?.events.off(RoomEngineEvent.REE_INITIALIZED, this._onRoomInitializedBound);

        // Take the canvas off the stage, exactly as showPreview() does when it
        // swaps the live canvas for a static bitmap. Dropping the reference is not
        // enough: this container is parented onto the shared root stage rather
        // than into the window tree (see createRoomPreviewer()), so nothing else
        // removes it — and with the sync callback gone it also stops being hidden,
        // freezing a rendered mini-room on screen at the widget's last position.
        this._canvasDisplayObject?.parent?.removeChild(this._canvasDisplayObject);

        this._roomEngine = null;
        this._canvasWrapper = null;
        this._canvasDisplayObject = null;

        if(this._root) 
        {
            this._root.removeEventListener(WindowMouseEvent.CLICK, this._onClickRoomViewBound);
            this._root.removeEventListener(WindowEvent.WE_RESIZE, this._onResizeCanvasBound);
            this._root.dispose();
            this._root = null;
        }

        if(this._widgetWindow) 
        {
            this._widgetWindow.rootWindow = null;
        }

        this._widgetWindow = null;
        this._windowManager = null;
        this._roomPreviewer?.dispose();
        this._roomPreviewer = null;
    }

    private readonly _syncCanvasPositionBound = (): void => this.syncCanvasPosition();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::onRoomInitialized()
    private readonly _onRoomInitializedBound = (event: RoomEngineEvent): void => this.onRoomInitialized(event);

    /**
     * The preview room finally exists — build its canvas.
     *
     * AS3 only re-runs `getRoomCanvas()`/`setDisplayObject()` here, because in its case the room is
     * always already there and this is a re-initialization. It is also the recovery path for the
     * case this port hits at boot, where the room was deferred and no canvas was ever attached, so
     * it runs the whole attach.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::onRoomInitialized()
    private onRoomInitialized(event: RoomEngineEvent): void
    {
        if(this._disposed || !this._roomPreviewer || !this._root) return;

        if(event.roomId !== this._roomPreviewer.previewRoomId) return;

        this._roomPreviewer.reset(false);
        this.attachRoomCanvas(this._root);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as constructor
    private createRoomPreviewer(root: IWindowContainer): void 
    {
        const roomEngine = this._windowManager?.roomEngine;

        if(!roomEngine) return;

        RoomPreviewerWidget._roomIdCounter++;

        const previewRoomId = RoomPreviewerWidget._roomIdCounter;

        this._roomEngine = roomEngine;

        // AS3 subscribes before creating the previewer, and it is not decoration: the preview room
        // is routinely asked for before the room engine can build one — this widget is constructed
        // while its host window is, which for the wired chest is during component init — and
        // `RoomEngine.initializeRoom()` parks it until `roomManagerInitialized()` replays it. The
        // canvas below then comes back null, and without this listener nothing ever tries again.
        roomEngine.events.on(RoomEngineEvent.REE_INITIALIZED, this._onRoomInitializedBound);

        this._roomPreviewer = new RoomPreviewer(roomEngine, previewRoomId);
        this._roomPreviewer.createRoomForPreviews();

        this.attachRoomCanvas(root);
    }

    /**
     * AS3 does this inline in the constructor and again, in a shorter form, in
     * `onRoomInitialized()`. Shared here because this port's version has to do more than AS3's —
     * see the stage-parenting note below — and the deferred path needs all of it, not just the
     * `setDisplayObject()` AS3 repeats.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as constructor
    private attachRoomCanvas(root: IWindowContainer): void
    {
        const roomEngine = this._roomEngine;

        if(!roomEngine || !this._roomPreviewer) return;

        const canvasWrapper = root.findChildByName('room_canvas') as unknown as IDisplayObjectWrapper | null;

        if(!canvasWrapper) return;

        // AS3: `getRoomCanvas(var_624.width, var_624.height)` — the size of the `room_canvas`
        // wrapper, **not** of the root. The root is resized to the host window just above (AS3 does
        // the same), but the wrapper keeps the size the layout gives it: 162 x 168, wider than the
        // 125-px viewport.
        //
        // That difference is load-bearing. The widget shifts the whole canvas by its
        // `room_previewer:offsetx/offsety` (-65, -30 for the avatar editor) while the room engine
        // separately shifts the content inside the canvas by the same amounts via `addViewOffset`.
        // Over AS3's wider surface the display shift merely chooses which part of it you see. Built
        // at exactly the viewport size — which this used to do — the same shift throws half the
        // image off the left edge, and the previewed object frames off-centre.
        const wrapperWindow = canvasWrapper as unknown as IWindow;
        const canvas = this._roomPreviewer.getRoomCanvas(wrapperWindow.width, wrapperWindow.height);

        if(canvas) 
        {
            canvasWrapper.setDisplayObject(canvas);
            this._canvasDisplayObject = canvas;
            this._canvasWrapper = canvasWrapper as unknown as IWindow;

            // TS deviation: RoomEngine.createRoomCanvas() parents the canvas
            // directly onto the root PixiJS stage (see RoomEngine.ts), not into
            // this widget's own window tree — so its screen position/visibility
            // has to be synced continuously to the wrapper window's global state
            // (window events alone can't catch every case, e.g. an ancestor
            // window being hidden), exactly like RoomDesktop does for the main
            // room view via a per-frame position sync.
            PreviewCanvasStack.register(canvas, canvasWrapper as unknown as IWindow);

            roomEngine.registerCanvasSyncCallback(this._syncCanvasPositionBound);
            this.syncCanvasPosition();

            // `refresh()` only ever runs from the layout's property setters, and everything it does
            // needs the rendering canvas: `zoomIn()`/`zoomOut()` reach it through
            // `setRoomCanvasScale()`, which returns silently when the canvas is not registered yet
            // (`if(!canvas) return`). Whether the properties land before or after this point is not
            // something the widget controls, so re-run it here, once the canvas certainly exists.
            this.refresh();
        }
    }

    private syncCanvasPosition(): void 
    {
        if(!this._canvasDisplayObject || !this._canvasWrapper) return;

        const globalPosition = {x: 0, y: 0};

        this._canvasWrapper.getGlobalPosition(globalPosition);

        // AS3 sets the canvas's own x/y to offsetX/offsetY (RoomPreviewerWidget.as::refresh()),
        // which works there because the canvas is a child of this widget's window. Here it's
        // parented directly onto the root stage (see deviation note below), so the offset has
        // to be folded into the same global-position assignment instead of applied separately.
        this._canvasDisplayObject.x = globalPosition.x + this._offsetX;
        this._canvasDisplayObject.y = globalPosition.y + this._offsetY;

        // Clip to the widget, in stage coordinates — see `_canvasMask`.
        if(this._canvasMask === null)
        {
            this._canvasMask = new Graphics();
            this._canvasMask.label = 'room_previewer_clip';
        }

        this._canvasMask.clear();
        this._canvasMask.rect(
            globalPosition.x, globalPosition.y,
            this._canvasWrapper.width, this._canvasWrapper.height
        );
        this._canvasMask.fill(0xFFFFFF);

        if(this._canvasMask.parent !== this._canvasDisplayObject.parent)
        {
            this._canvasDisplayObject.parent?.addChild(this._canvasMask);
        }

        this._canvasDisplayObject.mask = this._canvasMask;

        // TS deviation: this canvas and the main room view's canvas both get
        // parented directly onto the same shared PixiJS stage (see file header
        // comment / RoomEngine.createRoomCanvas()), so their relative stacking
        // depends purely on PixiJS child order, not window z-order. If the main
        // room view's canvas is (re)created after this one — e.g. entering a
        // room while the inventory/preview is already open — it ends up on top
        // and visually covers the preview wherever their screen rects overlap.
        // Ordering all preview canvases against each other cannot be decided
        // here (this one cannot see the catalog's), so it lives in one place.
        PreviewCanvasStack.restack();

        // Flash semantics: a DisplayObject parented into the window is only
        // shown when the window AND all its ancestors are visible. The canvas
        // lives on the root PixiJS stage here, so replicate that by walking
        // the wrapper's parent chain.
        //
        // Bug fix: switching inventory tabs detaches the inactive tab's whole
        // container via removeChild() (InventoryMainView.setViewToCategory())
        // rather than setting .visible = false on it. Walking upward from a
        // detached subtree hits a null parent without ever finding a
        // window.visible === false, so this used to always conclude "visible"
        // — leaving the 3D preview floating on screen for a tab that's no
        // longer attached anywhere. Require the walk to actually reach the
        // real desktop root; stopping short of it means the window is
        // detached, which is exactly the invisible case Flash semantics need.
        const desktop = this._windowManager?.getDesktop(1) ?? null;
        let window: IWindow | null = this._canvasWrapper;
        let visible = true;
        let reachedDesktop = false;

        while(window) 
        {
            if(!window.visible) 
            {
                visible = false;
                break;
            }

            if(window === desktop) 
            {
                reachedDesktop = true;
                break;
            }

            window = window.parent;
        }

        this._canvasDisplayObject.visible = visible && reachedDesktop;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::refresh()
    private refresh(): void 
    {
        if(!this._roomPreviewer || !this._roomPreviewer.isRoomEngineReady) return;

        // AS3 picks the geometry scale from `room_previewer:scale` alone (`var_337 == 64 ?
        // zoomIn() : zoomOut()`) and applies `room_previewer:zoom` on top as a raster scale of the
        // canvas Bitmap. Reproduced literally, the avatar editor — scale 64, zoom 2 — renders a
        // ~130px avatar and doubles it to ~260px inside a 210px box, so its legs are always cut off.
        //
        // Deviation, agreed deliberately: divide the geometry scale by the zoom, so the zoom
        // becomes a pure pixel doubling of a half-scale render rather than a magnification of a
        // full-scale one. Same final size, and crisp now that textures sample nearest — the
        // standard pixel-art composition. It is stacked on top of an older deviation (the canvas is
        // parented to the PixiJS stage, not into this widget's window), which is why matching AS3's
        // numbers here does not reproduce AS3's result.
        //
        // `RoomPreviewer` offers only the two AS3 scales, so this is a choice between them.
        if(this._scale / Math.max(1, this._zoom) >= RoomPreviewerWidget.GEOMETRY_SCALE_NORMAL) 
        {
            this._roomPreviewer.zoomIn();
        }
        else 
        {
            this._roomPreviewer.zoomOut();
        }

        // AS3 pushes the widget's offset into `addViewOffset` here **as well as** onto the canvas
        // display object below, because there the display object is a Bitmap parented inside this
        // widget's own window: its x/y are local, and the window clips.
        //
        // This port parents the canvas onto the root PixiJS stage instead (see the deviation note
        // in syncCanvasPosition) and folds the offset into that global placement. Feeding the same
        // offset to the room engine as well applies it a second time, in a different space: the
        // framing then converges on the object's centre *minus* the offset, and for the avatar
        // editor (-65, -30) that walks the preview off the avatar and onto the wall behind it —
        // visibly, over the eight frames the engine takes to get there.
        //
        // The two axes do not behave alike, and the reason is the zoom. The engine's offset lives in
        // *canvas* coordinates and is therefore multiplied by `room_previewer:zoom` (2 for the
        // avatar editor) on its way to the screen; the display-object offset is already in screen
        // pixels. Horizontally, one screen-space application is what frames correctly — a second,
        // doubled one walked the preview off the avatar and onto the wall behind it. Vertically the
        // engine's contribution is still needed: without it the framing sits ~30px low and the
        // preview shows only the top of the head.
        //
        // Deviation, driven by observation rather than by the source, which applies both offsets on
        // both axes.
        // ...and it is expressed in *canvas* coordinates, which the half-scale render above shrinks
        // by `1 / zoom`. Left as-is, the layout's -30 would only shift the preview 30 screen px
        // where it used to shift 60, dropping the avatar low enough to lose its feet off the bottom
        // while leaving dead space above. Scaling it by the zoom keeps the shift constant in screen
        // pixels, which is the space the layout's number was chosen in.
        this._roomPreviewer.addViewOffset = {x: 0, y: this._offsetY * Math.max(1, this._zoom)};

        if(this._canvasDisplayObject) 
        {
            this._canvasDisplayObject.scale.x = this._zoom;
            this._canvasDisplayObject.scale.y = this._zoom;
        }

        this.syncCanvasPosition();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::onClickRoomView()
    private onClickRoomView(): void 
    {
        this._roomPreviewer?.changeRoomObjectState();
    }

    /**
     * Handle resize of the room preview canvas.
     *
     * In AS3, updates the RoomPreviewer canvas dimensions.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::onResizeCanvas()
    private onResizeCanvas(): void 
    {
        if(this._root && this._roomPreviewer) 
        {
            this._roomPreviewer.modifyRoomCanvas(this._root.width, this._root.height);
            this.syncCanvasPosition();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/RoomPreviewerWidget.as::toString()
    public toString(): string
    {
        return 'RoomPreviewerWidget';
    }
}
