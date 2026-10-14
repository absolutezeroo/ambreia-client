import {Logger} from '@ambreia/common/utils/Logger';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IRoomSession} from '../../session/IRoomSession';
import {WindowBits} from '../../ui/kit/WindowBits';
import type {IEngineHost} from '../EngineHost';
import type {IGameFeature} from '../GameFeature';
import {QuestDefinitions} from './definitions/QuestDefinitions';
import {DialogueWindow} from './dialogue/DialogueWindow';
import {QuestJournal} from './journal/QuestJournal';
import {LazySlot} from './LazySlot';
import {NpcMarkerLayer} from './markers/NpcMarkerLayer';
import {NpcMarkers} from './model/NpcMarkers';
import {QuestLogModel} from './model/QuestLogModel';
import {NpcClicks} from './npc/NpcClicks';
import {resultToast} from './results/resultToast';
import {RpgQuestSession} from './RpgQuestSession';
import {trackerLines} from './tracker/trackerLines';

const log = Logger.getLogger('habbo.features.quests');

/** The room's overlay layer, under the HUD (the combat overlay's). */
const LAYER = 1;

/** Each host's session, from create to afterAttach (a feature's product is the kernel's, not a session). */
const sessions = new WeakMap<IEngineHost, RpgQuestSession>();

/**
 * NPCs, dialogue and quests (M2a, docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md §4):
 * the session feeds the log and the markers; the dialogue, the markers, the tracker and the toasts
 * follow them; a click on an NPC talks to it. Wiring only: each piece is its own unit.
 */
export const QuestsFeature: IGameFeature = {
    id: 'quests',
    requires: ['roomEngine', 'hud', 'roomSession', 'input'],
    create: ({host, scope}) =>
    {
        const session = new RpgQuestSession();
        const questLog = new QuestLogModel();
        const markers = new NpcMarkers();
        const bits = (): WindowBits => new WindowBits(host.made.localization);
        // Level and rewards are the same for everyone: public content, loaded when the journal first opens.
        const definitions = new QuestDefinitions(async () =>
        {
            const response = await fetch('/webapi/api/public/content/definitions/quest');

            if(!response.ok) throw new Error(`HTTP ${response.status}`);

            return await response.json() as unknown[];
        });
        /** The room the player is in: its Users give an NPC's figure. */
        let room: IRoomSession | null = null;

        scope.own(session);
        sessions.set(host, session);
        host.made.quests = markers;

        const dialogue = new LazySlot(() => host.made.windowManager
            ? new DialogueWindow(host.made.windowManager, bits(), objectId => room?.userDataManager.getUserDataByIndex(objectId)?.figure ?? null, {
                choose: position => session.choose(position),
                closed: () => log.debug('the player closed the dialogue')
            })
            : null);

        scope.own(dialogue);

        const journal = new LazySlot(() => host.made.windowManager
            ? new QuestJournal(host.made.windowManager, bits(), questLog, questId => definitions.of(questId), questId => session.abandon(questId))
            : null);

        scope.own(journal);

        const openJournal = (): void =>
        {
            journal.get()?.toggle();
            void definitions.load().then(() => journal.peek()?.render());
            // The bottom bar's button of the journal shows it is open.
            host.made.hud?.update({navOpen: journal.peek()?.visible ? 'nav_quests' : null});
        };

        // The bottom bar's « Quêtes » and J, in a zone only.
        scope.bind(host.made.hud?.events)('nav', name =>
        {
            if(name === 'nav_quests') openJournal();
        });
        scope.add(host.made.input!.bind('quests', 'j', openJournal, {when: () => room !== null}));

        const layer = new NpcMarkerLayer(() =>
        {
            const windows = host.made.windowManager;
            const desktop = windows?.getDesktop(LAYER) as IWindowContainer | null;
            const window = windows?.buildWidgetLayout('vortex_npc_marker_xml', LAYER) as IWindowContainer | null;

            if(!window || !desktop)
            {
                window?.destroy();

                return null;
            }

            // Under the HUD's panels, which come later and stay above.
            desktop.addChildAt(window, 0);

            return window;
        }, () => host.made.roomEngine);

        scope.own(layer);

        const on = scope.bind(session.events);

        on('log', message => questLog.set(message.quests));
        on('npcs', message => markers.set(message.npcs));
        on('dialogue', message => dialogue.get()?.show(message));
        on('dialogueClose', () => dialogue.peek()?.hide());
        on('result', result =>
        {
            const toast = resultToast(bits(), result);

            if(toast) host.made.hud?.toast(toast);
        });

        scope.bind(markers.events)('changed', () => layer.set(markers.all));
        scope.bind(questLog.events)('changed', () =>
        {
            host.made.hud?.update({
                quests: trackerLines(questLog.entries, bits()),
                questAlert: questLog.active().some(entry => entry.state === 'ready')
            });
            journal.peek()?.render();
        });

        const clicks = new NpcClicks(objectId => markers.isNpc(objectId), objectId => session.talk(objectId));

        scope.bind(host.made.roomEngine?.events)(RoomEngineObjectEvent.REOE_SELECTED, (event: RoomEngineObjectEvent) => void clicks.selected(event.objectId, event.category));

        scope.add(host.made.input!.onEscape('quests', () =>
        {
            if(!dialogue.peek()?.visible) return false;

            dialogue.peek()?.hide();

            return true;
        }));

        const sessionOn = scope.bind(host.made.roomSession?.sessionEvents);

        sessionOn(RoomSessionEvent.RSE_STARTED, (event: RoomSessionEvent) => room = event.session);
        sessionOn(RoomSessionEvent.RSE_ENDED, () =>
        {
            room = null;
            dialogue.peek()?.hide();
            journal.peek()?.hide();
            markers.clear();
        });

        scope.hook('quests', {session, log: questLog, markers});

        return null;
    },
    afterAttach: async (_product, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) sessions.get(host)?.install(connection);
        else log.warn('no game connection to serve the quests on — NPCs will not talk');
    }
};
