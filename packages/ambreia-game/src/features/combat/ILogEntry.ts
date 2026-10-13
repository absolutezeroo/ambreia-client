import type {ILogKind} from './ILogKind';

/** A line of the combat log: a text key and its parameters, resolved by whoever shows it. */
export interface ILogEntry
{
    /** On the monotonic clock. */
    readonly at: number;
    readonly kind: ILogKind;
    readonly key: string;
    readonly params: Readonly<Record<string, string>>;
}
