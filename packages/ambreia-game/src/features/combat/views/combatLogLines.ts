import type {ILogEntry} from '../ILogEntry';
import type {ILogKind} from '../ILogKind';
import type {ILogFilter} from './ILogFilter';
import type {ILogLine} from './ILogLine';
import type {ILogNames} from './ILogNames';

const ICONS = 'rpg/ui-icons/';

/** The owner's chips of vortex_hud_combat_log_xml, in order. */
export const LOG_FILTERS: ReadonlyArray<{filter: ILogFilter; key: string}> = [
    {filter: 'all', key: 'vortex.combat.log.all'},
    {filter: 'damage', key: 'vortex.combat.log.damage'},
    {filter: 'heals', key: 'vortex.combat.log.heals'},
    {filter: 'system', key: 'vortex.combat.log.system'}
];

/** Each kind's icon and colour (the owner's mock-up of the log). */
const LOOK: Readonly<Record<ILogKind, {icon: string; color: number}>> = {
    dealt: {icon: `${ICONS}rpg_item_weapon_sword_attack_melee_slashing_damage_icon`, color: 0xffd040},
    taken: {icon: `${ICONS}rpg_item_weapon_sword_attack_melee_slashing_damage_icon`, color: 0xff6a6a},
    miss: {icon: `${ICONS}rpg_difficulty_3_medium_buckler_targe_shield_icon`, color: 0x8ac8ff},
    heal: {icon: `${ICONS}software_signs_maths_plus_addition_bonus_add_new_icon`, color: 0x6cdc5a},
    status: {icon: `${ICONS}software_hourglass_sand_time_wait_icon`, color: 0xb080ff},
    cast: {icon: `${ICONS}rpg_crossed_swords_duel_pvp_combat_battle_war_icon`, color: 0xffd040},
    death: {icon: `${ICONS}rpg_skull_death_dead_small_icon`, color: 0xd8d0e8},
    resurrect: {icon: `${ICONS}software_signs_checkmark_checkbox_ticked_todo_icon`, color: 0x6cdc5a},
    levelup: {icon: `${ICONS}boardgames_card_star_icon`, color: 0xffd040},
    refused: {icon: `${ICONS}software_sign_crossout_cancel_forbidden_illegal_1_icon`, color: 0xff6a6a}
};

/** Every icon a line can show: decoded at load (IGameFeature.images). */
export const LOG_IMAGES: readonly string[] = [...new Set(Object.values(LOOK).map(look => look.icon))];

export function logFilterOf(kind: ILogKind): Exclude<ILogFilter, 'all'>
{
    if(kind === 'dealt' || kind === 'taken' || kind === 'miss') return 'damage';

    return kind === 'heal' ? 'heals' : 'system';
}

/** Object ids and content ids among a line's parameters, by parameter name. */
const OBJECTS = new Set(['source', 'target', 'caster']);
const CONTENT = new Set(['skill', 'status']);
const SKILL_REFUSAL = 'vortex.skill.error.';

/** The panel's line for a model entry: its text with the names resolved, its icon and colour. */
export function logLine(entry: ILogEntry, text: (key: string, ...params: string[]) => string, names: ILogNames): ILogLine
{
    // A skill's refusal texts are reasons (« pas assez de mana. »): they read after the skill's name.
    if(entry.key.startsWith(SKILL_REFUSAL) && entry.params.skill)
    {
        return {text: text('vortex.skill.error', 'skill', names.content(entry.params.skill), 'reason', text(entry.key)), ...LOOK[entry.kind]};
    }

    const params: string[] = [];

    for(const [name, value] of Object.entries(entry.params))
    {
        params.push(name, OBJECTS.has(name) ? names.name(Number(value)) : CONTENT.has(name) && value !== '' ? names.content(value) : value);
    }

    return {text: text(entry.key, ...params), ...LOOK[entry.kind]};
}

/** A line's time as the log shows it: [HH:MM:SS], local wall clock. */
export function logClock(wallMs: number): string
{
    const date = new Date(wallMs);
    const two = (n: number): string => String(n).padStart(2, '0');

    return `[${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}]`;
}
