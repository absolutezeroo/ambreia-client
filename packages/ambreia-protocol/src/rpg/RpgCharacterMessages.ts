import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';

/**
 * The character's messages, server to client (docs/superpowers/specs/2026-10-08-f3-character-messages.md,
 * RPG spec §3.7): plain messages and their parsers, in the new network style. Field order mirrors the
 * emulator's serializers; crit and dodge travel in per mille (the wire has no double).
 */
export interface IRpgCharacterStats
{
    readonly strength: number;
    readonly intelligence: number;
    readonly agility: number;
    readonly maxHealth: number;
    readonly maxMana: number;
    readonly armor: number;
    readonly critPermille: number;
    readonly dodgePermille: number;
    readonly speedPercent: number;
    readonly power: number;
}

/** Sent on entering a zone and on reconnecting: the whole character. */
export class RpgCharacterSnapshot
{
    constructor(
        readonly classId: string,
        readonly specializationId: string,
        readonly level: number,
        readonly maxLevel: number,
        /** XP inside the current level (it restarts at each level). */
        readonly xp: number,
        /** XP the current level needs; 0 at the maximum level. */
        readonly xpToNext: number,
        readonly stats: IRpgCharacterStats
    ) {}
}

/** Sent when XP is gained, after the level-ups it caused. */
export class RpgCharacterXp
{
    constructor(readonly gained: number, readonly level: number, readonly xp: number, readonly xpToNext: number) {}
}

/** One per level gained, before the XP message. */
export class RpgCharacterLevelUp
{
    constructor(readonly oldLevel: number, readonly newLevel: number) {}
}

/** Sent when the stats change (level, equipment, content). */
export class RpgCharacterStats
{
    constructor(readonly stats: IRpgCharacterStats) {}
}

function readStats(wrapper: IMessageDataWrapper): IRpgCharacterStats
{
    return {
        strength: wrapper.readInt(),
        intelligence: wrapper.readInt(),
        agility: wrapper.readInt(),
        maxHealth: wrapper.readInt(),
        maxMana: wrapper.readInt(),
        armor: wrapper.readInt(),
        critPermille: wrapper.readInt(),
        dodgePermille: wrapper.readInt(),
        speedPercent: wrapper.readInt(),
        power: wrapper.readInt()
    };
}

export const rpgCharacterSnapshotParser: IIncomingParser<RpgCharacterSnapshot> = {
    parse: wrapper => new RpgCharacterSnapshot(
        wrapper.readString(),
        wrapper.readString(),
        wrapper.readInt(),
        wrapper.readInt(),
        wrapper.readInt(),
        wrapper.readInt(),
        readStats(wrapper)
    )
};

export const rpgCharacterXpParser: IIncomingParser<RpgCharacterXp> = {
    parse: wrapper => new RpgCharacterXp(wrapper.readInt(), wrapper.readInt(), wrapper.readInt(), wrapper.readInt())
};

export const rpgCharacterLevelUpParser: IIncomingParser<RpgCharacterLevelUp> = {
    parse: wrapper => new RpgCharacterLevelUp(wrapper.readInt(), wrapper.readInt())
};

export const rpgCharacterStatsParser: IIncomingParser<RpgCharacterStats> = {
    parse: wrapper => new RpgCharacterStats(readStats(wrapper))
};
