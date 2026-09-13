/**
 * RoomToolsWidget
 *
 * @see sources/win63_version/habbo/ui/widget/roomtools/RoomToolsWidget.as
 *
 * Container for the RWE_ROOM_TOOLS widget: owns the toolbar icon strip and
 * the room-info popup, tracks visited-room history for back/forward
 * navigation, and forwards collapse/release/reuse lifecycle calls.
 */
import type {IWindow} from '@core/window/IWindow';
import {RoomWidgetBase} from '@habbo/ui/widget/RoomWidgetBase';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomDesktop} from '@habbo/ui/IRoomDesktop';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {RoomUI} from '@habbo/ui/RoomUI';
import type {GuestRoomData} from '@habbo/communication/messages/incoming/navigator/GuestRoomData';
import {StringUtil} from '@habbo/utils/StringUtil';
import type {RoomToolsWidgetHandler} from '@habbo/ui/handler/RoomToolsWidgetHandler';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import {WiredAchievementsUpdatedEvent} from '@habbo/roomevents/events/WiredAchievementsUpdatedEvent';
import {RoomToolsInfoCtrl} from './RoomToolsInfoCtrl';
import {RoomToolsToolbarCtrl} from './RoomToolsToolbarCtrl';
import {RoomVisitHistory} from './RoomVisitHistory';
import {PerkType} from '../../../communication/enum/PerkType';

