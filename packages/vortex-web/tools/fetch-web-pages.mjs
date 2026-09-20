// habbo.com's editorial pages are not in its bundle: `habbo-web-pages` fetches them at runtime from
//
//     CONFIG.habboWebPagesUrl + <key> + "." + lang + ".html"
//     = https://images.habbo.com/habbo-web-pages/production/<key>.fr.html
//
// which is why "Les clés du jeu" and its five tabs looked empty next to the real site: the layout
// was ported, the CONTENT lives at that URL. This mirrors it into the repo so the hotel serves its
// own copy and does not depend on habbo.com being reachable.
//
//   node tools/fetch-web-pages.mjs            # refresh the languages already in src/webpages/
//   node tools/fetch-web-pages.mjs en de      # add these
//
// writes src/webpages/<lang>/<key>.html (the markup) and public/webpages/<file> (every image it
// references). The language is a DIRECTORY rather than part of the filename so the site's
// `import.meta.glob` can key on it — components/WebPage.svelte picks the active one, with the
// site's fallback behind it.
//
// No default language is written down here: with no argument it refreshes whatever is already
// mirrored, the same rule `tools/fetch-l10n.mjs` follows, so this tool cannot quietly decide which
// languages the hotel publishes.
//
// THE HOTEL'S NAME IS SUBSTITUTED TOO — `\bHabbo`, the same rule and the same reason as
// `tools/fetch-l10n.mjs`, which has the long note. These pages say it 17 to 19 times each ("Habbo is
// an online vintage pixel-art style virtual community…"), and they never were substituted, so the
// site's editorial half named a different hotel from every other string on it.
//
// Unlike the translations, the HTML needs its attributes protected: `src` and `href` here point at
// mirrored files whose names carry the original spelling — `c_images_HabboWay_habboway_1a.png` —
// and renaming inside one breaks the image. So the substitution runs on the text between tags only.
//
// Two rewrites happen on the way in:
//
//   src="https://images.habbo.com/…"  ->  src="/webpages/…" so the page works with no route out
//
// habbo.com's own `href="/playing-habbo/x"` is left alone — the router is on the History API and
// those ARE its paths. It used to be rewritten to `#/…` for the hash router; lib/links.ts is what
// keeps such a link from reloading the document now.
//
// Re-run it to refresh; it is not part of `pnpm build`.
import {writeFileSync, mkdirSync, readdirSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const BASE = 'https://images.habbo.com/habbo-web-pages/production';
const PAGES_DIR = join(ROOT, 'src', 'webpages');
const HOTEL = process.env.VITE_HOTEL_NAME || 'Vortex';

/**
 * `\bHabbo` in the text between tags, and inside `alt` / `title` only — never in `src` or `href`,
 * whose values are mirrored filenames (`c_images_WhatIsHabbo_ill_15.png`) and paths
 * (`/playing-habbo/safety`) that must keep the original spelling or stop resolving.
 *
 * `alt` is not an exception for tidiness: it is the text a screen reader reads out, so leaving it
 * would have the page named one hotel out loud and another one on screen.
 */
function rename(html)
{
    const inText = (text) => text.replace(/\bHabbo/g, HOTEL);

    return html.replace(/<[^>]*>|[^<]+/g, (piece) =>
        (piece.startsWith('<')
            ? piece.replace(/\b(alt|title)="([^"]*)"/g, (whole, name, value) => `${name}="${inText(value)}"`)
            : inText(piece)));
}

const asked = process.argv.slice(2);
const LANGUAGES = asked.length
    ? asked
    : existsSync(PAGES_DIR)
        ? readdirSync(PAGES_DIR, {withFileTypes: true}).filter(e => e.isDirectory()).map(e => e.name)
        : [];

if(!LANGUAGES.length)
{
    process.stderr.write('nothing to fetch: src/webpages/ is empty and no language was named.\n');
    process.exit(1);
}

// Every key the ported templates ask for. The `common/box_*` ones are the small side panels; the
// `playing_habbo/*` ones are the five tabs' bodies.
const KEYS = [
    'playing_habbo/what_is_habbo',
    'playing_habbo/how_to_play',
    'playing_habbo/habbo_way',
    'playing_habbo/safety',
    'playing_habbo/help',
    'playing_habbo/box_helplines',
    'common/box_how_to_play',
    'common/box_habbo_way',
    'common/box_parents_guide',
    'common/box_learn_how_to_stay_safe',
    'common/box_need_help',
    'common/box_account_issues',
    'common/box_mall_info',
];

async function download(url)
{
    const response = await fetch(url);

    if(!response.ok)
    {
        throw new Error(`${response.status} ${url}`);
    }

    return response;
}

const seen = new Set();

async function mirrorImage(url)
{
    // Flattened so `HowToPlay/navigator_fr.png` and `safety/navigator_fr.png` cannot collide.
    const name = url.replace(/^https?:\/\/[^/]+\//, '').replace(/[^a-zA-Z0-9._-]+/g, '_');
    const target = join(ROOT, 'public', 'webpages', name);

    if(!seen.has(name))
    {
        seen.add(name);

        const response = await download(url);

        mkdirSync(dirname(target), {recursive: true});
        writeFileSync(target, Buffer.from(await response.arrayBuffer()));
    }

    return `/webpages/${name}`;
}

let pages = 0;

for(const lang of LANGUAGES)
{
    for(const key of KEYS)
    {
        let response;

        try
        {
            response = await download(`${BASE}/${key}.${lang}.html`);
        }
        catch(failure)
        {
            // habbo.com does not publish every page in every language. A missing one is named and
            // skipped, not fatal — WebPage.svelte falls back to the site's own language for it.
            process.stderr.write(`${lang}/${key}: ${failure.message}, skipped\n`);
            continue;
        }

        let html = await response.text();

        const sources = [...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map((match) => match[1]);

        for(const source of sources)
        {
            html = html.split(source).join(await mirrorImage(source));
        }

        const target = join(PAGES_DIR, lang, `${key}.html`);

        mkdirSync(dirname(target), {recursive: true});
        writeFileSync(target, rename(html), 'utf8');
        pages += 1;
    }
}

process.stdout.write(
    `${pages} pages in ${LANGUAGES.length} languages, ${seen.size} images`
    + ' -> src/webpages/<lang>/ + public/webpages/\n'
);
