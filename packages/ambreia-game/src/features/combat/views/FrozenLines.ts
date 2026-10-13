import type {ILogEntry} from '../ILogEntry';
import type {ILogLine} from './ILogLine';

/**
 * Each combat log line rendered once, when it is written: a monster's name leaves the room with the
 * monster, and the panel opened later (or refilled by a chip) must still say who hit whom.
 */
export class FrozenLines
{
    private readonly _lines = new WeakMap<ILogEntry, ILogLine>();

    constructor(private readonly _render: (entry: ILogEntry) => ILogLine) {}

    of(entry: ILogEntry): ILogLine
    {
        let line = this._lines.get(entry);

        if(!line)
        {
            line = this._render(entry);
            this._lines.set(entry, line);
        }

        return line;
    }
}
