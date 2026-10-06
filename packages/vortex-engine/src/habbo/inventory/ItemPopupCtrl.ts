import type {HabboInventory} from './HabboInventory';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IAssetLibrary} from '@core/assets';
import {AssetBitmap} from '@core/assets/AssetBitmap';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {ILimitedItemPreviewOverlayWidget} from '@habbo/window/widgets/ILimitedItemPreviewOverlayWidget';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import {StringUtil} from '@habbo/utils/StringUtil';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.inventory.ItemPopupCtrl');

/**
 * The hover tooltip beside an inventory or trade thumb: the item's name, its picture, and — for a
 * limited item — its serial number.
 *
 * It is one window moved between parents rather than one per thumb: `updateContent()` re-parents
 * it under whichever cell is being hovered, `show()`/`hide()` place it left or right of that cell,
 * and the two delays keep it from flickering as the pointer crosses a grid.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/ItemPopupCtrl.as
 */
export class ItemPopupCtrl
{
    // AS3: .../ItemPopupCtrl.as::LOCATION_LEFT
    // Name DERIVED, not recovered (`_SafeStr_10908` in every tree): the value is 1, and `show()`
    // puts the popup to the left of its parent for it, so it is LOCATION_RIGHT's twin.
    static readonly LOCATION_LEFT: number = 1;

    // AS3: .../ItemPopupCtrl.as::LOCATION_RIGHT
    static readonly LOCATION_RIGHT: number = 2;

    // AS3: .../ItemPopupCtrl.as::BOUNDS_MARGIN
    private static readonly BOUNDS_MARGIN: number = -5;

    // AS3: .../ItemPopupCtrl.as::OPEN_DELAY_MS
    private static readonly OPEN_DELAY_MS: number = 250;

    // AS3: .../ItemPopupCtrl.as::CLOSE_DELAY_MS
    private static readonly CLOSE_DELAY_MS: number = 100;

    // AS3: .../ItemPopupCtrl.as::IMAGE_MAX_WIDTH
    private static readonly IMAGE_MAX_WIDTH: number = 180;

    // AS3: .../ItemPopupCtrl.as::IMAGE_MAX_HEIGHT
    private static readonly IMAGE_MAX_HEIGHT: number = 200;

    // AS3: .../ItemPopupCtrl.as::_displayTimer
    // Name DERIVED (`_SafeStr_5236`): AS3's `Timer(OPEN_DELAY_MS, 1)`, a one-shot.
    private _displayTimer: ReturnType<typeof setTimeout> | null = null;

    // AS3: .../ItemPopupCtrl.as::_hideDelayTimer
    private _hideDelayTimer: ReturnType<typeof setTimeout> | null = null;

    // AS3: .../ItemPopupCtrl.as::_assets
    private _assets: IAssetLibrary | null;

    // AS3: .../ItemPopupCtrl.as::_window
    private _window: IWindowContainer | null;

    // AS3: .../ItemPopupCtrl.as::_parent
    private _parent: IWindowContainer | null = null;

    // AS3: .../ItemPopupCtrl.as::_location
    // Name DERIVED (`_SafeStr_8490`): holds one of the two LOCATION_* constants.
    private _location: number = ItemPopupCtrl.LOCATION_RIGHT;

    // AS3: .../ItemPopupCtrl.as::_arrowLeft
    private _arrowLeft: ImageBitmap | null = null;

    // AS3: .../ItemPopupCtrl.as::_arrowRight
    private _arrowRight: ImageBitmap | null = null;

    // AS3: .../ItemPopupCtrl.as::_inventory
    private _inventory: HabboInventory | null;

    // AS3: .../ItemPopupCtrl.as::_windowManager
    // Assigned and then read by nothing, in AS3 too — kept so the member list matches.
    private _windowManager: IHabboWindowManager | null;

    // AS3: .../ItemPopupCtrl.as::_isExternalImage
    // Name DERIVED (`_SafeStr_7304`): raised while an external image is being fetched, and read by
    // both load callbacks so a hover that has since moved on cannot paint the stale result.
    private _isExternalImage: boolean = false;

    // AS3: .../ItemPopupCtrl.as::ItemPopupCtrl()
    // AS3 throws on a null window or asset library rather than degrading, and starts hidden.
    constructor(
        window: IWindowContainer | null,
        assets: IAssetLibrary | null,
        windowManager: IHabboWindowManager | null,
        inventory: HabboInventory | null
    )
    {
        if(window === null || assets === null)
        {
            throw new Error('Null pointers passed as argument!');
        }

        this._window = window;
        this._window.visible = false;
        this._assets = assets;
        this._windowManager = windowManager;
        this._inventory = inventory;

        // The arrow bitmaps. AS3 asks for `popup_arrow_right_png`/`popup_arrow_left_png`; this
        // port registers images under their bare basename, so the `_png` suffix would resolve to
        // null and the arrow would silently never appear.
        this._arrowRight = this.resolveImage('popup_arrow_right');
        this._arrowLeft = this.resolveImage('popup_arrow_left');
    }

