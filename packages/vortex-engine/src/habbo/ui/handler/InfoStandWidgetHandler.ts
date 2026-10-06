/**
 * InfoStandWidgetHandler
 *
 * @see sources/win63_version/habbo/ui/handler/InfoStandWidgetHandler.as
 *
 * Covers furni info (category 10/20) and user/bot identity info (category 100,
 * Phase 1 scope — see handleGetUserInfoMessage()'s header for what's deferred:
 * moderation, trade, group badge, respect, the selected-badges round-trip).
 * `getWidgetMessages()` returns the full AS3 message-type list (so `RoomDesktop`
 * registers this handler for all of them, matching AS3 structure exactly), but
 * `processWidgetMessage()` only implements the furni/user/bot-relevant cases.
 * Every other case carries its own port-gap marker — no case from `getWidgetMessages()` is
 * silently dropped from the switch.
 */
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {RoomObjectOperationEnum} from '@habbo/room/object/RoomObjectOperationEnum';
import {RoomSessionUserFigureUpdateEvent} from '@habbo/session/events/RoomSessionUserFigureUpdateEvent';
import {RoomSessionFavouriteGroupUpdateEvent} from '@habbo/session/events/RoomSessionFavouriteGroupUpdateEvent';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {ImageResult} from '@habbo/room/ImageResult';
import {Logger} from '@core/utils/Logger';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {StuffDataFactory} from '@habbo/room/object/data/StuffDataFactory';
import {
    HabboGroupDetailsMessageEvent
} from '@habbo/communication/messages/incoming/users/HabboGroupDetailsMessageEvent';
import {RelationshipStatusInfoEvent} from '@habbo/communication/messages/incoming/users/RelationshipStatusInfoEvent';
import type {RelationshipStatusInfoMessageParser} from '@habbo/communication/messages/parser/users/RelationshipStatusInfoMessageParser';
import {
    GetHabboGroupDetailsMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetHabboGroupDetailsMessageComposer';
import {RoomWidgetMessage} from '@habbo/ui/widget/messages/RoomWidgetMessage';
import {RoomWidgetRoomObjectNameEvent} from '@habbo/ui/widget/events/RoomWidgetRoomObjectNameEvent';
import {RoomWidgetRoomObjectMessage} from '@habbo/ui/widget/messages/RoomWidgetRoomObjectMessage';
import {RoomWidgetChangeMottoMessage} from '@habbo/ui/widget/messages/RoomWidgetChangeMottoMessage';
import {RoomWidgetFurniActionMessage} from '@habbo/ui/widget/messages/RoomWidgetFurniActionMessage';
import {RoomWidgetGetBadgeDetailsMessage} from '@habbo/ui/widget/messages/RoomWidgetGetBadgeDetailsMessage';
import {RoomWidgetGetBadgeImageMessage} from '@habbo/ui/widget/messages/RoomWidgetGetBadgeImageMessage';
import {RoomWidgetRoomTagSearchMessage} from '@habbo/ui/widget/messages/RoomWidgetRoomTagSearchMessage';
import {RoomWidgetPresentOpenMessage} from '@habbo/ui/widget/messages/RoomWidgetPresentOpenMessage';
import {RoomWidgetChatInputContentUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetChatInputContentUpdateEvent';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {RoomWidgetOpenProfileMessage} from '@habbo/ui/widget/messages/RoomWidgetOpenProfileMessage';
import {RoomWidgetUserActionMessage} from '@habbo/ui/widget/messages/RoomWidgetUserActionMessage';
import {RoomWidgetPetCommandMessage} from '@habbo/ui/widget/messages/RoomWidgetPetCommandMessage';
import {
    RespectPetMessageComposer
} from '@habbo/communication/messages/outgoing/room/RespectPetMessageComposer';
import {
    GiveSupplementToPetMessageComposer
} from '@habbo/communication/messages/outgoing/room/pet/GiveSupplementToPetMessageComposer';
import {
    PassCarryItemToPetMessageComposer
} from '@habbo/communication/messages/outgoing/room/avatar/PassCarryItemToPetMessageComposer';
import {PassCarryItemMessageComposer} from '@habbo/communication/messages/outgoing/room/avatar/PassCarryItemMessageComposer';
import {DropCarryItemMessageComposer} from '@habbo/communication/messages/outgoing/room/avatar/DropCarryItemMessageComposer';
import {
    GetExtendedProfileMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import {RoomWidgetFurniInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent';
import {RoomWidgetSongUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetSongUpdateEvent';
import type {IHabboMusicController} from '@habbo/sound/IHabboMusicController';
import {NowPlayingEvent} from '@habbo/sound/events/NowPlayingEvent';
import {SongInfoReceivedEvent} from '@habbo/sound/events/SongInfoReceivedEvent';
import {RoomWidgetUserInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetUserInfoUpdateEvent';
import type {RoomModerationSettings} from '@habbo/communication/messages/incoming/navigator';
import {
    GetRelationshipStatusInfoMessageComposer
} from '@habbo/communication/messages/outgoing/friendlist/GetRelationshipStatusInfoMessageComposer';
import {RoomWidgetRentableBotInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetRentableBotInfoUpdateEvent';
import {RoomWidgetPetInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent';
import {RoomSessionPetInfoUpdateEvent} from '@habbo/session/events/RoomSessionPetInfoUpdateEvent';
import {RoomSessionPetCommandsUpdateEvent} from '@habbo/session/events/RoomSessionPetCommandsUpdateEvent';
import {RoomSessionPetFigureUpdateEvent} from '@habbo/session/events/RoomSessionPetFigureUpdateEvent';
import {RoomSessionPetBreedingEvent} from '@habbo/session/events/RoomSessionPetBreedingEvent';
import {RoomSessionPetBreedingResultEvent} from '@habbo/session/events/RoomSessionPetBreedingResultEvent';
import {RoomSessionConfirmPetBreedingEvent} from '@habbo/session/events/RoomSessionConfirmPetBreedingEvent';
import {
    RoomSessionConfirmPetBreedingResultEvent
} from '@habbo/session/events/RoomSessionConfirmPetBreedingResultEvent';
import {RoomWidgetPetCommandsUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetCommandsUpdateEvent';
import {RoomWidgetPetFigureUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetFigureUpdateEvent';
import {RoomWidgetPetBreedingEvent} from '@habbo/ui/widget/events/RoomWidgetPetBreedingEvent';
import {RoomWidgetPetBreedingResultEvent} from '@habbo/ui/widget/events/RoomWidgetPetBreedingResultEvent';
import {RoomWidgetConfirmPetBreedingEvent} from '@habbo/ui/widget/events/RoomWidgetConfirmPetBreedingEvent';
import {
    RoomWidgetConfirmPetBreedingResultEvent
} from '@habbo/ui/widget/events/RoomWidgetConfirmPetBreedingResultEvent';
import {PetBreedingResultEventData} from '@habbo/ui/widget/events/PetBreedingResultEventData';
import {ConfirmPetBreedingPetData} from '@habbo/ui/widget/events/ConfirmPetBreedingPetData';
import {BreedingRarityCategoryData} from '@habbo/ui/widget/events/BreedingRarityCategoryData';
import type {PetBreedingResultData} from '@habbo/communication/messages/incoming/room/pet/PetBreedingResultData';
import type {BreedingPetInfo} from '@habbo/communication/messages/incoming/room/pet/BreedingPetInfo';
import {PetFigureData} from '@habbo/avatar/pets/PetFigureData';
import {
    PetSelectedMessageComposer
} from '@habbo/communication/messages/outgoing/room/pet/PetSelectedMessageComposer';
import {
    SetObjectDataMessageComposer
} from '@habbo/communication/messages/outgoing/room/furniture/SetObjectDataMessageComposer';
import {RoomWidgetInfostandExtraParamEnum} from '@habbo/ui/widget/enums/RoomWidgetInfostandExtraParamEnum';
import {Vector3d} from '@room/utils/Vector3d';
import type {IUserData} from '@habbo/session/IUserData';
import type {InfoStandWidget} from '@habbo/ui/widget/infostand/InfoStandWidget';
import type {ISelectedBadge} from '@habbo/communication/messages/parser/users/HabboUserBadgesMessageParser';
import {BuilderClubUtils} from '@habbo/utils/BuilderClubUtils';

const log = Logger.getLogger('habbo.ui.handler.InfoStandWidgetHandler');

export class InfoStandWidgetHandler implements IRoomWidgetHandler, IGetImageListener 
{
    /**
     * The one message type `getWidgetMessages()` advertises that nothing acts on — **and AS3 does
     * not act on it either**: `RWUAM_TRAIN_PET` is declared there and has no case in AS3's switch,
     * so it is a no-op in the Flash client too. Kept as a set rather than a bare comparison so a
     * future addition has somewhere to go, and so the log line names what fired.
     *
     * This list used to hold 44 entries covering the whole social and moderation half of the avatar
     * menu; those are implemented now (`processUserScopedAction()`), and the rest were never
     * missing at all — they are dispatched by `instanceof`, not by string, so they never reached
     * the tail of `processWidgetMessage()`.
     */
    private static readonly UNIMPLEMENTED_WIDGET_MESSAGES = new Set<string>([
        'RWUAM_TRAIN_PET',
    ]);

    private _groupDetailsEvent: IMessageEvent | null = null;
    private readonly _pendingImageRequests: Map<number, {
        furniId: number;
        category: number;
        roomId: number;
        scale: number
    }> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::_cachedPetImages
    private _cachedPetImages: Map<string, ImageBitmap | null> | null = new Map();

    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::_musicController
    private _musicController: IHabboMusicController | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::InfoStandWidgetHandler()
    constructor(musicController: IHabboMusicController | null = null)
    {
        this._musicController = musicController;

        if(this._musicController)
        {
            this._musicController.events.on(NowPlayingEvent.NOW_PLAYING_SONG_CHANGED, this.onNowPlayingChanged);
            this._musicController.events.on(SongInfoReceivedEvent.TRAX_SONG_INFO_RECEIVED, this.onSongInfoReceivedEvent);
        }
    }

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::get container()
    public get container(): IRoomWidgetHandlerContainer | null 
    {
        return this._container;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::set container()
    // AS3 registers nine roomSessionManager listeners here, and all nine are wired below.
    //
    // AS3 dispatches these on `roomSessionManager.events`; this port routes session events
    // through `sessionEvents` instead (see .claude/rules/20-architecture.md #4 — `events` is
    // reserved by the DI Component base). RoomUsersHandler emits PET_INFO on exactly that
    // emitter, so it is the correct subscription point.
    public set container(value: IRoomWidgetHandlerContainer | null)
    {
        if(this._container?.connection && this._groupDetailsEvent)
        {
            this._container.connection.removeMessageEvent(this._groupDetailsEvent);
            this._groupDetailsEvent.dispose();
            this._groupDetailsEvent = null;
        }

        if(this._container?.connection && this._relationshipStatusEvent)
        {
            this._container.connection.removeMessageEvent(this._relationshipStatusEvent);
            this._relationshipStatusEvent.dispose();
            this._relationshipStatusEvent = null;
        }

        const previousEvents = this._container?.roomSessionManager?.sessionEvents;

        if(previousEvents)
        {
            previousEvents.off(RoomSessionUserFigureUpdateEvent.USER_FIGURE, this.onFigureUpdate);
            previousEvents.off(RoomSessionFavouriteGroupUpdateEvent.FAVOURITE_GROUP_UPDATE, this.onFavouriteGroupUpdated);
            previousEvents.off(RoomSessionPetInfoUpdateEvent.PET_INFO, this.onPetInfo);
            previousEvents.off(RoomSessionPetCommandsUpdateEvent.PET_COMMANDS, this.onPetCommands);
            previousEvents.off(RoomSessionPetFigureUpdateEvent.PET_FIGURE_UPDATE, this.onPetFigureUpdate);
            previousEvents.off(RoomSessionPetBreedingResultEvent.PET_BREEDING_RESULT, this.onPetBreedingResult);
            previousEvents.off(RoomSessionPetBreedingEvent.PET_BREEDING, this.onPetBreedingEvent);
            previousEvents.off(RoomSessionConfirmPetBreedingEvent.CONFIRM_PET_BREEDING, this.onConfirmPetBreedingEvent);
            previousEvents.off(
                RoomSessionConfirmPetBreedingResultEvent.CONFIRM_PET_BREEDING_RESULT,
                this.onConfirmPetBreedingResultEvent
            );
        }

        this._container = value;

        if(!value) return;

        const sessionEvents = value.roomSessionManager?.sessionEvents;

        if(sessionEvents)
        {
            sessionEvents.on(RoomSessionUserFigureUpdateEvent.USER_FIGURE, this.onFigureUpdate);
            sessionEvents.on(RoomSessionFavouriteGroupUpdateEvent.FAVOURITE_GROUP_UPDATE, this.onFavouriteGroupUpdated);
            sessionEvents.on(RoomSessionPetInfoUpdateEvent.PET_INFO, this.onPetInfo);
            sessionEvents.on(RoomSessionPetCommandsUpdateEvent.PET_COMMANDS, this.onPetCommands);
            sessionEvents.on(RoomSessionPetFigureUpdateEvent.PET_FIGURE_UPDATE, this.onPetFigureUpdate);
            sessionEvents.on(RoomSessionPetBreedingResultEvent.PET_BREEDING_RESULT, this.onPetBreedingResult);
            sessionEvents.on(RoomSessionPetBreedingEvent.PET_BREEDING, this.onPetBreedingEvent);
            sessionEvents.on(RoomSessionConfirmPetBreedingEvent.CONFIRM_PET_BREEDING, this.onConfirmPetBreedingEvent);
            sessionEvents.on(
                RoomSessionConfirmPetBreedingResultEvent.CONFIRM_PET_BREEDING_RESULT,
                this.onConfirmPetBreedingResultEvent
            );
        }

        if(value.connection)
        {
            this._groupDetailsEvent = new HabboGroupDetailsMessageEvent(this.onGroupDetails);
            value.connection.addMessageEvent(this._groupDetailsEvent);

            this._relationshipStatusEvent = new RelationshipStatusInfoEvent(this.onRelationshipStatusEvent);
            value.connection.addMessageEvent(this._relationshipStatusEvent);
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::_SafeStr_6375
    // Name DERIVED: obfuscated in every tree, named after the event it holds.
    private _relationshipStatusEvent: RelationshipStatusInfoEvent | null = null;

    private _widget: InfoStandWidget | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::set widget()
    public set widget(widget: InfoStandWidget | null) 
    {
        this._widget = widget;
    }

    /**
     * A room occupant changed their look, motto or achievement score.
     *
     * The event's `roomIndex` is AS3's `userId`: it carries the room index, not the web id, and
     * AS3 resolves the real web id from the user record before handing it to the widget - which
     * matches on web id.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onFigureUpdate()
    private onFigureUpdate = (event: RoomSessionUserFigureUpdateEvent): void =>
    {
        if(!this._container || !event) return;

        if(event.roomIndex < 0) return;

        const userData = this._container.roomSession?.userDataManager?.getUserDataByIndex(event.roomIndex) ?? null;

        if(!userData) return;

        const webId = userData.webID;
        const isOwnUser = webId === this._container.sessionDataManager?.userId;

        this._widget?.updateUserData(webId, event.figure, event.achievementScore, event.customInfo, isOwnUser);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onFavouriteGroupUpdated()
    private onFavouriteGroupUpdated = (event: RoomSessionFavouriteGroupUpdateEvent): void =>
    {
        this._widget?.favouriteGroupUpdated(event.roomIndex, event.habboGroupId, event.status, event.habboGroupName);
    };

    public get type(): string 
    {
        return 'RWE_INFOSTAND';
    }

    /**
     * Whether the infostand shows the heart / smile / bobba rows at all. Gates the container; the
     * three rows inside it are then shown per user by `setRelationshipStatuses()`.
     */
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandUserView.as::createWindow()
    // (the `relationship.status.enabled` read; AS3 does it inline in the view, which has no config
    // of its own here — this handler is where every other config read in the widget already lives)
    public get isRelationshipStatusEnabled(): boolean
    {
        return this._container?.config?.getBoolean('relationship.status.enabled') ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::get isActivityDisplayEnabled()
    public get isActivityDisplayEnabled(): boolean
    {
        return this._container?.config?.getBoolean('activity.point.display.enabled') ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::dispose()
    // AS3 walks _cachedPetImages and calls BitmapData.dispose() on each entry before
    // dropping the map; ImageBitmap.close() is this port's equivalent (same convention as
    // BundleProductContainer / BitmapWrapperController).
    public dispose(): void
    {
        if(this._disposed) return;

        if(this._cachedPetImages)
        {
            for(const image of this._cachedPetImages.values()) image?.close();

            this._cachedPetImages.clear();
            this._cachedPetImages = null;
        }

        if(this._musicController)
        {
            this._musicController.events.off(NowPlayingEvent.NOW_PLAYING_SONG_CHANGED, this.onNowPlayingChanged);
            this._musicController.events.off(SongInfoReceivedEvent.TRAX_SONG_INFO_RECEIVED, this.onSongInfoReceivedEvent);
            this._musicController = null;
        }

        this._pendingImageRequests.clear();
        this.container = null;
        this._disposed = true;
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onNowPlayingChanged()
     *
     * The jukebox switched track. Name and creator stay empty when nothing is playing (id -1) or
     * when the info for that song has not been received yet — InfoStandJukeboxView reads the id
     * alone to decide between the "now playing" and "not playing" captions.
     */
    private onNowPlayingChanged = (event: NowPlayingEvent): void =>
    {
        if(!this._musicController) return;

        const songId = event.id;
        let songName = '';
        let songAuthor = '';

        if(songId !== -1)
        {
            const songInfo = this._musicController.getSongInfo(songId);

            if(songInfo)
            {
                songName = songInfo.name;
                songAuthor = songInfo.creator;
            }
        }

        const update = new RoomWidgetSongUpdateEvent(
            RoomWidgetSongUpdateEvent.SONG_PLAYING_CHANGED, songId, songName, songAuthor
        );

        this._container?.desktopEvents.emit(update.type, update);
    };

    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onSongInfoReceivedEvent()
    private onSongInfoReceivedEvent = (event: SongInfoReceivedEvent): void =>
    {
        if(!this._musicController) return;

        const songInfo = this._musicController.getSongInfo(event.id);

        if(!songInfo || !this._container) return;

        const update = new RoomWidgetSongUpdateEvent(
            RoomWidgetSongUpdateEvent.SONG_DATA_RECEIVED, event.id, songInfo.name, songInfo.creator
        );

        this._container.desktopEvents.emit(update.type, update);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::getWidgetMessages()
    public getWidgetMessages(): string[] 
    {
        return [
            RoomWidgetRoomObjectMessage.GET_OBJECT_INFO,
            RoomWidgetRoomObjectMessage.GET_OBJECT_NAME,
            'RWUAM_SEND_FRIEND_REQUEST', 'RWUAM_RESPECT_USER', 'RWUAM_REPLENISH_RESPECT_USER',
            'RWUAM_WIRED_INSPECT', 'RWUAM_WIRED_INSPECT_PET', 'RWUAM_WIRED_INSPECT_BOT',
            'RWUAM_OPEN_PROFILE', 'RWUAM_WHISPER_USER', 'RWUAM_IGNORE_USER', 'RWUAM_UNIGNORE_USER',
            'RWUAM_KICK_USER', 'RWUAM_BAN_USER_DAY', 'RWUAM_BAN_USER_HOUR', 'RWUAM_BAN_USER_PERM',
            'RWUAM_MUTE_USER_2MIN', 'RWUAM_MUTE_USER_5MIN', 'RWUAM_MUTE_USER_10MIN',
            'RWUAM_GIVE_RIGHTS', 'RWUAM_TAKE_RIGHTS', 'RWUAM_START_TRADING', 'RWUAM_OPEN_HOME_PAGE',
            'RWUAM_PASS_CARRY_ITEM', 'RWUAM_GIVE_CARRY_ITEM_TO_PET', 'RWUAM_DROP_CARRY_ITEM',
            RoomWidgetFurniActionMessage.MOVE, RoomWidgetFurniActionMessage.ROTATE,
            RoomWidgetFurniActionMessage.PICKUP, RoomWidgetFurniActionMessage.EJECT,
            RoomWidgetFurniActionMessage.USE, RoomWidgetFurniActionMessage.SAVE_STUFF_DATA,
            RoomWidgetFurniActionMessage.WIRED_INSPECT,
            'RWRTSM_ROOM_TAG_SEARCH', RoomWidgetGetBadgeDetailsMessage.WIDGET_MESSAGE_GET_BADGE_DETAILS,
            'RWGOI_MESSAGE_GET_BADGE_IMAGE', 'RWUAM_REPORT', 'RWUAM_PICKUP_PET', 'RWUAM_MOUNT_PET',
            'RWUAM_TOGGLE_PET_RIDING_PERMISSION', 'RWUAM_TOGGLE_PET_BREEDING_PERMISSION',
            'RWUAM_DISMOUNT_PET', 'RWUAM_SADDLE_OFF', 'RWUAM_TRAIN_PET',
            'RWPCM_PET_COMMAND', 'RWPCM_REQUEST_PET_COMMANDS', ' RWUAM_RESPECT_PET',
            'RWUAM_REQUEST_PET_UPDATE', 'RWVM_CHANGE_MOTTO_MESSAGE', 'RWOPEM_OPEN_USER_PROFILE',
            'RWPOM_OPEN_PRESENT', 'RWUAM_GIVE_LIGHT_TO_PET', 'RWUAM_GIVE_WATER_TO_PET',
            'RWUAM_REPORT_CFH_OTHER', 'RWUAM_AMBASSADOR_ALERT_USER',
            'RWUAM_AMBASSADOR_KICK_USER', 'RWUAM_AMBASSADOR_MUTE_2MIN', 'RWUAM_AMBASSADOR_MUTE_10MIN',
            'RWUAM_AMBASSADOR_MUTE_15MIN', 'RWUAM_AMBASSADOR_MUTE_60MIN', 'RWUAM_AMBASSADOR_MUTE_18HOUR',
            'RWUAM_AMBASSADOR_MUTE_36HOUR', 'RWUAM_AMBASSADOR_MUTE_72HOUR', 'RWUAM_AMBASSADOR_UNMUTE',
        ];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage()
    public processWidgetMessage(message: unknown): unknown 
    {
        if(!(message instanceof RoomWidgetMessage) || !this._container) return null;

        if(message instanceof RoomWidgetRoomObjectMessage && message.type === RoomWidgetRoomObjectMessage.GET_OBJECT_INFO) 
        {
            this.handleGetObjectInfoMessage(message);

            return null;
        }

        if(message instanceof RoomWidgetRoomObjectMessage && message.type === RoomWidgetRoomObjectMessage.GET_OBJECT_NAME) 
        {
            this.handleGetObjectNameMessage(message);

            return null;
        }

        if(message instanceof RoomWidgetFurniActionMessage) 
        {
            this.processFurniActionMessage(message);

            return null;
        }

        if(message instanceof RoomWidgetGetBadgeDetailsMessage) 
        {
            this._container.habboGroupsManager?.showGroupBadgeInfo(message.own, message.groupId);

            return null;
        }

        if(message instanceof RoomWidgetOpenProfileMessage && message.type === RoomWidgetOpenProfileMessage.OPEN_USER_PROFILE) 
        {
            this.handleOpenProfileMessage(message);

            return null;
        }

        if(message instanceof RoomWidgetUserActionMessage)
        {
            // Both are handled before processUserActionMessage(), which is pet-only and drops
            // anything whose id is not a pet in the room — the user, bot and moderation variants
            // would never survive that guard.
            if(this.processWiredInspect(message)) return null;
            if(this.processUserScopedAction(message)) return null;

            this.processUserActionMessage(message);

            return null;
        }

        // AS3: .../InfoStandWidgetHandler.as::processWidgetMessage() ("RWRTSM_ROOM_TAG_SEARCH")
        if(message instanceof RoomWidgetRoomTagSearchMessage)
        {
            this._container.navigator?.performTagSearch(message.tag);

            return null;
        }

        // AS3: .../InfoStandWidgetHandler.as::processWidgetMessage() ("RWGOI_MESSAGE_GET_BADGE_IMAGE")
        if(message instanceof RoomWidgetGetBadgeImageMessage)
        {
            this._widget?.refreshBadge(message.badgeId);

            return null;
        }

        // AS3: .../InfoStandWidgetHandler.as::processWidgetMessage() ("RWPOM_OPEN_PRESENT")
        // Opening a present closes the furni view that was showing it, and only that one — the
        // id test is what keeps a second present's view open.
        if(message instanceof RoomWidgetPresentOpenMessage)
        {
            const furniData = this._widget?.furniData ?? null;

            if(furniData != null && furniData.id === message.objectId && this._widget?.isFurniViewVisible())
            {
                this._widget.close();
            }

            return null;
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage()
        // ("RWPCM_REQUEST_PET_COMMANDS" / "RWPCM_PET_COMMAND"). Issuing a command is a chat line,
        // not a packet of its own — `value` already holds "<pet name> <command>".
        if(message instanceof RoomWidgetPetCommandMessage)
        {
            if(message.type === RoomWidgetPetCommandMessage.REQUEST_COMMANDS)
            {
                this._container.roomSession?.requestPetCommands(message.petId);
            }
            else if(message.type === RoomWidgetPetCommandMessage.PET_COMMAND && message.value !== null)
            {
                this._container.roomSession?.sendChatMessage(message.value);
            }

            return null;
        }

        // AS3: .../InfoStandWidgetHandler.as::processWidgetMessage() ("RWVM_CHANGE_MOTTO_MESSAGE")
        if(message instanceof RoomWidgetChangeMottoMessage)
        {
            this._container.roomSession?.sendChangeMottoMessage(message.motto);

            return null;
        }

        if(InfoStandWidgetHandler.UNIMPLEMENTED_WIDGET_MESSAGES.has(message.type))
        {
            log.debug(`Unimplemented widget message ${message.type}`);
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage() (RWUAM_* pet cases)
    //
    // The AS3 resolves the addressed entity up front — for every pet-scoped action it looks the
    // target up via userDataManager.getPetUserData(userId) and bails when that returns null (the
    // pet left the room mid-click). The user-scoped RWUAM cases take the same shape one method up,
    // in processUserScopedAction(), against getUserData() instead.
    /**
     * "Inspect in the wired menu" for a user, a bot or a pet.
     *
     * One branch for all three in AS3, and the link is the same either way — the `1` in it is the
     * inspection *type*, not the target kind, so a bot and a pet produce identical links to a
     * user's. Returns whether the message was one of the three.
     */
    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage()
    // (the RWUAM_WIRED_INSPECT / _BOT / _PET arm)
    private processWiredInspect(message: RoomWidgetUserActionMessage): boolean
    {
        if(message.type !== RoomWidgetUserActionMessage.WIRED_INSPECT
            && message.type !== RoomWidgetUserActionMessage.WIRED_INSPECT_BOT
            && message.type !== RoomWidgetUserActionMessage.WIRED_INSPECT_PET) return false;

        const container = this._container;
        const userData = container?.roomSession?.userDataManager.getUserData(message.userId) ?? null;

        if(!container?.roomEngine || userData == null) return true;

        container.roomEngine.createLinkEvent(`wiredmenu/open/inspection/1/${userData.roomObjectId}`);

        return true;
    }

    /**
     * Every RWUAM arm whose target is a *user*, not a pet: the social half of the avatar menu
     * (friend request, respect, whisper, ignore, trade, profile, home page) and the moderation half
     * (kick, ban, mute, rights, report) including the nine ambassador variants.
     *
     * Returns whether the message was one of them, so the caller can fall through to the pet-only
     * switch — AS3 has these in the same switch and picks the lookup by type up front, which is the
     * same split, written the other way round.
     *
     * The ambassador arms are not a separate mechanism: AS3 sends the *same* kick/mute/unmute
     * calls, and only the menu that offers them differs. `AMBASSADOR_MUTE_USER_15MIN` is the one
     * duration the ordinary mute menu does not have.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage()
    private processUserScopedAction(message: RoomWidgetUserActionMessage): boolean
    {
        const container = this._container;
        const session = container?.roomSession ?? null;

        if(container == null || session == null) return false;

        // AS3 resolves the target before the switch and drops the message when it is gone — a
        // click on someone who has just left must not send a moderation packet for them.
        const userData = session.userDataManager.getUserData(message.userId);

        switch(message.type)
        {
            case RoomWidgetUserActionMessage.SEND_FRIEND_REQUEST:
                if(userData != null) container.friendList?.askForAFriend(message.userId, userData.name);
                break;
            case RoomWidgetUserActionMessage.RESPECT_USER:
                container.sessionDataManager?.giveRespect(message.userId);
                break;
            case RoomWidgetUserActionMessage.REPLENISH_RESPECT:
                this.confirmRespectReplenish();
                break;
            case RoomWidgetUserActionMessage.OPEN_PROFILE:
                if(userData != null) container.connection?.send(new GetExtendedProfileMessageComposer(userData.webID));
                break;
            // AS3 puts the name straight into the chat input rather than sending anything.
            case RoomWidgetUserActionMessage.WHISPER_USER:
                if(userData != null)
                {
                    container.desktopEvents.emit(
                        RoomWidgetChatInputContentUpdateEvent.CHAT_INPUT_CONTENT,
                        new RoomWidgetChatInputContentUpdateEvent('whisper', userData.name)
                    );
                }
                break;
            case RoomWidgetUserActionMessage.IGNORE_USER:
                if(userData != null) container.sessionDataManager?.ignoreUser(userData.webID);
                break;
            case RoomWidgetUserActionMessage.UNIGNORE_USER:
                if(userData != null) container.sessionDataManager?.unignoreUser(userData.webID);
                break;
            case RoomWidgetUserActionMessage.KICK_USER:
            case RoomWidgetUserActionMessage.AMBASSADOR_KICK_USER:
                if(userData != null) session.kickUser(userData.webID);
                break;
            // The message type *is* the duration — AS3 hands the raw string to the composer.
            case RoomWidgetUserActionMessage.BAN_USER_DAY:
            case RoomWidgetUserActionMessage.BAN_USER_HOUR:
            case RoomWidgetUserActionMessage.BAN_USER_PERM:
                if(userData != null) session.banUserWithDuration(userData.webID, message.type);
                break;
            case RoomWidgetUserActionMessage.MUTE_USER_2MIN:
            case RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_2MIN:
                if(userData != null) session.muteUser(userData.webID, 2);
                break;
            case RoomWidgetUserActionMessage.MUTE_USER_5MIN:
                if(userData != null) session.muteUser(userData.webID, 5);
                break;
            case RoomWidgetUserActionMessage.MUTE_USER_10MIN:
            case RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_10MIN:
                if(userData != null) session.muteUser(userData.webID, 10);
                break;
            case RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_15MIN:
                if(userData != null) session.muteUser(userData.webID, 15);
                break;
            case RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_60MIN:
                if(userData != null) session.muteUser(userData.webID, 60);
                break;
            case RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_18HOUR:
                if(userData != null) session.muteUser(userData.webID, 1080);
                break;
            case RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_36HOUR:
                if(userData != null) session.muteUser(userData.webID, 2160);
                break;
            case RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_72HOUR:
                if(userData != null) session.muteUser(userData.webID, 4320);
                break;
            case RoomWidgetUserActionMessage.AMBASSADOR_UNMUTE_USER:
                if(userData != null) session.unmuteUser(userData.webID);
                break;
            case RoomWidgetUserActionMessage.AMBASSADOR_ALERT_USER:
                if(userData != null) session.ambassadorAlert(userData.webID);
                break;
            case RoomWidgetUserActionMessage.GIVE_RIGHTS:
                if(userData != null) session.assignRights(userData.webID);
                break;
            case RoomWidgetUserActionMessage.TAKE_RIGHTS:
                if(userData != null) session.removeRights(userData.webID);
                break;
            // Trading takes the *room* id, not the web id: the trade is with the avatar in front
            // of you, and the server matches it against who is actually in the room.
            case RoomWidgetUserActionMessage.START_TRADING:
                if(userData != null) container.inventory?.setupTrading(userData.roomObjectId);
                break;
            case RoomWidgetUserActionMessage.OPEN_HOME_PAGE:
                if(userData != null) container.sessionDataManager?.openHabboHomePage(userData.webID, userData.name);
                break;
            // AS3 passes `-1` for the room and null for the name: the report dialog looks both up.
            case RoomWidgetUserActionMessage.REPORT:
                if(userData != null) container.habboHelp?.reportUser(message.userId, -1, '');
                break;
            // 124 is the CFH topic id for "other", inline in AS3.
            case RoomWidgetUserActionMessage.REPORT_CFH_OTHER:
                container.habboHelp?.reportUser(message.userId, 124, '');
                break;
            default:
                return false;
        }

        return true;
    }

    /**
     * The duckets-for-respects purchase: refuse it outright when the purse cannot cover it, and
     * otherwise ask before spending. AS3 uses the *not_enough* title as the alert's body too —
     * transcribed as written, and it is why the dialog reads oddly.
     */
    // AS3: .../InfoStandWidgetHandler.as::processWidgetMessage() ("RWUAM_REPLENISH_RESPECT_USER")
    private confirmRespectReplenish(): void
    {
        const container = this._container;

        if(container == null) return;

        const duckets = container.catalog?.getPurse().getActivityPointsForType(0) ?? 0;
        const cost = container.config?.getInteger('respect.replenish_cost_duckets', 50) ?? 50;

        if(duckets < cost)
        {
            container.windowManager?.alert(
                '${respect.replenish.not_enough_duckets.title}',
                container.localization?.getLocalizationWithParams(
                    'respect.replenish.not_enough_duckets.title', '', 'amount', String(cost)
                ) ?? '',
                0,
                null
            );

            return;
        }

        container.windowManager?.confirm(
            '${respect.replenish.title}',
            container.localization?.getLocalizationWithParams(
                'respect.replenish.desc', '', 'amount', String(cost)
            ) ?? '',
            0,
            this.onRespectReplenishClicked
        );
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onRespectReplenishClicked()
    private onRespectReplenishClicked = (dialog: IDisposable, event: WindowEvent): void =>
    {
        dialog.dispose();

        if(event.type === 'WE_OK') this._container?.sessionDataManager?.replenishRespect();
    };

    private processUserActionMessage(message: RoomWidgetUserActionMessage): void
    {
        const container = this._container;

        if(!container?.roomSession) return;

        const petId = message.userId;

        // AS3 pre-resolves the pet's user data and returns null (drops the message) if the pet is
        // no longer in the room. Same guard here so a stale click can't fire a composer.
        if(container.roomSession.userDataManager.getPetUserData(petId) === null) return;

        switch(message.type)
        {
            case RoomWidgetUserActionMessage.PICK_UP_PET:
                container.roomSession.pickUpPet(petId);
                break;
            case RoomWidgetUserActionMessage.MOUNT_PET:
                container.roomSession.mountPet(petId);
                break;
            case RoomWidgetUserActionMessage.DISMOUNT_PET:
                container.roomSession.dismountPet(petId);
                break;
            case RoomWidgetUserActionMessage.TOGGLE_PET_RIDING_PERMISSION:
                container.roomSession.togglePetRidingPermission(petId);
                break;
            case RoomWidgetUserActionMessage.TOGGLE_PET_BREEDING_PERMISSION:
                container.roomSession.togglePetBreedingPermission(petId);
                break;
            case RoomWidgetUserActionMessage.SADDLE_OFF:
                container.roomSession.removeSaddleFromPet(petId);
                break;
            case RoomWidgetUserActionMessage.RESPECT_PET:
                container.sessionDataManager?.givePetRespect(petId);
                break;
            case RoomWidgetUserActionMessage.REQUEST_PET_UPDATE:
                container.roomSession.userDataManager.requestPetInfo(petId);
                break;
            // AS3 sends the care composers straight down the connection here, not through
            // sessionDataManager — so TREAT_PET reuses RespectPetMessageComposer without touching
            // the respect counter that givePetRespect() maintains.
            case RoomWidgetUserActionMessage.TREAT_PET:
                container.connection?.send(new RespectPetMessageComposer(petId));
                break;
            case RoomWidgetUserActionMessage.GIVE_WATER_TO_PET:
                container.connection?.send(new GiveSupplementToPetMessageComposer(petId, 0));
                break;
            case RoomWidgetUserActionMessage.GIVE_LIGHT_TO_PET:
                container.connection?.send(new GiveSupplementToPetMessageComposer(petId, 1));
                break;
            case RoomWidgetUserActionMessage.GIVE_CARRY_ITEM_TO_PET:
                container.connection?.send(new PassCarryItemToPetMessageComposer(petId));
                break;
            // The avatar-to-avatar hand-off. AS3 passes the same id every other user action in this
            // switch uses, so a pet target would be a pet id here — that is what the separate
            // GIVE_CARRY_ITEM_TO_PET case above is for.
            case RoomWidgetUserActionMessage.PASS_CARRY_ITEM:
                container.connection?.send(new PassCarryItemMessageComposer(petId));
                break;
            // No target and no body: the server knows what you are holding.
            case RoomWidgetUserActionMessage.DROP_CARRY_ITEM:
                container.connection?.send(new DropCarryItemMessageComposer());
                break;
            default:
                log.debug(`Unimplemented user-action message ${message.type}`);
                break;
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IGetImageListener.as::imageReady()
    public imageReady(id: number, data: ImageBitmap | null): void 
    {
        const pending = this._pendingImageRequests.get(id);

        this._pendingImageRequests.delete(id);

        if(!pending || !this._widget || this._widget.furniData.id !== pending.furniId) return;

        if(pending.scale === 64 && (!data || data.width > 140 || data.height > 200)) 
        {
            this.retryFurniImageAtScaleOne(pending);

            return;
        }

        this._widget.furniView.furniImage = data;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IGetImageListener.as::imageFailed()
    public imageFailed(id: number): void 
    {
        const pending = this._pendingImageRequests.get(id);

        this._pendingImageRequests.delete(id);

        if(pending && pending.scale === 64 && this._widget && this._widget.furniData.id === pending.furniId) 
        {
            this.retryFurniImageAtScaleOne(pending);
        }
    }

    /**
	 * Write the currently-inspected furni's stuff data — the same ad-furni branding feature as
	 * RWFAM_SAVE_STUFF_DATA above, entered from InfoStandFurniView instead of a widget message.
	 *
	 * Staff-only: AS3 gates the whole body on `hasSecurity(5)` and silently does nothing
	 * otherwise.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::setObjectData()
    public setObjectData(data: Map<string, string>): void
    {
        const container = this._container;

        if(!container?.connection || !container.sessionDataManager || !this._widget) return;

        if(container.sessionDataManager.hasSecurity(5))
        {
            container.connection.send(new SetObjectDataMessageComposer(this._widget.furniData.id, data));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::getProcessedEvents()
    public getProcessedEvents(): string[] 
    {
        return ['RSUBE_BADGES'];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processEvent()
    public processEvent(event: { type: string; userId: number; badges: string[] }): void 
    {
        if(event.type === 'RSUBE_BADGES' && this._widget) 
        {
            this._widget.refreshBadges(event.userId, event.badges);
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::update()
    // Empty in AS3 too — the per-frame hook exists only to satisfy IRoomWidgetHandler. What this
    // handler has to poll (the pet snapshot) runs off InfoStandWidget's own 3s timer instead.
    public update(): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onPetCommands()
    private onPetCommands = (event: RoomSessionPetCommandsUpdateEvent): void =>
    {
        const container = this._container;

        if(!container) return;

        const widgetEvent = new RoomWidgetPetCommandsUpdateEvent(event.petId, event.allCommands, event.enabledCommands);

        container.desktopEvents.emit(widgetEvent.type, widgetEvent);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onPetFigureUpdate()
    // AS3 renders the new figure to a BitmapData here and caches it in _cachedPetImages before
    // dispatching. This port's RoomWidgetPetFigureUpdateEvent carries the figure string instead —
    // the infostand's pet image is produced from the figure downstream — so there is nothing to
    // rasterise at this point.
    private onPetFigureUpdate = (event: RoomSessionPetFigureUpdateEvent): void =>
    {
        const container = this._container;

        if(!container) return;

        const widgetEvent = new RoomWidgetPetFigureUpdateEvent(event.petId, event.figure);

        container.desktopEvents.emit(widgetEvent.type, widgetEvent);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onPetBreedingResult()
    private onPetBreedingResult = (event: RoomSessionPetBreedingResultEvent): void =>
    {
        const container = this._container;

        if(!container) return;

        const resultData = event.resultData;
        const otherResultData = event.otherResultData;

        if(!resultData || !otherResultData) return;

        const widgetEvent = new RoomWidgetPetBreedingResultEvent(
            InfoStandWidgetHandler.toBreedingResultEventData(resultData),
            InfoStandWidgetHandler.toBreedingResultEventData(otherResultData)
        );

        container.desktopEvents.emit(widgetEvent.type, widgetEvent);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onPetBreedingEvent()
    private onPetBreedingEvent = (event: RoomSessionPetBreedingEvent): void =>
    {
        const container = this._container;

        if(!container) return;

        const widgetEvent = new RoomWidgetPetBreedingEvent();

        widgetEvent.state = event.state;
        widgetEvent.ownPetId = event.ownPetId;
        widgetEvent.otherPetId = event.otherPetId;

        container.desktopEvents.emit(widgetEvent.type, widgetEvent);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onConfirmPetBreedingEvent()
    private onConfirmPetBreedingEvent = (event: RoomSessionConfirmPetBreedingEvent): void =>
    {
        const container = this._container;

        if(!container) return;

        const pet1 = event.pet1;
        const pet2 = event.pet2;

        if(!pet1 || !pet2) return;

        const rarityCategories: BreedingRarityCategoryData[] = [];

        for(const category of event.rarityCategories)
        {
            const data = new BreedingRarityCategoryData();

            data.chance = category.chance;
            // AS3 copies the array with concat(); slice() is the TS equivalent.
            data.breeds = category.breeds.slice();

            rarityCategories.push(data);
        }

        const widgetEvent = new RoomWidgetConfirmPetBreedingEvent(
            event.nestId,
            InfoStandWidgetHandler.toConfirmPetBreedingPetData(pet1),
            InfoStandWidgetHandler.toConfirmPetBreedingPetData(pet2),
            rarityCategories,
            event.resultPetTypeId
        );

        container.desktopEvents.emit(widgetEvent.type, widgetEvent);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onConfirmPetBreedingResultEvent()
    private onConfirmPetBreedingResultEvent = (event: RoomSessionConfirmPetBreedingResultEvent): void =>
    {
        const container = this._container;

        if(!container) return;

        const widgetEvent = new RoomWidgetConfirmPetBreedingResultEvent(event.breedingNestStuffId, event.result);

        container.desktopEvents.emit(widgetEvent.type, widgetEvent);
    };

    // TS-only: no AS3 counterpart; AS3 inlines this copy field by field inside
    // onPetBreedingResult(), twice. Factored out only because it is done twice.
    private static toBreedingResultEventData(source: PetBreedingResultData): PetBreedingResultEventData
    {
        const data = new PetBreedingResultEventData();

        data.stuffId = source.stuffId;
        data.classId = source.classId;
        data.productCode = source.productCode;
        data.userId = source.userId;
        data.userName = source.userName;
        data.rarityLevel = source.rarityLevel;
        data.hasMutation = source.hasMutation;

        return data;
    }

    // TS-only: no AS3 counterpart; AS3 inlines this copy field by field inside
    // onConfirmPetBreedingEvent(), once per parent.
    private static toConfirmPetBreedingPetData(source: BreedingPetInfo): ConfirmPetBreedingPetData
    {
        const data = new ConfirmPetBreedingPetData();

        data.webId = source.webId;
        data.name = source.name;
        data.level = source.level;
        data.figure = source.figure;
        data.owner = source.owner;

        return data;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onPetInfo()
    private onPetInfo = (event: RoomSessionPetInfoUpdateEvent): void =>
    {
        const petInfo = event.petInfo;

        if(!petInfo) return;

        const container = this._container;

        if(!container?.sessionDataManager) return;

        const petData = container.roomSession.userDataManager.getPetUserData(petInfo.petId);

        if(!petData) return;

        const figure = petData.figure;
        const petType = this.getPetType(figure);
        const petRace = this.getPetRace(figure);

        // Only the monsterplant (pet type 16) renders a growth-stage posture; every other
        // type passes a null posture through to getPetImage().
        let posture: string | null = null;

        if(petType === 16)
        {
            posture = petInfo.level >= petInfo.adultLevel ? 'std' : `grw${petInfo.level}`;
        }

        // The cache key folds in the posture, so a growing monsterplant does not keep
        // serving the image it was first seen with. The win63_version decompile corrupts
        // this line to `figure + ""` and the getPetImage() call below to a null posture,
        // which would collapse every growth stage onto one cache entry — the primary is
        // clean and is what this follows.
        const cacheKey = figure + (posture !== null ? `/posture=${posture}` : '');
        let image = this._cachedPetImages?.get(cacheKey) ?? null;

        if(!image)
        {
            image = this.getPetImage(figure, posture);
            this._cachedPetImages?.set(cacheKey, image);
        }

        const isOwnPet = petInfo.ownerId === container.sessionDataManager.userId;
        const infoEvent = new RoomWidgetPetInfoUpdateEvent(
            petType, petRace, petData.name, petInfo.petId, image, isOwnPet,
            petInfo.ownerId, petInfo.ownerName, petData.roomObjectId, petInfo.breedId
        );

        infoEvent.level = petInfo.level;
        infoEvent.levelMax = petInfo.levelMax;
        infoEvent.experience = petInfo.experience;
        infoEvent.experienceMax = petInfo.experienceMax;
        infoEvent.energy = petInfo.energy;
        infoEvent.energyMax = petInfo.energyMax;
        infoEvent.nutrition = petInfo.nutrition;
        infoEvent.nutritionMax = petInfo.nutritionMax;
        infoEvent.petRespect = petInfo.respect;
        infoEvent.petRespectLeft = container.sessionDataManager.petRespectLeft;
        infoEvent.age = petInfo.age;
        infoEvent.hasFreeSaddle = petInfo.hasFreeSaddle;
        infoEvent.isRiding = petInfo.isRiding;
        infoEvent.canBreed = petInfo.canBreed;
        infoEvent.canHarvest = petInfo.canHarvest;
        infoEvent.canRevive = petInfo.canRevive;
        infoEvent.rarityLevel = petInfo.rarityLevel;
        infoEvent.skillTresholds = petInfo.skillTresholds;
        infoEvent.canRemovePet = false;
        infoEvent.accessRights = petInfo.accessRights;
        infoEvent.maxWellBeingSeconds = petInfo.maxWellBeingSeconds;
        infoEvent.remainingWellBeingSeconds = petInfo.remainingWellBeingSeconds;
        infoEvent.remainingGrowingSeconds = petInfo.remainingGrowingSeconds;
        infoEvent.hasBreedingPermission = petInfo.hasBreedingPermission;

        const roomSession = container.roomSession;

        if(isOwnPet)
        {
            infoEvent.canRemovePet = true;
        }
        else if(roomSession.isRoomOwner || container.sessionDataManager.isAnyRoomController || roomSession.roomControllerLevel >= 1)
        {
            infoEvent.canRemovePet = true;
        }

        container.desktopEvents.emit(infoEvent.type, infoEvent);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::getPetImage()
    // AS3 passes a null listener — getPetImage() is a synchronous read for it, and a miss
    // falls straight through to the grey placeholder. `this` goes in instead, which is inert:
    // imageReady()/imageFailed() only act on ids registered in _pendingImageRequests and
    // pet requests are never registered there.
    // Public (AS3 has it private) because this port's RWPIUE_PET_FIGURE_UPDATE carries the
    // figure string rather than AS3's already-rendered BitmapData, so InfoStandWidget has to
    // do the render itself — see InfoStandWidget.onPetFigureUpdate(). RoomEngine.getPetImage() honours AS3's
    // synchronous-hit contract (result.data set, result.id 0) once the pet content is
    // loaded, so the placeholder branch is the not-yet-loaded case — same as AS3.
    public getPetImage(figure: string, posture: string | null = null): ImageBitmap | null
    {
        const roomEngine = this._container?.roomEngine;

        if(!roomEngine) return null;

        const figureData = new PetFigureData(figure);
        const result = roomEngine.getPetImage(
            figureData.typeId, figureData.paletteId, figureData.color,
            new Vector3d(90), 64, this, true, 0, figureData.customParts, posture
        );

        return result?.data ?? this.createPlaceholderPetImage();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::getPetImage()
    // (the `new BitmapData(30,30,false,4289374890)` fallback — 4289374890 is opaque #AAAAAA)
    private createPlaceholderPetImage(): ImageBitmap | null
    {
        const canvas = new OffscreenCanvas(30, 30);
        const context = canvas.getContext('2d');

        if(!context) return null;

        context.fillStyle = '#AAAAAA';
        context.fillRect(0, 0, 30, 30);

        return canvas.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::getPetType()
    private getPetType(figure: string): number
    {
        return this.getSpaceSeparatedInteger(figure, 0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::getPetRace()
    private getPetRace(figure: string): number
    {
        return this.getSpaceSeparatedInteger(figure, 1);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::getSpaceSeparatedInteger()
    private getSpaceSeparatedInteger(figure: string, index: number): number
    {
        if(figure)
        {
            const parts = figure.split(' ');

            if(parts.length > index) return parseInt(parts[index], 10);
        }

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetPetInfoMessage()
    // requestPetInfo() is the call that actually fetches the info (GetPetInfoMessageComposer, 3899);
    // the petSelect branch is a fire-and-forget notification with no reply.
    private handleGetPetInfoMessage(petId: number): void
    {
        const container = this._container;

        if(!container) return;

        if(container.config?.getBoolean('petSelect.enabled'))
        {
            container.connection?.send(new PetSelectedMessageComposer(petId));
        }

        container.roomSession?.userDataManager.requestPetInfo(petId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onGroupDetails()
    /**
     * A user's relationship summary. Applied only while the infostand is actually on screen — the
     * server answers for whoever was last asked about, which may no longer be who is shown.
     */
    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::onRelationshipStatusEvent()
    private onRelationshipStatusEvent = (event: IMessageEvent): void =>
    {
        if(!this._widget || !this._widget.mainWindow?.visible) return;

        const parser = event.parser as RelationshipStatusInfoMessageParser | null;

        if(parser == null) return;

        this._widget.setRelationshipStatus(parser.userId, parser.relationshipStatusMap);
    };

    private onGroupDetails = (event: IMessageEvent): void =>
    {
        const data = (event as HabboGroupDetailsMessageEvent).data;

        if(!data || !this._widget || this._widget.furniData.groupId !== data.groupId) return;

        this._widget.furniView.groupBadgeId = data.badgeCode;
        this._widget.furniView.groupName = data.groupName;
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage() (RWFAM_* cases)
    private processFurniActionMessage(message: RoomWidgetFurniActionMessage): void 
    {
        const container = this._container;

        if(!container?.roomEngine) return;

        switch(message.type) 
        {
            case RoomWidgetFurniActionMessage.ROTATE:
                container.roomEngine.modifyRoomObject(message.furniId, message.furniCategory, RoomObjectOperationEnum.OBJECT_ROTATE_POSITIVE);
                break;
            case RoomWidgetFurniActionMessage.MOVE:
                container.roomEngine.modifyRoomObject(message.furniId, message.furniCategory, RoomObjectOperationEnum.OBJECT_MOVE);
                break;
            case RoomWidgetFurniActionMessage.PICKUP:
                this.pickupObjectWithConfirmation(message.furniId, message.furniCategory);
                break;
            case RoomWidgetFurniActionMessage.EJECT:
                container.roomEngine.modifyRoomObject(message.furniId, message.furniCategory, RoomObjectOperationEnum.OBJECT_EJECT);
                break;
            case RoomWidgetFurniActionMessage.USE:
                container.roomEngine.useRoomObjectInActiveRoom(message.furniId, message.furniCategory);
                break;
            // AS3: InfoStandWidgetHandler.as::processWidgetMessage() "RWFAM_WIRED_INSPECT" — the
            // wired menu keys a wall item by the *negated* furni id, which is how one link format
            // addresses both object spaces. Any other category falls through without a link.
            case RoomWidgetFurniActionMessage.WIRED_INSPECT: {
                let link = 'wiredmenu/open/inspection/0/';

                if(message.furniCategory === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
                {
                    link += String(message.furniId);
                }
                else if(message.furniCategory === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
                {
                    link += String(-message.furniId);
                }
                else
                {
                    break;
                }

                container.roomEngine.createLinkEvent(link);

                break;
            }
            // AS3: InfoStandWidgetHandler.as::processWidgetMessage() "RWFAM_SAVE_STUFF_DATA" —
            // objectData arrives as a flat "key=value" list joined by tabs and is rebuilt into the
            // map the composer serialises. `split('=', 2)` is AS3's own limit: a value containing
            // '=' is truncated there too, so it is kept rather than "fixed".
            case RoomWidgetFurniActionMessage.SAVE_STUFF_DATA: {
                const objectData = message.objectData;

                if(objectData === null) break;

                const data = new Map<string, string>();

                for(const entry of objectData.split('\t'))
                {
                    const pair = entry.split('=', 2);

                    if(pair.length === 2) data.set(pair[0], pair[1]);
                }

                container.roomEngine.modifyRoomObjectDataWithMap(
                    message.furniId, message.furniCategory, RoomObjectOperationEnum.OBJECT_SAVE_STUFF_DATA, data
                );
                break;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::pickupObjectWithConfirmation()
    private pickupObjectWithConfirmation(furniId: number, furniCategory: number): void 
    {
        const container = this._container;

        if(!container?.roomEngine) return;

        // Picking up a Builder's Club item that is not in the warehouse loses it — the rental is
        // returned and the item is gone — so that one case asks first. A BC item that *is* in the
        // warehouse, and everything that is not a BC item at all, goes straight through.
        const isBuildersClubPickup = BuilderClubUtils.isBuilderClubId(furniId)
            && (container.catalog?.buildersClubEnabled ?? false);

        if(isBuildersClubPickup && !(this._widget?.furniData.availableForBuildersClub ?? false))
        {
            container.windowManager?.confirm(
                '${generic.alert.title}',
                '${room.confirm.not_in_warehouse}',
                0,
                (dialog: {dispose(): void}, event: WindowEvent): void =>
                {
                    dialog.dispose();

                    if(event.type === 'WE_OK')
                    {
                        container.roomEngine?.modifyRoomObject(furniId, furniCategory, RoomObjectOperationEnum.OBJECT_PICKUP);
                    }
                }
            );

            return;
        }

        container.roomEngine.modifyRoomObject(furniId, furniCategory, RoomObjectOperationEnum.OBJECT_PICKUP);
    }

    /**
     * Answers "what is this object called?" for a floor item, a wall item or an avatar.
     *
     * The event's five fields mean different things per category, which is AS3's own reuse: for
     * furniture the id slot carries the *furniture type id* and the index slot the room object id,
     * and the user-type slot is left at 0. Nothing is dispatched when no name could be resolved —
     * an unknown furniture type answers with silence rather than an empty bubble.
     *
     * A poster is the one furniture type with no entry in the furniture data: its name is built
     * from the number in its own type string (`poster123` → `${poster_123_name}`), and its id slot
     * is -1 because there is no type id to put there.
     */
    // AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetObjectNameMessage()
    private handleGetObjectNameMessage(message: RoomWidgetRoomObjectMessage): void
    {
        const container = this._container;

        if(!container) return;

        const roomId = container.roomSession.roomId;

        let name: string | null = null;
        let userType = 0;
        let roomIndex = 0;
        let id = 0;

        switch(message.category)
        {
            case 10:
            case 20:
            {
                if(!container.desktopEvents || !container.roomEngine) return;

                const object = container.roomEngine.getRoomObject(roomId, message.id, message.category);

                if(!object) return;

                const type = object.getType();

                if(type.indexOf('poster') === 0)
                {
                    name = `\${poster_${parseInt(type.replace('poster', ''), 10)}_name}`;
                    roomIndex = object.getId();
                    id = -1;
                    break;
                }

                const typeId = object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID);
                const furnitureData = message.category === 10
                    ? container.sessionDataManager?.getFloorItemData(typeId) ?? null
                    : container.sessionDataManager?.getWallItemData(typeId) ?? null;

                if(!furnitureData) return;

                name = furnitureData.localizedName;
                roomIndex = object.getId();
                id = furnitureData.id;
                break;
            }
            case 100:
            {
                if(!container.roomSession || !container.sessionDataManager || !container.desktopEvents
                    || !container.roomEngine || !container.friendList) return;

                const userData = container.roomSession.userDataManager.getUserDataByIndex(message.id);

                if(!userData) return;

                name = userData.name;
                userType = userData.type;
                roomIndex = userData.roomObjectId;
                id = userData.webID;
                break;
            }
        }

        if(name === null) return;

        container.desktopEvents?.emit(
            RoomWidgetRoomObjectNameEvent.OBJECT_NAME,
            new RoomWidgetRoomObjectNameEvent(id, message.category, name, userType, roomIndex)
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetObjectInfoMessage()
    private handleGetObjectInfoMessage(message: RoomWidgetRoomObjectMessage): void 
    {
        const roomId = this._container?.roomSession.roomId;

        if(roomId === undefined) return;

        switch(message.category) 
        {
            case 10:
            case 20:
                this.handleGetFurniInfoMessage(message, roomId);
                break;
            case 100:
                this.handleGetUserObjectInfoMessage(message, roomId);
                break;
        }
    }

    /**
     * AS3's category-100 branch of handleGetObjectInfoMessage(): looks up the
     * clicked room object's user data and dispatches to the user/pet/bot/
     * rentable-bot handler by type.
     *
     * Phase 1 scope (identity only): user + bot are ported. Pet routes through
     * a separate composer/request flow (handleGetPetInfoMessage(), deferred
     * with the pet view — InfoStandPetView.ts is also a stub). Rentable bot is
     * deferred too — its AS3 event (RoomWidgetRentableBotInfoUpdateEvent) has
     * no TS port yet.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetObjectInfoMessage() (case 100)
    private handleGetUserObjectInfoMessage(message: RoomWidgetRoomObjectMessage, roomId: number): void 
    {
        const container = this._container;

        if(!container?.roomSession || !container.sessionDataManager || !container.roomEngine) return;

        const userData = container.roomSession.userDataManager.getUserDataByIndex(message.id);

        if(!userData) return;

        switch(userData.type) 
        {
            case 1:
                this.handleGetUserInfoMessage(roomId, message.id, message.category, userData);
                break;
            case 3:
                this.handleGetBotInfoMessage(roomId, message.id, message.category, userData);
                break;
            case 2:
                // AS3 passes the pet's webID here, not the room index it passes to the
                // user/bot handlers — requestPetInfo() keys on webID.
                this.handleGetPetInfoMessage(userData.webID);
                break;
            case 4:
                this.handleGetRentableBotInfoMessage(roomId, message.id, message.category, userData);
                break;
        }
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetUserInfoMessage()
     *
     * This used to stop after the identity fields, with a "Phase 1" note listing the rest as
     * deferred on dependencies the port did not have yet. Every one of them has since landed
     * (`IRoomSession.tradeMode`/`roomModerationSettings`/`isPrivateRoom`,
     * `ISessionDataManager.respectLeft`/`respectReplenishesLeft`/`systemShutDown`/`isIgnored`/
     * `getGroupBadgeId`, `IHabboGroupsManager.updateVisibleExtendedProfile`), so the note was
     * describing a blocker that no longer existed while three visible features stayed dead:
     * `isIgnored` left AvatarMenuView permanently showing "ignore" and never "unignore",
     * `canTrade` left the trade row hidden on every peer, and the missing trailing
     * `GetRelationshipStatusInfo` send meant `InfoStandUserView.setRelationshipStatuses()` was
     * waiting on an answer nobody had asked for, so the card's heart/smile/bobba rows never
     * appeared.
     *
     * Badges still read whatever `getUserSelectedBadges()` has cached and fire
     * `requestUserSelectedBadges()` beside it (AS3's own two calls, in AS3's order) rather than
     * awaiting the answer, so the first card a player opens repaints when it lands.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetUserInfoMessage()
    private handleGetUserInfoMessage(roomId: number, roomIndex: number, category: number, userData: IUserData): void 
    {
        const container = this._container;

        if(!container?.sessionDataManager || !container.roomEngine) return;

        const isOwnUser = userData.webID === container.sessionDataManager.userId;
        const event = new RoomWidgetUserInfoUpdateEvent(
            isOwnUser ? RoomWidgetUserInfoUpdateEvent.OWN_USER : RoomWidgetUserInfoUpdateEvent.PEER
        );

        event.isSpectatorMode = container.roomSession.isSpectatorMode;
        event.name = userData.name;
        event.motto = userData.custom;

        if(this.isActivityDisplayEnabled)
        {
            event.achievementScore = userData.achievementScore;
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetUserInfoMessage()
        // Unlike achievementScore, badgesRank is not gated by isActivityDisplayEnabled.
        event.badgesRank = userData.badgesRank;

        event.webID = userData.webID;
        event.userRoomId = roomIndex;
        event.userType = 1;

        const object = container.roomEngine.getRoomObject(roomId, roomIndex, category);

        if(object) 
        {
            event.carryItem = object.getModel().getNumber(RoomObjectVariableEnum.AVATAR_CARRY_OBJECT);
        }

        if(isOwnUser) 
        {
            event.realName = container.sessionDataManager.realName;
            event.allowNameChange = container.sessionDataManager.nameChangeAllowed;
        }

        event.amIOwner = container.roomSession.isRoomOwner;
        event.isGuildRoom = container.roomSession.isGuildRoom;
        event.myRoomControllerLevel = container.roomSession.roomControllerLevel;
        event.amIAnyRoomController = container.sessionDataManager.isAnyRoomController;
        event.amIAnAmbassador = container.sessionDataManager.isAmbassador;

        if(!isOwnUser)
        {
            event.isBlocked = container.sessionDataManager.isBlocked(userData.webID);
            event.canBeAskedAsFriend = container.friendList?.canBeAskedForAFriend(userData.webID) ?? false;

            const friend = container.friendList?.getFriendById(userData.webID) ?? null;

            if(friend)
            {
                event.realName = friend.realName;
                event.isFriend = true;
            }

            if(object)
            {
                // AS3 guards on isNaN() because the model returns NaN for a key it does not
                // hold, which RoomObjectModel.getNumber() reproduces — so the guard is load-
                // bearing here too, not decoration.
                const flatControl = object.getModel().getNumber(RoomObjectVariableEnum.AVATAR_FLAT_CONTROL);

                if(!isNaN(flatControl)) event.targetRoomControllerLevel = flatControl;

                // Ordered as AS3 orders it: the three permission checks read
                // targetRoomControllerLevel, which the line above has just set.
                event.canBeMuted = this.determineCanBeMuted(event);
                event.canBeKicked = this.determineCanBeKicked(event);
                event.canBeBanned = this.determineCanBeBanned(event);
            }

            event.isIgnored = container.sessionDataManager.isIgnored(userData.webID);
            event.respectLeft = container.sessionDataManager.respectLeft;
            event.respectReplenishesLeft = container.sessionDataManager.respectReplenishesLeft;

            const tradingAvailable = !container.sessionDataManager.systemShutDown;
            const tradeMode = container.roomSession.tradeMode;

            if(!tradingAvailable)
            {
                event.canTrade = false;
            }
            else
            {
                switch(tradeMode)
                {
                    case 1:
                        event.canTrade =
                            (event.myRoomControllerLevel !== 0 && event.myRoomControllerLevel !== 2)
                            || (event.targetRoomControllerLevel !== 0 && event.targetRoomControllerLevel !== 2);
                        break;
                    case 2:
                        event.canTrade = true;
                        break;
                    default:
                        event.canTrade = false;
                }
            }

            // Assigned in AS3's order, and the order is the behaviour: a non-trading room
            // overwrites the shutdown reason, so `tradingroom` wins when both hold.
            event.canTradeReason = 0;

            if(!tradingAvailable) event.canTradeReason = 2;
            if(tradeMode !== 2) event.canTradeReason = 3;
        }

        // AS3 spells this `int(param4.groupID)` — the field is a string on IUserData here too.
        const groupId = parseInt(userData.groupID, 10) || 0;

        event.groupId = groupId;
        event.groupBadgeId = container.sessionDataManager.getGroupBadgeId(groupId);
        event.groupName = userData.groupName;

        // getUserSelectedBadges() is a pure cache read; requestUserSelectedBadges() is the
        // one that sends the composer — kept as two calls (matching AS3's own split) instead
        // of the old fused getUserBadges(), which fired a request on every read. AS3 asks first
        // and reads second, so the first card a player opens shows an empty row and is repainted
        // when the answer lands.
        container.roomSession.userDataManager.requestUserSelectedBadges(userData.webID);

        const selectedBadges = container.roomSession.userDataManager.getUserSelectedBadges(userData.webID);

        event.selectedBadges = selectedBadges;
        event.badges = InfoStandWidgetHandler.getBadgeCodesFromSelectedBadges(selectedBadges);
        event.figure = userData.figure;

        container.desktopEvents.emit(event.type, event);

        container.habboGroupsManager?.updateVisibleExtendedProfile(userData.webID);
        // The card's heart/smile/bobba rows are filled by onRelationshipStatusEvent() ->
        // setRelationshipStatuses(); this is the request that answer replies to, and nothing
        // else in the port sends it for the infostand.
        container.connection?.send(new GetRelationshipStatusInfoMessageComposer(userData.webID));
    }

    /**
     * Whether the room's moderation settings let *this* player mute the card's subject.
     *
     * AS3 writes the three as one `determineModerationLevel()` taking a closure that picks
     * `whoCanMute`/`whoCanKick`/`whoCanBan` off the settings; kick alone short-circuits to true
     * at level 2 before the shared check runs.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::determineCanBeMuted()
    private determineCanBeMuted(userInfo: RoomWidgetUserInfoUpdateEvent): boolean
    {
        return this.determineModerationLevel(userInfo, (info, settings) =>
            InfoStandWidgetHandler.checkUserWithRightsModerationLevel(info, settings.whoCanMute));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::determineCanBeKicked()
    private determineCanBeKicked(userInfo: RoomWidgetUserInfoUpdateEvent): boolean
    {
        return this.determineModerationLevel(userInfo, (info, settings) =>
        {
            if(settings.whoCanKick === 2) return true;

            return InfoStandWidgetHandler.checkUserWithRightsModerationLevel(info, settings.whoCanKick);
        });
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::determineCanBeBanned()
    private determineCanBeBanned(userInfo: RoomWidgetUserInfoUpdateEvent): boolean
    {
        return this.determineModerationLevel(userInfo, (info, settings) =>
            InfoStandWidgetHandler.checkUserWithRightsModerationLevel(info, settings.whoCanBan));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::checkUserWithRightsModerationLevel()
    private static checkUserWithRightsModerationLevel(userInfo: RoomWidgetUserInfoUpdateEvent, level: number): boolean
    {
        const hasRights = userInfo.myRoomControllerLevel === 1 || userInfo.myRoomControllerLevel >= 4;
        const isGuildAdmin = userInfo.isGuildRoom && userInfo.myRoomControllerLevel >= 3;

        switch(level)
        {
            case 1:
                return hasRights;
            case 4:
                return isGuildAdmin;
            case 5:
                return hasRights || isGuildAdmin;
            default:
                return userInfo.myRoomControllerLevel >= 4;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::determineModerationLevel()
    private determineModerationLevel(
        userInfo: RoomWidgetUserInfoUpdateEvent,
        settingsFunction: (info: RoomWidgetUserInfoUpdateEvent, settings: RoomModerationSettings) => boolean
    ): boolean
    {
        const container = this._container;

        if(!container?.roomSession.isPrivateRoom) return false;

        const settings = container.roomSession.roomModerationSettings;
        const allowed = settings != null ? settingsFunction(userInfo, settings) : false;

        return allowed && userInfo.targetRoomControllerLevel < 4;
    }

    /**
     * The badge codes, indexed by the slot each badge sits in.
     *
     * Note this is a *sparse* array in AS3 and here: a user wearing only slot 3 gets three empty
     * holes before it, which is exactly what the view's fallback branch needs so the badge lands
     * in the right box.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::getBadgeCodesFromSelectedBadges()
    private static getBadgeCodesFromSelectedBadges(selectedBadges: ISelectedBadge[] | null): string[]
    {
        const codes: string[] = [];

        for(const badge of selectedBadges ?? [])
        {
            if(badge == null || badge.slotId < 0) continue;

            codes[badge.slotId] = badge.badgeCode;
        }

        return codes;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetBotInfoMessage()
    private handleGetBotInfoMessage(roomId: number, roomIndex: number, category: number, userData: IUserData): void 
    {
        const container = this._container;

        if(!container?.sessionDataManager || !container.roomEngine) return;

        const event = new RoomWidgetUserInfoUpdateEvent(RoomWidgetUserInfoUpdateEvent.BOT);

        event.name = userData.name;
        event.motto = userData.custom;
        event.webID = userData.webID;
        event.userRoomId = roomIndex;
        event.userType = userData.type;

        const object = container.roomEngine.getRoomObject(roomId, roomIndex, category);

        if(object) 
        {
            event.carryItem = object.getModel().getNumber(RoomObjectVariableEnum.AVATAR_CARRY_OBJECT);
        }

        event.amIOwner = container.roomSession.isRoomOwner;
        event.isGuildRoom = container.roomSession.isGuildRoom;
        event.myRoomControllerLevel = container.roomSession.roomControllerLevel;
        event.amIAnyRoomController = container.sessionDataManager.isAnyRoomController;
        event.canBeKicked = container.roomSession.isRoomOwner;
        event.badges = [RoomWidgetUserInfoUpdateEvent.DEFAULT_BOT_BADGE_ID];
        event.figure = userData.figure;

        container.desktopEvents.emit(event.type, event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetRentableBotInfoMessage()
    // The rentable-bot sibling of handleGetBotInfoMessage() above. Two payload differences that
    // matter: it carries the bot's owner (id and name, which the panel renders as a line of text)
    // and its skill list, and it has no kick/guild-room fields — a bot is not a peer.
    private handleGetRentableBotInfoMessage(roomId: number, roomIndex: number, category: number, userData: IUserData): void
    {
        const container = this._container;

        if(!container?.sessionDataManager || !container.roomEngine) return;

        const event = new RoomWidgetRentableBotInfoUpdateEvent();

        event.name = userData.name;
        event.motto = userData.custom;
        event.webID = userData.webID;
        event.userRoomId = roomIndex;
        event.ownerId = userData.ownerId;
        event.ownerName = userData.ownerName;
        event.botSkills = userData.botSkills;

        const object = container.roomEngine.getRoomObject(roomId, roomIndex, category);

        if(object)
        {
            event.carryItem = object.getModel().getNumber(RoomObjectVariableEnum.AVATAR_CARRY_OBJECT);
        }

        event.amIOwner = container.roomSession.isRoomOwner;
        event.myRoomControllerLevel = container.roomSession.roomControllerLevel;
        event.amIAnyRoomController = container.sessionDataManager.isAnyRoomController;
        event.badges = [RoomWidgetRentableBotInfoUpdateEvent.DEFAULT_BOT_BADGE_ID];
        event.figure = userData.figure;

        container.desktopEvents.emit(event.type, event);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage() (RWOPEM_OPEN_USER_PROFILE case)
    private handleOpenProfileMessage(message: RoomWidgetOpenProfileMessage): void 
    {
        const container = this._container;

        if(!container?.connection) return;

        container.habboTracking?.trackGoogle('extendedProfile', message.trackingLocation);

        const sent = container.connection.send(new GetExtendedProfileMessageComposer(message.userId));

        log.debug(`handleOpenProfileMessage: sent GetExtendedProfileMessageComposer(${message.userId}) -> ${sent}`);
    }

    // Renders the *live placed object* (real colors/extras/state, read straight off the room
    // object's own model) via RoomEngine.getRoomObjectImage() at scale 64 - matches AS3's first
    // attempt. AS3 reads the result synchronously and re-requests at scale 1 if the image is
    // null or larger than the panel's 140x200 slot; ImageBitmap conversion is always async in
    // the browser (see ImageResult.ts), so that same fallback check happens in imageReady()/
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::handleGetFurniInfoMessage()
    private handleGetFurniInfoMessage(message: RoomWidgetRoomObjectMessage, roomId: number): void 
    {
        const container = this._container;

        if(!container?.roomEngine || message.id < 0) return;

        const event = new RoomWidgetFurniInfoUpdateEvent(RoomWidgetFurniInfoUpdateEvent.FURNI);

        event.id = message.id;
        event.category = message.category;

        const object = container.roomEngine.getRoomObject(roomId, message.id, message.category);

        if(!object) return;

        const model = object.getModel();
        const extraParam = model.getString(RoomWidgetInfostandExtraParamEnum.INFOSTAND_EXTRAPARAM);

        if(extraParam) event.extraParam = extraParam;

        const dataFormat = model.getNumber(RoomObjectVariableEnum.FURNITURE_DATA_FORMAT);
        const stuffData = StuffDataFactory.getStuffDataForType(dataFormat);

        stuffData?.initializeFromRoomObjectModel(model);
        event.stuffData = stuffData;

        const type = object.getType();

        if(type.indexOf('poster') === 0) 
        {
            const posterId = parseInt(type.replace('poster', ''), 10);

            event.name = `\${poster_${posterId}_name}`;
            event.description = `\${poster_${posterId}_desc}`;
        }
        else 
        {
            const typeId = model.getNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID);
            const furnitureData = message.category === 10
                ? container.sessionDataManager?.getFloorItemData(typeId)
                : container.sessionDataManager?.getWallItemData(typeId);

            if(furnitureData) 
            {
                event.name = furnitureData.localizedName;
                event.isNft = furnitureData.className.indexOf('nft_') === 0;
                event.description = furnitureData.description;
                event.purchaseOfferId = furnitureData.purchaseOfferId;
                event.bcOfferId = furnitureData.bcOfferId;
                event.tradeable = furnitureData.tradeable;
                event.purchaseCouldBeUsedForBuyout = furnitureData.purchaseCouldBeUsedForBuyout;
                event.rentOfferId = furnitureData.rentOfferId;
                event.rentCouldBeUsedForBuyout = furnitureData.rentCouldBeUsedForBuyout;
                event.availableForBuildersClub = furnitureData.availableForBuildersClub;
                event.classId = typeId;
            }
        }

        if(type.indexOf('post_it') > -1) event.isStickie = true;

        const expiryTime = model.getNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIME);
        const expiryTimestamp = model.getNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIMESTAMP);

        event.expiration = expiryTime < 0 ? expiryTime : Math.max(0, expiryTime - (Date.now() - expiryTimestamp) / 1000);
        event.isWallItem = message.category === 20;
        event.isRoomOwner = container.roomSession.isRoomOwner;
        event.roomControllerLevel = container.roomSession.roomControllerLevel;
        event.isAnyRoomController = container.sessionDataManager?.isAnyRoomController ?? false;
        event.ownerId = model.getNumber(RoomObjectVariableEnum.FURNITURE_OWNER_ID);
        event.ownerName = model.getString(RoomObjectVariableEnum.FURNITURE_OWNER_NAME);
        event.usagePolicy = model.getNumber(RoomObjectVariableEnum.FURNITURE_USAGE_POLICY);

        const groupId = model.getNumber(RoomObjectVariableEnum.FURNITURE_GUILD_CUSTOMIZED_GUILD_ID);

        if(groupId !== 0) 
        {
            event.groupId = groupId;
            container.connection?.send(new GetHabboGroupDetailsMessageComposer(groupId, false));
        }

        if(container.isOwnerOfFurniture?.(object)) 
        {
            event.isOwner = true;
        }

        // Publish the furni data before asking for its image, not after. imageReady() drops any
        // image whose pending.furniId does not match the widget's current furniData.id, and the
        // image request can now come back synchronously (see deliverFurniImage()) - which lands
        // here, mid-call, while the widget still holds the *previous* furni. AS3 gets away with the
        // opposite order only because its request is always deferred. Emitting first is safe for the
        // async path too: the widget is populated by then either way.
        container.desktopEvents.emit(event.type, event);

        this.emitSongInfoForFurni(event.extraParam);

        this.requestFurniImage(event, roomId);
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage()
     * (the extraParam tail of the RWFIUE_FURNI branch)
     *
     * A jukebox or a song disk needs a second event on top of the furni one: the furni data says
     * nothing about which song is involved. The jukebox reads it from the room playlist's current
     * track, a disk from the `RWEIEP_SONGDISK<id>` suffix of its own extraParam.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/InfoStandWidgetHandler.as::processWidgetMessage()
    private emitSongInfoForFurni(extraParam: string | null): void
    {
        if(!this._musicController || !this._container) return;
        if(extraParam === null || extraParam.length === 0) return;

        let songId = -1;
        let type = '';

        if(extraParam === RoomWidgetInfostandExtraParamEnum.INFOSTAND_EXTRAPARAM_JUKEBOX)
        {
            const playlist = this._musicController.getRoomItemPlaylist();

            if(playlist)
            {
                songId = playlist.nowPlayingSongId;
                type = RoomWidgetSongUpdateEvent.SONG_PLAYING_CHANGED;
            }
        }
        else if(extraParam.indexOf(RoomWidgetInfostandExtraParamEnum.INFOSTAND_EXTRAPARAM_SONGDISK) === 0)
        {
            songId = parseInt(extraParam.substr(RoomWidgetInfostandExtraParamEnum.INFOSTAND_EXTRAPARAM_SONGDISK.length));
            type = RoomWidgetSongUpdateEvent.SONG_DATA_RECEIVED;
        }

        if(songId === -1 || Number.isNaN(songId)) return;

        const songInfo = this._musicController.getSongInfo(songId);
        const update = new RoomWidgetSongUpdateEvent(type, songId, songInfo?.name ?? '', songInfo?.creator ?? '');

        this._container.desktopEvents.emit(update.type, update);
    }

    // imageFailed() below instead, once the scale-64 render actually comes back.
    private requestFurniImage(event: RoomWidgetFurniInfoUpdateEvent, roomId: number): void
    {
        const roomEngine = this._container?.roomEngine;

        if(!roomEngine) return;

        const result = roomEngine.getRoomObjectImage(roomId, event.id, event.category, new Vector3d(180), 64, this);

        this.deliverFurniImage(result, {furniId: event.id, category: event.category, roomId, scale: 64});
    }

    // Deliver an ImageResult on whichever contract it came back on. ImageResult's own header spells
    // the three out: id > 0 means the content is still loading and imageReady()/imageFailed() will
    // fire later; id === 0 is AS3's "synchronous hit" - the image is already on result.data and no
    // callback is ever coming; id < 0 means the request never started.
    //
    // Only the id > 0 branch used to be handled, so any furni whose content was already loaded -
    // that is, every furni actually visible in the room - had its image dropped on the floor and the
    // infostand stayed permanently blank, with nothing logged. The synchronous contract is not
    // hypothetical: getGenericRoomObjectImage() takes that branch precisely when the content is
    // available, which is the normal case here.
    //
    // Registering the pending entry before dispatching lets the id === 0 case reuse imageReady()'s
    // own oversize check, scale-1 retry and delivery rather than duplicating them. The retry cannot
    // recurse: it re-enters with scale 1, and the retry branch only triggers on scale 64.
    private deliverFurniImage(
        result: ImageResult | null,
        pending: {furniId: number; category: number; roomId: number; scale: number}
    ): void
    {
        if(!result || result.id < 0) return;

        this._pendingImageRequests.set(result.id, pending);

        if(result.id === 0) this.imageReady(result.id, result.data);
    }

    // TS-only: the "re-request at scale 1" fallback branch, shared by imageReady() and
    // imageFailed() above. AS3 spells it out inside each of the two.
    private retryFurniImageAtScaleOne(pending: {
        furniId: number;
        category: number;
        roomId: number;
        scale: number
    }): void 
    {
        const roomEngine = this._container?.roomEngine;

        if(!roomEngine) return;

        const result = roomEngine.getRoomObjectImage(pending.roomId, pending.furniId, pending.category, new Vector3d(180), 1, this);

        this.deliverFurniImage(result, {...pending, scale: 1});
    }
}
