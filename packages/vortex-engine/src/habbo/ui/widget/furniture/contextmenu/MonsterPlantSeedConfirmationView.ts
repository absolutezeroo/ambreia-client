import type {BitmapDataAsset} from '@core/assets/BitmapDataAsset';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {XmlAsset} from '@core/assets/XmlAsset';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IFrameWindow} from '@core/window/components/IFrameWindow';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {Logger} from '@core/utils/Logger';

import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {RoomWidgetUseProductMessage} from '@habbo/ui/widget/messages/RoomWidgetUseProductMessage';
import {Vector3d} from '@room/utils/Vector3d';
import type {FurnitureContextMenuWidget} from './FurnitureContextMenuWidget';

const log = Logger.getLogger('habbo.ui.widget.furniture.contextmenu.MonsterPlantSeedConfirmationView');

/**
 * MonsterPlantSeedConfirmationView
 *
 * "Plant this seed?" — the dialog the seed's context bubble hands over to. Only this dialog
 * talks to the server, through `RWUPM_MONSTERPLANT_SEED`.
 *
 * The window is a frame whose content child is swapped, like the mannequin's; there is only
 * one content type today (`PRODUCT_PAGE_SEED`), and AS3 throws on anything else rather than
 * showing an empty frame.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/contextmenu/MonsterPlantSeedConfirmationView.as
 */
export class MonsterPlantSeedConfirmationView implements IGetImageListener
{
    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::PRODUCT_PAGE_UKNOWN
    private static readonly PRODUCT_PAGE_UNKNOWN: number = -1;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::PRODUCT_PAGE_SEED
    private static readonly PRODUCT_PAGE_SEED: number = 0;

