import {WindowParser} from '@ambreia/ui/utils/WindowParser';
import {browserLanguage, readTexts, type OwnTexts} from '@ambreia/common/localization/Texts';
import {Logger} from '@ambreia/common/utils/Logger';
import type {EditorState} from '../state/EditorState';

const log = Logger.getLogger('glaze.ops.LocaliseOps');

/** Ambreia's own texts, read from the client's source like its layouts. */
const OWN_TEXTS = import.meta.glob('../../../vortex-client/src/locales/*/*.json', {import: 'default', eager: true}) as OwnTexts;

let localeMap: Map<string, string> | null = null;
let active = false;

/**
 * "Localise" — resolves `${…}` caption tokens against the real localization data.
 *
 * Glaze normally shows raw tokens; this reads the texts the way the client does (readTexts():
 * the bundle's Habbo texts, then the client's src/locales/), in the browser's language. It
 * swaps `WindowParser.localizationResolver` and reopens the layout so captions re-resolve;
 * toggling again reverts to raw tokens.
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
    localeMap ??= new Map(Object.entries(readTexts(state.runtime.xmlBundle, OWN_TEXTS, browserLanguage())));
    log.info(`Loaded ${localeMap.size} localization entries`);

    return localeMap;
}
