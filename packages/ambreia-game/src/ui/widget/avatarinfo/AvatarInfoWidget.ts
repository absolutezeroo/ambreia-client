/**
 * AvatarInfoWidget — the RWE_AVATAR_INFO widget, reduced to the name bubble.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as
 *
 * AS3's widget owns every avatar, pet and bot context menu. Since the core cut (2026-10-07) the
 * server serves none of what those menus act on, so the widget keeps only the name bubble
 * (`UserNameView`): it appears over the avatar the player selects and leaves on deselection, when
 * the avatar leaves the room, or when its own fade timer runs out. The git tag `pre-noyau-client`
 * keeps the full widget.
 *
 * Positioning goes through the `RWGOI_MESSAGE_GET_OBJECT_LOCATION` round-trip, as AS3's `update()`
 * does — see `positionView()`. The per-frame tick uses the window manager's update receiver.
 */
import {RoomWidgetBase} from '../RoomWidgetBase';
import type {IRoomWidgetHandler} from '../../IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '../../IRoomWidgetHandlerContainer';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IHabboLocalizationManager} from '../../../localization/IHabboLocalizationManager';
import type {IHabboConfigurationManager} from '../../../configuration/IHabboConfigurationManager';
import type {IUpdateReceiver} from '@ambreia/kernel/runtime/IContext';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import {RoomWidgetRoomObjectUpdateEvent} from '../events/RoomWidgetRoomObjectUpdateEvent';
import type {IContextMenuParentWidget} from '../contextmenu/IContextMenuParentWidget';
import type {ContextInfoView} from '../contextmenu/ContextInfoView';
import {RoomWidgetGetObjectLocationMessage} from '../messages/RoomWidgetGetObjectLocationMessage';
import type {RoomWidgetUserLocationUpdateEvent} from '../events/RoomWidgetUserLocationUpdateEvent';
import type {EventEmitter} from 'eventemitter3';
import {UserNameView} from './UserNameView';
import type {IUserData} from '../../../session/IUserData';
import type {AvatarInfoWidgetHandler} from '../../handler/AvatarInfoWidgetHandler';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.ui.widget.avatarinfo.AvatarInfoWidget');

export class AvatarInfoWidget extends RoomWidgetBase implements IContextMenuParentWidget, IUpdateReceiver
{
    private _config: IHabboConfigurationManager | null;
    private _updateRegistered: boolean = false;

    // AS3: AvatarInfoWidget.as::_avatarNameBubbles — one bubble per named avatar, keyed on its display
    // name (AS3 keys its own map by the same string).
    private _avatarNameBubbles: Map<string, UserNameView> = new Map();

    // DEVIATION: AS3 also takes the catalog, which only its menus read (core cut, 2026-10-07).
    // AS3: AvatarInfoWidget.as::AvatarInfoWidget()
    constructor(
        handler: IRoomWidgetHandler,
        windowManager: IHabboWindowManager,
        assets: IAssetLibrary | null,
        localizations: IHabboLocalizationManager | null,
        config: IHabboConfigurationManager | null
    )
    {
        super(handler, windowManager, assets, localizations);

        this._config = config;
        this.handler.widget = this;

        for(const [type, listener] of this.desktopEventBindings())
        {
            this.container?.desktopEvents.on(type, listener);
            // AS3's `checkUpdateNeed()` tail, reproduced on the emitter: eventemitter3 calls
            // listeners in registration order, so this always runs after the case above.
            this.container?.desktopEvents.on(type, this.onDesktopEventHandled);
        }

        // AS3: AvatarInfoWidget.as:167-168 — on the ROOM ENGINE's emitter, because it fires for every
        // room object leaving rather than for a widget message.
        this.container?.roomEngine?.events.on(RoomEngineObjectEvent.REOE_REMOVED, this.onRoomObjectRemoved);
    }

    // AS3: AvatarInfoWidget.as::get handler()
    public get handler(): AvatarInfoWidgetHandler
    {
        return this.widgetHandler as AvatarInfoWidgetHandler;
    }

    private get container(): IRoomWidgetHandlerContainer | null
    {
        return this.handler?.container ?? null;
    }

    // AS3: AvatarInfoWidget.as::get configuration()
    public get configuration(): IHabboConfigurationManager | null
    {
        return this._config;
    }

