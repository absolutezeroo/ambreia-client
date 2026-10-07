import {createIID} from "@ambreia/kernel/runtime/IID";
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';

/**
 * IID for Habbo Configuration Manager
 *
 * Based on AS3: com.sulake.iid.IIDHabboConfigurationManager
 */
export const IID_HabboConfigurationManager = createIID<IHabboConfigurationManager>('IHabboConfigurationManager');
