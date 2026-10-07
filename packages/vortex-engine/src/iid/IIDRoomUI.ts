import {createIID} from '@ambreia/kernel/runtime/IID';
import type {IRoomUI} from '@habbo/ui/IRoomUI';

/**
 * IID for Room UI
 *
 * Based on AS3: com.sulake.iid.IIDHabboRoomUI
 */
export const IID_RoomUI = createIID<IRoomUI>('IRoomUI');
