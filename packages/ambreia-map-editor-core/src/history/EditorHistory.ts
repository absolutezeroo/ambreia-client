import type {IEditorCommand} from '../commands/IEditorCommand';
import type {ZoneDocument} from '../zone/Zone.generated';
import type {IHistoryEntry} from './IHistoryEntry';

/**
 * Undo and redo over immutable snapshots: each command returns a new document, so going back is
 * restoring the previous one — no per-command inverse to write or get wrong.
 */
export class EditorHistory
{
    private _past: IHistoryEntry[] = [];
    private _future: IHistoryEntry[] = [];
    private _saved: ZoneDocument;

    constructor(private _current: ZoneDocument, private readonly _limit = 200)
    {
        this._saved = _current;
    }

    get current(): ZoneDocument
    {
        return this._current;
    }

    get canUndo(): boolean
    {
        return this._past.length > 0;
    }

    get canRedo(): boolean
    {
        return this._future.length > 0;
    }

    /** Labels of the done commands, oldest first. */
    get done(): readonly string[]
    {
        return this._past.map(e => e.label);
    }

    /** Labels of the undone commands, next redo first. */
    get undone(): readonly string[]
    {
        return this._future.map(e => e.label).reverse();
    }

    get isDirty(): boolean
    {
        return this._current !== this._saved;
    }

    execute(command: IEditorCommand): boolean
    {
        const next = command.apply(this._current);

        if(next === this._current) return false;

        this._past.push({label: command.label, doc: this._current});
        if(this._past.length > this._limit) this._past.shift();
        this._future = [];
        this._current = next;

        return true;
    }

    undo(): boolean
    {
        const entry = this._past.pop();

        if(!entry) return false;

        this._future.push({label: entry.label, doc: this._current});
        this._current = entry.doc;

        return true;
    }

    redo(): boolean
    {
        const entry = this._future.pop();

        if(!entry) return false;

        this._past.push({label: entry.label, doc: this._current});
        this._current = entry.doc;

        return true;
    }

    /** The current document is what the server now holds. */
    markSaved(): void
    {
        this._saved = this._current;
    }

    /** A freshly loaded document: no history behind it. */
    reset(doc: ZoneDocument): void
    {
        this._past = [];
        this._future = [];
        this._current = doc;
        this._saved = doc;
    }
}
