import {createIID} from "@ambreia/kernel/runtime/IID";
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';

/**
 * IID for Habbo Window Manager
 *
 * Based on AS3: com.sulake.iid.IIDHabboWindowManager
 */
export const IID_HabboWindowManager = createIID<IHabboWindowManager>('IHabboWindowManager');
