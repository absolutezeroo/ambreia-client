#!/usr/bin/env node
// One command that takes a fresh clone to a running client: `node install.mjs`.
//
// A clone of this repository cannot run on its own. Almost everything the client draws is
// derived from a Habbo Flash dump that is not here and never will be - the window layouts, the
// skins, the sounds, the avatar configurations, every PNG - and on top of that the client needs
// a configuration file naming where its hotel lives. Getting from `git clone` to a room used to
// be a list of commands in a README, which is a list of ways to get it wrong.
//
// This asks nothing. It finds the assets, installs dependencies, writes a working configuration
// if there is not one already, then checks the three services and tells you exactly which one is
// not answering. Re-running it is safe and cheap: every step is idempotent and reports what was
// already current.
//
// The assets come from one of two places, and it prefers whichever it finds:
//
//   a Flash dump under sources/     every asset is generated from it, which is the only way to
//                                   get a NEW one and the only way to refresh a stale one
//   vortex-client-assets.zip        the same tree, already generated, and COMMITTED - the one
//                                   piece of dump-derived content this repository carries, so
//                                   that a clone can draw at all. Re-pack it with --pack after
//                                   regenerating against a new dump, and commit the result.
//
// Note that this covers the client's OWN assets only - the ones derived from the Flash dump. The
// furni, avatar figures and gamedata served at vortex-assets.local are a separate, much larger
// tree in Nitro's formats, and nothing here packages or generates it.
//
// Flags:
//   --pack [file]   write the generated assets to a zip and stop (default vortex-client-assets.zip)
//   --assets <zip>  extract this archive instead of looking for the default one
//   --dump <path>   use this dump instead of auto-detecting one under sources/
//   --skip-install  do not run `pnpm install`
//   --skip-checks   do not probe the asset host / emulator / web API at the end
import {existsSync, readdirSync, statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createConnection} from 'node:net';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {extractZip, listFiles, writeZip} from './packages/vortex-client/tools/lib/zip.mjs';

const repoRoot = dirname(fileURLToPath(import.meta.url));

const CLIENT = join(repoRoot, 'packages', 'vortex-client');
const TOOLS = join(CLIENT, 'tools');
const ASSETS = join(CLIENT, 'src', 'assets');
const CONFIGURATIONS = join(ASSETS, 'configurations');

// What --pack puts in the archive, and what --assets is expected to contain: exactly the
// directories the importers generate. `webfonts/` is deliberately absent - git carries those
// nine files, so packaging them would ship a second copy that could drift from the tracked one.
const PACKED_DIRS = ['configurations', 'images', 'localizations', 'sounds', 'window-layouts', 'window-skins'];

const CONFIG_JSON = join(repoRoot, 'packages', 'vortex-client', 'public', 'config.json');

const DEFAULT_ARCHIVE = join(repoRoot, 'vortex-client-assets.zip');

// The services the client talks to, and the one URL on each that proves it is really there.
// `/gamedata/hashes.json` is not an arbitrary choice: it is the first thing the client fetches
// after reading its own configuration, and everything else - furnidata, productdata, figuredata,
// the external variables - is a path found inside it.
const ASSET_HOST = 'http://vortex-assets.local';
const ASSET_HOST_PROBE = `${ASSET_HOST}/gamedata/hashes.json`;
const WEB_API_PROBE = 'http://localhost:8080/api/user/avatars';
const GAME_SOCKET = {host: '127.0.0.1', port: 40001};

// Minimum versions. pnpm is not optional: this is a pnpm workspace and npm/yarn cannot resolve
// the `workspace:` protocol the packages depend on each other by.
const MIN_NODE_MAJOR = 22;
const MIN_PNPM_MAJOR = 11;

const args = parseArgs();

let failed = false;

function parseArgs()
{
    const argv = process.argv.slice(2);
    const value = flag =>
    {
        const index = argv.indexOf(flag);

        return index !== -1 && argv[index + 1] && !argv[index + 1].startsWith('--') ? resolve(argv[index + 1]) : null;
    };

    return {
        pack: argv.includes('--pack'),
        packTarget: value('--pack') ?? DEFAULT_ARCHIVE,
        archive: value('--assets'),
        dump: value('--dump'),
        skipInstall: argv.includes('--skip-install'),
        skipChecks: argv.includes('--skip-checks')
    };
}

function step(title)
{
    console.log(`\n\x1b[1m${title}\x1b[0m`);
}

function ok(message)
{
    console.log(`  \x1b[32mok\x1b[0m    ${message}`);
}

function info(message)
{
    console.log(`        ${message}`);
}

function warn(message)
{
    console.log(`  \x1b[33mwarn\x1b[0m  ${message}`);
}

function fail(message)
{
    failed = true;
    console.log(`  \x1b[31mfail\x1b[0m  ${message}`);
}

