import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IWindow} from '@core/window/IWindow';
import type {IInteractiveWindow} from '@core/window/components/IInteractiveWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import type {HabboCatalog} from '../HabboCatalog';
import type {IGridItem} from './IGridItem';
import type {IItemGrid} from './IItemGrid';

/**
 * Base grid-item view: hosts an icon bitmap, handles select/drag mouse events.
 *
 * @see sources/win63_version/habbo/catalog/viewer/ProductGridItem.as
 */
export class ProductGridItem implements IGridItem
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::GRID_ITEM_BORDER
    static readonly GRID_ITEM_BORDER: string = 'bg';

    protected _view: IWindowContainer | null = null;

    private _grid: IItemGrid | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::_icon
    protected _icon: IBitmapWrapperWindow | null = null;

    protected _wideIcon: IBitmapWrapperWindow | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::_disposed
    private _disposed: boolean = false;

    private _mouseDownTarget: IWindow | null = null;

    /**
     * How far the pointer must travel from where it was pressed before leaving a grid item counts
     * as dragging it into the room rather than as an imprecise click.
     */
    // TS-only: AS3 has no threshold at all — see the DEVIATION note on `eventProc()`.
    private static readonly DRAG_THRESHOLD: number = 4;

    /** Where the pointer was pressed, in stage coordinates, or null when no press is pending. */
    // TS-only: AS3 records only the window, never the point, because it never measures the travel.
    private _mouseDownAt: { x: number; y: number } | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::_catalog
    private _catalog: HabboCatalog | null;

    constructor(catalog: HabboCatalog)
    {
        this._catalog = catalog;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::get view()
    get view(): IWindowContainer
    {
        return this._view!;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::set grid()
    set grid(grid: IItemGrid)
    {
        this._grid = grid;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._grid = null;
        this._icon = null;
        this._wideIcon = null;
        this._catalog = null;

        if(this._view != null)
        {
            this._view.dispose();
            this._view = null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::get catalog()
    protected get catalog(): HabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::activate()
    activate(): void
    {
        if(!this._view) return;

        const highlight = this._view.findChildByTag('ITEM_HILIGHT');

        if(highlight)
        {
            highlight.visible = true;
        }
        else
        {
            this._view.getChildByName('bg')!.style = 0;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::deactivate()
    deactivate(): void
    {
        if(!this._view) return;

        const highlight = this._view.findChildByTag('ITEM_HILIGHT');

        if(highlight)
        {
            highlight.visible = false;
        }
        else
        {
            this._view.getChildByName('bg')!.style = 3;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::set view()
    set view(view: IWindowContainer)
    {
        if(!view) return;

        this._view = view;
        this._view.procedure = this.eventProc.bind(this);
        this._wideIcon = this._view.findChildByName('image_wide') as unknown as IBitmapWrapperWindow | null;

        if(this._wideIcon)
        {
            this._view.findChildByName('wide_container')!.visible = this.useWideView;
            this._view.findChildByName('small_container')!.visible = !this.useWideView;
            this._view.width = this.useWideView ? this._view.limits.maxWidth : this._view.limits.minWidth;
        }
        else
        {
            this._wideIcon = this._icon;
        }

        this._icon = this._view.findChildByName('image') as unknown as IBitmapWrapperWindow | null;

        const highlight = this._view.findChildByTag('ITEM_HILIGHT');

        if(highlight)
        {
            highlight.visible = false;
        }

        const multiContainer = this._view.findChildByName('multiContainer');

        if(multiContainer)
        {
            multiContainer.visible = false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::get useWideView()
    protected get useWideView(): boolean
    {
        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::setDraggable()
    setDraggable(draggable: boolean): void
    {
        // AS3 writes `if(_view as IInteractiveWindow && param1)`, and its `as` yields **null** when
        // the object does not implement the interface — a runtime type test, not a cast. TS's
        // `as unknown as` is a compile-time assertion that never yields null, so every view reached
        // here was taken for interactive and the call threw on the ones that are not: the club-gift
        // item hands over its plain `image_container`, and the whole catalog page stopped building
        // ("interactive.setMouseCursorForState is not a function").
        //
        // `IInteractiveWindow` is erased at runtime and is implemented by four unrelated
        // controllers, so the test is for the member this method actually uses.
        const interactive = this._view as unknown as Partial<IInteractiveWindow> | null;

        if(draggable && typeof interactive?.setMouseCursorForState === 'function')
        {
            interactive.setMouseCursorForState(4, 5);
            interactive.setMouseCursorForState(4 | 1, 5);
        }
    }

    /**
     * Pressing a grid item and then leaving it is how an item is dragged into the room: the grid
     * hands the offer to the mover, the room engine arms a placement preview, and the catalog
     * hides itself so the room is clear to drop into.
     */
    // DEVIATION: AS3 starts that drag on the first WME_OUT after a press, with no measure of how
    //   far the pointer actually travelled — and a grid item is small, is made of nested windows
    //   (container, icon, border), and WME_OUT fires between them, so a click that drifts a pixel
    //   or crosses into the item's own icon reads as a drag. The catalog then closes on what the
    //   player experienced as an ordinary click, with a furni stuck to the cursor. The gesture is
    //   kept; only the trigger is given the travel threshold Flash never had. Nothing is refused
    //   that AS3 accepts beyond DRAG_THRESHOLD pixels.
    //   WME_UP_OUTSIDE clears the pending press for the same reason it is not in AS3's list by
    //   oversight rather than by design: a press whose button is already released can never become
    //   a drag, and leaving it armed is what lets a later, buttonless WME_OUT fire one.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::eventProc()
    private eventProc(event: WindowEvent, window: IWindow | null): void
    {
        if(event.type === 'WME_UP' || event.type === 'WME_UP_OUTSIDE')
        {
            this.clearPendingDrag();
        }
        else if(event.type === 'WME_DOWN')
        {
            if(window == null) return;

            const down = event as WindowMouseEvent;

            this._grid!.select(this, true);
            this._mouseDownTarget = window;
            this._mouseDownAt = {x: down.stageX, y: down.stageY};
        }
        else if(event.type === 'WME_OUT' && this._mouseDownTarget != null && this._mouseDownTarget === window)
        {
            if(!this.travelledFarEnoughToDrag(event as WindowMouseEvent)) return;

            const started = this._grid!.startDragAndDrop(this);

            if(started)
            {
                this.clearPendingDrag();
            }
        }
        else if(event.type === 'WME_CLICK' || event.type === 'WME_DOUBLE_CLICK')
        {
            this.clearPendingDrag();
        }
    }

    // TS-only: the measurement AS3 never makes. See the DEVIATION note on `eventProc()`.
    private travelledFarEnoughToDrag(event: WindowMouseEvent): boolean
    {
        if(this._mouseDownAt === null) return true;

        const dx = event.stageX - this._mouseDownAt.x;
        const dy = event.stageY - this._mouseDownAt.y;

        return (dx * dx) + (dy * dy) >= ProductGridItem.DRAG_THRESHOLD * ProductGridItem.DRAG_THRESHOLD;
    }

    // TS-only: the two fields are one state — a pending press — so they are cleared together.
    private clearPendingDrag(): void
    {
        this._mouseDownTarget = null;
        this._mouseDownAt = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::setIconImage()
    setIconImage(image: ImageBitmap | null, disposeSource: boolean): void
    {
        if(image == null) return;

        const target = this.targetIcon;
        let assignedToTarget = false;

        if(target != null && !target.disposed)
        {
            target.bitmap = image;
            assignedToTarget = true;
        }

        // AS3 copies param1's pixels into a BitmapData the target already owns
        // (copyPixels), so disposing the source afterward never touches what's
        // on screen. Here `target.bitmap = image` assigns the SAME ImageBitmap
        // by reference - closing it below would also destroy the one the target
        // is now displaying, so only close it when it was NOT handed to a live
        // target (matching AS3's "source is a separate, disposable buffer" intent).
        if(disposeSource && !assignedToTarget)
        {
            image.close();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::get targetIcon()
    protected get targetIcon(): IBitmapWrapperWindow | null
    {
        return this.useWideView ? this._wideIcon : this._icon;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/ProductGridItem.as::renderAvatarImage()
    // AS3's BitmapData render is synchronous end-to-end. The PixiJS port's equivalent
    // (AvatarImage.getCroppedImage()) produces a Texture backed by a canvas resource
    // synchronously, but turning that into the ImageBitmap the icon wrapper needs requires
    // the browser's async createImageBitmap() - there is no synchronous browser equivalent.
    // Callers therefore apply the result via a promise continuation instead of a direct return.
    protected renderAvatarImage(figureString: string, listener: IAvatarImageListener | null): Promise<ImageBitmap | null>
    {
        const avatarImage = this._catalog!.avatarRenderManager!.createAvatarImage(figureString, 'h', '', listener, null);

        if(!avatarImage) return Promise.resolve(null);

        const texture = avatarImage.getCroppedImage('head', 0.5) as {
            width: number;
            height: number;
            source?: { resource?: CanvasImageSource };
        } | null;

        avatarImage.dispose();

        const resource = texture?.source?.resource;

        if(!texture || !resource) return Promise.resolve(null);

        const canvas = document.createElement('canvas');

        canvas.width = texture.width;
        canvas.height = texture.height;

        const ctx = canvas.getContext('2d');

        if(!ctx) return Promise.resolve(null);

        ctx.drawImage(resource, 0, 0);

        return createImageBitmap(canvas);
    }
}
