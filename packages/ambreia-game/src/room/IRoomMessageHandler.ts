import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {FurnitureFloorData} from '@ambreia/protocol/incoming/room/engine/FurnitureFloorData';
import type {FurnitureWallData} from '@ambreia/protocol/incoming/room/engine/FurnitureWallData';
import type {RoomUserData} from '@ambreia/protocol/incoming/room/engine/RoomUserData';

export interface IRoomMessageHandler extends IDisposable
{
    setCurrentRoom(roomId: number): void;

    resetCurrentRoom(): void;

    onRoomReady(event: IMessageEvent): void;

    /**
	 * Handle furniture aliases from server.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onFurnitureAliases
	 */
    onFurnitureAliases(event: IMessageEvent): void;

    onHeightMap(event: IMessageEvent): void;

    /**
	 * Handle entry tile data (arrives BEFORE FloorHeightMap).
	 * Based on AS3: RoomMessageHandler.onEntryTileData
	 */
    onEntryTileData(event: IMessageEvent): void;

    /**
	 * Handle floor height map data. Detects door position and generates planes.
	 * Based on AS3: RoomMessageHandler.onFloorHeightMap (lines 540-627)
	 */
    onFloorHeightMap(event: IMessageEvent): void;

    onHeightMapUpdate(event: IMessageEvent): void;

    onObjects(event: IMessageEvent): void;

    onObjectAdd(event: IMessageEvent): void;

    onObjectUpdate(event: IMessageEvent): void;

    onObjectRemove(event: IMessageEvent): void;

    onObjectDataUpdate(event: IMessageEvent): void;

    onItems(event: IMessageEvent): void;

    onItemAdd(event: IMessageEvent): void;

    onItemUpdate(event: IMessageEvent): void;

    onItemRemove(event: IMessageEvent): void;

    onUsers(event: IMessageEvent): void;

    onUserUpdate(event: IMessageEvent): void;

    onUserRemove(event: IMessageEvent): void;

    onSlideUpdate(event: IMessageEvent): void;

    addFloorFurniture(roomId: number, data: FurnitureFloorData): void;

    addWallItem(roomId: number, data: FurnitureWallData): void;

    addUser(roomId: number, data: RoomUserData): void;

    /**
	 * Handle user typing status update.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onTypingStatus
	 */
    onTypingStatus(event: IMessageEvent): void;

    /**
	 * Handle user expression update.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onExpression
	 */
    onExpression(event: IMessageEvent): void;

    /**
	 * Handle user dance update.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onDance
	 */
    onDance(event: IMessageEvent): void;

    /**
	 * Handle avatar effect update.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onAvatarEffect
	 */
    onAvatarEffect(event: IMessageEvent): void;

    /**
	 * Handle avatar sleep status update.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onAvatarSleep
	 */
    onAvatarSleep(event: IMessageEvent): void;

    /**
	 * Handle carry object update.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onCarryObject
	 */
    onCarryObject(event: IMessageEvent): void;

    /**
	 * Handle use object update.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onUseObject
	 */
    onUseObject(event: IMessageEvent): void;

    /**
	 * Handle user figure change.
	 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onUserChange
	 */
    onUserChange(event: IMessageEvent): void;
}