    // DEVIATION: AS3 takes a `productInfo` and shows it through the layout's `nft_image` product
    //   previewer, with `nft_overlay_icon`; the RPG fork removed NFT, so both are only hidden here
    //   until Task 10 removes them from the XML.
    // AS3: .../ItemPopupCtrl.as::updateContent()
    // Two shapes in one method, in AS3's own order: an external image fetched from a URL, or a
    // plain bitmap. Each hides the other's windows.
    updateContent(
        parent: IWindowContainer | null,
        itemName: string,
        image: ImageBitmap | null = null,
        stuffData: IStuffData | null = null,
        location: number = ItemPopupCtrl.LOCATION_RIGHT,
        isExternalImageItem: boolean = false
    ): void
    {
        if(this._window === null || parent === null) return;

        if(this._parent !== null)
        {
            this._parent.removeChild(this._window);
        }

        this._parent = parent;
        this._location = location;
        this._isExternalImage = false;

        const nameText = this._window.findChildByName('item_name_text') as ITextWindow | null;

        if(nameText !== null) nameText.text = itemName;

        const nftImage = this._window.findChildByName('nft_image') as unknown as IWidgetWindow | null;
        const nftOverlayIcon = this._window.findChildByName('nft_overlay_icon') as IStaticBitmapWrapperWindow | null;
        const uniqueOverlay = this._window.findChildByName('unique_item_overlay_widget') as unknown as IWidgetWindow | null;
        const itemImage = this._window.findChildByName('item_image') as unknown as IBitmapWrapperWindow | null;

        if(nftImage !== null) nftImage.visible = false;
        if(nftOverlayIcon !== null) nftOverlayIcon.visible = false;
        if(itemImage !== null) itemImage.visible = true;

        if(isExternalImageItem && this._inventory !== null)
        {
            if(uniqueOverlay !== null) uniqueOverlay.visible = false;
            if(itemImage !== null) itemImage.bitmap = null;

            if(stuffData !== null)
            {
                this._isExternalImage = true;

                const id = stuffData.getJSONValue('id');

                if(!StringUtil.isBlank(id))
                {
                    void this.loadExtraData(id);
                }
                else
                {
                    const relative = stuffData.getJSONValue('w');

                    if(!StringUtil.isBlank(relative))
                    {
                        void this.loadImage(this._inventory.getProperty('stories.image_url_base') + relative);
                    }
                }
            }

            return;
        }

        if(itemImage !== null)
        {
            // TS deviation: AS3 copies the source into a new BitmapData of
            // min(IMAGE_MAX_WIDTH, w) x min(IMAGE_MAX_HEIGHT, h), i.e. it *crops* an oversized
            // image; here the bitmap is set as it is and the window clamped to the same maxima,
            // which the renderer fits rather than crops. Identical for every image under the cap,
            // which is every inventory icon.
            itemImage.bitmap = image;
            itemImage.width = Math.min(ItemPopupCtrl.IMAGE_MAX_WIDTH, image?.width ?? 0);
            itemImage.height = Math.min(ItemPopupCtrl.IMAGE_MAX_HEIGHT, image?.height ?? 0);
            itemImage.x = (this._window.width - itemImage.width) / 2;
            this._window.height = itemImage.bottom + 10;
        }

        if(stuffData !== null && stuffData.uniqueSerialNumber > 0)
        {
            if(uniqueOverlay !== null)
            {
                const overlay = uniqueOverlay.widget as ILimitedItemPreviewOverlayWidget | null;

                if(overlay !== null)
                {
                    overlay.serialNumber = stuffData.uniqueSerialNumber;
                    overlay.seriesSize = stuffData.uniqueSeriesSize;
                }

                uniqueOverlay.visible = true;
            }
        }
        else if(uniqueOverlay !== null)
        {
            uniqueOverlay.visible = false;
        }
    }

    // AS3: .../ItemPopupCtrl.as::loadExtraData()
    // The stories service answers with JSON carrying the real image URL.
    private async loadExtraData(id: string): Promise<void>
    {
        const url = (this._inventory?.getProperty('extra_data_service_url') ?? '') + id;

        try
        {
            const response = await fetch(url);
            const body = await response.text();

            // AS3 checks the flag again here, after the round trip: the pointer may have moved on.
            if(!this._isExternalImage || StringUtil.isBlank(body)) return;

            const data = JSON.parse(body) as {url?: string};

            if(data.url) await this.loadImage(data.url);
        }
        catch (error)
        {
            // AS3 swallows this too — a broken external image leaves the popup empty rather than
            // failing the hover.
            log.debug(`Extra data for ${id} could not be read: ${String(error)}`);
        }
    }

    // AS3: .../ItemPopupCtrl.as::loadImage()
    // AS3 uses a BitmapFileLoader; this port fetches the bytes and decodes them the same way the
    // rest of the client does.
    private async loadImage(url: string): Promise<void>
    {
        if(StringUtil.isBlank(url)) return;

        try
        {
            const response = await fetch(url);
            const blob = await response.blob();
            const image = await createImageBitmap(blob);

            this.onExternalImageLoaded(image);
        }
        catch (error)
        {
            log.debug(`External image ${url} could not be loaded: ${String(error)}`);
        }
    }

