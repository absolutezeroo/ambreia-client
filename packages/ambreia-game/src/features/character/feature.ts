import {Logger} from '@ambreia/common/utils/Logger';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IGameFeature} from '../GameFeature';
import {CharacterScreen} from './CharacterScreen';
import {RpgCharacterSession} from './RpgCharacterSession';
import {WindowBits} from '../../ui/kit/WindowBits';

const log = Logger.getLogger('habbo.features.character');

/**
 * The characters (F3a): the account's list, the classes, the played character's state — kept in
 * an RpgCharacterSession other features read through IRpgCharacterSession (host.made.character).
 * Its messages are served on the game connection once it exists (made by the communication
 * manager when it initialises, before any login). An account ticket opens the characters screen
 * (the server's list is its cue); the first room closes it for good — F3a has no way back.
 */
export const CharacterFeature: IGameFeature = {
    id: 'character',
    requires: ['roomSession'],
    create: ({host, scope}) =>
    {
        const session = new RpgCharacterSession();
        const on = scope.bind(session.events);
        let screen: CharacterScreen | null = null;
        let inWorld = false;

        host.made.character = session;

        on('characters', () =>
        {
            const windows = host.made.windowManager;

            if(inWorld || !windows || screen?.visible) return;

            screen ??= new CharacterScreen(windows, new WindowBits(host.made.localization), session, () => host.made.avatarRenderer?.getFigureData() ?? null);
            screen.show();
        });

        // Dev hook: the screen as it is (`__ambreia.characters.screen()`).
        scope.hook('characters', {session, screen: () => screen});

        scope.bind(host.made.roomSession?.sessionEvents)(RoomSessionEvent.RSE_STARTED, () =>
        {
            inWorld = true;
            screen?.dispose();
            screen = null;
        });

        scope.own(session).add(() =>
        {
            screen?.dispose();
            screen = null;
        });

        return null;
    },
    afterAttach: async (_product, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) host.made.character?.install(connection);
        else log.warn('no game connection to serve the characters on — the RPG state will not arrive');
    }
};
