import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {drawBar, drawIcon} from '../hudDraw';
import type {IHudCast, IHudUnit} from '../HudPanelsState';
import type {EffectIcons} from './EffectIcons';

/** The target frame's border by rank (M1c): vortex_hud_target_xml's grey, gold for an elite, red for a boss. */
const RANK_FRAMES: Readonly<Record<string, number>> = {normal: 0x686661, elite: 0xd8a830, boss: 0xc03028};

const thousands = (value: number): string => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** The boss frame and the target frame (vortex_hud_boss_xml, vortex_hud_target_xml): portrait, name, level, HP, effects, cast. */
export class UnitFrameView
{
    constructor(private readonly _bits: WindowBits, private readonly _effects: EffectIcons) {}

    render(window: IWindowContainer, prefix: 'boss' | 'target', unit: IHudUnit): void
    {
        const bits = this._bits;
        const percent = unit.hp !== null && unit.hpMax ? ` (${Math.round(100 * unit.hp / unit.hpMax)}%)` : '';
        const figure = unit.figure ?? null;

        drawIcon(window, `${prefix}_portrait`, figure === null ? unit.portrait : null);
        bits.setVisible(window, figure !== null, `${prefix}_head`);
        if(figure !== null) bits.avatar(window, `${prefix}_head`, figure, 2, true);
        bits.setText(window, `${prefix}_name`, unit.name);
        // No HP on the wire for a player target yet (F3b): no bar rather than an empty one.
        bits.setVisible(window, unit.hp !== null, `${prefix}_hp_bar`);
        bits.setText(window, prefix === 'boss' ? 'boss_level' : 'target_info', prefix === 'boss' ? (unit.level === null ? '' : bits.text('vortex.ui.level.short', 'level', String(unit.level))) : unit.info);
        drawBar(bits, window, `${prefix}_hp_bar`, unit.hp, unit.hpMax, unit.hp === null || unit.hpMax === null ? '' : `${thousands(unit.hp)} / ${thousands(unit.hpMax)}${percent}`);
        this.renderCast(window, unit.cast ?? null);
        // The boss's cast line takes the place of its effects.
        bits.setVisible(window, prefix === 'target' || !unit.cast, 'debuff_list');
        this._effects.fill(window, 'debuff_list', unit.debuffs, `${prefix}.debuffs`);

        const frame = window.findChildByName(`${prefix}_frame`);

        if(frame) frame.color = RANK_FRAMES[unit.rank ?? 'normal'] ?? RANK_FRAMES.normal;
    }

    /** The cast line: the target frame's titled one, the boss frame's in place of its effects. */
    private renderCast(window: IWindowContainer, cast: IHudCast | null): void
    {
        this._bits.setVisible(window, cast !== null, 'cast_title', 'cast_icon', 'cast_name', 'cast_bar', 'cast_frame');
        // In the target frame the icon's box has no name of its own.
        const castFrame = window.findChildByName('cast_icon')?.parent ?? null;

        if(castFrame && castFrame !== window) castFrame.visible = cast !== null;

        if(!cast) return;

        drawIcon(window, 'cast_icon', cast.icon);
        this._bits.setText(window, 'cast_name', cast.name);
        drawBar(this._bits, window, 'cast_bar', cast.elapsed, cast.duration, `${cast.elapsed.toFixed(1)} / ${cast.duration.toFixed(1)} s`);
    }
}
