import type {IWidget} from './IWidget';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import {Vector3d} from '@room/utils/Vector3d';
import type {IProductDisplayInfo} from './IProductDisplayInfo';
import {PropertyStruct} from '@core/window/utils/PropertyStruct';
import {ImageResult} from '@habbo/room/ImageResult';
import {ProductCategoryMapping} from '../utils/ProductCategoryMapping';
import {PIVOT_NAMES, pivotFromName} from '@core/window/enum/PivotPoint';
import {Logger} from '@ambreia/common/utils/Logger';
import type {BadgeImageWidget} from './BadgeImageWidget';
import type {PetImageWidget} from './PetImageWidget';
import type {AvatarImageWidget} from './AvatarImageWidget';
import type {IIterator} from '@core/window/utils/IIterator';
import {EmptyIterator} from '@core/window/iterators/EmptyIterator';
import {EffectPreviewer} from '@habbo/window/utils/EffectPreviewer';

const log = Logger.getLogger('habbo.window.widgets.ProductImageWidget');

/**
 * Renders a large preview image for a catalog product: a wall/floor item
 * render, a pixel effect avatar preview, a badge, a chat style preview, a
 * pet figure, or an avatar wearing a figure-set - whichever
 * `productInfo.productTypeId` selects. Larger, angled sibling of
 * ProductIconWidget's flat icon previews.
 *
 * AS3 has it implement the obfuscated `_SafeCls_2029` — the product-previewer interface, whose
 * name is unrecoverable in every tree — on top of the widget base. That interface is what declares
 * `productInfo`, `clearPreviewer()`, `setPlaceholder()`, `pivot`, `blend`, `setUnknownImage()` and
 * `unknownImageUri`, all implemented below and traced to this class. Named here because a member
 * declared on an interface is accounted for by whatever implements it, and `ItemPopupCtrl.ts` —
 * the only other file citing `_SafeCls_2029.as` — deliberately declares just the two members it
 * consumes.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2029.as
 */