// Runs a command, streaming its output only when it fails: a successful asset import prints
// hundreds of lines nobody reads, and a failing one prints the reason.
//
// `node` is spawned as this very executable, with no shell: a shell would be the only way to
// find it on PATH, and passing an args array through one earns DEP0190 - Node warning that it
// concatenates rather than escapes. pnpm has no such option on Windows, where it is a `.cmd`
// that Node refuses to spawn directly, so it goes through a shell as one already-safe string.
function run(command, commandArgs, {cwd = repoRoot, label} = {})
{
    const result = command === 'node'
        ? spawnSync(process.execPath, commandArgs, {cwd, encoding: 'utf8'})
        : spawnSync([command, ...commandArgs].join(' '), {cwd, encoding: 'utf8', shell: true});

    if(result.error)
    {
        fail(`${label}: ${result.error.message}`);

        return null;
    }

    if(result.status !== 0)
    {
        fail(`${label} exited ${result.status}`);
        console.log((result.stdout ?? '').split('\n').slice(-15).join('\n'));
        console.log((result.stderr ?? '').split('\n').slice(-15).join('\n'));

        return null;
    }

    return result.stdout ?? '';
}

/** Recursive file count by extension, 0 when the directory is absent. */
function countFiles(dir, ext)
{
    if(!existsSync(dir)) return 0;

    let total = 0;

    for(const entry of readdirSync(dir, {withFileTypes: true}))
    {
        if(entry.isDirectory()) total += countFiles(join(dir, entry.name), ext);
        else if(entry.name.endsWith(ext)) total++;
    }

    return total;
}

// ---------------------------------------------------------------------------------------------
// 1. Prerequisites
// ---------------------------------------------------------------------------------------------

function checkPrerequisites()
{
    step('1/6  Prerequisites');

    const nodeMajor = Number(process.versions.node.split('.')[0]);

    if(nodeMajor < MIN_NODE_MAJOR) fail(`Node ${process.versions.node} - this needs ${MIN_NODE_MAJOR} or newer`);
    else ok(`Node ${process.versions.node}`);

    const pnpm = spawnSync('pnpm --version', {encoding: 'utf8', shell: true});

    if(pnpm.status !== 0)
    {
        fail('pnpm is not installed - `npm install -g pnpm`, or `corepack enable`');

        return;
    }

    const version = (pnpm.stdout ?? '').trim();

    if(Number(version.split('.')[0]) < MIN_PNPM_MAJOR) fail(`pnpm ${version} - this needs ${MIN_PNPM_MAJOR} or newer`);
    else ok(`pnpm ${version}`);
}

// ---------------------------------------------------------------------------------------------
// 2. The dump
// ---------------------------------------------------------------------------------------------

// A dump is a directory holding `src/binaryData/*Com.as` (the asset manifests every importer
// reads names out of) and `src/_assets/` (the embeds themselves). Rather than hardcode the
// directory name, every candidate under sources/ is measured and the richest one wins, so a
// newer dump dropped in beside the old one is picked up without editing anything.
// Returns {dump} or {archive}, preferring the dump: it is the only source that can produce a
// tree, so where both are present the generated one is authoritative and the archive is a stale
// copy of it by definition.
function detectAssetSource()
{
    step('2/6  Asset source');

    const dump = args.dump ?? findDump();

    if(args.dump && !isDump(args.dump))
    {
        fail(`--dump ${args.dump} has no src/binaryData/*Com.as - not a dump`);

        return null;
    }

    if(dump)
    {
        ok(`Flash dump: ${short(dump)} (${countFiles(join(dump, 'src', 'binaryData'), 'Com.as')} component manifests)`);

        return {dump};
    }

    const archive = args.archive ?? (existsSync(DEFAULT_ARCHIVE) ? DEFAULT_ARCHIVE : null);

    if(archive)
    {
        if(!existsSync(archive))
        {
            fail(`--assets ${archive} does not exist`);

            return null;
        }

        ok(`asset archive: ${short(archive)}`);

        return {archive};
    }

    fail('No assets to work from. Either of these is enough:');
    info('  - a Habbo Flash dump under sources/ (a directory holding src/binaryData/*Com.as');
    info('    and src/_assets/), from which every asset is generated;');
    info(`  - ${short(DEFAULT_ARCHIVE)}, the same tree already generated, from someone who has a dump.`);

    return null;
}

