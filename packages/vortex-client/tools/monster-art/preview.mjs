#!/usr/bin/env node
// Live preview of a monster's rig on http://localhost:5199: the 8 directions side by side, every
// animation at its real durations, on Habbo's floor colour, ×1 and ×4, one pass or the final image.
// Saving rig.json renders again and the page reloads itself; a rig error shows on the page.
//
//   pnpm --filter vortex-client monster-art:preview <id> [--port=5199] [--anim=<animation>]
import {createServer} from 'node:http';
import {readFileSync, watch} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {loadRig} from './rig.mjs';
import {canvasFor, frameList, renderFrame} from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MONSTERS = resolve(HERE, '../../monsters');
const PASSES = ['forme', 'peinture', 'details', 'finition', 'final'];

async function png(buffer, canvas)
{
    const data = await sharp(buffer, {raw: {width: canvas.width, height: canvas.height, channels: 4}}).png().toBuffer();

    return `data:image/png;base64,${data.toString('base64')}`;
}

/** Renders the rig (one animation, or all); an error (JSON, rig) comes back as {error}. */
export async function loadAndRender(folder, only)
{
    try
    {
        const rig = loadRig(JSON.parse(readFileSync(join(folder, 'rig.json'), 'utf8')));
        const canvas = canvasFor(rig);
        const frames = [];

        for(const f of frameList(rig).filter(f => !only || f.animation === only))
        {
            const layers = renderFrame(rig, canvas, f.direction, f.frame), images = {};

            for(const pass of PASSES) images[pass] = await png(layers[pass], canvas);
            frames.push({animation: f.animation, direction: f.direction, index: f.index, ms: f.frame.ms, images});
        }

        return {canvas, frames};
    }
    catch(error)
    {
        return {error: error instanceof SyntaxError ? `rig.json is not valid JSON: ${error.message}` : error.message};
    }
}

const PAGE = `<!doctype html><meta charset="utf-8"><title>monster-art</title>
<style>
body{margin:0;background:#2b2b30;color:#ddd;font:14px system-ui}
header{padding:8px 12px;display:flex;gap:16px;align-items:center}
.row{display:flex;gap:6px;padding:6px 12px;align-items:flex-end}
.row h2{width:70px;font-size:13px;margin:0}
canvas{background:#989768;image-rendering:pixelated}
pre{color:#ff8080;padding:12px;white-space:pre-wrap}
</style>
<header><b id="title"></b>
<label>pass <select id="pass"><option>final</option><option>peinture</option><option>details</option><option>finition</option><option>forme</option></select></label>
<label>zoom <select id="zoom"><option>4</option><option>1</option><option>2</option><option>6</option></select></label>
<span id="status"></span></header><main id="main"></main>
<script>
const main = document.getElementById('main'), status = document.getElementById('status');
let data = null, images = new Map(), canvases = [];
async function load()
{
    status.textContent = 'rendering…';
    data = await (await fetch('/data')).json();
    main.innerHTML = '';
    canvases = [];
    if(data.error) { main.innerHTML = '<pre></pre>'; main.firstChild.textContent = data.error; status.textContent = ''; return; }
    document.getElementById('title').textContent = data.id;
    images = new Map(data.frames.map(f => [f.animation + '/' + f.direction + '/' + f.index, Object.fromEntries(Object.entries(f.images).map(([k, src]) => { const i = new Image(); i.src = src; return [k, i]; }))]));
    const zoom = +document.getElementById('zoom').value;
    for(const animation of [...new Set(data.frames.map(f => f.animation))])
    {
        const row = document.createElement('div'); row.className = 'row';
        row.innerHTML = '<h2>' + animation + '</h2>';
        const list = data.frames.filter(f => f.animation === animation && f.direction === 0);
        for(let d = 0; d < 8; d++)
        {
            const c = document.createElement('canvas'); c.width = data.canvas.width * zoom; c.height = data.canvas.height * zoom; c.title = 'direction ' + d;
            row.appendChild(c);
            canvases.push({c, animation, direction: d, list, frame: 0, at: performance.now()});
        }
        main.appendChild(row);
    }
    status.textContent = data.frames.length + ' frames, ' + data.canvas.width + '×' + data.canvas.height;
}
function draw(now)
{
    const pass = document.getElementById('pass').value;
    for(const v of canvases)
    {
        while(now - v.at > v.list[v.frame].ms) { v.at += v.list[v.frame].ms; v.frame = (v.frame + 1) % v.list.length; }
        const img = images.get(v.animation + '/' + v.direction + '/' + v.list[v.frame].index)?.[pass];
        const g = v.c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, v.c.width, v.c.height);
        if(img?.complete) g.drawImage(img, 0, 0, v.c.width, v.c.height);
    }
    requestAnimationFrame(draw);
}
document.getElementById('zoom').onchange = load;
new EventSource('/events').onmessage = load;
load().then(() => requestAnimationFrame(draw));
</script>`;

function main()
{
    const args = process.argv.slice(2);
    const id = args.find(a => !a.startsWith('--'));
    const port = Number(args.find(a => a.startsWith('--port='))?.slice(7) ?? 5199);
    const only = args.find(a => a.startsWith('--anim='))?.slice(7) ?? null;

    if(!id)
    {
        console.error('usage: monster-art:preview <id> [--port=5199] [--anim=<animation>]');
        process.exit(1);
    }

    const folder = join(MONSTERS, id), clients = new Set();
    let current = loadAndRender(folder, only).then(r => ({id, ...r}));
    let timer = null;

    // Saving rig.json renders again (debounced: editors write in several steps), then tells the pages.
    watch(folder, (_event, file) =>
    {
        if(file !== 'rig.json') return;
        clearTimeout(timer);
        timer = setTimeout(() =>
        {
            current = loadAndRender(folder, only).then(r => ({id, ...r}));
            current.then(r =>
            {
                console.log(r.error ? `error: ${r.error}` : `rendered ${r.frames.length} frames`);
                for(const res of clients) res.write('data: reload\n\n');
            });
        }, 250);
    });

    createServer(async (req, res) =>
    {
        if(req.url === '/data')
        {
            res.writeHead(200, {'content-type': 'application/json'});
            res.end(JSON.stringify(await current));
        }
        else if(req.url === '/events')
        {
            res.writeHead(200, {'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive'});
            clients.add(res);
            req.on('close', () => clients.delete(res));
        }
        else
        {
            res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
            res.end(PAGE);
        }
    }).listen(port, () => console.log(`monster-art preview of ${id}: http://localhost:${port}`));
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
