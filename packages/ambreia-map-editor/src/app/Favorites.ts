const FAVORITES = 'ambreia.editor.favorites';
const RECENT = 'ambreia.editor.recent';
const RECENT_MAX = 48;

function read(key: string): number[]
{
    try
    {
        const value = JSON.parse(localStorage.getItem(key) ?? '[]');

        return Array.isArray(value) ? value.filter(v => typeof v === 'number') : [];
    }
    catch
    {
        return [];
    }
}

function write(key: string, ids: number[]): void
{
    try
    {
        localStorage.setItem(key, JSON.stringify(ids));
    }
    catch
    {
        // Storage refused: the list lives until the window closes.
    }
}

/** The catalogue's Favoris and Récents tabs: per machine, by furniture definition id. */
export class Favorites
{
    private readonly _favorites = new Set(read(FAVORITES));
    private _recent = read(RECENT);

    get favorites(): ReadonlySet<number>
    {
        return this._favorites;
    }

    get recent(): readonly number[]
    {
        return this._recent;
    }

    isFavorite(definition: number): boolean
    {
        return this._favorites.has(definition);
    }

    toggle(definition: number): void
    {
        if(!this._favorites.delete(definition)) this._favorites.add(definition);
        write(FAVORITES, [...this._favorites]);
    }

    used(definition: number): void
    {
        this._recent = [definition, ...this._recent.filter(d => d !== definition)].slice(0, RECENT_MAX);
        write(RECENT, this._recent);
    }
}
