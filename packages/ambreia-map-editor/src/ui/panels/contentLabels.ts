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
