import {Logger} from '@ambreia/common/utils/Logger';
import {platform} from '@ambreia/common/platform/Platform';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import {RoomSessionUserDataUpdateEvent} from '../../session/events/RoomSessionUserDataUpdateEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../../ui/kit/WindowBits';
import {CombatNames} from './CombatNames';
import {CombatOverlay} from './CombatOverlay';
import {CombatSimulator} from './CombatSimulator';
import {CombatVfx} from './CombatVfx';
import {RpgCombatSession} from './RpgCombatSession';
import {CombatChoreography} from './stage/CombatChoreography';
import {OverlaySlot} from './stage/OverlaySlot';
import {ZoneTimers} from './stage/ZoneTimers';
import {vfxSheet, VFX_IMAGES} from './vfxSheets';
import {AttackBinding} from './views/AttackBinding';
import {AuraLayer} from './views/AuraLayer';
import {BossYell} from './views/BossYell';
import {CombatLogPanel} from './views/CombatLogPanel';
import {LOG_IMAGES, logClock} from './views/combatLogLines';
import {DeathScreens} from './views/DeathScreens';
import {KoPanel} from './views/KoPanel';
import {LevelUpPanel} from './views/LevelUpPanel';
import {LEVEL_UP_IMAGES} from './views/levelUpRows';
import {OnceChoice} from './views/OnceChoice';
import {PlayerFrameBinding} from './views/PlayerFrameBinding';
import {RefusalToast} from './views/RefusalToast';
import {ResurrectOfferPanel} from './views/ResurrectOfferPanel';
import {TargetHealthBinding} from './views/TargetHealthBinding';
import {TargetOfTargetBinding} from './views/TargetOfTargetBinding';

const log = Logger.getLogger('habbo.features.combat');

/**
 * The fight in a zone (M1a §9.3). The fight's state is the model the session writes (CombatModel,
 * spec §3); this file only wires its parts: the visuals of blows, skills and casts
 * (stage/CombatChoreography, the content's IVfxSet drawn by CombatVfx), the overlay's bars and
 * numbers, the frames and panels (views/), the names (CombatNames). A click on a monster only
 * selects it (features/interaction); the auto-attack is its own act.
 */
