import {Logger} from '@ambreia/common/utils/Logger';
import type {IRpgCastStart} from '@ambreia/protocol/incoming/rpg/skills/RpgCastStartMessage';
import type {IRpgStatus} from '@ambreia/protocol/incoming/rpg/skills/RpgStatusesMessage';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../character/WindowBits';
import {chatClock} from '../hud/chatModel';
import {SKILL_SLOTS} from '../hud/PlayerHudState';
import {barSkill, RpgSkillSession, type ISkillDefinition, type IStatusDefinition} from './RpgSkillSession';
import {SKILL_IMAGES, skillIcon, statusIcon} from './skillArt';
import {SKILL_WINDOW_IMAGES, SkillsWindow} from './SkillsWindow';

const log = Logger.getLogger('habbo.features.skills');

/** How often the target frame's cast bar moves while its target casts. */
const CAST_TICK_MS = 100;

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
 * statuses show on the player's effects panel and the target frame; refusals are system lines.
 */
export const SkillsFeature: IGameFeature = {
    id: 'skills',
    images: [...SKILL_IMAGES, ...SKILL_WINDOW_IMAGES],
    create: ({host}) =>
    {
        const session = new RpgSkillSession();
        const casts = new Map<number, IRunningCast>();
        let room: IRoomSession | null = null;
        let window: SkillsWindow | null = null;
        let castTicker: ReturnType<typeof setInterval> | null = null;
        let definitions: Promise<void> | null = null;

        host.made.skills = session;

        const bits = (): WindowBits => new WindowBits(host.made.localization);
        const skillName = (skillId: string): string => bits().contentName(`${skillId}.name`, skillId);
        const system = (message: string): void => host.made.hud?.addChatLine({time: chatClock(Date.now() / 1000), channel: 'system', author: '', message});
        const self = (): number => room?.ownUserRoomId ?? -1;
        const targetId = (): number => host.made.interaction?.targetId ?? 0;
        const icons = (statuses: readonly IRpgStatus[]): string[] => statuses.map(status => statusIcon(status.statusId));

        // The HUD's skill slots: the bar's icons, each with the end of its cooldown.
        const renderBar = (): void => host.made.hudPlayer?.setSlots('skills', Array.from({length: SKILL_SLOTS}, (_, i) =>
        {
            const skillId = barSkill(session.bar[i] ?? '');

            return {icon: skillId === null ? null : skillIcon(skillId), cooldownEnd: skillId === null ? undefined : session.readyAt(skillId)};
        }));

        // The target frame: its effects and what it casts.
        const renderTarget = (): void =>
        {
            const hud = host.made.hud;
            const target = hud?.value.target ?? null;
            const id = targetId();

            if(!hud || !target || id === 0) return;

            const cast = casts.get(id) ?? null;
            const elapsed = cast ? Math.min(cast.durationMs, Date.now() - cast.start) / 1000 : 0;

            hud.update({target: {
                ...target,
                debuffs: icons(session.statusesOf(id)),
                cast: cast && {icon: skillIcon(cast.skillId), name: skillName(cast.skillId), elapsed, duration: cast.durationMs / 1000}
            }});

            const casting = cast !== null && elapsed < cast.durationMs / 1000;

            if(casting && castTicker === null) castTicker = setInterval(renderTarget, CAST_TICK_MS);
            else if(!casting && castTicker !== null)
            {
                clearInterval(castTicker);
                castTicker = null;
            }
        };

        const openWindow = (): void =>
        {
            const windows = host.made.windowManager;

            if(windows) (window ??= new SkillsWindow(windows, bits(), session, () => host.made.character?.state?.classId ?? host.made.character?.played?.classId ?? '')).toggle();
        };

        // What each skill aims at and whether the global cooldown holds it (M1b §5.1): the server's
        // public definitions, once per session; without them a ground skill is refused (invalid_target).
        const loadDefinitions = (): Promise<void> => definitions ??= (async () =>
        {
            try
            {
                const [skills, statuses] = await Promise.all(['skill', 'status'].map(async kind =>
                {
                    const response = await fetch(`/webapi/api/public/content/definitions/${kind}`);

                    if(!response.ok) throw new Error(`${kind}: HTTP ${response.status}`);

                    return response.json() as Promise<unknown[]>;
                }));

                session.define(skills as ISkillDefinition[], statuses as IStatusDefinition[]);
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

        session.events.on('skills', renderBar);
        session.events.on('cooldowns', renderBar);

        session.events.on('result', result =>
        {
            const text = bits();

            log.debug(`skill ${result.skillId} refused: ${result.code}`);
            system(text.text('vortex.skill.error', 'skill', skillName(result.skillId), 'reason',
                text.textOr(`vortex.skill.error.${result.code}`, text.text('vortex.skill.error.refused'))));
        });

        session.events.on('castStart', message =>
        {
            for(const cast of message.casts as readonly IRpgCastStart[])
            {
                casts.set(cast.casterObjectId, {skillId: cast.skillId, start: Date.now(), durationMs: cast.durationMs});
                host.made.combat?.cast(cast.casterObjectId, {durationMs: cast.durationMs, channel: cast.channel});
            }

            renderTarget();
        });

        session.events.on('castEnd', message =>
        {
            for(const end of message.ends)
            {
                casts.delete(end.casterObjectId);
                host.made.combat?.cast(end.casterObjectId, null);
                // The player's own cast that did not go off says why (a walk cancels it on purpose: no line).
                if(end.casterObjectId === self() && (end.reason === 'interrupted' || end.reason === 'failed'))
                {
                    system(bits().text(`vortex.skill.cast.${end.reason}`, 'skill', skillName(end.skillId)));
                }
            }

            renderTarget();
        });

        session.events.on('statuses', message =>
        {
            for(const combatant of message.combatants)
            {
                if(combatant.objectId === self()) host.made.hud?.update({buffs: icons(combatant.statuses)});
            }

            renderTarget();
        });

        session.events.on('events', message => host.made.combat?.report(message.outcomes));

        // A new target: the interaction feature drew its frame, this adds its effects and cast.
        host.made.interaction?.events.on('target', renderTarget);
        host.made.hudPlayer?.events.on('use', (bar, slot) =>
        {
            if(bar === 'skills') use(slot);
        });

        globalThis.addEventListener?.('keydown', (event: KeyboardEvent) =>
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

        const sessionEvents = host.made.roomSession?.sessionEvents;

        sessionEvents?.on(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) =>
        {
            room = event.session;
            void loadDefinitions();
        });
        sessionEvents?.on(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            casts.clear();
            session.forget();
            window?.hide();
            host.made.roomEngine?.pickRpgTile(null);
            host.made.hud?.update({buffs: []});
        });

        // Dev hook: `__ambreia.skills.session`, `.open()`.
        const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

        root.__ambreia = {...(root.__ambreia ?? {}), skills: {session, use, open: openWindow}};

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
