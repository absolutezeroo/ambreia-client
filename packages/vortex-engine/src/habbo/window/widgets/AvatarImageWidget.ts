import type {Texture} from 'pixi.js';
import type {IAvatarImageWidget} from '@ambreia/ui/kit/widgets/IAvatarImageWidget';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IBitmapWrapperWindow} from '@ambreia/ui/components/IBitmapWrapperWindow';
import type {IAssetReceiver} from '@ambreia/ui/IAssetReceiver';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import {AvatarRenderEvent} from '@ambreia/avatar/enum/AvatarRenderEvent';
import {Logger} from '@ambreia/common/utils/Logger';
import {
    GetExtendedProfileMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

const log = Logger.getLogger('habbo.window.widgets.AvatarImageWidget');

/**
 * Avatar image rendering widget.
 *
 * Renders an avatar figure with configurable direction, scale, cropping,
 * and head-only mode. Clicking the avatar opens the extended profile if
 * a userId is set.
 *
 * Uses the IAvatarRenderManager to create avatar images and renders them
 * to a bitmap wrapper window. Implements IAvatarImageListener to get
 * notified when asynchronous avatar downloads complete.
 *
 * @see sources/win63_version/habbo/window/widgets/AvatarImageWidget.as
 */
export class AvatarImageWidget implements IAvatarImageWidget, IAvatarImageListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::TYPE
    public static readonly TYPE: string = 'avatar_image';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::FIGURE_KEY
    private static readonly FIGURE_KEY: string = 'avatar_image:figure';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::SCALE_KEY
    private static readonly SCALE_KEY: string = 'avatar_image:scale';
    // Derived name: `ONLY_HEAD_KEY` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/widgets/AvatarImageWidget.as::ONLY_HEAD_KEY
    private static readonly ONLY_HEAD_KEY: string = 'avatar_image:only_head';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::CROPPED_KEY
    private static readonly CROPPED_KEY: string = 'avatar_image:cropped';
    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/win63_version/habbo/window/widgets/AvatarImageWidget.as::DIRECTION_KEY
    private static readonly DIRECTION_KEY: string = 'avatar_image:direction';
    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::ZOOM_X_KEY
    private static readonly ZOOM_X_KEY: string = 'avatar_image:zoomX';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::ZOOM_Y_KEY
    private static readonly ZOOM_Y_KEY: string = 'avatar_image:zoomY';

    // Derived name: `DIRECTIONS` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/widgets/AvatarImageWidget.as::DIRECTIONS
    private static readonly DIRECTIONS: string[] = [
        'northeast', 'east', 'southeast', 'south',
        'southwest', 'west', 'northwest', 'north'
    ];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::FIGURE_DEFAULT (PropertyStruct in AS3)
    private static readonly FIGURE_DEFAULT: string = 'hd-180-1.ch-210-66.lg-270-82.sh-290-81';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::SCALE_DEFAULT
    private static readonly SCALE_DEFAULT: string = 'h';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::ONLY_HEAD_DEFAULT
    private static readonly ONLY_HEAD_DEFAULT: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::CROPPED_DEFAULT
    private static readonly CROPPED_DEFAULT: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::DIRECTION_DEFAULT
    private static readonly DIRECTION_DEFAULT: number = 2;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::ZOOM_X_DEFAULT (PropertyStruct in AS3, flattened to its value here like the five above)
    private static readonly ZOOM_X_DEFAULT: number = 1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::ZOOM_Y_DEFAULT (PropertyStruct in AS3, flattened to its value here like the five above)
    private static readonly ZOOM_Y_DEFAULT: number = 1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_widgetWindow
    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_root
    private _root: IWindowContainer | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_bitmap
    private _bitmap: IBitmapWrapperWindow | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_region
    private _region: IWindow | null = null;
    // TS-only: bound event handler refs for removeEventListener - AS3's
    // addEventListener/removeEventListener take the listener function itself,
    // no separate bound reference needed.
    private _onClickBound: (event: WindowMouseEvent) => void;
    // TS-only: see _onClickBound above.
    private _onAvatarRendererReadyBound: () => void;
    private _avatarRendererReadyRegistered: boolean = false;
    private _placeholderRequestId: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::AvatarImageWidget()
    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;
        this._onClickBound = this.onClick.bind(this);
        this._onAvatarRendererReadyBound = this.onAvatarRendererReady.bind(this);

        // AS3 resolves "avatar_image_xml" against _windowManager.assets, i.e. the
        // HabboWindowManager component's own library. HabboFriendBar declares a different
        // asset under the same name, so the component qualifies it here.
        const root = this._windowManager.buildWidgetLayout('HabboWindowManager_avatar_image_xml') as IWindowContainer;

        if(root)
        {
            this._root = root;
            this._bitmap = root.findChildByName('bitmap') as IBitmapWrapperWindow | null;
            this._region = root.findChildByName('region');

            if(this._region)
            {
                this._region.addEventListener(WindowMouseEvent.CLICK, this._onClickBound);
            }

            this.refresh();

            this._widgetWindow.rootWindow = root;
            root.width = this._widgetWindow.width;
            root.height = this._widgetWindow.height;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_figure
    private _figure: string = AvatarImageWidget.FIGURE_DEFAULT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get figure()
    public get figure(): string
    {
        return this._figure;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set figure()
    public set figure(value: string)
    {
        if(value !== this._figure)
        {
            this._figureEmpty = !value || value.length === 0;
            this._figure = AvatarImageWidget.cleanupAvatarString(value);
            this.refresh();
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_scale
    private _scale: string = AvatarImageWidget.SCALE_DEFAULT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get scale()
    public get scale(): string
    {
        return this._scale;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set scale()
    public set scale(value: string)
    {
        if(value !== this._scale)
        {
            this._scale = value;
            this.refresh();
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_onlyHead
    private _onlyHead: boolean = AvatarImageWidget.ONLY_HEAD_DEFAULT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get onlyHead()
    public get onlyHead(): boolean
    {
        return this._onlyHead;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set onlyHead()
    public set onlyHead(value: boolean)
    {
        if(value !== this._onlyHead)
        {
            this._onlyHead = value;
            this.refresh();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_cropped
    private _cropped: boolean = AvatarImageWidget.CROPPED_DEFAULT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get cropped()
    public get cropped(): boolean
    {
        return this._cropped;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set cropped()
    public set cropped(value: boolean)
    {
        if(value !== this._cropped)
        {
            this._cropped = value;
            this.refresh();
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_direction
    private _direction: number = AvatarImageWidget.DIRECTION_DEFAULT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get direction()
    public get direction(): number
    {
        return this._direction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set direction()
    public set direction(value: number)
    {
        if(value !== this._direction)
        {
            this._direction = value;
            this.refresh();
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_userId
    private _userId: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get userId()
    public get userId(): number
    {
        return this._userId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set userId()
    public set userId(value: number)
    {
        if(this._userId !== value)
        {
            this._userId = value;

            if(this._region)
            {
                this._region.visible = (this._userId > 0);
            }
        }
    }

    // AS3: sources/win63_version/habbo/window/widgets/AvatarImageWidget.as::_figureEmpty
    private _figureEmpty: boolean = false;

    // Derived name: `figureEmpty` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/window/widgets/AvatarImageWidget.as::get figureEmpty()
    public get figureEmpty(): boolean
    {
        return this._figureEmpty;
    }

    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_zoomX
    private _zoomX: number = AvatarImageWidget.ZOOM_X_DEFAULT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get zoomX()
    public get zoomX(): number
    {
        return this._zoomX;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set zoomX()
    public set zoomX(value: number)
    {
        if(value !== this._zoomX)
        {
            this._zoomX = value;
            this.refresh();
        }
    }

    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::_zoomY
    private _zoomY: number = AvatarImageWidget.ZOOM_Y_DEFAULT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get zoomY()
    public get zoomY(): number
    {
        return this._zoomY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set zoomY()
    public set zoomY(value: number)
    {
        if(value !== this._zoomY)
        {
            this._zoomY = value;
            this.refresh();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(AvatarImageWidget.FIGURE_KEY, this._figure),
            new PropertyStruct(AvatarImageWidget.SCALE_KEY, this._scale),
            new PropertyStruct(AvatarImageWidget.ONLY_HEAD_KEY, this._onlyHead),
            new PropertyStruct(AvatarImageWidget.CROPPED_KEY, this._cropped),
            new PropertyStruct(AvatarImageWidget.DIRECTION_KEY, AvatarImageWidget.DIRECTIONS[this._direction]),
            new PropertyStruct(AvatarImageWidget.ZOOM_X_KEY, this._zoomX, PropertyStruct.NUMBER),
            new PropertyStruct(AvatarImageWidget.ZOOM_Y_KEY, this._zoomY, PropertyStruct.NUMBER),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        for(const prop of values)
        {
            switch(prop.key)
            {
                case AvatarImageWidget.FIGURE_KEY:
                    this.figure = String(prop.value);
                    break;
                case AvatarImageWidget.SCALE_KEY:
                    this.scale = String(prop.value);
                    break;
                case AvatarImageWidget.ONLY_HEAD_KEY:
                    this.onlyHead = Boolean(prop.value);
                    break;
                case AvatarImageWidget.CROPPED_KEY:
                    this.cropped = Boolean(prop.value);
                    break;
                case AvatarImageWidget.DIRECTION_KEY:
                    this.direction = AvatarImageWidget.DIRECTIONS.indexOf(String(prop.value));
                    break;
                case AvatarImageWidget.ZOOM_X_KEY:
                    this.zoomX = Number(prop.value);
                    break;
                case AvatarImageWidget.ZOOM_Y_KEY:
                    this.zoomY = Number(prop.value);
                    break;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::cleanupAvatarString()
    private static cleanupAvatarString(figure: string | null): string
    {
        if(!figure || figure.length === 0)
        {
            return AvatarImageWidget.FIGURE_DEFAULT;
        }

        return figure.replace(/NaN/g, '');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::avatarImageReady()
    public avatarImageReady(figureString: string): void
    {
        if(AvatarImageWidget.cleanupAvatarString(figureString) === this._figure)
        {
            this.refresh();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._avatarRendererReadyRegistered && this._windowManager?.avatarRenderer)
        {
            this._windowManager.avatarRenderer.events.off(AvatarRenderEvent.AVATAR_RENDER_READY, this._onAvatarRendererReadyBound);
            this._avatarRendererReadyRegistered = false;
        }

        this._placeholderRequestId++;

        if(this._region)
        {
            this._region.removeEventListener(WindowMouseEvent.CLICK, this._onClickBound);
            this._region.dispose();
            this._region = null;
        }

        this._bitmap = null;

        if(this._root)
        {
            this._root.dispose();
            this._root = null;
        }

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
            this._widgetWindow = null;
        }

        this._windowManager = null;
        this._disposed = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::refresh()
    // TS deviation: AS3's BitmapData render is synchronous end-to-end. AvatarImage.getCroppedImage()/
    // getImage() return a PixiJS Texture here, not a real ImageBitmap - a bare `as ImageBitmap` cast
    // compiled fine but crashed at runtime the moment anything called a real ImageBitmap method on it
    // (e.g. IBitmapWrapperWindow.bitmap's setter calling .close() on the previous value). Converting a
    // Texture to an ImageBitmap requires the browser's async createImageBitmap(), so the actual bitmap
    // assignment + placeholder/invalidate/resize tail now happens in a promise continuation instead of
    // inline - same pattern already used by ProductGridItem.renderAvatarImage().
    private refresh(): void
    {
        if(!this._bitmap || !this._windowManager) return;

        this._placeholderRequestId++;
        this._bitmap.bitmap = null;

        const avatarRenderer = this._windowManager.avatarRenderer;

        if(avatarRenderer)
        {
            if(!avatarRenderer.isReady)
            {
                if(!this._avatarRendererReadyRegistered)
                {
                    avatarRenderer.events.on(AvatarRenderEvent.AVATAR_RENDER_READY, this._onAvatarRendererReadyBound);
                    this._avatarRendererReadyRegistered = true;
                }
            }
            else
            {
                const scaleFactor = this._scale === 'h' ? 1 : 0.5;
                const setType = this._onlyHead ? 'head' : 'full';

                const avatarImage = avatarRenderer.createAvatarImage(
                    this._figure,
                    'h',
                    '',
                    this,
                    null
                );

                if(avatarImage)
                {
                    avatarImage.setDirection(setType, this._direction);

                    const texture = this._cropped
                        ? avatarImage.getCroppedImage(setType, scaleFactor) as Texture | null
                        : avatarImage.getImage(setType, true, scaleFactor) as Texture | null;

                    avatarImage.dispose();

                    AvatarImageWidget.textureToImageBitmap(texture).then((bitmap) =>
                    {
                        if(this._disposed || !this._bitmap) return;

                        if(bitmap && this._figureEmpty)
                        {
                            const greyscaleBitmap = AvatarImageWidget.createGreyscaleBitmap(bitmap);

                            if(greyscaleBitmap)
                            {
                                bitmap.close();
                                bitmap = greyscaleBitmap;
                            }
                        }

                        this._bitmap.disposesBitmap = true;
                        this._bitmap.bitmap = bitmap;
                        this.applyBitmapResultTail();
                    });

                    return;
                }
            }
        }

        this.applyBitmapResultTail();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::refresh() (tail)
    private applyBitmapResultTail(): void
    {
        if(!this._bitmap) return;

        if(!this._bitmap.bitmap || this._bitmap.bitmap.width < 2)
        {
            this.requestPlaceholder();
        }

        if(this._zoomX !== 1 || this._zoomY !== 1)
        {
            const zoomed = AvatarImageWidget.zoomBitmapData(this._bitmap.bitmap, this._zoomX, this._zoomY);

            if(zoomed)
            {
                this._bitmap.bitmap = zoomed;
                this._bitmap.disposesBitmap = true;
            }
        }

        this._bitmap.invalidate();

        if(this._bitmap.bitmap && this._widgetWindow)
        {
            this._widgetWindow.width = this._bitmap.bitmap.width;
            this._widgetWindow.height = this._bitmap.bitmap.height;
        }
    }

    /**
	 * Scales a bitmap by the widget's zoom factors, the way AS3 redraws it through a
	 * scaled Matrix. `OffscreenCanvas.transferToImageBitmap()` keeps the call synchronous,
	 * which `refresh()` needs — `createImageBitmap()` would not.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::zoomBitmapData()
    private static zoomBitmapData(bitmap: ImageBitmap | null, zoomX: number, zoomY: number): ImageBitmap | null
    {
        if(bitmap === null) return null;

        const width = Math.max(1, Math.floor(bitmap.width * zoomX));
        const height = Math.max(1, Math.floor(bitmap.height * zoomY));
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.drawImage(bitmap, 0, 0, width, height);

        return canvas.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::onAvatarRendererReady()
    private onAvatarRendererReady(): void
    {
        const avatarRenderer = this._windowManager?.avatarRenderer;

        if(avatarRenderer)
        {
            avatarRenderer.events.off(AvatarRenderEvent.AVATAR_RENDER_READY, this._onAvatarRendererReadyBound);
        }

        this._avatarRendererReadyRegistered = false;
        this.refresh();
    }

    // TS-only: loads placeholder avatar bitmap while real figure is unavailable
    private requestPlaceholder(): void
    {
        if(!this._bitmap || !this._windowManager?.resourceManager) return;

        // No `_png` suffix: images register under the bare file basename
        // (App.ts::registerImageAssets), so every variant but one missed. The odd one out
        // is why `placeholder_avatar_small_head_cropped_png.png` exists in the bundle —
        // that single combination was made to work by renaming the *file* instead. All
        // eight bare names ship, so the lookup is correct for every combination now.
        const assetUri = 'placeholder_avatar'
			+ (this._scale === 'sh' ? '_small' : '')
			+ (this._onlyHead ? '_head' : '')
			+ (this._cropped ? '_cropped' : '');
        const requestId = this._placeholderRequestId;
        const receiver: IAssetReceiver = {
            get disposed(): boolean
            {
                return false;
            },
            dispose(): void
            {
                // Receiver is request-scoped and does not own resources.
            },
            receiveAsset: (asset: ImageBitmap): void =>
            {
                if(this._disposed || requestId !== this._placeholderRequestId || !this._bitmap || !this._widgetWindow) return;

                const greyscaleBitmap = AvatarImageWidget.createGreyscaleBitmap(asset);

                const appliedBitmap = greyscaleBitmap ?? asset;

                this._bitmap.disposesBitmap = greyscaleBitmap !== null;
                this._bitmap.bitmap = appliedBitmap;
                this._bitmap.invalidate();
                this._widgetWindow.width = appliedBitmap.width;
                this._widgetWindow.height = appliedBitmap.height;
            }
        };

        this._windowManager.resourceManager.retrieveAsset(assetUri, receiver);
    }

    // TS-only: converts a PixiJS Texture (AvatarImage.getCroppedImage()/getImage()'s real return
    // type) into a real ImageBitmap the way IBitmapWrapperWindow.bitmap expects.
    //
    // Reads texture.source.resource directly (the canvas AvatarImage.getImage() just drew the
    // avatar into via Texture.from({resource: offscreenCanvas})) rather than
    // renderer.extract.canvas(), which is for textures that have actually gone through a PixiJS
    // render pass (e.g. RoomEngine.pixiTextureToCanvas()'s loaded-asset icon textures — a
    // genuinely different case where the CPU-side resource can be detached after GPU upload).
    // A freshly-created canvas-backed texture like this one hasn't been rendered by anything yet,
    // so extract.canvas() read back a blank/black square instead of the composited avatar.
    // Matches the working pattern already used by ProductGridItem.renderAvatarImage() for the
    // same AvatarImage.getCroppedImage() texture shape.
    private static textureToImageBitmap(texture: Texture | null): Promise<ImageBitmap | null>
    {
        if(!texture) return Promise.resolve(null);

        const resource = (texture as unknown as { source?: { resource?: CanvasImageSource } }).source?.resource;

        if(!resource) return Promise.resolve(null);

        try
        {
            const frame = texture.frame;

            if(frame.width < 1 || frame.height < 1) return Promise.resolve(null);

            const canvas = document.createElement('canvas');

            canvas.width = frame.width;
            canvas.height = frame.height;

            const ctx = canvas.getContext('2d');

            if(!ctx) return Promise.resolve(null);

            ctx.drawImage(resource, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);

            return createImageBitmap(canvas);
        }
        catch (error)
        {
            log.warn('textureToImageBitmap: failed to convert texture to canvas', error);

            return Promise.resolve(null);
        }
    }

    // TS-only: greyscale conversion via OffscreenCanvas (replaces AS3 ColorTransform)
    private static createGreyscaleBitmap(bitmap: ImageBitmap): ImageBitmap | null
    {
        if(bitmap.width < 1 || bitmap.height < 1 || typeof OffscreenCanvas === 'undefined') return null;

        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d');

        if(!context) return null;

        context.filter = 'grayscale(1)';
        context.drawImage(bitmap, 0, 0);

        return canvas.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/AvatarImageWidget.as::onClick()
    private onClick(_event: WindowMouseEvent): void
    {
        if(this._userId > 0 && this._windowManager)
        {
            const communication = this._windowManager.communication;

            if(communication?.connection)
            {
                communication.connection.send(new GetExtendedProfileMessageComposer(this._userId));
            }
        }
    }
}