    // AS3: .../ItemPopupCtrl.as::onExtImageLoaded()
    // Scales to the popup's width — AS3 builds the matrix from IMAGE_MAX_WIDTH / image width, so a
    // small image is scaled *up* as well.
    private onExternalImageLoaded(image: ImageBitmap): void
    {
        if(this._window === null || !this._isExternalImage) return;

        const itemImage = this._window.findChildByName('item_image') as unknown as IBitmapWrapperWindow | null;

        if(itemImage === null || this._assets === null) return;

        // TS deviation, as above — AS3 scales this one by IMAGE_MAX_WIDTH / image.width through a
        // Matrix, so an external image is stretched to the popup's width.
        itemImage.bitmap = image;
        itemImage.width = Math.min(ItemPopupCtrl.IMAGE_MAX_WIDTH, image.width);
        itemImage.height = Math.min(ItemPopupCtrl.IMAGE_MAX_HEIGHT, image.height);
        itemImage.x = (this._window.width - itemImage.width) / 2;
        this._window.height = itemImage.bottom + 10;
    }

    // AS3: .../ItemPopupCtrl.as::show()
    // Both timers are cancelled first: showing now supersedes a pending hide.
    show(): void
    {
        this.clearTimers();

        if(this._parent === null || this._window === null) return;

        this._window.visible = true;
        this._parent.addChild(this._window);
        this.refreshArrow(this._location);

        if(this._location === ItemPopupCtrl.LOCATION_LEFT)
        {
            this._window.x = -this._window.width - ItemPopupCtrl.BOUNDS_MARGIN;
        }
        else if(this._location === ItemPopupCtrl.LOCATION_RIGHT)
        {
            this._window.x = this._parent.width + ItemPopupCtrl.BOUNDS_MARGIN;
        }

        this._window.y = (this._parent.height - this._window.height) / 2;
    }

    // AS3: .../ItemPopupCtrl.as::hide()
    hide(): void
    {
        if(this._window !== null) this._window.visible = false;

        this.clearTimers();

        if(this._parent !== null && this._window !== null)
        {
            this._parent.removeChild(this._window);
        }
    }

    // AS3: .../ItemPopupCtrl.as::showDelayed()
    showDelayed(): void
    {
        this.clearTimers();
        this._displayTimer = setTimeout(() => this.show(), ItemPopupCtrl.OPEN_DELAY_MS);
    }

    // AS3: .../ItemPopupCtrl.as::hideDelayed()
    hideDelayed(): void
    {
        this.clearTimers();
        this._hideDelayTimer = setTimeout(() => this.hide(), ItemPopupCtrl.CLOSE_DELAY_MS);
    }

    // AS3: .../ItemPopupCtrl.as::show()/hide()/showDelayed()/hideDelayed()
    // The `reset()` pair every one of those four opens with.
    private clearTimers(): void
    {
        if(this._displayTimer !== null)
        {
            clearTimeout(this._displayTimer);
            this._displayTimer = null;
        }

        if(this._hideDelayTimer !== null)
        {
            clearTimeout(this._hideDelayTimer);
            this._hideDelayTimer = null;
        }
    }

    // AS3: .../ItemPopupCtrl.as::refreshArrow()
    // The arrow points back at the thumb, so it sits on the side the popup is NOT on.
    private refreshArrow(location: number = ItemPopupCtrl.LOCATION_RIGHT): void
    {
        if(this._window === null || this._window.disposed) return;

        const arrow = this._window.findChildByName('arrow_pointer') as unknown as IBitmapWrapperWindow | null;

        if(arrow === null) return;

        const bitmap = location === ItemPopupCtrl.LOCATION_LEFT ? this._arrowRight : this._arrowLeft;

        if(bitmap === null) return;

        arrow.bitmap = bitmap;
        arrow.width = bitmap.width;
        arrow.height = bitmap.height;
        arrow.y = (this._window.height - bitmap.height) / 2;
        arrow.x = location === ItemPopupCtrl.LOCATION_LEFT
            ? this._window.width - 1
            : -bitmap.width + 1;

        arrow.invalidate();
    }

    // AS3: .../ItemPopupCtrl.as::ItemPopupCtrl() — the two `getAssetByName(...) as BitmapDataAsset`
    // lookups, written twice there.
    private resolveImage(name: string): ImageBitmap | null
    {
        const asset = this._assets?.getAssetByName(name);

        if(!asset)
        {
            log.warn(`Popup arrow asset "${name}" is missing — the tooltip will have no pointer`);

            return null;
        }

        return AssetBitmap.resolveSync(asset.content);
    }

    // AS3: .../ItemPopupCtrl.as::dispose()
    dispose(): void
    {
        this.clearTimers();

        this._assets = null;
        this._window = null;
        this._parent = null;
        this._arrowLeft = null;
        this._arrowRight = null;
        this._inventory = null;
        this._windowManager = null;
    }
}
