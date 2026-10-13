import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';
import type {ILevelUpRow} from './ILevelUpRow';

const ICONS = 'rpg/ui-icons/';

/** The stat block in its wire order, each with its text, icon and how its value reads (bp: basis points). */
const STATS: ReadonlyArray<{stat: keyof IRpgStatBlock; key: string; icon: string; color: number; unit: '' | 'bp' | '%'}> = [
    {stat: 'strength', key: 'vortex.stat.strength', icon: `${ICONS}rpg_stat_strength_fist_melee_attack_icon`, color: 0xe09a60, unit: ''},
    {stat: 'intelligence', key: 'vortex.stat.intelligence', icon: `${ICONS}boardgames_card_star_icon`, color: 0x40b0e0, unit: ''},
    {stat: 'agility', key: 'vortex.stat.agility', icon: `${ICONS}rpg_skill_dash_dodge_movement_speed_run_sprint_icon`, color: 0x6cdc5a, unit: ''},
    {stat: 'maxHealth', key: 'vortex.stat.health', icon: `${ICONS}rpg_stat_hp_health_heart_icon`, color: 0xe03a3a, unit: ''},
    {stat: 'maxMana', key: 'vortex.stat.mana', icon: `${ICONS}rpg_gem_jewelcrafting_diamond_points_currency_icon`, color: 0x4090e0, unit: ''},
    {stat: 'armor', key: 'vortex.stat.armor', icon: `${ICONS}rpg_item_armor_equipment_slot_chest_breastplate_body_icon`, color: 0x8a94a0, unit: ''},
    {stat: 'critBp', key: 'vortex.stat.critical_chance', icon: `${ICONS}boardgames_card_star_icon`, color: 0xffd040, unit: 'bp'},
    {stat: 'dodgeBp', key: 'vortex.stat.dodge', icon: `${ICONS}rpg_skill_dash_dodge_movement_speed_run_sprint_icon`, color: 0x8ac8ff, unit: 'bp'},
    {stat: 'speedPercent', key: 'vortex.stat.speed', icon: `${ICONS}rpg_skill_dash_dodge_movement_speed_run_sprint_icon`, color: 0x6cdc5a, unit: '%'},
    {stat: 'power', key: 'vortex.stat.power', icon: `${ICONS}rpg_item_weapon_sword_attack_melee_slashing_damage_icon`, color: 0xe06020, unit: ''}
];

/** Every icon a row can show: decoded at load (IGameFeature.images). */
export const LEVEL_UP_IMAGES: readonly string[] = [...new Set(STATS.map(stat => stat.icon))];

/** What rose between two stat blocks (M1d §4), in the block's order; a stat that fell or held is not listed. */
export function levelUpRows(before: IRpgStatBlock, after: IRpgStatBlock): ILevelUpRow[]
{
    const rows: ILevelUpRow[] = [];

    for(const stat of STATS)
    {
        const gain = after[stat.stat] - before[stat.stat];

        if(gain <= 0) continue;

        const delta = stat.unit === 'bp' ? `+${(gain / 100).toFixed(1)} %` : stat.unit === '%' ? `+${gain} %` : `+${gain}`;

        rows.push({key: stat.key, icon: stat.icon, color: stat.color, delta});
    }

    return rows;
}