    /**
     * The player selected something in the room: an avatar (a user, a pet or a bot) gets its name
     * bubble, replacing any other.
     */
    // DEVIATION: AS3 opens the full avatar, pet or bot context menu here and puts name bubbles up
    //   automatically over friends (`onRoomObjectAdded`); with no menus and no friend list since the
    //   core cut, selection shows the name bubble instead.
    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWROUE_OBJECT_SELECTED case)
    private onObjectSelected = (event: RoomWidgetRoomObjectUpdateEvent): void =>
    {
        if(event.category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) return;

        const userData = this.container?.roomSession?.userDataManager.getUserDataByIndex(event.id) ?? null;

        if(userData === null) return;

        this.removeNameBubbles();
        this.showUserName(userData, event.id);
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWROUE_OBJECT_DESELECTED case)
    private onObjectDeselected = (): void =>
    {
        this.removeNameBubbles();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::onRoomObjectRemoved()
    private onRoomObjectRemoved = (event: RoomEngineObjectEvent): void =>
    {
        if(event.category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) return;

        for(const view of [...this._avatarNameBubbles.values()])
        {
            if(view.objectId === event.objectId) this.removeView(view, false);
        }
    };

    // DEVIATION: AS3 always passes userType 1 (its callers only ever name friends, who are users);
    //   selection can name a pet or a bot, so the user's own type is passed and the location lookup
    //   finds it.
    // AS3: AvatarInfoWidget.as::showUserName()
    public showUserName(userData: IUserData, objectId: number): void
    {
        if(this._avatarNameBubbles.has(userData.name)) return;

        log.debug(`Name bubble for "${userData.name}" (webId ${userData.webID}, object ${objectId})`);

        const view = new UserNameView(this);
        // DEVIATION: an RPG monster is a pet whose name is its content id (`monster.forest.wolf`, M1a
        //   §9.1): the bubble shows its translated name, `<id>.name`.
        const name = userData.name.startsWith('monster.') ? this._localizations?.getLocalization(`${userData.name}.name`, userData.name) ?? userData.name : userData.name;

        UserNameView.setup(
            view, userData.webID, name, -1, userData.type, objectId,
            UserNameView.DEFAULT_BG_COLOR, UserNameView.DEFAULT_FADE_DELAY_MS, userData.isBlocked
        );

        this._avatarNameBubbles.set(userData.name, view);
        this.checkUpdateNeed();
    }

    /**
     * The avatar-name bubble shown over a game NPC/player — the end of the chain
     * `RoomUI.showGamePlayerName()` -> `RoomDesktop` -> here.
     */
    // AS3: AvatarInfoWidget.as::showGamePlayerName()
    public showGamePlayerName(objectId: number, name: string, color: number, fadeDelayMs: number): void
    {
        if(this._avatarNameBubbles.has(name)) return;

        const view = new UserNameView(this, true);

        UserNameView.setup(view, objectId, name, objectId, 1, objectId, color, fadeDelayMs);

        this._avatarNameBubbles.set(name, view);
        this.checkUpdateNeed();
    }

    // AS3: AvatarInfoWidget.as::removeView()
    public removeView(view: ContextInfoView, animate: boolean): void
    {
        view.hide(animate);

        if(view instanceof UserNameView)
        {
            this._avatarNameBubbles.delete(view.userName);
            view.dispose();
        }

        this.checkUpdateNeed();
    }

    // DEVIATION: AS3 closes its open context menu; the name bubbles are all there is to close now.
    // AS3: AvatarInfoWidget.as::close()
    public close(): void
    {
        this.removeNameBubbles();
    }

    // TS-only: drops every name bubble — selection shows one at a time since the core cut.
    private removeNameBubbles(): void
    {
        for(const view of [...this._avatarNameBubbles.values()]) this.removeView(view, false);
    }

    // AS3: AvatarInfoWidget.as::checkUpdateNeed()
    private checkUpdateNeed(): void
    {
        const needed = this._avatarNameBubbles.size > 0;

        if(needed && !this._updateRegistered)
        {
            this.windowManager.registerUpdateReceiver(this, 10);
            this._updateRegistered = true;
        }
        else if(!needed && this._updateRegistered)
        {
            this.windowManager.removeUpdateReceiver(this);
            this._updateRegistered = false;
        }
    }

    /**
     * The cases of AS3's `updateEventHandler()` switch this widget still handles, as an emitter
     * binding table read by both the constructor and `dispose()`, so a case is never registered
     * without its `checkUpdateNeed()` tail — see `onDesktopEventHandled()`.
     */
    // DEVIATION: AS3's switch has ~20 cases feeding the context menus; the two selection cases are
    //   the ones the name bubble needs (core cut, 2026-10-07).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::updateEventHandler()
    private desktopEventBindings(): readonly (readonly [string, EventEmitter.ListenerFn])[]
    {
        return [
            [RoomWidgetRoomObjectUpdateEvent.OBJECT_SELECTED, this.onObjectSelected],
            [RoomWidgetRoomObjectUpdateEvent.OBJECT_DESELECTED, this.onObjectDeselected],
        ];
    }

    /**
     * `updateEventHandler()`'s last statement, which sits outside its switch: without it a bubble
     * shown by a case has no update receiver, `positionView()` never runs, and the bubble sits at
     * (0, 0), because `buildFromXML()` parents a root window straight to the desktop.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::updateEventHandler()
    private onDesktopEventHandled = (): void =>
    {
        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::update() (IUpdateReceiver)
    public update(deltaTime: number): void
    {
        for(const view of this._avatarNameBubbles.values()) this.positionView(view, deltaTime);
    }

    /**
     * Asks the engine where an object is and hands the answer to the view. **This asks; it does not
     * work it out**: `ObjectLocationRequestHandler` answers with the object's own projected position,
     * which no wide effect can move, and with `rectangle: null` for an object the room cannot place,
     * which `ContextInfoView.update()` keeps off the screen.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::update()
    private positionView(view: UserNameView, deltaTime: number): void
    {
        const location = this.messageListener?.processWidgetMessage(
            new RoomWidgetGetObjectLocationMessage(
                view.isGameRoomMode
                    ? RoomWidgetGetObjectLocationMessage.GET_GAME_OBJECT_LOCATION
                    : RoomWidgetGetObjectLocationMessage.GET_OBJECT_LOCATION,
                view.userId,
                view.userType
            )
        ) as RoomWidgetUserLocationUpdateEvent | null ?? null;

        // TS-only: returning here is silent, and the bubble is on screen from the moment it is built
        // — `update()` is the only thing that moves it off (0, 0). Say which part came back empty.
        if(location === null || location.screenLocation === null || location.rectangle === null)
        {
            AvatarInfoWidget.reportUnlocatable(view, location);

            return;
        }

        view.update(location.rectangle, location.screenLocation, deltaTime);
    }

    // TS-only: rate limit for reportUnlocatable() below — one warning per stranded bubble.
    private static readonly REPORTED_UNLOCATABLE: Set<string> = new Set();

    /**
     * Names the part of the location round-trip that came back empty, once per view: a null event
     * means the message reached no handler; a missing `screenLocation` means the user or its room
     * object was not found; a missing `rectangle` alone means the object has no rendered bounds.
     */
    // TS-only: diagnostic for the silent return above; AS3 has no counterpart.
    private static reportUnlocatable(view: UserNameView, location: RoomWidgetUserLocationUpdateEvent | null): void
    {
        const key = `${view.userType}:${view.userId}`;

        if(AvatarInfoWidget.REPORTED_UNLOCATABLE.has(key)) return;

        AvatarInfoWidget.REPORTED_UNLOCATABLE.add(key);

        log.warn(
            `No location for "${view.userName}" (userId ${view.userId}, userType ${view.userType}): `
            + (location === null
                ? 'RWGOI_MESSAGE_GET_OBJECT_LOCATION went unanswered — no handler, or no room session.'
                : location.screenLocation === null
                    ? 'the handler answered with no screenLocation — the user is not in userDataManager, '
                        + 'or its roomObjectId names nothing on the first canvas.'
                    : 'the handler answered with a screenLocation but no rectangle — '
                        + 'getRoomObjectBoundingRectangle() has no rendered bounds for that object.')
            + ' The bubble stays parked at (0, 0) until this resolves.'
        );
    }

    // AS3: AvatarInfoWidget.as::dispose()
    public override dispose(): void
    {
        if(this.disposed) return;

        this.container?.roomEngine?.events.off(RoomEngineObjectEvent.REOE_REMOVED, this.onRoomObjectRemoved);

        for(const [type, listener] of this.desktopEventBindings())
        {
            this.container?.desktopEvents.off(type, listener);
            this.container?.desktopEvents.off(type, this.onDesktopEventHandled);
        }

        if(this._updateRegistered)
        {
            this.windowManager.removeUpdateReceiver(this);
            this._updateRegistered = false;
        }

        for(const view of this._avatarNameBubbles.values()) view.dispose();

        this._avatarNameBubbles.clear();

        super.dispose();
    }
}
