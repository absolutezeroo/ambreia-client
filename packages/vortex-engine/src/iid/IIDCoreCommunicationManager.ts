import {createIID} from "@ambreia/kernel/runtime/IID";
import type {ICoreCommunicationManager} from '@core/communication/ICoreCommunicationManager';

/**
 * IID for Core Communication Manager
 *
 * Based on AS3: com.sulake.iid.IIDCoreCommunicationManager
 */
export const IID_CoreCommunicationManager = createIID<ICoreCommunicationManager>('ICoreCommunicationManager');