export class RoomToolsWidget extends RoomWidgetBase
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::ROOM_VISIT_HISTORY
    private static readonly ROOM_VISIT_HISTORY: RoomVisitHistory = RoomVisitHistory.shared;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::_currentRoomName
    private _currentRoomName: string = '';
    private _toolbarCtrl: RoomToolsToolbarCtrl | null;
    private _infoCtrl: RoomToolsInfoCtrl | null;
    private _desktop: IRoomDesktop | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null;
    private _roomToolsTimer: ReturnType<typeof setTimeout> | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::RoomToolsWidget()
    constructor(handler: IRoomWidgetHandler, windowManager: IHabboWindowManager, assets: IAssetLibrary | null, roomUI: RoomUI)
    {
        super(handler, windowManager, assets, roomUI.localization);

        this.handler.widget = this;
        this._desktop = roomUI.desktop;
        this._freeFlowChat = roomUI.freeFlowChat;

        this._infoCtrl = new RoomToolsInfoCtrl(this, windowManager, assets);
        this._toolbarCtrl = new RoomToolsToolbarCtrl(this, windowManager, assets);
        this._toolbarCtrl.updateRoomHistoryButtons();
        this._toolbarCtrl.setChatHistoryButton(this._freeFlowChat !== null);

        const cameraLaunchPosition = roomUI.getProperty('camera.launch.ui.position');

        this._toolbarCtrl.setCameraButton(
            (this.handler.sessionDataManager?.isPerkAllowed(PerkType.CAMERA) ?? false)
			&& (StringUtil.isBlank(cameraLaunchPosition) || cameraLaunchPosition === 'room-menu')
        );
        this._toolbarCtrl.setLikeButton(this.handler.canRate);

        const roomEvents = this.handler.container?.userDefinedRoomEvents ?? null;

        this._toolbarCtrl.setAchievementsButton((roomEvents?.achievementsInRoom?.length ?? 0) > 0);
        roomEvents?.events.on(
            WiredAchievementsUpdatedEvent.WIRED_ACHIEVEMENTS_UPDATED,
            this._onAchievementsUpdated
        );

        this._toolbarCtrl.setCollapsed(
            (this.handler.sessionDataManager?.isNoob ?? true)
			|| !((this.handler.sessionDataManager?.uiFlags ?? 0) & 2)
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::onAchievementsUpdated()
    // A bound field rather than a method so dispose() can hand the same reference back to `off()`.
    private readonly _onAchievementsUpdated = (event: WiredAchievementsUpdatedEvent): void =>
    {
        this._toolbarCtrl?.setAchievementsButton(event.achievements.length > 0);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::dispose()
    public override dispose(): void
    {
        if(this._roomToolsTimer !== null)
        {
            clearTimeout(this._roomToolsTimer);
            this._roomToolsTimer = null;
        }

        // AS3's dispose() only nulls its own fields and leaves the listener attached. Here the
        // emitter belongs to HabboUserDefinedRoomEvents — a DI singleton outliving every room —
        // so an un-removed listener would keep firing into a disposed widget for the rest of
        // the session.
        this.handler.container?.userDefinedRoomEvents?.events.off(
            WiredAchievementsUpdatedEvent.WIRED_ACHIEVEMENTS_UPDATED,
            this._onAchievementsUpdated
        );

        this._toolbarCtrl?.dispose();
        this._toolbarCtrl = null;

        this._infoCtrl?.dispose();
        this._infoCtrl = null;

        this._freeFlowChat = null;
        this._desktop = null;

        super.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::updateRoomData()
    public updateRoomData(data: GuestRoomData): void
    {
        RoomToolsWidget.ROOM_VISIT_HISTORY.updateRoomName(data.flatId, data.roomName);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::storeRoomData()
    public storeRoomData(data: GuestRoomData): void
    {
        RoomToolsWidget.ROOM_VISIT_HISTORY.onRoomEntered(data.flatId, data.roomName);

        this._toolbarCtrl?.setLikeButton(this.handler.canRate);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::showRoomInfo()
    public showRoomInfo(isOwner: boolean, roomName: string, ownerLine: string, tags: string[] | null): void
    {
        if(!this._infoCtrl) return;

        this._currentRoomName = roomName;
        this._infoCtrl.showRoomInfo(isOwner, roomName, ownerLine, tags);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::enterNewRoom()
    // AS3's own parameter (`param1:int`, the entered room's flat id) is unused in its body too —
    // kept in the signature to match the caller's call shape.
    public enterNewRoom(_flatId: number): void
    {
        if(!this._toolbarCtrl || !this._infoCtrl) return;

        this._toolbarCtrl.disableRoomHistoryButtons();

        if(this._roomToolsTimer !== null)
        {
            clearTimeout(this._roomToolsTimer);
        }

        this._roomToolsTimer = setTimeout(() => this.roomButtonTimerEventHandler(), 2000);

        const tagsBorder = this._infoCtrl.window?.findChildByName('tags');

        if(tagsBorder) tagsBorder.visible = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::roomButtonTimerEventHandler()
    private roomButtonTimerEventHandler(): void
    {
        if(this._roomToolsTimer !== null)
        {
            clearTimeout(this._roomToolsTimer);
            this._roomToolsTimer = null;
        }

        this._toolbarCtrl?.updateRoomHistoryButtons();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::setCollapsed()
    public setCollapsed(value: boolean): void
    {
        this._toolbarCtrl?.setCollapsed(value);
        this._infoCtrl?.setToolbarCollapsed(value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::get handler()
    public get handler(): RoomToolsWidgetHandler
    {
        return this._handler as RoomToolsWidgetHandler;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::getIconLocation()
    public getIconLocation(name: string): IWindow | null
    {
        return this._toolbarCtrl?.window?.findChildByName(name) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::getWidgetAreaWidth()
    public getWidgetAreaWidth(): number
    {
        return this._toolbarCtrl?.right ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::getChatInputY()
    public getChatInputY(): number
    {
        if(!this._desktop) return 0;

        const chatInputWidget = this._desktop.getWidget('RWE_CHAT_INPUT_WIDGET') as {getChatInputY?: () => number} | null;

        return chatInputWidget?.getChatInputY?.() ?? 0;
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::getCurrentRoomZoomText()
     *
     * The *level*, not the scale: the table runs 0.5..16, so log2 plus one turns it into the 0..5
     * the toolbar shows. An unknown or non-positive scale reads as 1x, i.e. level 1.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::getCurrentRoomZoomText()
    public getCurrentRoomZoomText(): string
    {
        let scale = this._desktop !== null ? this._desktop.getCurrentRoomCanvasZoomScale() : Number.NaN;

        if(Number.isNaN(scale) || scale <= 0) scale = 1;

        return (Math.round(Math.log(scale) / Math.LN2) + 1).toString();
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::canZoomRoom()
    public canZoomRoom(direction: number): boolean
    {
        return this._desktop !== null && this._desktop.canZoomRoomCanvas(direction);
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::zoomRoom()
    public zoomRoom(direction: number): void
    {
        this._desktop?.zoomRoomCanvas(direction);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::getRoomToolbarRight()
    public getRoomToolbarRight(): number
    {
        return this._toolbarCtrl?.right ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::goToNextRoom()
    public goToNextRoom(): void
    {
        const entry = RoomToolsWidget.ROOM_VISIT_HISTORY.goForward();

        if(entry === null) return;

        this.handler.goToPrivateRoom(entry.flatId);
        this._toolbarCtrl?.disableRoomHistoryButtons();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::goToPreviousRoom()
    public goToPreviousRoom(): void
    {
        const entry = RoomToolsWidget.ROOM_VISIT_HISTORY.goBack();

        if(entry === null) return;

        this.handler.goToPrivateRoom(entry.flatId);
        this._toolbarCtrl?.disableRoomHistoryButtons();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::get roomHistory()
    public get roomHistory(): RoomVisitHistory
    {
        return RoomToolsWidget.ROOM_VISIT_HISTORY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::get freeFlowChat()
    public get freeFlowChat(): IHabboFreeFlowChat | null
    {
        return this._freeFlowChat;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::get currentRoomName()
    public get currentRoomName(): string
    {
        return this._currentRoomName;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as has no
    // `mainWindow` override (unlike InfoStandWidget, which explicitly tags its main
    // container "room_widget_infostand" for slot-based attachment). RoomToolsWidget
    // positions itself directly via RoomToolsToolbarCtrl.updatePosition() (absolute
    // coordinates relative to `_window.desktop`), so it doesn't need — and never had —
    // a layout-slot container to attach into. Falls through to RoomWidgetBase's
    // `mainWindow` (always null), which correctly skips the addWidgetWindow() call in
    // RoomDesktop.createWidget(). An earlier version of this port incorrectly added an
    // override here (copying the infostand pattern), causing a harmless but noisy
    // "No container found for widget: RWE_ROOM_TOOLS" warning since no
    // "room_widget_toolbar"-tagged slot exists anywhere.

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::release()
    public override release(): void
    {
        this._toolbarCtrl?.release();

        if(this._toolbarCtrl?.window) this._toolbarCtrl.window.visible = false;

        this._infoCtrl?.hide();

        super.release();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/roomtools/RoomToolsWidget.as::reuse()
    public override reuse(desktop: IRoomDesktop): void
    {
        super.reuse(desktop);

        this._desktop = desktop;

        if(this._toolbarCtrl?.window) this._toolbarCtrl.window.visible = true;
    }
}
