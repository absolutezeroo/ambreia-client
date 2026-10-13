import {Logger} from '@ambreia/common/utils/Logger';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IRoomSession, RoomSessionStateType} from './IRoomSession';
import {RoomSessionState} from './IRoomSession';
import {
    AmbassadorAlertMessageComposer,
    AssignRightsMessageComposer,
    AvatarExpressionMessageComposer,
    BanUserWithDurationMessageComposer,
    CancelTypingMessageComposer,
    ChangeMottoMessageComposer,
    ChangePostureMessageComposer,
    ChatMessageComposer,
    CreditFurniRedeemMessageComposer,
    DanceMessageComposer,
    GetPetCommandsComposer,
    KickUserMessageComposer,
    LetUserInMessageComposer,
    MountPetComposer,
    MuteUserMessageComposer,
    OpenFlatConnectionMessageComposer,
    OpenPetPackageMessageComposer,
    PickUpPetComposer,
    PresentOpenMessageComposer,
    QuitMessageComposer,
    RemoveRightsMessageComposer,
    RemoveSaddleFromPetComposer,
    RoomDimmerChangeStateComposer,
    RoomDimmerGetPresetsComposer,
    RoomDimmerSavePresetComposer,
    ShoutMessageComposer,
    SignMessageComposer,
    StartTypingMessageComposer,
    TogglePetRidingPermissionComposer,
    UnmuteUserMessageComposer,
    UpdateClothingChangeFurnitureComposer,
    UseProductForPetComposer,
    WhisperMessageComposer,
} from '@ambreia/protocol/outgoing/room/index';
import {NewUserExperienceScriptProceedComposer,} from '@ambreia/protocol/outgoing/handshake/index';
import type {IUserDataManager} from "./IUserDataManager";
import {UserDataManager} from "./UserDataManager";

const log = Logger.getLogger('habbo.session.RoomSession');

/**
 * Ban duration types
 */
export const BanDuration = {
    HOUR: 'RWUAM_BAN_USER_HOUR',
    DAY: 'RWUAM_BAN_USER_DAY',
    PERMANENT: 'RWUAM_BAN_USER_PERM',
} as const;

/**
 * Room session implementation
 *
 * Based on AS3: com.sulake.habbo.session.RoomSession
 *
 * Represents an active session in a room. The key method is start()
 * which sends OpenFlatConnectionMessageComposer to enter the room.
 *
 * @see source_as_win63/habbo/session/RoomSession.as
 */
