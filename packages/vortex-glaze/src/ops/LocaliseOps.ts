import {WindowParser} from '@ambreia/ui/utils/WindowParser';
import {GameDataResources} from '@core/localization';
import {Logger} from '@ambreia/common/utils/Logger';
import type {EditorState} from '../state/EditorState';

const log = Logger.getLogger('glaze.ops.LocaliseOps');

let localeMap: Map<string, string> | null = null;
let active = false;

/**
 * "Localise" — resolves `${…}` caption tokens against the real localization data.
 *
 * Glaze normally shows raw tokens; this fetches the localization exactly as the
 * client does — the bundled `localization_configuration_txt.txt` gives the hashes
 * index URL (`…/gamedata/hashes.json`), whose `external_texts` entry names the
 * content-hashed text file (key=value). Requires the asset server reachable. On
 * success it swaps `WindowParser.localizationResolver` and reopens the layout so
 * captions re-resolve; toggling again reverts to raw tokens.
 */
export async function toggleLocalisation(state: EditorState): Promise<boolean>
{
    if(active)
    {
        WindowParser.localizationResolver = (key: string): string => key;
        active = false;
    }
    else
    {
        const map = await loadLocalisation(state);

        if(!map)
        {
            return false;
        }

        WindowParser.localizationResolver = (key: string): string => map.get(key) ?? key;
        active = true;
    }

    const name = state.currentLayoutName;

    if(name)
    {
        state.openLayout(name);
    }

    return active;
}

export async function loadLocalisation(state: EditorState): Promise<Map<string, string> | null>
{
    if(localeMap)
    {
        return localeMap;
    }

    const hashesUrl = readHashesUrl(state);

    if(!hashesUrl)
    {
        log.warn('No localization URL in localization_configuration');

        return null;
    }

    try
    {
        const hashesText = await (await fetch(hashesUrl)).text();
        const resources = GameDataResources.parse(hashesText);
        const textsUrl = `${resources.externalTextsUrl}/${resources.externalTextsHash}`;
        const text = await (await fetch(textsUrl)).text();
        const map = new Map<string, string>();

        for(const line of text.split('\n'))
        {
            if(!line || line.startsWith('#')) continue;

            const eq = line.indexOf('=');

            if(eq > 0)
            {
                map.set(line.slice(0, eq).trim(), line.slice(eq + 1).replace(/\r$/, ''));
            }
        }

        localeMap = map;
        log.info(`Loaded ${map.size} localization entries`);

        return map;
    }
    catch (error)
    {
        log.warn(`Localise failed (asset server reachable?): ${String(error)}`);

        return null;
    }
}

function readHashesUrl(state: EditorState): string | null
{
    const cfg = state.runtime.xmlBundle.getText('configurations/localization_configuration_txt.txt');
    const match = cfg ? cfg.match(/localization\.1\.url\s*=\s*(\S+)/) : null;

    return match ? match[1].trim() : null;
}
