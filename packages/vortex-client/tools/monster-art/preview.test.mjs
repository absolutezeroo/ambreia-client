// packages/vortex-client/tools/monster-art/preview.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadAndRender} from './preview.mjs';

const folder = text =>
{
    const dir = mkdtempSync(join(tmpdir(), 'monster-preview-'));

    writeFileSync(join(dir, 'rig.json'), text);
    return dir;
};
const rig = {
    id: 'blob',
    ramps: {grey: ['#20202a', '#40404e', '#606070', '#808090', '#a0a0b0']},
    materials: {skin: {ramp: 'grey'}},
    bones: {body: {at: [0, 0, 5]}},
    shapes: [{name: 'body', bone: 'body', ellipsoid: {center: [0, 0, 5], radii: [5, 4, 4]}, material: 'skin'}],
    animations: {idle: [{ms: 200}], walk: [{ms: 100}]}
};

test('every frame of the chosen animation, every pass as a PNG data URL', async () =>
{
    const result = await loadAndRender(folder(JSON.stringify(rig)), 'walk');

    assert.equal(result.frames.length, 8);
    assert.ok(result.frames.every(f => f.animation === 'walk'));
    for(const pass of ['forme', 'peinture', 'details', 'finition', 'final']) assert.match(result.frames[0].images[pass], /^data:image\/png;base64,/);
});

test('a JSON syntax error or a rig error comes back as an error, without throwing', async () =>
{
    assert.match((await loadAndRender(folder('{"id": "blob",'), null)).error, /JSON/);

    const bad = structuredClone(rig);
    bad.shapes[0].material = 'scales';
    assert.match((await loadAndRender(folder(JSON.stringify(bad)), null)).error, /shapes\[0\]\.material/);
});
