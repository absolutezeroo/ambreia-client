// habbo.com's editorial pages are not in its bundle: `habbo-web-pages` fetches them at runtime from
//
//     CONFIG.habboWebPagesUrl + <key> + "." + lang + ".html"
//     = https://images.habbo.com/habbo-web-pages/production/<key>.fr.html
//
// which is why "Les clés du jeu" and its five tabs looked empty next to the real site: the layout
// was ported, the CONTENT lives at that URL. This mirrors it into the repo so the hotel serves its
// own copy and does not depend on habbo.com being reachable.
//
//   node tools/fetch-web-pages.mjs
//
// writes src/webpages/<key>.html (the markup) and public/webpages/<file> (every image it
// references). One rewrite happens on the way in:
//
//   src="https://images.habbo.com/…"  ->  src="/webpages/…" so the page works with no route out
//
// habbo.com's own `href="/playing-habbo/x"` is left alone — the router is on the History API and
// those ARE its paths. It used to be rewritten to `#/…` for the hash router; lib/links.ts is what
// keeps such a link from reloading the document now.
//
// Re-run it to refresh; it is not part of `pnpm build`.
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const BASE = 'https://images.habbo.com/habbo-web-pages/production';
const LANG = 'fr';

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

for(const key of KEYS)
{
    const response = await download(`${BASE}/${key}.${LANG}.html`);
    let html = await response.text();

    const sources = [...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map((match) => match[1]);

    for(const source of sources)
    {
        html = html.split(source).join(await mirrorImage(source));
    }

    const target = join(ROOT, 'src', 'webpages', `${key}.html`);

    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, html, 'utf8');
    pages += 1;
}

process.stdout.write(`${pages} pages, ${seen.size} images -> src/webpages/ + public/webpages/\n`);
