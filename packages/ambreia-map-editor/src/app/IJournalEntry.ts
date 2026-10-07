/** One line of the Journal d'activités. */
export interface IJournalEntry
{
    readonly time: string;
    readonly text: string;
    readonly level: 'info' | 'success' | 'error';
}
