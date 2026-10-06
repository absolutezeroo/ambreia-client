/**
 * UseProductView — the "use this on…" bubble raised over every pet a product can target.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/UseProductView.as
 *
 * One instance per candidate pet (AvatarInfoWidgetHandler::activateUseProductMenuForPets builds
 * the list, from either an inventory double-click or a click on the product already in the room).
 * The product's furniture category decides which single button the bubble shows; clicking it
 * opens UseProductConfirmationView for that pair. The RPG fork removed monsterplants: AS3's
 * revive / rebreed / fertilize modes are not ported.
 *
 * AS3 adaptation: the window's WME_OVER/WME_OUT listeners become one `procedure`, as in the
 * other pet bubbles.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {Logger} from '@core/utils/Logger';
import type {UseProductItem} from '../events/UseProductItem';
import {AvatarContextInfoButtonView} from './AvatarContextInfoButtonView';
import type {AvatarInfoWidget} from './AvatarInfoWidget';

const logger = Logger.getLogger('habbo.ui.widget.avatarinfo.UseProductView');

export class UseProductView extends AvatarContextInfoButtonView
{
    // AS3: UseProductView.as::MODE_NORMAL
    private static readonly MODE_NORMAL: number = 0;

    private static readonly MODE_SHAMPOO: number = 1;

    private static readonly MODE_CUSTOM_PART: number = 2;

    private static readonly MODE_CUSTOM_PART_SHAMPOO: number = 3;

    private static readonly MODE_SADDLE: number = 4;

    // Furniture categories the modes above map to. AS3 writes them as `category - 13` switch
    // offsets; the names come from the mode each one selects.
    private static readonly CATEGORY_SHAMPOO: number = 13;

    private static readonly CATEGORY_CUSTOM_PART: number = 14;

    private static readonly CATEGORY_CUSTOM_PART_SHAMPOO: number = 15;

    private static readonly CATEGORY_SADDLE: number = 16;

    // AS3: UseProductView.as::_mode
    private _mode: number = UseProductView.MODE_NORMAL;
    // AS3: UseProductView.as::_item (obfuscated `_SafeStr_5258`)
    private _item: UseProductItem | null = null;

    // AS3: UseProductView.as::UseProductView()
    constructor(widget: AvatarInfoWidget)
    {
        super(widget);
        this._autoHideEnabled = false;
    }

    // AS3: UseProductView.as::setup()
    public static setup(
        view: UseProductView,
        userId: number,
        userName: string,
        roomIndex: number,
        userType: number,
        item: UseProductItem
    ): void
    {
        if(!view) return;

        view._item = item;

        AvatarContextInfoButtonView.setupButtonView(view, userId, userName, roomIndex, userType, false);
    }

    // AS3: UseProductView.as::get objectId()
    public get objectId(): number
    {
        return this._item?.id ?? -1;
    }

    // AS3: UseProductView.as::get requestRoomObjectId()
    public get requestRoomObjectId(): number
    {
        return this._item?.requestRoomObjectId ?? -1;
    }

    // AS3: UseProductView.as::get widget()
    private get widget(): AvatarInfoWidget
    {
        return this._widget as AvatarInfoWidget;
    }

    // DEVIATION: AS3 also maps the three monsterplant potion categories (20-22) to their own
    //   modes — the RPG fork removed monsterplants, so they fall to the unsupported-category warning.
    // AS3: UseProductView.as::resolveMode()
    // The product may already be in the room (look it up as a room object) or still be in the
    // inventory (then requestRoomObjectId is a furniture *type* id, not a room object id).
    private resolveMode(): void
    {
        if(!this._item) return;

        const handler = this.widget.handler;
        const container = handler?.container ?? null;

        if(!container) return;

        const roomId = container.roomSession.roomId;
        const roomObject = container.roomEngine?.getRoomObject(
            roomId, this._item.requestRoomObjectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
        ) ?? null;

        let furniData: IFurnitureData | null;

        if(roomObject) furniData = handler.getFurniData(roomObject);
        else furniData = container.sessionDataManager?.getFloorItemData(this._item.requestRoomObjectId) ?? null;

        if(!furniData) return;

        this._mode = UseProductView.MODE_NORMAL;

        switch(furniData.category)
        {
            case UseProductView.CATEGORY_SHAMPOO:
                this._mode = UseProductView.MODE_SHAMPOO;
                break;
            case UseProductView.CATEGORY_CUSTOM_PART:
                this._mode = UseProductView.MODE_CUSTOM_PART;
                break;
            case UseProductView.CATEGORY_CUSTOM_PART_SHAMPOO:
                this._mode = UseProductView.MODE_CUSTOM_PART_SHAMPOO;
                break;
            case UseProductView.CATEGORY_SADDLE:
                this._mode = UseProductView.MODE_SADDLE;
                break;
            default:
                logger.warn(`[UseProductView.open()] Unsupported furniture category: ${furniData.category}`);
        }
    }

    // AS3: UseProductView.as::updateWindow()
    protected override updateWindow(): void
    {
        if(!this._widget.assets || !this._widget.windowManager) return;

        this.resolveMode();

        if(this.minimized)
        {
            const minimizedView = this.getMinimizedView();

            if(minimizedView) this.activeView = minimizedView;

            return;
        }

        if(!this._window)
        {
            this._window = this._widget.windowManager.buildWidgetLayout('use_product_menu', 0) as IWindowContainer | null;

            if(!this._window) return;

            this._window.procedure = this.windowProc;

            const minimize = this._window.findChildByName('minimize');

            if(minimize) minimize.procedure = this.onMinimize;
        }

        this._buttons = this._window.findChildByName('buttons') as IItemListWindow | null;

        if(this._buttons) this._buttons.procedure = this.buttonEventProc;

        const nameWindow = this._window.findChildByName('name') as ITextWindow | null;

        if(nameWindow) nameWindow.caption = this._userName;

        this._window.visible = false;
        this.activeView = this._window;
        this.updateButtons();
    }

    // DEVIATION: AS3 also shows the revive / rebreed / fertilize monsterplant buttons — the RPG
    //   fork removed monsterplants.
    // AS3: UseProductView.as::updateButtons()
    public updateButtons(): void
    {
        if(!this._window || !this._buttons) return;

        this._buttons.autoArrangeItems = false;

        const count = this._buttons.numListItems;

        for(let i = 0; i < count; i++)
        {
            const item = this._buttons.getListItemAt(i);

            if(item) item.visible = false;
        }

        switch(this._mode)
        {
            case UseProductView.MODE_NORMAL:
                this.showButton('use_product');
                break;
            case UseProductView.MODE_SHAMPOO:
                this.showButton('use_product_shampoo');
                break;
            case UseProductView.MODE_CUSTOM_PART:
                this.showButton('use_product_custom_part');
                break;
            case UseProductView.MODE_CUSTOM_PART_SHAMPOO:
                this.showButton('use_product_custom_part_shampoo');
                break;
            case UseProductView.MODE_SADDLE:
                // A pet that already wears a saddle gets the "replace" caption instead.
                if(this._item?.replace) this.showButton('replace_product_saddle');
                else this.showButton('use_product_saddle');
                break;
        }

        this._buttons.autoArrangeItems = true;
        this._buttons.visible = true;
    }

    // DEVIATION: AS3 also routes the three monsterplant buttons — the RPG fork removed monsterplants.
    // AS3: UseProductView.as::buttonEventProc()
    protected override buttonEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(this.disposed || !this._window || this._window.disposed) return;

        let close = false;

        if(event.type === 'WME_CLICK')
        {
            if(window.name === 'button' && this._item)
            {
                close = true;

                switch(window.parent?.name)
                {
                    case 'use_product':
                    case 'use_product_shampoo':
                    case 'use_product_custom_part':
                    case 'use_product_custom_part_shampoo':
                    case 'use_product_saddle':
                    case 'replace_product_saddle':
                        this.widget.showUseProductConfirmation(
                            this._item.requestRoomObjectId, this._item.targetRoomObjectId, this._item.requestInventoryStripId
                        );
                        break;
                }
            }
        }
        else
        {
            this.applyButtonHover(event, window);
        }

        if(close) this.widget.removeUseProductViews();
    };

    // AS3: UseProductView.as::updateWindow() — the WME_OVER/WME_OUT listeners on _window.
    private windowProc = (event: WindowEvent, window: IWindow): void =>
    {
        this.onMouseHoverEvent(event, window);
    };

    // AS3: UseProductView.as::changeMode()
    private changeMode(mode: number): void
    {
        this._mode = mode;
        this.updateButtons();
    }

    // AS3: UseProductView.as::dispose()
    public override dispose(): void
    {
        this._item?.dispose();
        this._item = null;

        super.dispose();
    }
}
