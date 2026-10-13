import {SKILL_SLOTS} from '../../hud/IHud';
import {barSkill} from '../RpgSkillSession';
import type {ISkillBook} from './ISkillBook';

/**
 * The action bar as the skills window edits it (M1b §9): each change is an RpgActionBarSet, and the
 * window follows the RpgSkills that comes back. Keeps the shortcuts tab's selected slot.
 */
export class SkillBarEditor
{
    /** The shortcuts tab's selected slot. */
    slot = 0;

    constructor(private readonly _book: Pick<ISkillBook, 'known' | 'bar' | 'definition' | 'setBar'>) {}

    /** The skill in a bar slot; null for none. */
    skillAt(slot: number): string | null
    {
        return barSkill(this._book.bar[slot] ?? '');
    }

    /**
     * A bar slot clicked with `selected` chosen: the chosen skill goes there (the server moves it
     * from elsewhere), the same one again empties it. In « Raccourcis », with no other skill chosen,
     * the click only selects the slot, for its details: true then, the window redraws.
     */
    click(slot: number, selected: string | null, shortcutsTab: boolean): boolean
    {
        const current = this.skillAt(slot);
        const learned = selected !== null && this._book.known.includes(selected);

        this.slot = slot;

        if(shortcutsTab && (!learned || current === selected)) return true;

        if(learned) this._book.setBar(slot, current === selected ? '' : `skill:${selected}`);

        return false;
    }

    /** A skill dropped on a slot goes there. */
    drop(slot: number, skillId: string): void
    {
        this.slot = slot;
        this._book.setBar(slot, `skill:${skillId}`);
    }

    /** The learned skills in level order, then empty slots: what choosing the class does (M1b §9). */
    restoreDefaults(): void
    {
        const level = (skillId: string): number => this._book.definition(skillId)?.level ?? 0;
        const ordered = [...this._book.known].sort((a, b) => level(a) - level(b));

        for(let i = 0; i < SKILL_SLOTS; i++) this._book.setBar(i, ordered[i] === undefined ? '' : `skill:${ordered[i]}`);
    }

    clearAll(): void
    {
        for(let i = 0; i < SKILL_SLOTS; i++) this._book.setBar(i, '');
    }

    /** Empties the selected slot. */
    unassign(): void
    {
        this._book.setBar(this.slot, '');
    }
}
