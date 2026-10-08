/**
 * The stat block the server writes after a character's state and in its stats message (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md):
 * fixed order, all integers. Crit and dodge are percentages × 100 (620 = 6.2 %).
 */
export interface IRpgStatBlock
{
    readonly strength: number;
    readonly intelligence: number;
    readonly agility: number;
    readonly maxHealth: number;
    readonly maxMana: number;
    readonly armor: number;
    readonly critBp: number;
    readonly dodgeBp: number;
    readonly speedPercent: number;
    readonly power: number;
}
