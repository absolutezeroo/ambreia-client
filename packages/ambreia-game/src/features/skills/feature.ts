import type {IScopedTimer} from '@ambreia/kernel/feature/FeatureScope';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IRpgCastStart} from '@ambreia/protocol/incoming/rpg/skills/RpgCastStartMessage';
import type {IRpgStatus} from '@ambreia/protocol/incoming/rpg/skills/RpgStatusesMessage';
import type {IHudCast} from '../hud/IHud';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import {UserDataType} from '../../session/UserData';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../../ui/kit/WindowBits';
import {chatClock} from '../../ui/kit/chatModel';
import {SKILL_SLOTS, type ISlotTip} from '../hud/IHud';
import {expiring, SELECTED_MS} from '../../ui/kit/hudRules';
import {barSkill, holdBack, RpgSkillSession, statusTime, type IClassDefinition, type ISkillDefinition, type IStatusDefinition} from './RpgSkillSession';
import {SKILL_IMAGES, skillIcon, statusIcon} from './skillArt';
import {SKILL_WINDOW_IMAGES, SkillsWindow} from './SkillsWindow';

const log = Logger.getLogger('habbo.features.skills');

/** How often the target frame's cast bar moves while its target casts. */
const CAST_TICK_MS = 100;
/** A telegraph's cells (M1c): red under a monster's cast, the cast bar's gold under a player's. */
const HOSTILE_TELEGRAPH = 0xe03030;
const FRIENDLY_TELEGRAPH = 0xe8b830;

/** A cast running in the zone, by caster: the target frame shows its target's. */
interface IRunningCast
{
    skillId: string;
    start: number;
    durationMs: number;
}

/** True when the key goes to a text field (the window system's fields are DOM inputs). */
const typing = (event: KeyboardEvent): boolean =>
{
    const target = event.target as {tagName?: string} | null;

    return target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
};

/**
 * The skills (M1b §10.3): the HUD's six skill slots and their cooldowns from RpgSkills and
 * RpgCooldowns; keys 1–6 (or a click on a slot) cast on the current target; a ground skill waits for
 * a floor click (RoomEngine.pickRpgTile()); K opens the skills window, where the bar is arranged.
 * The casts, numbers and health go through the combat session (its overlay draws them); the
 * statuses show on the player's effects panel and the target frame; refusals are system lines. A
 * telegraphed cast (M1c) shows its cells on the floor (RoomEngine.showRpgTelegraph()). The player's
 * effects show their time left; a slow or a stun marks its combatant, and a slowed one walks at the
 * server's pace (RoomEngine.setRpgStepTime()).
 */
