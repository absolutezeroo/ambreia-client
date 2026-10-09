import {z} from 'zod';
import {Logger} from '@ambreia/common/utils/Logger';
import {ASSET_FAMILIES, openAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';
import type {IAssetPacksSettings} from '@ambreia/common/assets/pack/AssetDirectories';
import type {IGameFeature} from '../GameFeature';

const log = Logger.getLogger('habbo.features.AssetPacks');

/** A directory URL; it may use the configuration's `${…}` variables (`${url.prefix}/ambreia/room/`). */
const directory = z.string().min(1).optional();

/**
 * Every asset family as an .ambreia directory (spec 2026-10-09-ambreia-everything): clothing,
 * effects, room, pets, furniture. Opened once the configuration is loaded, before the avatar renderer
 * and the room engine read them from `made.assetDirectories`. There is no .nitro left to fall back
 * on: a family missing from config.json is an error at boot.
 */
export const AssetPacksFeature: IGameFeature = {
    id: 'asset-packs',
    config: z.object({
        clothing: directory,
        effects: directory,
        room: directory,
        pets: directory,
        furniture: directory,
        /** The hotel's catalogue icons: the client never reads them, the imager and tools do. */
        icons: directory,
        /**
         * The master key of encrypted directories (base64url, 32 bytes). Provisional: config.json is
         * public, so this only keeps out a direct look at an URL and the guessing of names; the key
         * belongs in a server message after login (plan 2026-10-08-asset-packs, protection).
         */
        key: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'a 32-byte key in base64url (43 characters)').optional()
    }),
    create: ({config, host}) =>
    {
        const settings = config as IAssetPacksSettings;
        const configuration = host.made.configuration;

        if(!configuration)
        {
            log.error('asset-packs: no configuration — no asset will load');

            return null;
        }

        const open = (): void =>
        {
            try
            {
                host.made.assetDirectories = openAssetDirectories(settings, text => configuration.interpolate(text));
            }
            catch (error)
            {
                log.error(`${(error as Error).message} in config.json: nothing from those families will display`);

                throw error;
            }

            log.info(`asset-packs: ${ASSET_FAMILIES.map(family => host.made.assetDirectories![family].url).join(', ')}`);
        };

        if(configuration.isInitialized()) open();
        else configuration.events.once('complete', open);

        return null;
    }
};