    /**
     * Furniture categories are offset by 19 before the switch in AS3 — category 19 is the
     * seed. The constant is derived from that arithmetic; no tree names it.
     */
    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::open()
    private static readonly CATEGORY_OFFSET: number = 19;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::MonsterPlantSeedConfirmationView()
    constructor(widget: FurnitureContextMenuWidget)
    {
        this._widget = widget;
        this._windowManager = widget.windowManager;
        this._assets = widget.assets;
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::_SafeStr_4549
    private _widget: FurnitureContextMenuWidget | null;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::_windowManager
    private _windowManager: IHabboWindowManager;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::_assets
    private _assets: IAssetLibrary | null;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::_SafeStr_5769
    private _disposed: boolean = false;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::_SafeStr_7216
    private _objectId: number = -1;

    /** The pending image request id, so a late `imageReady()` for an older one is ignored. */
    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::_SafeStr_7581
    private _previewImageId: number = 0;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::_SafeStr_5194
    private _furniData: {id: number; category: number; localizedName: string; customParams: string} | null = null;

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::open()
    public open(objectId: number): void
    {
        const handler = this._widget?.handler ?? null;
        const roomId = handler?.container?.roomSession?.roomId ?? 0;
        const roomObject = handler?.container?.roomEngine?.getRoomObject(
            roomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
        ) ?? null;

        if(roomObject !== null)
        {
            this._furniData = handler?.getFurniData(roomObject) ?? null;
            this._objectId = roomObject.getId();
        }

        if(this._furniData === null) return;

        let content = MonsterPlantSeedConfirmationView.PRODUCT_PAGE_UNKNOWN;

        if(this._furniData.category - MonsterPlantSeedConfirmationView.CATEGORY_OFFSET === 0)
        {
            content = MonsterPlantSeedConfirmationView.PRODUCT_PAGE_SEED;
        }
        else
        {
            log.warn(`[PlantSeedConfirmationView.open()] Unsupported furniture category: ${this._furniData.category}`);
        }

        this.setWindowContent(content);

        if(this._window !== null)
        {
            this._window.visible = true;
        }
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::setWindowContent()
    private setWindowContent(content: number): void
    {
        const localizations = this._widget?.localizations ?? null;
        const productName = this._furniData?.localizedName ?? '';

        localizations?.registerParameter('useproduct.widget.title.plant_seed', 'name', productName);

        if(this._window === null)
        {
            this._window = this.buildLayout('use_product_widget_frame_plant_seed_xml');

            if(this._window === null) return;

            this.addClickListener('header_button_close');
            this._window.center();
        }

        localizations?.registerParameter('useproduct.widget.text.plant_seed', 'productName', productName);

        (this._window as unknown as IFrameWindow).content?.removeChildAt(0);

        const contentWindow = this.createWindow(content);

        if(contentWindow === null) return;

        (this._window as unknown as IFrameWindow).content?.addChild(contentWindow);

        if(content !== MonsterPlantSeedConfirmationView.PRODUCT_PAGE_SEED)
        {
            throw new Error(`Invalid type for use product confirmation content apply: ${content}`);
        }

        this.addClickListener('save_button');
        this.addClickListener('cancel_text');

        this.resolvePreviewImage();
        this.updatePreviewImage();

        this._window.invalidate();
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::createWindow()
    private createWindow(content: number): IWindowContainer | null
    {
        if(content !== MonsterPlantSeedConfirmationView.PRODUCT_PAGE_SEED)
        {
            throw new Error(`Invalid type for view content creation: ${content}`);
        }

        return this.buildLayout('use_product_controller_plant_seed_xml');
    }

    /** TS-only: the asset lookup + buildFromXML pair both layouts go through. */
    private buildLayout(assetName: string): IWindowContainer | null
    {
        const asset = this._assets?.getAssetByName(assetName) as XmlAsset | null;

        if(asset === null || asset === undefined)
        {
            log.warn(`Missing layout "${assetName}" - the plant-seed confirmation cannot open`);

            return null;
        }

        return this._windowManager.buildFromXML(asset.content as unknown as string) as IWindowContainer | null;
    }

    /**
     * Requests the furni's own render for the preview. The result is usually asynchronous —
     * `imageReady()` finishes the job — which is why the request id is kept.
     */
    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::resolvePreviewImage()
    private resolvePreviewImage(): void
    {
        if(this._furniData === null) return;

        if(this._furniData.category - MonsterPlantSeedConfirmationView.CATEGORY_OFFSET !== 0)
        {
            log.warn(`[PlantSeedConfirmationView] Unsupported furniture category: ${this._furniData.category}`);

            return;
        }

        const image = this._widget?.handler?.container?.roomEngine?.getFurnitureImage(
            this._furniData.id, new Vector3d(90, 0, 0), 64, this, 0, '', -1, -1, null
        ) ?? null;

        if(image !== null)
        {
            this._previewImageId = image.id;
        }
    }

    /**
     * AS3 takes the rendered furni bitmap as an argument and then ignores it, filling both
     * slots from the layout's own `bitmapAssetName` instead. Ported as written — passing the
     * render in would change what the dialog shows.
     */
    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::updatePreviewImage()
    private updatePreviewImage(): void
    {
        if(this._window === null) return;

        this.setPreviewImage('preview_image_bg');
        this.setPreviewImage('preview_image');
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::setPreviewImage()
    private setPreviewImage(name: string): void
    {
        const target = this._window?.findChildByName(name) as IBitmapWrapperWindow | null;

        if(target === null || target === undefined) return;

        const asset = this._assets?.getAssetByName(target.bitmapAssetName ?? '') as BitmapDataAsset | null;

        if(asset === null || asset === undefined) return;

        target.disposesBitmap = false;
        target.bitmap = asset.content as ImageBitmap | null;
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::close()
    public close(): void
    {
        if(this._window !== null)
        {
            this._window.visible = false;
        }
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::addClickListener()
    private addClickListener(name: string): void
    {
        this._window?.findChildByName(name)?.addEventListener(WindowMouseEvent.CLICK, this.onMouseClick);
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::onMouseClick()
    private onMouseClick = (event: WindowMouseEvent): void =>
    {
        const name = (event.target as {name?: string} | null)?.name ?? '';

        let message: RoomWidgetUseProductMessage | null = null;

        switch(name)
        {
            case 'header_button_close':
            case 'cancel_text':
            case 'ok_button':
                this.close();
                break;
            case 'save_button':
                message = new RoomWidgetUseProductMessage(
                    RoomWidgetUseProductMessage.MONSTERPLANT_SEED, this._objectId
                );

                this.close();
                break;
        }

        if(message !== null)
        {
            this._widget?.messageListener?.processWidgetMessage(message);
        }
    };

    /**
	 * `data` is a guard, not a source: AS3's `updatePreviewImage(param1)` uses it only to bail on
	 * `!param1`, then re-reads both images from the asset library by name. The port had the
	 * re-read and not the guard, so a failed load still refreshed the preview.
	 */
    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::imageReady()
    public imageReady(id: number, data: ImageBitmap | null): void
    {
        if(this._disposed) return;

        if(this._previewImageId === id)
        {
            if(data !== null) this.updatePreviewImage();

            this._previewImageId = 0;
        }
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::imageFailed()
    public imageFailed(_id: number): void
    {
        // AS3 has no such member; `IGetImageListener` requires it in this port.
    }

    // AS3: .../contextmenu/MonsterPlantSeedConfirmationView.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        this._furniData = null;
        this._widget = null;
    }
}
