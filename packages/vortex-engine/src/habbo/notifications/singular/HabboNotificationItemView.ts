import type {IUpdateReceiver} from '@core/runtime/IContext';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {OrderedMap} from '@core/utils/OrderedMap';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization';
import type {BadgeImageReadyEvent} from '@habbo/session/events/BadgeImageReadyEvent';
import {NotificationExtraDataKey} from '../NotificationExtraDataKey';
import type {HabboNotificationItem} from './HabboNotificationItem';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.notifications.singular.HabboNotificationItemView');

/**
 * One notification bubble on screen: its window, its four-state fade/display/swipe cycle, and
 * the vertical slide it performs when the bubbles above it come and go.
 *
 * The state machine is driven entirely from `update()`, which the view manager calls once per
 * frame with the elapsed milliseconds — there is no timer and no tween object. `ready` (state
 * IDLE) is how the manager learns the bubble is finished and can be disposed.
 *
 * Field names are recovered from
 * `sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as`,
 * which is the same class unobfuscated; the three the 2016 build does not have (the swipe-out
 * state, the toggle button, the slide target) are named after what they hold and said so at the
 * declaration.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as
 */
export class HabboNotificationItemView implements IUpdateReceiver
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::MAX_HEIGHT
    public static readonly MAX_HEIGHT: number = 70;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::SIDE_MARGIN
    public static readonly SIDE_MARGIN: number = 5;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::MOVE_DURATION_MS
    private static readonly MOVE_DURATION_MS: number = 220;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::STATE_IDLE
    private static readonly STATE_IDLE: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::STATE_FADE_IN
    private static readonly STATE_FADE_IN: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::STATE_DISPLAY
    private static readonly STATE_DISPLAY: number = 2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::STATE_FADE_OUT
    private static readonly STATE_FADE_OUT: number = 3;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::STATE_SWIPE_OUT
    private static readonly STATE_SWIPE_OUT: number = 4;

    /**
     * The default height an unconfigured view falls back to, matching the manager's own
     * fallback when `view.height` is missing from the config.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::HabboNotificationItemView() (literal 15)
    private static readonly DEFAULT_RESIZE_MARGIN: number = 15;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_localization
    private _localization: IHabboLocalizationManager | null;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_window
    private _window: IWindow | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_item
    private _item: HabboNotificationItem | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_hovering
    private _hovering: boolean = false;

    /**
     * The whole `styles` map, kept because AS3's constructor keeps it — and, like AS3's, never
     * read afterwards. The per-item style the view actually renders arrives resolved, on
     * `item.style`.
     */
    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_styleConfig
    private _styleConfig: OrderedMap<string, unknown> | null;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_viewConfig
    private _viewConfig: OrderedMap<string, unknown> | null;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_fadeInStart
    private _fadeInStart: number = 0;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_fadeOutStart
    private _fadeOutStart: number = 0;

    // Name DERIVED (`_SafeStr_6756`): absent from the 2016 build, which has no swipe-out state;
    // named after the state it accumulates for, alongside `_fadeInStart`/`_fadeOutStart`.
    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_SafeStr_6756
    private _swipeOutStart: number = 0;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_displayStart
    private _displayStart: number = 0;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_margin
    private _margin: number = 0;

    // Name DERIVED (`_targetMargin` in the primary tree, absent in 2016): the y the bubble is
    // sliding towards, which `animatePosition()` eases `_margin` into.
    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_targetMargin
    private _targetMargin: number = 0;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_blend
    private _blend: number = 0;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_resizeMargin
    private _resizeMargin: number = 0;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_windowMinHeight
    private _windowMinHeight: number = 0;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_state
    private _state: number = HabboNotificationItemView.STATE_IDLE;

    // Name DERIVED (`_SafeStr_9720`): absent from the 2016 build; the x `reposition()` records so
    // `adjustSwipeOut()` can offset from it.
    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_SafeStr_9720
    private _originalX: number = 0;

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_toggleButtonCallback
    private _toggleButtonCallback: ((paused: boolean) => void) | null = null;

    // Name DERIVED (`_SafeStr_6353`): absent from the 2016 build; whether the wired bubble's
    // toggle button currently reads "resume", i.e. the effect it controls is paused.
    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::_SafeStr_6353
    private _togglePaused: boolean = false;

    // TS-only: AS3 passes the method itself; a bound reference is needed to remove the listener.
    private readonly _onWindowEventBound = (event: WindowEvent, window: IWindow): void =>
        this.onWindowEvent(event, window);

    // TS-only: AS3 passes the method itself; a bound reference is needed to remove the listener.
    private readonly _onRoomViewResizedBound = (): void => this.reposition();

    // TS-only: AS3 passes the method itself; a bound reference is needed to remove the listener.
    private readonly _onToggleButtonClickedBound = (): void => this.onToggleButtonClicked();

    /**
     * @param localization Stored as AS3 does; its only reader was the `nft_opening` style, now removed
     * @param layout The `<layout>` document of this style's asset, already read from the library
     * @param windowManager Builds the window on desktop layer 1
     * @param styleConfig The whole `styles` map — see the field note
     * @param viewConfig This style's view timings (`view`, or the style's `customview` entry)
     * @param item The notification being displayed
     */
    // DEVIATION: AS3 also renders the `nft_opening` style (product image and rarity); the RPG fork
    //   removed NFT, and nothing produces that style any more.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::HabboNotificationItemView()
    constructor(
        localization: IHabboLocalizationManager | null,
        layout: Document | null,
        windowManager: IHabboWindowManager,
        styleConfig: OrderedMap<string, unknown> | null,
        viewConfig: OrderedMap<string, unknown> | null,
        item: HabboNotificationItem
    )
    {
        this._localization = localization;
        this._styleConfig = styleConfig;
        this._viewConfig = viewConfig;

        // AS3 returns early when the asset is not an XmlAsset, leaving a view with no window —
        // `disposed` reports that state, and the manager drops it on its next pass.
        if(layout === null) return;

        this._window = windowManager.buildFromXML(layout, 1);

        this._window.tags.push('notificationview');
        this._window.context.getDesktopWindow()?.addEventListener(WindowEvent.WE_RESIZED, this._onRoomViewResizedBound);
        this._window.procedure = this._onWindowEventBound;
        this._window.blend = 0;
        this._window.visible = false;

        const text = this.findByTag('notification_text') as ITextWindow | null;

        // The gap under the text is measured once, off the layout, and re-applied every time the
        // text is replaced — that is what lets a two-line notification grow without the bottom
        // padding collapsing.
        this._resizeMargin = text !== null
            ? this._window.height - (text as unknown as IWindow).bottom
            : HabboNotificationItemView.DEFAULT_RESIZE_MARGIN;

        this._windowMinHeight = this._window.height;
        this._margin = 4;
        this._targetMargin = this._margin;
        this._blend = 0;
        this._state = HabboNotificationItemView.STATE_IDLE;

        const styleName = item.style?.styleName ?? null;

        if(styleName === 'treasure_hunt')
        {
            this.showTreasureHuntNotification(item);
        }
        else if(styleName === 'wired')
        {
            this.showWiredNotification(item);
        }
        else
        {
            this.showNormalNotification(item);
        }
    }

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get disposed()
    get disposed(): boolean
    {
        return this._window === null;
    }

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get ready()
    get ready(): boolean
    {
        return this._state === HabboNotificationItemView.STATE_IDLE;
    }

    /**
     * Idle *or* fading out: the manager treats both as gone, so a bubble on its way out neither
     * holds a slot nor counts towards the duplicate threshold.
     */
    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get readyOrFading()
    get readyOrFading(): boolean
    {
        return this._state === HabboNotificationItemView.STATE_IDLE
            || this._state === HabboNotificationItemView.STATE_FADE_OUT;
    }

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get verticalPosition()
    get verticalPosition(): number
    {
        return this._margin;
    }

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get notificationId()
    get notificationId(): string | null
    {
        if(this._item === null) return null;

        return this._item.notificationId;
    }

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get content()
    get content(): string | null
    {
        return this._item?.content ?? null;
    }

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get styleName()
    get styleName(): string | null
    {
        if(this._item === null || this._item.style === null) return null;

        return this._item.style.styleName;
    }

    /**
     * Whether this bubble refuses to time out. A "stay" notification is dismissed by the user
     * (click, or the swipe-away tag) or by its producer calling `removeNotificationById()`.
     */
    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get staysVisible()
    get staysVisible(): boolean
    {
        return this._item !== null
            && this._item.style !== null
            && this._item.style.extraData !== null
            && NotificationExtraDataKey.STAY in this._item.style.extraData;
    }

    /**
     * The configured height rather than the window's own, so a bubble that grew to fit two lines
     * still occupies one slot in the stack. Falls back to the window when the view config has no
     * `height` — the wired view is the one that does.
     */
    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get height()
    get height(): number
    {
        if(this._viewConfig?.hasKey('height'))
        {
            return this.viewNumber('height', 0);
        }

        return this._window?.height ?? 0;
    }

    // AS3: .../src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get item()
    get item(): HabboNotificationItem | null
    {
        return this._item;
    }

    /**
     * Swaps in a badge bitmap that arrived after the bubble was built — the achievement and
     * badge notifications request theirs from the session data manager and get it later.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::replaceIcon()
    replaceIcon(event: BadgeImageReadyEvent): void
    {
        if(event.badgeId !== this._item?.style?.iconSrc) return;

        if(event.badgeImage != null)
        {
            this.setNotificationIcon(event.badgeImage as ImageBitmap);
        }
    }

    /**
     * Drives the fade-in / display / fade-out / swipe-out cycle, plus the vertical slide, which
     * runs in every state.
     *
     * @param deltaTime Milliseconds since the previous frame
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::update()
    update(deltaTime: number): void
    {
        this.animatePosition(deltaTime);

        switch(this._state)
        {
            case HabboNotificationItemView.STATE_FADE_IN:
            {
                this._fadeInStart += deltaTime;

                const fadeIn = this.viewNumber('time_fade_in', 0);

                if(this._fadeInStart > fadeIn)
                {
                    this.startDisplay();
                }

                this.adjustBlend(this._fadeInStart / fadeIn);
                break;
            }
            case HabboNotificationItemView.STATE_DISPLAY:
            {
                this._displayStart += deltaTime;

                if(this._displayStart > this.displayTime && !this._hovering && !this.staysVisible)
                {
                    this.startFadeOut();
                }

                break;
            }
            case HabboNotificationItemView.STATE_FADE_OUT:
            {
                this._fadeOutStart += deltaTime;

                const fadeOut = this.viewNumber('time_fade_out', 0);

                this.adjustBlend(1 - this._fadeOutStart / fadeOut);

                if(this._fadeOutStart > fadeOut)
                {
                    this.startIdling();
                }

                break;
            }
            case HabboNotificationItemView.STATE_SWIPE_OUT:
            {
                this._swipeOutStart += deltaTime;

                const swipeOut = this.viewNumber('time_swipe_out', 0);

                this.adjustSwipeOut(this._swipeOutStart / swipeOut);

                if(this._swipeOutStart > swipeOut)
                {
                    this.startIdling();
                }

                break;
            }
            default:
                break;
        }
    }

    /**
     * Takes the bubble down early. A no-op while it is already idle or fading, so the manager
     * can call it on a whole list without tracking which ones already went.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::remove()
    remove(): void
    {
        if(this._window === null
            || this._state === HabboNotificationItemView.STATE_IDLE
            || this._state === HabboNotificationItemView.STATE_FADE_OUT)
        {
            return;
        }

        this._hovering = false;

        this.startFadeOut();
    }

    /**
     * Pins the bubble to the desktop's right edge at `verticalPosition`, and re-reads the
     * desktop width — which is why a window resize only has to call this.
     *
     * @param verticalPosition The y to move to, or -1 to keep the current one
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::reposition()
    reposition(verticalPosition: number = -1): void
    {
        // A disposed window is not a null one, and its `context` **is** null — `WindowModel.dispose()`
        // clears it. The `WE_RESIZED` listener lives on the desktop window, so a resize can still
        // arrive here after this bubble has been taken down (a queued one does, during teardown).
        if(this._window === null || this._window.disposed) return;

        const desktop = this._window.context.getDesktopWindow();

        if(desktop === null) return;

        if(verticalPosition !== -1)
        {
            this._margin = verticalPosition;
            this._targetMargin = verticalPosition;
        }

        this._window.x = desktop.width - this._window.width - HabboNotificationItemView.SIDE_MARGIN;
        this._window.y = this._margin;
        this._originalX = this._window.x;
    }

    /**
     * Where this bubble should slide to. `update()` eases towards it rather than jumping, so a
     * bubble above it disappearing pulls the stack up smoothly.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::setVerticalTarget()
    setVerticalTarget(target: number): void
    {
        this._targetMargin = target;
    }

    /**
     * The window procedure. Three behaviours share it: the swipe-away hot zone, the hover pause,
     * and the click that runs the notification's internal link.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::onWindowEvent()
    onWindowEvent(event: WindowEvent, _window: IWindow): void
    {
        if(event === null) return;

        if(event.type === WindowMouseEvent.CLICK
            && (event.target?.tags.indexOf('slide_notification_away') ?? -1) !== -1)
        {
            if(!this.staysVisible)
            {
                this.startSwipeOut();
            }

            return;
        }

        if(event.type === WindowMouseEvent.OVER)
        {
            this._hovering = true;
        }
        else if(event.type === WindowMouseEvent.OUT)
        {
            this._hovering = false;
        }
        else if(event.type === WindowMouseEvent.CLICK)
        {
            if(this._item !== null)
            {
                this._item.executeUiLinks();

                if(!this.staysVisible)
                {
                    this.startFadeOut();
                }
            }
        }
    }

    /**
     * The treasure-hunt bubble carries its own artwork in the layout, shown only when the
     * notification brought no icon of its own.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::showTreasureHuntNotification()
    private showTreasureHuntNotification(item: HabboNotificationItem): void
    {
        const image = (this._window as unknown as IWindowContainer | null)?.findChildByName('treasure_hunt_image') ?? null;

        if(image !== null)
        {
            image.visible = item.style?.icon == null;
        }

        this.showNormalNotification(item);
    }

    /**
     * The wired bubble gets a stop/resume button when its producer passed a callback — that is
     * how the room's wired effects are paused from the notification itself.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::showWiredNotification()
    private showWiredNotification(item: HabboNotificationItem): void
    {
        const extraData = item.style?.extraData ?? null;

        if(extraData !== null && NotificationExtraDataKey.TOGGLE_BUTTON_CALLBACK in extraData)
        {
            this._toggleButtonCallback =
                extraData[NotificationExtraDataKey.TOGGLE_BUTTON_CALLBACK] as ((paused: boolean) => void);

            const button = this.findByTag('button');

            if(button !== null)
            {
                this._togglePaused = false;
                button.caption = '${notification.stop}';
                button.visible = true;
                button.addEventListener(WindowMouseEvent.CLICK, this._onToggleButtonClickedBound);
            }
        }

        this.showNormalNotification(item);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::onToggleButtonClicked()
    private onToggleButtonClicked(): void
    {
        // Ignored outside the display state: a bubble mid-fade is on its way out, and toggling
        // there would leave the producer's effect in a state nothing is showing.
        if(this._state !== HabboNotificationItemView.STATE_DISPLAY) return;

        const button = this.findByTag('button');

        if(button === null) return;

        this._togglePaused = !this._togglePaused;
        button.caption = this._togglePaused ? '${notification.resume}' : '${notification.stop}';

        this._toggleButtonCallback?.(this._togglePaused);
    }

    /**
     * The path every other style takes: text, then an icon from either a bitmap the producer
     * handed over or an asset URI the static bitmap loads itself.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::showNormalNotification()
    private showNormalNotification(item: HabboNotificationItem): void
    {
        this.setNotificationText(item.content);

        const iconAssetUri = item.style?.iconAssetUri ?? null;

        if(iconAssetUri === null)
        {
            this.setNotificationIcon(item.style?.icon ?? null);
        }
        else
        {
            const staticIcon = this.findByTag('notification_icon_static') as IStaticBitmapWrapperWindow | null;

            if(staticIcon !== null)
            {
                staticIcon.assetUri = iconAssetUri;
            }
        }

        this._item = item;

        this.reposition();
        this.startFadeIn();
    }

    /**
     * How long this bubble stays up: the producer's own override if it supplied one, otherwise
     * the view config's.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::get displayTime()
    private get displayTime(): number
    {
        const extraData = this._item?.style?.extraData ?? null;

        if(extraData !== null && NotificationExtraDataKey.TIME_DISPLAY in extraData)
        {
            return Number(extraData[NotificationExtraDataKey.TIME_DISPLAY]);
        }

        return this.viewNumber('time_display', 0);
    }

    /**
     * Sets the text, growing the window to fit it when the view config declares a height — the
     * declared height is the *minimum*, not the maximum, and the text field's own measured
     * height plus the layout's bottom margin decides the rest.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::setNotificationText()
    private setNotificationText(text: string | null): void
    {
        const textWindow = this.findByTag('notification_text') as ITextWindow | null;

        if(textWindow === null || text === null || this._window === null) return;

        if(this._viewConfig?.hasKey('height'))
        {
            // Zeroed first so the window shrinks back to whatever the text now needs, rather
            // than keeping the height of a longer message.
            this._window.height = 0;
            textWindow.text = text;
            (textWindow as unknown as IWindow).height = textWindow.textHeight + this._resizeMargin;

            if(this._window.height < this._windowMinHeight)
            {
                this._window.height = this._windowMinHeight;
            }
        }
        else
        {
            textWindow.text = text;
        }
    }

    /**
     * Centres the icon in its slot when it is smaller than the slot, and pads a non-square icon
     * out to a square otherwise — the window scales what it is given, so an unpadded portrait
     * badge would come out stretched.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::setNotificationIcon()
    private setNotificationIcon(icon: ImageBitmap | null): void
    {
        const iconWindow = this.findByTag('notification_icon') as IBitmapWrapperWindow | null;

        if(iconWindow === null) return;

        if(icon === null)
        {
            iconWindow.bitmap = null;

            return;
        }

        const slotWidth = (iconWindow as unknown as IWindow).width;
        const slotHeight = (iconWindow as unknown as IWindow).height;

        let canvasWidth: number;
        let canvasHeight: number;
        let offsetX = 0;
        let offsetY = 0;

        if(icon.width < slotWidth && icon.height < slotHeight)
        {
            canvasWidth = slotWidth;
            canvasHeight = slotHeight;
            offsetX = (slotWidth - icon.width) / 2;
            offsetY = (slotHeight - icon.height) / 2;
        }
        else if(icon.width < icon.height)
        {
            canvasWidth = icon.height;
            canvasHeight = icon.height;
            offsetX = (icon.height - icon.width) / 2;
        }
        else if(icon.width > icon.height)
        {
            canvasWidth = icon.width;
            canvasHeight = icon.width;
            offsetY = (icon.width - icon.height) / 2;
        }
        else
        {
            canvasWidth = icon.width;
            canvasHeight = icon.height;
        }

        iconWindow.bitmap = HabboNotificationItemView.padBitmap(icon, canvasWidth, canvasHeight, offsetX, offsetY);
    }

    /**
     * AS3 composes this with `BitmapData.copyPixels()` onto a transparent canvas; an
     * `ImageBitmap` cannot be drawn into directly, so the port goes through an
     * `OffscreenCanvas` and hands back a new `ImageBitmap`.
     *
     * `transferToImageBitmap()` is synchronous, which matters: the caller assigns the result
     * straight to the window, and an awaited `createImageBitmap()` would leave a frame with no
     * icon.
     */
    // TS-only: the Canvas equivalent of AS3's `new BitmapData(...)` + `copyPixels()`.
    private static padBitmap(
        source: ImageBitmap,
        width: number,
        height: number,
        offsetX: number,
        offsetY: number
    ): ImageBitmap | null
    {
        if(width <= 0 || height <= 0) return null;

        const canvas = new OffscreenCanvas(Math.ceil(width), Math.ceil(height));
        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.drawImage(source, Math.round(offsetX), Math.round(offsetY));

        return canvas.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::startFadeIn()
    private startFadeIn(): void
    {
        this._fadeInStart = 0;
        this._state = HabboNotificationItemView.STATE_FADE_IN;

        if(this._window !== null) this._window.visible = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::startFadeOut()
    private startFadeOut(): void
    {
        this._fadeOutStart = 0;
        this._state = HabboNotificationItemView.STATE_FADE_OUT;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::startSwipeOut()
    private startSwipeOut(): void
    {
        this._swipeOutStart = 0;
        this._state = HabboNotificationItemView.STATE_SWIPE_OUT;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::startDisplay()
    private startDisplay(): void
    {
        this._displayStart = 0;
        this._state = HabboNotificationItemView.STATE_DISPLAY;
    }

    /**
     * The terminal state. The window is hidden rather than disposed here — the manager notices
     * `ready` on its next pass and disposes the view then.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::startIdling()
    private startIdling(): void
    {
        this._state = HabboNotificationItemView.STATE_IDLE;

        if(this._window !== null) this._window.visible = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::adjustBlend()
    private adjustBlend(blend: number): void
    {
        this._blend = blend;

        if(this._blend > 1) this._blend = 1;

        if(this._blend < 0) this._blend = 0;

        if(this._window !== null) this._window.blend = this._blend;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::adjustSwipeOut()
    private adjustSwipeOut(progress: number): void
    {
        if(this._window === null) return;

        this._window.x = this._originalX + progress * this.viewNumber('distance_swipe_out', 0);
    }

    /**
     * Eases `_margin` towards `_targetMargin` with a quadratic ease-out over
     * `MOVE_DURATION_MS`, and always moves at least one pixel — without that floor a slide of a
     * few pixels would round to zero every frame and never arrive.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::animatePosition()
    private animatePosition(deltaTime: number): void
    {
        if(this._window === null || this._margin === this._targetMargin) return;

        const distance = this._targetMargin - this._margin;
        let progress = deltaTime / HabboNotificationItemView.MOVE_DURATION_MS;

        if(progress > 1) progress = 1;

        const eased = 1 - (1 - progress) * (1 - progress);
        let step = Math.round(distance * eased);

        if(step === 0)
        {
            step = distance > 0 ? 1 : -1;
        }

        if(Math.abs(step) >= Math.abs(distance))
        {
            this._margin = this._targetMargin;
        }
        else
        {
            this._margin += step;
        }

        this._window.y = this._margin;
    }

    /**
     * `<var value="1000"/>` parses as the string "1000" unless the asset declares a type, and
     * this config declares none — so every timing is read through here rather than cast at the
     * use site.
     */
    // TS-only: AS3's implicit `int(_viewConfig[...])` coercion, in one place.
    private viewNumber(key: string, fallback: number): number
    {
        const raw = this._viewConfig?.getValue(key) ?? null;

        if(raw === null) return fallback;

        const parsed = Number(raw);

        return Number.isFinite(parsed) ? parsed : fallback;
    }

    // TS-only: AS3 writes `IWindowContainer(_window).findChildByTag(...)` at every call site.
    private findByTag(tag: string): IWindow | null
    {
        return (this._window as unknown as IWindowContainer | null)?.findChildByTag(tag) ?? null;
    }

    /**
     * AS3 deviation, deliberate: the `WE_RESIZED` listener is removed here, which AS3 never does.
     * It is registered on the *desktop* window, not on this view's own, so disposing `_window`
     * cannot take it down — every notification ever shown would keep its view reachable and keep
     * repositioning a disposed window on each resize.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/singular/HabboNotificationItemView.as::dispose()
    dispose(): void
    {
        if(this._window !== null)
        {
            this._window.context.getDesktopWindow()?.removeEventListener(WindowEvent.WE_RESIZED, this._onRoomViewResizedBound);
            this._window.dispose();
            this._window = null;
        }

        if(this._item !== null)
        {
            this._item.dispose();
            this._item = null;
        }

        this._toggleButtonCallback = null;
        this._styleConfig = null;
        this._viewConfig = null;
        this._localization = null;

        log.trace('Notification view disposed');
    }
}
