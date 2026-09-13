/**
 * IRoomCreator
 *
 * Based on AS3: com.sulake.habbo.room.IRoomCreator
 *
 * Interface for room creation and object management.
 * Used by RoomMessageHandler to communicate with the room engine.
 */
import type {IVector3d} from '@room/utils/IVector3d';
import type {IRoomGeometry} from '@room/utils/IRoomGeometry';
import type {IRoomInstance} from '@room/IRoomInstance';
import type {IRoomObjectController} from '@room/object/IRoomObjectController';
import type {IRoomSessionManager} from '../session/IRoomSessionManager';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IHabboConfigurationManager} from '../configuration/IHabboConfigurationManager';
import type {IStuffData} from './object/data/IStuffData';
import type {RoomPlaneParser} from './object/RoomPlaneParser';
import type {FurniStackingHeightMap} from './utils/FurniStackingHeightMap';
import type {TileObjectMap} from './utils/TileObjectMap';
import type {LegacyWallGeometry} from './utils/LegacyWallGeometry';
import type {IRoomEngine} from './IRoomEngine';

/**
 * AS3 declares `_SafeCls_89 extends _SafeCls_86` — IRoomCreator IS an IRoomEngine — and this port
 * had flattened the two into unrelated interfaces. Restored because `RoomMessageHandler` holds an
 * IRoomCreator and calls engine methods through it: AS3 reaches `updateVariableFxConfigs()` and
 * friends by inheritance, and the alternative here was redeclaring each on both. RoomEngine is the
 * only implementor and already declares both, so nothing had to change to satisfy it.
 */
// AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/_SafeCls_89.as
export interface IRoomCreator extends IRoomEngine
{
    /**
	 * Dispose a room instance.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::disposeRoom()
    disposeRoom(roomId: number): void;

    /**
	 * Set the world type for a room.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::setWorldType()
    setWorldType(roomId: number, worldType: string): void;

    /**
	 * Initialize a room with configuration data.
	 * Door parameters are passed when a door is detected from the height map.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::initializeRoom()
    initializeRoom(
        roomId: number,
        planeParser: RoomPlaneParser | null,
        doorX?: number,
        doorY?: number,
        doorZ?: number,
        doorDir?: number,
        cameraInitPosition?: IVector3d | null
    ): void;

    /**
	 * Add floor furniture to a room.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::addObjectFurniture()
    addObjectFurniture(
        roomId: number,
        id: number,
        typeId: number,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        data: IStuffData | null,
        extra: number,
        expiryTime: number,
        usagePolicy: number,
        ownerId: number,
        ownerName: string,
        synchronized: boolean,
        refresh: boolean,
        sizeZ: number
    ): boolean;

    /**
	 * Add floor furniture by class name (for static furniture).
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::addObjectFurnitureByName()
    addObjectFurnitureByName(
        roomId: number,
        id: number,
        className: string,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        data: IStuffData | null,
        extra: number
    ): boolean;

    /**
	 * Update floor furniture.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectFurniture()
    updateObjectFurniture(
        roomId: number,
        id: number,
        location: IVector3d | null,
        direction: IVector3d | null,
        state: number,
        data: IStuffData | null,
        extra?: number
    ): boolean;

    /**
	 * Update floor furniture location for sliding.
	 */
    /**
	 * A new stack height for a furniture object already in the room.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectFurnitureHeight()
    updateObjectFurnitureHeight(roomId: number, id: number, height: number): boolean;

    /**
	 * A new rental/expiry countdown for a furniture object already in the room.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectFurnitureExpiryTime()
    updateObjectFurnitureExpiryTime(roomId: number, id: number, expiryTime: number): boolean;

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectFurnitureLocation()
    updateObjectFurnitureLocation(
        roomId: number,
        id: number,
        location: IVector3d,
        direction: IVector3d | null,
        target: IVector3d | null,
        animationTime?: number,
        overshootingDistance?: number,
        curveStrength?: number
    ): boolean;

    /**
	 * Dispose floor furniture.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::disposeObjectFurniture()
    disposeObjectFurniture(
        roomId: number,
        id: number,
        pickerId?: number,
        refresh?: boolean
    ): boolean;

    /**
	 * The room's legacy wall geometry — the height map wall items are positioned against.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::getLegacyGeometry()
    getLegacyGeometry(roomId: number): LegacyWallGeometry | null;

    /**
	 * Add wall item to a room.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::addObjectWallItem()
    addObjectWallItem(
        roomId: number,
        id: number,
        typeId: number,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        data: string,
        usagePolicy: number,
        ownerId: number,
        ownerName: string,
        secondsToExpiration: number
    ): boolean;

    /**
	 * Update wall item.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectWallItem()
    updateObjectWallItem(
        roomId: number,
        id: number,
        location: IVector3d | null,
        direction: IVector3d | null,
        state: number,
        data: string
    ): boolean;

    /**
	 * Update a wall item's state, carrying its raw item data string.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectWallItemState()
    updateObjectWallItemState(
        roomId: number,
        id: number,
        state: number,
        itemData: string
    ): boolean;

    /**
	 * Update a wall item's raw item data string only (e.g. stickie content).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectWallItemData()
    updateObjectWallItemData(
        roomId: number,
        id: number,
        itemData: string
    ): boolean;

    /**
	 * Toggle an area-hide furni's hidden floor zone.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateAreaHide()
    updateAreaHide(
        roomId: number,
        furniId: number,
        on: boolean,
        rootX: number,
        rootY: number,
        width: number,
        length: number,
        invert: boolean
    ): boolean;

    /**
	 * Dispose wall item.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::disposeObjectWallItem()
    disposeObjectWallItem(
        roomId: number,
        id: number,
        pickerId?: number
    ): boolean;

    /**
	 * Add user/avatar to a room.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::addObjectUser()
    addObjectUser(
        roomId: number,
        roomIndex: number,
        location: IVector3d,
        direction: IVector3d,
        headDirection: number,
        userType: number,
        figure: string
    ): boolean;

    /**
	 * Update user position/movement.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUser()
    updateObjectUser(
        roomId: number,
        roomIndex: number,
        location: IVector3d | null,
        target: IVector3d | null,
        canStandUp?: boolean,
        baseZ?: number,
        direction?: IVector3d,
        headDirection?: number,
        animationTime?: number,
        skipPositionUpdate?: boolean,
        jumpingPower?: number
    ): boolean;

    /**
	 * Turn a user on the spot (body + head direction, no move).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserDir()
    updateObjectUserDir(
        roomId: number,
        roomIndex: number,
        direction: IVector3d,
        headDirection: number
    ): boolean;

    /**
	 * Update wall item location for sliding.
	 */
    /**
	 * A new rental/expiry countdown for a wall item already in the room.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectWallItemExpiryTime()
    updateObjectWallItemExpiryTime(roomId: number, id: number, expiryTime: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectWallItemLocation()
    updateObjectWallItemLocation(
        roomId: number,
        id: number,
        location: IVector3d,
        target?: IVector3d | null,
        animationTime?: number
    ): boolean;

    /**
	 * The room session manager, for handlers that need the room's user data.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_89.as::get roomSessionManager()
    readonly roomSessionManager: IRoomSessionManager | null;

    /**
	 * The hotel's own switches, as the message handler reads them — `onIgnoreResult()` gates the
	 * muted indicator on `avatar.ignored.bubble.enabled`. Declared on the AS3 interface; left out
	 * of this one until something needed it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_89.as::get configuration()
    readonly configuration: IHabboConfigurationManager | null;

    /**
	 * The session data manager, for handlers that need the logged-in user's own id.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_89.as::get sessionDataManager()
    readonly sessionDataManager: ISessionDataManager | null;

    /**
	 * Flag the room as being in game mode, emitting REE_GAME_MODE / REE_NORMAL_MODE.
	 */
    // Derived name: `setIsPlayingGame` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::setIsPlayingGame()
    setIsPlayingGame(roomId: number, isPlaying: boolean): void;

