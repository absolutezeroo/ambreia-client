import type {IInputBindings} from './IInputBindings';

interface IBinding
{
    readonly owner: string;
    readonly handler: () => void;
    readonly when: (() => boolean) | null;
}

interface IEscapeHandler
{
    readonly owner: string;
    readonly handler: () => boolean;
}

/** The chord of a key event: a digit by its row position, a letter without case, else the key's name. */
export function chordOf(event: Pick<KeyboardEvent, 'key' | 'code'>): string
{
    const digit = /^Digit([1-9])$/.exec(event.code)?.[1] ?? /^[1-9]$/.exec(event.key)?.[0] ?? null;

    if(digit !== null) return digit;

    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

/** See IInputBindings. `dispatch()` is what the page's keydown listener calls (and what a test calls). */
export class InputBindings implements IInputBindings
{
    private readonly _bindings = new Map<string, IBinding>();
    private readonly _escape: IEscapeHandler[] = [];

    public bind(owner: string, chord: string, handler: () => void, options: {when?: () => boolean} = {}): () => void
    {
        const key = chord.length === 1 ? chord.toLowerCase() : chord;

        if(key === 'Escape') throw new Error(`Feature "${owner}" binds Escape: it is a stack, use onEscape()`);

        const taken = this._bindings.get(key);

        if(taken) throw new Error(`Key "${chord}" is bound by both "${taken.owner}" and "${owner}"`);

        const binding: IBinding = {owner, handler, when: options.when ?? null};

        this._bindings.set(key, binding);

        return () =>
        {
            if(this._bindings.get(key) === binding) this._bindings.delete(key);
        };
    }

    public onEscape(owner: string, handler: () => boolean): () => void
    {
        const entry: IEscapeHandler = {owner, handler};

        this._escape.push(entry);

        return () =>
        {
            const at = this._escape.indexOf(entry);

            if(at !== -1) this._escape.splice(at, 1);
        };
    }

    public typing(event: KeyboardEvent): boolean
    {
        const target = event.target as {tagName?: string; isContentEditable?: boolean} | null;

        return target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true;
    }

    /** Routes one key event; true when a binding or an Escape handler took it. */
    public dispatch(event: KeyboardEvent): boolean
    {
        if(event.ctrlKey || event.altKey || event.metaKey || this.typing(event)) return false;

        if(event.key === 'Escape')
        {
            for(let i = this._escape.length - 1; i >= 0; i--)
            {
                if(this._escape[i].handler()) return true;
            }

            return false;
        }

        const binding = this._bindings.get(chordOf(event));

        if(!binding || (binding.when !== null && !binding.when())) return false;

        binding.handler();

        return true;
    }

    /** The bindings of every owner: what the boot or a settings screen would list. */
    public describe(): Array<{chord: string; owner: string}>
    {
        return [...this._bindings.entries()].map(([chord, binding]) => ({chord, owner: binding.owner})).sort((a, b) => a.chord.localeCompare(b.chord));
    }

    public clear(): void
    {
        this._bindings.clear();
        this._escape.length = 0;
    }
}
