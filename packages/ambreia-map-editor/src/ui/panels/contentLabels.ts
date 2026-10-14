/** A content id's French name (content text `<id>.name`), else its id. */
export function contentName(id: string, names: ReadonlyMap<string, string>): string
{
    return names.get(`${id}.name`) || id;
}

/**
 * A menu's choices (value, label) for content ids: the server's, by name, then any id the zone still
 * names that the server does not serve, so it can be seen and changed.
 */
export function contentOptions(ids: readonly string[], used: readonly string[], names: ReadonlyMap<string, string>): [string, string][]
{
    const served = new Set(ids);
    const options: [string, string][] = ids.map(id => [id, contentName(id, names)]);

    for(const id of new Set(used)) if(id && !served.has(id)) options.push([id, `${id} (inconnu)`]);

    return options;
}

/** A library's lines (id, French name, id as the sub-line), by name, kept when the query is in the name or the id. */
export function libraryRows(ids: readonly string[], names: ReadonlyMap<string, string>, query: string): {id: string; title: string; sub: string}[]
{
    const q = query.toLowerCase();

    return ids
        .map(id => ({id, title: contentName(id, names), sub: id}))
        .filter(r => !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
        .sort((a, b) => a.title.localeCompare(b.title, 'fr'));
}
