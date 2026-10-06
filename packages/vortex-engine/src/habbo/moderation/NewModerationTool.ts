/**
 * NewModerationTool — the hidden joke mod tool, unlocked by a passphrase rather than by rank.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/moderation/_SafeCls_1981.as
 *
 * The class is `_SafeCls_1981` in every tree; the name is recovered from `ModerationManager`'s own
 * `attachComponent(..., [new IIDNewModerationTool()])`, which the obfuscator left readable.
 *
 * **Nothing here moderates anything.** It is a prank surface: five panels that mimic the real staff
 * tools and then refuse, error, or play music instead. What it actually does is hand out the ADM
 * badge and send two badge codes.
 *
 * How it opens:
 *
 * - A hotel **broadcast** whose text contains "MODERATOR privileges" (the literal is XOR-0x2A
 *   obfuscated in AS3 and rebuilt here the same way), or
 * - a **whisper** with `styleId == 34`, but only inside the one room whose `owner-roomname` MD5s to
 *   a hard-coded digest.
 *
 * The passphrase doubles as the payload: `findCodes()` takes the first and second character of every
 * word in it, giving two acrostics. Code 1 is sent once all five panels have been played with; code
 * 2 is sent on close, but only if none of them were. So the two codes reward opposite behaviours,
 * and closing the window immediately is itself an outcome — which is why `onWindowClose()` tests
 * `_toolCompletionFlags == 0` rather than ignoring it.
 *
 * `receiveModeratorPrivileges()` needs *both* codes non-empty, so a passphrase of single-character
 * words unlocks nothing.
 */
import {Component} from '@core/runtime/Component';
import {ComponentDependency} from '@core/runtime/ComponentDependency';
import type {IContext} from '@core/runtime/IContext';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {XmlAsset} from '@core/assets/XmlAsset';
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import {OrderedMap} from '@core/utils/OrderedMap';
import {Logger} from '@core/utils/Logger';

import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';

import {
    HabboBroadcastMessageEvent
} from '@habbo/communication/messages/incoming/notifications/HabboBroadcastMessageEvent';
import {WhisperMessageEvent} from '@habbo/communication/messages/incoming/room/chat/WhisperMessageEvent';
import {
    IsBadgeRequestFulfilledEvent
} from '@habbo/communication/messages/incoming/inventory/badges/IsBadgeRequestFulfilledEvent';
import {RequestABadgeComposer} from '@habbo/communication/messages/outgoing/inventory/RequestABadgeComposer';

import {MD5} from '../../hurlant/crypto/hash/MD5';
import {Hex} from '../../hurlant/util/Hex';

import type {NewModToolSubView} from './new_mod_tool_tabs/NewModToolSubView';
import {BanSubView} from './new_mod_tool_tabs/BanSubView';
import {HotelAlertSubView} from './new_mod_tool_tabs/HotelAlertSubView';
import {SendWarningSubView} from './new_mod_tool_tabs/SendWarningSubView';
import {GiveCoinsSubView} from './new_mod_tool_tabs/GiveCoinsSubView';
import {GiveFurniSubView} from './new_mod_tool_tabs/GiveFurniSubView';

import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboNavigator} from '@iid/IIDHabboNavigator';
import {IID_HabboNotifications} from '@iid/IIDHabboNotifications';
import {IID_HabboSoundManager} from '@iid/IIDHabboSoundManager';
import {IID_HabboInventory} from '@iid/IIDHabboInventory';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.moderation.NewModerationTool');

export class NewModerationTool extends Component
{
    // AS3: _SafeCls_1981.as::MODERATION_BADGE_ID
    private static readonly MODERATION_BADGE_ID: number = -500;

    /** AS3 passes the literal `1` to `buildFromXML`/`getDesktop`. */
    // AS3: _SafeCls_1981.as::setWindowManager()
    private static readonly DESKTOP_WINDOW_LAYER: number = 1;

    /** The whisper style the room check is gated on. */
    // AS3: _SafeCls_1981.as::onWhisperMessageEvent()
    private static readonly SECRET_WHISPER_STYLE_ID: number = 34;

    /** MD5 of the `ownerName + "-" + roomName` that may open the tool by whisper. */
    // AS3: _SafeCls_1981.as::onWhisperMessageEvent()
    private static readonly SECRET_ROOM_DIGEST: string = '03d183500fc293e49b093df1bd53a6b2';

