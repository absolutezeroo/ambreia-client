import type {XmlAsset} from '@core/assets/XmlAsset';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';

import {
    UseFurnitureMessageComposer
} from '@habbo/communication/messages/outgoing/room/furniture/UseFurnitureMessageComposer';
import type {IContextMenuParentWidget} from '@habbo/ui/widget/contextmenu/IContextMenuParentWidget';
import {FurnitureContextInfoView} from '@habbo/ui/widget/furniture/contextmenu/FurnitureContextInfoView';
import type {FurnitureContextMenuWidget} from '@habbo/ui/widget/furniture/contextmenu/FurnitureContextMenuWidget';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.ui.widget.furniture.friendfurni.FriendFurniContextMenuView');

/**
 * FriendFurniContextMenuView
 *
 * The bubble that appears over a friendship furni: its own `friendfurni_menu` layout and a
 * single Use button, which is what starts the lock confirmation on the server (the panel
 * that then opens is `FriendFurniConfirmWidget`).
 *
 * `buttonEventProc` deliberately does *not* fall through to the base on a click: the base
 * handles hover tinting, and a click here is consumed and closes the bubble.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/friendfurni/FriendFurniContextMenuView.as
 */
export class FriendFurniContextMenuView extends FurnitureContextInfoView
{
    // AS3: .../friendfurni/FriendFurniContextMenuView.as::FriendFurniContextMenuView()
    constructor(widget: IContextMenuParentWidget)
    {
        super(widget);
    }

    // AS3: .../friendfurni/FriendFurniContextMenuView.as::updateWindow()
    protected override updateWindow(): void
    {
        if(this._widget === null || this._widget.assets === null || this._widget.windowManager === null) return;

        if(FurnitureContextInfoView._minimized)
        {
            this.activeView = this.getMinimizedView();

            return;
        }

        if(this._window === null || this._window.disposed)
        {
            const asset = this._widget.assets.getAssetByName('friendfurni_menu') as XmlAsset | null;

            if(asset === null || asset === undefined)
            {
                log.warn('Missing layout "friendfurni_menu" - the friendship-furni bubble cannot open');

                return;
            }

            this._window = this._widget.windowManager.buildFromXML(
                asset.content as unknown as string, 0
            ) as IWindowContainer | null;

            if(this._window === null) return;

            this._window.addEventListener(WindowMouseEvent.OVER, this.onMouseHoverEvent);
            this._window.addEventListener(WindowMouseEvent.OUT, this.onMouseHoverEvent);

            const minimize = this._window.findChildByName('minimize');

            if(minimize !== null)
            {
                minimize.addEventListener(WindowMouseEvent.CLICK, this.onMinimize);
                minimize.addEventListener(WindowMouseEvent.OVER, this.onMinimizeHover);
                minimize.addEventListener(WindowMouseEvent.OUT, this.onMinimizeHover);
            }
        }

        const buttons = this._window.findChildByName('buttons');

        if(buttons !== null)
        {
            buttons.procedure = this.buttonEventProc;
        }

        this._window.visible = false;

        this.activeView = this._window;

        // `_SafeStr_4722` in AS3, which this port calls `_mouseOver`: clearing it lets the
        // bubble reposition itself on the next pass instead of holding its frozen spot.
        this._mouseOver = false;
    }

    /**
     * Tints the minimise icon on hover. AS3 inherits this from `ContextInfoView`; this port
     * folded that method into a private `onMinimizedProc` on the *minimised* bubble, so the
     * normal window's copy lives here.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/contextmenu/ContextInfoView.as::onMinimizeHover()
    private onMinimizeHover = (event: WindowEvent, window: IWindow): void =>
    {
        const icon = (window as IWindowContainer).findChildByName?.('icon');

        if(icon)
        {
            icon.color = event.type === 'WME_OVER' ? 4282950861 : 16777215;
        }
    };

    /**
     * Use sends the generic use-furniture message; the server answers with the lock
     * confirmation, which a different widget owns.
     */
    // AS3: .../friendfurni/FriendFurniContextMenuView.as::buttonEventProc()
    protected override buttonEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(this.disposed || this._window === null || this._window.disposed) return;

        let consumed = false;

        if(event.type === 'WME_CLICK')
        {
            if(window?.name === 'button' && window.parent?.name === 'use')
            {
                const widget = this._widget as FurnitureContextMenuWidget | null;
                const objectId = this.roomObject?.getId() ?? -1;

                if(widget !== null && objectId !== -1)
                {
                    widget.handler?.container?.connection?.send(new UseFurnitureMessageComposer(objectId));
                }
            }

            consumed = true;
        }
        else
        {
            this.applyButtonHover(event, window);
        }

        if(consumed)
        {
            this._widget.removeView(this, false);
        }
    };
}
