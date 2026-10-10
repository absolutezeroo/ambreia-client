import {EventEmitter} from 'eventemitter3';
import {SKILL_SLOTS} from './IHud';
import type {IActionSlot, IPlayerHud, ActionBar} from './IHud';

export type {IActionSlot, ISlotTip, IPlayerHud, ActionBar} from './IHud';
export {SKILL_SLOTS} from './IHud';

/** One action bar slot: what it holds, its key, and the end of its cooldown (ms, Date.now() clock). */
export function barFill(value: number | null, max: number | null, width: number): number
{
    if(value === null || max === null || max <= 0) return 0;

    return Math.round(width * Math.min(1, Math.max(0, value / max)));
}

/** Seconds left on a slot's cooldown, rounded up; null when there is none or it is over. */
export function cooldownLabel(slot: IActionSlot, now: number): string | null
{
    if(slot.cooldownEnd === undefined || slot.cooldownEnd <= now) return null;

    return String(Math.ceil((slot.cooldownEnd - now) / 1000));
}

/** The server's action bar (M1b §9: `Vortex:Skills:ActionBarSize`), keys 1 to 6. */
/** The mock-up's item side (consumables, later): keys 7, 8, 9 and 0. */
const ITEM_SLOTS = 4;

export class PlayerHudState
{
    /** `use`: a slot was clicked; the feature that fills the bar acts on it. */
    readonly events = new EventEmitter<{changed: [Readonly<IPlayerHud>]; use: [ActionBar, number]}>();
    private _value: IPlayerHud = {
        name: '', figure: '', level: null, hp: null, hpMax: null, mana: null, manaMax: null, xp: null, xpMax: null,
        skills: Array.from({length: SKILL_SLOTS}, (_, i) => ({icon: null, key: String(i + 1)})),
        items: Array.from({length: ITEM_SLOTS}, (_, i) => ({icon: null, key: String((SKILL_SLOTS + i + 1) % 10)}))
    };

    get value(): Readonly<IPlayerHud>
    {
        return this._value;
    }

    update(values: Partial<Omit<IPlayerHud, 'skills' | 'items'>>): void
    {
        this._value = {...this._value, ...values};
        this.events.emit('changed', this._value);
    }

    setSlot(bar: ActionBar, index: number, slot: Partial<IActionSlot>): void
    {
        const slots = this._value[bar];

        if(index < 0 || index >= slots.length) throw new Error(`HUD ${bar}: no slot ${index} (0 to ${slots.length - 1})`);

        this._value = {...this._value, [bar]: slots.map((current, i) => (i === index ? {...current, ...slot} : current))};
        this.events.emit('changed', this._value);
    }

    /** Every slot of a bar at once, one `changed`: each entry merges into the slot at its index. */
    setSlots(bar: ActionBar, slots: readonly Partial<IActionSlot>[]): void
    {
        this._value = {...this._value, [bar]: this._value[bar].map((current, i) => ({...current, ...slots[i]}))};
        this.events.emit('changed', this._value);
    }

    startCooldown(bar: ActionBar, index: number, durationMs: number, now: number = Date.now()): void
    {
        this.setSlot(bar, index, {cooldownEnd: now + durationMs});
    }
}
