#!/usr/bin/env node
/**
 * Copies the .nitro sources of every family into one place nothing serves (spec
 * 2026-10-09-ambreia-everything, §1): build-ambreia-all reads them from there. Re-runnable: a file is
 * copied only when missing, different in size or older; nothing is ever deleted.
 *
 *   node packages/vortex-client/tools/gather-ambreia-sources.mjs [--out=C:/laragon/ambreia-sources]
 *     [--gordon=<dir>] [--clothing=<dir>] [--furniture=<dir>]
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {effectMapLibs, figureMapLibs, gordonSelection, iconBundle, petNames} from './ambreia-families.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const flag = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const OUT = flag('out', 'C:/laragon/ambreia-sources');
const GORDON = flag('gordon', 'C:/laragon/www/vortex-assets/gordon/vortex-assets-PRODUCTION-202601121522-867048149');
const CLOTHING = flag('clothing', path.join(process.env.USERPROFILE ?? '', 'Desktop/clothing'));
const FURNITURE = flag('furniture', 'C:/laragon/www/vortex-assets/dcr/hof_furni');
const CONFIGURATIONS = path.resolve(HERE, '../src/assets/configurations');
const LEGACY = path.resolve(HERE, '../../ambreia-game/src/configuration/legacy.defaults.json');

let copied = 0;
let kept = 0;

function copy(source, target)
{
    const from = fs.statSync(source);
    const to = fs.existsSync(target) ? fs.statSync(target) : null;

    // Whole milliseconds: utimesSync() keeps no more, so a copy reads a fraction older than its source.
    if(to && to.size === from.size && Math.floor(to.mtimeMs) >= Math.floor(from.mtimeMs))
    {
        kept++;

        return;
    }

    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.copyFileSync(source, target);
    fs.utimesSync(target, from.atime, from.mtime);
    copied++;
}

/** Every .nitro under `dir`, its subfolders included, kept at the same relative path. */
function copyTree(dir, family)
{
    for(const entry of fs.readdirSync(dir, {withFileTypes: true}))
    {
        const full = path.join(dir, entry.name);

        if(entry.isDirectory()) copyTree(full, path.join(family, entry.name));
        else if(entry.name.endsWith('.nitro')) copy(full, path.join(OUT, family, entry.name));
    }
}

const gordonNames = fs.readdirSync(GORDON).filter(name => name.endsWith('.nitro')).map(name => name.slice(0, -'.nitro'.length));
const picked = gordonSelection({
    figureLibs: figureMapLibs(fs.readFileSync(path.join(CONFIGURATIONS, 'AmbreiaFigureMap.xml'), 'utf8')),
    effectLibs: effectMapLibs(fs.readFileSync(path.join(CONFIGURATIONS, 'AmbreiaEffectMap.xml'), 'utf8')),
    pets: petNames(JSON.parse(fs.readFileSync(LEGACY, 'utf8'))),
    gordonNames
});

copyTree(CLOTHING, 'clothing');

for(const family of ['clothing', 'effects', 'room', 'pets'])
{
    for(const name of picked[family]) copy(path.join(GORDON, `${name}.nitro`), path.join(OUT, family, `${name}.nitro`));
}

// Top level only: icons/ and mp3/ are not furniture bundles.
for(const name of fs.readdirSync(FURNITURE).filter(name => name.endsWith('.nitro'))) copy(path.join(FURNITURE, name), path.join(OUT, 'furniture', name));

// The hotel's catalogue icons, each wrapped as a bundle (iconBundle): a furni's own `_icon_` assets
// differ from them for about four in ten (custom furni, missing coloured layers).
const ICONS = path.join(FURNITURE, 'icons');

for(const file of fs.readdirSync(ICONS).filter(name => name.endsWith('.png')))
{
    const source = path.join(ICONS, file);
    const target = path.join(OUT, 'icons', `${file.slice(0, -'.png'.length)}.nitro`);
    const from = fs.statSync(source);
    const to = fs.existsSync(target) ? fs.statSync(target) : null;

    if(to && Math.floor(to.mtimeMs) >= Math.floor(from.mtimeMs))
    {
        kept++;
        continue;
    }

    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, iconBundle(file.slice(0, -'.png'.length), fs.readFileSync(source)));
    fs.utimesSync(target, from.atime, from.mtime);
    copied++;
}

console.log(`${copied} copied, ${kept} already there → ${OUT}`);
console.log(Object.entries(picked).map(([family, names]) => `${family}: ${names.length} from gordon`).join(', '));
