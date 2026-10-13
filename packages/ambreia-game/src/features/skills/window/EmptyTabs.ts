import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';

/** « Passives » and « Spécialisations »: no data in M1b, so their empty states (states_skills.png), set once. */
export class EmptyTabs
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    /** No passive skill: the tab's banner, its header saying so, its upgrade off. */
    passives(tab: IWindowContainer, header: IWindowContainer | null): void
    {
        const banner = this._windows.buildWidgetLayout('vortex_skill_info_banner_xml') as IWindowContainer | null;

        if(banner) (tab.findChildByName('info_banner_slot') as IWindowContainer | null)?.addChild(banner);

        this.emptyHeader(header, 'vortex.skill.passive.none');
        this._bits.setText(tab, 'current_effect', '');
        this._bits.setText(tab, 'next_effect', '');
        // The layout's captions wait for a rank and a cost: without a passive, their bare words.
        this._bits.setText(tab, 'next_level_title', this._bits.text('vortex.skill.next_level.title'));
        this._bits.setText(tab, 'upgrade_button', this._bits.text('vortex.skill.upgrade.bare'));
        tab.findChildByName('upgrade_button')?.disable();
    }

    /** No specialisation: no tree, no point, its buttons off. */
    specs(tab: IWindowContainer, header: IWindowContainer | null): void
    {
        this._bits.setText(tab, 'points_txt', this._bits.text('vortex.skill.specs.points', 'count', '0'));
        this._bits.setVisible(tab, false, 'next_level_title');
        this._bits.setText(tab, 'add_point_button', this._bits.text('vortex.skill.specs.no_point'));
        for(const name of ['reset_all_button', 'add_point_button']) tab.findChildByName(name)?.disable();
        this.emptyHeader(header, 'vortex.skill.specs.none');
    }

    private emptyHeader(header: IWindowContainer | null, key: string): void
    {
        if(!header) return;

        this._bits.setVisible(header, false, 'skill_icon', 'skill_progress', 'skill_tag', 'skill_level');
        this._bits.setText(header, 'skill_name', this._bits.text(key));
        this._bits.setText(header, 'skill_desc', '');
    }
}
