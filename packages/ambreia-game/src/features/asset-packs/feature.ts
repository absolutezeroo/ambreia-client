import {z} from 'zod';
import {Logger} from '@ambreia/common/utils/Logger';
import {AssetPack} from '@ambreia/common/assets/pack/AssetPack';
import {AssetPacks} from '@ambreia/common/assets/pack/AssetPacks';
import type {IGameFeature} from '../GameFeature';

const log = Logger.getLogger('habbo.features.AssetPacks');

/** The configuration key holding the directory each family's .nitro files are fetched from. */
const DIRECTORIES = {
    clothing: 'flash.dynamic.avatar.download.url',
    furniture: 'flash.dynamic.download.url'
} as const;

/**
 * .ambreia packs (plan 2026-10-08-asset-packs): one file per family standing in for its thousands
 * of .nitro files, read a piece at a time. A pack URL may use the configuration's `${…}` variables
 * (`${url.prefix}/packs/furniture.ambreia`). Mounted once the configuration is loaded, before the
 * avatar renderer starts downloading; a piece the pack lacks, or a pack that cannot be read, still
 * loads from its .nitro.
 */
export const AssetPacksFeature: IGameFeature = {
    id: 'asset-packs',
    config: z.object({
        clothing: z.string().min(1).optional(),
        furniture: z.string().min(1).optional()
    }),
    create: ({config, host}) =>
    {
        const settings = config as {clothing?: string; furniture?: string};
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

                AssetPacks.mount(directory, new AssetPack(configuration.interpolate(packUrl)));
                log.info(`${family}: ${configuration.interpolate(packUrl)} stands in for ${directory}*.nitro`);
            }
        };

        if(configuration.isInitialized()) mount();
        else configuration.events.once('complete', mount);

        return null;
    }
};
