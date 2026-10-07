import {ActivityPointTypeEnum} from '../utils/ActivityPointTypeEnum';
import type {IWidget} from '@ambreia/ui/kit/widgets/IWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IIconWindow} from '@ambreia/ui/components/IIconWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IBitmapWrapperWindow} from '@ambreia/ui/components/IBitmapWrapperWindow';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IProductDisplayInfo} from '@ambreia/ui/kit/widgets/IProductDisplayInfo';
import {ImageResult} from '@habbo/room/ImageResult';
import {ProductCategoryMapping} from '@ambreia/ui/kit/utils/ProductCategoryMapping';
import {Logger} from '@ambreia/common/utils/Logger';
import type {BadgeImageWidget} from './BadgeImageWidget';
import type {PetImageWidget} from './PetImageWidget';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

const log = Logger.getLogger('habbo.window.widgets.ProductIconWidget');

/**
 * Renders a small preview icon for a catalog product: a wall/floor item icon,
 * a pixel effect icon, a badge, a bot's head, a loyalty/diamond style icon, a
 * chat style preview, or a pet figure - whichever `productInfo.productTypeId`
 * selects.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as
 */
export class ProductIconWidget implements IWidget, IGetImageListener, IAvatarImageListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::TYPE
    public static readonly TYPE: string = 'product_icon';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _root: IWindowContainer | null = null;
    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::_disposed
    private _disposed: boolean = false;
    private _productInfo: IProductDisplayInfo | null = null;
    // AS3: _SafeStr_6491 - id of the pending async image request we're waiting on
    private _pendingImageId: number = -1;
    private _blend: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::ProductIconWidget()
    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('product_icon_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;
            this._widgetWindow.rootWindow = root;
        }

        this.clearPreviewer();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get productInfo()
    public get productInfo(): IProductDisplayInfo | null
    {
        return this._productInfo;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::set productInfo()
    public set productInfo(value: IProductDisplayInfo | null)
    {
        this._productInfo = value;
        this.previewImage(value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::set properties()
    public set properties(_values: PropertyStruct[])
    {
        // AS3: no-op
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::set unknownImageUri()
    public set unknownImageUri(value: string)
    {
        const window = this.unknownImageWindow;

        if(window) window.assetUri = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get blend()
    public get blend(): number
    {
        return this._blend;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::set blend()
    public set blend(value: number)
    {
        this._blend = value;

        const preview = this.productPreviewBitmap;
        const unknown = this.unknownImageWindow;
        const badge = this.badgeImageWidget;
        const pet = this.petImageWidget;

        if(preview) preview.blend = value;
        if(unknown) unknown.blend = value;
        if(badge) badge.blend = value;
        if(pet) pet.blend = value;

        (pet?.widget as PetImageWidget | null)?.refresh();
        (badge?.widget as BadgeImageWidget | null)?.refresh();
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get productPreviewBitmap()
    private get productPreviewBitmap(): IBitmapWrapperWindow | null
    {
        return (this._root?.findChildByName('bitmap') as unknown as IBitmapWrapperWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get badgeImageWidget()
    private get badgeImageWidget(): IWidgetWindow | null
    {
        return (this._root?.findChildByName('badge_image_widget') as unknown as IWidgetWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get petImageWidget()
    private get petImageWidget(): IWidgetWindow | null
    {
        return (this._root?.findChildByName('pet_image_widget') as unknown as IWidgetWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get unknownImageWindow()
    private get unknownImageWindow(): IStaticBitmapWrapperWindow | null
    {
        return (this._root?.findChildByName('unknown_image') as unknown as IStaticBitmapWrapperWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get iconWindow()
    private get iconWindow(): IIconWindow | null
    {
        return (this._root?.findChildByName('icon') as unknown as IIconWindow) ?? null;
    }

    // DEVIATION: AS3 also previews product type 12 (a habbicon); the RPG fork removed Habbicons, so
    //   that type now takes the unhandled-type warning.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::previewImage()
    public previewImage(info: IProductDisplayInfo | null): void
    {
        if(!info)
        {
            this.setUnknownImage();

            return;
        }

        const windowManager = this._windowManager;

        if(!windowManager)
        {
            return;
        }

        // AS3 switches on `productTypeId - -1` (i.e. productTypeId + 1); cases
        // translated back to the real productTypeId values here.
        switch(info.productTypeId)
        {
            case -1:
                this.setUnknownImage();
                break;
            case 0: { // wall item
                const wallItem = windowManager.sessionDataManager?.getWallItemData(parseInt(info.itemTypeId, 10)) ?? null;

                if(!wallItem)
                {
                    this.clearPreviewer();
                    break;
                }

                const category = ProductCategoryMapping.categoryMapping('I', wallItem.id);

                if(category === 1)
                {
                    const result = windowManager.roomEngine?.getWallItemIcon(wallItem.id, this, info.extraData);

                    this.setImageResult(result ?? null);
                }
                else
                {
                    this.clearPreviewer();
                }

                break;
            }
            case 1: // floor item
            case 11: { // AS3 also routes productTypeId 11 through the floor-item branch
                const floorItem = windowManager.sessionDataManager?.getFloorItemData(parseInt(info.itemTypeId, 10)) ?? null;

                if(!floorItem)
                {
                    this.clearPreviewer();
                    break;
                }

                const result = windowManager.roomEngine?.getFurnitureIcon(floorItem.id, this);

                this.setImageResult(result ?? null);
                break;
            }
            case 2: { // pixel effect — the icons came from the catalog, which left with the core cut
                const result = new ImageResult();

                result.data = null;
                this.setImageResult(result);
                break;
            }
            case 4: // badge
                this.setBadgeResult(info.itemTypeId);
                break;
            case 6: // bot
                this.setBotResult(info.botFigureString);
                break;
            case 8: { // loyalty/diamond style icon
                const itemTypeId = parseInt(info.itemTypeId, 10);
                const configuration = windowManager.configuration;

                if(!configuration)
                {
                    this.clearPreviewer();
                    break;
                }

                const style = ActivityPointTypeEnum.getIconStyleFor(itemTypeId, configuration, true);

                if(style === 0)
                {
                    this.clearPreviewer();
                }
                else
                {
                    this.setIconResult(style);
                }

                break;
            }
            case 9: { // chat style selector preview — chat styles left with the core cut
                const result = new ImageResult();

                result.data = null;
                this.setImageResult(result);
                break;
            }
            case 10: // pet
                this.setPetResult(info.petFigureString);
                break;
            default:
                log.warn(`Can not yet handle this type of product: ${info.productTypeId}`);
                this.clearPreviewer();
        }
    }

    // DEVIATION: AS3 also detaches the pending habbicon repaint; the RPG fork removed Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::clearPreviewer()
    public clearPreviewer(): void
    {
        this._pendingImageId = -1;

        const preview = this.productPreviewBitmap;
        const badge = this.badgeImageWidget;
        const pet = this.petImageWidget;
        const unknown = this.unknownImageWindow;
        const icon = this.iconWindow;

        if(preview) preview.visible = false;
        if(badge) badge.visible = false;
        if(pet) pet.visible = false;
        if(unknown) unknown.visible = false;
        if(icon) icon.visible = false;
    }

    private setImageResult(result: ImageResult | null): void
    {
        this.clearPreviewer();

        if(result)
        {
            this._pendingImageId = result.id;
            this.setPreviewImage(result.data);
        }
    }

    private setBadgeResult(badgeId: string): void
    {
        this.clearPreviewer();

        const badge = this.badgeImageWidget;

        if(!badge) return;

        badge.visible = true;
        (badge.widget as BadgeImageWidget).badgeId = badgeId;
    }

    private setPetResult(figure: string): void
    {
        this.clearPreviewer();

        const pet = this.petImageWidget;

        if(!pet) return;

        pet.visible = true;
        (pet.widget as PetImageWidget).figure = figure;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::set botResult()
    private setBotResult(figure: string): void
    {
        this.clearPreviewer();

        const avatarRenderer = this._windowManager?.avatarRenderer;

        if(!figure || figure.length === 0 || !avatarRenderer)
        {
            this.setUnknownImage();

            return;
        }

        const avatarImage = avatarRenderer.createAvatarImage(figure, 'h', '', this, null);

        if(!avatarImage)
        {
            this.setUnknownImage();

            return;
        }

        avatarImage.setDirection('head', 3);

        const cropped = avatarImage.getCroppedImage('head') as ImageBitmap | null;

        avatarImage.dispose();

        if(!cropped)
        {
            this.setUnknownImage();

            return;
        }

        this.setPreviewImage(cropped);
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::setUnknownImage()
    private setUnknownImage(): void
    {
        this.clearPreviewer();

        const unknown = this.unknownImageWindow;

        if(unknown) unknown.visible = true;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductIconWidget.as::setPreviewImage()
    private setPreviewImage(data: ImageBitmap | null): void
    {
        const preview = this.productPreviewBitmap;

        if(!preview) return;

        if(!data)
        {
            preview.visible = false;

            return;
        }

        preview.bitmap = data;
        preview.visible = true;
    }

    private setIconResult(style: number): void
    {
        this.clearPreviewer();

        const icon = this.iconWindow;

        if(!icon) return;

        icon.visible = true;
        icon.style = style;
        icon.fitToSize();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::imageReady()
    public imageReady(id: number, data: ImageBitmap | null): void
    {
        if(this._pendingImageId === id && this.productPreviewBitmap)
        {
            this.setPreviewImage(data);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::imageFailed()
    public imageFailed(_id: number): void
    {
        // AS3: no-op
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::avatarImageReady()
    public avatarImageReady(figure: string): void
    {
        if(!this._disposed && this._productInfo?.productTypeId === 6 && this._productInfo.botFigureString === figure)
        {
            this.setBotResult(figure);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductIconWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._pendingImageId = -1;

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
    }
}
