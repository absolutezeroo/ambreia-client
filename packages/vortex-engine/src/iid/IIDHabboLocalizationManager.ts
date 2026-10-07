import {createIID} from "@ambreia/kernel/runtime/IID";
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';

/**
 * IID for Habbo Localization Manager
 *
 * Based on AS3: com.sulake.iid.IIDHabboLocalizationManager
 */
export const IID_HabboLocalizationManager = createIID<IHabboLocalizationManager>('IHabboLocalizationManager');
