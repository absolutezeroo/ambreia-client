const KEY = 'ambreia.editor.zones';
const RECENT_MAX = 48;

interface IStored
{
    favorites: string[];
    /** Newest first: zone key and when it was opened (ms). */
    recent: [string, number][];
    created: string[];
}

function read(): IStored
{
    try
    {
        const value = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<IStored>;

        return {
            favorites: Array.isArray(value.favorites) ? value.favorites.filter(k => typeof k === 'string') : [],
            recent: Array.isArray(value.recent) ? value.recent.filter(r => Array.isArray(r) && typeof r[0] === 'string' && typeof r[1] === 'number') : [],
            created: Array.isArray(value.created) ? value.created.filter(k => typeof k === 'string') : []
        };
    }
    catch
    {
        return {favorites: [], recent: [], created: []};
    }
}

/**
 * The zone browser's Favoris, Récents and Mes cartes: per machine, by zone key. The server keeps
 * no author nor opening date per account, so these lists are the editor's own memory.
 */
export class ZoneMarks
{
    private readonly _stored = read();
    private readonly _favorites = new Set(this._stored.favorites);
    private readonly _created = new Set(this._stored.created);

    isFavorite(key: string): boolean
    {
        return this._favorites.has(key);
    }

    isMine(key: string): boolean
    {
        return this._created.has(key);
    }

    /** When key was last opened here, or null. */
    openedAt(key: string): number | null
    {
        return this._stored.recent.find(([k]) => k === key)?.[1] ?? null;
    }

    get recent(): readonly (readonly [string, number])[]
    {
        return this._stored.recent;
    }

    toggleFavorite(key: string): void
    {
        if(!this._favorites.delete(key)) this._favorites.add(key);
        this.write();
    }

    opened(key: string): void
    {
        this._stored.recent = [[key, Date.now()] as [string, number], ...this._stored.recent.filter(([k]) => k !== key)].slice(0, RECENT_MAX);
        this.write();
    }

    forget(key: string): void
    {
        this._stored.recent = this._stored.recent.filter(([k]) => k !== key);
        this.write();
    }

    created(key: string): void
    {
        this._created.add(key);
        this.write();
    }

    private write(): void
    {
        try
        {
            localStorage.setItem(KEY, JSON.stringify({favorites: [...this._favorites], recent: this._stored.recent, created: [...this._created]}));
        }
        catch
        {
            // Storage refused: the marks live until the window closes.
        }
    }
}
