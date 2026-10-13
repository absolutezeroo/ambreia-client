/** A combatant's last known health; the mana is only the player's own (RpgSelfVitals). */
export interface IVitals
{
    readonly health: number;
    readonly maxHealth: number;
    /** Null for anyone but the player. */
    readonly mana: number | null;
    readonly maxMana: number | null;
}
