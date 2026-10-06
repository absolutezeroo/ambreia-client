
/**
 * InfoStandWidget
 *
 * @see sources/win63_version/habbo/ui/widget/infostand/InfoStandWidget.as
 *
 * Container for all infostand sub-views (furni/user/pet/bot/rentable-bot/
 * crackable-furni; AS3's jukebox and song-disk views are gone with the RPG
 * fork's removal of jukebox music). Furni, user, and bot views are fully
 * ported (user/bot at Phase 1 identity-only scope — see InfoStandUserView.ts's
 * header for what's deferred). Pet/rentable-bot/crackable-furni
 * are still inert stubs — this class still constructs and wires all
 * of them to match AS3's structure, so `selectView()`/`hideChildren()`
 * naturally no-op for the stubbed ones (their `window` is always `null`, so
 * `mainContainer.getChildByName(...)` never finds them).
 */
import type {EventEmitter} from 'eventemitter3';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import {RoomWidgetBase} from '@habbo/ui/widget/RoomWidgetBase';
import {RoomWidgetRoomObjectUpdateEvent} from '../events/RoomWidgetRoomObjectUpdateEvent';
import {RoomWidgetFurniInfoUpdateEvent} from '../events/RoomWidgetFurniInfoUpdateEvent';
import {RoomWidgetUserInfoUpdateEvent} from '../events/RoomWidgetUserInfoUpdateEvent';
import {RoomWidgetPetInfoUpdateEvent} from '../events/RoomWidgetPetInfoUpdateEvent';
import {RoomWidgetPetCommandsUpdateEvent} from '../events/RoomWidgetPetCommandsUpdateEvent';
import {RoomWidgetPetFigureUpdateEvent} from '../events/RoomWidgetPetFigureUpdateEvent';
import {RoomWidgetPetCommandMessage} from '../messages/RoomWidgetPetCommandMessage';
import {CommandConfiguration} from './CommandConfiguration';
import {RoomWidgetInfostandExtraParamEnum} from '../enums/RoomWidgetInfostandExtraParamEnum';
import {RoomWidgetRoomObjectMessage} from '../messages/RoomWidgetRoomObjectMessage';
import {RoomWidgetUserActionMessage} from '../messages/RoomWidgetUserActionMessage';
import type {RelationshipStatusInfo} from '@habbo/communication/messages/incoming/users/RelationshipStatusInfo';
import type {InfoStandWidgetHandler} from '@habbo/ui/handler/InfoStandWidgetHandler';
import {InfoStandFurniView} from './InfoStandFurniView';
import {InfoStandCrackableFurniView} from './InfoStandCrackableFurniView';
import {InfoStandUserView} from './InfoStandUserView';
import {InfoStandPetView} from './InfoStandPetView';
import {InfoStandBotView} from './InfoStandBotView';
import {InfoStandRentableBotView} from './InfoStandRentableBotView';
import {InfoStandFurniData} from './InfoStandFurniData';
import {InfoStandUserData} from './InfoStandUserData';
import {InfoStandPetData} from './InfoStandPetData';
import {InfoStandRentableBotData} from './InfoStandRentableBotData';
import {RoomWidgetRentableBotInfoUpdateEvent} from '../events/RoomWidgetRentableBotInfoUpdateEvent';
import type {ISelectedBadge} from '@habbo/communication/messages/parser/users/HabboUserBadgesMessageParser';

