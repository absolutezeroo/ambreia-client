import type {ISkillBook} from './ISkillBook';
import type {ISkillEntry} from './ISkillEntry';
import type {SkillTag} from './SkillTag';
import {tagOf} from './skillTags';

/** The class's skills as the window lists them: learned first then by level, kept by the filter and the search. */
export class SkillCatalog
{
    filter: SkillTag | null = null;
    /** Lower case; '' keeps everything. */
    search = '';

    /** @param name - a skill's name as the player reads it (what the search looks in) */
    constructor(private readonly _book: Pick<ISkillBook, 'known' | 'definitions' | 'definition'>, private readonly _name: (skillId: string) => string) {}

    entries(classId: string): ISkillEntry[]
    {
        const book = this._book;
        const known = new Set(book.known);
        const all = new Map<string, number>();

        for(const definition of book.definitions) if(definition.classes.includes(classId)) all.set(definition.id, definition.level);
        // A learned skill the definitions do not have (yet) still shows.
        for(const skillId of known) if(!all.has(skillId)) all.set(skillId, book.definition(skillId)?.level ?? 0);

        return [...all]
            .map(([skillId, level]) => ({skillId, learned: known.has(skillId), level}))
            .filter(entry => this.matches(entry.skillId))
            .sort((a, b) => Number(b.learned) - Number(a.learned) || a.level - b.level || a.skillId.localeCompare(b.skillId));
    }

    private matches(skillId: string): boolean
    {
        const definition = this._book.definition(skillId);

        if(this.filter !== null && (definition === null || tagOf(definition) !== this.filter)) return false;

        return this.search === '' || this._name(skillId).toLowerCase().includes(this.search);
    }
}
