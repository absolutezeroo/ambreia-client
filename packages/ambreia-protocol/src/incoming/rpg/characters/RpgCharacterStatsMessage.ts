import type {IRpgStatBlock} from './IRpgStatBlock';

/** The stat block, on each change of stats. (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md) */
export class RpgCharacterStatsMessage
{
    constructor(
        readonly stats: IRpgStatBlock
    ) {}
}
