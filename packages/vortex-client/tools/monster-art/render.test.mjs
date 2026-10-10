// packages/vortex-client/tools/monster-art/render.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRig} from './rig.mjs';
import {canvasFor, frameList, renderFrame} from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const grey = ['#20202a', '#40404e', '#606070', '#808090', '#a0a0b0'];
const tiny = loadRig({
    id: 'tiny',
    ramps: {grey, cream: ['#504838', '#786c58', '#a09078', '#c8b8a0', '#e8dcc8']},
    materials: {
        skin: {ramp: 'grey', when: [{normalUp: [-1, -0.5], ramp: 'cream'}], specular: 0.4},
        horn: {ramp: 'cream', specular: 1, shininess: 12, glint: '#ffffff'}
    },
    bones: {body: {at: [0, 0, 8]}, head: {parent: 'body', at: [6, 0, 10]}},
    shapes: [
        {name: 'trunk', bone: 'body', ellipsoid: {center: [0, 0, 8], radii: [7, 4.5, 5]}, material: 'skin', blend: 0},
        {name: 'skull', bone: 'head', ellipsoid: {center: [9, 0, 13], radii: [3.5, 3, 3]}, material: 'skin'},
        {name: 'horn', bone: 'head', mirror: true, cone: {from: [8, 1.5, 15.5], to: [6, 2, 19], radius: [1, 0.2]}, material: 'horn', blend: 0.3}
    ],
    decals: [{kind: 'eye', bone: 'head', at: [11.6, 1.6, 13.6], mirror: true, colours: ['#ffcc00', '#000000']}],
    animations: {
        idle: [{ms: 200}],
        walk: [{ms: 100, pose: {body: {move: [0, 0, 3]}}}, {ms: 100, pose: {head: {rotate: [0, 30, 0]}}}],
        hit: [{ms: 90, flash: true}]
    }
});
const canvas = canvasFor(tiny);
const opaque = (buf, i) => buf[i * 4 + 3] > 0;
const yellow = buf => Array.from({length: buf.length / 4}, (_, i) => i).filter(i => buf[i * 4] === 0xff && buf[i * 4 + 1] === 0xcc && buf[i * 4 + 2] === 0).length;

test('frameList: 8 directions × every frame of every animation, directions first', () =>
{
    const list = frameList(tiny);

    assert.equal(list.length, 8 * 4);
    assert.deepEqual(list.slice(0, 4).map(f => `${f.animation}${f.index}`), ['idle0', 'walk0', 'walk1', 'hit0']);
    assert.equal(list[4].direction, 1);
});

test('no frame touches the canvas edge, the raised walk pose included', () =>
{
    for(const f of frameList(tiny))
    {
        const {final} = renderFrame(tiny, canvas, f.direction, f.frame);

        for(let y = 0; y < canvas.height; y++)
        {
            for(let x = 0; x < canvas.width; x++)
            {
                if(x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) assert.ok(!opaque(final, y * canvas.width + x), `${f.animation}${f.index} dir ${f.direction} at (${x}, ${y})`);
            }
        }
    }
});

test('the layers stack into the final image; forme is the flat silhouette', () =>
{
    const frame = tiny.animations.idle[0];
    const l = renderFrame(tiny, canvas, 2, frame);

    for(let i = 0; i < canvas.width * canvas.height; i++)
    {
        const top = [l.finition, l.details, l.peinture].find(layer => opaque(layer, i));
        const expected = top ? [...top.subarray(i * 4, i * 4 + 4)] : [0, 0, 0, 0];

        assert.deepEqual([...l.final.subarray(i * 4, i * 4 + 4)], expected, `pixel ${i}`);
        if(opaque(l.peinture, i)) assert.ok(opaque(l.forme, i));
    }
});

test('the eyes show from the front (direction 3), not from behind (7); a flash frame is pale', () =>
{
    assert.ok(yellow(renderFrame(tiny, canvas, 3, tiny.animations.idle[0]).final) > 0);
    assert.equal(yellow(renderFrame(tiny, canvas, 7, tiny.animations.idle[0]).final), 0);

    const flash = renderFrame(tiny, canvas, 2, tiny.animations.hit[0]).peinture;
    assert.ok([...flash].some((v, i) => i % 4 === 0 && v === 242));
});

test('snapshot: the idle frame from direction 2 is unchanged', () =>
{
    const file = join(HERE, '__snapshots__', 'tiny.sha1');
    const hash = createHash('sha1').update(renderFrame(tiny, canvas, 2, tiny.animations.idle[0]).final).digest('hex');

    // First run records it (commit the file); later runs compare. A deliberate change of a pass: delete the file and look at the preview.
    if(!existsSync(file))
    {
        mkdirSync(dirname(file), {recursive: true});
        writeFileSync(file, `${hash}\n`);
    }
    assert.equal(hash, readFileSync(file, 'utf8').trim());
});
