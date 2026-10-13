import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {SKILL_SLOTS} from '../../hud/IHud';
import {barSkill} from '../RpgSkillSession';
import {SLOT_OFF} from './skillColors';
import type {SkillDraw} from './SkillDraw';

/** The mock-up's bars: eight keys, the skills' six (M1b §9) then the HUD's first two item slots. */
export const BAR_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8'];

/** The action bars of the skills window (vortex_skill_action_slot_xml), by tab: only the skills' six slots take a skill. */
export class SkillBarSlots
{
    private readonly _slots = new Map<string, IWindowContainer[]>();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _draw: SkillDraw,
        private readonly _onEvent: (event: WindowEvent, window: IWindow) => void
    ) {}

    /** A bar of one slot per key in `tab`'s list `listName`. */
    build(tab: string, tabWindow: IWindowContainer, listName: string, keys: readonly string[]): void
    {
        const list = tabWindow.findChildByName(listName) as IItemListWindow | null;
        const slots: IWindowContainer[] = [];

        keys.forEach((key, i) =>
        {
            const slot = this._windows.buildWidgetLayout('vortex_skill_action_slot_xml') as IWindowContainer | null;

            if(!slot || !list) return;

            this._bits.setText(slot, 'slot_key', key);
            list.addListItem(slot);

            if(keys === BAR_KEYS && i < SKILL_SLOTS)
            {
                slot.procedure = this._onEvent;
                slots.push(slot);
            }
            else
            {
                // Consumables and extra keys come later: an empty « + », dimmed.
                this._draw.slot(slot, null, false);
                slot.blend = SLOT_OFF;
            }
        });

        if(keys === BAR_KEYS) this._slots.set(tab, slots);
    }

    /** Every bar shows the bar's skills; `selectedIn`'s slot `selected` is outlined. */
    render(bar: readonly string[], selectedIn: string, selected: number): void
    {
        for(const [tab, slots] of this._slots)
        {
            slots.forEach((slot, i) => this._draw.slot(slot, barSkill(bar[i] ?? ''), tab === selectedIn && i === selected));
        }
    }

    /** The bar slot of `tab` that `window` is in: its index, or -1. */
    slotOf(tab: string, window: IWindow): number
    {
        const slot = WindowBits.ancestor(window, 'action_slot');

        return slot ? (this._slots.get(tab) ?? []).indexOf(slot as IWindowContainer) : -1;
    }

    /** The bar slot of `tab` under this desktop point, or -1. */
    slotAt(tab: string, x: number, y: number): number
    {
        const point = {x, y};

        return (this._slots.get(tab) ?? []).findIndex(slot => slot.hitTestGlobalPoint(point));
    }

    clear(): void
    {
        this._slots.clear();
    }
}
