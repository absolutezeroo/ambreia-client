import {devHook} from '@ambreia/common/utils/BuildEnv';
import {Logger} from '@ambreia/common/utils/Logger';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import {RoomSessionUserDataUpdateEvent} from '../../session/events/RoomSessionUserDataUpdateEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import {UserDataType} from '../../session/UserData';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../character/WindowBits';
import {chatClock} from '../hud/chatModel';
import {RpgCombatEventsMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import {CombatOverlay} from './CombatOverlay';
import {CombatVfx} from './CombatVfx';
import {RpgCombatSession} from './RpgCombatSession';
import {vfxSheet, VFX_IMAGES, type IVfxPhase, type IVfxSet} from './vfxSheets';

const log = Logger.getLogger('habbo.features.combat');

/** Outcomes that touched nothing: no hit visual. */
const MISSED = new Set(['miss', 'dodge', 'immune']);

/**
 * The fight in a zone (M1a §9.3): health bars over the monsters and the hurt players, the damage
 * numbers, the target frame's HP, the player frame's HP and mana and its « in combat » colour, the
 * death countdown, a monster's yell (M1c), and the refused attacks as system lines. A click on a
 * monster targets and attacks it through features/interaction (RpgTargetSelect); this feature only
 * shows the fight. The effects are the content's (a skill's `vfx`, a class's `basicAttack`: IVfxSet,
 * read from the definitions features/skills loaded), drawn by CombatVfx from the sheets under
 * packages/vortex-client/spells/: a cast loops its `cast` on the caster; a blow or a skill plays
 * `release` on the caster, flies its `projectile`, then `area` where it landed and `hit` on each one
 * it touched, the numbers rising with the hit.
 */
export const CombatFeature: IGameFeature = {
    id: 'combat',
    images: VFX_IMAGES,
    create: ({host}) =>
    {
        const session = new RpgCombatSession();
        const vfx = new CombatVfx(host.assets, () => host.made.roomEngine);
        let overlay: CombatOverlay | null = null;
        let room: IRoomSession | null = null;
        let countdown: ReturnType<typeof setInterval> | null = null;
        // Every delayed effect belongs to the zone it was fired in: a flight or a hit that lands after
        // a zone change would play on whatever object holds the same id in the next room. The epoch
        // changes on RSE_ENDED and a pending timer whose epoch is gone does nothing.
        let epoch = 0;
        const pending = new Set<ReturnType<typeof setTimeout>>();
        const later = (run: () => void, delayMs: number): void =>
        {
            const at = epoch;
            const handle = setTimeout(() =>
            {
                pending.delete(handle);
                if(epoch === at) run();
            }, delayMs);

            pending.add(handle);
        };

        host.made.combat = session;

        const bits = (): WindowBits => new WindowBits(host.made.localization);
        const overlayOf = (): CombatOverlay | null =>
        {
            const windows = host.made.windowManager;

            if(!overlay && windows) overlay = new CombatOverlay(windows, () => host.made.roomEngine, key => bits().text(key));

            return overlay;
        };
        /** A monster is a pet of the room (M1a §9.1). */
        const isMonster = (objectId: number): boolean => room?.userDataManager.getUserDataByIndex(objectId)?.type === UserDataType.PET;

        session.events.on('health', (objectId, health, maxHealth) =>
        {
            overlayOf()?.setHealth(objectId, health, maxHealth, isMonster(objectId));

            // The target frame follows its target's HP.
            const target = host.made.hud?.value.target ?? null;

            if(target && host.made.interaction?.targetId === objectId) host.made.hud?.update({target: {...target, hp: health, hpMax: maxHealth}});
        });

        // A monster's own art (tools/build-monsters.mjs) plays these pet gestures; a pet without them
        // plays nothing.
        const gesture = (objectId: number, name: string): void =>
        {
            if(room && isMonster(objectId)) host.made.roomEngine?.updateObjectPetGesture(room.roomId, objectId, name);
        };

        // ponytail: the client knows its own class and its target's (RpgTarget); another player's
        // blow shows no visual until the hit says its attacker's class.
        const classOf = (objectId: number): string =>
            objectId === room?.ownUserRoomId ? host.made.character?.state?.classId ?? ''
                : objectId === host.made.interaction?.targetId ? host.made.interaction?.target?.classId ?? '' : '';
        /** What the content draws for a skill (its `vfx`) or a status (nothing here: its aura is its own). */
        const skillSet = (skillId: string): IVfxSet | null => host.made.skills?.definition(skillId)?.vfx ?? null;
        const basicAttackSet = (classId: string): IVfxSet | null => host.made.skills?.classDefinition(classId)?.basicAttack ?? null;

        /**
         * Plays a phase once on an avatar (or on a tile), `delayMs` after now; returns that delay so
         * what follows it (a number) waits the same. Nothing when the content names no phase, or
         * art the client does not ship.
         */
        const play = (phase: IVfxPhase | null, objectId: number, cell: {x: number; y: number} | null = null): number =>
        {
            const sheet = phase ? vfxSheet(phase.sheet) : null;

            if(!phase || !sheet) return 0;

            const go = (): void =>
            {
                if(objectId > 0) vfx.burst(sheet, objectId, phase.attach);
                else if(cell) vfx.burstAt(sheet, cell.x, cell.y);
            };

            if(phase.delayMs > 0) later(go, phase.delayMs);
            else go();

            return phase.delayMs;
        };

        /**
         * A set goes off from a caster: `release` on it, its `projectile` flying to the target; `land`
         * runs when it lands (at once without a projectile) and returns the delay of what lands.
         * Returns when the numbers may rise: the flight and that delay.
         */
        const fire = (set: IVfxSet | null, casterId: number, targetId: number, land: () => number): number =>
        {
            play(set?.release ?? null, casterId);

            const sheet = set?.projectile ? vfxSheet(set.projectile.sheet) : null;
            const flight = set?.projectile && sheet ? vfx.shoot(sheet, set.projectile.speed, casterId, targetId, () => land()) : 0;

            // Without a flight, the landing's own delay is the whole wait; with one, the content's
            // delays run from the landing, and the number follows them.
            return flight > 0 ? flight + (set?.hit?.delayMs ?? 0) : land();
        };

        session.events.on('hits', message =>
        {
            for(const hit of message.hits)
            {
                const set = basicAttackSet(classOf(hit.attackerId));
                const missed = hit.outcome === 'miss';

                gesture(hit.attackerId, 'atk');

                const wait = fire(set, hit.attackerId, hit.targetId, () =>
                {
                    if(missed) return 0;

                    const delay = play(set?.hit ?? null, hit.targetId);

                    if(!hit.killed) gesture(hit.targetId, 'hit');

                    return delay;
                });

                overlayOf()?.hit(hit.targetId, hit.amount, hit.outcome, 0, wait);
                // A dead monster leaves the room (UserRemove); a dead player stays, as a ghost.
                if(hit.killed && isMonster(hit.targetId)) overlay?.remove(hit.targetId);
            }
        });

        // Skills (M1b): where one landed, its `release`, `projectile` and `area` play; its `hit` and
        // its numbers follow on each one it touched. A flight's wait lives until the outcomes of the
        // same report, which follow at once.
        const flights = new Map<string, number>();

        session.events.on('impacts', impacts =>
        {
            for(const impact of impacts)
            {
                const set = skillSet(impact.skillId);

                if(!set) continue;

                const cell = {x: impact.x, y: impact.y};
                const wait = fire(set, impact.casterObjectId, impact.targetObjectId, () => play(set.area, impact.targetObjectId, cell));

                flights.set(impact.skillId, Math.max(0, wait - (set.area?.delayMs ?? 0)));
            }
        });

        // Skills and statuses (M1b): the numbers, a monster killed by one leaves, the cast bars.
        session.events.on('outcomes', outcomes =>
        {
            for(const outcome of outcomes)
            {
                const flight = flights.get(outcome.sourceId) ?? 0;
                const hit = MISSED.has(outcome.outcome) ? null : skillSet(outcome.sourceId)?.hit ?? null;
                const delay = flight + (hit?.delayMs ?? 0);

                if(hit) later(() => play({...hit, delayMs: 0}, outcome.targetObjectId), delay);
                overlayOf()?.hit(outcome.targetObjectId, outcome.amount, outcome.outcome, outcome.absorbed, delay);
                if(outcome.killed && isMonster(outcome.targetObjectId)) overlay?.remove(outcome.targetObjectId);
            }

            flights.clear();
        });
        session.events.on('mark', (objectId, icon) =>
        {
            if(icon) overlayOf()?.mark(objectId, icon);
            else overlay?.mark(objectId, null);
        });

        // A skill's `cast` loops on its caster from its RpgCastStart to its RpgCastEnd.
        const incantations = new Map<number, () => void>();

        session.events.on('cast', (objectId, cast) =>
        {
            incantations.get(objectId)?.();
            incantations.delete(objectId);

            if(!cast)
            {
                overlay?.endCast(objectId);

                return;
            }

            overlayOf()?.startCast(objectId, cast.durationMs, cast.channel);

            const phase = skillSet(cast.skillId)?.cast ?? null;
            const sheet = phase ? vfxSheet(phase.sheet) : null;

            if(phase && sheet) incantations.set(objectId, vfx.loop(sheet, objectId, phase.attach));
        });

        // A boss's phase (M1c): its line over it and in the log, from the content's texts.
        session.events.on('yell', yell =>
        {
            const text = bits();
            const line = text.textOr(yell.textKey, yell.textKey);
            const id = room?.userDataManager.getUserDataByIndex(yell.objectId)?.name ?? '';

            overlayOf()?.yell(yell.objectId, line);
            host.made.hud?.addChatLine({
                time: chatClock(Date.now() / 1000), channel: 'system', author: '',
                message: text.text('vortex.combat.yell', 'monster', text.contentName(`${id}.name`, id), 'text', line)
            });
        });

        session.events.on('self', vitals => host.made.hudPlayer?.update({
            hp: vitals.health, hpMax: vitals.maxHealth, mana: vitals.mana, manaMax: vitals.maxMana, inCombat: vitals.inCombat
        }));

        // A ghost until the respawn (M1a §8.1): the HUD's warning counts down.
        session.events.on('death', death =>
        {
            let left = death.respawnSeconds;
            const show = (): void => host.made.hud?.update({alert: left > 0 ? bits().text('vortex.combat.dead', 'seconds', String(left)) : null});

            if(countdown !== null) clearInterval(countdown);
            show();
            countdown = setInterval(() =>
            {
                left--;
                show();

                if(left <= 0 && countdown !== null)
                {
                    clearInterval(countdown);
                    countdown = null;
                }
            }, 1000);
        });

        session.events.on('result', result =>
        {
            const text = bits();

            log.debug(`attack refused: ${result.code}`);
            host.made.hud?.addChatLine({
                time: chatClock(Date.now() / 1000), channel: 'system', author: '',
                message: text.textOr(`vortex.combat.error.${result.code}`, text.text('vortex.combat.error.refused'))
            });
        });

        const sessionEvents = host.made.roomSession?.sessionEvents;

        sessionEvents?.on(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) => room = event.session);
        // A player who leaves hurt took their bar's object id with them; without this the overlay
        // kept an invisible bar per departed player for the whole visit (a monster's goes on kill).
        sessionEvents?.on(RoomSessionUserDataUpdateEvent.RSUDUE_USER_DATA_UPDATE, (event: RoomSessionUserDataUpdateEvent) =>
        {
            if(event.addedUsers.length === 0) overlay?.prune(objectId => event.session.userDataManager.getUserDataByIndex(objectId) !== null);
        });
        sessionEvents?.on(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            epoch++;
            for(const handle of pending) clearTimeout(handle);
            pending.clear();

            // The death countdown belonged to that zone's ghost; the next zone starts clean.
            if(countdown !== null)
            {
                clearInterval(countdown);
                countdown = null;
                host.made.hud?.update({alert: null});
            }

            session.forget();
            overlay?.clear();
            // The canvas took the sprites with it; the loops' handles would only hold their closures.
            incantations.clear();
            flights.clear();
            host.made.hudPlayer?.update({inCombat: false});
        });

        // Dev hook: `__ambreia.combat.simulate(objectId)` plays three blows of the player on an avatar
        // as the server would send them (the player's class's basicAttack visuals included);
        // `simulate(objectId, 'cast', 'skill.mage.flame_burst')` loops that skill's cast visual on
        // the object for two seconds; `simulate(objectId, 'skill', 'skill.mage.flame_burst')` lands
        // that skill on it.
        devHook('combat', {
            session,
            simulate: (objectId: number, what = 'blows', skillId = 'skill.mage.flame_burst') =>
            {
                const self = room?.ownUserRoomId ?? -1;

                if(what === 'cast')
                {
                    session.cast(objectId, {durationMs: 2000, channel: false, skillId});
                    later(() => session.cast(objectId, null), 2000);

                    return;
                }

                if(what === 'skill')
                {
                    session.report(
                        [{sourceObjectId: self, sourceId: skillId, targetObjectId: objectId, amount: 9, absorbed: 0, outcome: 'hit', health: 20, maxHealth: 40, killed: false}],
                        [{casterObjectId: self, skillId, targetObjectId: objectId, x: 0, y: 0}]
                    );

                    return;
                }

                ['hit', 'crit', 'miss'].forEach((outcome, i) => later(() => session.events.emit('hits', new RpgCombatEventsMessage([
                    {attackerId: self, targetId: objectId, amount: 7 * (i + 1), outcome, health: 28 - 7 * i, maxHealth: 40, killed: false}
                ])), i * 700));
            }
        });

        return null;
    },
    afterAttach: async (_product, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) host.made.combat?.install(connection);
        else log.warn('no game connection to serve the combat on');
    }
};
