import {createIID} from "@ambreia/kernel/runtime/IID";
import type {IRoomSessionManager} from '../session/IRoomSessionManager';

/**
 * IID for Room Session Manager
 *
 * Based on AS3: com.sulake.iid.IIDHabboRoomSessionManager
 */
export const IID_RoomSessionManager = createIID<IRoomSessionManager>('IRoomSessionManager');
