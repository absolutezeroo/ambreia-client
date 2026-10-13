import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {drawIcon} from '../hudDraw';
import type {ListCache} from './ListCache';

/** The effect boxes of the HUD (vortex_hud_buff_xml): the player's effects, a unit's debuffs, a party member's. */
export class EffectIcons
{
    /** Each box to what its tooltip says. */
    private readonly _tips = new WeakMap<IWindow, string>();

    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits, private readonly _lists: ListCache) {}

    /**
     * One box per icon, with its time, its red outline when it is about to end and what its tooltip
     * says. A party member's list is rebuilt with its frame, so it has no key.
     */
    fill(window: IWindowContainer, name: string, icons: readonly string[], key?: string, times?: readonly string[], expiring?: readonly boolean[], tips?: readonly string[]): void
    {
        const holder = key === undefined
            ? window.findChildByName(name) as IItemListWindow | IItemGridWindow | null
            : this._lists.rebuild<IItemListWindow | IItemGridWindow>(window, name, icons, key);

        if(!holder) return;

        for(const [i, icon] of icons.entries())
        {
            const box = this._windows.buildWidgetLayout('vortex_hud_buff_xml') as IWindowContainer | null;

            if(!box) return;

            drawIcon(box, 'buff_icon', icon);
            this._bits.setText(box, 'buff_time', times?.[i] ?? '');
            this._bits.setVisible(box, expiring?.[i] === true, 'expiring');
            if(tips?.[i]) this._tips.set(box, tips[i]);

            if('addGridItem' in holder) holder.addGridItem(box);
            else holder.addListItem(box);
        }
    }

    /** What the tooltip of `box` says; null when it has none. */
    tipOf(box: IWindow): string | null
    {
        return this._tips.get(box) ?? null;
    }
}
