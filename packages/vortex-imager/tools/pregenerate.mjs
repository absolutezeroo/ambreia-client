#!/usr/bin/env node
/**
 * Bakes the imager's output to static PNGs, the way a real hotel ships `hof_furni`.
 *
 *   node tools/pregenerate.mjs --furni --avatars --badges
 *
 * It renders nothing itself: it asks the running imager over HTTP, which is the only way the
 * baked bytes are guaranteed to be the bytes the live route would have produced — every
 * parameter default, every cache tier and the PNG encoder are the service's, not a second
 * implementation of them here. `pnpm dev` starts that service, so it is already up.
 *
 * The file names come from `imagingKey()` in `vite-plugin-imager.mjs`, which is also what serves
 * them, so the two cannot disagree about where an image lives.
 *
 * What goes stale, and when:
 *   - furni: on an asset build. Delete the directory and re-run.
 *   - badges: when a guild edits its badge. Cheap enough to re-run whenever.
 *   - avatars: the moment a player changes clothes. A stale file is served until the next run —
 *     that is the trade for serving it with nothing running. Re-run it, or delete that one file.
 */
import {createPool} from 'mysql2/promise';
import {mkdir, stat, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {imagingKey, imagingRoot} from './vite-plugin-imager.mjs';

// `imagingRoot()` loads the package's .env, so everything below sees IMAGER_* already.
const OUT = imagingRoot();

const BASE = `http://localhost:${process.env.IMAGER_PORT ?? 8081}`;

/** Renders in flight. The imager is one process and each image is a few milliseconds of it. */
const CONCURRENCY = 8;

const args = process.argv.slice(2);
const force = args.includes('--force');
const wanted = new Set(args.filter((a) => !a.startsWith('--force')).map((a) => a.replace(/^--/, '')));

if(wanted.size === 0)
{
    console.error('usage: node tools/pregenerate.mjs [--avatars] [--badges] [--furni] [--force]');
    process.exit(1);
}

const database = process.env.IMAGER_DB_DATABASE
    ? createPool({
        host: process.env.IMAGER_DB_HOST ?? '127.0.0.1',
        port: Number(process.env.IMAGER_DB_PORT ?? 3306),
        user: process.env.IMAGER_DB_USER ?? 'vortex_imager',
        password: process.env.IMAGER_DB_PASSWORD ?? '',
        database: process.env.IMAGER_DB_DATABASE,
        connectionLimit: 2
    })
    : null;

console.log(`Baking into ${OUT}`);

if(wanted.has('furni')) await bake('furni', await furnitureUrls());
if(wanted.has('badges')) await bake('badges', await badgeUrls());
if(wanted.has('avatars')) await bake('avatars', await avatarUrls());

await database?.end();

/**
 * Every furni in furnidata, floor and wall, in the direction and size the path form defaults to.
 *
 * Classnames carrying a `*` are colour variants of one asset (`chair_norja*2`), and `*` is not a
 * character Windows will put in a file name. They are dropped rather than escaped: the imager
 * renders them live through the fallback, and inventing an escaping scheme means inventing it
 * twice — here and in the middleware that has to find the file again.
 */
async function furnitureUrls()
{
    const base = (process.env.IMAGER_ASSETS_BASE_URL ?? 'http://vortex-assets.local').replace(/\/+$/, '');
    const data = await (await fetch(`${base}/gamedata/furnidata_json/1`)).json();

    const names = [
        ...(data.roomitemtypes?.furnitype ?? []).map((item) => item.classname),
        ...(data.wallitemtypes?.furnitype ?? []).map((item) => item.classname)
    ];

    return [...new Set(names)]
        .filter((name) => typeof name === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name))
        .map((name) => `/habbo-imaging/furniture/${name}.png`);
}

