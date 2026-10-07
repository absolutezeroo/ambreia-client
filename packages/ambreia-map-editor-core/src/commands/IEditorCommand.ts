import type {ZoneDocument} from '../zone/Zone.generated';

/** One undoable edit: a label for the History panel and a pure document → document function. */
export interface IEditorCommand
{
    readonly label: string;

    /** Returns the same document when there is nothing to change: the history then records nothing. */
    apply(doc: ZoneDocument): ZoneDocument;
}
