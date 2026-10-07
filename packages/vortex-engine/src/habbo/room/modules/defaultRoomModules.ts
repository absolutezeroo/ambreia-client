import type {IsoModule} from '@room/object/IIsoRegistries';
import {registerScene} from './registerScene';
import {registerFurniture} from './registerFurniture';
import {registerAvatars} from './registerAvatars';
import {registerEffects} from './registerEffects';

/** Everything the client draws in a room; a host that wants less passes its own list. */
export const DEFAULT_ROOM_MODULES: readonly IsoModule[] = [registerScene, registerFurniture, registerAvatars, registerEffects];
