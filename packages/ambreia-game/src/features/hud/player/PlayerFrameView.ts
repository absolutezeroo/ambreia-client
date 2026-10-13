import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IAvatarImageWidget} from '@ambreia/ui/kit/widgets/IAvatarImageWidget';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {HudTooltips, type ITooltip} from '../../../ui/kit/HudTooltips';
import {drawBar} from '../hudDraw';
import type {IPlayerHud} from '../PlayerHudState';

/** vortex_hud_player_xml's frame colour, and its colour in combat (M1a §6.3). */
const FRAME_COLOR = 0x686661;
const IN_COMBAT_COLOR = 0x8a3a30;
/** The frame's bars and what their tooltips say (vortex_hud_tip_xml). */
const BAR_TIPS: Readonly<Record<string, {key: string; icon: string; color: number}>> = {
    hp_bar: {key: 'vortex.hud.tip.hp', icon: 'rpg/ui-icons/rpg_stat_hp_health_heart_icon', color: 0xe03a3a},
    mana_bar: {key: 'vortex.hud.tip.mana', icon: 'rpg/ui-icons/rpg_stat_mp_mana_star_icon', color: 0x3a7fe0},
    xp_bar: {key: 'vortex.hud.tip.xp', icon: 'rpg/ui-icons/boardgames_card_star_icon', color: 0x6cbb2d}
};

/** The player frame (vortex_hud_player_xml): portrait, name, level, HP, mana, XP, red in combat; its bars say what they are on hover. */
export class PlayerFrameView
{
    constructor(private readonly _bits: WindowBits, private readonly _tips: HudTooltips) {}

    render(player: IWindowContainer, value: Readonly<IPlayerHud>): void
    {
        const frame = player.findChildByName('player_frame');
        const frameColor = value.inCombat ? IN_COMBAT_COLOR : FRAME_COLOR;

        if(frame && frame.color !== frameColor) frame.color = frameColor;
        this._bits.setText(player, 'player_name', value.name);
        this._bits.setText(player, 'level_txt', value.level === null ? '' : String(value.level));
        drawBar(this._bits, player, 'hp_bar', value.hp, value.hpMax);
        drawBar(this._bits, player, 'mana_bar', value.mana, value.manaMax);
        drawBar(this._bits, player, 'xp_bar', value.xp, value.xpMax, value.xpLabel ?? null);

        const head = ((player.findChildByName('head_image') as IWidgetWindow | null)?.widget ?? null) as IAvatarImageWidget | null;

        if(head && value.figure && head.figure !== value.figure) head.figure = value.figure;
    }

    /** The frame's events: a bar's tooltip. */
    onEvent(player: IWindowContainer, event: WindowEvent, window: IWindow): void
    {
        const bar = Object.keys(BAR_TIPS).find(name => HudTooltips.under(window, player, name) !== null) ?? null;

        this._tips.handle(event, () => (bar === null ? null : this.tip(bar)));
    }

    /** A bar's tooltip (vortex_hud_tip_xml): what HP, mana or XP are. */
    private tip(name: string): ITooltip | null
    {
        const tip = BAR_TIPS[name];

        if(!tip) return null;

        return {layout: 'vortex_hud_tip_xml', fill: window =>
        {
            const icon = window.findChildByName('tip_icon') as IStaticBitmapWrapperWindow | null;

            if(icon) icon.assetUri = tip.icon;
            this._bits.setColor(window, 'tip_icon', tip.color);
            this._bits.setText(window, 'tip_title', this._bits.text(tip.key));
            this._bits.setText(window, 'tip_txt', this._bits.text(`${tip.key}.desc`));
        }};
    }
}