// Rather than hardcode a directory name, every candidate under sources/ is measured and the
// richest wins, so a newer dump dropped in beside the old one is picked up without editing
// anything.
function findDump()
{
    const sources = join(repoRoot, 'sources');

    if(!existsSync(sources)) return null;

    const candidates = readdirSync(sources)
        .map(name => join(sources, name))
        .filter(path => statSync(path).isDirectory() && isDump(path))
        .map(path => ({path, comFiles: countFiles(join(path, 'src', 'binaryData'), 'Com.as')}))
        .sort((a, b) => b.comFiles - a.comFiles);

    for(const other of candidates.slice(1)) info(`also present, not used: ${short(other.path)} (${other.comFiles})`);

    return candidates.length ? candidates[0].path : null;
}

function short(path)
{
    return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path;
}

function isDump(path)
{
    const binaryData = join(path, 'src', 'binaryData');

    if(!existsSync(binaryData) || !existsSync(join(path, 'src', '_assets'))) return false;

    return readdirSync(binaryData).some(name => name.endsWith('Com.as'));
}

// ---------------------------------------------------------------------------------------------
// 3. Dependencies
// ---------------------------------------------------------------------------------------------

function installDependencies()
{
    step('3/6  Dependencies');

    if(args.skipInstall)
    {
        info('skipped (--skip-install)');

        return;
    }

    if(existsSync(join(repoRoot, 'node_modules', '.pnpm')))
    {
        ok('already installed');

        return;
    }

    info('running pnpm install, this takes a minute...');

    if(run('pnpm', ['install'], {label: 'pnpm install'}) !== null) ok('installed');
}

// ---------------------------------------------------------------------------------------------
// 4. Assets
// ---------------------------------------------------------------------------------------------

// Every importer reads the dump and writes under packages/vortex-client/src/assets/, all of it
// gitignored and safe to re-run. They differ in what they call the dump: `--source` for three of
// them, `--crypted-root` for the two that grew from the image importer.
const IMPORTERS = [
    {script: 'build-window-assets.mjs', flag: '--source', extra: [], what: 'window layouts and skins'},
    {script: 'import-crypted-images.mjs', flag: '--crypted-root', extra: ['--write'], what: 'images'},
    {script: 'import-crypted-sounds.mjs', flag: '--source', extra: ['--write'], what: 'sound effects'},
    {script: 'import-avatar-configurations.mjs', flag: '--source', extra: ['--write'], what: 'avatar configurations'},
    {script: 'import-localizations.mjs', flag: '--source', extra: ['--write'], what: 'localization texts'},
    // The odd one out: its input is not the dump but an `ffdec-cli -export image` of the AIR
    // client's SWF, because the AIR dump carries no images at all. It therefore takes no dump
    // path, and skips itself with a message when AIR_IMAGE_EXPORT is unset - which is the normal
    // case for anyone who is not re-cutting the AIR assets. Without it, a regenerate-from-dump
    // silently drops the 142 images AIR adds, the 121 variablefx_* among them, and the FX
    // renderers draw nothing while failing at nothing.
    {script: 'import-air-images.mjs', flag: null, extra: [], what: 'AIR images', optional: true}
];

function buildAssets(source)
{
    step('4/6  Assets');

    if(source.archive) return extractAssets(source.archive);

    generateAssets(source.dump);
}

function extractAssets(archive)
{
    try
    {
        const written = extractZip(archive, ASSETS);

        ok(`${written.length} files extracted from ${short(archive)}`);
    }
    catch(error)
    {
        fail(`${short(archive)}: ${error.message}`);
    }
}

function generateAssets(dump)
{
    for(const importer of IMPORTERS)
    {
        const script = join(TOOLS, importer.script);

        if(!existsSync(script))
        {
            fail(`${importer.script} is missing from packages/vortex-client/tools/`);
            continue;
        }

        const args = importer.flag === null
            ? [script, ...importer.extra]
            : [script, importer.flag, dump, ...importer.extra];

        const output = run('node', args, {label: importer.script});

        if(output === null)
        {
            if(importer.optional) ok(`${importer.what.padEnd(24)} skipped`);

            continue;
        }

        ok(`${importer.what.padEnd(24)} ${lastCountLine(output)}`);
    }
}

// The importers each end with their own tally line. Rather than parse six different formats,
// take the last non-empty line that carries a digit - it is the summary in all six.
function lastCountLine(output)
{
    const lines = output.split('\n').map(line => line.trim()).filter(line => line && /\d/.test(line));

    return lines.length ? lines[lines.length - 1].replace(/^\[[^\]]+\]\s*/, '') : '';
}

// ---------------------------------------------------------------------------------------------
// 5. Configuration
// ---------------------------------------------------------------------------------------------

// Nothing to write: the client's configuration is the code's defaults (legacy.defaults.json, the
// page's own origin as url.prefix) under packages/vortex-client/public/config.json, which only a
// deployment needs. config.example.json shows what it overrides.
function writeConfiguration()
{
    step('5/6  Configuration');

    if(existsSync(CONFIG_JSON)) ok('public/config.json found');
    else info('no public/config.json: the built-in defaults apply (see public/config.example.json)');
}

