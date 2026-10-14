import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {IQuestDefinition} from '../definitions/IQuestDefinition';
import {questDescription, questTitle} from '../questTexts';
import {ObjectiveRowsView} from './ObjectiveRowsView';
import {RewardTilesView} from './RewardTilesView';

/**
 * The selected quest in a journal tab (detail): its header (vortex_quest_detail_header_xml, built once
 * into detail_header), objectives, rewards, and Abandon for a quest under way. Tracking, handing in
 * from the journal and the progression have nothing on the wire yet: hidden.
 */
export class QuestDetailView
{
    private readonly _objectives: ObjectiveRowsView;
    private readonly _rewards: RewardTilesView;
    private readonly _headers = new Map<IWindowContainer, IWindowContainer>();

    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits)
    {
        this._objectives = new ObjectiveRowsView(_windows, _bits);
        this._rewards = new RewardTilesView(_windows, _bits);
    }

    render(tab: IWindowContainer, entry: IRpgQuestLogEntry | null, definition: IQuestDefinition | null, canAbandon: boolean): void
    {
        const detail = tab.findChildByName('detail') as IWindowContainer | null;
        // The panel around the progression slot, its title included.
        const progression = detail?.findChildByName('progression_slot')?.parent;

        if(detail) detail.visible = entry !== null;
        if(progression) progression.visible = false;
        this._bits.setVisible(tab, false, 'region_filter', 'sort_menu');

        if(!detail) return;

        // In the detail: the list's rows have a track_button too, and they come first.
        this._bits.setVisible(detail, false, 'track_button', 'turn_in_button', 'done_date');
        this._bits.setVisible(detail, entry !== null && canAbandon, 'abandon_button');

        if(!entry) return;

        const header = this.header(tab);

        if(header)
        {
            this._bits.setText(header, 'quest_title', questTitle(this._bits, entry.questId));
            this._bits.setText(header, 'quest_subtitle', definition ? this._bits.text('vortex.quest.level', 'level', String(definition.level)) : '');
            this._bits.setText(header, 'quest_desc', questDescription(this._bits, entry.questId));
            this._bits.setVisible(header, false, 'repeatable_pill', 'giver');
        }

        // The done tab's objectives title counts them.
        this._bits.setText(detail, 'objective_title', this._bits.text('vortex.ui.objectives.count',
            'done', String(entry.objectives.filter(line => line.current >= line.required).length), 'total', String(entry.objectives.length)));
        this._bits.setText(tab, 'summary_txt', questDescription(this._bits, entry.questId));
        this._bits.setText(tab, 'done_title', this._bits.text('vortex.quest.done.banner'));

        const objectives = tab.findChildByName('objective_list') as IItemListWindow | null;
        const rewards = tab.findChildByName('reward_list') as IItemListWindow | null;

        if(objectives) this._objectives.render(objectives, entry);
        if(rewards) this._rewards.render(rewards, definition);
    }

    private header(tab: IWindowContainer): IWindowContainer | null
    {
        const known = this._headers.get(tab);

        if(known) return known;

        const slot = tab.findChildByName('detail_header') as IWindowContainer | null;
        const header = slot ? this._windows.buildWidgetLayout('vortex_quest_detail_header_xml') as IWindowContainer | null : null;

        if(!slot || !header) return null;

        slot.addChild(header);
        this._headers.set(tab, header);

        return header;
    }
}
