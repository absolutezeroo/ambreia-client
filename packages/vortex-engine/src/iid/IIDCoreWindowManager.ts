import {createIID} from '@ambreia/kernel/runtime/IID';
import type {ICoreWindowManager} from '@ambreia/ui/ICoreWindowManager';

/**
 * IID for Core Window Manager
 *
 * Based on AS3: com.sulake.iid.IIDCoreWindowManager
 */
export const IID_CoreWindowManager = createIID<ICoreWindowManager>('ICoreWindowManager');
