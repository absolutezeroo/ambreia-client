import type {IEditorMonster} from '@ambreia/map-editor-core/api/IEditorMonster';

const RANKS: Readonly<Record<string, string>> = {elite: 'élite', boss: 'boss'};
const BEHAVIORS: Readonly<Record<string, string>> = {melee: 'mêlée', ranged: 'distance', caster: 'lanceur de sorts'};

/** The monster's French name (content text `<id>.name`), else its id. */
export function monsterName(id: string, names: ReadonlyMap<string, string>): string
{
    return names.get(`${id}.name`) || id;
}

/**
 * The spawn menu's choices (value, label): the server's monsters, then any id the zone's spawns
 * already name that the server no longer serves, so it can be seen and changed.
 */
export function monsterOptions(monsters: readonly IEditorMonster[], used: readonly string[], names: ReadonlyMap<string, string>): [string, string][]
{
    const served = new Set(monsters.map(m => m.id));
    const options: [string, string][] = monsters.map(m => [m.id, RANKS[m.rank] ? `${monsterName(m.id, names)} · ${RANKS[m.rank]}` : monsterName(m.id, names)]);

    for(const id of new Set(used)) if(id && !served.has(id)) options.push([id, `${id} (inconnu)`]);

    return options;
}

/** The line under the menu: rank, behaviour, aggressive or not; or why the id plays nothing. */
export function monsterDetail(id: string, monster: IEditorMonster | null): string
{
    if(!id) return '';
    if(!monster) return 'Inconnu du serveur : rien n\'apparaîtra';

    return [RANKS[monster.rank] ?? 'normal', BEHAVIORS[monster.behavior] ?? monster.behavior, monster.aggressive ? 'agressif' : 'passif'].join(' · ');
}
