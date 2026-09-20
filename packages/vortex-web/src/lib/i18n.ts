// habbo.com's own strings, one file per language, fetched by `tools/fetch-l10n.mjs` from
// `images.habbo.com/habbo-web-l10n/<lang>.json` — the files its index shell loads. They settle every
// label on the site: the navigation is "Habbo Shopping" and "Les clés du jeu", not "Boutique" and
// "Jouer"; the community's rooms tab is "Apparts". Every one of those was invented here before, and
// inventing them is exactly what a copy is not.
//
// The templates in sources/templates/ name their key in a `translate="…"` attribute, so a label is
// never a guess in ANY language: find the element, read the key, and all nine files answer it.
//
// NO LANGUAGE IS NAMED IN THIS FILE. The set is whatever `src/locales/` holds — the glob below is
// the only list there is — and a new language is a file dropped in that directory plus, if it
// should be the fallback, `VITE_SITE_LOCALE`. This used to `import fr from './fr.json'`, which made
// French the site rather than a language of it.
//
// Each file becomes its own chunk, so a visitor downloads ONE of them (~50 KB gzipped) and never
// the other eight. Pruning a file to the keys in use would need a build step and would break the
// next person who adds a `t()` call for a key that was pruned away.
const LOCALES = import.meta.glob('../locales/*.json', {import: 'default'}) as
    Record<string, () => Promise<Record<string, string>>>;

// The port's OWN strings, merged over habbo.com's. `src/locales/site/<lang>.json`, and every key in
// them starts `SITE_`, so what this hotel wrote and what habbo.com wrote never blur together.
//
// They exist because a few screens have no habbo.com counterpart to take a key from — the order
// page above all, which habbo.com does not have at all (its shop is server-rendered and the
// provider returns to a page the server already updated). Those strings used to be French typed
// into the markup, which is the one place no language can reach.
//
// `../locales/*.json` does not match this directory: `*` does not cross a `/`.
//
// Not every language has an overlay. One that does not falls through to the site's fallback for
// these keys only — its habbo.com chrome is still its own. Adding a language here is dropping a
// file in, exactly like the fetched ones.
const SITE = import.meta.glob('../locales/site/*.json', {import: 'default'}) as
    Record<string, () => Promise<Record<string, string>>>;