    /**
     * AS3 builds the passphrase at runtime from character codes XORed with 0x2A so it never appears
     * as a literal in the SWF. Rebuilt the same way here — writing out the plain string would put
     * back exactly what the obfuscation was there to remove.
     */
    // AS3: _SafeCls_1981.as::onMaybeOpenModTools()
    private static readonly PASSPHRASE_CODES: number[] = [
        103, 101, 110, 111, 120, 107, 126, 101, 120, 10, 90, 88, 67, 92, 67, 70, 79, 77, 79, 89
    ];

    // AS3: _SafeCls_1981.as::onMaybeOpenModTools()
    private static readonly PASSPHRASE_XOR: number = 0x2A;

    /** All five panels done — `(_toolCompletionFlags & 0x1F) == 31` in AS3. */
    // AS3: _SafeCls_1981.as::setToolCompletion()
    private static readonly ALL_TOOLS_COMPLETE: number = 0x1F;

    // AS3: _SafeCls_1981.as::_communicationManager
    private _communicationManager: IHabboCommunicationManager | null = null;

    // AS3: _SafeCls_1981.as::_localizationManager
    private _localizationManager: IHabboLocalizationManager | null = null;

    // AS3: _SafeCls_1981.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    // AS3: _SafeCls_1981.as::_inventory
    private _inventory: IHabboInventory | null = null;

    // AS3: _SafeCls_1981.as::_notifications
    private _notifications: IHabboNotifications | null = null;

    // AS3: _SafeCls_1981.as::_soundManager
    private _soundManager: IHabboSoundManager | null = null;

    // AS3: _SafeCls_1981.as::_navigator
    private _navigator: IHabboNavigator | null = null;

    // AS3: _SafeCls_1981.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: _SafeCls_1981.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: _SafeCls_1981.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];

    /** Derived name — `_SafeStr_5451`: the panels, keyed by their window, indexed by button id. */
    // AS3: _SafeCls_1981.as::_SafeStr_5451
    private _subViews: OrderedMap<IWindowContainer, NewModToolSubView> | null = null;

    // AS3: _SafeCls_1981.as::_active
    private _active: NewModToolSubView | null = null;

    // AS3: _SafeCls_1981.as::_secretCode1
    private _secretCode1: string = '';

    // AS3: _SafeCls_1981.as::_secretCode2
    private _secretCode2: string = '';

    /** Derived name — `_SafeStr_8130`: one bit per panel played with. */
    // AS3: _SafeCls_1981.as::_SafeStr_8130
    private _toolCompletionFlags: number = 0;

    /** Derived name — `_SafeStr_5769`, from `get disposed()`. */
    // AS3: _SafeCls_1981.as::_SafeStr_5769
    private _toolDisposed: boolean = false;

    /**
     * AS3 subscribes its three events in the constructor, where `addMessageEvent()` short-circuits
     * on a still-null communication manager and the subscriptions are silently lost. They are built
     * in `initComponent()` here instead — the first point at which the manager exists.
     */
    // AS3: _SafeCls_1981.as::_SafeCls_1981()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    // AS3: _SafeCls_1981.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communicationManager = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) =>
                {
                    this._sessionDataManager = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this.setWindowManager(manager);
                }
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localizationManager = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboInventory,
                (manager: IHabboInventory | null) =>
                {
                    this._inventory = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboNotifications,
                (manager: IHabboNotifications | null) =>
                {
                    this._notifications = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboNavigator,
                (manager: IHabboNavigator | null) =>
                {
                    this._navigator = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboSoundManager,
                (manager: IHabboSoundManager | null) =>
                {
                    this._soundManager = manager;
                },
                false
            ),
        ];
    }

    // AS3: _SafeCls_1981.as::initComponent()
    protected override initComponent(): void
    {
        this._messageEvents = [
            new HabboBroadcastMessageEvent(this.onBroadcastMessageEvent),
            new IsBadgeRequestFulfilledEvent(this.onBadgeRequestFulfilledEvent),
            new WhisperMessageEvent(this.onWhisperMessageEvent),
        ];

        for(const event of this._messageEvents) this.addMessageEvent(event);
    }

