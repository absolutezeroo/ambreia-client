#!/usr/bin/env node
/**
 * Builds every family's .ambreia directory from the gathered sources, then checks that the families
 * cover what the client asks for (spec 2026-10-09-ambreia-everything, §1). Exit 1 when a build fails or
 * a blocking name is missing; `<repo>/.ambreia-build/coverage.json` lists every gap.
 *
 *   pnpm --filter vortex-client build:ambreia:all [--sources=C:/laragon/ambreia-sources]
 *     [--out=C:/laragon/www/vortex-assets/ambreia] [--key-file=C:/laragon/ambreia.key] [--only=room,pets]
 *
 * The build state goes to the repository's `.ambreia-build/` whatever the working directory (pnpm runs
 * this from packages/vortex-client).
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {FAMILIES, coverage, effectMapLibs, figureMapLibs, petNames} from './ambreia-families.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = path.resolve(HERE, '..');
const flag = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const SOURCES = flag('sources', 'C:/laragon/ambreia-sources');
const OUT = flag('out', 'C:/laragon/www/vortex-assets/ambreia');
const KEY_FILE = flag('key-file', 'C:/laragon/ambreia.key');
const STATE_DIR = path.resolve(flag('state-dir', path.resolve(CLIENT, '../../.ambreia-build')));
const ONLY = flag('only', '').split(',').filter(Boolean);
const TSX = path.resolve(CLIENT, '../../node_modules/tsx/dist/cli.mjs');

let failed = false;

for(const family of FAMILIES.filter(name => ONLY.length === 0 || ONLY.includes(name)))
{
    console.log(`\n== ${family}`);

    // From the client package, as `pnpm --filter vortex-client build:ambreia` runs it (workspace imports).
    const run = spawnSync(process.execPath, [TSX, path.join(HERE, 'build-ambreia.ts'), path.join(SOURCES, family), path.join(OUT, family),
        `--key-file=${KEY_FILE}`, `--kind=${family}`, `--state-dir=${STATE_DIR}`], {stdio: 'inherit', cwd: CLIENT});

    if(run.status !== 0)
    {
        failed = true;
        console.error(`${family}: build failed (exit ${run.status})`);
    }
}

/** The names a family's directory holds: its source bundles minus those its report found unreadable. */
function available(family)
{
    const names = new Set();
    const walk = (dir) =>
    {
        for(const entry of fs.readdirSync(dir, {withFileTypes: true}))
        {
            if(entry.isDirectory()) walk(path.join(dir, entry.name));
            else if(entry.name.endsWith('.nitro')) names.add(entry.name.slice(0, -'.nitro'.length));
        }
    };

    if(fs.existsSync(path.join(SOURCES, family))) walk(path.join(SOURCES, family));

    const report = path.join(STATE_DIR, `${family}.report.json`);

    if(fs.existsSync(report))
    {
        for(const {file} of JSON.parse(fs.readFileSync(report, 'utf8')).unreadable) names.delete(path.basename(file, '.nitro'));
    }

    return names;
}

const configurations = path.resolve(CLIENT, 'src/assets/configurations');
const result = coverage({
    figureLibs: figureMapLibs(fs.readFileSync(path.join(configurations, 'AmbreiaFigureMap.xml'), 'utf8')),
    effectLibs: effectMapLibs(fs.readFileSync(path.join(configurations, 'AmbreiaAnimationMap.xml'), 'utf8')),
    pets: petNames(JSON.parse(fs.readFileSync(path.resolve(CLIENT, '../ambreia-common/src/config/legacy.defaults.json'), 'utf8'))),
    available: Object.fromEntries(FAMILIES.map(family => [family, available(family)]))
});

fs.mkdirSync(STATE_DIR, {recursive: true});
fs.writeFileSync(path.join(STATE_DIR, 'coverage.json'), JSON.stringify(result, null, 1));
console.log(`\ncoverage: ${Object.entries(result.missing).map(([family, names]) => `${family} −${names.length}`).join(', ')} (details: ${path.join(STATE_DIR, 'coverage.json')})`);

if(result.blocking.length > 0)
{
    failed = true;
    console.error(`blocking: ${result.blocking.join(' ')}`);
}

process.exit(failed ? 1 : 0);