/** One per guild badge in use. `DISTINCT`: a hotel's guilds share a lot of badge codes. */
async function badgeUrls()
{
    if(database === null) return [];

    const [rows] = await database.query(
        'SELECT DISTINCT `badge` FROM `groups` WHERE `deleted_at` IS NULL AND `badge` <> \'\''
    );

    return rows
        .map((row) => String(row.badge))
        .filter((code) => /^[A-Za-z0-9]+$/.test(code))
        .map((code) => `/habbo-imaging/badge/${code}.png`);
}

/**
 * The five shapes this hotel actually asks for, per player.
 *
 * Not a sweep of every direction and size: an unrequested image is a file nobody reads. These are
 * `AvatarView.ts` on the login screen (bare `?user=`), and `avatarUrl()` in the CMS — its default
 * call and its `well` call, each of which the site makes by name for another player's avatar and
 * by figure for one it already has. Baking both keys costs one extra render of the same pixels.
 */
async function avatarUrls()
{
    if(database === null) return [];

    const [rows] = await database.query('SELECT `name`, `figure` FROM `players`');

    const urls = [];

    for(const row of rows)
    {
        const name = String(row.name);
        const figure = String(row.figure ?? '');

        if(!/^[A-Za-z0-9._:-]+$/.test(name)) continue;

        // The login screen's saved-avatar row: user and nothing else.
        urls.push(`/habbo-imaging/avatarimage?user=${encodeURIComponent(name)}`);

        for(const who of figure === '' ? [`user=${encodeURIComponent(name)}`] : [`user=${encodeURIComponent(name)}`, `figure=${encodeURIComponent(figure)}`])
        {
            urls.push(`/habbo-imaging/avatarimage?size=m&direction=2&head_direction=2&${who}`);
            urls.push(`/habbo-imaging/avatarimage?size=l&direction=2&head_direction=2&${who}&headonly=1`);
        }
    }

    return urls;
}

/**
 * Fetches every URL and writes it under its key, `CONCURRENCY` at a time.
 *
 * A 404 is not a failure worth stopping for — furnidata lists classes whose assets were never
 * shipped, and the imager answers 404 for those exactly as it should. They are counted and
 * reported, because a run where everything 404s is a broken run and the count is how you see it.
 */
async function bake(label, urls)
{
    const started = Date.now();
    const counters = {written: 0, skipped: 0, missing: 0, failed: 0};

    let cursor = 0;

    const worker = async () =>
    {
        while(cursor < urls.length)
        {
            const url = urls[cursor++];
            const parsed = new URL(url, BASE);
            const key = imagingKey(parsed.pathname.replace(/^\/habbo-imaging/, ''), parsed.searchParams);

            if(key === null)
            {
                counters.failed++;

                continue;
            }

            const file = join(OUT, key);

            // A re-run should cost nothing for what is already on disk: the images are keyed by
            // everything that decides their pixels, so a file that exists is the right file until
            // the assets are rebuilt (delete the directory) or a player changes look (`--force`).
            if(!force && await exists(file))
            {
                counters.skipped++;

                continue;
            }

            try
            {
                const response = await fetch(new URL(url, BASE));

                if(response.status === 404)
                {
                    counters.missing++;

                    await response.arrayBuffer();

                    continue;
                }

                if(!response.ok) throw new Error(`HTTP ${response.status}`);

                await mkdir(dirname(file), {recursive: true});
                await writeFile(file, Buffer.from(await response.arrayBuffer()));

                counters.written++;
            }
            catch (error)
            {
                counters.failed++;

                if(counters.failed <= 5) console.warn(`  ${url} — ${error.message}`);
            }

            if((counters.written + counters.missing + counters.skipped) % 2000 === 0) report(label, counters, urls.length, started);
        }
    };

    await Promise.all(Array.from({length: CONCURRENCY}, worker));

    report(label, counters, urls.length, started);
}

function exists(file)
{
    return stat(file).then(() => true).catch(() => false);
}

function report(label, counters, total, started)
{
    const seconds = (Date.now() - started) / 1000;

    console.log(
        `${label}: ${counters.written}/${total} written, ${counters.skipped} already there,`
        + ` ${counters.missing} not in this build, ${counters.failed} failed — ${seconds.toFixed(1)}s`
    );
}
