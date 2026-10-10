/**
 * The skills' and statuses' icons (M1b §16). Their content has an `animation` and a `vfx` key but
 * no icon: until it has one these are picked by eye from the sets the client already ships (the
 * warrior, rogue and psionicist skill icons, the status effects); a skill or status not listed shows
 * FALLBACK. ponytail: a table in the client — move it to the content (an `icon` field) when the art exists.
 */
const SKILLS = 'rpg/skills/';
const STATUSES = 'rpg/status-effects/';

export const SKILL_ICONS: Readonly<Record<string, string>> = {
    'skill.warrior.heroic_strike': `${SKILLS}warrior_skill_icon_1`,
    'skill.warrior.challenging_shout': `${SKILLS}warrior_skill_icon_7`,
    'skill.warrior.shield_bash': `${SKILLS}warrior_skill_icon_3`,
    'skill.archer.aimed_shot': `${SKILLS}rogue_skill_icon_2`,
    'skill.archer.focus': `${SKILLS}psionicist_skill_icon_3`,
    'skill.archer.volley': `${SKILLS}rogue_skill_icon_6`,
    'skill.mage.firebolt': `${SKILLS}warrior_skill_icon_8`,
    'skill.mage.flame_burst': `${SKILLS}warrior_skill_icon_4`,
    'skill.mage.frost_nova': `${SKILLS}psionicist_skill_icon_5`,
    'skill.cleric.heal': `${SKILLS}psionicist_skill_icon_8`,
    'skill.cleric.renew': `${SKILLS}psionicist_skill_icon_6`,
    'skill.cleric.aegis': `${SKILLS}psionicist_skill_icon_7`
};

export const STATUS_ICONS: Readonly<Record<string, string>> = {
    'status.weakened': `${STATUSES}icon_10`,
    'status.stunned': `${STATUSES}icon_21`,
    'status.focused': `${STATUSES}icon_13`,
    'status.burning': `${STATUSES}icon_17`,
    'status.frozen': `${STATUSES}icon_02`,
    'status.renewed': `${STATUSES}icon_09`,
    'status.aegis': `${STATUSES}icon_22`,
    'status.enraged': `${STATUSES}icon_14`,
    'status.howling': `${STATUSES}icon_39`
};

const FALLBACK_SKILL = `${SKILLS}warrior_skill_icon_10`;
const FALLBACK_STATUS = `${STATUSES}icon_35`;

export const skillIcon = (skillId: string): string => SKILL_ICONS[skillId] ?? FALLBACK_SKILL;
export const statusIcon = (statusId: string): string => STATUS_ICONS[statusId] ?? FALLBACK_STATUS;

/** Read by name at run time: decoded at load (IGameFeature.images). */
export const SKILL_IMAGES: readonly string[] = [...Object.values(SKILL_ICONS), ...Object.values(STATUS_ICONS), FALLBACK_SKILL, FALLBACK_STATUS];
