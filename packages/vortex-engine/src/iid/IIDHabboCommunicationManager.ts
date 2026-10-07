import {createIID} from "@ambreia/kernel/runtime/IID";
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';

/**
 * IID for Habbo Communication Manager
 *
 * Based on AS3: com.sulake.iid.IIDHabboCommunicationManager
 */
export const IID_HabboCommunicationManager = createIID<IHabboCommunicationManager>('IHabboCommunicationManager');
