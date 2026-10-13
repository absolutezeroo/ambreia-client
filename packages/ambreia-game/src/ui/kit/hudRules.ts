/**
 * The HUD's small decisions (mock-ups of 2026-10-10, mockup/glaze/states_hud.png and
 * states_combat.png), kept pure so they can be tested without a window.
 */

/** A party member is in danger under a quarter of their health. */
export const LOW_HP_RATIO = 0.25;
/** An effect is about to end under five seconds. */
export const EXPIRING_MS = 5_000;
/** How long a slot keeps its « selected » outline after its key or a click. */
export const SELECTED_MS = 200;
/** The gap between the pointer and a tooltip. */
const TIP_OFFSET = 14;

export function lowHp(hp: number | null, hpMax: number | null): boolean
{
    return hp !== null && hpMax !== null && hpMax > 0 && hp > 0 && hp / hpMax < LOW_HP_RATIO;
}

export function expiring(remainingMs: number | null): boolean
{
    return remainingMs !== null && remainingMs >= 0 && remainingMs < EXPIRING_MS;
}

/** A slot the player cannot afford: its cost is known and above the mana. */
export function unavailable(cost: number | null, mana: number | null): boolean
{
    return cost !== null && cost > 0 && mana !== null && mana < cost;
}

/**
 * Where a tooltip goes: below-right of the pointer, flipped to the other side when it would leave
 * the desktop, never off its edges.
 */
export function placeTip(mouseX: number, mouseY: number, width: number, height: number, desktopWidth: number, desktopHeight: number): {x: number; y: number}
{
    let x = mouseX + TIP_OFFSET;
    let y = mouseY + TIP_OFFSET;

    if(x + width > desktopWidth) x = mouseX - TIP_OFFSET - width;
    if(y + height > desktopHeight) y = mouseY - TIP_OFFSET - height;

    return {x: Math.max(0, Math.min(desktopWidth - width, x)), y: Math.max(0, Math.min(desktopHeight - height, y))};
}

/** The attack slot (M1d §2.3): what the server says of the auto-attack, greyed without a monster to hit. */
export function attackSlotState(input: {autoAttacking: boolean; hasMonsterTarget: boolean}): 'idle' | 'active' | 'disabled'
{
    if(input.autoAttacking) return 'active';

    return input.hasMonsterTarget ? 'idle' : 'disabled';
}
