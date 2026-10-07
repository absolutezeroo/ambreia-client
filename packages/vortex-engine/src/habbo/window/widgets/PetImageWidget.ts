import type {IPetImageWidget} from '@ambreia/ui/kit/widgets/IPetImageWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IWindow} from '@ambreia/ui/IWindow';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IAssetReceiver} from '@ambreia/ui/IAssetReceiver';
import type {IBitmapWrapperWindow} from '@ambreia/ui/components/IBitmapWrapperWindow';
import {OrderedMap} from '@ambreia/common/utils/OrderedMap';
import {PetFigureData} from '@ambreia/avatar/pets/PetFigureData';
import {Vector3d} from '@room/utils/Vector3d';

/**
 * Pet image rendering widget.
 *
 * Renders a pet figure with configurable direction, scale, zoom, and
 * shrink-on-overflow behavior.
 *
 * The figure string is parsed by `PetFigureData` and the image comes from the room
 * engine, which answers either with the bitmap in hand (`ImageResult.data`) or with a
 * pending id it will call `imageReady()` back on. Both halves are live here.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as
 */
export class PetImageWidget implements IPetImageWidget, IGetImageListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::TYPE
    public static readonly TYPE: string = 'pet_image';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::FIGURE_KEY
    private static readonly FIGURE_KEY: string = 'pet_image:figure';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::SCALE_KEY
    private static readonly SCALE_KEY: string = 'pet_image:scale';
    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::DIRECTION_KEY
    private static readonly DIRECTION_KEY: string = 'pet_image:direction';
    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::ZOOM_X_KEY
    private static readonly ZOOM_X_KEY: string = 'pet_image:zoomX';
    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::ZOOM_Y_KEY
    private static readonly ZOOM_Y_KEY: string = 'pet_image:zoomY';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::SHRINK_ON_OVERFLOW_KEY
    private static readonly SHRINK_ON_OVERFLOW_KEY: string = 'pet_image:shrink_on_overflow';

    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::DIRECTIONS
    private static readonly DIRECTIONS: string[] = [
        'northeast', 'east', 'southeast', 'south',
        'southwest', 'west', 'northwest', 'north'
    ];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::SCALES
    private static readonly SCALES: number[] = [32, 64];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::FIGURE_DEFAULT
    private static readonly FIGURE_DEFAULT: string = '1 0 ffffff';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _root: IWindowContainer | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::_bitmap
    private _bitmap: IBitmapWrapperWindow | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/PetImageWidget.as::_region
    private _region: IWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::_imageIds
    // Derived name: obfuscated in every tree. Maps a pending room-engine request id to the
    // figure it was made for, so a late `imageReady()` for a figure the widget has since
    // moved off is ignored.
    private _imageIds: OrderedMap<number, string> = new OrderedMap<number, string>();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::_petBitmap
    // Derived name: obfuscated in every tree. The image *before* zoom — `petWidth` and
    // `petHeight` read off it, which is why it is kept rather than the two numbers.
    private _petBitmap: ImageBitmap | null = null;
    // TS-only: request generation, so a placeholder that arrives after the figure changed
    // does not overwrite the pet image that replaced it.
    private _placeholderRequestId: number = 0;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('pet_image_xml') as IWindowContainer;

        if(root)
        {
            this._root = root;
            this._bitmap = root.findChildByName('bitmap') as IBitmapWrapperWindow | null;
            this._region = root.findChildByName('region');

            this.refresh();

            this._widgetWindow.rootWindow = root;
            root.width = this._widgetWindow.width;
            root.height = this._widgetWindow.height;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _figure: string = PetImageWidget.FIGURE_DEFAULT;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get figure()
    public get figure(): string
    {
        return this._figure;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::set figure()
    public set figure(value: string)
    {
        this._figure = PetImageWidget.cleanupAvatarString(value);
        this.refresh();
    }

    private _scale: number = 64;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get scale()
    public get scale(): number
    {
        return this._scale;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::set scale()
    public set scale(value: number)
    {
        this._scale = value;
        this.refresh();
    }

    private _direction: number = 2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get direction()
    public get direction(): number
    {
        return this._direction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::set direction()
    public set direction(value: number)
    {
        this._direction = value;
        this.refresh();
    }

    private _zoomX: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get zoomX()
    public get zoomX(): number
    {
        return this._zoomX;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::set zoomX()
    public set zoomX(value: number)
    {
        this._zoomX = value;
        this.refresh();
    }

    private _zoomY: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get zoomY()
    public get zoomY(): number
    {
        return this._zoomY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::set zoomY()
    public set zoomY(value: number)
    {
        this._zoomY = value;
        this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::_shrinkOnOverflow
    private _shrinkOnOverflow: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get shrinkOnOverflow()
    public get shrinkOnOverflow(): boolean
    {
        return this._shrinkOnOverflow;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::set shrinkOnOverflow()
    public set shrinkOnOverflow(value: boolean)
    {
        this._shrinkOnOverflow = value;
        this.refresh();
    }

    /**
	 * The width of the pet image (before zoom).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get petWidth()
    public get petWidth(): number
    {
        return this._petBitmap?.width ?? 0;
    }

    /**
	 * The height of the pet image (before zoom).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get petHeight()
    public get petHeight(): number
    {
        return this._petBitmap?.height ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(PetImageWidget.FIGURE_KEY, this._figure),
            new PropertyStruct(PetImageWidget.SCALE_KEY, this._scale),
            new PropertyStruct(PetImageWidget.DIRECTION_KEY, PetImageWidget.DIRECTIONS[this._direction]),
            new PropertyStruct(PetImageWidget.ZOOM_X_KEY, this._zoomX),
            new PropertyStruct(PetImageWidget.ZOOM_Y_KEY, this._zoomY),
            new PropertyStruct(PetImageWidget.SHRINK_ON_OVERFLOW_KEY, this._shrinkOnOverflow),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        for(const prop of values)
        {
            switch(prop.key)
            {
                case PetImageWidget.FIGURE_KEY:
                    this.figure = String(prop.value);
                    break;
                case PetImageWidget.SCALE_KEY:
                    this.scale = Number(prop.value);
                    break;
                case PetImageWidget.DIRECTION_KEY:
                    this.direction = PetImageWidget.DIRECTIONS.indexOf(String(prop.value));
                    break;
                case PetImageWidget.ZOOM_X_KEY:
                    this.zoomX = Number(prop.value);
                    break;
                case PetImageWidget.ZOOM_Y_KEY:
                    this.zoomY = Number(prop.value);
                    break;
                case PetImageWidget.SHRINK_ON_OVERFLOW_KEY:
                    this.shrinkOnOverflow = Boolean(prop.value);
                    break;
            }
        }
    }

    /**
	 * Clean up a pet figure string, replacing NaN values.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::cleanupAvatarString()
    private static cleanupAvatarString(figure: string): string
    {
        if(!figure) return PetImageWidget.FIGURE_DEFAULT;

        return figure.replace(/NaN/g, '');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._region)
        {
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

    /**
	 * Called back by the room engine when a request made by `refresh()` finishes loading.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::imageReady()
    public imageReady(id: number, _data: ImageBitmap | null): void
    {
        const figure = this._imageIds.getValue(id);

        // AS3 re-runs refresh() rather than drawing `data`: by the time the image lands the
        // engine has it cached, so the second pass takes the synchronous half of ImageResult.
        if(figure !== null && PetImageWidget.cleanupAvatarString(figure) === this._figure) this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::imageFailed()
    // Empty in AS3: the placeholder `refresh()` already drew stays.
    public imageFailed(_id: number): void
    {
    }

    /**
	 * Ask the room engine for the current figure and draw the answer.
	 *
	 * Public: ProductIconWidget calls (petImageWidget.widget as PetImageWidget).refresh()
	 * directly after changing blend, matching AS3's external call into this method.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::refresh()
    public refresh(): void
    {
        const bitmap = this._bitmap;

        if(!bitmap) return;

        bitmap.bitmap = null;
        bitmap.blend = this._widgetWindow?.blend ?? 0;

        const figureData = new PetFigureData(this._figure);
        const roomEngine = this._windowManager?.roomEngine ?? null;

        if(roomEngine)
        {
            const result = roomEngine.getPetImage(
                figureData.typeId,
                figureData.paletteId,
                figureData.color,
                new Vector3d(this._direction * 45),
                this._scale,
                this,
                true,
                0,
                figureData.customParts,
                // AS3 assigns "std" to a local and passes it — the posture is never anything else.
                'std'
            );

            if(result)
            {
                const id = result.id;

                this._imageIds.remove(id);

                if(id > 0) this._imageIds.add(id, this._figure);

                bitmap.bitmap = result.data;
                bitmap.disposesBitmap = true;
            }
        }

        if(!bitmap.bitmap || bitmap.bitmap.width < 2)
        {
            // AS3 reads the placeholder straight off its component asset library, which is
            // always resolved; this port loads window images through the ResourceManager, so
            // the zoom tail below runs in the receiver instead of here.
            this.requestPlaceholder();

            return;
        }

        this.applyZoom();
    }

    // TS-only: AS3's `assets.getAssetByName(...).content` is synchronous, the ResourceManager
    // is not. Same placeholder, same fallback rule, one callback later.
    private requestPlaceholder(): void
    {
        const resourceManager = this._windowManager?.resourceManager ?? null;

        if(!this._bitmap || !resourceManager) return;

        // No `_png` suffix: images register under the bare file basename, so the AS3 name
        // `placeholder_pet[_small]_png` would miss (see AvatarImageWidget.requestPlaceholder()).
        const assetUri = 'placeholder_pet' + (this._scale === 32 ? '_small' : '');
        const requestId = ++this._placeholderRequestId;
        const receiver: IAssetReceiver = {
            get disposed(): boolean
            {
                return false;
            },
            dispose(): void
            {
                // Receiver is request-scoped and owns no resources.
            },
            receiveAsset: (asset: ImageBitmap): void =>
            {
                if(this._disposed || requestId !== this._placeholderRequestId || !this._bitmap) return;

                this._bitmap.bitmap = asset;
                this._bitmap.disposesBitmap = false;
                this.applyZoom();
            }
        };

        resourceManager.retrieveAsset(assetUri, receiver);
    }

    /**
	 * The tail of AS3's `refresh()`: remember the pre-zoom image, halve the zoom when the pet
	 * would overflow its window, and redraw scaled when either factor is not 1.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::refresh()
    private applyZoom(): void
    {
        const bitmap = this._bitmap;

        if(!bitmap) return;

        let zoomX = this._zoomX;
        let zoomY = this._zoomY;

        this._petBitmap = bitmap.bitmap;

        if(this._shrinkOnOverflow && this._petBitmap && this._widgetWindow
            && (this._petBitmap.width * zoomX > this._widgetWindow.width
                || this._petBitmap.height * zoomY > this._widgetWindow.height))
        {
            zoomX *= 0.5;
            zoomY *= 0.5;
        }

        if(zoomX !== 1 || zoomY !== 1)
        {
            const zoomed = PetImageWidget.zoomBitmapData(bitmap.bitmap, zoomX, zoomY);

            if(zoomed) bitmap.bitmap = zoomed;
        }

        bitmap.invalidate();
    }

    /**
	 * Scales a bitmap by the widget's zoom factors, the way AS3 redraws it through a scaled
	 * Matrix. `OffscreenCanvas.transferToImageBitmap()` keeps the call synchronous, which
	 * `refresh()` needs — `createImageBitmap()` would not.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/PetImageWidget.as::zoomBitmapData()
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
}
