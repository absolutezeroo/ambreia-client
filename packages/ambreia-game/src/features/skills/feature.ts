import {Logger} from '@ambreia/common/utils/Logger';
import {platform} from '@ambreia/common/platform/Platform';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import {UserDataType} from '../../session/UserData';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../../ui/kit/WindowBits';
import {SKILL_SLOTS} from '../hud/IHud';
import {RpgSkillSession} from './RpgSkillSession';
import {CONTENT_ICON_IMAGES, FALLBACK_SKILL, FALLBACK_STATUS, iconOf} from './contentIcons';
import {DefinitionsLoader} from './play/DefinitionsLoader';
import {HeldBackMarks} from './play/HeldBackMarks';
import {OwnEffectsPanel} from './play/OwnEffectsPanel';
import {SkillBarHud} from './play/SkillBarHud';
import {SkillUse} from './play/SkillUse';
import {TargetCastLines} from './play/TargetCastLines';
import {Telegraphs} from './play/Telegraphs';
import {SKILL_WINDOW_IMAGES, SkillsWindow} from './SkillsWindow';

const log = Logger.getLogger('habbo.features.skills');

/**
 * The skills (M1b §10.3): the HUD's six skill slots and their cooldowns from RpgSkills and
 * RpgCooldowns; keys 1–6 (or a click on a slot) cast on the current target; a ground skill waits for
 * a floor click; K opens the skills window, where the bar is arranged. The casts, numbers and health
 * go through the combat session (its overlay draws them); the statuses show on the player's effects
 * panel and the target frame. A telegraphed cast (M1c) shows its cells on the floor; a slow or a stun
 * marks its combatant and slows its steps. This file only wires the parts (play/, window/).
 */
export const SkillsFeature: IGameFeature = {
    id: 'skills',
    images: [...CONTENT_ICON_IMAGES, ...SKILL_WINDOW_IMAGES],
    requires: ['roomEngine', 'interaction', 'hud', 'hudPlayer', 'roomSession', 'input', 'combat'],
    create: ({host, scope}) =>
    {
        const model = host.made.combat!.model;
        const session = new RpgSkillSession(model);
        const on = scope.bind(session.events);
        let room: IRoomSession | null = null;
        let window: SkillsWindow | null = null;

        host.made.skills = session;

        const bits = (): WindowBits => new WindowBits(host.made.localization);
        // The icons are the content's (M1d §6.1).
        const skillIcon = (skillId: string): string => iconOf(session.definition(skillId), FALLBACK_SKILL);
        const statusIcon = (statusId: string): string => iconOf(session.statusDefinition(statusId), FALLBACK_STATUS);
        const skillName = (skillId: string): string => bits().contentName(`${skillId}.name`, skillId);
        const self = (): number => room?.ownUserRoomId ?? -1;
        const targetId = (): number => host.made.interaction?.targetId ?? 0;
        const now = (): number => platform().now();
        const interval = (run: () => void, ms: number) => scope.interval(run, ms);

        const bar = new SkillBarHud(session, bits, skillIcon, slots => host.made.hudPlayer?.setSlots('skills', slots), now);
        const target = new TargetCastLines(() => host.made.hud, model, targetId, skillIcon, statusIcon, skillName, now, interval);
        const own = new OwnEffectsPanel(() => host.made.hud, model, self, statusIcon, bits, now, interval);
        const held = new HeldBackMarks(id => session.statusDefinition(id), statusIcon,
            (objectId, icon) => host.made.combat?.mark(objectId, icon),
            (objectId, stepMs) => host.made.roomEngine?.setRpgStepTime(objectId, stepMs));
        const telegraphs = new Telegraphs(
            (casterId, cells, delayMs, color) => host.made.roomEngine?.showRpgTelegraph(casterId, cells, delayMs, color),
            casterId => host.made.roomEngine?.clearRpgTelegraph(casterId),
            objectId => room?.userDataManager.getUserDataByIndex(objectId)?.type === UserDataType.PET);
        const skill = new SkillUse(session, () => host.made.hud, bits,
            (slot, values) => host.made.hudPlayer?.setSlot('skills', slot, values),
            picked => host.made.roomEngine?.pickRpgTile(picked),
            targetId, () => model.castOf(self()) !== null);
        const definitions = new DefinitionsLoader(async kind =>
        {
            const response = await fetch(`/webapi/api/public/content/definitions/${kind}`);

            if(!response.ok) throw new Error(`${kind}: HTTP ${response.status}`);

            return response.json() as Promise<unknown[]>;
        }, (skills, statuses, classes) =>
        {
            session.define(skills, statuses, classes);
            bar.render();
            window?.refresh();
        }, error => log.warn('the skill definitions did not load — ground skills cannot aim', error));

        const openWindow = (): void =>
        {
            const windows = host.made.windowManager;

            if(windows) (window ??= new SkillsWindow(windows, bits(), session, () => host.made.character?.state?.classId ?? host.made.character?.played?.classId ?? '')).toggle();
        };

        on('skills', () => bar.render());
        on('cooldowns', () => bar.render());
        // A refusal is the model's (its log line, its toast): here only the trace.
        on('result', result => log.debug(`skill ${result.skillId} refused: ${result.code}`));
        on('castStart', () => target.render());
        on('telegraphs', message => telegraphs.show(message.telegraphs));
        on('castEnd', message =>
        {
            telegraphs.end(message.ends);
            target.render();
        });
        on('statuses', message =>
        {
            for(const combatant of message.combatants)
            {
                if(combatant.objectId === self()) own.render();
                held.update(combatant.objectId, combatant.statuses);
            }

            target.render();
        });
        on('events', message => host.made.combat?.report(message.outcomes, message.impacts));

        // A new target: the interaction feature drew its frame, this adds its effects and cast.
        scope.bind(host.made.interaction?.events)('target', () => target.render());
        scope.bind(host.made.hudPlayer?.events)('use', (kind, slot) =>
        {
            if(kind === 'skills') skill.use(slot);
        });
        // The + menu's « Compétences ».
        scope.bind(host.made.hud?.events)('nav', name =>
        {
            if(name === 'nav_skills') openWindow();
        });

        // 1–6 cast the bar's slots, K opens the window, in the world only; Escape gives up a tile
        // pick or the player's own cast, and otherwise leaves the key to the target (interaction).
        const input = host.made.input!;
        const inWorld = (): boolean => room !== null;

        for(let slot = 0; slot < SKILL_SLOTS; slot++) scope.add(input.bind('skills', String(slot + 1), () => skill.use(slot), {when: inWorld}));
        scope.add(input.bind('skills', 'k', openWindow, {when: inWorld}));
        scope.add(input.onEscape('skills', () => skill.escape()));

        const sessionOn = scope.bind(host.made.roomSession?.sessionEvents);

        sessionOn(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) =>
        {
            room = event.session;
            void definitions.load();
        });
        sessionOn(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            telegraphs.clear();
            held.clear();
            own.clear();
            window?.hide();
            skill.stopPicking();
        });

        // Dev hook: `__ambreia.skills.session`, `.use(slot)`, `.open()`.
        scope.own(session).add(() =>
        {
            window?.dispose();
            window = null;
        });
        scope.hook('skills', {session, use: (slot: number) => skill.use(slot), open: openWindow});

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
