import type {IScopedTimer} from '@ambreia/kernel/feature/FeatureScope';
import {Logger} from '@ambreia/common/utils/Logger';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import {RoomSessionUserDataUpdateEvent} from '../../session/events/RoomSessionUserDataUpdateEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import {UserDataType} from '../../session/UserData';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../../ui/kit/WindowBits';
import {chatClock} from '../../ui/kit/chatModel';
import {RpgCombatEventsMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import {CombatOverlay} from './CombatOverlay';
import {CombatVfx} from './CombatVfx';
import {RpgCombatSession} from './RpgCombatSession';
import {vfxSheet, VFX_IMAGES, type IVfxPhase, type IVfxSet} from './vfxSheets';
import {platform} from '@ambreia/common/platform/Platform';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import {AttackBinding} from './views/AttackBinding';
import {CombatLogPanel} from './views/CombatLogPanel';
import {LOG_IMAGES, logClock, logLine} from './views/combatLogLines';
import type {ILogNames} from './views/ILogNames';
import {DeathScreens} from './views/DeathScreens';
import {KoPanel} from './views/KoPanel';
import {LevelUpPanel} from './views/LevelUpPanel';
import {LEVEL_UP_IMAGES} from './views/levelUpRows';
import {OnceChoice} from './views/OnceChoice';
import {ResurrectOfferPanel} from './views/ResurrectOfferPanel';
import {PlayerFrameBinding} from './views/PlayerFrameBinding';
import {TargetHealthBinding} from './views/TargetHealthBinding';
import {TargetOfTargetBinding} from './views/TargetOfTargetBinding';

const log = Logger.getLogger('habbo.features.combat');

/** Outcomes that touched nothing: no hit visual. */
const MISSED = new Set(['miss', 'dodge', 'immune']);

/**
 * The fight in a zone (M1a §9.3): health bars over the monsters and the hurt players, the damage
 * numbers, the target frame's HP, the player frame's HP and mana and its « in combat » colour, the
 * death screens, a monster's yell (M1c). The fight's state is the model the session writes
 * (CombatModel, spec §3); the frames and panels are its views (views/), this file only wires them.
 * A click on a monster only selects it (features/interaction); the auto-attack is its own act. The effects are the content's (a skill's `vfx`, a class's `basicAttack`: IVfxSet,
 * read from the definitions features/skills loaded), drawn by CombatVfx from the sheets under
 * packages/vortex-client/spells/: a cast loops its `cast` on the caster; a blow or a skill plays
 * `release` on the caster, flies its `projectile`, then `area` where it landed and `hit` on each one
 * it touched, the numbers rising with the hit.
 */
export const CombatFeature: IGameFeature = {
    id: 'combat',
    images: [...VFX_IMAGES, ...LEVEL_UP_IMAGES, ...LOG_IMAGES],
    requires: ['roomEngine', 'hud', 'hudPlayer', 'roomSession', 'input'],
    create: ({host, scope}) =>
    {
        const session = new RpgCombatSession();
        const vfx = new CombatVfx(host.assets, () => host.made.roomEngine);
        const on = scope.bind(session.events);
        const modelOn = scope.bind(session.model.events);
        let overlay: CombatOverlay | null = null;
        let room: IRoomSession | null = null;
        // Every delayed effect belongs to the zone it was fired in: a flight or a hit that lands after
        // a zone change would play on whatever object holds the same id in the next room. The epoch
        // changes on RSE_ENDED and a pending timer whose epoch is gone does nothing.
        let epoch = 0;
        const pending = new Set<IScopedTimer>();
        const later = (run: () => void, delayMs: number): void =>
        {
            const at = epoch;
            const handle = scope.timeout(() =>
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

        modelOn('vitals', (objectId, vitals) => overlayOf()?.setHealth(objectId, vitals.health, vitals.maxHealth, isMonster(objectId)));
        scope.own(new PlayerFrameBinding(session.model, host.made.hudPlayer!));
        scope.own(new TargetHealthBinding(session.model, host.made.hud!));
        // A monster is named by its content id (M1a §9.1), anyone else by its user name.
        const nameOf = (objectId: number): string | null =>
        {
            const user = room?.userDataManager.getUserDataByIndex(objectId) ?? null;

            if(!user) return null;

            return isMonster(objectId) ? bits().contentName(`${user.name}.name`, user.name) : user.name;
        };

        scope.own(new TargetOfTargetBinding(session.model, host.made.hud!, objectId =>
        {
            const name = nameOf(objectId);

            if(name === null) return null;

            // The player's own level is known.
            return {name, level: objectId === room?.ownUserRoomId ? host.made.hudPlayer?.value.level ?? null : null};
        }));

        // The auto-attack (M1d §2.3): the attack slot, the T key, a double click on a monster.
        const attack = new AttackBinding(session.model, host.made.hudPlayer!, active => session.setAutoAttack(active));

        scope.own(attack);
        scope.bind(host.made.hudPlayer?.events)('attack', () => attack.toggle());
        scope.add(host.made.input!.bind('combat', 't', () => attack.toggle(), {when: () => room !== null}));
        scope.bind(host.made.roomEngine?.events)(RoomEngineObjectEvent.REOE_SELECTED, (event: RoomEngineObjectEvent) => attack.selected(event.objectId, isMonster(event.objectId), platform().now()));

        // KO, wait, release, the resurrection offer (M1d §2.3, §4): the owner's two screens.
        const choose = (choice: Parameters<typeof session.deathChoice>[0]): void => deaths.choose(choice);
        const send = (choice: Parameters<typeof session.deathChoice>[0]): void =>
        {
            session.deathChoice(choice);

            if(choice === 'accept') host.made.hud?.toast({kind: 'success', title: bits().text('vortex.toast.resurrecting'), text: '', ms: 4000});
        };
        const ko = new KoPanel(() => host.made.windowManager, bits(), choose);
        const offer = new ResurrectOfferPanel(() => host.made.windowManager, bits(), choose);
        const deaths = new DeathScreens(session.model, ko, offer, new OnceChoice(send),
            () =>
            {
                const player = host.made.hudPlayer?.value;
                const classId = host.made.character?.state?.classId ?? '';

                return {figure: player?.figure ?? '', level: player?.level ?? null, className: classId === '' ? '' : bits().contentName(`vortex.${classId}`, classId)};
            },
            objectId =>
            {
                const user = room?.userDataManager.getUserDataByIndex(objectId) ?? null;

                return user ? {name: user.name, figure: user.figure, level: null} : null;
            },
            (run, ms) => scope.interval(run, ms));

        scope.own(ko).own(offer).own(deaths);

        // The level-up (M1d §4): one panel per XP gain, the skills by their content name and icon.
        const levelUp = new LevelUpPanel(() => host.made.windowManager, bits(), skillId => ({
            name: bits().contentName(`${skillId}.name`, skillId),
            icon: host.made.skills?.definition(skillId)?.icon || 'rpg/skills/warrior_skill_icon_10'
        }));

        scope.own(levelUp);
        modelOn('levelUp', up => levelUp.show(up, host.made.hudPlayer?.value.figure ?? ''));

        // The combat log (M1d §4): the model's lines, opened with L; the time each line was written.
        const logNames: ILogNames = {
            name: objectId => objectId === session.model.ownObjectId ? bits().text('vortex.combat.log.you') : nameOf(objectId) ?? '',
            content: id => bits().contentName(`${id}.name`, id)
        };
        const combatLog = new CombatLogPanel(() => host.made.windowManager, bits(), logNames, at => logClock(Date.now() - (platform().now() - at)));

        scope.own(combatLog);
        modelOn('log', entry =>
        {
            combatLog.add(entry, session.model.log);

            // A refusal (an attack or a skill the server turned down) is also said at once, as a toast.
            if(entry.kind !== 'refused') return;

            const text = bits();

            host.made.hud?.toast({kind: 'error', title: text.text('vortex.toast.refused'), text: logLine(entry, (key, ...params) => text.text(key, ...params), logNames).text, ms: 3000});
        });
        scope.add(host.made.input!.bind('combat', 'l', () => combatLog.toggle(session.model.log), {when: () => room !== null}));

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
                : objectId === session.model.target?.objectId ? session.model.target.classId : '';
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

        on('hits', message =>
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

        on('impacts', impacts =>
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
        on('outcomes', outcomes =>
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
        on('mark', (objectId, icon) =>
        {
            if(icon) overlayOf()?.mark(objectId, icon);
            else overlay?.mark(objectId, null);
        });

        // A skill's `cast` loops on its caster from its RpgCastStart to its RpgCastEnd.
        const incantations = new Map<number, () => void>();

        modelOn('cast', (objectId, cast) =>
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
        on('yell', yell =>
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

        const sessionOn = scope.bind(host.made.roomSession?.sessionEvents);

        // The player's own object id comes with the room's users, sometimes after the combat burst.
        const knowOwn = (): void => session.model.setOwn(Math.max(0, room?.ownUserRoomId ?? 0));

        sessionOn(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) =>
        {
            room = event.session;
            knowOwn();
        });
        // A player who leaves hurt took their bar's object id with them; without this the overlay
        // kept an invisible bar per departed player for the whole visit (a monster's goes on kill).
        sessionOn(RoomSessionUserDataUpdateEvent.RSUDUE_USER_DATA_UPDATE, (event: RoomSessionUserDataUpdateEvent) =>
        {
            knowOwn();
            if(event.addedUsers.length === 0) overlay?.prune(objectId => event.session.userDataManager.getUserDataByIndex(objectId) !== null);
        });
        sessionOn(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            epoch++;
            for(const handle of pending) handle.clear();
            pending.clear();

            // A zone change and a reconnect both end the room session: the next zone's burst
            // rebuilds the model (spec §3.4).
            session.model.reset(epoch);
            combatLog.clear();
            overlay?.clear();
            // The canvas took the sprites with it; the loops' handles would only hold their closures.
            incantations.clear();
            flights.clear();
        });

        // Dev hook: `__ambreia.combat.simulate(objectId)` plays three blows of the player on an avatar
        // as the server would send them (the player's class's basicAttack visuals included);
        // `simulate(objectId, 'cast', 'skill.mage.flame_burst')` loops that skill's cast visual on
        // the object for two seconds; `simulate(objectId, 'skill', 'skill.mage.flame_burst')` lands
        // that skill on it.
        scope.own(session).add(() =>
        {
            overlay?.dispose();
            overlay = null;
            vfx.dispose();
        });
        scope.hook('combat', {
            session,
            simulate: (objectId: number, what = 'blows', skillId = 'skill.mage.flame_burst') =>
            {
                const self = room?.ownUserRoomId ?? -1;

                if(what === 'cast')
                {
                    session.model.setCast(objectId, {durationMs: 2000, channel: false, skillId, targetObjectId: 0});
                    later(() => session.model.endCast(objectId, 'done', skillId), 2000);

                    return;
                }

                if(what === 'skill')
                {
                    const outcomes = [{sourceObjectId: self, sourceId: skillId, targetObjectId: objectId, amount: 9, absorbed: 0, outcome: 'hit', health: 20, maxHealth: 40, killed: false}];

                    session.model.reportOutcomes(outcomes);
                    session.report(outcomes, [{casterObjectId: self, skillId, targetObjectId: objectId, x: 0, y: 0}]);

                    return;
                }

                ['hit', 'crit', 'miss'].forEach((outcome, i) => later(() =>
                {
                    const blows = new RpgCombatEventsMessage([{attackerId: self, targetId: objectId, amount: 7 * (i + 1), outcome, health: 28 - 7 * i, maxHealth: 40, killed: false}]);

                    session.model.reportHits(blows.hits);
                    session.events.emit('hits', blows);
                }, i * 700));
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
