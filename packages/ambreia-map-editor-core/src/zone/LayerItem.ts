import type {LayerKey} from './LayerKey';
import type {ZoneDocument} from './Zone.generated';

/** One element of a layer: a ZoneNpc for 'npcs', a ZoneSpawn for 'spawns'… */
export type LayerItem<K extends LayerKey> = NonNullable<ZoneDocument[K]>[number];
