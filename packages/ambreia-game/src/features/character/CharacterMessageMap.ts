import {EventEmitter} from 'eventemitter3';
import {MessageMap} from '@ambreia/net/style/MessageMap';
import {
    rpgCharacterLevelUpParser, rpgCharacterSnapshotParser, rpgCharacterStatsParser, rpgCharacterXpParser
} from '@ambreia/protocol/rpg/RpgCharacterMessages';
import type {IRpgCharacterStats, RpgCharacterLevelUp} from '@ambreia/protocol/rpg/RpgCharacterMessages';
import type {PlayerHudState} from '../hud/PlayerHudState';

/** The server's ids of the character's messages (generated from Headers.cs once the server has them). */
export interface ICharacterHeaders
{
    readonly snapshot: number;
    readonly xp: number;
    readonly levelUp: number;
    readonly stats: number;
}

/** What other features hear of the character: the HUD's level-up alert, sounds, later quests. */
export class CharacterEvents extends EventEmitter<{levelUp: [RpgCharacterLevelUp]}> {}

/** The XP bar: full with "MAX" at the maximum level (xpToNext 0), proportional below it. */
function xpValues(xp: number, xpToNext: number): {xp: number; xpMax: number; xpLabel: string | null}
{
    return xpToNext > 0 ? {xp, xpMax: xpToNext, xpLabel: null} : {xp: 1, xpMax: 1, xpLabel: 'MAX'};
}

/**
 * Current HP and mana are the maxima until combat (M1) sends them: the server keeps no current
 * value out of combat yet (character spec §3).
 */
function vitals(stats: IRpgCharacterStats): {hp: number; hpMax: number; mana: number; manaMax: number}
{
    return {hp: stats.maxHealth, hpMax: stats.maxHealth, mana: stats.maxMana, manaMax: stats.maxMana};
}

/**
 * The character's messages (docs/superpowers/specs/2026-10-08-f3-character-messages.md) to the HUD:
 * the snapshot fills it, level-ups and XP move it, stats set the bars' maxima. The ids are given
 * by the caller so this is testable before the server's headers are generated.
 */
export function characterMessageMap(headers: ICharacterHeaders, hud: PlayerHudState, events: CharacterEvents): MessageMap
{
    return new MessageMap()
        .incoming(headers.snapshot, rpgCharacterSnapshotParser, {
            handle: message => hud.update({level: message.level, ...xpValues(message.xp, message.xpToNext), ...vitals(message.stats)})
        })
        .incoming(headers.levelUp, rpgCharacterLevelUpParser, {
            handle: (message) =>
            {
                hud.update({level: message.newLevel});
                events.emit('levelUp', message);
            }
        })
        .incoming(headers.xp, rpgCharacterXpParser, {
            handle: message => hud.update({level: message.level, ...xpValues(message.xp, message.xpToNext)})
        })
        .incoming(headers.stats, rpgCharacterStatsParser, {
            handle: message => hud.update(vitals(message.stats))
        });
}
