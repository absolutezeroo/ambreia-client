import {Logger} from '@ambreia/common/utils/Logger';
import type {IGameFeature} from '../GameFeature';
import {RpgCharacterSession} from './RpgCharacterSession';

const log = Logger.getLogger('habbo.features.character');

/**
 * The characters (F3a): the account's list, the classes, the played character's state — kept in
 * an RpgCharacterSession other features read through IRpgCharacterSession (host.made.character).
 * Its messages are served on the game connection once it exists (made by the communication
 * manager when it initialises, before any login).
 */
export const CharacterFeature: IGameFeature = {
    id: 'character',
    create: ({host}) =>
    {
        host.made.character = new RpgCharacterSession();

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