    /**
     * Takes the character at `index` of every word long enough to have one, in order. AS3 splits on
     * a single space, so consecutive spaces contribute empty words that are simply skipped by the
     * length test.
     */
    // AS3: _SafeCls_1981.as::charsAtWordIndexes()
    private static charsAtWordIndexes(source: string, index: number): string
    {
        let result: string = '';

        for(const word of source.split(' '))
        {
            if(word.length > index) result += word.charAt(index);
        }

        return result;
    }

    // AS3: _SafeCls_1981.as::onBroadcastMessageEvent()
    private onBroadcastMessageEvent = (event: IMessageEvent): void =>
    {
        const parser = (event as HabboBroadcastMessageEvent).getParser() as { messageText?: string } | null;
        const messageText = parser?.messageText ?? '';

        this.onMaybeOpenModTools(messageText);
    };

    /**
     * Only whispers sent inside the one room whose `owner-roomname` matches `SECRET_ROOM_DIGEST` are
     * considered, and only at style 34. Outside a guest room `enteredGuestRoomData` is null and the
     * whole check is skipped.
     */
    // AS3: _SafeCls_1981.as::onWhisperMessageEvent()
    private onWhisperMessageEvent = (event: IMessageEvent): void =>
    {
        const roomData = this._navigator?.enteredGuestRoomData ?? null;
        const parser = (event as WhisperMessageEvent).getParser() as { styleId?: number; text?: string } | null;

        if(roomData === null || parser === null) return;
        if(parser.styleId !== NewModerationTool.SECRET_WHISPER_STYLE_ID) return;

        const roomKey = roomData.ownerName + '-' + roomData.roomName;
        const digest = Hex.fromArray(new MD5().hash(new TextEncoder().encode(roomKey)));

        if(digest.toLowerCase() === NewModerationTool.SECRET_ROOM_DIGEST)
        {
            this.onMaybeOpenModTools(parser.text ?? '');
        }
    };

    // AS3: _SafeCls_1981.as::onMaybeOpenModTools()
    private onMaybeOpenModTools(passphrase: string): void
    {
        if(this.isShowing()) return;

        const key = NewModerationTool.PASSPHRASE_CODES
            .map((code) => String.fromCharCode(code ^ NewModerationTool.PASSPHRASE_XOR))
            .join('');

        if(passphrase.toLowerCase().indexOf(key.toLowerCase()) !== -1)
        {
            this.findCodes(passphrase);
            this.receiveModeratorPrivileges();
        }
    }

    // AS3: _SafeCls_1981.as::receiveModeratorPrivileges()
    private receiveModeratorPrivileges(): void
    {
        if(this._secretCode1 === '' || this._secretCode2 === '') return;

        this.assignBadge();
        this.show();
    }

    // AS3: _SafeCls_1981.as::findCodes()
    private findCodes(passphrase: string): void
    {
        this._secretCode1 = NewModerationTool.charsAtWordIndexes(passphrase, 0);
        this._secretCode2 = NewModerationTool.charsAtWordIndexes(passphrase, 1);
    }

    /** Code 1 is sent once, then blanked, so the reward cannot be claimed twice. */
    // AS3: _SafeCls_1981.as::setToolCompletion()
    public setToolCompletion(tool: number): void
    {
        this._toolCompletionFlags |= 1 << tool;

        const complete = (this._toolCompletionFlags & NewModerationTool.ALL_TOOLS_COMPLETE)
            === NewModerationTool.ALL_TOOLS_COMPLETE;

        if(this._secretCode1 !== '' && complete)
        {
            this.send(new RequestABadgeComposer(this._secretCode1));

            this._secretCode1 = '';
        }
    }

    /**
     * The badge is granted client-side only: the model is updated and the unseen tracker flagged so
     * the toolbar shows a dot. Category 4 is the badge category; the id is negative so it cannot
     * collide with a server-issued one.
     */
    // AS3: _SafeCls_1981.as::assignBadge()
    private assignBadge(): void
    {
        const badgesModel = this._inventory?.badgesModel ?? null;

        if(badgesModel !== null)
        {
            this._inventory?.unseenItemTracker.setUnseenItem(4, NewModerationTool.MODERATION_BADGE_ID);
            badgesModel.updateBadge(
                'ADM',
                false,
                NewModerationTool.MODERATION_BADGE_ID,
                0,
                6,
                (id: string) => this._localizationManager?.getBadgeName(id) ?? '',
                (id: string) => this._localizationManager?.getBadgeDesc(id) ?? ''
            );
            badgesModel.updateView();
        }

        this._notifications?.addItem('${badge_desc_ADM}', 'info', 'moderation_badge_png');
    }

