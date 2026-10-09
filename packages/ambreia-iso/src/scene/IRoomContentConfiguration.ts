import type {IFurnitureData} from '../furniture/data/IFurnitureData';
import type {IFurniDataListener} from '../furniture/data/IFurniDataListener';

/**
 * What the room content loader reads from the configuration: `gpu.ignored_furni`,
 * `pet.configuration` (the content itself comes from the families' .ambreia directories). The engine's
 * configuration manager has it as is; a host without one (the map editor, a test) gives a map.
 */
export interface IRoomContentConfiguration
{
    getProperty(key: string): string;
}

/** Where the content loader gets furnidata from: the session in the client, a parsed file elsewhere. */
export interface IFurniDataSource
{
    getFurniData(listener: IFurniDataListener): IFurnitureData[] | null;   // null: not loaded yet, the listener is called back
    removeFurniDataListener(listener: IFurniDataListener): void;
}
