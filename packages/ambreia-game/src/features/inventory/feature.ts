import {Logger} from '@ambreia/common/utils/Logger';
import {browserLanguage} from '@ambreia/common/localization/Texts';
import type {IRpgStatBlock} from '@ambreia/protocol/incoming/rpg/characters/IRpgStatBlock';
import type {RpgItemResultMessage} from '@ambreia/protocol/incoming/rpg/items/RpgItemResultMessage';
import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IGameFeature} from '../GameFeature';
import {WindowBits} from '../character/WindowBits';
import {CharacterWindow} from './CharacterWindow';
import {InventoryView} from './InventoryView';
import {ITEM_ICONS, parseTexts, STAT_ICONS} from './items';
import {RpgInventorySession} from './RpgInventorySession';

const log = Logger.getLogger('habbo.features.inventory');

/**
 * The bag and the equipment (Objets §17): the inventory window (I, or the top bar's Inventory
 * button) and the character window (C, its stats tab), both in the world only. Item names and
 * descriptions are the server's content texts, fetched the first time a window opens; the stats
 * are the played character's (F3a), read through host.made.character.
 */
export const InventoryFeature: IGameFeature = {
    id: 'inventory',
    images: [...ITEM_ICONS, ...STAT_ICONS],
    create: ({app, host}) =>
    {
        const session = new RpgInventorySession();
        let stats: IRpgStatBlock | null = host.made.character?.state?.stats ?? null;
        let inventory: InventoryView | null = null;
        let character: CharacterWindow | null = null;
        let inWorld = false;
        let texts: Promise<void> | null = null;

        host.made.inventory = session;

        const bits = (): WindowBits => new WindowBits(host.made.localization);
        const figure = (): string => host.made.character?.played?.figure ?? host.made.sessionData?.figure ?? '';
        const refresh = (): void =>
        {
            inventory?.renderStats();
            character?.renderStats();
        };

        // The texts the server's content has (item names, descriptions): none in the client's bundle.
        const loadTexts = (): Promise<void> => texts ??= (async () =>
        {
            for(const language of [...new Set([app.language ?? browserLanguage(), 'fr'])])
            {
                try
                {
                    const response = await fetch(`/webapi/api/public/content/texts/${language}`);

                    if(!response.ok) continue;

                    host.made.localization?.loadTexts(parseTexts(await response.text()));
                    refresh();

                    return;
                }
                catch (error)
                {
                    log.warn(`content texts (${language}) did not load — items show their ids`, error);

                    return;
                }
            }

            log.warn('no content texts for the client\'s language — items show their ids');
        })();

        const open = (which: 'inventory' | 'character'): void =>
        {
            const windows = host.made.windowManager;

            if(!inWorld || !windows) return;

            void loadTexts();
            if(which === 'inventory') (inventory ??= new InventoryView(windows, bits(), session, () => stats, figure)).toggle();
            else (character ??= new CharacterWindow(windows, bits(), session, () => stats, figure)).toggle();
        };

        const onStats = (message: {stats: IRpgStatBlock}): void =>
        {
            stats = message.stats;
            refresh();
        };

        host.made.character?.events.on('state', onStats);
        host.made.character?.events.on('stats', onStats);

        session.events.on('result', (result: RpgItemResultMessage) =>
        {
            if(result.code === 'ok') return;

            const windows = host.made.windowManager;
            const text = bits();

            log.debug(`item action ${result.action} refused: ${result.code}`);
            windows?.alert(text.text('vortex.hud.nav.inventory'), text.textOr(`vortex.inventory.error.${result.code}`, text.text('vortex.inventory.error.failed')), 0, dialog => dialog.dispose());
        });

        host.made.hud?.events.on('nav', name =>
        {
            if(name === 'nav_inventory') open('inventory');
        });

        // I and C, unless a text field has the keyboard (the window system's fields are DOM inputs).
        const onKey = (event: KeyboardEvent): void =>
        {
            const target = event.target as {tagName?: string} | null;

            if(event.ctrlKey || event.altKey || event.metaKey || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

            const key = event.key.toLowerCase();

            if(key === 'i') open('inventory');
            else if(key === 'c') open('character');
        };

        globalThis.addEventListener?.('keydown', onKey);

        const sessionEvents = host.made.roomSession?.sessionEvents;

        sessionEvents?.on(RoomSessionEvent.RSE_STARTED, () =>
        {
            inWorld = true;
            // Item names are in the chat's links too, not only in the windows.
            void loadTexts();
        });
        sessionEvents?.on(RoomSessionEvent.RSE_ENDED, () =>
        {
            inWorld = false;
            inventory?.hide();
            character?.hide();
        });

        // Dev hook: `__ambreia.inventory.open()`.
        const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

        root.__ambreia = {...(root.__ambreia ?? {}), inventory: {session, open: () => open('inventory'), character: () => open('character')}};

        return null;
    },
    afterAttach: async (_product, {host}) =>
    {
        // The communication manager builds its connection in initComponent(), a microtask after its attach.
        await Promise.resolve();

        const connection = host.made.communication?.connection ?? null;

        if(connection) host.made.inventory?.install(connection);
        else log.warn('no game connection to serve the items on — the bag will stay empty');
    }
};
