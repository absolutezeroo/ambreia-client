import {furnitureCategory} from './furnitureCategory';

/** The catalogue's first level. */
export type CatalogSection = 'seasons' | 'rares' | 'collections' | 'types';

/** Where a furni sits in the catalogue: a section, then a group inside it. */
export interface ICatalogPlace
{
    readonly section: CatalogSection;
    /** `Noël:2012`, `Noël` (no year), `Rares:2020`, `Rares`, a collection's prefix, or a CatalogCategory. */
    readonly group: string;
}

/** Season prefixes, as the class names spell them (`xmas12_`, `xmas_c20_`, `hween14_`, `ny2015_`…). */
export const SEASONS: Readonly<Record<string, string>> = {
    xmas: 'Noël', hween: 'Halloween', habboween: 'Halloween', easter: 'Pâques', val: 'Saint-Valentin',
    valentine: 'Saint-Valentin', ny: 'Nouvel an', newyear: 'Nouvel an'
};

// Prefixes of what the RPG has no use for: clothing, NFTs, ads.
const HIDDEN = new Set(['clothing', 'nft', 'ads']);

// ponytail: fixed threshold, ~220 collections over the full furnidata; a search box covers the rest.
const COLLECTION_MIN = 30;

const SEASON = /^(xmas|hween|habboween|easter|valentine|val|newyear|ny)(\d{2}|\d{4})?$/;
// The second word carries the year since ~2015: `xmas_c20_…` (campaign), `rare_r20_…`, `xmas_2012_…`.
const YEAR_WORD = /^(?:[cr](\d{2})|(\d{4}))$/;

const fullYear = (digits: string): string => digits.length === 4 ? digits : `20${digits}`;

/**
 * The catalogue place of every class (colour variants `*N` share their base's), from the class
 * names alone: the prefix names the season and its year, the rare and its year, or a collection
 * (a fan hotel, an author, a set) when enough classes share it; anything else goes by type.
 * A hidden class has no place.
 */
export function catalogPlaces(classNames: readonly string[]): Map<string, ICatalogPlace>
{
    const words = new Map(classNames.map(name => [name, name.split('*')[0].toLowerCase().split('_').filter(Boolean)]));
    const prefixCount = new Map<string, number>();

    // Counted over base classes: nine colours of one sofa are not a collection.
    for(const base of new Set([...words.values()].filter(w => w.length > 1).map(w => w.join('_'))))
    {
        const prefix = base.split('_')[0];

        prefixCount.set(prefix, (prefixCount.get(prefix) ?? 0) + 1);
    }

    const places = new Map<string, ICatalogPlace>();

    for(const [name, w] of words)
    {
        const [first = '', second = ''] = w;
        const season = SEASON.exec(first);
        const year = YEAR_WORD.exec(second);
        const yearOf = (attached?: string): string => attached ? fullYear(attached) : year ? fullYear(year[1] ?? year[2]) : '';
        let place: ICatalogPlace | null;

        if(HIDDEN.has(first)) place = null;
        else if(season && w.length > 1) place = {section: 'seasons', group: join(SEASONS[season[1]], yearOf(season[2]))};
        else if(first === 'rare' && w.length > 1) place = {section: 'rares', group: join('Rares', yearOf())};
        else if(w.length > 1 && (prefixCount.get(first) ?? 0) >= COLLECTION_MIN && furnitureCategory(first) === 'misc') place = {section: 'collections', group: first};
        else place = {section: 'types', group: furnitureCategory(name)};

        if(place) places.set(name, place);
    }

    return places;
}

const join = (key: string, year: string): string => year ? `${key}:${year}` : key;
