import {Container, Graphics} from 'pixi.js';
import type {Texture} from 'pixi.js';
import type {IAvatarImage} from '@habbo/avatar/IAvatarImage';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IDisplayObjectWrapper} from '@core/window/components/IDisplayObjectWrapper';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {Logger} from '@core/utils/Logger';
import {AssetBitmap} from '@core/assets/AssetBitmap';
import {CatalogProductImages} from '../CatalogProductImages';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {Vector3d} from '@room/utils/Vector3d';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {RoomPreviewer} from '@habbo/room/preview/RoomPreviewer';
import {AvatarAction} from '@habbo/avatar/enum/AvatarAction';
import {avatarImageToBitmap} from '@habbo/avatar/AvatarImageSnapshot';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import type {HabboCatalog} from '../../HabboCatalog';
import type {IPurchasableOffer} from '../../IPurchasableOffer';
import type {IProduct} from '../IProduct';
import {ProductDisplayWrapper} from '../ProductDisplayWrapper';
import type {ProductImageWidget} from '../../../window/widgets/ProductImageWidget';
import type {BundleProductContainer} from '../BundleProductContainer';
import type {IDragAndDropDoneReceiver} from '../IDragAndDropDoneReceiver';
import {SelectProductEvent} from './events/SelectProductEvent';
import {SetRoomPreviewerStuffDataEvent} from './events/SetRoomPreviewerStuffDataEvent';
import {CatalogWidgetSpinnerEvent} from './events/CatalogWidgetSpinnerEvent';
import {CatalogWidgetBundleDisplayExtraInfoEvent} from './events/CatalogWidgetBundleDisplayExtraInfoEvent';
import {ExtraInfoItemData} from './bundlepurchaseinfodisplay/ExtraInfoItemData';
import type {CatalogWidgetEvent} from './events/CatalogWidgetEvent';
import {CatalogWidgetName} from './CatalogWidgetName';
import {CatalogWidget} from './CatalogWidget';
import {PreviewCanvasStack} from '@habbo/room/preview/PreviewCanvasStack';
import {HabbiconAssetManager} from '@habbo/habbicons/assets/HabbiconAssetManager';

const log = Logger.getLogger('habbo.catalog.viewer.widgets.ProductViewCatalogWidget');

/**
 * Shows the currently selected offer's name/description/price and a preview (room-canvas
 * furniture/avatar render, or a static image for special products), plus the preview
 * interaction controls (rotate_avatar_left/right, toggle_preview_magic - avatar pose cycling,
 * toggle_preview_zoom).
 *
 * Both halves of the "e" branch are here: the room-previewer path in `renderEffectPreview()`, and
 * the flat composite in `renderEffectPreviewFallback()` for when there is no room canvas to put an
 * avatar in. The second was deferred for a long time on the grounds that it needed a `BitmapData`
 * the engine does not have — it needs an `OffscreenCanvas`, which it does.
 *
 * Three things used to be listed here as missing and none of them were. "r" is a bot offer — a
 * single cropped avatar render, `renderBotPreview()`. "e" was described as needing pixel-level
 * compositing, but AS3 takes the room-previewer path first (`addAvatarIntoRoom(figure,
 * productClassId)` plus the two `applyPreviewAvatar*` helpers, all of which this port already had).
 * And the pre-rendered special-product image table was cited as `class_3172` — a room-session
 * message composer with nothing to do with any of this; the real table is `_SafeCls_3399`, ported
 * as `CatalogProductImages`, and `onPreviewProduct()` has been reading it all along.
 *
 * Two more used to be on that list and are not any more: ProductDisplayWrapper drives the generic
 * default case, and furniture/wall-item rotation is real — `canRotatePreviewFurniture()` reads the
 * object's allowed-direction set and `canRotatePreviewWallItem()` answers for the two walls.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as
 */
export class ProductViewCatalogWidget extends CatalogWidget implements IGetImageListener, IDragAndDropDoneReceiver
{
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_MODE_NONE
    private static readonly PREVIEW_MODE_NONE: number = 0;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_MODE_AVATAR
    private static readonly PREVIEW_MODE_AVATAR: number = 1;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_MODE_FLOOR_FURNITURE
    private static readonly PREVIEW_MODE_FLOOR_FURNITURE: number = 2;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_MODE_WALL_ITEM
    private static readonly PREVIEW_MODE_WALL_ITEM: number = 3;

    /** The flat preview's fill when the layout carries no `pixelsBackground` window. */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct() (4291611852)
    private static readonly EFFECT_PREVIEW_BACKGROUND_COLOR: number = 4291611852;

    /** The cell an effect's sprites are authored around, which is not the avatar's own size. */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct() (64)
    private static readonly EFFECT_SPRITE_CELL: number = 64;

    /** Flash's ADD blend, as a sprite ink value. */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::addEffectSprites() (33)
    private static readonly SPRITE_INK_ADD: number = 33;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_AVATAR_DEFAULT_BODY_DIRECTION
    private static readonly PREVIEW_AVATAR_DEFAULT_BODY_DIRECTION: number = 2;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_AVATAR_DEFAULT_HEAD_DIRECTION
    private static readonly PREVIEW_AVATAR_DEFAULT_HEAD_DIRECTION: number = 3;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ACTION_STAND
    private static readonly PREVIEW_ACTION_STAND: number = 0;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ACTION_WALK
    private static readonly PREVIEW_ACTION_WALK: number = 1;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ACTION_DANCE
    private static readonly PREVIEW_ACTION_DANCE: number = 2;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ACTION_SIT
    private static readonly PREVIEW_ACTION_SIT: number = 3;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ACTION_LAY
    private static readonly PREVIEW_ACTION_LAY: number = 4;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ACTION_WAVE
    private static readonly PREVIEW_ACTION_WAVE: number = 5;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ACTION_COUNT
    private static readonly PREVIEW_ACTION_COUNT: number = 6;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ZOOM_NORMAL
    private static readonly PREVIEW_ZOOM_NORMAL: number = 1;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ZOOM_IN
    private static readonly PREVIEW_ZOOM_IN: number = 2;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ZOOM_IN_CAMERA_OFFSET_Y
    private static readonly PREVIEW_ZOOM_IN_CAMERA_OFFSET_Y: number = 41;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ZOOM_MOVE_SPEED_DENOMINATOR
    private static readonly PREVIEW_ZOOM_MOVE_SPEED_DENOMINATOR: number = 9;
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_ZOOM_SPEED_SLOW
    private static readonly PREVIEW_ZOOM_SPEED_SLOW: number = 0.12;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_SIT_OFFSETS
    private static readonly PREVIEW_SIT_OFFSETS = new Vector3d(2, 2, 0.55);
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::PREVIEW_LAY_OFFSETS
    private static readonly PREVIEW_LAY_OFFSETS = new Vector3d(1, 1, 0.8);

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_catalog
    private _catalog: HabboCatalog | null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_productName
    private _productName: IWindow | null = null;

    private _productDescription: IWindow | null = null;

    private _teaserImage: IBitmapWrapperWindow | null = null;

    private _roomCanvasContainer: IWindowContainer | null = null;

    private _roomCanvas: IDisplayObjectWrapper | null = null;

    // AS3: var_1030/var_3250 - the fallback "product_image_widget" preview shown for product
    // types renderProductPreview() doesn't otherwise handle (currently: chat_style, gated by
    // ProductDisplayWrapper.isSupported() below). AS3 hides this container unconditionally before
    // every preview render and only re-shows it in that default case - our port previously never
    // looked this node up at all, so its placeholder graphic (visible by default, see
    // ProductImageWidget's constructor) stayed on screen forever, overlapping the room-canvas
    // furniture/wall-item preview.
    private _productImageWidgetContainer: IWidgetWindow | null = null;

    private _productImageWidget: ProductImageWidget | null = null;

    // TS deviation: RoomEngine.createRoomCanvas() parents the returned canvas directly onto the
    // shared root PixiJS stage, not into this widget's window tree (see
    // RoomPreviewerWidget.ts's file header for the same note) - so it needs continuous per-frame
    // position/visibility syncing to track room_canvas_container's screen position, exactly like
    // RoomPreviewerWidget.syncCanvasPosition() already does for the inventory item preview.
    private _canvasDisplayObject: Container | null = null;

    /**
     * The clip the canvas is drawn inside: AS3 wraps it in a Sprite whose `scrollRect` is the
     * `room_canvas` rect, and that clip is the only thing keeping the 2x avatar zoom inside the
     * window. A Pixi `Container` cannot be given a scroll rect, so the rect is a mask child here.
     *
     * Name DERIVED — the AS3 field is `_SafeStr_4721`, obfuscated in WIN63 and in AIR-1.0.31
     * alike, and `win63_version`'s copy of the class predates the preview zoom entirely.
     */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_SafeStr_4721
    private _roomCanvasClip: Container | null = null;

    // TS-only: AS3 clips with `scrollRect` on the wrapper and so has no mask object; this is the
    //   rect, held separately only because `updateRoomCanvasClipRect()` redraws it.
    private _roomCanvasClipMask: Graphics | null = null;

