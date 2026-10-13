import type {ISkillDefinition} from '../ISkillDefinition';
import type {SkillTag} from './SkillTag';

/** The filter menu's entries, « Toutes » first. */
export const SKILL_FILTERS: ReadonlyArray<SkillTag | null> = [null, 'damage', 'heal', 'effect'];

/** The tag's colours (vortex_skill_header_xml's own for damage). */
export const TAG_COLORS: Readonly<Record<SkillTag, number>> = {damage: 0xf6c0b8, heal: 0xc8ecc0, effect: 0xdcd0f0};

/** A skill's camp, from its first effect that hurts or heals; otherwise it only applies effects. */
export function tagOf(definition: ISkillDefinition): SkillTag
{
    for(const effect of definition.effects)
    {
        if(effect.kind === 'damage') return 'damage';
        if(effect.kind === 'heal') return 'heal';
    }

    return 'effect';
}

/** The filter's name, as the menu and the tag say it. */
export function filterKey(filter: SkillTag | null): string
{
    return filter === null ? 'vortex.ui.all' : `vortex.skill.tag.${filter}`;
}
