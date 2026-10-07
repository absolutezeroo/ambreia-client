import type {IsoModule} from './object/IIsoRegistries';
import {registerScene} from './scene/registerScene';
import {registerFurniture} from './furniture/registerFurniture';
import {registerAvatars} from './avatar/registerAvatars';
import {registerEffects} from './effects/registerEffects';

/** Everything the client draws in a room; a host that wants less passes its own list. */
export const DEFAULT_ROOM_MODULES: readonly IsoModule[] = [registerScene, registerFurniture, registerAvatars, registerEffects];
