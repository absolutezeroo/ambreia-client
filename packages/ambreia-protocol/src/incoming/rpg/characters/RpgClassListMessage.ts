import type {IRpgClassEntry} from './IRpgClassEntry';

/** The classes of the content, after login. (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md) */
export class RpgClassListMessage
{
    constructor(
        readonly classes: readonly IRpgClassEntry[]
    ) {}
}
