/**
 * IRoomEngineServices
 *
 * Based on AS3: com.sulake.habbo.room.IRoomEngineServices
 *
 * Extended interface for room engine services used by other systems.
 */
import type {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IRoomInstance} from '@ambreia/iso/IRoomInstance';
import type {IRoomRenderingCanvas} from '@ambreia/iso/renderer/IRoomRenderingCanvas';
import type {IRoomObject} from '@ambreia/iso/object/IRoomObject';
import type {IRoomObjectController} from '@ambreia/iso/object/IRoomObjectController';
import type {IVector3d} from '@ambreia/iso/utils/IVector3d';
import type {IStuffData} from '@ambreia/iso/scene/object/data/IStuffData';
import type {LegacyWallGeometry} from '@ambreia/iso/scene/utils/LegacyWallGeometry';
import type {FurniStackingHeightMap} from '@ambreia/iso/scene/utils/FurniStackingHeightMap';
import type {TileObjectMap} from '@ambreia/iso/scene/utils/TileObjectMap';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';

export interface IRoomEngineServices
{
    // Connection
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::get connection()
    readonly connection: IConnection | null;

    // Events
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::get events()
    readonly events: EventEmitter;

    // State flags
    readonly isDecorateMode: boolean;
    readonly isGameMode: boolean;

    // Room access
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getRoom()
    getRoom(roomId: number): IRoomInstance | null;

    // Object access
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getRoomObjectCategory()
    getRoomObjectCategory(type: string): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getRoomObject()
    getRoomObject(roomId: number, objectId: number, category: number): IRoomObject | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getRoomObjectWithIndex()
    getRoomObjectWithIndex(roomId: number, index: number, category: number): IRoomObject | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getRoomObjectCount()
    getRoomObjectCount(roomId: number, category: number): number;

    // Wall item plane masks
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::updateObjectRoomWindow()
    updateObjectRoomWindow(roomId: number, id: number, visible?: boolean): void;

    // Tile cursor
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getTileCursor()
    getTileCursor(roomId: number): IRoomObjectController | null;

    // Selection arrow
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getSelectionArrow()
    getSelectionArrow(roomId: number): IRoomObjectController | null;

    // Game state
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getIsPlayingGame()
    getIsPlayingGame(roomId: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomEngineServices.as::getActiveRoomIsPlayingGame()
    getActiveRoomIsPlayingGame(): boolean;

    // Area selection
    isAreaSelectionMode(): boolean;

    // Movement
    isMoveBlocked(): boolean;

    isWhereYouClickWhereYouGo(): boolean;

    // Per-room maps, all three owned by the room's instance data.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::getLegacyGeometry()
    getLegacyGeometry(roomId: number): LegacyWallGeometry | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::getFurniStackingHeightMap()
    getFurniStackingHeightMap(roomId: number): FurniStackingHeightMap | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::getTileObjectMap()
    getTileObjectMap(roomId: number): TileObjectMap | null;

    /**
	 * The ghost that follows the cursor while an object is being placed or moved
	 *
	 * AS3 takes five more arguments than this port does — stuff data, a wall position and a
	 * second type string — which only the paths this port has not built yet ever pass.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::setObjectMoverIconSprite()
    setObjectMoverIconSprite(id: number, category: number, direct: boolean, extra?: string | null, posture?: string | null): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::removeObjectMoverIconSprite()
    removeObjectMoverIconSprite(): void;

    /**
	 * AS3 takes `(roomId, SelectedRoomObjectData)`; this port takes the struct's fields flat,
	 * because it is the only caller shape RoomEngine ever builds one from — the struct is
	 * constructed inside rather than by the caller.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::setSelectedObjectData()
    setSelectedObjectData(
        roomId: number, id: number, category: number, loc: IVector3d, dir: IVector3d, operation: string,
        typeId?: number, instanceData?: string | null, stuffData?: IStuffData | null,
        state?: number, animFrame?: number, posture?: string | null
    ): void;

    // Components the engine holds and its widgets reach through it rather than depending on twice.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::get configuration()
    readonly configuration: IHabboConfigurationManager | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::get roomSessionManager()
    readonly roomSessionManager: IRoomSessionManager | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::get sessionDataManager()
    readonly sessionDataManager: ISessionDataManager | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::get windowManager()
    readonly windowManager: IHabboWindowManager | null;

    /**
	 * Asks the ad manager for a billboard's picture.
	 *
	 * The answer is asynchronous and does not come back through this call: it arrives on the
	 * object's own event handler as a `RoomObjectRoomAdUpdateMessage`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::requestRoomAdImage()
    requestRoomAdImage(roomId: number, objectId: number, objectCategory: number, imageURL: string, clickURL: string): void;

    /**
	 * The canvas the player is looking at — `getRoomCanvas(activeRoomId, activeCanvasId)` in AS3.
	 *
	 * Null before a room is open, which AS3's three call sites all guard for.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::getActiveRoomActiveCanvas()
    getActiveRoomActiveCanvas(): IRoomRenderingCanvas | null;
}