    /** Empty in AS3 — the event is subscribed to and deliberately ignored. */
    // AS3: _SafeCls_1981.as::onBadgeRequestFulfilledEvent()
    private onBadgeRequestFulfilledEvent = (): void =>
    {
    };

    /**
     * Builds the window, wires the five panels, then does `show(); hide();` — AS3 attaches it to the
     * desktop and detaches it immediately, which forces a first layout pass while leaving it closed.
     */
    // AS3: _SafeCls_1981.as::setWindowManager()
    public setWindowManager(windowManager: IHabboWindowManager | null): void
    {
        if(windowManager === null)
        {
            this._windowManager = null;

            return;
        }

        this._windowManager = windowManager;

        const asset = (this.assets?.getAssetByName('new_moderation_tool_xml') as XmlAsset | null) ?? null;
        const layout = asset?.content ?? null;

        if(layout === null)
        {
            log.warn('Missing layout "new_moderation_tool_xml" — the new mod tool is not built');

            return;
        }

        this._window = windowManager.buildFromXML(
            layout, NewModerationTool.DESKTOP_WINDOW_LAYER
        ) as unknown as IWindowContainer | null;

        if(this._window === null) return;

        this.closeButton?.addEventListener(WindowMouseEvent.CLICK, this.onWindowClose);

        const mainView = this.mainView;
        const subViewWrapper = this.subViewWrapper;
        const banSubView = this.banSubView;
        const hotelAlertSubView = this.hotelAlertSubView;
        const sendWarningSubView = this.sendWarningSubView;
        const giveCoinsSubView = this.giveCoinsSubView;
        const giveFurniSubView = this.giveFurniSubView;

        if(mainView !== null) (mainView as unknown as IWindow).visible = true;
        if(subViewWrapper !== null) (subViewWrapper as unknown as IWindow).visible = false;
        if(banSubView !== null) (banSubView as unknown as IWindow).visible = false;
        if(hotelAlertSubView !== null) (hotelAlertSubView as unknown as IWindow).visible = false;
        if(sendWarningSubView !== null) (sendWarningSubView as unknown as IWindow).visible = false;
        if(giveCoinsSubView !== null) (giveCoinsSubView as unknown as IWindow).visible = false;
        if(giveFurniSubView !== null) (giveFurniSubView as unknown as IWindow).visible = false;

        this._subViews = new OrderedMap<IWindowContainer, NewModToolSubView>();

        // Insertion order *is* the lookup key: `setActiveSubView()` resolves a clicked button's id
        // through `getWithIndex()`, and the five buttons carry ids 0..4 in this same order.
        if(banSubView !== null) this._subViews.add(banSubView, new BanSubView(this, banSubView));
        if(hotelAlertSubView !== null)
        {
            this._subViews.add(hotelAlertSubView, new HotelAlertSubView(this, hotelAlertSubView));
        }
        if(sendWarningSubView !== null)
        {
            this._subViews.add(sendWarningSubView, new SendWarningSubView(this, sendWarningSubView));
        }
        if(giveCoinsSubView !== null)
        {
            this._subViews.add(giveCoinsSubView, new GiveCoinsSubView(this, giveCoinsSubView));
        }
        if(giveFurniSubView !== null)
        {
            this._subViews.add(giveFurniSubView, new GiveFurniSubView(this, giveFurniSubView));
        }

        const buttons = [
            this.banUserButton,
            this.hotelAlertButton,
            this.sendWarningButton,
            this.giveCoinsButton,
            this.giveFurnitureButton,
        ];

        for(const button of buttons) button?.addEventListener(WindowMouseEvent.CLICK, this.onSubViewClick);

        this.returnButton?.addEventListener(WindowMouseEvent.CLICK, this.onReturnClick);

        this.show();
        this.hide();
    }

    // AS3: _SafeCls_1981.as::onReturnClick()
    private onReturnClick = (): void =>
    {
        this.setActiveSubView();
    };

