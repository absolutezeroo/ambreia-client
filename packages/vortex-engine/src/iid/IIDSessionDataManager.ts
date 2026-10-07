import {createIID} from "@ambreia/kernel/runtime/IID";
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';

/**
 * IID for Session Data Manager
 *
 * Based on AS3: com.sulake.iid.IIDHabboSessionDataManagerLib
 */
export const IID_SessionDataManager = createIID<ISessionDataManager>('ISessionDataManager');