    /**
	 * Leave spectator mode on the active room.
	 */
    // Derived name: `leaveSpectate` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::leaveSpectate()
    leaveSpectate(): void;

    /**
	 * Block/unblock handitem control for the room.
	 */
    // Derived name: `setHanditemControlBlocked` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::setHanditemControlBlocked()
    setHanditemControlBlocked(roomId: number, blocked: boolean): void;

    /**
	 * Disable the furni chooser for the room.
	 */
    // Derived name: `setChooserDisabled` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::setChooserDisabled()
    setChooserDisabled(roomId: number, disabled: boolean): void;

    /**
	 * Toggle free (grid-less) furni movement for the room.
	 */
    // Derived name: `setFreeFurniMovementsMode` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::setFreeFurniMovementsMode()
    setFreeFurniMovementsMode(roomId: number, enabled: boolean): void;

    /**
	 * Toggle the invisible-furni room mode.
	 */
    // Derived name: `setInvisibleFurni` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::setInvisibleFurni()
    setInvisibleFurni(roomId: number, invisible: boolean): void;

    /**
	 * Set the room's background colour / light level (the disco special event).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectRoomColor()
    updateObjectRoomColor(
        roomId: number,
        color: number,
        light: number,
        backgroundOnly: boolean
    ): boolean;

    /**
	 * The window manager, for handlers that must raise a confirm dialog.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_89.as::get windowManager()
    readonly windowManager: IHabboWindowManager | null;

    /**
	 * The room instance, for handlers that need to read an object's model directly.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_89.as::getRoom()
    getRoom(roomId: number): IRoomInstance | null;

    /**
	 * The room's canvas-1 geometry, used to snap wired move targets onto the screen grid.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_89.as::getRoomGeometry()
    getRoomGeometry(roomId: number): IRoomGeometry | null;

    /**
	 * Update user figure.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserFigure()
    updateObjectUserFigure(
        roomId: number,
        roomIndex: number,
        figure: string,
        sex: string,
        subType?: string,
        isRiding?: boolean
    ): boolean;

    /**
	 * Update user posture.
	 * Based on AS3: updateObjectUserPosture
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserPosture()
    updateObjectUserPosture(
        roomId: number,
        roomIndex: number,
        posture: string,
        parameter: string
    ): boolean;

    /**
	 * Update user action (expression, dance, sleep, typing, carry, use object).
	 * Based on AS3: updateObjectUserAction
	 */
    /**
	 * The room-rights level the server reports for an avatar.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserFlatControl()
    updateObjectUserFlatControl(roomId: number, objectId: number, flatControl: string | null): boolean;

    /**
	 * Whether an avatar is blocked for the local user.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserBlocked()
    updateObjectUserBlocked(roomId: number, objectId: number, isBlocked: boolean): boolean;

    /**
	 * A pet gesture. Pets live in the user object category.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectPetGesture()
    updateObjectPetGesture(roomId: number, objectId: number, gesture: string): boolean;

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserAction()
    updateObjectUserAction(
        roomId: number,
        roomIndex: number,
        action: string,
        value: number
    ): boolean;

    /**
	 * The speaker's gesture — declared here in AS3 (`_SafeCls_86`), not only on `IRoomEngine`, and
	 * left out of this interface until `RoomMessageHandler.onChat()` needed it.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserGesture()
    updateObjectUserGesture(roomId: number, roomIndex: number, gesture: number): boolean;

    /**
	 * Update user effect.
	 * Based on AS3: updateObjectUserEffect
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserEffect()
    updateObjectUserEffect(
        roomId: number,
        roomIndex: number,
        effectId: number,
        delayMilliSeconds: number
    ): boolean;

    /**
	 * Dispose user.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::disposeObjectUser()
    disposeObjectUser(
        roomId: number,
        roomIndex: number
    ): boolean;

    /**
	 * Set the own user ID for a room.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::setOwnUserId()
    setOwnUserId(roomId: number, roomIndex: number): void;

    /**
	 * Set a furniture type alias.
	 * Maps a furniture type name to an alias name.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::setRoomObjectAlias()
    setRoomObjectAlias(name: string, alias: string): void;

    /**
	 * Store the furniture stacking height map for a room.
	 * Based on AS3: RoomEngine.setFurniStackingHeightMap()
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::setFurniStackingHeightMap()
    setFurniStackingHeightMap(roomId: number, map: FurniStackingHeightMap): void;

    /**
	 * Get the furniture stacking height map for a room.
	 * Based on AS3: RoomEngine.getFurniStackingHeightMap()
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::getFurniStackingHeightMap()
    getFurniStackingHeightMap(roomId: number): FurniStackingHeightMap | null;

    /**
	 * Rebuild the tile->floor-object spatial index for a room from scratch.
	 * Based on AS3: RoomEngine.refreshTileObjectMap()
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::refreshTileObjectMap()
    refreshTileObjectMap(roomId: number, reason: string): void;

    /**
	 * Get the tile->floor-object spatial index for a room.
	 * Based on AS3: RoomEngine.getTileObjectMap()
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::getTileObjectMap()
    getTileObjectMap(roomId: number): TileObjectMap | null;

    /**
	 * Update the room's floor/wall/landscape texture type(s).
	 * Based on AS3: RoomEngine.updateObjectRoom()
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectRoom()
    updateObjectRoom(
        roomId: number,
        floorType?: string | null,
        wallType?: string | null,
        landscapeType?: string | null,
        skipModelUpdate?: boolean
    ): boolean;

    /**
	 * Update the room's wall/floor plane visibility.
	 * Based on AS3: RoomEngine.updateObjectRoomVisibilities()
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectRoomVisibilities()
    updateObjectRoomVisibilities(roomId: number, wallsVisible: boolean, floorVisible?: boolean): boolean;

    /**
	 * Update the room's wall/floor plane thickness multipliers.
	 * Based on AS3: RoomEngine.updateObjectRoomPlaneThicknesses()
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectRoomPlaneThicknesses()
    updateObjectRoomPlaneThicknesses(roomId: number, wallThicknessMultiplier: number, floorThicknessMultiplier: number): boolean;

    /**
	 * The room object itself — the floor-and-walls object, not anything standing in the room.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::getObjectRoom()
    getObjectRoom(roomId: number): IRoomObjectController | null;

    /**
	 * A room variable, by name. The number form answers NaN when the room has no value under that
	 * name, so a caller can tell an absent variable from a legitimate zero.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::getRoomNumberValue()
    getRoomNumberValue(roomId: number, key: string): number;

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_89.as::getRoomStringValue()
    getRoomStringValue(roomId: number, key: string): string | null;
}
