import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {lowHp} from '../../../ui/kit/hudRules';
import {drawBar} from '../hudDraw';
import type {HudPanelsState, IHudPanels, IPartyMember} from '../HudPanelsState';
import type {EffectIcons} from './EffectIcons';
import type {ListCache} from './ListCache';

/**
 * The party's frames (vortex_hud_party_xml): a frame per member, outlined when selected or low on
 * health; a click selects the member and shows them in the target frame.
 */
export class PartyFramesView
{
    /** Each frame to its member, for a click and a hover. */
    private readonly _members = new Map<IWindow, IPartyMember>();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _state: HudPanelsState,
        private readonly _lists: ListCache,
        private readonly _effects: EffectIcons
    ) {}

    render(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const list = this._lists.rebuild<IItemListWindow>(window, 'party_list', value.party);

        if(list)
        {
            this._members.clear();

            for(const member of value.party)
            {
                const frame = this._windows.buildWidgetLayout('vortex_hud_party_member_xml') as IWindowContainer | null;

                if(!frame) return;

                this._bits.avatar(frame, 'head_image', member.figure, 2, true);
                this._bits.setText(frame, 'member_name', member.name);
                this._bits.setText(frame, 'member_level', member.level === null ? '' : this._bits.text('vortex.ui.level.short', 'level', String(member.level)));
                drawBar(this._bits, frame, 'hp_bar', member.hp, member.hpMax);
                this._bits.setVisible(frame, member.dead, 'dead_veil', 'dead_txt');
                this._bits.setVisible(frame, !member.dead, 'buff_list');
                this._bits.setVisible(frame, lowHp(member.hp, member.hpMax), 'low_hp');
                if(!member.dead) this._effects.fill(frame, 'buff_list', member.buffs);
                list.addListItem(frame);
                this._members.set(frame, member);
            }
        }

        // The selection is a mark on the frames, not a rebuild.
        for(const [frame, member] of this._members) this._bits.setVisible(frame as IWindowContainer, member.name === value.partySelected, 'selected');
    }

    /** The member whose frame holds `window`; null off the frames. */
    memberAt(window: IWindow): IPartyMember | null
    {
        const frame = WindowBits.ancestor(window, 'party_member');

        return frame ? this._members.get(frame) ?? null : null;
    }

    /** Selects the member and shows them in the target frame (no HP on the wire for players: theirs is known); again: deselects. */
    select(member: IPartyMember): void
    {
        const selected = this._state.value.partySelected === member.name ? null : member.name;

        this._state.update({
            partySelected: selected,
            target: selected === null ? null : {
                name: member.name, portrait: null, figure: member.figure, level: member.level,
                info: member.level === null ? '' : this._bits.text('vortex.ui.level.short', 'level', String(member.level)),
                hp: member.hp, hpMax: member.hpMax, debuffs: member.buffs, cast: null
            }
        });
    }

    clear(): void
    {
        this._members.clear();
    }
}
