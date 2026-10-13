/**
 * The skills' and statuses' icons come from their content (`icon`, M1d §6.1); a definition without
 * one shows the generic icon. The content can name any icon of the two sets the client ships, so
 * both are decoded at load (IGameFeature.images).
 */
export const FALLBACK_SKILL = 'rpg/skills/warrior_skill_icon_10';
export const FALLBACK_STATUS = 'rpg/status-effects/icon_35';

export function iconOf(definition: {readonly icon?: string} | null, fallback: string): string
{
    return definition?.icon || fallback;
}

/** rpg/skills/<class>_skill_icon_1…10 and rpg/status-effects/icon_00…63, as shipped. */
export const CONTENT_ICON_IMAGES: readonly string[] = [
    ...['psionicist', 'rogue', 'warrior'].flatMap(set => Array.from({length: 10}, (_, i) => `rpg/skills/${set}_skill_icon_${i + 1}`)),
    ...Array.from({length: 64}, (_, i) => `rpg/status-effects/icon_${String(i).padStart(2, '0')}`)
];