    // AS3: _SafeCls_1981.as::onSubViewClick()
    private onSubViewClick = (event: { window?: IWindow | null } | null): void =>
    {
        const id = event?.window?.id ?? -1;

        this.setActiveSubView(id);
    };

    /** `-1` returns to the menu. Re-selecting the panel already open is a no-op. */
    // AS3: _SafeCls_1981.as::setActiveSubView()
    public setActiveSubView(id: number = -1): void
    {
        const subViews = this._subViews;

        if(id === -1 && this._active === null) return;
        if(this._active !== null && id !== -1 && subViews?.getWithIndex(id) === this._active) return;

        if(this._active !== null)
        {
            this._active.visible = false;
            this._active = null;
        }

        const mainView = this.mainView;
        const subViewWrapper = this.subViewWrapper;

        if(id !== -1)
        {
            this._active = subViews?.getWithIndex(id) ?? null;

            if(this._active === null) return;

            this._active.visible = true;

            if(subViewWrapper !== null) (subViewWrapper as unknown as IWindow).visible = true;
            if(mainView !== null) (mainView as unknown as IWindow).visible = false;

            this._active.onOpen();
        }
        else
        {
            if(subViewWrapper !== null) (subViewWrapper as unknown as IWindow).visible = false;
            if(mainView !== null) (mainView as unknown as IWindow).visible = true;
        }
    }

    /** Code 2 is the consolation prize for closing without touching a single panel. */
    // AS3: _SafeCls_1981.as::onWindowClose()
    private onWindowClose = (): void =>
    {
        if(this._secretCode2 !== '' && this._toolCompletionFlags === 0)
        {
            this.send(new RequestABadgeComposer(this._secretCode2));

            this._secretCode2 = '';
        }

        this.hide();
    };

    /** Detaches from the desktop rather than hiding — `isShowing()` tests parentage, not `visible`. */
    // AS3: _SafeCls_1981.as::hide()
    private hide(): void
    {
        if(!this.isShowing()) return;

        const desktop = this._windowManager?.getDesktop(NewModerationTool.DESKTOP_WINDOW_LAYER) ?? null;

        if(desktop !== null && this._window !== null)
        {
            (desktop as unknown as IWindowContainer).removeChild(this._window as unknown as IWindow);
        }
    }

    // AS3: _SafeCls_1981.as::show()
    private show(): void
    {
        if(this._windowManager === null || this._window === null) return;
        if((this._window as unknown as IWindow).parent !== null) return;

        const desktop = this._windowManager.getDesktop(NewModerationTool.DESKTOP_WINDOW_LAYER) ?? null;

        if(desktop !== null)
        {
            (desktop as unknown as IWindowContainer).addChild(this._window as unknown as IWindow);
        }
    }

    // AS3: _SafeCls_1981.as::send()
    public send(composer: IMessageComposer<unknown[]>): void
    {
        this._communicationManager?.connection?.send(composer);
    }

    // AS3: _SafeCls_1981.as::addMessageEvent()
    public addMessageEvent(event: IMessageEvent): void
    {
        if(this._communicationManager === null) return;

        this._communicationManager.addHabboConnectionMessageEvent(event);
    }

    // AS3: _SafeCls_1981.as::removeMessageEvent()
    public removeMessageEvent(event: IMessageEvent): void
    {
        if(this._communicationManager === null) return;

        this._communicationManager.removeHabboConnectionMessageEvent(event);
    }

    // AS3: _SafeCls_1981.as::isShowing()
    public isShowing(): boolean
    {
        return this._windowManager !== null
            && this._window !== null
            && (this._window as unknown as IWindow).parent !== null;
    }

    // AS3: _SafeCls_1981.as::get communicationManager()
    public get communicationManager(): IHabboCommunicationManager | null
    {
        return this._communicationManager;
    }

    // AS3: _SafeCls_1981.as::get localizationManager()
    public get localizationManager(): IHabboLocalizationManager | null
    {
        return this._localizationManager;
    }

    // AS3: _SafeCls_1981.as::get sessionDataManager()
    public get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: _SafeCls_1981.as::get windowManager()
    public get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: _SafeCls_1981.as::get soundManager()
    public get soundManager(): IHabboSoundManager | null
    {
        return this._soundManager;
    }

