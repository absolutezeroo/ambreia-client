import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IRpgStatBlock} from '../../../incoming/rpg/characters/IRpgStatBlock';

/** Reads the stat block: the counterpart of the server's RpgStatBlockWriter (F3a §6, vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md). */
export function readRpgStatBlock(wrapper: IMessageDataWrapper): IRpgStatBlock
{
    return {
        strength: wrapper.readInt(),
        intelligence: wrapper.readInt(),
        agility: wrapper.readInt(),
        maxHealth: wrapper.readInt(),
        maxMana: wrapper.readInt(),
        armor: wrapper.readInt(),
        critBp: wrapper.readInt(),
        dodgeBp: wrapper.readInt(),
        speedPercent: wrapper.readInt(),
        power: wrapper.readInt()
    };
}
