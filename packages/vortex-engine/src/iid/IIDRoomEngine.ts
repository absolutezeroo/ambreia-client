import {createIID} from '@ambreia/kernel/runtime/IID';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';

/**
 * IID for Room Engine
 *
 * Based on AS3: com.sulake.iid.IIDRoomEngine
 */
export const IID_RoomEngine = createIID<IRoomEngine>('IRoomEngine');
