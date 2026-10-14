import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {IQuestDefinition} from '../definitions/IQuestDefinition';
import {rewardLines} from './rewardLines';

/** The rewards (reward_list), one vortex_quest_reward_tile_xml each. */
export class RewardTilesView
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    render(list: IItemListWindow, definition: IQuestDefinition | null): void
    {
        list.destroyListItems();

        for(const line of definition ? rewardLines(this._bits, definition) : [])
        {
            const tile = this._windows.buildWidgetLayout('vortex_quest_reward_tile_xml') as IWindowContainer | null;

            if(!tile) return;

            this._bits.setText(tile, 'reward_name', line.name);
            this._bits.setText(tile, 'reward_value', line.value);
            list.addListItem(tile);
        }
    }
}