export class ProductImageWidget implements IWidget, IGetImageListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::TYPE
    public static readonly TYPE: string = 'product_image';

    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _root: IWindowContainer | null = null;
    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::_disposed
    private _disposed: boolean = false;
    private _productInfo: IProductDisplayInfo | null = null;
    private _pivot: number = 0;
    // AS3: _SafeStr_6491 - id of the pending async image request we're waiting on
    private _pendingImageId: number = -1;
    private _blend: number = 1;
    // AS3: _SafeStr_9633/_SafeStr_9632/_SafeStr_5413 - easter egg repeat-count tracking
    private _lastEasterEggProductTypeId: number = -1;
    private _lastEasterEggItemTypeId: string = '';
    private _easterEggRepeatCount: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::_effectPreviewer
    // Name DERIVED (`_SafeStr_5597`): obfuscated in every tree, named after the class it holds.
    private _effectPreviewer: EffectPreviewer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::ProductImageWidget()
    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        const root = this._windowManager.buildWidgetLayout('product_image_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;
            this._widgetWindow.rootWindow = root;
            root.width = this._widgetWindow.width;
            root.height = this._widgetWindow.height;
        }

        this.setPlaceholder();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get productInfo()
    public get productInfo(): IProductDisplayInfo | null
    {
        return this._productInfo;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::set productInfo()
    public set productInfo(value: IProductDisplayInfo | null)
    {
        this._productInfo = value;
        this.previewImage(value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct('pivot_point', PIVOT_NAMES[this._pivot], PropertyStruct.STRING, this._pivot !== 0, PIVOT_NAMES as unknown as string[]),
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        for(const prop of values)
        {
            if(prop.key === 'pivot_point')
            {
                this.pivot = pivotFromName(String(prop.value));
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get pivot()
    public get pivot(): number
    {
        return this._pivot;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::set pivot()
    public set pivot(value: number)
    {
        this._pivot = value;

        const preview = this.productPreviewBitmap;
        const badge = this.badgeImageWidget;
        const placeholder = this.placeholderImage;

        if(preview) preview.pivotPoint = value;
        if(badge?.widget) (badge.widget as BadgeImageWidget).pivotPoint = value;
        if(placeholder) placeholder.pivotPoint = value;

        this.refresh();
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::refresh()
    private refresh(): void
    {
        if(this._productInfo)
        {
            this.previewImage(this._productInfo);
        }
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get placeholderImage()
    private get placeholderImage(): IStaticBitmapWrapperWindow | null
    {
        return (this._root?.findChildByName('placeholder_image') as unknown as IStaticBitmapWrapperWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get productPreviewBitmap()
    private get productPreviewBitmap(): IBitmapWrapperWindow | null
    {
        return (this._root?.findChildByName('product_preview') as unknown as IBitmapWrapperWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get avatarImageWidget()
    private get avatarImageWidget(): IWidgetWindow | null
    {
        return (this._root?.findChildByName('avatar_image_widget') as unknown as IWidgetWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get badgeImageWidget()
    private get badgeImageWidget(): IWidgetWindow | null
    {
        return (this._root?.findChildByName('badge_image_widget') as unknown as IWidgetWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get petImageWidget()
    private get petImageWidget(): IWidgetWindow | null
    {
        return (this._root?.findChildByName('pet_image_widget') as unknown as IWidgetWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get effectImageWidget()
    private get effectImageWidget(): IWidgetWindow | null
    {
        return (this._root?.findChildByName('effect_image_widget') as unknown as IWidgetWindow) ?? null;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get unknownImageWindow()
    private get unknownImageWindow(): IStaticBitmapWrapperWindow | null
    {
        return (this._root?.findChildByName('unknown_image') as unknown as IStaticBitmapWrapperWindow) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::previewImage()
    public previewImage(info: IProductDisplayInfo | null): void
    {
        if(!info)
        {
            this.setUnknownImage();

            return;
        }

        if(this.handlePreviewImageEasterEgg(info))
        {
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
                const wallItemData = windowManager.sessionDataManager?.getWallItemData(parseInt(info.itemTypeId, 10)) ?? null;

                if(!wallItemData)
                {
                    this.clearPreviewer();
                    break;
                }

                if(ProductCategoryMapping.categoryMapping('I', wallItemData.id) === 1)
                {
                    this.setImageResult(
                        windowManager.roomEngine?.getWallItemImage(wallItemData.id, new Vector3d(90, 0, 0), 64, this, 0, info.extraData) ?? null
                    );
                }
                else
                {
                    this.clearPreviewer();
                }

                break;
            }
            case 1: { // floor item
                const floorItemData = windowManager.sessionDataManager?.getFloorItemData(parseInt(info.itemTypeId, 10)) ?? null;

                if(!floorItemData)
                {
                    this.clearPreviewer();
                    break;
                }

                this.setImageResult(windowManager.roomEngine?.getFurnitureImage(floorItemData.id, new Vector3d(90, 0, 0), 64, this) ?? null);
                break;
            }
            case 2: // pixel effect preview on an avatar
                if(info.itemTypeId === '')
                {
                    this.clearPreviewer();
                    break;
                }

                this.setEffectResult(windowManager.sessionDataManager?.figure ?? '', parseInt(info.itemTypeId, 10));
                break;
            case 4: // badge
                this.setBadgeResult(info.itemTypeId);
                break;
            case 9: { // chat style preview
                const preview = ProductCategoryMapping.createChatItemPreview(windowManager, parseInt(info.itemTypeId, 10));

                if(!preview)
                {
                    this.clearPreviewer();
                    break;
                }

                const result = new ImageResult();

                result.data = preview;
                this.setImageResult(result);
                break;
            }
            case 10: // pet
                this.setPetResult(info.petFigureString);
                break;
            case 11: { // avatar wearing a figure-set
                const avatarRenderer = windowManager.avatarRenderer;
                const sessionDataManager = windowManager.sessionDataManager;

                if(!avatarRenderer || !sessionDataManager)
                {
                    this.clearPreviewer();
                    break;
                }

                const figure = avatarRenderer.getFigureStringWithFigureIds(
                    sessionDataManager.figure,
                    sessionDataManager.gender,
                    info.figureSetIds
                );

                this.setAvatarResult(figure);
                break;
            }
            default:
                log.warn(`Can not yet handle this type of product: ${info.productTypeId}`);
                this.clearPreviewer();
        }
    }

    /**
     * Preview the same chat style enough times in a row and it starts speaking under a different
     * name. Seven thresholds, none of them documented anywhere but here.
     *
     * Returning false means "I did nothing, carry on with the normal preview" — which is also what
     * happens when the bubble fails to render, exactly as AS3 does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::handlePreviewImageEasterEgg()
    private handlePreviewImageEasterEgg(info: IProductDisplayInfo): boolean
    {
        if(info.productTypeId === this._lastEasterEggProductTypeId && info.itemTypeId === this._lastEasterEggItemTypeId)
        {
            this._easterEggRepeatCount += 1;
        }
        else
        {
            this._easterEggRepeatCount = 1;
        }

        this._lastEasterEggProductTypeId = info.productTypeId;
        this._lastEasterEggItemTypeId = info.itemTypeId;

        if(info.productTypeId === 9)
        {
            let username: string | null = null;

            switch(this._easterEggRepeatCount)
            {
                case 7: username = 'Evil Frank'; break;
                case 10: username = 'Bonne Blonde'; break;
                case 15: username = 'Furni fairy'; break;
                case 22: username = 'Wacky Wired'; break;
                case 35: username = 'Quacky duck'; break;
                case 70: username = 'Pixel poo'; break;
                case 100: username = 'Bobba filtered'; break;
            }

            if(username !== null)
            {
                const preview = ProductCategoryMapping.createChatItemPreview(this._windowManager, parseInt(info.itemTypeId, 10), username);

                if(!preview) return false;

                const result = new ImageResult();

                result.data = preview;
                this.setImageResult(result);

                return true;
            }
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::clearPreviewer()
    public clearPreviewer(): void
    {
        this._pendingImageId = -1;

        const avatar = this.avatarImageWidget;
        const preview = this.productPreviewBitmap;
        const badge = this.badgeImageWidget;
        const placeholder = this.placeholderImage;
        const pet = this.petImageWidget;
        const effect = this.effectImageWidget;
        const unknown = this.unknownImageWindow;

        if(avatar) avatar.visible = false;
        if(preview) preview.visible = false;
        if(badge) badge.visible = false;
        if(placeholder) placeholder.visible = false;
        if(pet) pet.visible = false;
        if(effect) effect.visible = false;
        if(unknown) unknown.visible = false;

        // AS3 hides the previewer rather than the window it lives in — same effect, except that a
        // previewer built lazily here would be pointless, so this only touches one that exists.
        if(this._effectPreviewer !== null) this._effectPreviewer.visible = false;
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

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::centerWindow()
    private centerWindow(window: IWidgetWindow): void
    {
        if(!this._root) return;

        window.x = this._root.width / 2 - window.width / 2;
        window.y = this._root.height / 2 - window.height / 2;
    }

    private setAvatarResult(figure: string): void
    {
        this.clearPreviewer();

        const avatar = this.avatarImageWidget;

        if(!avatar) return;

        avatar.visible = true;
        (avatar.widget as AvatarImageWidget).figure = figure;
        this.centerWindow(avatar);
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

    /**
     * An avatar wearing the pixel effect being sold.
     *
     * The +50 is AS3's own: `centerWindow()` centres the *widget*, and the effect previewer draws
     * the avatar in the upper half of it, so the box is pushed down to bring the figure back to
     * the middle.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::setEffectResult()
    private setEffectResult(figure: string, effectId: number): void
    {
        this.clearPreviewer();

        const effect = this.effectImageWidget;

        if(!effect) return;

        this.centerWindow(effect);
        effect.y += 50;

        const previewer = this.effectPreviewer;

        if(previewer === null) return;

        previewer.visible = true;
        previewer.update(figure, effectId);
    }

    /**
     * Built on first use rather than in the constructor, which is where AS3 builds it.
     *
     * The widget's `product_image_xml` root is assigned in the constructor, but `widget.widget` —
     * the room previewer the effect preview draws into — is attached later by the window system, so
     * a previewer built in the constructor would capture a widget window that has no previewer
     * behind it yet.
     */
    // TS-only: AS3 constructs `_SafeStr_5597` inline in its constructor; see above for why this
    // port cannot.
    private get effectPreviewer(): EffectPreviewer | null
    {
        if(this._effectPreviewer !== null) return this._effectPreviewer;

        const effect = this.effectImageWidget;
        const renderer = this._windowManager?.avatarRenderer ?? null;

        if(effect === null || renderer === null) return null;

        this._effectPreviewer = new EffectPreviewer(effect, renderer);

        return this._effectPreviewer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::setUnknownImage()
    public setUnknownImage(): void
    {
        this.clearPreviewer();

        const unknown = this.unknownImageWindow;

        if(unknown) unknown.visible = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::setPlaceholder()
    public setPlaceholder(): void
    {
        this.clearPreviewer();

        const placeholder = this.placeholderImage;

        if(placeholder) placeholder.visible = true;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/ProductImageWidget.as::setPreviewImage()
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::set unknownImageUri()
    public set unknownImageUri(value: string)
    {
        const window = this.unknownImageWindow;

        if(window) window.assetUri = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get blend()
    public get blend(): number
    {
        return this._blend;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::set blend()
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::imageReady()
    public imageReady(id: number, data: ImageBitmap | null): void
    {
        if(this._pendingImageId === id && this.productPreviewBitmap)
        {
            this.setPreviewImage(data);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::imageFailed()
    public imageFailed(_id: number): void
    {
        // AS3: no-op
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ProductImageWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._pendingImageId = -1;

        if(this._effectPreviewer !== null)
        {
            this._effectPreviewer.dispose();
            this._effectPreviewer = null;
        }

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