export const SkillsFeature: IGameFeature = {
    id: 'skills',
    images: [...SKILL_IMAGES, ...SKILL_WINDOW_IMAGES],
    requires: ['roomEngine', 'interaction', 'hud', 'hudPlayer', 'roomSession'],
    create: ({host, scope}) =>
    {
        const session = new RpgSkillSession();
        const on = scope.bind(session.events);
        const casts = new Map<number, IRunningCast>();
        let room: IRoomSession | null = null;
        let window: SkillsWindow | null = null;
        let castTicker: IScopedTimer | null = null;
        /** The player's own statuses with their end (Date.now() clock; null: none), and the HUD's second hand. */
        let ownStatuses: {statusId: string; end: number | null}[] = [];
        let statusTicker: IScopedTimer | null = null;
        /** The combatants a slow or a stun holds back: marked over their head, slowed steps. */
        const heldBack = new Set<number>();
        let definitions: Promise<void> | null = null;

        host.made.skills = session;

        const bits = (): WindowBits => new WindowBits(host.made.localization);
        const skillName = (skillId: string): string => bits().contentName(`${skillId}.name`, skillId);
        const system = (message: string): void => host.made.hud?.addChatLine({time: chatClock(Date.now() / 1000), channel: 'system', author: '', message});
        const self = (): number => room?.ownUserRoomId ?? -1;
        const targetId = (): number => host.made.interaction?.targetId ?? 0;
        const icons = (statuses: readonly IRpgStatus[]): string[] => statuses.map(status => statusIcon(status.statusId));

        // A slot's tooltip (vortex_hud_slot_tip_xml): name, rank, cost and cooldown, description, key.
        const slotTip = (skillId: string, key: number): ISlotTip =>
        {
            const text = bits();
            const definition = session.definition(skillId);
            const meta = [text.text('vortex.skill.rank.short', 'level', '1')];

            if(definition) meta.push(`${text.text('vortex.skill.mana_cost')} : ${definition.cost}`, `${text.text('vortex.skill.cooldown.short')} : ${(definition.cooldownMs / 1000).toFixed(definition.cooldownMs % 1000 ? 1 : 0)} s`);

            return {title: skillName(skillId), tag: '', meta: meta.join(' · '), text: text.textOr(`${skillId}.description`, ''), effect: '', shortcut: text.text('vortex.hud.shortcut', 'key', String(key))};
        };

        // The HUD's skill slots: the bar's icons, each with the end of its cooldown, its cost and its tooltip.
        const renderBar = (): void => host.made.hudPlayer?.setSlots('skills', Array.from({length: SKILL_SLOTS}, (_, i) =>
        {
            const skillId = barSkill(session.bar[i] ?? '');

            if(skillId === null) return {icon: null, cooldownEnd: undefined, cost: undefined, tip: undefined};

            return {icon: skillIcon(skillId), cooldownEnd: session.readyAt(skillId), cost: session.definition(skillId)?.cost, tip: slotTip(skillId, i + 1)};
        }));

        /** What `objectId` casts right now for a frame's cast line, and whether it is still going. */
        const castOf = (objectId: number): {cast: IHudCast | null; casting: boolean} =>
        {
            const cast = casts.get(objectId) ?? null;
            const elapsed = cast ? Math.min(cast.durationMs, Date.now() - cast.start) / 1000 : 0;

            return {
                cast: cast && {icon: skillIcon(cast.skillId), name: skillName(cast.skillId), elapsed, duration: cast.durationMs / 1000},
                casting: cast !== null && elapsed < cast.durationMs / 1000
            };
        };

        // The target frame (its effects and what it casts) and the boss frame's cast line.
        const renderTarget = (): void =>
        {
            const hud = host.made.hud;
            const target = hud?.value.target ?? null;
            const boss = hud?.value.boss ?? null;
            const id = targetId();
            let casting = false;

            if(hud && target && id !== 0)
            {
                const own = castOf(id);

                hud.update({target: {...target, debuffs: icons(session.statusesOf(id)), cast: own.cast}});
                casting ||= own.casting;
            }

            if(hud && boss?.objectId !== undefined)
            {
                const own = castOf(boss.objectId);

                if(own.cast !== null || boss.cast) hud.update({boss: {...boss, cast: own.cast}});
                casting ||= own.casting;
            }

            if(casting && castTicker === null) castTicker = scope.interval(renderTarget, CAST_TICK_MS);
            else if(!casting && castTicker !== null)
            {
                castTicker.clear();
                castTicker = null;
            }
        };

        const openWindow = (): void =>
        {
            const windows = host.made.windowManager;

            if(windows) (window ??= new SkillsWindow(windows, bits(), session, () => host.made.character?.state?.classId ?? host.made.character?.played?.classId ?? '')).toggle();
        };

        // What each skill aims at and whether the global cooldown holds it (M1b §5.1), and what the
        // skills, statuses and classes draw (their vfx): the server's public definitions, once per
        // session; without them a ground skill is refused (invalid_target).
        const loadDefinitions = (): Promise<void> => definitions ??= (async () =>
        {
            try
            {
                const [skills, statuses, classes] = await Promise.all(['skill', 'status', 'class'].map(async kind =>
                {
                    const response = await fetch(`/webapi/api/public/content/definitions/${kind}`);

                    if(!response.ok) throw new Error(`${kind}: HTTP ${response.status}`);

                    return response.json() as Promise<unknown[]>;
                }));

                session.define(skills as ISkillDefinition[], statuses as IStatusDefinition[], classes as IClassDefinition[]);
                renderBar();
                window?.refresh();
            }
            catch (error)
            {
                definitions = null;
                log.warn('the skill definitions did not load — ground skills cannot aim', error);
            }
        })();

        const use = (slot: number): void =>
        {
            const skillId = barSkill(session.bar[slot] ?? '');

            if(skillId === null) return;

            // The slot shows it was taken, briefly (mock-up: « sélectionné »).
            const hudPlayer = host.made.hudPlayer;

            hudPlayer?.setSlot('skills', slot, {selected: true});
            setTimeout(() => hudPlayer?.setSlot('skills', slot, {selected: false}), SELECTED_MS);

            if(session.definition(skillId)?.target === 'ground')
            {
                host.made.hud?.update({alert: bits().text('vortex.skill.ground.pick', 'skill', skillName(skillId))});
                host.made.roomEngine?.pickRpgTile((x, y) =>
                {
                    host.made.hud?.update({alert: null});
                    session.cast(skillId, 0, x, y);
                });

                return;
            }

            // The server reads the target by the skill's mode (M1b §6.6): ignored for self and around the caster.
            session.cast(skillId, targetId());
        };

        on('skills', renderBar);
        on('cooldowns', renderBar);

        on('result', result =>
        {
            const text = bits();

            log.debug(`skill ${result.skillId} refused: ${result.code}`);
            system(text.text('vortex.skill.error', 'skill', skillName(result.skillId), 'reason',
                text.textOr(`vortex.skill.error.${result.code}`, text.text('vortex.skill.error.refused'))));
        });

        on('castStart', message =>
        {
            for(const cast of message.casts as readonly IRpgCastStart[])
            {
                casts.set(cast.casterObjectId, {skillId: cast.skillId, start: Date.now(), durationMs: cast.durationMs});
                host.made.combat?.cast(cast.casterObjectId, {durationMs: cast.durationMs, channel: cast.channel, skillId: cast.skillId});
            }

            renderTarget();
        });

        // A telegraphed cast (M1c): its cells on the floor until its RpgCastEnd, also in a room's entry burst.
        on('telegraphs', message =>
        {
            for(const telegraph of message.telegraphs)
            {
                const hostile = room?.userDataManager.getUserDataByIndex(telegraph.casterObjectId)?.type === UserDataType.PET;

                host.made.roomEngine?.showRpgTelegraph(telegraph.casterObjectId, telegraph.cells, telegraph.delayMs, hostile ? HOSTILE_TELEGRAPH : FRIENDLY_TELEGRAPH);
            }
        });

        on('castEnd', message =>
        {
            for(const end of message.ends)
            {
                casts.delete(end.casterObjectId);
                host.made.roomEngine?.clearRpgTelegraph(end.casterObjectId);
                host.made.combat?.cast(end.casterObjectId, null);
                // The player's own cast that did not go off says why (a walk cancels it on purpose: no line).
                if(end.casterObjectId === self() && (end.reason === 'interrupted' || end.reason === 'failed'))
                {
                    system(bits().text(`vortex.skill.cast.${end.reason}`, 'skill', skillName(end.skillId)));
                }
            }

            renderTarget();
        });

        // The player's effects panel: each icon with its time left, ticking while one has an end.
        const renderOwn = (): void =>
        {
            const now = Date.now();

            ownStatuses = ownStatuses.filter(status => status.end === null || status.end > now);
            const text = bits();

            host.made.hud?.update({
                buffs: ownStatuses.map(status => statusIcon(status.statusId)),
                buffTimes: ownStatuses.map(status => status.end === null ? '' : statusTime(status.end - now)),
                buffExpiring: ownStatuses.map(status => expiring(status.end === null ? null : status.end - now)),
                buffTips: ownStatuses.map(status => text.contentName(`${status.statusId}.name`, status.statusId)
                    + (status.end === null ? '' : `\n${text.text('vortex.hud.remaining', 'seconds', String(Math.ceil((status.end - now) / 1000)))}`))
            });

            const ticking = ownStatuses.some(status => status.end !== null);

            if(ticking && statusTicker === null) statusTicker = scope.interval(renderOwn, 1000);
            else if(!ticking && statusTicker !== null)
            {
                statusTicker.clear();
                statusTicker = null;
            }
        };

        on('statuses', message =>
        {
            const now = Date.now();

            for(const combatant of message.combatants)
            {
                if(combatant.objectId === self())
                {
                    ownStatuses = combatant.statuses.map(status => ({statusId: status.statusId, end: status.remainingMs < 0 ? null : now + status.remainingMs}));
                    renderOwn();
                }

                // A slow or a stun (M1c): its icon over the combatant, and its steps as long as the server's.
                const held = holdBack(combatant.statuses, id => session.statusDefinition(id));

                host.made.combat?.mark(combatant.objectId, held.statusId === null ? null : statusIcon(held.statusId));
                host.made.roomEngine?.setRpgStepTime(combatant.objectId, held.stepMs);
                if(held.statusId === null) heldBack.delete(combatant.objectId);
                else heldBack.add(combatant.objectId);
            }

            renderTarget();
        });

        on('events', message => host.made.combat?.report(message.outcomes, message.impacts));

        // A new target: the interaction feature drew its frame, this adds its effects and cast.
        scope.bind(host.made.interaction?.events)('target', renderTarget);
        scope.bind(host.made.hudPlayer?.events)('use', (bar, slot) =>
        {
            if(bar === 'skills') use(slot);
        });
        // The + menu's « Compétences ».
        scope.bind(host.made.hud?.events)('nav', name =>
        {
            if(name === 'nav_skills') openWindow();
        });

        scope.listen(globalThis, 'keydown', (event: KeyboardEvent) =>
        {
            if(room === null || typing(event) || event.ctrlKey || event.altKey || event.metaKey) return;

            // `code` first: the digits are shifted on an AZERTY keyboard; `key` for the numeric pad.
            const digit = Number(/^Digit([1-9])$/.exec(event.code)?.[1] ?? /^[1-9]$/.exec(event.key)?.[0] ?? 0);

            if(digit > 0 && digit <= SKILL_SLOTS) use(digit - 1);
            else if(event.key.toLowerCase() === 'k') openWindow();
            else if(event.key === 'Escape')
            {
                host.made.roomEngine?.pickRpgTile(null);
                host.made.hud?.update({alert: null});
                if(casts.has(self())) session.cancel();
            }
        });

        const sessionOn = scope.bind(host.made.roomSession?.sessionEvents);

        sessionOn(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) =>
        {
            room = event.session;
            void loadDefinitions();
        });
        sessionOn(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            casts.clear();
            session.forget();
            host.made.roomEngine?.clearRpgTelegraph(null);
            for(const objectId of heldBack) host.made.roomEngine?.setRpgStepTime(objectId, null);
            heldBack.clear();
            ownStatuses = [];
            statusTicker?.clear();
            statusTicker = null;
            window?.hide();
            host.made.roomEngine?.pickRpgTile(null);
            host.made.hud?.update({buffs: [], buffTimes: [], buffExpiring: [], buffTips: []});
        });

        // Dev hook: `__ambreia.skills.session`, `.open()`.
        scope.own(session).add(() =>
        {
            window?.dispose();
            window = null;
        });
        scope.hook('skills', {session, use, open: openWindow});

        return null;
    },
    afterAttach: async (_product, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) host.made.skills?.install(connection);
        else log.warn('no game connection to serve the skills on');
    }
};
