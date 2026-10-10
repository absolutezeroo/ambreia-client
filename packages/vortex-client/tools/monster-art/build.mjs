#!/usr/bin/env node
// Turns monsters/<id>/rig.json into <id>.aseprite (layers forme (hidden), peinture, détails,
// finition, retouche; tags <animation>_<direction>, 8 directions) and the monster.json that
// build-monsters reads. The retouche layer holds hand edits and is never overwritten.
// Spec docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md.
//
//   pnpm --filter vortex-client build:monster-art [--drop-retouche] [<id>...]
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRig} from './rig.mjs';
import {canvasFor, frameList, renderFrame} from './render.mjs';
import {readAsepriteLayers, writeAseprite} from '../lib/aseprite.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MONSTERS = resolve(HERE, '../../monsters');

export const LAYERS = [
    {name: 'forme', visible: false},
    {name: 'peinture', visible: true},
    {name: 'détails', visible: true},
    {name: 'finition', visible: true},
    {name: 'retouche', visible: true}
];

/** The hand edits of an existing file, frame by frame, or null when there are none. */
export function keptRetouche(path, {tags, width, height}, dropRetouche)
{
    if(!existsSync(path)) return null;

    const old = readAsepriteLayers(readFileSync(path));
    const layer = old.layers.findIndex(l => l.name === 'retouche');

    if(layer < 0 || old.frames.every(f => !f.cels[layer]) || dropRetouche) return null;

    const changed = tags.find((t, i) => old.tags[i]?.name !== t.name || old.tags[i].from !== t.from || old.tags[i].to !== t.to);

    if(changed || old.tags.length !== tags.length)
    {
        throw new Error(`the retouche layer has hand edits and tag ${changed?.name ?? old.tags[tags.length]?.name} changed: rerun with --drop-retouche to lose them`);
    }
    if(old.width !== width || old.height !== height)
    {
        throw new Error(`the retouche layer has hand edits and the canvas changed (${old.width}×${old.height} → ${width}×${height}): rerun with --drop-retouche to lose them`);
    }

    return old.frames.map(f => f.cels[layer]);
}

export function buildMonsterArt(folder, {dropRetouche = false} = {})
{
    const rig = loadRig(JSON.parse(readFileSync(join(folder, 'rig.json'), 'utf8')));
    const canvas = canvasFor(rig);
    const frames = [], tags = [];

    for(const f of frameList(rig))
    {
        const name = `${f.animation}_${f.direction}`;

        if(tags.at(-1)?.name !== name) tags.push({name, from: frames.length, to: frames.length});
        tags.at(-1).to = frames.length;

        const layers = renderFrame(rig, canvas, f.direction, f.frame);

        frames.push({duration: f.frame.ms, cels: [layers.forme, layers.peinture, layers.details, layers.finition, null]});
    }

    const path = join(folder, `${rig.id}.aseprite`);
    const retouche = keptRetouche(path, {tags, width: canvas.width, height: canvas.height}, dropRetouche);

    if(retouche)
    {
        frames.forEach((f, i) =>
        {
            f.cels[4] = retouche[i] ?? null;
        });
    }
    writeFileSync(path, writeAseprite({width: canvas.width, height: canvas.height, layers: LAYERS, frames, tags}));
    writeFileSync(join(folder, 'monster.json'), `${JSON.stringify({
        id: rig.id, aseprite: `${rig.id}.aseprite`, anchor: [canvas.anchorX, canvas.anchorY], directions: [0, 1, 2, 3, 4, 5, 6, 7], scale: 1
    }, null, 2)}\n`);

    return {id: rig.id, frames: frames.length, canvas, keptRetouche: Boolean(retouche)};
}

function main()
{
    const args = process.argv.slice(2);
    const dropRetouche = args.includes('--drop-retouche');
    const wanted = args.filter(a => !a.startsWith('--'));
    const ids = wanted.length ? wanted : readdirSync(MONSTERS).filter(id => existsSync(join(MONSTERS, id, 'rig.json')));
    let failed = 0;

    for(const id of ids)
    {
        const started = Date.now();

        try
        {
            const r = buildMonsterArt(join(MONSTERS, id), {dropRetouche});

            console.log(`${r.id}: ${r.frames} frames, ${r.canvas.width}×${r.canvas.height}, anchor (${r.canvas.anchorX}, ${r.canvas.anchorY})${r.keptRetouche ? ', retouches kept' : ''}, ${((Date.now() - started) / 1000).toFixed(1)} s`);
        }
        catch(error)
        {
            failed++;
            console.error(`${id}: ${error.message}`);
        }
    }

    if(ids.length > failed) console.log('next: pnpm --filter vortex-client build:monsters <id>, then build:ambreia:all --only=pets');
    if(failed) process.exit(1);
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
