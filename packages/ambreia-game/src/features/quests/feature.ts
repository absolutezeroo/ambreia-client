import {Logger} from '@ambreia/common/utils/Logger';
import type {IEngineHost} from '../EngineHost';
import type {IGameFeature} from '../GameFeature';
import {RpgQuestSession} from './RpgQuestSession';

const log = Logger.getLogger('habbo.features.quests');

/** Each host's session, from create to afterAttach (a feature's product is the kernel's, not a session). */
const sessions = new WeakMap<IEngineHost, RpgQuestSession>();

/**
 * NPCs, dialogue and quests (M2a, docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md §4):
 * the session, the models and the views, wired here and nowhere else.
 */
export const QuestsFeature: IGameFeature = {
    id: 'quests',
    create: ({host, scope}) =>
    {
        const session = new RpgQuestSession();

        scope.own(session);
        sessions.set(host, session);

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
