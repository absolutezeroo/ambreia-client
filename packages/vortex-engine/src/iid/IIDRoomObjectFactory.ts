import {createIID} from '@core/runtime/IID';
import type {IRoomObjectFactory} from '@ambreia/iso/IRoomObjectFactory';

/**
 * IID for Room Object Factory
 *
 * Based on AS3: com.sulake.iid.IIDRoomObjectFactory
 */
export const IID_RoomObjectFactory = createIID<IRoomObjectFactory>('IRoomObjectFactory');