export const CombatFeature: IGameFeature = {
    id: 'combat',
    images: [...VFX_IMAGES, ...LEVEL_UP_IMAGES, ...LOG_IMAGES],
    requires: ['roomEngine', 'hud', 'hudPlayer', 'roomSession', 'input'],
    create: ({host, scope}) =>
    {
        const session = new RpgCombatSession();
        const on = scope.bind(session.events);
        const modelOn = scope.bind(session.model.events);
        let room: IRoomSession | null = null;
        const inRoom = {when: () => room !== null};

        host.made.combat = session;

        const bits = (): WindowBits => new WindowBits(host.made.localization);
        const names = new CombatNames(objectId => room?.userDataManager.getUserDataByIndex(objectId) ?? null, bits, () => session.model.ownObjectId);
        const zone = new ZoneTimers((run, ms) => scope.timeout(run, ms));
        const later = (run: () => void, delayMs: number): void => zone.later(run, delayMs);
        const overlay = new OverlaySlot(() =>
        {
            const windows = host.made.windowManager;

            return windows ? new CombatOverlay(windows, () => host.made.roomEngine, key => bits().text(key)) : null;
        });
        const vfx = new CombatVfx(host.assets, () => host.made.roomEngine);

        scope.own(zone).own(session).add(() =>
        {
            overlay.dispose();
            vfx.dispose();
        });

        // The status auras (M1d §3): the content's aura of each status, looped while it lasts.
        const auras = new AuraLayer((phase, objectId) =>
        {
            const sheet = vfxSheet(phase.sheet);

            return sheet ? vfx.loop(sheet, objectId, phase.attach) : null;
        }, statusId => host.made.skills?.statusDefinition(statusId)?.vfx?.aura ?? null);

        scope.own(auras);
        modelOn('statuses', (objectId, statuses) => auras.update(objectId, statuses));

        // The blows', skills' and casts' visuals and numbers (the content's IVfxSet).
        const choreography = new CombatChoreography({
            vfx,
            sheet: vfxSheet,
            marks: () => overlay.get(),
            later,
            forget: objectId => auras.forget(objectId),
            isMonster: objectId => names.isMonster(objectId),
            // A monster's own art (tools/build-monsters.mjs) plays these pet gestures; a pet without them plays nothing.
            gesture: (objectId, name) =>
            {
                if(room && names.isMonster(objectId)) host.made.roomEngine?.updateObjectPetGesture(room.roomId, objectId, name);
            },
            // ponytail: the client knows its own class and its target's (RpgTarget); another player's
            // blow shows no visual until the hit says its attacker's class.
            classOf: objectId => objectId === room?.ownUserRoomId ? host.made.character?.state?.classId ?? ''
                : objectId === session.model.target?.objectId ? session.model.target.classId : '',
            skillSet: skillId => host.made.skills?.definition(skillId)?.vfx ?? null,
            basicAttackSet: classId => host.made.skills?.classDefinition(classId)?.basicAttack ?? null
        });

        on('hits', message => choreography.hits(message.hits));
        on('impacts', impacts => choreography.impacts(impacts));
        on('outcomes', outcomes => choreography.outcomes(outcomes));
        modelOn('cast', (objectId, cast) => choreography.cast(objectId, cast));
        on('mark', (objectId, icon) => overlay.get()?.mark(objectId, icon));

        // The frames: the health bars over the room, the player's, the target's and its target's.
        modelOn('vitals', (objectId, vitals) => overlay.get()?.setHealth(objectId, vitals.health, vitals.maxHealth, names.isMonster(objectId)));
        scope.own(new PlayerFrameBinding(session.model, host.made.hudPlayer!));
        scope.own(new TargetHealthBinding(session.model, host.made.hud!));
        scope.own(new TargetOfTargetBinding(session.model, host.made.hud!, objectId =>
        {
            const name = names.nameOf(objectId);

            // The player's own level is known.
            return name === null ? null : {name, level: objectId === room?.ownUserRoomId ? host.made.hudPlayer?.value.level ?? null : null, monster: names.isMonster(objectId)};
        }));

        // The auto-attack (M1d §2.3): the attack slot, the T key, a double click on a monster.
        const attack = new AttackBinding(session.model, host.made.hudPlayer!, active => session.setAutoAttack(active));

        scope.own(attack);
        scope.bind(host.made.hudPlayer?.events)('attack', () => attack.toggle());
        scope.add(host.made.input!.bind('combat', 't', () => attack.toggle(), inRoom));
        scope.bind(host.made.roomEngine?.events)(RoomEngineObjectEvent.REOE_SELECTED, (event: RoomEngineObjectEvent) => attack.selected(event.objectId, names.isMonster(event.objectId), platform().now()));

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
            name: names.content(skillId),
            icon: host.made.skills?.definition(skillId)?.icon || 'rpg/skills/warrior_skill_icon_10'
        }));

        scope.own(levelUp);
        modelOn('levelUp', up => levelUp.show(up, host.made.hudPlayer?.value.figure ?? ''));

        // The combat log (M1d §4): its own panel, opened with L, not the chat; a refusal is also a toast.
        const combatLog = new CombatLogPanel(() => host.made.windowManager, bits(), names, at => logClock(Date.now() - (platform().now() - at)));
        const refusal = new RefusalToast(toast => host.made.hud?.toast(toast), bits, names);

        scope.own(combatLog);
        modelOn('log', entry =>
        {
            combatLog.add(entry, session.model.log);
            refusal.logged(entry);
        });
        scope.add(host.made.input!.bind('combat', 'l', () => combatLog.toggle(session.model.log), inRoom));

        // A boss's phase (M1c).
        const yell = new BossYell((objectId, text) => overlay.get()?.yell(objectId, text), line => host.made.hud?.addChatLine(line), bits, objectId => names.nameOf(objectId));

        on('yell', message => yell.yell(message));

        const sessionOn = scope.bind(host.made.roomSession?.sessionEvents);

        // The player's own object id comes with the room's users, sometimes after the combat burst.
        // The room engine sets it from the same Users message as the session's update, and its
        // handler may run after ours: read it again once the message is through.
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
            queueMicrotask(knowOwn);
            if(event.addedUsers.length === 0) overlay.get()?.prune(objectId => event.session.userDataManager.getUserDataByIndex(objectId) !== null);
        });
        // A zone change and a reconnect both end the room session: the next zone's burst rebuilds
        // the model (spec §3.4).
        sessionOn(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            zone.endZone();
            session.model.reset(zone.epoch);
            combatLog.clear();
            auras.clear();
            overlay.get()?.clear();
            choreography.clear();
        });

        const simulator = new CombatSimulator(session, () => room?.ownUserRoomId ?? -1, later);

        scope.hook('combat', {session, simulate: (objectId: number, what?: string, skillId?: string) => simulator.simulate(objectId, what, skillId)});

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
