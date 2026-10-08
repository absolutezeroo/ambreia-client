import type {IRpgStatBlock} from './IRpgStatBlock';

/** The whole character, on entering a zone. (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md) */
export class RpgCharacterStateMessage
{
    constructor(
        readonly playerId: number,
        readonly classId: string,
        readonly specializationId: string,
        readonly level: number,
        readonly maxLevel: number,
        readonly xp: number,
        readonly xpToNext: number,
        readonly stats: IRpgStatBlock
    ) {}
}
