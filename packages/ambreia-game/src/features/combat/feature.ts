import {Logger} from '@ambreia/common/utils/Logger';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import {UserDataType} from '../../session/UserData';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../character/WindowBits';
import {chatClock} from '../hud/chatModel';
import {CombatOverlay} from './CombatOverlay';
import {RpgCombatSession} from './RpgCombatSession';

const log = Logger.getLogger('habbo.features.combat');

/**
 * The fight in a zone (M1a §9.3): health bars over the monsters and the hurt players, the damage
 * numbers, the target frame's HP, the player frame's HP and mana and its « in combat » colour, the
 * death countdown, and the refused attacks as system lines. A click on a monster targets and
 * attacks it through features/interaction (RpgTargetSelect); this feature only shows the fight.
 */
export const CombatFeature: IGameFeature = {
    id: 'combat',
    create: ({host}) =>
    {
        const session = new RpgCombatSession();
        let overlay: CombatOverlay | null = null;
        let room: IRoomSession | null = null;
        let countdown: ReturnType<typeof setInterval> | null = null;

        host.made.combat = session;

        const bits = (): WindowBits => new WindowBits(host.made.localization);
        const overlayOf = (): CombatOverlay | null =>
        {
            const windows = host.made.windowManager;

            if(!overlay && windows) overlay = new CombatOverlay(windows, () => host.made.roomEngine, () => bits().text('vortex.combat.miss'));

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

        session.events.on('hits', message =>
        {
            for(const hit of message.hits)
            {
                overlayOf()?.hit(hit.targetId, hit.amount, hit.outcome);
                // A dead monster leaves the room (UserRemove); a dead player stays, as a ghost.
                if(hit.killed && isMonster(hit.targetId)) overlay?.remove(hit.targetId);
            }
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
        sessionEvents?.on(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            session.forget();
            overlay?.clear();
            host.made.hudPlayer?.update({inCombat: false});
        });

        // Dev hook: `__ambreia.combat.simulate(objectId)` shows a bar and a few blows on an avatar.
        const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

        root.__ambreia = {...(root.__ambreia ?? {}), combat: {
            session,
            simulate: (objectId: number) =>
            {
                overlayOf()?.setHealth(objectId, 28, 40, true);
                ['hit', 'crit', 'miss'].forEach((outcome, i) => setTimeout(() => overlayOf()?.hit(objectId, 7 * (i + 1), outcome), i * 400));
            }
        }};

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
