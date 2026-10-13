import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {drawBar, drawIcon} from '../hudDraw';
import type {ITargetOfTarget} from '../ITargetOfTarget';

/** The line when the target aims at the player (vortex_hud_target_compact_xml's mock-up). */
const AGGRO_COLOR = 0xff6a6a;
/** The compact frame has no head widget: a portrait icon per kind of unit. */
const MONSTER_PORTRAIT = 'rpg/ui-icons/rpg_creature_archetypes_giant_ogre_troll_cyclops_monster_icon';
const PLAYER_PORTRAIT = 'rpg/ui-icons/rpg_character_humanoid_icon';
/** Read by name, decoded at load (IGameFeature.images). */
export const TOT_IMAGES: readonly string[] = [MONSTER_PORTRAIT, PLAYER_PORTRAIT];

/**
 * The target's target (M1d §4, vortex_hud_target_compact_xml): its name and level, its health; when
 * it is the player, the line says the aggro is on him, in red.
 */
export class TargetOfTargetView
{
    constructor(private readonly _bits: WindowBits) {}

    render(window: IWindowContainer, unit: ITargetOfTarget): void
    {
        const bits = this._bits;
        const level = unit.level === null ? '' : ` · ${bits.text('vortex.ui.level.short', 'level', String(unit.level))}`;
        const percent = unit.hp !== null && unit.hpMax ? `${Math.round(100 * unit.hp / unit.hpMax)} %` : '';

        bits.setText(window, 'target_title', bits.text('vortex.combat.target_of_target'));
        drawIcon(window, 'target_portrait', unit.monster ? MONSTER_PORTRAIT : PLAYER_PORTRAIT);
        bits.setText(window, 'target_info', unit.onPlayer ? bits.text('vortex.combat.aggro') : `${unit.name}${level}`);
        bits.setTextColor(window, 'target_info', unit.onPlayer ? AGGRO_COLOR : 0xffffff);
        bits.setVisible(window, unit.hp !== null, 'target_hp_bar');
        drawBar(bits, window, 'target_hp_bar', unit.hp, unit.hpMax, percent);
    }
}
