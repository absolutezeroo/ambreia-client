import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';
import type {IRpgCharacterSession} from '../character/IRpgCharacterSession';
import type {PlayerHudState} from './PlayerHudState';

/** The XP bar: full with MAX at the maximum level (xpToNext 0), proportional below it. */
function xpValues(xp: number, xpToNext: number): {xp: number; xpMax: number; xpLabel: string | null}
{
    return xpToNext > 0 ? {xp, xpMax: xpToNext, xpLabel: null} : {xp: 1, xpMax: 1, xpLabel: 'MAX'};
}

/**
 * The maxima from the stats. The current HP and mana have one writer, the combat model's own vitals
 * (spec §3.2, combat/views/PlayerFrameBinding): the stats never touch them.
 */
function vitals(stats: IRpgStatBlock): {hpMax: number; manaMax: number}
{
    return {hpMax: stats.maxHealth, manaMax: stats.maxMana};
}

/**
 * The HUD follows the played character (F3a §6.4): the state on entering a zone, then progress and
 * stats. Through the session's interface only, so the HUD does not depend on the character
 * feature. Returns the unbinding.
 */
export function bindCharacterToHud(session: IRpgCharacterSession, hud: PlayerHudState): () => void
{
    const onState = (message: {level: number; xp: number; xpToNext: number; stats: IRpgStatBlock}): void =>
    {
        const played = session.played;

        hud.update({level: message.level, ...xpValues(message.xp, message.xpToNext), ...vitals(message.stats), ...(played ? {name: played.name, figure: played.figure} : {})});
    };
    const onProgress = (message: {level: number; xp: number; xpToNext: number}): void =>
        hud.update({level: message.level, ...xpValues(message.xp, message.xpToNext)});
    const onStats = (message: {stats: IRpgStatBlock}): void => hud.update(vitals(message.stats));

    session.events.on('state', onState);
    session.events.on('progress', onProgress);
    session.events.on('stats', onStats);

    // Entered before the HUD was there (it is shown on entering a room): show what is known.
    if(session.state) onState(session.state);

    return () =>
    {
        session.events.off('state', onState);
        session.events.off('progress', onProgress);
        session.events.off('stats', onStats);
    };
}
