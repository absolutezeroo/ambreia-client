import {z} from 'zod';
import {Logger} from '@ambreia/common/utils/Logger';
import {AmbreiaDirectory, httpBytes} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import {decodeMasterKey, encryptedLayout} from '@ambreia/common/assets/pack/AmbreiaLayout';
import {AssetPacks} from '@ambreia/common/assets/pack/AssetPacks';
import type {IGameFeature} from '../GameFeature';

const log = Logger.getLogger('habbo.features.AssetPacks');

/** The configuration key holding the directory each family's .nitro files are fetched from. */
const DIRECTORIES = {
    clothing: 'flash.dynamic.avatar.download.url',
    furniture: 'flash.dynamic.download.url'
} as const;

/**
 * .ambreia directories (plan 2026-10-08-asset-packs): per family, one optimised `.ambreia` file per
 * piece standing in for its `.nitro`. A directory URL may use the configuration's `${…}` variables
 * (`${url.prefix}/ambreia/furniture/`). Mounted once the configuration is loaded, before the avatar
 * renderer starts downloading; a piece the directory lacks, or a directory that cannot be read,
 * still loads from its .nitro.
 */
export const AssetPacksFeature: IGameFeature = {
    id: 'asset-packs',
    config: z.object({
        clothing: z.string().min(1).optional(),
        furniture: z.string().min(1).optional(),
        /**
         * The master key of encrypted directories (base64url, 32 bytes). Provisional: config.json is
         * public, so this only keeps out a direct look at an URL and the guessing of names; the key
         * belongs in a server message after login (plan 2026-10-08-asset-packs, protection).
         */
        key: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'a 32-byte key in base64url (43 characters)').optional()
    }),
    create: ({config, host}) =>
    {
        const settings = config as {clothing?: string; furniture?: string; key?: string};
        const layout = settings.key ? encryptedLayout(decodeMasterKey(settings.key)) : null;
        const configuration = host.made.configuration;

        if(!configuration || (!settings.clothing && !settings.furniture)) return null;

        const mount = (): void =>
        {
            for(const family of ['clothing', 'furniture'] as const)
            {
                const packUrl = settings[family];

                if(!packUrl) continue;

                const directory = configuration.getProperty(DIRECTORIES[family]);

                if(!directory)
                {
                    log.warn(`${family} pack configured but ${DIRECTORIES[family]} is empty: not mounted`);
                    continue;
                }

                AssetPacks.mount(directory, new AmbreiaDirectory(configuration.interpolate(packUrl), httpBytes, layout));
                log.info(`${family}: ${configuration.interpolate(packUrl)} stands in for ${directory}*.nitro`);
            }
        };

        if(configuration.isInitialized()) mount();
        else configuration.events.once('complete', mount);

        return null;
    }
};
