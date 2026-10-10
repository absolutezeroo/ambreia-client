// packages/vortex-client/tools/monster-art/build.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildMonsterArt} from './build.mjs';
import {readAseprite, readAsepriteLayers, writeAseprite} from '../lib/aseprite.mjs';
import {compileMonster, loadSource} from '../build-monsters.mjs';

const grey = ['#20202a', '#40404e', '#606070', '#808090', '#a0a0b0'];
const rig = (extra = {}) => ({
    id: 'blob',
    ramps: {grey},
    materials: {skin: {ramp: 'grey'}},
    bones: {body: {at: [0, 0, 5]}},
    shapes: [{name: 'body', bone: 'body', ellipsoid: {center: [0, 0, 5], radii: [5, 4, 4]}, material: 'skin'}],
    animations: {idle: [{ms: 200}], walk: [{ms: 100}, {ms: 100, pose: {body: {move: [0, 0, 1]}}}]},
    ...extra
});
const folderWith = json =>
{
    const dir = mkdtempSync(join(tmpdir(), 'monster-art-'));

    writeFileSync(join(dir, 'rig.json'), JSON.stringify(json));
    return dir;
};

test('a rig builds into a layered .aseprite with 8 directions and a monster.json build-monsters compiles', async () =>
{
    const dir = folderWith(rig());
    const result = buildMonsterArt(dir);
    const manifest = JSON.parse(readFileSync(join(dir, 'monster.json'), 'utf8'));
    const layered = readAsepriteLayers(readFileSync(join(dir, 'blob.aseprite')));

    assert.equal(result.frames, 8 * 3);
    assert.deepEqual(manifest.directions, [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(manifest.anchor, [result.canvas.anchorX, result.canvas.anchorY]);
    assert.deepEqual(layered.layers.map(l => [l.name, l.visible]), [['forme', false], ['peinture', true], ['détails', true], ['finition', true], ['retouche', true]]);
    assert.deepEqual(layered.tags.slice(0, 3), [{name: 'idle_0', from: 0, to: 0}, {name: 'walk_0', from: 1, to: 2}, {name: 'idle_1', from: 3, to: 3}]);

    const {json} = compileMonster(await loadSource(dir));
    const assets = Object.values(json.assets);

    assert.ok(assets.every(a => !a.flipH), 'every direction is drawn: no mirrored asset');
});

test('hand retouches are kept on a rebuild; a changed tag or canvas is refused unless --drop-retouche', () =>
{
    const dir = folderWith(rig());

    buildMonsterArt(dir);

    // Retouch: one pixel on the retouche layer of frame 0.
    const path = join(dir, 'blob.aseprite');
    const layered = readAsepriteLayers(readFileSync(path));
    const retouche = Buffer.alloc(layered.width * layered.height * 4);

    retouche.writeUInt32BE(0xff00ffff, 0);
    writeFileSync(path, writeAseprite({
        width: layered.width, height: layered.height, tags: layered.tags,
        layers: layered.layers.map(({name, visible}) => ({name, visible})),
        frames: layered.frames.map((f, i) => ({duration: f.duration, cels: [...f.cels.slice(0, 4), i === 0 ? retouche : null]}))
    }));

    assert.equal(buildMonsterArt(dir).keptRetouche, true);
    assert.equal(readAseprite(readFileSync(path)).frames[0].data.readUInt32BE(0), 0xff00ffff);

    // One more idle frame: the tags move.
    const longer = rig();
    longer.animations.idle.push({ms: 200});
    writeFileSync(join(dir, 'rig.json'), JSON.stringify(longer));
    assert.throws(() => buildMonsterArt(dir), /retouche.*idle_0|retouche/);

    // A bigger body: same tags, another canvas.
    const bigger = rig();
    bigger.shapes[0].ellipsoid.radii = [8, 6, 6];
    writeFileSync(join(dir, 'rig.json'), JSON.stringify(bigger));
    assert.throws(() => buildMonsterArt(dir), /canvas/);

    assert.equal(buildMonsterArt(dir, {dropRetouche: true}).keptRetouche, false);
});

test('a broken rig is refused with the path of the error', () =>
{
    const bad = rig();
    bad.shapes[0].bone = 'tail';
    assert.throws(() => buildMonsterArt(folderWith(bad)), /shapes\[0\]\.bone/);
});
