import {createIID} from '@ambreia/kernel/runtime/IID';
import type {ICoreLocalizationManager} from '@core/localization/ICoreLocalizationManager';

/**
 * IID for Core Localization Manager
 *
 * Based on AS3: com.sulake.iid.IIDCoreLocalizationManager
 */
export const IID_CoreLocalizationManager = createIID<ICoreLocalizationManager>('ICoreLocalizationManager');
