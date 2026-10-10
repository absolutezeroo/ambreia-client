// packages/vortex-client/tools/monster-art/passes.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadRig, poseBones} from './rig.mjs';
import {form} from './form.mjs';
import {FLASH, paint, rampFor, texture} from './paint.mjs';
import {VIEW} from './projection.mjs';
import {dot, len, sub} from './vec.mjs';

const grey = ['#111111', '#333333', '#555555', '#777777', '#999999'];
const ball = loadRig({
    id: 'ball',
    ramps: {grey, pale: ['#222222', '#444444', '#666666', '#888888', '#aaaaaa']},
    materials: {skin: {ramp: 'grey', when: [{normalUp: [0.7, 1], ramp: 'pale'}]}},
    bones: {body: {at: [0, 0, 5]}},
    shapes: [{name: 'ball', bone: 'body', ellipsoid: {center: [0, 0, 5], radii: [4, 4, 4]}, material: 'skin'}],
    animations: {idle: [{ms: 100}], walk: [{ms: 100}]}
});
const canvas = {width: 20, height: 24, anchorX: 10, anchorY: 18, radius: 12};
const full = {x0: 0, y0: 0, x1: 20, y1: 24};

test('form: the ball is hit at its centre, facing the viewer, on its surface; the corner misses', () =>
{
    const G = form(ball, poseBones(ball, {}), 2, canvas, full);
    // (0, 0, 5) projects 5 px above the anchor: pixel (10, 13).
    const g = G[13 * 20 + 10];

    assert.ok(g, 'centre hit');
    assert.ok(dot(g.n, VIEW) > 0.9);
    assert.ok(Math.abs(len(sub(g.rest, [0, 0, 5])) - 4) < 0.1);
    assert.equal(G[0], null);
});

test('form: only the region is traced', () =>
{
    const G = form(ball, poseBones(ball, {}), 2, canvas, {x0: 0, y0: 0, x1: 10, y1: 24});

    assert.equal(G[13 * 20 + 10], null);
    assert.ok(G[13 * 20 + 9]);
});

test('paint: the side toward the light is lighter; the top takes the "when" ramp; flash paints all pale', () =>
{
    const G = form(ball, poseBones(ball, {}), 2, canvas, full);
    const {img, index, base} = paint(G);
    const lit = index[11 * 20 + 8], shaded = index[15 * 20 + 12];

    assert.ok(lit > shaded, `lit ${lit} > shaded ${shaded}`);
    assert.deepEqual(base[13 * 20 + 10], ball.materials.skin.ramp[2]);
    assert.equal(img[0], null);
    assert.ok(paint(G, {flash: true}).img.filter(Boolean).every(c => c === FLASH));
});

test('rampFor: the first matching rule wins, else the material ramp', () =>
{
    const m = ball.materials.skin;
    const at = restN => ({restN, rest: [0, 0, 0], h: 0, shape: {material: m}});

    assert.equal(rampFor(at([0, 0, 1])), ball.ramps.pale);
    assert.equal(rampFor(at([0, 0, -1])), ball.ramps.grey);
});

test('texture: only mid tones move, by one step', () =>
{
    const g = {rest: [1, 2, 3], restN: [0, 0, 1]};

    assert.equal(texture('fur', g, 0), 0);
    assert.equal(texture('scales', g, 4), 0);
    assert.equal(texture(null, g, 2), 0);
    for(let u = 0; u < 20; u++) assert.ok([-1, 0, 1].includes(texture('scales', {rest: [u, 0.4, u * 0.3], restN: [0, 0, 1]}, 2)));
});
