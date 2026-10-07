import type {ZoneFloor} from './Zone.generated';

/** A room model the floor panel offers: a name and a fresh floor each time. */
export interface IFloorTemplate
{
    readonly label: string;
    build(): ZoneFloor;
}