// ---------------------------------------------------------------------------------------------
// 6. Does it have everything it needs
// ---------------------------------------------------------------------------------------------

async function verify()
{
    step('6/6  Verification');

    const counts = [
        ['window layouts', countFiles(join(ASSETS, 'window-layouts'), '.xml')],
        ['window skins', countFiles(join(ASSETS, 'window-skins'), '.xml')],
        ['images', countFiles(join(ASSETS, 'images'), '.png')],
        ['sounds', countFiles(join(ASSETS, 'sounds'), '.mp3')],
        ['configurations', countFiles(CONFIGURATIONS, '.txt') + countFiles(CONFIGURATIONS, '.xml')]
    ];

    for(const [what, count] of counts)
    {
        if(count === 0) fail(`no ${what} were generated`);
        else ok(`${String(count).padStart(5)} ${what}`);
    }

    if(args.skipChecks)
    {
        info('service checks skipped (--skip-checks)');

        return;
    }

    // Nothing below is fatal: the assets are built and the client will start. These three are
    // what it talks to at runtime, and naming the one that is silent saves reading a boot log.
    if(await probeHttp(ASSET_HOST_PROBE)) ok(`asset host answers at ${ASSET_HOST}`);
    else
    {
        warn(`asset host is silent at ${ASSET_HOST_PROBE}`);
        info('Serve a directory holding gamedata/, gordon/, c_images/ and dcr/ there');
        info('(Laragon, nginx, anything). Without it: rooms with no walls and no furni.');
    }

    if(await probeHttp(WEB_API_PROBE)) ok('emulator web API answers on :8080');
    else warn('emulator web API is silent on :8080 - login will not go through');

    if(await probeSocket(GAME_SOCKET.host, GAME_SOCKET.port)) ok(`game socket accepts on ${GAME_SOCKET.host}:${GAME_SOCKET.port}`);
    else
    {
        warn(`game socket is silent on ${GAME_SOCKET.host}:${GAME_SOCKET.port}`);
        info('Start vortex-emulator. The client dials this before it can do anything else.');
    }
}

// Any answer counts, including 401 and 404: the question is whether something is listening, and
// /api/user/avatars answers 401 when signed out, which is a healthy server.
async function probeHttp(url)
{
    try
    {
        await fetch(url, {signal: AbortSignal.timeout(3000)});

        return true;
    }
    catch
    {
        return false;
    }
}

function probeSocket(host, port)
{
    return new Promise(resolvePromise =>
    {
        const socket = createConnection({host, port});
        const done = result =>
        {
            socket.destroy();
            resolvePromise(result);
        };

        socket.setTimeout(3000);
        socket.once('connect', () => done(true));
        socket.once('timeout', () => done(false));
        socket.once('error', () => done(false));
    });
}

// ---------------------------------------------------------------------------------------------

// Packages the generated tree so someone without a dump can run the client. Only the five
// directories the importers write are included, and the archive is refused if one of them is
// empty: a zip missing its layouts extracts without complaint and produces a blank canvas, and
// the person who unpacks it has no way to tell that from a bug in the client.
function pack()
{
    console.log('\n\x1b[1mVortex\x1b[0m  -  packing the generated client assets');
    step('Packing');

    const entries = [];

    for(const name of PACKED_DIRS)
    {
        const dir = join(ASSETS, name);
        const files = existsSync(dir) ? listFiles(dir) : [];

        if(files.length === 0)
        {
            fail(`${name}/ is empty - run the installer against a dump first`);
            continue;
        }

        ok(`${String(files.length).padStart(5)} ${name}`);

        for(const file of files) entries.push({name: `${name}/${file}`, path: join(dir, file)});
    }

    if(failed) return finish();

    const {bytes} = writeZip(args.packTarget, entries);

    console.log(`\n\x1b[32mWrote\x1b[0m ${short(args.packTarget)}  -  ${entries.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
    console.log('Anyone with it runs `node install.mjs` and needs no dump.\n');
}

async function main()
{
    if(args.pack) return pack();

    console.log('\n\x1b[1mVortex\x1b[0m  -  setting up a client');

    checkPrerequisites();

    if(failed) return finish();

    const source = detectAssetSource();

    if(!source) return finish();

    installDependencies();

    if(failed) return finish();

    buildAssets(source);
    writeConfiguration();

    await verify();

    finish();
}

function finish()
{
    if(failed)
    {
        console.log('\n\x1b[31mSetup did not complete.\x1b[0m Fix the failures above and run it again -');
        console.log('every step is idempotent, nothing is done twice.\n');
        process.exitCode = 1;

        return;
    }

    console.log('\n\x1b[32mReady.\x1b[0m  pnpm dev  then open http://localhost:5173/client/\n');
}

main();
