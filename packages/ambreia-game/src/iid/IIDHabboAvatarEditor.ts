import {createIID} from '@ambreia/kernel/runtime/IID';
import type {IHabboAvatarEditor} from '../avatar/IHabboAvatarEditor';

/**
 * IID for Habbo Avatar Editor
 *
 * Based on AS3: com.sulake.iid.IIDHabboAvatarEditor
 */
export const IID_HabboAvatarEditor = createIID<IHabboAvatarEditor>('IHabboAvatarEditor');
