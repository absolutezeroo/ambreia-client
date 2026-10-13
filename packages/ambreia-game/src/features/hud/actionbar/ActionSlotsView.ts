import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {HudTooltips, ITooltip} from '../../../ui/kit/HudTooltips';
import {unavailable} from '../../../ui/kit/hudRules';
import {cooldownLabel, type IActionSlot, type IPlayerHud, type PlayerHudState} from '../PlayerHudState';
import {CooldownTicker} from './CooldownTicker';

/**
 * The bottom bar's shortcut slots (mock-up of 2026-10-10): the first is the attack (M1d §2.3, key T),
 * the others show their keys until the server assigns them.
 */
const SHORTCUT_KEYS = ['T', 'E', 'R'];
/** The attack slot's icon. */
export const ATTACK_ICON = 'rpg/ui-icons/rpg_item_weapon_sword_attack_melee_slashing_damage_icon';

/**
 * The bottom bar's slots (vortex_hud_action_slot_xml): six skills, four items, the shortcuts with
 * the attack first. A slot shows its cooldown, greys when the player cannot afford it, is outlined
 * for a moment after its key, and describes itself on hover; a click uses it, as its key does.
 */
export class ActionSlotsView
{
    private readonly _slots: {skills: IWindowContainer[]; items: IWindowContainer[]} = {skills: [], items: []};
    /** The first shortcut slot: the auto-attack. */
    private _attack: IWindowContainer | null = null;
    private readonly _ticker: CooldownTicker;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _state: PlayerHudState,
        private readonly _tips: HudTooltips
    )
    {
        this._ticker = new CooldownTicker(() => this.tick());
    }

    /** How many skill and item slots were built (the dev hook's description). */
    get count(): number
    {
        return this._slots.skills.length + this._slots.items.length;
    }

    /** Builds the slots into the bar's lists. */
    build(bar: IWindowContainer): void
    {
        for(const kind of ['skills', 'items'] as const)
        {
            const list = bar.findChildByName(kind === 'skills' ? 'skill_slots' : 'item_slots') as IItemListWindow | null;

            for(let i = 0; i < this._state.value[kind].length; i++)
            {
                const slot = this._windows.buildWidgetLayout('vortex_hud_action_slot_xml') as IWindowContainer | null;

                if(!slot || !list) continue;

                // A click on the slot uses it, as its key does (features/skills); a hover describes it.
                slot.procedure = (event: WindowEvent) =>
                {
                    if(this._tips.handle(event, () => this.tip(this._state.value[kind][i] ?? null))) return;
                    if(event.type === 'WME_CLICK') this._state.events.emit('use', kind, i);
                };
                list.addListItem(slot);
                this._slots[kind].push(slot);
            }
        }

        // The shortcut side: three slots with their keys, nothing to assign to them yet.
        const shortcuts = bar.findChildByName('shortcut_slots') as IItemListWindow | null;

        for(const key of SHORTCUT_KEYS)
        {
            const slot = this._windows.buildWidgetLayout('vortex_hud_action_slot_xml') as IWindowContainer | null;

            if(!slot || !shortcuts) break;

            this.renderSlot(slot, {icon: null, key});
            shortcuts.addListItem(slot);

            if(this._attack === null)
            {
                this._attack = slot;
                slot.procedure = (event: WindowEvent) =>
                {
                    if(event.type === 'WME_CLICK') this._state.events.emit('attack');
                };
            }
        }
    }

    render(value: Readonly<IPlayerHud>): void
    {
        for(const kind of ['skills', 'items'] as const)
        {
            value[kind].forEach((slot, i) => this.renderSlot(this._slots[kind][i] ?? null, slot, value.mana));
        }

        this.renderAttack(value.attack ?? 'disabled');

        const now = Date.now();

        this._ticker.sync([...value.skills, ...value.items].some(slot => (slot.cooldownEnd ?? 0) > now));
    }

    /** The bar is hidden: nothing ticks. */
    stop(): void
    {
        this._ticker.stop();
    }

    private renderSlot(window: IWindowContainer | null, slot: IActionSlot, mana: number | null = null): void
    {
        if(!window) return;

        const icon = window.findChildByName('slot_icon') as IStaticBitmapWrapperWindow | null;

        if(icon)
        {
            icon.visible = slot.icon !== null;
            if(slot.icon !== null && icon.assetUri !== slot.icon) icon.assetUri = slot.icon;
        }

        this._bits.setText(window, 'slot_key', slot.key);

        const count = window.findChildByName('slot_count');

        if(count)
        {
            count.visible = (slot.count ?? 0) > 1;
            count.caption = String(slot.count ?? '');
        }

        this._bits.setVisible(window, slot.icon !== null && unavailable(slot.cost ?? null, mana), 'unavailable_veil');
        this._bits.setVisible(window, slot.selected === true, 'selected');
        this.renderCooldown(window, slot, Date.now());
    }

    /** The attack slot: its sword and key always, outlined while attacking, veiled without a monster target. */
    private renderAttack(state: 'idle' | 'active' | 'disabled'): void
    {
        const slot = this._attack;

        if(!slot) return;

        this.renderSlot(slot, {icon: ATTACK_ICON, key: SHORTCUT_KEYS[0], selected: state === 'active'});
        this._bits.setVisible(slot, state === 'disabled', 'unavailable_veil');
    }

    private renderCooldown(window: IWindowContainer, slot: IActionSlot, now: number): void
    {
        const label = cooldownLabel(slot, now);
        const veil = window.findChildByName('cooldown_veil');
        const text = window.findChildByName('cooldown_txt');

        if(veil) veil.visible = label !== null;
        if(text)
        {
            text.visible = label !== null;
            text.caption = label ?? '';
        }
    }

    /** Redraws the running cooldowns; true while one still runs. */
    private tick(): boolean
    {
        const current = this._state.value;
        const at = Date.now();

        for(const kind of ['skills', 'items'] as const) current[kind].forEach((slot, i) => this._slots[kind][i] && this.renderCooldown(this._slots[kind][i], slot, at));

        return [...current.skills, ...current.items].some(slot => (slot.cooldownEnd ?? 0) > at);
    }

    /** A slot's tooltip (vortex_hud_slot_tip_xml), from what the feature filling the bar said of it. */
    private tip(slot: IActionSlot | null): ITooltip | null
    {
        const tip = slot?.tip;

        if(!tip || slot.icon === null) return null;

        return {layout: 'vortex_hud_slot_tip_xml', fill: window =>
        {
            const icon = window.findChildByName('tip_icon') as IStaticBitmapWrapperWindow | null;

            if(icon && slot.icon) icon.assetUri = slot.icon;
            this._bits.setText(window, 'tip_title', tip.title);
            this._bits.setText(window, 'tip_tag_txt', tip.tag);
            this._bits.setVisible(window, tip.tag !== '', 'tip_tag');
            this._bits.setText(window, 'tip_meta', tip.meta);
            this._bits.setText(window, 'tip_txt', tip.text);
            this._bits.setText(window, 'tip_effect', tip.effect);
            this._bits.setText(window, 'tip_shortcut', tip.shortcut);
        }};
    }

    dispose(): void
    {
        this._ticker.stop();
        this._slots.skills = [];
        this._slots.items = [];
        this._attack = null;
    }
}
