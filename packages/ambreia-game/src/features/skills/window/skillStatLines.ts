import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {ISkillDefinition} from '../ISkillDefinition';
import type {IStatusDefinition} from '../IStatusDefinition';
import type {IStatLine} from './IStatLine';

const UI = 'rpg/ui-icons/';

/** The stat lines' icons (tinted, vortex_character_stat_row_xml): the mock-up's star, hourglass, eye, flame, fist. */
const STAT_LOOK = {
    mana: {icon: `${UI}rpg_stat_mp_mana_star_icon`, color: 0x3080e0},
    cooldown: {icon: `${UI}boardgames_chess_clock_timer_icon`, color: 0xa07840},
    range: {icon: `${UI}media_eyeball_vision_shown_icon`, color: 0x4a90b0},
    cast: {icon: `${UI}rpg_combat_types_sword_arrow_staff_melee_ranged_magic_icon`, color: 0xd8a030},
    damage: {icon: `${UI}rpg_stat_strength_fist_melee_attack_icon`, color: 0xd06040},
    heal: {icon: `${UI}rpg_stat_hp_health_heart_icon`, color: 0xe03030},
    effect: {icon: `${UI}alchemy_element_fire_icon`, color: 0x9a60c8}
} as const;

/** Read by name at run time: decoded at load (IGameFeature.images). */
export const SKILL_WINDOW_IMAGES: readonly string[] = [...new Set(Object.values(STAT_LOOK).map(look => look.icon))];

/**
 * A skill's lines from the server's definition, in skills_active.png's order: cost, cooldown,
 * range, its effects, its base amounts, the cast time last (shown when the list has room for it).
 */
export function skillStatLines(definition: ISkillDefinition, text: Pick<WindowBits, 'text' | 'contentName'>, statusDefinition: (statusId: string) => IStatusDefinition | null): IStatLine[]
{
    const seconds = (ms: number): string => text.text('vortex.skill.seconds', 'seconds', String(Math.round(ms / 100) / 10).replace('.', ','));
    const amount = (base: number, coefficient: number): string => coefficient === 0
        ? String(base)
        : text.text(base === 0 ? 'vortex.skill.scaling' : 'vortex.skill.base_scaling', 'base', String(base), 'coefficient', String(coefficient).replace('.', ','));
    const lines: IStatLine[] = [
        {look: STAT_LOOK.mana, label: text.text('vortex.skill.mana_cost'), value: String(definition.cost)},
        {look: STAT_LOOK.cooldown, label: text.text('vortex.skill.cooldown'), value: definition.cooldownMs > 0 ? seconds(definition.cooldownMs) : text.text('vortex.skill.none')},
        {look: STAT_LOOK.range, label: text.text('vortex.skill.range'), value: definition.range > 0 ? text.text('vortex.skill.tiles', 'count', String(definition.range)) : text.text('vortex.skill.range.self')}
    ];
    const amounts: IStatLine[] = [];

    for(const effect of definition.effects)
    {
        if(effect.kind === 'damage') amounts.push({look: STAT_LOOK.damage, label: text.text('vortex.skill.base_damage'), value: amount(effect.base, effect.coefficient)});
        else if(effect.kind === 'heal') amounts.push({look: STAT_LOOK.heal, label: text.text('vortex.skill.base_heal'), value: amount(effect.base, effect.coefficient)});
        else if(effect.kind === 'apply_status' && effect.status !== null)
        {
            const status = statusDefinition(effect.status);
            const name = text.contentName(`${effect.status}.name`, effect.status);

            lines.push({look: STAT_LOOK.effect, label: text.text('vortex.skill.effect'), value: status ? `${name} (${seconds(status.durationMs)})` : name});
        }
        else if(effect.kind === 'interrupt')
        {
            lines.push({look: STAT_LOOK.effect, label: text.text('vortex.skill.effect'), value: text.text('vortex.skill.effect.interrupt')});
        }
    }

    return [...lines, ...amounts, {
        look: STAT_LOOK.cast,
        label: text.text(definition.type === 'channel' ? 'vortex.skill.channel_time' : 'vortex.skill.cast_time'),
        value: definition.type === 'cast' ? seconds(definition.castMs) : definition.type === 'channel' ? seconds(definition.channelMs) : text.text('vortex.skill.instant')
    }];
}
