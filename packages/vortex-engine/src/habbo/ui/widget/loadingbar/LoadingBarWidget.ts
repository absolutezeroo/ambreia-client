import type EventEmitter from 'eventemitter3';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IRoomWidgetHandler} from '../../IRoomWidgetHandler';
import {RoomWidgetBase} from '../RoomWidgetBase';
import {RoomWidgetLoadingBarUpdateEvent} from '../events/RoomWidgetLoadingBarUpdateEvent';

const log = Logger.getLogger('habbo.ui.widget.loadingbar.LoadingBarWidget');

/**
 * The bar shown over the room while its resources are still loading.
 *
 * Hiding **destroys** the window rather than setting `visible = false`, so showing it again
 * rebuilds it — the same stateless pattern the room queue uses.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/loadingbar/LoadingBarWidget.as
 */
export class LoadingBarWidget extends RoomWidgetBase
{
    // AS3: .../widget/loadingbar/LoadingBarWidget.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../widget/loadingbar/LoadingBarWidget.as::_config
    // Held and read by nothing, in AS3 too — kept so the constructor's shape matches.
    private _config: IHabboConfigurationManager | null;

    // AS3: .../widget/loadingbar/LoadingBarWidget.as::LoadingBarWidget()
    constructor(
        handler: IRoomWidgetHandler,
        windowManager: IHabboWindowManager,
        assets: IAssetLibrary | null = null,
        localizations: IHabboLocalizationManager | null = null,
        config: IHabboConfigurationManager | null = null
    )
    {
        super(handler, windowManager, assets, localizations);

        this._config = config;
    }

    // AS3: .../widget/loadingbar/LoadingBarWidget.as::get mainWindow()
    // Not overridden in AS3 either — the bar centres itself and is never placed by the layout
    // manager, so the desktop must not be handed a window to position.
    override get mainWindow(): IWindow | null
    {
        return null;
    }

    // AS3: .../widget/loadingbar/LoadingBarWidget.as::registerUpdateEvents()
    override registerUpdateEvents(events: EventEmitter | null): void
    {
        if(events === null) return;

        events.on(RoomWidgetLoadingBarUpdateEvent.SHOW, this.onShowLoadingBar);
        events.on(RoomWidgetLoadingBarUpdateEvent.HIDE, this.onHideLoadingBar);

        super.registerUpdateEvents(events);
    }

    /**
     * AS3: .../widget/loadingbar/LoadingBarWidget.as::unregisterUpdateEvents()
     *
     * AS3 removes three listeners for two registrations: HIDE is unhooked twice, once against
     * `onShowLoadingBar` — a copy-paste that matches no registration and removes nothing. Kept,
     * because the extra call is inert and dropping it would be an invented correction; the port
     * writes it as the same no-op pair rather than a third `off`.
     */
    override unregisterUpdateEvents(events: EventEmitter | null): void
    {
        if(events === null) return;

        events.off(RoomWidgetLoadingBarUpdateEvent.SHOW, this.onShowLoadingBar);
        events.off(RoomWidgetLoadingBarUpdateEvent.HIDE, this.onShowLoadingBar);
        events.off(RoomWidgetLoadingBarUpdateEvent.HIDE, this.onHideLoadingBar);
    }

    // AS3: .../widget/loadingbar/LoadingBarWidget.as::dispose()
    override dispose(): void
    {
        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        this._config = null;

        super.dispose();
    }

    // AS3: .../widget/loadingbar/LoadingBarWidget.as::onShowLoadingBar()
    private onShowLoadingBar = (event: RoomWidgetLoadingBarUpdateEvent): void =>
    {
        if(event === null || event === undefined) return;

        if(event.type !== RoomWidgetLoadingBarUpdateEvent.SHOW) return;

        if(!this.createWindow() || this._window === null) return;

        this._window.visible = true;
        this._window.center();
    };

    // AS3: .../widget/loadingbar/LoadingBarWidget.as::onHideLoadingBar()
    // Destroys rather than hides — the next show rebuilds it.
    private onHideLoadingBar = (event: RoomWidgetLoadingBarUpdateEvent): void =>
    {
        if(event === null || event === undefined) return;

        if(event.type !== RoomWidgetLoadingBarUpdateEvent.HIDE) return;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }
    };

    /**
     * AS3: .../widget/loadingbar/LoadingBarWidget.as::createWindow()
     *
     * The window is raised by the height of its own `image` child before being shown: AS3 calls
     * `scale(0, -imageHeight)`, which is a *resize* by a delta, not a zoom. The effect is that
     * the frame ends up as tall as the bar minus the artwork, so the artwork overhangs.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/loadingbar/LoadingBarWidget.as::createWindow()
    private createWindow(): boolean
    {
        if(this._window !== null) return true;

        this._window = this.windowManager.buildWidgetLayout('room_loading_bar') as IWindowContainer | null;

        if(this._window === null || this._window === undefined)
        {
            log.warn('room_loading_bar did not build — the room will load without a progress bar');
            this._window = null;

            return false;
        }

        this._window.visible = false;

        // AS3 looks up the `region` child and then does nothing with it — an empty `if` body left
        // by whatever used to hook the click. The click handler it would have fed is dead too:
        // nothing ever assigns the sprite or the URL it opens.
        const image = this._window.findChildByName('image');

        if(image !== null)
        {
            this._window.scale(0, -Math.trunc(image.height));
        }

        return true;
    }
}