function codeOf(path: string): string
{
    return path.replace(/^.*\//, '').replace(/\.json$/, '');
}

/** The languages this build ships, read off the directory — never a list written out in code. */
export const LOCALE_CODES: string[] = Object.keys(LOCALES).map(codeOf).sort();

/** Where an explicit choice is remembered, and the query parameter that sets one. */
const STORAGE_KEY = 'vortex.locale';
const QUERY_KEY = 'lang';

let active = '';
let strings: Record<string, string> = {};
let fallback: Record<string, string> = {};

/** The language in use. Empty until `initLocale()` has run. */
export function locale(): string
{
    return active;
}

/**
 * The tag to hand `Intl`. Every formatter on the site took `'fr-FR'`, which printed French numbers
 * and French dates whatever language the page was in — "1 250,00 €" where English wants
 * "€1,250.00", "12 mai 2025" where it wants "12 May 2025".
 *
 * The active code is a bare `fr`, `de`, `br`; `Intl` resolves a bare tag to its own default region
 * and falls back to the runtime's for one it does not know, so nothing here validates it. `en`
 * covers the moment before `initLocale()` has run, which only a module-level formatter can reach.
 */
export function intlLocale(): string
{
    return active || 'en';
}

/**
 * The long date the site prints in three places — an article's dateline, the news list, a profile's
 * join date. All three built their own `toLocaleDateString('fr-FR', …)` with the same options, so
 * this is one copy instead of three, in the language the page is in.
 */
export function formatLongDate(iso: string): string
{
    return new Date(iso).toLocaleDateString(intlLocale(), {day: 'numeric', month: 'long', year: 'numeric'});
}

/**
 * The site's fallback language: `VITE_SITE_LOCALE` when the deployment sets one, otherwise the
 * first file in `src/locales/`. Deliberately NOT a literal — which language a hotel falls back to
 * is a deployment's decision, not this file's.
 *
 * It is separate from the hotel's CONTENT languages (`web_languages` on the server, behind
 * `/api/public/languages`). Those govern which language an ARTICLE exists in, and the server
 * resolves a request against them itself — see `api.getArticles`, which sends the active code and
 * lets the server answer in the nearest it publishes.
 */
function siteDefault(): string
{
    const configured = String(import.meta.env.VITE_SITE_LOCALE ?? '');

    return LOCALE_CODES.includes(configured) ? configured : (LOCALE_CODES[0] ?? '');
}

/** `fr-CA` and `FR` both answer the `fr` file; anything with no file answers nothing. */
function match(tag: string): string
{
    const wanted = tag.toLowerCase().split('-')[0];

    return LOCALE_CODES.find(code => code === wanted) ?? '';
}

function stored(): string
{
    try
    {
        return window.localStorage.getItem(STORAGE_KEY) ?? '';
    }
    catch
    {
        // Private mode, blocked site data. A visitor who cannot be remembered still gets a site.
        return '';
    }
}

/**
 * Which language to render in, in order of how deliberate the signal is:
 *
 *   1. `?lang=` on the URL — someone said so out loud, and it is remembered.
 *   2. what was remembered from an earlier visit.
 *   3. the browser's own preferences, in the order it ranks them.
 *   4. the site's fallback.
 *
 * habbo.com has no language switcher anywhere — each language is its own domain, and the choice is
 * made by which one you opened. There is one domain here, so the browser is the best signal there
 * is, and none of this names a language.
 */
function resolve(): string
{
    const asked = new URLSearchParams(window.location.search).get(QUERY_KEY);
    const explicit = asked ? match(asked) : '';

    if(explicit)
    {
        try
        {
            window.localStorage.setItem(STORAGE_KEY, explicit);
        }
        catch
        {
            // Not remembered, still applied for this page.
        }

        return explicit;
    }

    const remembered = match(stored());

    if(remembered)
    {
        return remembered;
    }

    for(const tag of window.navigator.languages ?? [window.navigator.language])
    {
        const found = match(tag);

        if(found)
        {
            return found;
        }
    }

    return siteDefault();
}

/**
 * Loads the language before the app mounts, so the first paint is already in it — `main.ts` awaits
 * this. `t()` stays synchronous, which is what lets fifty components call it straight from their
 * markup.
 *
 * The fallback file is loaded alongside when it is a different one, because the nine files do not
 * carry the same keys: habbo.com's `en.json` has 1,317 where `fr.json` has 1,692. Without it a key
 * present in one language and absent in another would print its own name at the visitor.
 */
export async function initLocale(): Promise<void>
{
    active = resolve();

    const load = async (code: string): Promise<Record<string, string>> =>
    {
        const habbo = LOCALES[`../locales/${code}.json`];
        const site = SITE[`../locales/site/${code}.json`];

        // The overlay wins: where both name a key, this hotel's wording is the one that ships.
        return {...(habbo ? await habbo() : {}), ...(site ? await site() : {})};
    };

    const back = siteDefault();

    [strings, fallback] = active === back
        ? [await load(active), {}]
        : await Promise.all([load(active), load(back)]);

    document.documentElement.lang = active;
}

/** What an interpolated key is given: `t('PROFILE_JOINED', {date: '12 mai 2025'})`. */
export type ITranslationValues = Record<string, string | number>;

/**
 * The translations themselves are TRUSTED: `fr.json` is compiled into the bundle, nobody can write
 * to it at runtime, and several of its strings carry markup on purpose — `REGISTRATION_SAFETY`
 * holds the link to the safety page inside the sentence, `NOT_FOUND_PAGE_TEXT` holds the link home.
 * The handful of `{@html}` sites in the port render exactly those, with no values, and that is safe
 * by construction.
 *
 * The INTERPOLATED VALUES are a different thing. They are names, counts and dates the caller
 * supplies, and one of them reaching an `{@html}` sink unescaped would be markup injection through
 * the front door. It has not happened — every value passed anywhere in the port today is a number
 * or a key of our own — but `notifier.success(key, values)` renders through `{@html}` and openly
 * takes values, so the door is standing open.
 *
 * `tHtml` is that door, closed: same interpolation, values escaped. `t` is unchanged, because its
 * output goes through Svelte's own escaping and escaping twice would print `&amp;` at the visitor.
 */
function escapeHtml(value: string): string
{
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * For a translation whose result is rendered with `{@html}`. The template's own markup survives;
 * anything the CALLER interpolates into it does not.
 */
export function tHtml(key: string, values?: ITranslationValues): string
{
    if(!values)
    {
        return t(key);
    }

    const safe: ITranslationValues = {};

    for(const [name, value] of Object.entries(values))
    {
        safe[name] = escapeHtml(String(value));
    }

    return t(key, safe);
}

/**
 * For a translation that links to the HOTEL'S OWN SITE from inside the sentence.
 *
 * 22 of fr.json's keys carry an `<a href="https://www.habbo.fr/…">` — the policies checkbox, the
 * wallet's terms, every ban notice, the shop's small print. They are habbo.fr's absolute URLs
 * because on habbo.com that IS the site; here it is another hotel, and following one sends the
 * player away mid-registration. So the origin is dropped: `https://www.habbo.fr/playing-habbo/
 * terms-of-service` becomes `/playing-habbo/terms-of-service`, which this site routes and
 * `lib/links.ts` keeps inside the SPA.
 *
 * `target="_blank"` goes with it, for the same reason and one more: `links.ts` deliberately lets a
 * targeted anchor through to the browser, so leaving it would reload the document and tear down an
 * open hotel session.
 *
 * Only the `www.` host is rewritten, and its top-level domain is not named: each language's file
 * carries its own (`www.habbo.fr` in French, `www.habbo.de` in German, `www.habbo.com.br`), so a
 * two-domain list would have worked in two languages and silently sent the other seven off-site.
 * `help.habbo.*` and `images.habbo.com` are NOT this site — there is no support desk here to route
 * to — and stay external.
 */
export function tSite(key: string, values?: ITranslationValues): string
{
    return tHtml(key, values).replace(
        /href="https?:\/\/www\.habbo\.[a-z.]+(\/[^"]*)"(\s+target="_blank")?/g,
        'href="$1"'
    );
}

export function t(key: string, values?: ITranslationValues): string
{
    // A key-presence test rather than a comparison against the value: the styleguide forbids
    // `| undefined` in an annotation, and an absent key is a question about the MAP, not about what
    // it holds — the same distinction as the port's own `hasString()` versus `getString()`.
    //
    // The active language first, then the site's fallback for a key that language happens not to
    // carry, then the key itself: a missing key is a porting mistake, not a runtime condition, so
    // it shows rather than leaving an empty space.
    const source =
        Object.hasOwn(strings, key) ? strings
            : Object.hasOwn(fallback, key) ? fallback
                : null;

    if(!source)
    {
        return key;
    }

    const template = source[key];

    if(!values)
    {
        return template;
    }

    // habbo.com interpolates with `{{name}}` (angular-translate), e.g.
    // PROFILE_JOINED = "A rejoint Habbo le {{date}}".
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (whole, name) =>
        (values[name] !== undefined ? String(values[name]) : whole));
}