    private readonly _syncCanvasPositionBound = (): void => this.syncCanvasPosition();

    // AS3: sources/win63_version/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_previewOffset
    private _previewOffset: {x: number; y: number} = {x: 0, y: 0};
    // TS-only: the bot figure currently being previewed, so a render that finishes after the player
    // clicked another offer is dropped instead of painting over it. AS3 needs no such guard — its
    // avatar render is synchronous.
    private _botPreviewFigure: string | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_bundleGrid
    private _bundleGrid: IItemGridWindow | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_gridItemLayout
    private _gridItemLayout: IWindow | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_overrideStuffData
    private _overrideStuffData: IStuffData | null = null;

    private _lastSelectEvent: SelectProductEvent | null = null;

    private _priceBox: IWindow | null = null;

    private _useBundleSpinner: boolean = true;

    private _totalPriceWidgetInitialized: boolean = false;

    private _hasRoomCanvas: boolean = true;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_offer
    private _offer: IPurchasableOffer | null = null;

    private _mouseIsDown: boolean = false;

    private _rotateAvatarLeftButton: IWindow | null = null;

    private _rotateAvatarRightButton: IWindow | null = null;

    private _togglePreviewMagicButton: IWindow | null = null;

    private _toggleZoomButton: IWindow | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_previewMode
    private _previewMode: number = ProductViewCatalogWidget.PREVIEW_MODE_NONE;

    private _floorFurnitureCanRotate: boolean = false;

    private _avatarBodyDirection: number = ProductViewCatalogWidget.PREVIEW_AVATAR_DEFAULT_BODY_DIRECTION;

    private _avatarHeadDirection: number = ProductViewCatalogWidget.PREVIEW_AVATAR_DEFAULT_HEAD_DIRECTION;

    private _avatarAction: number = ProductViewCatalogWidget.PREVIEW_ACTION_STAND;

    private _zoomState: number = ProductViewCatalogWidget.PREVIEW_ZOOM_NORMAL;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_previewZoomAnimationProgress
    private _previewZoomAnimationProgress: number = 0;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::_previewZoomAnimationTargetProgress
    private _previewZoomAnimationTargetProgress: number = 0;

    private _zoomAnimationMaxDelta: number = 0;

    private _zoomAnimationLastStep: number = 0;

    private _zoomAnimationDecelerating: boolean = false;

    private _zoomAnimationActive: boolean = false;

    private _floorRotationMonitorActive: boolean = false;

    constructor(window: IWindowContainer, catalog: HabboCatalog)
    {
        super(window);
        this._catalog = catalog;
    }

    override dispose(): void
    {
        if(this.disposed) return;

        this.events.off(SelectProductEvent.SELECT_PRODUCT, this.onPreviewProduct);
        this.events.off(SetRoomPreviewerStuffDataEvent.CWE_SET_PREVIEWER_STUFFDATA, this.onStuffDataSet);
        this.events.off(CatalogWidgetSpinnerEvent.VALUE_CHANGED, this.onSpinnerEvent);
        this.events.off('TOTAL_PRICE_WIDGET_INITIALIZED', this.onTotalPriceWidgetInitialized);
        HabbiconAssetManager.removeEventListener(HabbiconAssetManager.ASSETS_LOADED, this.onHabbiconAssetsLoaded);
        this._rotateAvatarLeftButton?.removeEventListener(WindowMouseEvent.CLICK, this.onRotateAvatarLeft);
        this._rotateAvatarLeftButton = null;
        this._rotateAvatarRightButton?.removeEventListener(WindowMouseEvent.CLICK, this.onRotateAvatarRight);
        this._rotateAvatarRightButton = null;
        this._togglePreviewMagicButton?.removeEventListener(WindowMouseEvent.CLICK, this.onTogglePreviewMagic);
        this._togglePreviewMagicButton = null;
        this._toggleZoomButton?.removeEventListener(WindowMouseEvent.CLICK, this.onTogglePreviewZoom);
        this._toggleZoomButton = null;
        this.setFloorFurnitureRotationAvailabilityMonitorEnabled(false);
        this.stopPreviewZoomAnimation();
        PreviewCanvasStack.unregister(this._roomCanvasClip);
        this._catalog?.roomEngine?.unregisterCanvasSyncCallback(this._syncCanvasPositionBound);

        // Take the canvas off the stage rather than merely dropping the reference
        // to it: it is parented onto the shared root PixiJS stage, not into this
        // widget's window tree (see init()), so nothing else takes it off screen —
        // and with the sync callback unregistered nothing hides it either, which
        // left the last previewed piece of furniture floating over the room after
        // the catalog closed.
        //
        // Detaching only THIS container, rather than asking the previewer to
        // release its canvas: the previewer belongs to HabboCatalog and is shared,
        // so a widget disposed *after* its replacement was built (page switches
        // rebuild the product view) would otherwise dispose the fresh widget's
        // canvas out from under it — they key on the same preview room id. The
        // engine's own canvas record is replaced safely on the next
        // getRoomCanvas() in init(), which disposes whatever it superseded.
        //
        // The clip goes with it, and it is this widget's own object, so unlike the canvas it can
        // be destroyed outright — but only once the canvas is out of it, or `children: true` would
        // destroy the shared canvas with it. The parent test is what makes that safe in the
        // dispose-after-replacement order above: a canvas the fresh widget has already re-parented
        // into its own clip is left exactly where it is.
        if(this._canvasDisplayObject != null && this._canvasDisplayObject.parent === this._roomCanvasClip)
        {
            this._roomCanvasClip?.removeChild(this._canvasDisplayObject);
        }

        this._canvasDisplayObject = null;
        this._roomCanvasClip?.parent?.removeChild(this._roomCanvasClip);
        this._roomCanvasClip?.destroy({children: true});
        this._roomCanvasClip = null;
        this._roomCanvasClipMask = null;
        this._catalog = null;
        this._priceBox = null;
        super.dispose();
    }

