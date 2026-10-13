import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import {WindowBits} from '../../../ui/kit/WindowBits';
import type {ITooltip} from '../../../ui/kit/HudTooltips';
import {drawIcon} from '../hudDraw';
import type {EffectIcons} from './EffectIcons';
import type {PartyFramesView} from './PartyFramesView';

/** The tooltip of what is under the pointer in the HUD's panels: an effect, a party member, the + button. */
export class HudPanelTips
{
    constructor(private readonly _bits: WindowBits, private readonly _effects: EffectIcons, private readonly _party: PartyFramesView) {}

    describe(window: IWindow): ITooltip | null
    {
        const bits = this._bits;
        const effect = WindowBits.ancestor(window, 'buff');
        const line = effect ? this._effects.tipOf(effect) : null;

        if(line !== null)
        {
            const [title, ...rest] = line.split('\n');

            return {layout: 'vortex_hud_tip_xml', fill: tip =>
            {
                drawIcon(tip, 'tip_icon', ((effect as IWindowContainer).findChildByName('buff_icon') as IStaticBitmapWrapperWindow | null)?.assetUri ?? null);
                bits.setColor(tip, 'tip_icon', 0xffffff);
                bits.setText(tip, 'tip_title', title);
                bits.setText(tip, 'tip_txt', rest.join('\n'));
            }};
        }

        const member = this._party.memberAt(window);

        if(member)
        {
            return {layout: 'vortex_hud_player_tip_xml', fill: tip =>
            {
                bits.avatar(tip, 'head_image', member.figure, 2, true);
                bits.setText(tip, 'player_name', member.name);
                bits.setText(tip, 'player_info', member.level === null ? '' : bits.text('vortex.ui.level.short', 'level', String(member.level)));
                bits.setText(tip, 'player_guild', '');
            }};
        }

        if(WindowBits.ancestor(window, 'buff_add_button'))
        {
            return {layout: 'vortex_hud_tip_xml', fill: tip =>
            {
                bits.setVisible(tip, false, 'tip_icon_box');
                bits.setText(tip, 'tip_title', bits.text('vortex.hud.improvements'));
                bits.setText(tip, 'tip_txt', '');
            }};
        }

        return null;
    }
}