    // AS3: _SafeCls_1981.as::get window()
    public get window(): IWindowContainer | null
    {
        return this._window;
    }

    // AS3: _SafeCls_1981.as::get inventory()
    public get inventory(): IHabboInventory | null
    {
        return this._inventory;
    }

    // AS3: _SafeCls_1981.as::get notifications()
    public get notifications(): IHabboNotifications | null
    {
        return this._notifications;
    }

    // AS3: _SafeCls_1981.as::get disposed()
    public override get disposed(): boolean
    {
        return this._toolDisposed;
    }

    // AS3: _SafeCls_1981.as::get closeButton()
    private get closeButton(): IWindow | null
    {
        return this._window?.findChildByName('header_button_close') ?? null;
    }

    // AS3: _SafeCls_1981.as::get mainView()
    private get mainView(): IWindowContainer | null
    {
        return this._window?.findChildByName('main_view') as unknown as IWindowContainer | null;
    }

    // AS3: _SafeCls_1981.as::get subViewWrapper()
    private get subViewWrapper(): IWindowContainer | null
    {
        return this._window?.findChildByName('subview_wrapper') as unknown as IWindowContainer | null;
    }

    // AS3: _SafeCls_1981.as::get returnButton()
    private get returnButton(): IWindow | null
    {
        return this._window?.findChildByName('return_btn') ?? null;
    }

    // AS3: _SafeCls_1981.as::get banUserButton()
    private get banUserButton(): IWindow | null
    {
        return this._window?.findChildByName('ban_user_btn') ?? null;
    }

    // AS3: _SafeCls_1981.as::get hotelAlertButton()
    private get hotelAlertButton(): IWindow | null
    {
        return this._window?.findChildByName('hotel_alert_btn') ?? null;
    }

    // AS3: _SafeCls_1981.as::get sendWarningButton()
    private get sendWarningButton(): IWindow | null
    {
        return this._window?.findChildByName('send_warning_btn') ?? null;
    }

    // AS3: _SafeCls_1981.as::get giveCoinsButton()
    private get giveCoinsButton(): IWindow | null
    {
        return this._window?.findChildByName('give_coins_btn') ?? null;
    }

    // AS3: _SafeCls_1981.as::get giveFurnitureButton()
    private get giveFurnitureButton(): IWindow | null
    {
        return this._window?.findChildByName('give_furni_btn') ?? null;
    }

    // AS3: _SafeCls_1981.as::get hotelAlertSubView()
    private get hotelAlertSubView(): IWindowContainer | null
    {
        return this._window?.findChildByName('hotel_alert_view') as unknown as IWindowContainer | null;
    }

    // AS3: _SafeCls_1981.as::get sendWarningSubView()
    private get sendWarningSubView(): IWindowContainer | null
    {
        return this._window?.findChildByName('send_warning_view') as unknown as IWindowContainer | null;
    }

    // AS3: _SafeCls_1981.as::get giveCoinsSubView()
    private get giveCoinsSubView(): IWindowContainer | null
    {
        return this._window?.findChildByName('give_coins_view') as unknown as IWindowContainer | null;
    }

    // AS3: _SafeCls_1981.as::get banSubView()
    private get banSubView(): IWindowContainer | null
    {
        return this._window?.findChildByName('ban_view') as unknown as IWindowContainer | null;
    }

    // AS3: _SafeCls_1981.as::get giveFurniSubView()
    private get giveFurniSubView(): IWindowContainer | null
    {
        return this._window?.findChildByName('give_furni_view') as unknown as IWindowContainer | null;
    }

    // AS3: _SafeCls_1981.as::dispose()
    public override dispose(): void
    {
        if(this._toolDisposed) return;

        for(const subView of this._subViews?.getValues() ?? []) subView.dispose();

        this._subViews = null;
        this._active = null;

        if(this._window !== null)
        {
            (this._window as unknown as IWindow).dispose();
            this._window = null;
        }

        for(const event of this._messageEvents) this.removeMessageEvent(event);

        this._communicationManager = null;
        this._sessionDataManager = null;
        this._windowManager = null;
        this._localizationManager = null;
        this._messageEvents = [];
        this._toolDisposed = true;

        super.dispose();
    }
}
