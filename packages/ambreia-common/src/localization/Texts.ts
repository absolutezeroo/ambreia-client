import type {AssetBundle} from '../assets/AssetBundle';
import {Logger} from '../utils/Logger';

const log = Logger.getLogger('common.localization.Texts');

/** The languages the client ships texts for. English is the fallback under any other. */
export const LANGUAGES = ['en', 'fr'] as const;

export type Language = typeof LANGUAGES[number];

/** Ambreia's own texts, as `import.meta.glob('…/locales/*\/*.json')` hands them: by path, one object per file. */
export type OwnTexts = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** The browser's language when the client has texts for it, otherwise English. */
export function browserLanguage(): Language
{
    const code = (globalThis.navigator?.language ?? '').slice(0, 2).toLowerCase();

    return LANGUAGES.find(language => language === code) ?? 'en';
}

/**
 * The texts for one language: the Habbo ones out of the bundle (`localizations/habbo.<lang>.json`),
 * then Ambreia's own (`src/locales/<lang>/*.json`). English goes underneath any other language,
 * so a key the language lacks reads in English rather than as its raw `${key}`.
 */
export function readTexts(bundle: AssetBundle, own: OwnTexts, language: Language): Record<string, string>
{
    const texts: Record<string, string> = {};

    for(const layer of language === 'en' ? ['en'] : ['en', language])
    {
        const habbo = bundle.getText(`localizations/habbo.${layer}.json`);

        if(habbo === null) log.warn(`No localizations/habbo.${layer}.json in the bundle: its Habbo texts are missing`);
        else Object.assign(texts, JSON.parse(habbo) as Record<string, string>);

        for(const [path, file] of Object.entries(own))
        {
            if(path.includes(`/${layer}/`)) Object.assign(texts, file);
        }
    }

    return texts;
}
