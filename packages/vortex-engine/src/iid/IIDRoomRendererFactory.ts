import {createIID} from '@core/runtime/IID';
import type {IRoomRendererFactory} from '@ambreia/iso/renderer/IRoomRendererFactory';

/**
 * IID for Room Renderer Factory
 *
 * Based on AS3: com.sulake.iid.IIDRoomRendererFactory
 */
export const IID_RoomRendererFactory = createIID<IRoomRendererFactory>('IRoomRendererFactory');
