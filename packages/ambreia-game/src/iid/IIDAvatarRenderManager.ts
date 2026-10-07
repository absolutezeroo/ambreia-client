import {createIID} from '@ambreia/kernel/runtime/IID';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';

/**
 * IID for Avatar Render Manager
 *
 * Based on AS3: com.sulake.iid.IIDAvatarRenderManager
 */
export const IID_AvatarRenderManager = createIID<IAvatarRenderManager>('IAvatarRenderManager');
