import type {IConnection} from '@core/communication/connection/IConnection';
import type {RoomModerationSettings} from '../communication/messages/incoming/navigator';
import type {IUserDataManager} from "@habbo/session/IUserDataManager";

/**
 * Room session state constants
 */
export const RoomSessionState = {
    CREATED: 'RSE_CREATED',
    STARTED: 'RSE_STARTED',
    ENDED: 'RSE_ENDED',
} as const;

export type RoomSessionStateType = typeof RoomSessionState[keyof typeof RoomSessionState];

/**
 * Room session interface
 *
 * Based on AS3: com.sulake.habbo.session.IRoomSession
 *
 * Represents an active session in a room. Handles communication
 * with the server for room-specific actions.
 *
 * @see source_as_win63/habbo/session/IRoomSession.as
 */
export interface IRoomSession
{
    // Core properties
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get roomId()
    readonly roomId: number;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get state()
    readonly state: RoomSessionStateType;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get userDataManager()
    readonly userDataManager: IUserDataManager;

    // Connection
    connection: IConnection | null;
    roomPassword: string;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get roomResources()
    roomResources: string;
    skipOpc: boolean;

    // Session state
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get ownUserRoomId()
    ownUserRoomId: number;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get isRoomOwner()
    isRoomOwner: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get roomControllerLevel()
    roomControllerLevel: number;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get isGuildRoom()
    isGuildRoom: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get isPrivateRoom()
    readonly isPrivateRoom: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get isNoobRoom()
    readonly isNoobRoom: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get tradeMode()
    tradeMode: number;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get doorMode()
    doorMode: number;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get isSpectatorMode()
    isSpectatorMode: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get arePetsAllowed()
    arePetsAllowed: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get areBotsAllowed()
    readonly areBotsAllowed: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get roomModerationSettings()
    roomModerationSettings: RoomModerationSettings | null;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get isUserDecorating()
    isUserDecorating: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get isGameSession()
    isGameSession: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get playTestMode()
    playTestMode: boolean;
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::get isNuxNotComplete()
    isNuxNotComplete: boolean;

    /**
	 * Start the room session
	 * Sends OpenFlatConnectionMessageComposer to enter the room
	 */
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::start()
    start(): boolean;

    /**
	 * Quit the room session
	 */
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::quit()
    quit(): void;

    /**
	 * Dispose the session
	 */
    dispose(): void;

    // Chat methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendChatMessage()
    sendChatMessage(message: string, styleId?: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendChangeMottoMessage()
    sendChangeMottoMessage(motto: string): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendShoutMessage()
    sendShoutMessage(message: string, styleId?: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendWhisperMessage()
    sendWhisperMessage(recipientName: string, message: string, styleId?: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendChatTypingMessage()
    sendChatTypingMessage(isTyping: boolean): void;

    // Avatar methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendAvatarExpressionMessage()
    sendAvatarExpressionMessage(expressionId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendSignMessage()
    sendSignMessage(signId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendDanceMessage()
    sendDanceMessage(danceId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendChangePostureMessage()
    sendChangePostureMessage(posture: number): void;

    // Furniture methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendCreditFurniRedeemMessage()
    sendCreditFurniRedeemMessage(objectId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendPresentOpenMessage()
    sendPresentOpenMessage(objectId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendOpenPetPackageMessage()
    sendOpenPetPackageMessage(objectId: number, name: string): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendRoomDimmerGetPresetsMessage()
    sendRoomDimmerGetPresetsMessage(itemId: number): void;

    /**
     * Parameter order and names are AS3's: `(presetNumber, effectTypeId, color, brightness,
     * apply, objectId)`. The port previously declared them as
     * `(itemId, presetId, type, color, light, brightness)` — the body sent the right packet
     * for *that* signature, but it had no callers, and a caller written against the AS3
     * order would have sent the object id as the preset number.
     */
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendRoomDimmerSavePresetMessage()
    sendRoomDimmerSavePresetMessage(
        presetNumber: number,
        effectTypeId: number,
        color: number,
        brightness: number,
        apply: boolean,
        objectId: number
    ): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendRoomDimmerChangeStateMessage()
    sendRoomDimmerChangeStateMessage(itemId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendUpdateClothingChangeFurniture()
    sendUpdateClothingChangeFurniture(objectId: number, gender: string, figure: string): void;

    // Tracking methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendConversionPoint()
    sendConversionPoint(category: string, pointType: string, action: string, extraString?: string | null, extraInt?: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendPeerUsersClassificationMessage()
    sendPeerUsersClassificationMessage(data: string): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendRoomUsersClassificationMessage()
    sendRoomUsersClassificationMessage(data: string): void;

    // Navigation methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendVisitFlatMessage()
    sendVisitFlatMessage(roomId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendVisitUserMessage()
    sendVisitUserMessage(userName: string): void;

    // Moderation methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::ambassadorAlert()
    ambassadorAlert(userId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::kickUser()
    kickUser(userId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::banUserWithDuration()
    banUserWithDuration(userId: number, duration: string): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::muteUser()
    muteUser(userId: number, minutes: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::unmuteUser()
    unmuteUser(userId: number): void;

    // Rights methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::assignRights()
    assignRights(userId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::removeRights()
    removeRights(userId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::letUserIn()
    letUserIn(userName: string, allow: boolean): void;

    // Pet methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::pickUpPet()
    pickUpPet(petId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::mountPet()
    mountPet(petId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::togglePetRidingPermission()
    togglePetRidingPermission(petId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::dismountPet()
    dismountPet(petId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::removeSaddleFromPet()
    removeSaddleFromPet(petId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::requestPetCommands()
    requestPetCommands(petId: number): void;

    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::useProductForPet()
    useProductForPet(petId: number, productId: number): void;

    // Queue methods
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::changeQueue()
    changeQueue(targetQueue: number): void;

    // Chat tracking
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::receivedChatWithTrackingId()
    receivedChatWithTrackingId(trackingId: number): void;

    // NUX
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::sendScriptProceed()
    sendScriptProceed(): void;

    // Event logging
    // AS3: .../src/com/sulake/habbo/session/IRoomSession.as::trackEventLogOncePerSession()
    trackEventLogOncePerSession(category: string, type: string, action: string): void;
}
