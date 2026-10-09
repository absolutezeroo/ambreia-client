import {EventEmitter} from 'eventemitter3';

/** One action bar slot: what it holds, its key, and the end of its cooldown (ms, Date.now() clock). */
export interface IActionSlot
{
    /** Asset name of the icon (`rpg/skills/warrior_skill_icon_1`), null for an empty slot. */
    icon: string | null;
    key: string;
    count?: number;
    cooldownEnd?: number;
}

/**
 * What the HUD shows of the player (RPG spec §16.3: portrait, level, HP, mana, XP, action bar).
 * Null is "not known yet": the server sends these (stats are server-side, §5.2), the client never
 * makes them up — until the RPG network exists (F3) only the dev hook fills them.
 */
export interface IPlayerHud
{
    name: string;
    figure: string;
    level: number | null;
    hp: number | null;
    hpMax: number | null;
    mana: number | null;
    manaMax: number | null;
    xp: number | null;
    xpMax: number | null;
    /** Shown on the XP bar instead of "xp / max" (e.g. MAX at the maximum level). */
    xpLabel?: string | null;
    /** In combat (M1a §6.3): the frame turns red. */
    inCombat?: boolean;
    skills: IActionSlot[];
    items: IActionSlot[];
}

export type ActionBar = 'skills' | 'items';

/** Width of a bar's fill: proportional, clamped, empty while the maximum is unknown or zero. */
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

// The mock-up's bar: four skills, four items (vortex_hud_action_bar_xml holds 4 slots a side).
const SLOTS_PER_BAR = 4;

export class PlayerHudState
{
    readonly events = new EventEmitter<{changed: [Readonly<IPlayerHud>]}>();
    private _value: IPlayerHud = {
        name: '', figure: '', level: null, hp: null, hpMax: null, mana: null, manaMax: null, xp: null, xpMax: null,
        skills: Array.from({length: SLOTS_PER_BAR}, (_, i) => ({icon: null, key: String(i + 1)})),
        items: Array.from({length: SLOTS_PER_BAR}, (_, i) => ({icon: null, key: String(SLOTS_PER_BAR + i + 1)}))
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

    startCooldown(bar: ActionBar, index: number, durationMs: number, now: number = Date.now()): void
    {
        this.setSlot(bar, index, {cooldownEnd: now + durationMs});
    }
}
