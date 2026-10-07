import type {ZoneDocument} from '../zone/Zone.generated';

export interface IHistoryEntry
{
    readonly label: string;
    readonly doc: ZoneDocument;
}
