/**
 * UseProductConfirmationView — "apply this product to this pet?" with a live preview of the result.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/UseProductConfirmationView.as
 *
 * The content is one of four `use_product_controller_*` layouts. The preview is not the pet as it
 * is now: it is the pet re-rendered *with the product applied* — a shampoo swaps the palette to the
 * product's colour tag for the pet's own breed, a custom part swaps that layer's part, and a saddle
 * merges the product's parts over the pet's remaining ones.
 *
 * The RPG fork removed monsterplants: AS3's three monsterplant products (revive / rebreed /
 * fertilize), their frames, controllers and growth-posture preview are not ported.
 *
 * AS3 adaptation: BitmapData.copyPixels() → OffscreenCanvas drawImage.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IFrameWindow} from '@core/window/components/IFrameWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IUserData} from '@habbo/session/IUserData';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IRoomObject} from '@room/object/IRoomObject';
import {PetCustomPart} from '@habbo/avatar/pets/PetCustomPart';
import {PetFigureData} from '@habbo/avatar/pets/PetFigureData';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {Vector3d} from '@room/utils/Vector3d';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';
import {RoomWidgetUseProductMessage} from '../messages/RoomWidgetUseProductMessage';
import type {AvatarInfoWidget} from './AvatarInfoWidget';

const logger = Logger.getLogger('habbo.ui.widget.avatarinfo.UseProductConfirmationView');

export class UseProductConfirmationView implements IDisposable, IGetImageListener
{
    // AS3: UseProductConfirmationView.as::PRODUCT_PAGE_UKNOWN (AS3's own spelling)
    private static readonly PRODUCT_PAGE_UKNOWN: number = -1;

    private static readonly PRODUCT_PAGE_SHAMPOO: number = 0;

    private static readonly PRODUCT_PAGE_CUSTOM_PART: number = 1;

    private static readonly PRODUCT_PAGE_CUSTOM_PART_SHAMPOO: number = 2;

    private static readonly PRODUCT_PAGE_SADDLE: number = 3;

    // Furniture categories, as in UseProductView (AS3 writes them as `category - 13` offsets).
    private static readonly CATEGORY_SHAMPOO: number = 13;

    private static readonly CATEGORY_CUSTOM_PART: number = 14;

    private static readonly CATEGORY_CUSTOM_PART_SHAMPOO: number = 15;

    private static readonly CATEGORY_SADDLE: number = 16;

    private static readonly PREVIEW_DIRECTION: number = 90;

    private static readonly PREVIEW_SCALE: number = 64;

    // AS3: UseProductConfirmationView.as::_window
    private _window: IFrameWindow | null = null;
    // AS3: UseProductConfirmationView.as::disposed (obfuscated `_SafeStr_5769`; named from its getter)
    private _disposed: boolean = false;
    // AS3: UseProductConfirmationView.as::_widget (obfuscated `_SafeStr_4549`)
    private _widget: AvatarInfoWidget;
    // AS3: UseProductConfirmationView.as::_windowManager
    private _windowManager: IHabboWindowManager;
    // AS3: UseProductConfirmationView.as::_assets
    private _assets: IAssetLibrary | null;

    // AS3: UseProductConfirmationView.as::requestObjectId (obfuscated `_SafeStr_7216`)
    private _requestObjectId: number = -1;
    // AS3: UseProductConfirmationView.as::targetRoomObjectId (obfuscated `_SafeStr_6863`)
    private _targetRoomObjectId: number = -1;
    // AS3: UseProductConfirmationView.as::_pendingImageId (obfuscated `_SafeStr_7581`; named
    // from imageReady(), which only accepts the id stored here)
    private _pendingImageId: number = 0;
    // AS3: UseProductConfirmationView.as::_furnitureData (obfuscated `_SafeStr_5194`)
    private _furnitureData: IFurnitureData | null = null;
    // AS3: UseProductConfirmationView.as::_petData (obfuscated `_SafeStr_4853`)
    private _petData: IUserData | null = null;

    // AS3: UseProductConfirmationView.as::UseProductConfirmationView()
    constructor(widget: AvatarInfoWidget)
    {
        this._widget = widget;
        this._windowManager = widget.windowManager;
        this._assets = widget.assets;
    }

    // AS3: UseProductConfirmationView.as::get requestObjectId()
    public get requestObjectId(): number
    {
        return this._requestObjectId;
    }

    // AS3: UseProductConfirmationView.as::get targetRoomObjectId()
    public get targetRoomObjectId(): number
    {
        return this._targetRoomObjectId;
    }

    // DEVIATION: AS3 also maps the three monsterplant potion categories (20-22) to their pages —
    //   the RPG fork removed monsterplants, so they fall to the unsupported-category warning.
    // AS3: UseProductConfirmationView.as::open()
    // `objectId` is a room object id when the product is already placed, and a furniture *type*
    // id when it is still in the inventory — in the latter case the id sent on to the server is
    // the inventory strip id instead.
    public open(objectId: number, targetRoomObjectId: number, inventoryStripId: number): void
    {
        const container = this._widget.handler?.container ?? null;

        if(!container) return;

        const roomId = container.roomSession.roomId;
        const roomObject = container.roomEngine?.getRoomObject(
            roomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
        ) ?? null;

        if(roomObject)
        {
            this._furnitureData = this._widget.handler.getFurniData(roomObject);
            this._requestObjectId = roomObject.getId();
        }
        else
        {
            this._furnitureData = container.sessionDataManager?.getFloorItemData(objectId) ?? null;
            this._requestObjectId = inventoryStripId;
        }

        this._targetRoomObjectId = targetRoomObjectId;
        this._petData = container.roomSession.userDataManager.getUserDataByIndex(targetRoomObjectId);

        if(!this._furnitureData) return;

        let page = UseProductConfirmationView.PRODUCT_PAGE_UKNOWN;

        switch(this._furnitureData.category)
        {
            case UseProductConfirmationView.CATEGORY_SHAMPOO:
                page = UseProductConfirmationView.PRODUCT_PAGE_SHAMPOO;
                break;
            case UseProductConfirmationView.CATEGORY_CUSTOM_PART:
                page = UseProductConfirmationView.PRODUCT_PAGE_CUSTOM_PART;
                break;
            case UseProductConfirmationView.CATEGORY_CUSTOM_PART_SHAMPOO:
                page = UseProductConfirmationView.PRODUCT_PAGE_CUSTOM_PART_SHAMPOO;
                break;
            case UseProductConfirmationView.CATEGORY_SADDLE:
                page = UseProductConfirmationView.PRODUCT_PAGE_SADDLE;
                break;
            default:
                logger.warn(`[UseProductConfirmationView.open()] Unsupported furniture category: ${this._furnitureData.category}`);
        }

        this.setWindowContent(page);

        if(this._window)
        {
            this._window.center();
            this._window.visible = true;
        }
    }

    // DEVIATION: AS3 also registers the monsterplant title/name/rarity/description and revive
    //   parameters and picks one of three monsterplant frames — the RPG fork removed
    //   monsterplants, so the plain frame is always used.
    // AS3: UseProductConfirmationView.as::setWindowContent()
    private setWindowContent(page: number): void
    {
        const localizations = this._widget.localizations;
        const pet = this._petData;
        const furnitureData = this._furnitureData;

        if(!pet || !furnitureData) return;

        localizations?.registerParameter('useproduct.widget.title', 'name', pet.name);

        if(!this._window)
        {
            this._window = this._windowManager.buildWidgetLayout('use_product_widget_frame_xml') as IFrameWindow | null;

            if(!this._window) return;

            this.addClickListener('header_button_close');
        }

        localizations?.registerParameter('useproduct.widget.text.saddle', 'productName', furnitureData.localizedName);
        localizations?.registerParameter('useproduct.widget.text.custompart', 'productName', furnitureData.localizedName);
        localizations?.registerParameter('useproduct.widget.text.custompartshampoo', 'productName', furnitureData.localizedName);
        localizations?.registerParameter('useproduct.widget.text.shampoo', 'productName', furnitureData.localizedName);

        // The frame ships with a placeholder child; it is swapped for the product's own controller.
        this._window.content.removeChildAt(0);

        const content = this.createWindow(page);

        if(content) this._window.content.addChild(content);

        this._window.resizeToFitContent();

        if(page === UseProductConfirmationView.PRODUCT_PAGE_UKNOWN)
        {
            // AS3 throws here; an unknown category has already been logged in open(), and the
            // dialog is left as built rather than taking the client down.
            logger.warn(`Invalid type for use product confirmation content apply: ${page}`);

            return;
        }

        this.addClickListener('preview_image_region');
        this.addClickListener('save_button');
        this.addClickListener('cancel_text');

        this.updatePreviewImage(this.resolvePreviewImage(furnitureData));

        this._window.invalidate();
    }

    // DEVIATION: AS3 also builds the three monsterplant controllers — the RPG fork removed
    //   monsterplants.
    // AS3: UseProductConfirmationView.as::createWindow()
    private createWindow(page: number): IWindow | null
    {
        let assetName: string;

        switch(page)
        {
            case UseProductConfirmationView.PRODUCT_PAGE_SHAMPOO:
                assetName = 'use_product_controller_shampoo_xml';
                break;
            case UseProductConfirmationView.PRODUCT_PAGE_CUSTOM_PART:
                assetName = 'use_product_controller_custom_part_xml';
                break;
            case UseProductConfirmationView.PRODUCT_PAGE_CUSTOM_PART_SHAMPOO:
                assetName = 'use_product_controller_custom_part_shampoo_xml';
                break;
            case UseProductConfirmationView.PRODUCT_PAGE_SADDLE:
                assetName = 'use_product_controller_saddle_xml';
                break;
            default:
                // AS3 throws; the port logs and leaves the frame empty (see setWindowContent()).
                logger.warn(`Invalid type for Use Product View content creation: ${page}`);

                return null;
        }

        return this._windowManager.buildWidgetLayout(assetName);
    }

    // DEVIATION: AS3 also previews the three monsterplant products in their revived growth
    //   posture — the RPG fork removed monsterplants.
    // AS3: UseProductConfirmationView.as::resolvePreviewImage()
    private resolvePreviewImage(furnitureData: IFurnitureData | null): ImageBitmap | null
    {
        if(!furnitureData) return null;

        const roomEngine = this._widget.handler?.container?.roomEngine ?? null;
        const pet = this._petData;

        if(!roomEngine || !pet) return null;

        const figureData = new PetFigureData(pet.figure);
        const params = (furnitureData.customParams ?? '').split(' ');
        const productTypeId = parseInt(params[0], 10);
        const customParts: PetCustomPart[] = [];

        let result = null;

        switch(furnitureData.category)
        {
            case UseProductConfirmationView.CATEGORY_SHAMPOO:
            {
                if(params.length < 2)
                {
                    logger.warn(`[UseProductConfirmationView] Invalid custom params: ${params}`);
                    break;
                }

                // The shampoo names a colour *tag*; the palette shown is the one carrying that tag
                // for the breed the pet already has.
                const tag = params[1];
                const colors = roomEngine.getPetColorsByTag(productTypeId, tag) ?? [];
                const current = roomEngine.getPetColor(productTypeId, figureData.paletteId);

                let paletteId = 0;

                for(const color of colors)
                {
                    if(current && color.breed === current.breed)
                    {
                        paletteId = parseInt(color.id, 10);
                        break;
                    }
                }

                result = roomEngine.getPetImage(
                    figureData.typeId, paletteId, figureData.color,
                    new Vector3d(UseProductConfirmationView.PREVIEW_DIRECTION), UseProductConfirmationView.PREVIEW_SCALE, this, true, 0, figureData.customParts
                );
                break;
            }
            case UseProductConfirmationView.CATEGORY_CUSTOM_PART:
            {
                if(params.length < 4)
                {
                    logger.warn(`[UseProductConfirmationView] Invalid custom params: ${params}`);
                    break;
                }

                const layerIds = params[1].split(',');
                const partIds = params[2].split(',');
                const paletteIds = params[3].split(',');

                for(let i = 0; i < layerIds.length; i++)
                {
                    const layerId = parseInt(layerIds[i], 10);
                    const existing = figureData.getCustomPart(layerId);
                    // The pet keeps its own palette for that layer if it already has one.
                    const paletteId = existing ? existing.paletteId : parseInt(paletteIds[i], 10);

                    customParts.push(new PetCustomPart(layerId, parseInt(partIds[i], 10), paletteId));
                }

                result = roomEngine.getPetImage(
                    figureData.typeId, figureData.paletteId, figureData.color,
                    new Vector3d(UseProductConfirmationView.PREVIEW_DIRECTION), UseProductConfirmationView.PREVIEW_SCALE, this, true, 0, customParts
                );
                break;
            }
            case UseProductConfirmationView.CATEGORY_CUSTOM_PART_SHAMPOO:
            {
                if(params.length < 3)
                {
                    logger.warn(`[UseProductConfirmationView] Invalid custom params: ${params}`);
                    break;
                }

                const layerIds = params[1].split(',');
                const paletteIds = params[2].split(',');

                for(let i = 0; i < layerIds.length; i++)
                {
                    const layerId = parseInt(layerIds[i], 10);
                    const existing = figureData.getCustomPart(layerId);
                    // Recolours whatever part the pet already wears on that layer.
                    const partId = existing ? existing.partId : -1;

                    customParts.push(new PetCustomPart(layerId, partId, parseInt(paletteIds[i], 10)));
                }

                result = roomEngine.getPetImage(
                    figureData.typeId, figureData.paletteId, figureData.color,
                    new Vector3d(UseProductConfirmationView.PREVIEW_DIRECTION), UseProductConfirmationView.PREVIEW_SCALE, this, true, 0, customParts
                );
                break;
            }
            case UseProductConfirmationView.CATEGORY_SADDLE:
            {
                if(params.length < 4)
                {
                    logger.warn(`[UseProductConfirmationView] Invalid custom params: ${params}`);
                    break;
                }

                const layerIds = params[1].split(',');
                const partIds = params[2].split(',');
                const paletteIds = params[3].split(',');

                for(let i = 0; i < layerIds.length; i++)
                {
                    customParts.push(new PetCustomPart(
                        parseInt(layerIds[i], 10), parseInt(partIds[i], 10), parseInt(paletteIds[i], 10)
                    ));
                }

                // Every layer the saddle does not touch stays as the pet has it.
                for(const part of figureData.customParts)
                {
                    if(layerIds.indexOf(part.layerId.toString()) === -1) customParts.push(part);
                }

                result = roomEngine.getPetImage(
                    figureData.typeId, figureData.paletteId, figureData.color,
                    new Vector3d(UseProductConfirmationView.PREVIEW_DIRECTION), UseProductConfirmationView.PREVIEW_SCALE, this, true, 0, customParts
                );
                break;
            }
            default:
                logger.warn(`[UseProductConfirmationView] Unsupported furniture category: ${furnitureData.category}`);
        }

        if(!result) return null;

        this._pendingImageId = result.id;

        return result.data;
    }

    // AS3: UseProductConfirmationView.as::getRoomUserObject()
    private getRoomUserObject(roomObjectId: number): IRoomObject | null
    {
        const roomEngine = this._widget.handler?.container?.roomEngine ?? null;

        if(!roomEngine) return null;

        return roomEngine.getRoomObject(
            roomEngine.activeRoomId, roomObjectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
        );
    }

    // AS3: UseProductConfirmationView.as::imageReady()
    public imageReady(id: number, data: ImageBitmap | null): void
    {
        if(this._disposed) return;

        if(this._pendingImageId === id)
        {
            this.updatePreviewImage(data);
            this._pendingImageId = 0;
        }
    }

    // AS3: UseProductConfirmationView.as::imageFailed()
    public imageFailed(_id: number): void
    {
        // AS3 no-op.
    }

    // AS3: UseProductConfirmationView.as::updatePreviewImage()
    private updatePreviewImage(image: ImageBitmap | null): void
    {
        if(!this._window || !image) return;

        const target = this._window.findChildByName('preview_image') as IBitmapWrapperWindow | null;

        if(!target) return;

        const canvas = new OffscreenCanvas(target.width, target.height);
        const context = canvas.getContext('2d');

        if(!context) return;

        const background = (this._assets?.getAssetByName('use_product_preview_bg')?.content ?? null) as ImageBitmap | null;

        if(background) context.drawImage(background, 0, 0);

        context.drawImage(
            image,
            Math.round((target.width - image.width) / 2),
            Math.round((target.height - image.height) / 2)
        );

        target.bitmap = canvas.transferToImageBitmap();
        target.invalidate();
    }

    // AS3: UseProductConfirmationView.as::close()
    private close(): void
    {
        if(this._window) this._window.visible = false;
    }

    // AS3: UseProductConfirmationView.as::addClickListener()
    private addClickListener(name: string): void
    {
        const child = (this._window as IWindowContainer | null)?.findChildByName(name);

        child?.addEventListener(WindowMouseEvent.CLICK, this.onMouseClick);
    }

    // AS3: UseProductConfirmationView.as::onMouseClick()
    private onMouseClick = (event: WindowEvent): void =>
    {
        let message: RoomWidgetUseProductMessage | null = null;

        switch((event.window as IWindow | null)?.name)
        {
            case 'preview_image_region':
                // Clicking the preview re-selects the pet in the room behind the dialog.
                if(this._petData) this.selectItemFromRoom(this._petData.roomObjectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);
                break;
            case 'header_button_close':
            case 'cancel_text':
            case 'ok_button':
                this.close();
                break;
            case 'save_button':
                if(this._petData)
                {
                    message = new RoomWidgetUseProductMessage(
                        RoomWidgetUseProductMessage.PET_PRODUCT, this._requestObjectId, this._petData.webID
                    );
                }
                this.close();
                break;
        }

        if(message) this._widget.messageListener?.processWidgetMessage(message);
    };

    // AS3: UseProductConfirmationView.as::selectItemFromRoom()
    private selectItemFromRoom(objectId: number, category: number): boolean
    {
        const container = this._widget.handler?.container ?? null;
        const roomObject = this.findRoomObject(objectId, category);

        if(roomObject && container?.roomEngine)
        {
            container.roomEngine.selectRoomObject(container.roomSession.roomId, roomObject.getId(), category);

            return true;
        }

        return false;
    }

    // AS3: UseProductConfirmationView.as::findRoomObject()
    private findRoomObject(objectId: number, category: number): IRoomObject | null
    {
        const container = this._widget.handler?.container ?? null;

        if(!container?.roomEngine) return null;

        return container.roomEngine.getRoomObject(container.roomSession.roomId, objectId, category);
    }

    // AS3: UseProductConfirmationView.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: UseProductConfirmationView.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._window)
        {
            this._window.dispose();
            this._window = null;
        }

        this._disposed = true;
        this._furnitureData = null;
        this._petData = null;
    }
}