export class RoomSession implements IRoomSession
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_chatTrackingId
    private _chatTrackingId: number = 0;
    private _chatTrackingMap: Map<number, number> = new Map();
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_userDataManager
    private _userDataManager: UserDataManager = new UserDataManager();

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get userDataManager()
    get userDataManager(): IUserDataManager
    {
        return this._userDataManager;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_connection
    private _connection: IConnection | null = null;

    get connection(): IConnection | null
    {
        return this._connection;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSession.as::set connection()
    // AS3 forwards the connection on to its UserDataManager, which this port did not: RoomSession
    // builds its own UserDataManager (line ~98) and nothing ever gave it a connection, so every
    // method on it that sends a composer was silently inert — requestPetInfo() bailed on
    // `if(petData && this._connection)` and the pet infostand could never be requested. Note this
    // is a *different* instance from the one SessionDataManager builds, which does get a connection
    // wired; only that one worked.
    //
    // AS3's null-guard is kept: dispose() clears the field directly rather than through here, so
    // nothing depends on being able to null it via the setter.
    set connection(value: IConnection | null)
    {
        if(value === null) return;

        this._connection = value;

        if(this._userDataManager !== null) this._userDataManager.connection = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_roomId
    private _roomId: number = 0;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get roomId()
    get roomId(): number
    {
        return this._roomId;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set roomId()
    set roomId(value: number)
    {
        this._roomId = value;
    }

    private _roomPassword: string = '';

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get roomPassword()
    get roomPassword(): string
    {
        return this._roomPassword;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set roomPassword()
    set roomPassword(value: string)
    {
        this._roomPassword = value;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::_roomResources
    private _roomResources: string = '';

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get roomResources()
    get roomResources(): string
    {
        return this._roomResources;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set roomResources()
    set roomResources(value: string)
    {
        this._roomResources = value;
    }

    private _skipOpc: boolean = false;

    get skipOpc(): boolean
    {
        return this._skipOpc;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set skipOpc()
    set skipOpc(value: boolean)
    {
        this._skipOpc = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_state
    private _state: RoomSessionStateType = RoomSessionState.CREATED;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get state()
    get state(): RoomSessionStateType
    {
        return this._state;
    }

    // Session properties
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_ownUserRoomId
    private _ownUserRoomId: number = -1;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get ownUserRoomId()
    get ownUserRoomId(): number
    {
        return this._ownUserRoomId;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set ownUserRoomId()
    set ownUserRoomId(value: number)
    {
        this._ownUserRoomId = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_isRoomOwner
    private _isRoomOwner: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get isRoomOwner()
    get isRoomOwner(): boolean
    {
        return this._isRoomOwner;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set isRoomOwner()
    set isRoomOwner(value: boolean)
    {
        this._isRoomOwner = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_roomControllerLevel
    private _roomControllerLevel: number = 0;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get roomControllerLevel()
    // DEVIATION: AS3 answers 0 while the room is in wired play-test mode; the RPG has no wired.
    get roomControllerLevel(): number
    {
        return this._roomControllerLevel;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set roomControllerLevel()
    set roomControllerLevel(value: number)
    {
        if(value >= 0 && value <= 5)
        {
            this._roomControllerLevel = value;
        }
        else
        {
            log.warn(`Invalid roomControllerLevel ${value}, setting to ROOM_CONTROL_LEVEL_NONE instead`);
            this._roomControllerLevel = 0;
        }
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::_isSpectatorMode
    private _isSpectatorMode: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get isSpectatorMode()
    get isSpectatorMode(): boolean
    {
        return this._isSpectatorMode;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set isSpectatorMode()
    set isSpectatorMode(value: boolean)
    {
        this._isSpectatorMode = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_isUserDecorating
    private _isUserDecorating: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get isUserDecorating()
    get isUserDecorating(): boolean
    {
        return this._isUserDecorating;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set isUserDecorating()
    set isUserDecorating(value: boolean)
    {
        this._isUserDecorating = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/RoomSession.as::_isGameSession
    private _isGameSession: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get isGameSession()
    get isGameSession(): boolean
    {
        return this._isGameSession;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set isGameSession()
    set isGameSession(value: boolean)
    {
        this._isGameSession = value;
    }

    private _isNuxNotComplete: boolean = false;

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::get isNuxNotComplete()
    get isNuxNotComplete(): boolean
    {
        return this._isNuxNotComplete;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::set isNuxNotComplete()
    set isNuxNotComplete(value: boolean)
    {
        this._isNuxNotComplete = value;
    }

    /**
	 * Start the room session.
	 *
	 * Sends OpenFlatConnectionMessageComposer to enter the room.
	 *
	 * @see sources/win63_version/habbo/session/RoomSession.as start()
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::start()
    start(): boolean
    {
        if(this._state !== RoomSessionState.CREATED || this._connection === null)
        {
            return false;
        }

        this._state = RoomSessionState.STARTED;

        if(!this._skipOpc)
        {
            this._connection.send(new OpenFlatConnectionMessageComposer(this._roomId, this._roomPassword));
        }

        return true;
    }

    /**
	 * Reset the session with a new room ID
	 * Called when session is reinitialized (e.g., room forwarding)
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::reset()
    reset(newRoomId: number): void
    {
        if(newRoomId !== this._roomId)
        {
            this._roomId = newRoomId;
            this._isRoomOwner = false;
            this._roomControllerLevel = 0;
            this._isSpectatorMode = false;
        }
    }

    /**
	 * Quit the current room session
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::quit()
    quit(): void
    {
        if(this._connection === null)
        {
            return;
        }

        this._connection.send(new QuitMessageComposer());
    }

    /**
	 * Dispose the session and clean up resources
	 */
    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::dispose()
    dispose(): void
    {
        this._connection = null;

        this._state = RoomSessionState.ENDED;
        this._chatTrackingMap.clear();
        this._userDataManager.dispose();
    }

    // DEVIATION: in a game session AS3 sends the line as snow-war game chat (composer 3083) instead;
    //   the RPG fork removed Snow War and the games manager, which was the only game-session owner.
    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendChatMessage()
    sendChatMessage(message: string, styleId: number = 0): void
    {
        if(this._connection === null) return;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSession.as::sendChatMessage()
        message = message.replace(/&#[0-9]+;/g, '');

        this._chatTrackingMap.set(this._chatTrackingId, Date.now());
        this._connection.send(new ChatMessageComposer(message, styleId, this._chatTrackingId));

        this._chatTrackingId++;
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendChangeMottoMessage()
    sendChangeMottoMessage(motto: string): void
    {
        if(this._connection === null) return;

        this._connection.send(new ChangeMottoMessageComposer(motto));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendShoutMessage()
    sendShoutMessage(message: string, styleId: number = 0): void
    {
        if(this._connection === null) return;

        this._connection.send(new ShoutMessageComposer(message, styleId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendWhisperMessage()
    sendWhisperMessage(recipientName: string, message: string, styleId: number = 0): void
    {
        if(this._connection === null) return;

        this._connection.send(new WhisperMessageComposer(recipientName, message, styleId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendChatTypingMessage()
    sendChatTypingMessage(isTyping: boolean): void
    {
        if(this._connection === null) return;

        if(isTyping)
        {
            this._connection.send(new StartTypingMessageComposer());
        }
        else
        {
            this._connection.send(new CancelTypingMessageComposer());
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSession.as::receivedChatWithTrackingId()
    receivedChatWithTrackingId(trackingId: number): void
    {
        // AS3 uses remove(), which drops the entry whether or not it reports lag.
        this._chatTrackingMap.delete(trackingId);

        // AS3 reports chat lag over 2.5 s to HabboTracking here; tracking left with the core cut.
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendAvatarExpressionMessage()
    sendAvatarExpressionMessage(expressionId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new AvatarExpressionMessageComposer(expressionId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendSignMessage()
    sendSignMessage(signId: number): void
    {
        if(this._connection === null) return;

        if(signId < 0 || signId > 17) return;

        this._connection.send(new SignMessageComposer(signId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendDanceMessage()
    sendDanceMessage(danceId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new DanceMessageComposer(danceId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendChangePostureMessage()
    sendChangePostureMessage(posture: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new ChangePostureMessageComposer(posture));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendCreditFurniRedeemMessage()
    sendCreditFurniRedeemMessage(objectId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new CreditFurniRedeemMessageComposer(objectId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendPresentOpenMessage()
    sendPresentOpenMessage(objectId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new PresentOpenMessageComposer(objectId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendOpenPetPackageMessage()
    sendOpenPetPackageMessage(objectId: number, name: string): void
    {
        if(this._connection === null) return;

        this._connection.send(new OpenPetPackageMessageComposer(objectId, name));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendRoomDimmerGetPresetsMessage()
    sendRoomDimmerGetPresetsMessage(itemId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new RoomDimmerGetPresetsComposer(itemId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendRoomDimmerSavePresetMessage()
    sendRoomDimmerSavePresetMessage(
        presetNumber: number,
        effectTypeId: number,
        color: number,
        brightness: number,
        apply: boolean,
        objectId: number
    ): void
    {
        if(this._connection === null) return;

        const hexPadded = '000000' + color.toString(16).toUpperCase();
        const colorHex = '#' + hexPadded.substring(hexPadded.length - 6);

        this._connection.send(new RoomDimmerSavePresetComposer(
            presetNumber, effectTypeId, colorHex, brightness, apply, objectId
        ));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendRoomDimmerChangeStateMessage()
    sendRoomDimmerChangeStateMessage(itemId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new RoomDimmerChangeStateComposer(itemId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendUpdateClothingChangeFurniture()
    sendUpdateClothingChangeFurniture(objectId: number, gender: string, figure: string): void
    {
        if(this._connection === null) return;

        this._connection.send(new UpdateClothingChangeFurnitureComposer(objectId, gender, figure));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendVisitFlatMessage()
    sendVisitFlatMessage(roomId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new OpenFlatConnectionMessageComposer(roomId, ''));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::ambassadorAlert()
    ambassadorAlert(userId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new AmbassadorAlertMessageComposer(userId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::kickUser()
    kickUser(userId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new KickUserMessageComposer(userId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::banUserWithDuration()
    banUserWithDuration(userId: number, duration: string): void
    {
        if(this._connection === null) return;

        this._connection.send(new BanUserWithDurationMessageComposer(userId, duration, this._roomId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::muteUser()
    muteUser(userId: number, minutes: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new MuteUserMessageComposer(userId, minutes, this._roomId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::unmuteUser()
    unmuteUser(userId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new UnmuteUserMessageComposer(userId, this._roomId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::assignRights()
    assignRights(userId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new AssignRightsMessageComposer(userId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::removeRights()
    removeRights(userId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new RemoveRightsMessageComposer([userId]));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::letUserIn()
    letUserIn(userName: string, allow: boolean): void
    {
        if(this._connection === null) return;

        this._connection.send(new LetUserInMessageComposer(userName, allow));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::pickUpPet()
    pickUpPet(petId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new PickUpPetComposer(petId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::mountPet()
    mountPet(petId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new MountPetComposer(petId, true));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::togglePetRidingPermission()
    togglePetRidingPermission(petId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new TogglePetRidingPermissionComposer(petId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::dismountPet()
    dismountPet(petId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new MountPetComposer(petId, false));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::removeSaddleFromPet()
    removeSaddleFromPet(petId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new RemoveSaddleFromPetComposer(petId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::requestPetCommands()
    requestPetCommands(petId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new GetPetCommandsComposer(petId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::useProductForPet()
    useProductForPet(petId: number, productId: number): void
    {
        if(this._connection === null) return;

        this._connection.send(new UseProductForPetComposer(petId, productId));
    }

    // AS3: .../src/com/sulake/habbo/session/RoomSession.as::sendScriptProceed()
    sendScriptProceed(): void
    {
        if(this._connection === null) return;

        this._connection.send(new NewUserExperienceScriptProceedComposer());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSession.as::trackEventLogOncePerSession()
    // DEVIATION: AS3 delegates to HabboTracking, which left with the core cut (2026-10-07); kept as
    //   a no-op so its callers need no change.
    trackEventLogOncePerSession(_category: string, _type: string, _action: string): void
    {
    }
}