    override init(): boolean
    {
        if(!super.init()) return false;

        this.attachWidgetView(CatalogWidgetName.PRODUCT_VIEW);

        if(!this._isEmbedded)
        {
            const first = this.window.getChildAt(0);

            if(first != null)
            {
                first.width = this.window.width;
                first.height = this.window.height;
            }
        }

        this._hasRoomCanvas = this.window.tags.indexOf('NO_ROOM_CANVAS') === -1;
        this._priceBox = null;
        this._productName = this.window.findChildByName('ctlg_product_name');
        this._productName!.caption = '';
        this._productDescription = this.window.findChildByName('ctlg_description');
        this._productDescription!.caption = '';
        (this._productName as unknown as ITextWindow).textColor = 0;
        (this._productDescription as unknown as ITextWindow).textColor = 0;
        this._teaserImage = this.window.findChildByName('ctlg_teaserimg_1') as unknown as IBitmapWrapperWindow | null;
        this._roomCanvasContainer = this.window.findChildByName('room_canvas_container') as unknown as IWindowContainer | null;

        if(this._roomCanvasContainer != null)
        {
            this._roomCanvasContainer.visible = false;
            this._roomCanvas = this._roomCanvasContainer.findChildByName('room_canvas') as unknown as IDisplayObjectWrapper | null;

            const roomPreviewer = this._catalog!.roomPreviewer;

            if(this._roomCanvas != null && roomPreviewer != null)
            {
                this._roomCanvasContainer.addEventListener(WindowMouseEvent.CLICK, this.roomCanvasContainerProcedure);
                roomPreviewer.disableUpdate = false;
                roomPreviewer.reset(false);

                const canvas = roomPreviewer.getRoomCanvas(this._roomCanvas.width, this._roomCanvas.height);

                if(canvas != null)
                {
                    const clip = this.bindRoomCanvasDisplayObject(canvas);

                    this._roomCanvas.setDisplayObject(clip);
                    PreviewCanvasStack.register(clip, this._roomCanvas as unknown as IWindow);
                    this._catalog!.roomEngine?.registerCanvasSyncCallback(this._syncCanvasPositionBound);
                    this.syncCanvasPosition();
                    this.applyRoomCanvasZoom();
                }
            }
            else
            {
                this._roomCanvasContainer = null;
                this._roomCanvas = null;
            }
        }

        // AS3: var_1030 = _window.findChildByName("product_image_widget") as class_2010;
        this._productImageWidgetContainer = this.window.findChildByName('product_image_widget') as unknown as IWidgetWindow | null;

        if(this._productImageWidgetContainer != null)
        {
            this._productImageWidget = this._productImageWidgetContainer.widget as ProductImageWidget | null;
            this._productImageWidgetContainer.visible = false;
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::init()
        this._rotateAvatarLeftButton = this.window.findChildByName('rotate_avatar_left');

        if(this._rotateAvatarLeftButton != null)
        {
            this._rotateAvatarLeftButton.visible = false;
            this._rotateAvatarLeftButton.addEventListener(WindowMouseEvent.CLICK, this.onRotateAvatarLeft);
        }

        this._rotateAvatarRightButton = this.window.findChildByName('rotate_avatar_right');

        if(this._rotateAvatarRightButton != null)
        {
            this._rotateAvatarRightButton.visible = false;
            this._rotateAvatarRightButton.addEventListener(WindowMouseEvent.CLICK, this.onRotateAvatarRight);
        }

        this._togglePreviewMagicButton = this.window.findChildByName('toggle_preview_magic');

        if(this._togglePreviewMagicButton != null)
        {
            this._togglePreviewMagicButton.visible = false;
            this._togglePreviewMagicButton.addEventListener(WindowMouseEvent.CLICK, this.onTogglePreviewMagic);
        }

        this._toggleZoomButton = this.window.findChildByName('toggle_preview_zoom');

        if(this._toggleZoomButton != null)
        {
            this._toggleZoomButton.visible = false;
            this._toggleZoomButton.addEventListener(WindowMouseEvent.CLICK, this.onTogglePreviewZoom);
        }

        this._previewOffset = {x: this._teaserImage!.x, y: this._teaserImage!.y};
        this._bundleGrid = this.window.findChildByName('bundleGrid') as unknown as IItemGridWindow | null;

        if(this._bundleGrid == null)
        {
            log.warn('Bundle Grid not initialized!');
        }

        this._gridItemLayout = this._catalog!.windowManager!.buildWidgetLayout('gridItem');

        this.events.on(SelectProductEvent.SELECT_PRODUCT, this.onPreviewProduct);
        this.events.on(SetRoomPreviewerStuffDataEvent.CWE_SET_PREVIEWER_STUFFDATA, this.onStuffDataSet);
        this.events.on(CatalogWidgetSpinnerEvent.VALUE_CHANGED, this.onSpinnerEvent);
        this.events.on('TOTAL_PRICE_WIDGET_INITIALIZED', this.onTotalPriceWidgetInitialized);

        return true;
    }

    /**
     * Puts the canvas inside the clip and returns the clip, which is what takes the canvas's place
     * on the stage and on `room_canvas` — AS3 hands the wrapper to `setDisplayObject()` too.
     *
     * The clip is what makes the zoom survivable: `applyRoomCanvasZoom()` scales the canvas, and
     * the canvas's own mask is a child of the container being scaled, so it grows with it and
     * clips nothing. Without an outer, unscaled rect the 2x avatar preview spills over the catalog
     * window and over the room behind it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::bindRoomCanvasDisplayObject()
    private bindRoomCanvasDisplayObject(canvas: Container): Container
    {
        if(this._roomCanvasClip == null)
        {
            const clip = new Container();

            clip.label = 'catalog_room_canvas_clip';
            clip.eventMode = 'none';
            clip.interactiveChildren = false;

            this._roomCanvasClipMask = new Graphics();
            this._roomCanvasClipMask.label = 'clip';
            clip.addChild(this._roomCanvasClipMask);
            clip.mask = this._roomCanvasClipMask;

            // The canvas is already on the shared root stage — RoomEngine.createRoomCanvas() parents
            // it there rather than into the window tree — so the clip takes its place there.
            canvas.parent?.addChild(clip);

            this._roomCanvasClip = clip;

            if(this._previewZoomAnimationProgress !== this._previewZoomAnimationTargetProgress)
            {
                this.startPreviewZoomAnimation();
            }

            this.setFloorFurnitureRotationAvailabilityMonitorEnabled(
                this._previewMode === ProductViewCatalogWidget.PREVIEW_MODE_FLOOR_FURNITURE
            );
        }

        if(this._canvasDisplayObject !== canvas || canvas.parent !== this._roomCanvasClip)
        {
            if(this._canvasDisplayObject != null && this._canvasDisplayObject.parent === this._roomCanvasClip)
            {
                this._roomCanvasClip.removeChild(this._canvasDisplayObject);
            }

            this._roomCanvasClip.addChild(canvas);
            this._canvasDisplayObject = canvas;
        }

        this.updateRoomCanvasClipRect();

        return this._roomCanvasClip;
    }

    /**
     * The clip's rect, which is AS3's `scrollRect` on the wrapper. AS3 re-assigns it from
     * `applyRoomCanvasZoom()` as well as at bind time, so a `room_canvas` that changed size is
     * re-clipped; an empty mask would hide the preview entirely, so both paths draw it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::applyRoomCanvasZoom() (scrollRect)
    private updateRoomCanvasClipRect(): void
    {
        if(this._roomCanvasClipMask == null || this._roomCanvas == null) return;

        this._roomCanvasClipMask
            .clear()
            .rect(0, 0, this._roomCanvas.width, this._roomCanvas.height)
            .fill(0xFFFFFF);
    }

    // TS deviation: mirrors RoomPreviewerWidget.syncCanvasPosition() - see this._canvasDisplayObject's
    // field comment for why this is needed (canvas parented onto the shared root stage, not this
    // widget's own window tree).
    private syncCanvasPosition(): void
    {
        if(!this._roomCanvasClip || !this._roomCanvas) return;

        const globalPosition = {x: 0, y: 0};

        this._roomCanvas.getGlobalPosition(globalPosition);

        // The clip, not the canvas: the canvas's own x/y are the zoom offsets applyRoomCanvasZoom()
        // writes, relative to the clip, and this runs every frame — writing the screen position
        // onto the canvas is what used to erase them and anchor the 2x preview to the rect's
        // top-left corner instead of its centre.
        this._roomCanvasClip.x = globalPosition.x;
        this._roomCanvasClip.y = globalPosition.y;

        // This canvas and the inventory previewer's are siblings on the shared
        // stage, so neither can decide its own depth — both used to re-assert
        // front-of-stage every frame and fought over the same slot, which is
        // what put the catalog's furniture inside the inventory's preview frame
        // (and back again on the next window move). Ordering lives in one place.
        PreviewCanvasStack.restack();

        const desktop = this._catalog!.windowManager?.getDesktop(1) ?? null;
        let window: IWindow | null = this._roomCanvas;
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

        this._roomCanvasClip.visible = visible && reachedDesktop;
    }

    /**
     * Dragging the preview out of its canvas is what starts a placement: WME_OUT with the button
     * still down hands the offer to `HabboCatalog.requestSelectedItemToMover()`, which arms the
     * room engine's inserter. `_mouseIsDown` exists only to tell that gesture apart from the
     * pointer merely leaving the canvas.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::roomCanvasContainerProcedure()
    private roomCanvasContainerProcedure = (event: WindowMouseEvent): void =>
    {
        switch(event.type)
        {
            case 'WME_CLICK':
                this._catalog!.roomPreviewer?.changeRoomObjectState();

                break;
            case 'WME_UP':
            case 'WME_OVER':
                this._mouseIsDown = false;

                break;
            case 'WME_DOWN':
                this._mouseIsDown = true;

                break;
            case 'WME_OUT':
                if(this._mouseIsDown && this._offer != null)
                {
                    if(this._catalog!.isDraggable(this._offer))
                    {
                        this._catalog!.requestSelectedItemToMover(this, this._offer);
                    }
                }

                this._mouseIsDown = false;

                break;
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onRotateAvatarLeft()
    private onRotateAvatarLeft = (event: WindowMouseEvent): void =>
    {
        this.rotateCurrentPreview(1);
        event.stopPropagation();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onRotateAvatarRight()
    private onRotateAvatarRight = (event: WindowMouseEvent): void =>
    {
        this.rotateCurrentPreview(-1);
        event.stopPropagation();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onTogglePreviewMagic()
    private onTogglePreviewMagic = (event: WindowMouseEvent): void =>
    {
        this.cyclePreviewAvatarAction();
        event.stopPropagation();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onTogglePreviewZoom()
    private onTogglePreviewZoom = (event: WindowMouseEvent): void =>
    {
        this.togglePreviewZoom();
        event.stopPropagation();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::rotateCurrentPreview()
    private rotateCurrentPreview(direction: number): void
    {
        const roomPreviewer = this._catalog?.roomPreviewer ?? null;

        if(roomPreviewer == null) return;

        switch(this._previewMode - 1)
        {
            case 0:
                this.rotatePreviewAvatar(direction, roomPreviewer);

                break;
            case 1:
                roomPreviewer.rotatePreviewFurniture(direction > 0);

                break;
            case 2:
                roomPreviewer.rotatePreviewWallItem();

                break;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::rotatePreviewAvatar()
    private rotatePreviewAvatar(direction: number, roomPreviewer: RoomPreviewer): void
    {
        if(this._previewMode !== ProductViewCatalogWidget.PREVIEW_MODE_AVATAR) return;

        if(this._avatarAction === ProductViewCatalogWidget.PREVIEW_ACTION_SIT && this.isDiagonalAvatarDirection(this._avatarBodyDirection + direction))
        {
            direction *= 2;
        }
        else if(this._avatarAction === ProductViewCatalogWidget.PREVIEW_ACTION_LAY && !this.isValidLayingDirection(this._avatarBodyDirection + direction))
        {
            direction = this._avatarBodyDirection === 0 ? 2 : -this._avatarBodyDirection;
        }

        this._avatarBodyDirection = this.normalizeAvatarDirection(this._avatarBodyDirection + direction);
        this._avatarHeadDirection = this._avatarBodyDirection;
        this.applyPreviewAvatarDirection(roomPreviewer);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::cyclePreviewAvatarAction()
    private cyclePreviewAvatarAction(): void
    {
        const roomPreviewer = this._catalog?.roomPreviewer ?? null;

        if(this._previewMode !== ProductViewCatalogWidget.PREVIEW_MODE_AVATAR || roomPreviewer == null) return;

        this._avatarAction = this.getNextPreviewAvatarAction(this._avatarAction);
        this.applyPreviewAvatarAction(roomPreviewer);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::togglePreviewZoom()
    private togglePreviewZoom(): void
    {
        if(this._previewMode !== ProductViewCatalogWidget.PREVIEW_MODE_AVATAR) return;

        this._zoomState = this._zoomState === ProductViewCatalogWidget.PREVIEW_ZOOM_NORMAL
            ? ProductViewCatalogWidget.PREVIEW_ZOOM_IN
            : ProductViewCatalogWidget.PREVIEW_ZOOM_NORMAL;
        this.animatePreviewZoomToSelection();
        this.updatePreviewControls();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::applyPreviewAvatarDirection()
    private applyPreviewAvatarDirection(roomPreviewer: RoomPreviewer): void
    {
        roomPreviewer.updateAvatarDirectionAndLocation(this._avatarBodyDirection, this._avatarHeadDirection, this.getPreviewAvatarLocation());
        roomPreviewer.updatePreviewRoomView(true);
        roomPreviewer.updateRoomEngine();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::setPreviewMode()
    private setPreviewMode(mode: number, canRotate: boolean = false): void
    {
        let resolvedMode = mode;

        if(!this._hasRoomCanvas || this._roomCanvasContainer == null || !this._roomCanvasContainer.visible)
        {
            resolvedMode = ProductViewCatalogWidget.PREVIEW_MODE_NONE;
        }

        if(this._previewMode === ProductViewCatalogWidget.PREVIEW_MODE_AVATAR && resolvedMode !== ProductViewCatalogWidget.PREVIEW_MODE_AVATAR)
        {
            this.resetPreviewAvatarDirection();
            this.resetPreviewAvatarAction();
            this.resetPreviewZoom();
            this.setPreviewZoomAnimationTarget(0, true);
        }

        if(this._previewMode !== ProductViewCatalogWidget.PREVIEW_MODE_AVATAR && resolvedMode === ProductViewCatalogWidget.PREVIEW_MODE_AVATAR)
        {
            this._zoomState = ProductViewCatalogWidget.PREVIEW_ZOOM_IN;
            this.setPreviewZoomAnimationTarget(1, true);
        }

        this._previewMode = resolvedMode;
        this._floorFurnitureCanRotate = resolvedMode === ProductViewCatalogWidget.PREVIEW_MODE_FLOOR_FURNITURE && canRotate;
        this.setFloorFurnitureRotationAvailabilityMonitorEnabled(resolvedMode === ProductViewCatalogWidget.PREVIEW_MODE_FLOOR_FURNITURE);

        if(resolvedMode === ProductViewCatalogWidget.PREVIEW_MODE_AVATAR && this._previewZoomAnimationProgress !== this._previewZoomAnimationTargetProgress)
        {
            this.animatePreviewZoomToSelection();
        }

        this.updatePreviewControls();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::setFloorFurnitureRotationAvailabilityMonitorEnabled()
    // TS deviation: AS3 hooks the room canvas DisplayObject's own "enterFrame" event; we don't
    // have a per-DisplayObject frame event here, so this uses the window manager's shared
    // update-receiver loop instead (same mechanism HintManager uses for its own polling).
    private setFloorFurnitureRotationAvailabilityMonitorEnabled(enabled: boolean): void
    {
        if(enabled === this._floorRotationMonitorActive) return;

        const updateAware = this._catalog?.windowManager as unknown as {
            registerUpdateReceiver?: (receiver: {update: (t: number) => void; dispose: () => void; disposed: boolean}, priority: number) => void
            removeUpdateReceiver?: (receiver: {update: (t: number) => void; dispose: () => void; disposed: boolean}) => void
        } | null;

        if(enabled)
        {
            updateAware?.registerUpdateReceiver?.(this._floorRotationMonitorReceiver, 10);
        }
        else
        {
            updateAware?.removeUpdateReceiver?.(this._floorRotationMonitorReceiver);
        }

        this._floorRotationMonitorActive = enabled;
    }

    private readonly _floorRotationMonitorReceiver = {
        update: (): void => this.onFloorFurnitureRotationAvailabilityFrame(),
        dispose: (): void => {},
        disposed: false,
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onFloorFurnitureRotationAvailabilityFrame()
    private onFloorFurnitureRotationAvailabilityFrame(): void
    {
        const roomPreviewer = this._catalog?.roomPreviewer ?? null;

        if(this._previewMode !== ProductViewCatalogWidget.PREVIEW_MODE_FLOOR_FURNITURE || roomPreviewer == null)
        {
            this.setFloorFurnitureRotationAvailabilityMonitorEnabled(false);

            return;
        }

        const canRotate = roomPreviewer.canRotatePreviewFurniture();

        if(this._floorFurnitureCanRotate !== canRotate)
        {
            this._floorFurnitureCanRotate = canRotate;
            this.updatePreviewControls();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::updatePreviewControls()
    private updatePreviewControls(): void
    {
        const isAvatar = this._previewMode === ProductViewCatalogWidget.PREVIEW_MODE_AVATAR;
        const hasAnyMode = this._previewMode !== ProductViewCatalogWidget.PREVIEW_MODE_NONE;
        const canRotate = hasAnyMode && (this._previewMode !== ProductViewCatalogWidget.PREVIEW_MODE_FLOOR_FURNITURE || this._floorFurnitureCanRotate);

        this.setPreviewButtonState(this._rotateAvatarLeftButton, hasAnyMode, canRotate);
        this.setPreviewButtonState(this._rotateAvatarRightButton, hasAnyMode, canRotate);
        this.setPreviewButtonState(this._togglePreviewMagicButton, isAvatar, isAvatar);
        this.setPreviewButtonState(this._toggleZoomButton, isAvatar, isAvatar);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::setPreviewButtonState()
    private setPreviewButtonState(button: IWindow | null, visible: boolean, enabled: boolean): void
    {
        if(button == null) return;

        button.visible = visible;

        if(enabled)
        {
            button.enable();
        }
        else
        {
            button.disable();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::resetPreviewAvatarDirection()
    private resetPreviewAvatarDirection(): void
    {
        this._avatarBodyDirection = ProductViewCatalogWidget.PREVIEW_AVATAR_DEFAULT_BODY_DIRECTION;
        this._avatarHeadDirection = ProductViewCatalogWidget.PREVIEW_AVATAR_DEFAULT_HEAD_DIRECTION;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::resetPreviewAvatarAction()
    private resetPreviewAvatarAction(): void
    {
        this._avatarAction = ProductViewCatalogWidget.PREVIEW_ACTION_STAND;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::getPreviewAvatarLocation()
    private getPreviewAvatarLocation(): Vector3d | null
    {
        switch(this._avatarAction - ProductViewCatalogWidget.PREVIEW_ACTION_SIT)
        {
            case 0:
                return ProductViewCatalogWidget.PREVIEW_SIT_OFFSETS;
            case 1:
                return ProductViewCatalogWidget.PREVIEW_LAY_OFFSETS;
            default:
                return null;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::applyPreviewAvatarAction()
    private applyPreviewAvatarAction(roomPreviewer: RoomPreviewer): void
    {
        roomPreviewer.updateObjectUserAction('figure_dance', 0);
        roomPreviewer.updateObjectUserAction('figure_expression', 0);

        switch(this._avatarAction)
        {
            case ProductViewCatalogWidget.PREVIEW_ACTION_WALK:
                roomPreviewer.updateUserPosture('mv');

                break;
            case ProductViewCatalogWidget.PREVIEW_ACTION_DANCE:
                roomPreviewer.updateUserPosture('std');
                roomPreviewer.updateObjectUserAction('figure_dance', 1);

                break;
            case ProductViewCatalogWidget.PREVIEW_ACTION_SIT:
                roomPreviewer.updateUserPosture('sit');

                break;
            case ProductViewCatalogWidget.PREVIEW_ACTION_LAY:
                roomPreviewer.updateUserPosture('lay');

                break;
            case ProductViewCatalogWidget.PREVIEW_ACTION_WAVE:
                roomPreviewer.updateUserPosture('std');
                roomPreviewer.updateObjectUserAction('figure_expression', AvatarAction.getExpressionId('wave'));

                break;
            default:
                roomPreviewer.updateUserPosture('std');
        }

        roomPreviewer.updateAvatarDirectionAndLocation(this._avatarBodyDirection, this._avatarHeadDirection, this.getPreviewAvatarLocation());
        roomPreviewer.updatePreviewRoomView(true);
        roomPreviewer.updateRoomEngine();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::getNextPreviewAvatarAction()
    private getNextPreviewAvatarAction(current: number): number
    {
        let next = current;

        do
        {
            next = (next + 1) % ProductViewCatalogWidget.PREVIEW_ACTION_COUNT;
        }
        while(this.isPreviewAvatarActionSkippedForDirection(next, this._avatarBodyDirection));

        return next;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::isPreviewAvatarActionSkippedForDirection()
    private isPreviewAvatarActionSkippedForDirection(action: number, direction: number): boolean
    {
        return (action === ProductViewCatalogWidget.PREVIEW_ACTION_SIT && this.isDiagonalAvatarDirection(direction))
            || (action === ProductViewCatalogWidget.PREVIEW_ACTION_LAY && !this.isValidLayingDirection(direction));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::resetPreviewZoom()
    private resetPreviewZoom(): void
    {
        this._zoomState = ProductViewCatalogWidget.PREVIEW_ZOOM_NORMAL;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::animatePreviewZoomToSelection()
    private animatePreviewZoomToSelection(): void
    {
        this.setPreviewZoomAnimationTarget(this._zoomState === ProductViewCatalogWidget.PREVIEW_ZOOM_IN ? 1 : 0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::setPreviewZoomAnimationTarget()
    private setPreviewZoomAnimationTarget(target: number, immediate: boolean = false): void
    {
        const clamped = Math.max(0, Math.min(1, target));

        this._previewZoomAnimationTargetProgress = clamped;

        if(immediate)
        {
            this.stopPreviewZoomAnimation();
            this._previewZoomAnimationProgress = clamped;
            this._zoomAnimationMaxDelta = 0;
            this._zoomAnimationLastStep = 0;
            this._zoomAnimationDecelerating = false;
            this.applyRoomCanvasZoom();

            return;
        }

        const delta = Math.abs(this._previewZoomAnimationTargetProgress - this._previewZoomAnimationProgress);

        if(delta <= 0)
        {
            this.stopPreviewZoomAnimation();
            this._previewZoomAnimationProgress = this._previewZoomAnimationTargetProgress;
            this._zoomAnimationLastStep = 0;
            this._zoomAnimationDecelerating = false;
            this.applyRoomCanvasZoom();

            return;
        }

        this._zoomAnimationMaxDelta = delta;
        this._zoomAnimationDecelerating = true;
        this.startPreviewZoomAnimation();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::startPreviewZoomAnimation()
    // TS deviation: driven by the window manager's shared update-receiver loop rather than a
    // DisplayObject "enterFrame" event - see setFloorFurnitureRotationAvailabilityMonitorEnabled().
    private startPreviewZoomAnimation(): void
    {
        if(this._zoomAnimationActive) return;

        this._zoomAnimationActive = true;

        const updateAware = this._catalog?.windowManager as unknown as {
            registerUpdateReceiver?: (receiver: {update: (t: number) => void; dispose: () => void; disposed: boolean}, priority: number) => void
        } | null;

        updateAware?.registerUpdateReceiver?.(this._zoomAnimationReceiver, 10);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::stopPreviewZoomAnimation()
    private stopPreviewZoomAnimation(): void
    {
        if(!this._zoomAnimationActive) return;

        this._zoomAnimationActive = false;

        const updateAware = this._catalog?.windowManager as unknown as {
            removeUpdateReceiver?: (receiver: {update: (t: number) => void; dispose: () => void; disposed: boolean}) => void
        } | null;

        updateAware?.removeUpdateReceiver?.(this._zoomAnimationReceiver);
    }

    private readonly _zoomAnimationReceiver = {
        update: (): void => this.onPreviewZoomAnimationFrame(),
        dispose: (): void => {},
        disposed: false,
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewZoomAnimationFrame()
    private onPreviewZoomAnimationFrame(): void
    {
        const remaining = this._previewZoomAnimationTargetProgress - this._previewZoomAnimationProgress;
        const distance = Math.abs(remaining);

        if(distance <= ProductViewCatalogWidget.PREVIEW_ZOOM_SPEED_SLOW)
        {
            this._previewZoomAnimationProgress = this._previewZoomAnimationTargetProgress;
            this._zoomAnimationLastStep = 0;
            this._zoomAnimationDecelerating = false;
            this.stopPreviewZoomAnimation();
            this.applyRoomCanvasZoom();

            return;
        }

        if(distance > this._zoomAnimationMaxDelta)
        {
            this._zoomAnimationMaxDelta = distance;
        }

        const ease = Math.sin(Math.PI * distance / this._zoomAnimationMaxDelta);
        const speedCap = this._zoomAnimationMaxDelta / ProductViewCatalogWidget.PREVIEW_ZOOM_MOVE_SPEED_DENOMINATOR;
        let step = ProductViewCatalogWidget.PREVIEW_ZOOM_SPEED_SLOW + (speedCap - ProductViewCatalogWidget.PREVIEW_ZOOM_SPEED_SLOW) * ease;

        if(this._zoomAnimationDecelerating)
        {
            if(step < this._zoomAnimationLastStep)
            {
                step = Math.min(this._zoomAnimationLastStep, distance);
            }
            else
            {
                this._zoomAnimationDecelerating = false;
            }
        }

        this._zoomAnimationLastStep = step;
        this._previewZoomAnimationProgress += remaining > 0 ? step : -step;
        this.applyRoomCanvasZoom();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::applyRoomCanvasZoom()
    private applyRoomCanvasZoom(): void
    {
        if(this._roomCanvas == null || this._canvasDisplayObject == null) return;

        this.updateRoomCanvasClipRect();

        const scale = 1 + (2 - 1) * this._previewZoomAnimationProgress;
        const offsetY = ProductViewCatalogWidget.PREVIEW_ZOOM_IN_CAMERA_OFFSET_Y * this._previewZoomAnimationProgress;

        this._canvasDisplayObject.scale.x = scale;
        this._canvasDisplayObject.scale.y = scale;
        this._canvasDisplayObject.x = -(this._roomCanvas.width * scale - this._roomCanvas.width) / 2;
        this._canvasDisplayObject.y = -(this._roomCanvas.height * scale - this._roomCanvas.height) / 2 - offsetY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::normalizeAvatarDirection()
    private normalizeAvatarDirection(direction: number): number
    {
        let result = direction % 8;

        if(result < 0) result += 8;

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::isDiagonalAvatarDirection()
    private isDiagonalAvatarDirection(direction: number): boolean
    {
        return this.normalizeAvatarDirection(direction) % 2 !== 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::isValidLayingDirection()
    private isValidLayingDirection(direction: number): boolean
    {
        const normalized = this.normalizeAvatarDirection(direction);

        return normalized === 0 || normalized === 2;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::ninjaEffectBundled()
    private static ninjaEffectBundled(event: SelectProductEvent): boolean
    {
        const products = event.offer.productContainer.products;

        if(products.length !== 2) return false;

        for(const product of products)
        {
            if(product.productType === 'e' && product.productClassId === 108) return true;
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct()
    private onPreviewProduct = (event: SelectProductEvent): void =>
    {
        if(event == null) return;

        this._lastSelectEvent = event;

        const offer = event.offer;

        this._offer = offer;

        if(this._bundleGrid != null)
        {
            this._bundleGrid.visible = false;
            this._bundleGrid.destroyGridItems();
        }

        this._productName!.caption = offer.localizationName;
        this._productDescription!.caption = offer.localizationDescription;
        this._productDescription!.y = this._productName!.y + this._productName!.height;

        const catalog = this._catalog!;

        if(catalog.multiplePurchaseEnabled && offer.bundlePurchaseAllowed && this._totalPriceWidgetInitialized)
        {
            this.setSpinnerToBundleRuleset();
            this.setBundleInfoWidgetToOffer(offer);
            this._useBundleSpinner = false;
        }
        else
        {
            this.events.emit(CatalogWidgetSpinnerEvent.HIDE, new CatalogWidgetSpinnerEvent(CatalogWidgetSpinnerEvent.HIDE));
            this.events.emit(CatalogWidgetBundleDisplayExtraInfoEvent.HIDE, new CatalogWidgetBundleDisplayExtraInfoEvent(CatalogWidgetBundleDisplayExtraInfoEvent.HIDE));
            this._useBundleSpinner = true;
        }

        if(this._useBundleSpinner)
        {
            this._priceBox = catalog.utils.showPriceOnProduct(
                offer, this.window, this._priceBox, this._teaserImage, -6, false, 6,
                this.page.acceptSeasonCurrencyAsCredits, this.page.acceptSeasonCurrencyAsCredits
            );
        }
        else if(this._priceBox != null)
        {
            this.window.removeChild(this._priceBox);
            this._priceBox.dispose();
            this._priceBox = null;
        }

        if(offer.badgeCode != null && offer.badgeCode !== '')
        {
            catalog.utils.showExtraOnProduct(4, offer.badgeCode, this.window, 6, 38, true, false);
        }
        else if(offer.extraChatStyleCode != null && offer.extraChatStyleCode !== '')
        {
            catalog.utils.showExtraOnProduct(9, offer.extraChatStyleCode, this.window, 6, 38, true, false);
        }
        else if(ProductViewCatalogWidget.ninjaEffectBundled(event))
        {
            catalog.utils.showAssetImageAsBadgeOnProduct('catalogue_effects_ninja', this.window, 6, 38, true, false);
        }
        else
        {
            catalog.utils.hideExtraFromProduct(this.window);
        }

        // AS3: var_1030.visible = false; - unconditionally hidden before every preview render;
        // only the (still-unported) default case in renderProductPreview() shows it again.
        if(this._productImageWidgetContainer != null)
        {
            this._productImageWidgetContainer.visible = false;
        }

        // A named picture replaces the whole pricing-model preview, room canvas included, for the
        // handful of offers CatalogProductImages knows about. AS3 leaves its two preview-mode
        // locals at their declared defaults here, so the call below still runs with 0/false.
        let mode = 0;
        let canRotate = false;

        if(CatalogProductImages.hasProductImage(offer.localizationId))
        {
            this.setPreviewFromAsset(CatalogProductImages.PRODUCT_IMAGES[offer.localizationId]);

            if(this._roomCanvasContainer != null) this._roomCanvasContainer.visible = false;
        }
        else
        {
            ({mode, canRotate} = this.renderPreviewForPricingModel(offer));
        }

        this.setPreviewMode(mode, canRotate);

        this.window.invalidate();
    };

    private renderPreviewForPricingModel(offer: IPurchasableOffer): {mode: number; canRotate: boolean}
    {
        switch(offer.pricingModel)
        {
            case 'pricing_model_bundle':
                if(this._bundleGrid != null)
                {
                    this._bundleGrid.visible = true;

                    const container = offer.productContainer as BundleProductContainer;

                    if(this._gridItemLayout != null)
                    {
                        container.populateItemGrid(this._bundleGrid, this._gridItemLayout);
                    }

                    this._bundleGrid.scrollV = 0;
                }

                if(this._roomCanvasContainer != null)
                {
                    this._roomCanvasContainer.visible = false;
                }

                this.setPreviewImage(null);

                return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
            case 'pricing_model_single':
            case 'pricing_model_multi':
            case 'pricing_model_furniture':
                return this.renderProductPreview(offer);
            default:
                log.warn(`Unknown pricing model ${offer.pricingModel}`);

                return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
        }
    }

    private renderProductPreview(offer: IPurchasableOffer): {mode: number; canRotate: boolean}
    {
        const product = offer.product;

        // Any in-flight bot render belongs to the offer that was on screen a moment ago; drop it
        // before this one draws (renderBotPreview() re-arms it for a bot offer).
        this._botPreviewFigure = null;

        if(product == null) return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};

        const roomPreviewer = this._catalog!.roomPreviewer;

        if(this._roomCanvasContainer != null && this._hasRoomCanvas)
        {
            this._roomCanvasContainer.visible = product.productType === 's' || product.productType === 'i' || product.productType === 'e';
        }

        if(roomPreviewer != null && this._roomCanvas != null)
        {
            roomPreviewer.addViewOffset = {x: 0, y: product.isUniqueLimitedItem ? -15 : 0};
            roomPreviewer.disableUpdate = false;
        }

        switch(product.productType)
        {
            case 's':
                return this.renderFurniturePreview(offer, product, roomPreviewer, roomPreviewer != null && this._roomCanvas != null);
            case 'i':
                return this.renderWallItemPreview(offer, product, roomPreviewer);
            case 'r':
                this.renderBotPreview(product);

                break;
            case 'e':
                return this.renderEffectPreview(product, roomPreviewer);
            case 'habbicon':
            {
                let bitmap = HabbiconAssetManager.getPreviewBitmap(parseInt(product.extraParam, 10) || 0, false);

                if(bitmap === null)
                {
                    // Nothing to request — the manager loads once for the client — so subscribe and
                    // show AS3's plain 40x40 0x8F8F8F square until it arrives.
                    HabbiconAssetManager.addEventListener(
                        HabbiconAssetManager.ASSETS_LOADED, this.onHabbiconAssetsLoaded
                    );
                    bitmap = ProductViewCatalogWidget.createHabbiconPlaceholder();
                }

                this.setPreviewImage(bitmap);

                return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
            }
            case 'h':
                break;
            default:
                // AS3: since "s"/"i"/"r"/"e"/"h" are all their own explicit cases above,
                // ProductDisplayWrapper.isSupported() (chat_style or "r") is only ever reachable
                // here for "chat_style" in practice - "r" always takes the case above instead.
                if(ProductDisplayWrapper.isSupported(product.productType)
                    && this._productImageWidgetContainer != null && this._productImageWidget != null)
                {
                    this._productImageWidgetContainer.visible = true;
                    this._productImageWidget.productInfo = new ProductDisplayWrapper(product);
                    break;
                }

                log.warn(`Unknown Product Type: ${product.productType}`);
        }

        return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct()
     * ("r" product-type branch) — a bot offer, whose `extraParam` is the bot's figure string.
     *
     * AS3 renders it inline and synchronously, with no listener: smile gesture, body facing 4, head
     * facing 3, cropped "full". Here the render is kicked off and applied in a continuation, and a
     * listener is passed so a figure whose assets are still downloading gets a second pass —
     * `createAvatarImage()` only calls the listener when it had to load something, so this cannot
     * loop.
     */
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct() ("r" branch)
    /**
	 * Wears the effect on the player's own figure inside the preview room, which is the same thing
	 * `EffectPreviewer` and the avatar editor's `FigureDataView` do — `productClassId` is the
	 * effect id.
	 *
	 * AS3 has a second path below this one, taken only when there is no room canvas: it composites
	 * the effect's sprites onto a flat background filled with `pixelsBackground`'s colour. That is
	 * {@link renderEffectPreviewFallback}, and this is where it is taken from.
	 */
    // AS3 has no `updatePreview()`: the branch lives inside `onPreviewProduct()` (l.473), the
    // `SelectProductEvent` handler, which this port splits into one method per product type.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct() ("e" branch)
    private renderEffectPreview(product: IProduct, roomPreviewer: RoomPreviewer | null): {mode: number; canRotate: boolean}
    {
        const figure = this._catalog?.sessionDataManager?.figure ?? null;

        if(roomPreviewer == null || this._roomCanvas == null || figure == null)
        {
            return this.renderEffectPreviewFallback(product, figure);
        }

        roomPreviewer.addAvatarIntoRoom(figure, product.productClassId);
        this.applyPreviewAvatarDirection(roomPreviewer);
        this.applyPreviewAvatarAction(roomPreviewer);

        return {mode: ProductViewCatalogWidget.PREVIEW_MODE_AVATAR, canRotate: false};
    }

    /**
     * The "e" preview with no room to put an avatar in: the player wearing the effect, composited
     * flat onto the `pixelsBackground` colour.
     *
     * Three draws in AS3's order, and the order is the whole of it — the effect's sprites are split
     * by their z offset, so the ones *behind* the avatar go down first, then the avatar itself,
     * then the ones in front. Doing it in one pass would put a jetpack's exhaust over the figure.
     *
     * The avatar is animated forward two frames before being read: `updateAnimationByFrames(1)`
     * twice, as AS3 does. One is not enough — an effect's first frame is usually its rest pose.
     *
     * DEVIATION: Flash composites this into a `BitmapData`. There is none in the engine — the shim
     *   under `onBoardingHcUi/display/` belongs to the client, which the engine may not import
     *   (`.claude/rules/20-architecture.md` #3) — so it composites into an `OffscreenCanvas` and
     *   hands the result over as an `ImageBitmap`, the same way `HabbiconBubble` does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct() ("e" branch, no-canvas path)
    private renderEffectPreviewFallback(product: IProduct, figure: string | null): {mode: number; canRotate: boolean}
    {
        const teaser = this._teaserImage;
        const renderManager = this._catalog?.avatarRenderManager ?? null;

        if(teaser === null || renderManager === null || figure === null)
        {
            this.setPreviewImage(null);

            return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
        }

        // AS3 makes the background window visible and reads its colour, falling back to its own
        // literal when the layout has no such window.
        const background = this.window.findChildByName('pixelsBackground');
        let backgroundColor = ProductViewCatalogWidget.EFFECT_PREVIEW_BACKGROUND_COLOR;

        if(background !== null)
        {
            background.visible = true;
            backgroundColor = background.color;
        }

        const width = Math.max(1, Math.round(teaser.width));
        const height = Math.max(1, Math.round(teaser.height));
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null)
        {
            this.setPreviewImage(null);

            return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
        }

        // Opaque: AS3 builds the BitmapData with `transparent = false`.
        context.fillStyle = `#${(backgroundColor & 0xFFFFFF).toString(16).padStart(6, '0')}`;
        context.fillRect(0, 0, width, height);

        const avatar = renderManager.createAvatarImage(figure, 'h', null, null, null);

        if(avatar !== null)
        {
            avatar.setDirection('head', ProductViewCatalogWidget.PREVIEW_AVATAR_DEFAULT_HEAD_DIRECTION);
            avatar.initActionAppends();
            avatar.appendAction('gest', 'sml');
            avatar.appendAction('fx', product.productClassId);
            avatar.endActionAppends();
            avatar.updateAnimationByFrames(1);
            avatar.updateAnimationByFrames(1);

            const image = avatar.getImage('full', true);

            if(image !== null)
            {
                // Where the avatar's own layer sits relative to its sprites — subtracted inside
                // addEffectSprites() so an effect sprite lands on the figure and not on the canvas
                // origin.
                const spriteOrigin = {x: 0, y: 0};

                for(const sprite of avatar.getSprites())
                {
                    if(sprite.id !== 'avatar') continue;

                    const layer = avatar.getLayerData(sprite);

                    if(layer === null) continue;

                    spriteOrigin.x = layer.dx;
                    spriteOrigin.y = layer.dy;
                }

                const centre = {
                    x: (width - image.width) / 2,
                    y: (height - image.height) / 2
                };
                // AS3's `_loc33_ = 64` — the effect grid's own cell, which is where its sprites are
                // authored around, not the avatar's size.
                const cell = ProductViewCatalogWidget.EFFECT_SPRITE_CELL;
                const effectOffset = {
                    x: centre.x + (image.width - cell) / 2,
                    y: centre.y + image.height - cell / 4
                };

                this.addEffectSprites(context, avatar, spriteOrigin, effectOffset, false);
                this.drawTexture(context, image, centre.x, centre.y);
                this.addEffectSprites(context, avatar, spriteOrigin, effectOffset, true);
            }

            avatar.dispose();
        }

        this.setPreviewImage(canvas.transferToImageBitmap());

        // AS3 never assigns a mode on this path: the composited picture goes straight into the
        // teaser image, and the mode stays whatever it was — 0, so no preview control is shown.
        return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
    }

    /**
     * Draws one half of the effect's sprites — the half behind the avatar, or the half in front.
     *
     * `front` selects on the sprite's own z direction offset: negative is behind. Each sprite's
     * asset name is rebuilt from scale, member, direction and animation frame, which is how the
     * effect's own animation state reaches the picture.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::addEffectSprites()
    private addEffectSprites(
        context: OffscreenCanvasRenderingContext2D,
        avatar: IAvatarImage,
        spriteOrigin: {x: number; y: number},
        offset: {x: number; y: number},
        front: boolean = true
    ): void
    {
        const direction = avatar.getDirection();

        for(const sprite of avatar.getSprites())
        {
            const layer = avatar.getLayerData(sprite);
            const offsetZ = sprite.getDirectionOffsetZ(direction);

            // Behind and in front are drawn by two separate calls, so each skips the other's half.
            if(front ? offsetZ < 0 : offsetZ >= 0) continue;

            let offsetX = sprite.getDirectionOffsetX(direction);
            let offsetY = sprite.getDirectionOffsetY(direction);
            let frame = 0;
            let spriteDirection = sprite.hasDirections ? direction : 0;

            if(layer !== null)
            {
                frame = layer.animationFrame;
                offsetX += layer.dx;
                offsetY += layer.dy;
                // `dd` is what the 2016 interface calls the 2026 one's `directionOffset`; the port
                // took the older name and they are the same member.
                spriteDirection += layer.directionOffset;
            }

            if(spriteDirection < 0) spriteDirection += 8;
            if(spriteDirection > 7) spriteDirection -= 8;

            const asset = avatar.getAsset(`${avatar.getScale()}_${sprite.member}_${spriteDirection}_${frame}`);

            if(asset === null || asset.texture === null) continue;

            const x = offset.x - asset.offsetX + offsetX - spriteOrigin.x;
            const y = offset.y - asset.offsetY + offsetY - spriteOrigin.y;

            // Ink 33 is Flash's ADD blend, which is what makes a glow read as light rather than as
            // paint. `lighter` is the Canvas2D operation with the same arithmetic.
            const additive = sprite.ink === ProductViewCatalogWidget.SPRITE_INK_ADD;

            if(additive) context.globalCompositeOperation = 'lighter';

            this.drawTexture(context, asset.texture, x, y);

            if(additive) context.globalCompositeOperation = 'source-over';
        }
    }

    /**
     * Blits one PixiJS texture into a 2D context at its own frame.
     *
     * Only the texture's frame is drawn: these come off atlas pages, and drawing the whole source
     * would paint every sibling sprite with it.
     */
    // TS-only: Flash's `copyPixels`/`draw` take a BitmapData; a GPU texture has to be drawn from
    //   its source resource instead.
    private drawTexture(context: OffscreenCanvasRenderingContext2D, texture: Texture, x: number, y: number): void
    {
        const source = (texture.source?.resource ?? null) as CanvasImageSource | null;

        if(source === null) return;

        const frame = texture.frame;

        context.drawImage(
            source,
            frame.x, frame.y, frame.width, frame.height,
            x, y, frame.width, frame.height
        );
    }

    /**
	 * Re-runs the whole preview for the offer still on screen. The habbicon branch is the only
	 * caller: it is the one product type whose picture can arrive after the offer was selected.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onHabbiconAssetsLoaded()
    private onHabbiconAssetsLoaded = (): void =>
    {
        HabbiconAssetManager.removeEventListener(HabbiconAssetManager.ASSETS_LOADED, this.onHabbiconAssetsLoaded);

        if(this.disposed || this._lastSelectEvent === null) return;

        this.onPreviewProduct(this._lastSelectEvent);
    };

    // TS-only: Flash fills a BitmapData in its constructor; this port needs a canvas.
    private static createHabbiconPlaceholder(): ImageBitmap | null
    {
        const canvas = new OffscreenCanvas(40, 40);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.fillStyle = '#8f8f8f';
        context.fillRect(0, 0, 40, 40);

        return canvas.transferToImageBitmap();
    }

    private renderBotPreview(product: IProduct): void
    {
        const manager = this._catalog?.avatarRenderManager ?? null;

        if(manager == null)
        {
            this.setPreviewImage(null);

            return;
        }

        const figure = product.extraParam;

        this._botPreviewFigure = figure;

        void this.drawBotPreview(figure, {
            avatarImageReady: (_ready: string): void =>
            {
                // The redraw uses the figure of the offer still on screen, NOT the one reported
                // ready: `createAvatarImage()` validates the container against the gender, so what
                // comes back is the completed figure string and never equals the one asked for.
                // Matching on it would mean never repainting. Null means the player clicked away.
                const current = this._botPreviewFigure;

                if(current !== null) void this.drawBotPreview(current, null);
            }
        });
    }

    // TS-only: the async continuation of renderBotPreview() above; AS3 renders inline.
    private async drawBotPreview(figure: string, listener: IAvatarImageListener | null): Promise<void>
    {
        const avatarImage = this._catalog?.avatarRenderManager?.createAvatarImage(figure, 'h', null, listener, null) ?? null;

        if(avatarImage == null)
        {
            this.setPreviewImage(null);

            return;
        }

        avatarImage.appendAction(AvatarAction.GESTURE, AvatarAction.GESTURE_SMILE);
        avatarImage.setDirection('full', 4);
        avatarImage.setDirection('head', 3);

        const bitmap = await avatarImageToBitmap(avatarImage, 'full');

        avatarImage.dispose();

        if(this._botPreviewFigure !== figure) return;

        this.setPreviewImage(bitmap);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct()
    // ("s" product-type branch)
    private renderFurniturePreview(offer: IPurchasableOffer, product: IProduct, roomPreviewer: RoomPreviewer | null, hasRoomCanvas: boolean): {mode: number; canRotate: boolean}
    {
        if(!hasRoomCanvas || roomPreviewer == null)
        {
            const roomEngine = this.page?.viewer?.roomEngine;

            if(roomEngine != null)
            {
                const result = roomEngine.getFurnitureImage(
                    product.productClassId, new Vector3d(90, 0, 0), 64, this, 0, product.extraParam, -1, -1, this._overrideStuffData);

                offer.previewCallbackId = result.id;
            }

            return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
        }

        const furnitureData = product.furnitureData;

        if(furnitureData != null && furnitureData.category === 23)
        {
            const catalog = this._catalog!;
            const floorItemData = catalog.sessionDataManager?.getFloorItemData(furnitureData.id) ?? null;
            const avatarRenderer = catalog.avatarRenderManager;
            const sessionDataManager = catalog.sessionDataManager;

            if(floorItemData != null && avatarRenderer != null && sessionDataManager != null)
            {
                const figureSetIds = (floorItemData.customParams ?? '')
                    .split(',')
                    .map((value) => parseInt(value, 10))
                    .filter((id) => !Number.isNaN(id) && avatarRenderer.isValidFigureSetForGender(id, sessionDataManager.gender));

                const figure = avatarRenderer.getFigureStringWithFigureIds(sessionDataManager.figure, sessionDataManager.gender, figureSetIds);

                roomPreviewer.addAvatarIntoRoom(figure);
                this.applyPreviewAvatarDirection(roomPreviewer);
                this.applyPreviewAvatarAction(roomPreviewer);
            }

            return {mode: ProductViewCatalogWidget.PREVIEW_MODE_AVATAR, canRotate: false};
        }

        roomPreviewer.addFurnitureIntoRoom(product.productClassId, new Vector3d(90, 0, 0), this._overrideStuffData, product.extraParam);

        return {mode: ProductViewCatalogWidget.PREVIEW_MODE_FLOOR_FURNITURE, canRotate: roomPreviewer.canRotatePreviewFurniture()};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onPreviewProduct()
    // ("i" product-type branch)
    private renderWallItemPreview(offer: IPurchasableOffer, product: IProduct, roomPreviewer: RoomPreviewer | null): {mode: number; canRotate: boolean}
    {
        const furnitureData = product.furnitureData;

        // Wallpaper (2), floor (3) and landscape (4) are not placed *into* the preview room —
        // they re-skin it. So the branch reads the player's current room decoration, swaps in the
        // one being previewed, and leaves the other two alone.
        if(furnitureData != null && (furnitureData.category === 2 || furnitureData.category === 3 || furnitureData.category === 4))
        {
            const roomEngine = this._catalog?.roomEngine ?? null;

            if(roomEngine == null || roomPreviewer == null)
            {
                return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
            }

            const activeRoomId = roomEngine.activeRoomId;

            // The fallbacks are AS3's, and they are not neutral values: a player who has never
            // decorated gets wall 101 / floor 101 / landscape 1.1 so the preview still renders
            // something rather than an untextured room.
            const currentWall = roomEngine.getRoomStringValue(activeRoomId, RoomObjectVariableEnum.ROOM_WALL_TYPE) || '101';
            const currentFloor = roomEngine.getRoomStringValue(activeRoomId, RoomObjectVariableEnum.ROOM_FLOOR_TYPE) || '101';
            const currentLandscape = roomEngine.getRoomStringValue(activeRoomId, RoomObjectVariableEnum.ROOM_LANDSCAPE_TYPE) || '1.1';

            roomPreviewer.updateRoomWallsAndFloorVisibility(true, true);

            roomPreviewer.updateObjectRoom(
                furnitureData.category === 3 ? product.extraParam : currentFloor,
                furnitureData.category === 2 ? product.extraParam : currentWall,
                furnitureData.category === 4 ? product.extraParam : currentLandscape
            );

            // A landscape needs something to be seen *through*: AS3 drops a specific window into
            // the preview room, otherwise the new scenery is hidden behind a solid wall.
            if(furnitureData.category === 4)
            {
                const window = this._catalog?.getFurnitureDataByName('ads_twi_windw', 'i') ?? null;

                if(window != null)
                {
                    roomPreviewer.addWallItemIntoRoom(window.id, new Vector3d(90, 0, 0), window.customParams ?? '');
                }
            }

            return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
        }

        if(roomPreviewer != null && this._roomCanvas != null)
        {
            roomPreviewer.addWallItemIntoRoom(product.productClassId, new Vector3d(90, 0, 0), product.extraParam);

            return {
                mode: roomPreviewer.canRotatePreviewWallItem() ? ProductViewCatalogWidget.PREVIEW_MODE_WALL_ITEM : ProductViewCatalogWidget.PREVIEW_MODE_NONE,
                canRotate: false,
            };
        }

        const roomEngine = this.page?.viewer?.roomEngine;

        if(roomEngine != null)
        {
            const result = roomEngine.getWallItemImage(product.productClassId, new Vector3d(90, 0, 0), 64, this, 0, product.extraParam);

            offer.previewCallbackId = result.id;
        }

        return {mode: ProductViewCatalogWidget.PREVIEW_MODE_NONE, canRotate: false};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::setBundleInfoWidgetToOffer()
    private setBundleInfoWidgetToOffer(offer: IPurchasableOffer): void
    {
        const data = new ExtraInfoItemData(ExtraInfoItemData.TYPE_BONUS_BADGE);

        data.activityPointType = offer.activityPointType;
        data.priceActivityPoints = offer.priceInActivityPoints;
        data.priceCredits = offer.priceInCredits;
        data.priceSilver = offer.priceInSilver;
        data.badgeCode = offer.badgeCode;
        this.events.emit(CatalogWidgetBundleDisplayExtraInfoEvent.RESET, new CatalogWidgetBundleDisplayExtraInfoEvent(CatalogWidgetBundleDisplayExtraInfoEvent.RESET, data));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::setSpinnerToBundleRuleset()
    private setSpinnerToBundleRuleset(): void
    {
        const catalog = this._catalog!;

        if(catalog.bundleDiscountEnabled)
        {
            this.events.emit(CatalogWidgetSpinnerEvent.RESET, new CatalogWidgetSpinnerEvent(CatalogWidgetSpinnerEvent.RESET, 1, catalog.utils.bundleDiscountFlatPriceSteps));
        }
        else
        {
            this.events.emit(CatalogWidgetSpinnerEvent.RESET, new CatalogWidgetSpinnerEvent(CatalogWidgetSpinnerEvent.RESET, 1));
        }

        this.events.emit(CatalogWidgetSpinnerEvent.SHOW, new CatalogWidgetSpinnerEvent(CatalogWidgetSpinnerEvent.SHOW));

        const ruleset = catalog.bundleDiscountRuleset;

        if(ruleset != null)
        {
            this.events.emit(CatalogWidgetSpinnerEvent.SET_MAX, new CatalogWidgetSpinnerEvent(CatalogWidgetSpinnerEvent.SET_MAX, ruleset.maxPurchaseSize));
        }

        this.events.emit(CatalogWidgetSpinnerEvent.SET_MIN, new CatalogWidgetSpinnerEvent(CatalogWidgetSpinnerEvent.SET_MIN, 1));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::imageReady()
    // Reached from the no-room-canvas fallback in renderFurniturePreview()/renderWallItemPreview()
    // (Phase 5, getFurnitureImage()/getWallItemImage()).
    imageReady(id: number, data: ImageBitmap | null): void
    {
        if(this.disposed || this.page == null || this.page.offers == null) return;

        for(const offer of this.page.offers)
        {
            if(offer.previewCallbackId === id)
            {
                this.setPreviewImage(data);
                offer.previewCallbackId = 0;

                break;
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::imageFailed()
    imageFailed(_id: number): void
    {
    }

    /**
     * Shows a named gallery image as the preview, downloading it first if the library has not got
     * it yet — AS3's `retrievePreviewAsset()` is the same one-shot fetch `setImageFromAsset()`
     * already wraps, so the re-entry after the download does the actual drawing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::setPreviewFromAsset()
    private setPreviewFromAsset(assetName: string): void
    {
        const catalog = this._catalog;

        if(!assetName || catalog == null) return;

        const asset = catalog.assets?.getAssetByName(assetName) ?? null;

        if(asset == null)
        {
            // AS3: retrievePreviewAsset() - no target, the callback re-enters once it lands.
            catalog.setImageFromAsset(null, assetName, () =>
            {
                if(!this.disposed) this.setPreviewFromAsset(assetName);
            });

            return;
        }

        this.setPreviewImage(AssetBitmap.resolveSync(asset.content));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::setPreviewImage()
    private setPreviewImage(image: ImageBitmap | null): void
    {
        if(this._teaserImage != null && !this.window.disposed)
        {
            this._teaserImage.bitmap = image;
            this._teaserImage.x = this._previewOffset.x;
            this._teaserImage.y = this._previewOffset.y;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onStuffDataSet()
    private onStuffDataSet = (event: SetRoomPreviewerStuffDataEvent): void =>
    {
        this._overrideStuffData = event.stuffData;

        if(this._lastSelectEvent != null)
        {
            this._catalog!.roomPreviewer?.reset(false);
            this.onPreviewProduct(this._lastSelectEvent);
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onSpinnerEvent()
    private onSpinnerEvent = (event: CatalogWidgetSpinnerEvent): void =>
    {
        if(event.type === CatalogWidgetSpinnerEvent.VALUE_CHANGED)
        {
            const priceBoxNew = this.window.findChildByName('price_box_new') as unknown as IWindowContainer | null;

            if(priceBoxNew != null && this._lastSelectEvent != null)
            {
                this._catalog!.utils.showPriceInContainer(priceBoxNew, this._lastSelectEvent.offer);
            }
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onTotalPriceWidgetInitialized()
    private onTotalPriceWidgetInitialized = (_event: CatalogWidgetEvent): void =>
    {
        this._totalPriceWidgetInitialized = true;
    };

    override closed(): void
    {
        const roomPreviewer = this._catalog!.roomPreviewer;

        if(roomPreviewer != null)
        {
            roomPreviewer.disableUpdate = true;
        }

        this.setPreviewMode(ProductViewCatalogWidget.PREVIEW_MODE_NONE);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/ProductViewCatalogWidget.as::onDragAndDropDone()
    onDragAndDropDone(_success: boolean, _extraParam: string): void
    {
    }
}