export class InfoStandWidget extends RoomWidgetBase
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::USER_VIEW / const_529 / PET_VIEW / ...
    private static readonly VIEW_NAME = {
        USER: 'infostand_user_view',
        FURNI: 'infostand_furni_view',
        PET: 'infostand_pet_view',
        BOT: 'infostand_bot_view',
        RENTABLE_BOT: 'infostand_rentable_bot_view',
        CRACKABLE_FURNI: 'infostand_crackable_furni_view',
    } as const;

    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::InfoStandWidget() — `new Timer(3000)`
    private static readonly UPDATE_TIMER_INTERVAL = 3000;

    // The three species AS3 gates the breeding-train command on in onPetCommands(). The values are the
    // pet type ids it compares against directly (0, 1, 5); the names are this port's.
    private static readonly PET_TYPE_DOG = 0;

    private static readonly PET_TYPE_CAT = 1;

    private static readonly PET_TYPE_PIG = 5;

    private readonly _furniView: InfoStandFurniView;
    private readonly _userView: InfoStandUserView;
    private readonly _petView: InfoStandPetView;
    private readonly _botView: InfoStandBotView;
    private readonly _rentableBotView: InfoStandRentableBotView;
    private readonly _crackableFurniView: InfoStandCrackableFurniView;

    private readonly _userData: InfoStandUserData;
    private readonly _furniData: InfoStandFurniData;
    private readonly _petData: InfoStandPetData;
    private readonly _rentableBotData: InfoStandRentableBotData;

    private _mainContainer: IWindowContainer | null = null;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::_config
    private readonly _config: IHabboConfigurationManager | null;

    // DEVIATION: AS3 also builds the jukebox and song-disk views (`infostand_jukebox_view`,
    //   `infostand_songdisk_view`); the RPG fork removed jukebox music.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::InfoStandWidget()
    constructor(
        handler: IRoomWidgetHandler,
        windowManager: IHabboWindowManager,
        assets: IAssetLibrary | null,
        localizations: IHabboLocalizationManager | null,
        config: IHabboConfigurationManager | null,
        catalog: IHabboCatalog | null
    )
    {
        super(handler, windowManager, assets, localizations);

        this._config = config;
        this._furniView = new InfoStandFurniView(this, InfoStandWidget.VIEW_NAME.FURNI, catalog);
        this._userView = new InfoStandUserView(this, InfoStandWidget.VIEW_NAME.USER);
        this._petView = new InfoStandPetView(this, InfoStandWidget.VIEW_NAME.PET, catalog);
        this._botView = new InfoStandBotView(this, InfoStandWidget.VIEW_NAME.BOT);
        this._rentableBotView = new InfoStandRentableBotView(this, InfoStandWidget.VIEW_NAME.RENTABLE_BOT);
        this._crackableFurniView = new InfoStandCrackableFurniView(this, InfoStandWidget.VIEW_NAME.CRACKABLE_FURNI, catalog);
        this._userData = new InfoStandUserData();
        this._furniData = new InfoStandFurniData();
        this._petData = new InfoStandPetData();
        this._rentableBotData = new InfoStandRentableBotData();

        this.mainContainer.visible = false;
        this.handler.widget = this;
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::_updateTimer
     *
     * AS3 builds a repeating `new Timer(3000)` in the constructor and only ever starts it from
     * onPetInfo(). A setInterval created on demand is the same thing: the handle is the "running"
     * flag AS3 reads off the Timer, so stopUpdateTimer() stands in for its `.stop()`.
     */
    private _updateTimer: ReturnType<typeof setInterval> | null = null;

    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::_updateTimer.start()
    private startUpdateTimer(): void
    {
        if(this._updateTimer !== null) return;

        this._updateTimer = setInterval(() => this.onUpdateTimer(), InfoStandWidget.UPDATE_TIMER_INTERVAL);
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::_updateTimer.stop()
    private stopUpdateTimer(): void
    {
        if(this._updateTimer === null) return;

        clearInterval(this._updateTimer);
        this._updateTimer = null;
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onUpdateTimer()
     *
     * A pet's hunger, thirst and energy drain while its infostand is open, and nothing pushes
     * them: the panel asks for a fresh snapshot every three seconds for as long as a pet is the
     * thing being shown.
     */
    private onUpdateTimer(): void
    {
        this.messageListener?.processWidgetMessage(
            new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.REQUEST_PET_UPDATE, this._petView.getCurrentPetId())
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get handler()
    public get handler(): InfoStandWidgetHandler
    {
        return this._handler as InfoStandWidgetHandler;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get furniView()
    public get furniView(): InfoStandFurniView
    {
        return this._furniView;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get mainWindow()
    public override get mainWindow(): IWindow | null
    {
        return this.mainContainer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get config()
    public get config(): IHabboConfigurationManager | null
    {
        return this._config;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get mainContainer()
    public get mainContainer(): IWindowContainer
    {
        if(!this._mainContainer)
        {
            this._mainContainer = this.windowManager.createWindow(
                'infostand_main_container', '', 4, 0, 0, {x: 0, y: 0, width: 50, height: 100}
            ) as IWindowContainer;
            this._mainContainer.tags.push('room_widget_infostand');
            this._mainContainer.background = true;
            this._mainContainer.color = 0;
        }

        return this._mainContainer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::favouriteGroupUpdated()
    public favouriteGroupUpdated(userRoomId: number, groupId: number, _webId: number, groupName: string): void
    {
        if(this._userData.userRoomId !== userRoomId) return;

        const userViewWindow = this._mainContainer?.findChildByName(InfoStandWidget.VIEW_NAME.USER);

        if(!userViewWindow || !userViewWindow.visible) return;

        this._userView.clearGroupBadge();

        if(groupId !== -1)
        {
            this._userData.groupId = groupId;
            this._userData.groupBadgeId = this.handler.container?.sessionDataManager?.getGroupBadgeId(groupId) ?? '';
            this._userData.groupName = groupName;
            this._userView.setGroupBadge(this._userData.groupBadgeId);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::getXmlWindow()
    public getXmlWindow(name: string): IWindow | null
    {
        const window = this.windowManager.buildWidgetLayout(name);

        return window;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::setRelationshipStatus()
    public setRelationshipStatus(userId: number, statuses: Map<number, RelationshipStatusInfo>): void
    {
        if(this._userData.userId === userId)
        {
            this._userView.setRelationshipStatuses(statuses);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::dispose()
    public override dispose(): void
    {
        this._userView.dispose();
        this._furniView.dispose();
        this._botView.dispose();
        this._rentableBotView.dispose();
        this._petView.dispose();
        this._crackableFurniView.dispose();
        this.stopUpdateTimer();
        super.dispose();
    }

    // DEVIATION: AS3 also listens for OBJECT_PLACED (`onRoomObjectPlaced()`), the Builders Club
    //   place-from-infostand drop, and re-arms it through `requestItemToMover()`. The RPG fork
    //   removed the Builders Club, so both are gone.
    // DEVIATION: AS3 also listens for the two song updates (`onSongUpdate()`); the RPG fork removed
    //   jukebox music.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::registerUpdateEvents()
    public override registerUpdateEvents(dispatcher: EventEmitter): void
    {
        if(!dispatcher) return;

        dispatcher.on(RoomWidgetRoomObjectUpdateEvent.OBJECT_SELECTED, this.onRoomObjectSelected);
        dispatcher.on(RoomWidgetRoomObjectUpdateEvent.OBJECT_DESELECTED, this.onClose);
        dispatcher.on(RoomWidgetRoomObjectUpdateEvent.USER_REMOVED, this.onRoomObjectRemoved);
        dispatcher.on(RoomWidgetRoomObjectUpdateEvent.FURNI_REMOVED, this.onRoomObjectRemoved);
        dispatcher.on(RoomWidgetUserInfoUpdateEvent.OWN_USER, this.onUserInfo);
        dispatcher.on(RoomWidgetUserInfoUpdateEvent.PEER, this.onUserInfo);
        dispatcher.on(RoomWidgetUserInfoUpdateEvent.BOT, this.onBotInfo);
        dispatcher.on(RoomWidgetFurniInfoUpdateEvent.FURNI, this.onFurniInfo);
        dispatcher.on(RoomWidgetRentableBotInfoUpdateEvent.RENTABLE_BOT, this.onRentableBotInfo);
        dispatcher.on(RoomWidgetPetInfoUpdateEvent.PET_INFO, this.onPetInfo);
        dispatcher.on(RoomWidgetPetCommandsUpdateEvent.PET_COMMANDS, this.onPetCommands);
        dispatcher.on(RoomWidgetPetCommandsUpdateEvent.OPEN_PET_TRAINING, this.onOpenPetTraining);
        dispatcher.on(RoomWidgetPetCommandsUpdateEvent.CLOSE_PET_TRAINING, this.onClosePetTraining);
        dispatcher.on(RoomWidgetPetFigureUpdateEvent.PET_FIGURE_UPDATE, this.onPetFigureUpdate);

        super.registerUpdateEvents(dispatcher);
    }

    // DEVIATION: AS3 also unregisters the two song updates; the RPG fork removed jukebox music.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::unregisterUpdateEvents()
    public override unregisterUpdateEvents(dispatcher: EventEmitter): void
    {
        if(!dispatcher) return;

        dispatcher.off(RoomWidgetRoomObjectUpdateEvent.OBJECT_SELECTED, this.onRoomObjectSelected);
        dispatcher.off(RoomWidgetRoomObjectUpdateEvent.OBJECT_DESELECTED, this.onClose);
        dispatcher.off(RoomWidgetRoomObjectUpdateEvent.USER_REMOVED, this.onRoomObjectRemoved);
        dispatcher.off(RoomWidgetRoomObjectUpdateEvent.FURNI_REMOVED, this.onRoomObjectRemoved);
        dispatcher.off(RoomWidgetUserInfoUpdateEvent.OWN_USER, this.onUserInfo);
        dispatcher.off(RoomWidgetUserInfoUpdateEvent.PEER, this.onUserInfo);
        dispatcher.off(RoomWidgetUserInfoUpdateEvent.BOT, this.onBotInfo);
        dispatcher.off(RoomWidgetFurniInfoUpdateEvent.FURNI, this.onFurniInfo);
        dispatcher.off(RoomWidgetPetInfoUpdateEvent.PET_INFO, this.onPetInfo);
        dispatcher.off(RoomWidgetPetCommandsUpdateEvent.PET_COMMANDS, this.onPetCommands);
        dispatcher.off(RoomWidgetPetCommandsUpdateEvent.OPEN_PET_TRAINING, this.onOpenPetTraining);
        dispatcher.off(RoomWidgetPetCommandsUpdateEvent.CLOSE_PET_TRAINING, this.onClosePetTraining);
        dispatcher.off(RoomWidgetPetFigureUpdateEvent.PET_FIGURE_UPDATE, this.onPetFigureUpdate);
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get rentableBotData()
    public get rentableBotData(): InfoStandRentableBotData
    {
        return this._rentableBotData;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get userData()
    public get userData(): InfoStandUserData
    {
        return this._userData;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get furniData()
    public get furniData(): InfoStandFurniData
    {
        return this._furniData;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::get petData()
    public get petData(): InfoStandPetData
    {
        return this._petData;
    }

    /**
	 * Phase 1 (identity only) simplification: AS3 also tracks a `selectedBadges`
	 * preserve/glow pair (shouldPreserveDisplayedBadges()/shouldPlayGlowForUserInfo(),
	 * comparing against the previously-displayed user's badges to avoid a
	 * re-glow flicker on repeat clicks) and stops a tooltip-close timer — both
	 * deferred as display polish, not needed for basic identity display.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onUserInfo()
    /**
     * A user's card, opened or refreshed.
     *
     * The two flags are the whole point of the comparison above them. A card can be re-sent for
     * reasons that have nothing to do with badges — a motto edit, a figure change, a respect — and
     * repainting the badge row then would restart every rarity glow. So: if this is the *same* card
     * already on screen and its badges have not moved, the row is preserved and no glow plays.
     *
     * The one asymmetric case is a user whose slot-indexed badges arrive after the plain codes did:
     * the incoming record is the poorer of the two, so the richer one already displayed is kept
     * (`shouldPreserveDisplayedBadges`) and written back onto the record after `setData()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onUserInfo()
    private onUserInfo = (event: RoomWidgetUserInfoUpdateEvent): void =>
    {
        const sameCardOpen = this._userView.window !== null
            && this._userView.window.visible
            && this._userData.userId === event.webID;
        const shownBadges = this._userData.badges;
        const shownSelected = this._userData.selectedBadges;
        const preserve = InfoStandWidget.shouldPreserveDisplayedBadges(
            sameCardOpen, shownBadges, shownSelected, event.badges, event.selectedBadges
        );
        const playGlow = InfoStandWidget.shouldPlayGlowForUserInfo(
            sameCardOpen, shownBadges, shownSelected, event.badges, event.selectedBadges
        );

        this._userData.setData(event);

        if(preserve)
        {
            this._userData.badges = shownBadges;
            this._userData.selectedBadges = shownSelected;
        }

        if(this.handler.container?.sessionDataManager?.isBlocked(event.webID)) return;

        this._userView.update(event, playGlow, preserve);
        this.selectView(InfoStandWidget.VIEW_NAME.USER);
        this.stopUpdateTimer();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::shouldPreserveDisplayedBadges()
    private static shouldPreserveDisplayedBadges(
        sameCardOpen: boolean,
        shownBadges: string[],
        shownSelected: ISelectedBadge[],
        badges: string[],
        selected: ISelectedBadge[]
    ): boolean
    {
        if(!sameCardOpen) return false;

        if(InfoStandWidget.hasSelectedBadges(shownSelected) && !InfoStandWidget.hasSelectedBadges(selected)) return true;

        return InfoStandWidget.areDisplayedBadgesEqual(shownBadges, shownSelected, badges, selected);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::shouldPlayGlowForUserInfo()
    private static shouldPlayGlowForUserInfo(
        sameCardOpen: boolean,
        shownBadges: string[],
        shownSelected: ISelectedBadge[],
        badges: string[],
        selected: ISelectedBadge[]
    ): boolean
    {
        if(!sameCardOpen) return true;

        if(InfoStandWidget.hasSelectedBadges(shownSelected) && !InfoStandWidget.hasSelectedBadges(selected)) return false;

        return !InfoStandWidget.areDisplayedBadgesEqual(shownBadges, shownSelected, badges, selected);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::areDisplayedBadgesEqual()
    // Once either side has slot-indexed badges, the plain code lists stop being comparable at all:
    // one of them is derived and the other is not.
    private static areDisplayedBadgesEqual(
        shownBadges: string[],
        shownSelected: ISelectedBadge[],
        badges: string[],
        selected: ISelectedBadge[]
    ): boolean
    {
        const hadSelected = InfoStandWidget.hasSelectedBadges(shownSelected);
        const hasSelected = InfoStandWidget.hasSelectedBadges(selected);

        if(hadSelected || hasSelected)
        {
            return hadSelected && hasSelected && InfoStandWidget.areSelectedBadgesEqual(shownSelected, selected);
        }

        return InfoStandWidget.areBadgeCodesEqual(shownBadges, badges);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::hasSelectedBadges()
    private static hasSelectedBadges(badges: ISelectedBadge[] | null): boolean
    {
        return badges != null && badges.length > 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::areBadgeCodesEqual()
    private static areBadgeCodesEqual(a: string[] | null, b: string[] | null): boolean
    {
        const left = a ?? [];
        const right = b ?? [];

        if(left.length !== right.length) return false;

        for(let i = 0; i < left.length; i++)
        {
            if(left[i] !== right[i]) return false;
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::areSelectedBadgesEqual()
    // AS3 compares by slot rather than by position, because the wire does not promise an order.
    private static areSelectedBadgesEqual(a: ISelectedBadge[] | null, b: ISelectedBadge[] | null): boolean
    {
        const left = a ?? [];
        const right = b ?? [];

        if(left.length !== right.length) return false;

        for(let slot = 0; slot < 5; slot++)
        {
            const entryA = InfoStandWidget.getSelectedBadgeBySlot(left, slot);
            const entryB = InfoStandWidget.getSelectedBadgeBySlot(right, slot);

            if(!InfoStandWidget.areSelectedBadgeEntriesEqual(entryA, entryB)) return false;
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::areSelectedBadgeEntriesEqual()
    private static areSelectedBadgeEntriesEqual(a: ISelectedBadge | null, b: ISelectedBadge | null): boolean
    {
        if(a === b) return true;

        if(a === null || b === null) return false;

        return a.slotId === b.slotId
            && a.badgeCode === b.badgeCode
            && a.ownerCount === b.ownerCount
            && a.badgeRarityId === b.badgeRarityId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::getSelectedBadgeBySlot()
    private static getSelectedBadgeBySlot(badges: ISelectedBadge[] | null, slot: number): ISelectedBadge | null
    {
        for(const badge of badges ?? [])
        {
            if(badge != null && badge.slotId === slot) return badge;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onBotInfo()
    private onBotInfo = (event: RoomWidgetUserInfoUpdateEvent): void =>
    {
        this._userData.setData(event);
        this._botView.update(event);
        this.selectView(InfoStandWidget.VIEW_NAME.BOT);
        this.stopUpdateTimer();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onRentableBotInfo()
    private onRentableBotInfo = (event: RoomWidgetRentableBotInfoUpdateEvent): void =>
    {
        this._rentableBotData.setData(event);
        this._rentableBotView.update(event);
        this.selectView(InfoStandWidget.VIEW_NAME.RENTABLE_BOT);
        this.stopUpdateTimer();
    };

    // DEVIATION: AS3 first routes RWEIEP_JUKEBOX / RWEIEP_SONGDISK* to the jukebox and song-disk
    //   views; the RPG fork removed jukebox music, so those furni fall through to the furni view.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onFurniInfo()
    private onFurniInfo = (event: RoomWidgetFurniInfoUpdateEvent): void =>
    {
        this._furniData.setData(event);

        if(event.extraParam.indexOf(RoomWidgetInfostandExtraParamEnum.INFOSTAND_EXTRAPARAM_CRACKABLE_FURNI) !== -1)
        {
            this._crackableFurniView.update(event);
            this.selectView(InfoStandWidget.VIEW_NAME.CRACKABLE_FURNI);
        }
        else
        {
            this._furniView.update(event);
            this.selectView(InfoStandWidget.VIEW_NAME.FURNI);
        }

        this.stopUpdateTimer();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onPetInfo()
    private onPetInfo = (event: RoomWidgetPetInfoUpdateEvent): void =>
    {
        this._petData.setData(event);
        this._userData.petRespectLeft = event.petRespectLeft;
        this._petView.update(this._petData);
        this.selectView(InfoStandWidget.VIEW_NAME.PET);
        this.startUpdateTimer();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onPetFigureUpdate()
    // AS3's event carries a rendered BitmapData; this port's carries the figure string, so the
    // render goes through the handler's own getPetImage() — the same call its onPetInfo() makes —
    // before reaching the view's updateImage().
    private onPetFigureUpdate = (event: RoomWidgetPetFigureUpdateEvent): void =>
    {
        this._petView.updateImage(event.petId, this.handler.getPetImage(event.figure));
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onPetCommands()
    // The breeding-train command (id 46) is stripped for species whose nest breeding is switched off
    // in config — AS3 mutates the event's own arrays in place before building the configuration.
    private onPetCommands = (event: RoomWidgetPetCommandsUpdateEvent): void =>
    {
        const allCommands = event.allCommands;
        const enabledCommands = event.enabledCommands;
        const type = this._petData.type;

        const breedingDisabled =
            (type === InfoStandWidget.PET_TYPE_DOG && !(this._config?.getBoolean('nest.breeding.dog.enabled') ?? false)) ||
            (type === InfoStandWidget.PET_TYPE_CAT && !(this._config?.getBoolean('nest.breeding.cat.enabled') ?? false)) ||
            (type === InfoStandWidget.PET_TYPE_PIG && !(this._config?.getBoolean('nest.breeding.pig.enabled') ?? false));

        if(breedingDisabled)
        {
            const allIndex = allCommands.indexOf(RoomWidgetPetCommandMessage.BREED_TRAIN_COMMAND_ID);

            if(allIndex !== -1) allCommands.splice(allIndex, 1);

            const enabledIndex = enabledCommands.indexOf(RoomWidgetPetCommandMessage.BREED_TRAIN_COMMAND_ID);

            if(enabledIndex !== -1) enabledCommands.splice(enabledIndex, 1);
        }

        this._petView.updateEnabledTrainingCommands(event.id, new CommandConfiguration(allCommands, enabledCommands));
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onOpenPetTraining()
    private onOpenPetTraining = (_event: unknown): void =>
    {
        this._petView.openTrainView();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onClosePetTraining()
    private onClosePetTraining = (_event: unknown): void =>
    {
        this._petView.closeTrainView();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::updateUserData()
    public updateUserData(userId: number, figure: string, achievementScore: number, motto: string, mottoEnabled: boolean, badgesRank: number = -1): void
    {
        if(userId !== this._userData.userId) return;

        // Recorded for every user, bot included — the click handler reads it off the data, not the
        // view, and a bot simply never shows the row.
        this._userData.badgesRank = badgesRank;

        if(this._userData.isBot())
        {
            this._botView.setFigure(figure);
        }
        else
        {
            this._userView.setFigure(figure);
            this._userView.setMotto(motto, mottoEnabled);

            if(this.handler.isActivityDisplayEnabled)
            {
                this._userView.achievementScore = achievementScore;
            }

            // Not behind isActivityDisplayEnabled: AS3 gates only the achievement score on that
            // flag, and the rank row hides itself through its own -1 sentinel instead.
            this._userView.badgesRank = badgesRank;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::refreshBadges()
    public refreshBadges(userId: number, badges: string[]): void
    {
        if(userId !== this._userData.userId) return;

        this._userData.badges = badges;

        if(this._userData.isBot())
        {
            this._botView.clearBadges();
        }
        else
        {
            this._userView.clearBadges();
        }

        for(const badgeId of badges)
        {
            this.refreshBadge(badgeId);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::refreshBadge()
    public refreshBadge(badgeId: string): void
    {
        const index = this._userData.badges.indexOf(badgeId);

        if(index >= 0)
        {
            if(this._userData.isBot())
            {
                this._botView.setBadge(index, badgeId);
            }
            else
            {
                this._userView.setBadge(index, badgeId);
            }

            return;
        }

        if(badgeId === this._userData.groupBadgeId)
        {
            this._userView.setGroupBadge(badgeId);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onRoomObjectSelected()
    private onRoomObjectSelected = (event: RoomWidgetRoomObjectUpdateEvent): void =>
    {
        this.messageListener?.processWidgetMessage(
            new RoomWidgetRoomObjectMessage(RoomWidgetRoomObjectMessage.GET_OBJECT_INFO, event.id, event.category)
        );
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onRoomObjectRemoved()
    private onRoomObjectRemoved = (event: RoomWidgetRoomObjectUpdateEvent): void =>
    {
        let shouldClose = false;

        switch(event.type)
        {
            case RoomWidgetRoomObjectUpdateEvent.FURNI_REMOVED:
                shouldClose = event.id === this._furniData.id;
                break;
            case RoomWidgetRoomObjectUpdateEvent.USER_REMOVED:
                if(this._userView.window?.visible)
                {
                    shouldClose = event.id === this._userData.userRoomId;
                    break;
                }

                if(this._petView.window?.visible)
                {
                    shouldClose = event.id === this._petData.roomIndex;
                    break;
                }

                if(this._botView.window?.visible)
                {
                    shouldClose = event.id === this._userData.userRoomId;
                    break;
                }

                if(this._rentableBotView.window?.visible)
                {
                    shouldClose = event.id === this._rentableBotData.userRoomId;
                }

                break;
        }

        if(shouldClose)
        {
            this.close();
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::close()
    public close(): void
    {
        this.hideChildren();
        this.stopUpdateTimer();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::onClose()
    // AS3 stops the timer a second time after close() has already stopped it; harmless there and
    // here, and kept so the two methods stay line-for-line comparable.
    private onClose = (_event: unknown): void =>
    {
        this.close();
        this.stopUpdateTimer();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::hideChildren()
    private hideChildren(): void
    {
        if(!this._mainContainer) return;

        for(let i = 0; i < this._mainContainer.numChildren; i++)
        {
            const child = this._mainContainer.getChildAt(i);

            if(child) child.visible = false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::isFurniViewVisible()
    public isFurniViewVisible(): boolean
    {
        const child = this._mainContainer?.getChildByName(InfoStandWidget.VIEW_NAME.FURNI);

        return child?.visible ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::selectView()
    private selectView(name: string): void
    {
        this.hideChildren();

        const child = this.mainContainer.getChildByName(name);

        if(!child) return;

        child.visible = true;
        this.mainContainer.visible = true;
        this.mainContainer.width = child.width;
        this.mainContainer.height = child.height;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::refreshContainer()
    public refreshContainer(): void
    {
        for(let i = 0; i < this.mainContainer.numChildren; i++)
        {
            const child = this.mainContainer.getChildAt(i);

            if(child?.visible)
            {
                this.mainContainer.width = child.width;
                this.mainContainer.height = child.height;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandWidget.as::release()
    public override release(): void
    {
        this.close();
        super.release();
    }
}
