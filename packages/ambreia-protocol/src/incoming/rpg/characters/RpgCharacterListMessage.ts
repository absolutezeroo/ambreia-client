import type {IRpgCharacterListEntry} from './IRpgCharacterListEntry';

/** The account's characters, after login and after each creation or class choice. (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md) */
export class RpgCharacterListMessage
{
    constructor(
        readonly maxCharacters: number,
        readonly characters: readonly IRpgCharacterListEntry[]
    ) {}
}
