import type {IFurnitureImageWidget} from './IFurnitureImageWidget';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IWindow} from '@core/window/IWindow';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {WindowEventListener} from '@core/window/events/WindowEventDispatcher';
import {PropertyStruct} from '@core/window/utils/PropertyStruct';
import type {IIterator} from '@core/window/utils/IIterator';
import {EmptyIterator} from '@core/window/iterators/EmptyIterator';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {IAssetReceiver} from '@core/window/IAssetReceiver';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import {OrderedMap} from '@ambreia/common/utils/OrderedMap';
import {Vector3d} from '@room/utils/Vector3d';

/**
 * Furniture image widget.
 *
 * Renders a furniture item image with configurable type, direction, and scale.
 *
 * The image comes from the room engine, which answers either with the bitmap in hand
 * (`ImageResult.data`) or with a pending id it will call `imageReady()` back on. Both
 * halves are live here; a caller that reads only one of them shows nothing for half the
 * requests (see `ImageResult`'s header).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as
 */
export class FurnitureImageWidget implements IFurnitureImageWidget, IGetImageListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::TYPE
    public static readonly TYPE: string = 'furniture_image';

    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::FURNITURE_TYPE_KEY
    private static readonly FURNITURE_TYPE_KEY: string = 'furniture_image:furnitureType';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::SCALE_KEY
    private static readonly SCALE_KEY: string = 'furniture_image:scale';
    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::DIRECTION_KEY
    private static readonly DIRECTION_KEY: string = 'furniture_image:direction';

    // Derived name: obfuscated in every tree, so the identifier is this port's; the
    // trace points at the class that declares it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::DIRECTIONS
    private static readonly DIRECTIONS: string[] = [
        'northeast', 'east', 'southeast', 'south',
        'southwest', 'west', 'northwest', 'north'
    ];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::SCALES
    private static readonly SCALES: number[] = [32, 64];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::ITEM_TYPE_FLOOR
    private static readonly ITEM_TYPE_FLOOR: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::ITEM_TYPE_WALL
    private static readonly ITEM_TYPE_WALL: number = 1;

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _root: IWindowContainer | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::_bitmap
    private _bitmap: IBitmapWrapperWindow | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::_region
    private _region: IWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::_imageIds
    // Derived name: obfuscated in every tree. Maps a pending room-engine request id to the
    // furniture type it was made for, so a late `imageReady()` for a type the widget has
    // since moved off is ignored.
    private _imageIds: OrderedMap<number, string> = new OrderedMap<number, string>();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::_extras
    // Derived name: obfuscated in every tree, and never assigned there either — AS3 passes
    // it straight to `getFurnitureImage()` and nothing ever sets it.
    private _extras: string | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::_stuffData
    // Derived name: obfuscated in every tree, and never assigned there either.
    private _stuffData: IStuffData | null = null;
    // TS-only: request generation, so a placeholder that arrives after the type changed
    // does not overwrite the furniture image that replaced it.
    private _placeholderRequestId: number = 0;
    // TS-only: bound event handler ref for removeEventListener
    private _onClickBound: WindowEventListener;

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;
        this._onClickBound = this.onClick.bind(this);

        const root = this._windowManager.buildWidgetLayout('furniture_image_xml') as IWindowContainer;

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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _furnitureType: string = 'table_plasto_square';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::get furnitureType()
    public get furnitureType(): string
    {
        return this._furnitureType;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::set furnitureType()
    public set furnitureType(value: string)
    {
        this._furnitureType = value;
        this.refresh();
    }

    private _scale: number = 64;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::get scale()
    public get scale(): number
    {
        return this._scale;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::set scale()
    public set scale(value: number)
    {
        this._scale = value;
        this.refresh();
    }

    private _direction: number = 2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::get direction()
    public get direction(): number
    {
        return this._direction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::set direction()
    public set direction(value: number)
    {
        this._direction = value;
        this.refresh();
    }

    private _itemType: number = FurnitureImageWidget.ITEM_TYPE_FLOOR;

    /**
	 * The item type: floor (0) or wall (1).
	 */
    public get itemType(): number
    {
        return this._itemType;
    }

    public set itemType(value: number)
    {
        this._itemType = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(FurnitureImageWidget.FURNITURE_TYPE_KEY, this._furnitureType),
            new PropertyStruct(FurnitureImageWidget.SCALE_KEY, this._scale),
            new PropertyStruct(FurnitureImageWidget.DIRECTION_KEY, FurnitureImageWidget.DIRECTIONS[this._direction]),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        for(const prop of values)
        {
            switch(prop.key)
            {
                case FurnitureImageWidget.FURNITURE_TYPE_KEY:
                    this.furnitureType = String(prop.value);
                    break;
                case FurnitureImageWidget.SCALE_KEY:
                    this.scale = Number(prop.value);
                    break;
                case FurnitureImageWidget.DIRECTION_KEY:
                    this.direction = FurnitureImageWidget.DIRECTIONS.indexOf(String(prop.value));
                    break;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

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

    /**
	 * Called back by the room engine when a request made by `refresh()` finishes loading.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::imageReady()
    public imageReady(id: number, _data: ImageBitmap | null): void
    {
        // AS3 re-runs refresh() rather than drawing `data`: by the time the image lands the
        // engine has it cached, so the second pass takes the synchronous half of ImageResult.
        if(this._imageIds.getValue(id) === this._furnitureType) this.refresh();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::imageFailed()
    // Empty in AS3: the placeholder `refresh()` already drew stays.
    public imageFailed(_id: number): void
    {
    }

    /**
	 * Ask the room engine for the current type/direction/scale and draw the answer.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::refresh()
    private refresh(): void
    {
        const bitmap = this._bitmap;

        if(!bitmap) return;

        bitmap.bitmap = null;

        const roomEngine = this._windowManager?.roomEngine ?? null;

        if(roomEngine)
        {
            const typeId = roomEngine.getFurnitureTypeId(this._furnitureType);
            const direction = new Vector3d(this._direction * 45, 0, 0);
            const result = this._itemType === FurnitureImageWidget.ITEM_TYPE_FLOOR
                ? roomEngine.getFurnitureImage(typeId, direction, this._scale, this, 0, this._extras, -1, -1, this._stuffData)
                : roomEngine.getWallItemImage(
                    typeId,
                    direction,
                    this._scale,
                    this,
                    0,
                    this._stuffData ? this._stuffData.getLegacyString() : ''
                );

            if(result)
            {
                const id = result.id;

                this._imageIds.remove(id);

                if(id > 0) this._imageIds.add(id, this._furnitureType);

                bitmap.bitmap = result.data;
                bitmap.disposesBitmap = true;
            }
        }

        if(!bitmap.bitmap || bitmap.bitmap.width < 2)
        {
            // AS3 reads the placeholder straight off its component asset library, which is
            // always resolved; this port loads window images through the ResourceManager, so
            // the tail below runs in the receiver instead of here.
            this.requestPlaceholder();

            return;
        }

        this.applyBitmapSize();
    }

    // TS-only: AS3's `assets.getAssetByName(...).content` is synchronous, the ResourceManager
    // is not. Same placeholder, same fallback rule, one callback later.
    private requestPlaceholder(): void
    {
        const resourceManager = this._windowManager?.resourceManager ?? null;

        if(!this._bitmap || !resourceManager) return;

        // No `_png` suffix: images register under the bare file basename, so the AS3 name
        // `placeholder_furni[_small]_png` would miss (see AvatarImageWidget.requestPlaceholder()).
        const assetUri = 'placeholder_furni' + (this._scale === 32 ? '_small' : '');
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
                this.applyBitmapSize();
            }
        };

        resourceManager.retrieveAsset(assetUri, receiver);
    }

    // TS-only: the tail of AS3's `refresh()`, split out because the placeholder branch now
    // reaches it asynchronously.
    private applyBitmapSize(): void
    {
        if(!this._bitmap) return;

        this._bitmap.invalidate();

        if(this._bitmap.bitmap && this._widgetWindow)
        {
            this._widgetWindow.width = this._bitmap.bitmap.width;
            this._widgetWindow.height = this._bitmap.bitmap.height;
        }
    }

    /**
	 * Handle click on the furniture region.
	 *
	 * In AS3, this method is empty (no-op).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/FurnitureImageWidget.as::onClick()
    private onClick(_event: WindowMouseEvent): void
    {
        // AS3: empty onClick handler
    }
}
