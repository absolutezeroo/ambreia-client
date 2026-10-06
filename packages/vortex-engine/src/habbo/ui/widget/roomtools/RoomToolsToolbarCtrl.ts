/**
 * RoomToolsToolbarCtrl
 *
 * @see sources/win63_version/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as
 *
 * The room-tools icon strip: settings/zoom/collapse/history/chat-history/
 * like/share/camera buttons, collapse-expand slide animation, and the
 * share-room popup with clipboard.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import {WindowUtils} from '@core/window/utils/WindowUtils';
import type {Component} from '@core/runtime/Component';
import type {Motion} from '@core/window/motion/Motion';
import {EaseOut} from '@core/window/motion/EaseOut';
import {MoveTo} from '@core/window/motion/MoveTo';
import {Queue} from '@core/window/motion/Queue';
import {Callback} from '@core/window/motion/Callback';
import {Motions} from '@core/window/motion/Motions';
import {RoomWidgetZoomToggleMessage} from '@habbo/ui/widget/messages/RoomWidgetZoomToggleMessage';
import {RoomToolsCtrlBase} from './RoomToolsCtrlBase';
import {RoomToolsHistory} from './RoomToolsHistory';
import type {RoomToolsWidget} from './RoomToolsWidget';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';

export class RoomToolsToolbarCtrl extends RoomToolsCtrlBase 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::TOOLBAR_EXPAND_TARGET_X
    private static readonly TOOLBAR_EXPAND_TARGET_X = 1;

    private static readonly TOOLBAR_COLLAPSE_TARGET_X = -130;

    private _history: RoomToolsHistory | null = null;

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::_disposed
    // The ctrl carries its own flag, separate from the base's: it is an update receiver, and a
    // receiver must be able to answer `disposed` for the context to drop it.
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::_isRegisteredForUpdates
    private _isRegisteredForUpdates: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::_zoomControlsPrimed
    // Name DERIVED (`_SafeStr_9622`): false until the first `updateZoomControls()` has written the
    // caption, so the three cache fields below are not trusted before then.
    private _zoomControlsPrimed: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::_cachedZoomText
    // Name DERIVED (`_SafeStr_9032`).
    private _cachedZoomText: string = '';

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::_cachedCanZoomIn
    // Name DERIVED (`_SafeStr_9978`).
    private _cachedCanZoomIn: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::_cachedCanZoomOut
    // Name DERIVED (`_SafeStr_10169`).
    private _cachedCanZoomOut: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::RoomToolsToolbarCtrl()
    constructor(widget: RoomToolsWidget, windowManager: IHabboWindowManager, assets: IAssetLibrary | null) 
    {
        super(widget, windowManager, assets);

        this._window = windowManager.buildWidgetLayout('room_tools_toolbar_xml') as IWindowContainer | null;

        if(this._window) 
        {
            this._window.procedure = this.onWindowEvent;
            this._window.addEventListener(WindowMouseEvent.OVER, this.onWindowEvent);
            this._window.addEventListener(WindowMouseEvent.OUT, this.onWindowEvent);
        }

        this.updateVisuals();
        this.ensureUpdateRegistration();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::get right()
    public get right(): number 
    {
        if(!this._window) return 0;

        if(this._collapsed) 
        {
            const expand = this._window.findChildByName('side_bar_expand');

            return expand ? expand.width - 5 : 0;
        }

        return this._window.width - 5;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::dispose()
    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    public override dispose(): void 
    {
        if(this._disposed) return;

        // AS3 unregisters first — the ctrl keeps ticking against a disposed window otherwise.
        this.removeUpdateRegistration();
        this.removeRoomMouseBlockRect();

        if(this._history) 
        {
            this._history.dispose();
            this._history = null;
        }

        const shareWindow = this._windowManager.getWindowByName('share_room_link') as IWindowContainer | null;

        shareWindow?.dispose();

        super.dispose();

        this._disposed = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::updateRoomHistoryButtons()
    public updateRoomHistoryButtons(): void
    {
        if(!this._window || !this._widget) return;

        const forward = this._window.findChildByName('button_history_forward');
        const back = this._window.findChildByName('button_history_back');
        const historyBtn = this._window.findChildByName('button_history');
        const roomHistory = this._widget.roomHistory;

        if(roomHistory.canGoForward())
        {
            forward?.enable();
        }
        else
        {
            forward?.disable();
        }

        if(!roomHistory.canGoBack())
        {
            back?.disable();
        }
        else
        {
            back?.enable();
        }

        if(roomHistory.length <= 1)
        {
            historyBtn?.disable();
        }
        else
        {
            historyBtn?.enable();
        }

        // AS3: if the history dropdown is currently open, it is repainted with the fresh order
        // and repositioned rather than left stale.
        if(this._history)
        {
            this._history.populate(roomHistory.getHistoryView());
            this.updatePosition();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::disableRoomHistoryButtons()
    public disableRoomHistoryButtons(): void 
    {
        this._window?.findChildByName('button_history_forward')?.disable();
        this._window?.findChildByName('button_history_back')?.disable();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::release()
    public release(): void 
    {
        if(this._history) 
        {
            this.toggleHistory();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::setChatHistoryButton()
    public setChatHistoryButton(visible: boolean): void 
    {
        this.setElementVisible('button_chat_history', visible);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::setAchievementsButton()
    public setAchievementsButton(visible: boolean): void
    {
        this.setElementVisible('button_achievements', visible);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::setCameraButton()
    public setCameraButton(visible: boolean): void 
    {
        this.setElementVisible('button_camera', visible);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::setLikeButton()
    public setLikeButton(visible: boolean): void 
    {
        this.setElementVisible('button_like', visible);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::setElementVisible()
    public override setElementVisible(name: string, visible: boolean): void 
    {
        if(!this._window) return;

        this._window.visible = true;
        super.setElementVisible(name, visible);
        this.updatePosition();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::updatePosition()
    public updatePosition(): void 
    {
        if(!this._window) return;

        if(this._collapsed) 
        {
            const expand = this._window.findChildByName('side_bar_expand');

            if(expand) expand.y = this._window.height - expand.height;
        }
        else 
        {
            const arrowCollapse = this._window.findChildByName('arrow_collapse');
            const itemList = this._window.findChildByName('itemlist_buttons') as IItemListWindow | null;
            const sideBarCollapse = this._window.findChildByName('side_bar_collapse');
            const windowBg = this._window.findChildByName('window_bg');

            let total = 0;

            if(itemList) 
            {
                for(let i = 0; i < itemList.numListItems; i++) 
                {
                    const item = itemList.getListItemAt(i);

                    if(item?.visible) 
                    {
                        total += item.height;
                    }
                }
            }

            if(sideBarCollapse) sideBarCollapse.height = total;

            this._window.height = total;

            if(itemList) itemList.height = total;
            if(windowBg) windowBg.height = total;

            if(arrowCollapse) arrowCollapse.y = total * 0.5 - arrowCollapse.height * 0.5;
        }

        const desktopHeight = this._window.desktop?.height ?? 0;

        this._window.position = {
            x: RoomToolsCtrlBase.TOOLBAR_X,
            y: desktopHeight - RoomToolsCtrlBase.DISTANCE_FROM_BOTTOM - this._window.height
        };

        const historyWindow = this._history?.window;

        if(historyWindow) 
        {
            historyWindow.position = {
                x: this.right - historyWindow.width,
                y: this._window.position.y - historyWindow.height,
            };
        }

        this.updateRoomMouseBlockRect();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::set visible()
    // The override exists for the two calls below it: the base setter only flips the window.
    public override set visible(value: boolean)
    {
        if(!this._window) return;

        this._window.visible = value;

        if(value) this.updatePosition();
        else this.removeRoomMouseBlockRect();
    }

    /**
	 * Tells the room engine to swallow mouse events over the toolbar, so a click on it does
	 * not also reach the room underneath. Re-read on every reposition, and dropped whenever
	 * the toolbar is hidden or its background has no size.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::updateRoomMouseBlockRect()
    private updateRoomMouseBlockRect(): void
    {
        const roomEngine = this.handler?.container?.roomEngine ?? null;

        if(!this._window || !this._window.visible || !roomEngine)
        {
            this.removeRoomMouseBlockRect();

            return;
        }

        const background = this._window.findChildByName('window_bg');

        if(!background || !background.visible || background.width <= 0 || background.height <= 0)
        {
            this.removeRoomMouseBlockRect();

            return;
        }

        const rect = {x: 0, y: 0, width: 0, height: 0};

        background.getGlobalRectangle(rect);

        if(rect.width <= 0 || rect.height <= 0)
        {
            this.removeRoomMouseBlockRect();

            return;
        }

        roomEngine.setMouseEventsDisabledRect('room_tools_toolbar', rect);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::removeRoomMouseBlockRect()
    private removeRoomMouseBlockRect(): void
    {
        this.handler?.container?.roomEngine?.removeMouseEventsDisabledRect('room_tools_toolbar');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::setCollapsed()
    public override setCollapsed(value: boolean): void 
    {
        if(this._collapsed === value || !this._window) return;

        this._collapsed = value;

        const windowBg = this._window.findChildByName('window_bg');

        if(!windowBg) return;

        if(this._collapsed) 
        {
            const motion = new Queue(
                new EaseOut(new MoveTo(windowBg, 100, RoomToolsToolbarCtrl.TOOLBAR_COLLAPSE_TARGET_X, windowBg.y), 1),
                new Callback(this.motionComplete)
            );

            Motions.runMotion(motion);
        }
        else 
        {
            windowBg.x = RoomToolsToolbarCtrl.TOOLBAR_COLLAPSE_TARGET_X;
            this.updateVisuals();

            const motion = new EaseOut(new MoveTo(windowBg, 100, RoomToolsToolbarCtrl.TOOLBAR_EXPAND_TARGET_X, windowBg.y), 1);

            Motions.runMotion(motion);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::toggleHistory()
    private toggleHistory(): void 
    {
        if(this._history) 
        {
            this._history.dispose();
            this._history = null;

            return;
        }

        if(!this.handler || !this._widget) return;

        this._history = new RoomToolsHistory(this._windowManager, this._assets, this.handler);
        this._history.populate(this._widget.roomHistory.getHistoryView());
        this.updatePosition();
    }

    // AS3: sources/win63_version/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::motionComplete()
    private motionComplete = (_motion: Motion): void => 
    {
        this.updateVisuals();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::updateVisuals()
    private updateVisuals(): void 
    {
        const windowBg = this._window?.findChildByName('window_bg');

        if(!this._window || !windowBg) return;

        windowBg.visible = !this._collapsed;

        const sideBarCollapse = this._window.findChildByName('side_bar_collapse');
        const sideBarExpand = this._window.findChildByName('side_bar_expand');

        if(sideBarCollapse) sideBarCollapse.visible = !this._collapsed;
        if(sideBarExpand) sideBarExpand.visible = this._collapsed;

        this.updatePosition();
        this.updateZoomControls();
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::update()
     *
     * Registered as an update receiver, so this runs every frame. AS3's body also drives the
     * collapse easing by hand; this port animates that through `Motions` instead, so only the zoom
     * half is here — and that half is *why* the ctrl is registered at all: nothing notifies it when
     * the room canvas zooms, so it polls.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::update()
    public update(_deltaTime: number): void
    {
        this.updateZoomControls();
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::updateZoomControls()
     *
     * Writes the `Zoom level: %zoom_level%` caption and greys the +/- buttons at the ends of the
     * scale table. Called once per frame, hence the four-field cache: without it this would
     * re-resolve a localization and walk two window subtrees on every tick.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::updateZoomControls()
    private updateZoomControls(): void
    {
        if(!this._window || !this._widget) return;

        const zoomText = this._window.findChildByName('zoom_text') as ITextWindow | null;
        const canZoomIn = this._widget.canZoomRoom(1);
        const canZoomOut = this._widget.canZoomRoom(-1);
        const caption = this._widget.getCurrentRoomZoomText();

        if(
            this._zoomControlsPrimed
            && caption === this._cachedZoomText
            && canZoomIn === this._cachedCanZoomIn
            && canZoomOut === this._cachedCanZoomOut
        )
        {
            return;
        }

        if(zoomText)
        {
            zoomText.caption = this._widget.localizations?.registerParameter(
                'room.zoom.text', 'zoom_level', caption
            ) ?? caption;
        }

        const zoomIn = this._window.findChildByName('zoom_in_btn');
        const zoomOut = this._window.findChildByName('zoom_out_btn');

        if(zoomIn) WindowUtils.disableSection(zoomIn, !canZoomIn);
        if(zoomOut) WindowUtils.disableSection(zoomOut, !canZoomOut);

        this._zoomControlsPrimed = true;
        this._cachedZoomText = caption;
        this._cachedCanZoomIn = canZoomIn;
        this._cachedCanZoomOut = canZoomOut;
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::ensureUpdateRegistration()
     *
     * The update component is the **room engine** — AS3 casts it to Component and registers there,
     * so the ctrl ticks for exactly as long as there is a room engine to zoom.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::ensureUpdateRegistration()
    private ensureUpdateRegistration(): void
    {
        const component = this.getUpdateComponent();

        if(!this._isRegisteredForUpdates && component !== null)
        {
            component.registerUpdateReceiver(this, 1);
            this._isRegisteredForUpdates = true;
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::removeUpdateRegistration()
    private removeUpdateRegistration(): void
    {
        const component = this.getUpdateComponent();

        if(this._isRegisteredForUpdates && component !== null)
        {
            component.removeUpdateReceiver(this);
        }

        this._isRegisteredForUpdates = false;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::getUpdateComponent()
    private getUpdateComponent(): Component | null
    {
        const roomEngine = this.handler?.container?.roomEngine ?? null;

        return (roomEngine as unknown as Component | null) ?? null;
    }

    // DEVIATION: AS3's `button_camera` raises CAMERA_TOGGLE and `button_like` rates the room; the
    //   RPG fork removed photos and room voting, and keeps both buttons hidden.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::onWindowEvent()
    private onWindowEvent = (event: WindowEvent, target: IWindow): void => 
    {
        if(event.type === 'WE_PARENT_RESIZED' && this._window && this._window.parent && event.target === this._window.parent) 
        {
            this.updatePosition();

            return;
        }

        if(event.type !== WindowMouseEvent.CLICK) return;

        this.clearCollapseTimer();

        switch(target.name) 
        {
            case 'button_settings':
                this.handler?.toggleRoomInfoWindow();
                break;
            case 'zoom_in_btn':
                this._widget?.zoomRoom(1);
                this.updateZoomControls();
                break;
            case 'zoom_out_btn':
                this._widget?.zoomRoom(-1);
                this.updateZoomControls();
                break;
            case 'button_zoom':
                this._widget?.messageListener?.processWidgetMessage(new RoomWidgetZoomToggleMessage());
                break;
            case 'button_collapse':
            case 'button_expand':
                this._widget?.setCollapsed(!this._collapsed);
                this.handler?.sessionDataManager?.setRoomToolsState(!this._collapsed);
                break;
            case 'button_history_back':
                this._widget?.goToPreviousRoom();
                break;
            case 'button_history_forward':
                this._widget?.goToNextRoom();
                break;
            case 'button_history':
                this.toggleHistory();
                break;
            case 'button_chat_history':
                this._widget?.freeFlowChat?.toggleVisibility();
                break;
            // AS3: `(handler.container.roomEngine as Component).context.createLinkEvent(
            // "questengine/achievements/wired_games")`. `IRoomEngine` declares no `context` in
            // either tree, so the same cast `FurnitureRoomLinkHandler.navigateTo()` documents is
            // used here. Without this case the entry simply did not react to a click.
            case 'button_achievements':
            {
                const context = (this.handler?.container?.roomEngine as unknown as {context?: {
                    createLinkEvent(link: string): void;
                }} | null)?.context ?? null;

                context?.createLinkEvent('questengine/achievements/wired_games');
                break;
            }

            case 'button_share':
                this.onShareClick();
                break;
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::onWindowEvent() (button_share branch)
    private onShareClick(): void 
    {
        if(!this._widget) return;

        let shareWindow = this._windowManager.getWindowByName('share_room_link') as IWindowContainer | null;

        if(!shareWindow) 
        {
            shareWindow = this._windowManager.buildWidgetLayout('share_room_xml') as IWindowContainer | null;
        }

        if(shareWindow) 
        {
            this.handler?.container?.habboTracking?.trackEventLog('RoomLink', 'click', 'client.room_link.clicked');

            shareWindow.name = 'share_room_link';
            shareWindow.center();

            const closeButton = shareWindow.findChildByTag('close');

            closeButton?.addEventListener(WindowMouseEvent.CLICK, () => shareWindow?.dispose());

            const embedTxt = shareWindow.findChildByName('embed_src_txt');
            const embedDirectTxt = shareWindow.findChildByName('embed_src_direct_txt');
            const thumbnail = shareWindow.findChildByName('thumbnail_image') as IStaticBitmapWrapperWindow | null;

            if(embedTxt) embedTxt.caption = this.getEmbedData();
            if(embedDirectTxt) embedDirectTxt.caption = this.getEmbedData('embed_src_direct_txt', '${url.prefix}/room/%roomId%');
            if(thumbnail) 
            {
                const thumbnailUrl = this.getThumbnailUrl();

                if(thumbnailUrl) thumbnail.assetUri = thumbnailUrl;
            }
        }

        void navigator.clipboard?.writeText(this.getEmbedData()).catch(() => 
        {
            // AS3: System.setClipboard() has no browser equivalent guarantee outside a
            // user gesture / secure context — swallow to match AS3's try/catch no-op.
        });
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::getEmbedData()
    private getEmbedData(_key: string = 'navigator.embed.src', fallback: string = ''): string 
    {
        const navigatorRef = this.handler?.navigator;
        const guestRoom = navigatorRef?.enteredGuestRoomData ?? null;
        const roomType = guestRoom ? 'private' : null;
        const flatId = guestRoom ? String(guestRoom.flatId) : null;
        const config = this.handler?.container?.config ?? null;
        const embedCode = config?.getProperty('user.hash') ?? '';
        const localizations = this._widget?.localizations;
        const key = 'navigator.embed.src';

        if(localizations?.hasLocalization(key)) 
        {
            localizations.registerParameter(key, 'roomType', roomType ?? '');
            localizations.registerParameter(key, 'embedCode', embedCode);
            localizations.registerParameter(key, 'roomId', flatId ?? '');

            return localizations.getLocalization(key, fallback);
        }

        if(fallback !== '') 
        {
            const urlPrefix = config?.getProperty('url.prefix') ?? '';

            return fallback.replace('${url.prefix}', urlPrefix).replace('%roomId%', flatId ?? '');
        }

        return localizations?.getLocalization(key, fallback) ?? fallback;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsToolbarCtrl.as::getThumbnailUrl()
    private getThumbnailUrl(): string | null 
    {
        const guestRoom = this.handler?.navigator?.enteredGuestRoomData ?? null;

        if(!guestRoom) return null;

        const config = this.handler?.container?.config ?? null;

        if(guestRoom.officialRoomPicRef !== null) 
        {
            if(config?.getBoolean('new.navigator.official.room.thumbnails.in.amazon')) 
            {
                const base = config?.getProperty('navigator.thumbnail.url_base') ?? '';

                return `${base}${guestRoom.flatId}.png`;
            }

            return `${config?.getProperty('image.library.url') ?? ''}${guestRoom.officialRoomPicRef}`;
        }

        const base = config?.getProperty('navigator.thumbnail.url_base') ?? '';

        return `${base}${guestRoom.flatId}.png`;
    }
}
