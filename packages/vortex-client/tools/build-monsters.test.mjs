import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inflateSync} from 'node:zlib';
import sharp from 'sharp';
import {buildMonster, compileMonster, frameTiming, loadSource, resolveDirections} from './build-monsters.mjs';
import {readAseprite, writeAseprite} from './lib/aseprite.mjs';

const W = 12, H = 10;

/** A W×H frame with a w×h block standing on the bottom row, centred on x = 6. */
function block(w, h, colour = 0xff3fbf5a)
{
    const data = Buffer.alloc(W * H * 4);

    for(let y = H - h; y < H; y++) for(let x = 6 - (w >> 1); x < 6 - (w >> 1) + w; x++) data.writeUInt32BE(colour, (y * W + x) * 4);

    return data;
}

function folder(files)
{
    const dir = mkdtempSync(join(tmpdir(), 'monster-'));

    for(const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), typeof content === 'string' ? content : content);

    return dir;
}

function readNitro(buffer)
{
    const files = {};
    let at = 2;

    for(let n = buffer.readInt16BE(0); n > 0; n--)
    {
        const nameLength = buffer.readInt16BE(at), name = buffer.toString('utf8', at + 2, at + 2 + nameLength);
        const length = buffer.readInt32BE(at + 2 + nameLength), start = at + 6 + nameLength;

        files[name] = inflateSync(buffer.subarray(start, start + length));
        at = start + length;
    }

    return files;
}

test('resolveDirections: mirrors the opposite side, else the nearest drawn, preferring the face', () =>
{
    const one = resolveDirections([2]);

    assert.deepEqual(one.get(2), {from: 2, flip: false});
    assert.deepEqual(one.get(4), {from: 2, flip: true});
    assert.deepEqual(one.get(3), {from: 2, flip: false});
    assert.deepEqual(one.get(7), {from: 2, flip: false});

    const two = resolveDirections([2, 0]);

    assert.deepEqual(two.get(6), {from: 0, flip: true});
    assert.deepEqual(two.get(1), {from: 2, flip: false}, 'a tie goes to the direction facing the viewer');
    assert.deepEqual(two.get(7), {from: 0, flip: false}, 'a tie goes to a drawn direction before a mirror');
});

test('frameTiming: durations become one frameRepeat at 41 ms per frame', () =>
{
    assert.deepEqual(frameTiming([82, 82, 164]), {frameRepeat: 2, counts: [1, 1, 2]});
    assert.deepEqual(frameTiming([10]), {frameRepeat: 1, counts: [1]});
});

test('an .aseprite with idle and walk compiles to a pet with 8 directions and the shadow', async () =>
{
    const frames = [block(6, 4), block(6, 5), block(8, 3), block(6, 6)].map(data => ({duration: 120, data}));
    const sprite = writeAseprite({width: W, height: H, frames, tags: [{name: 'idle', from: 0, to: 1}, {name: 'walk', from: 2, to: 3}]});

    assert.equal(readAseprite(sprite).frames[1].data.compare(frames[1].data), 0, 'the writer and reader agree');

    const dir = folder({'monster.json': JSON.stringify({id: 'blob', aseprite: 'blob.aseprite', anchor: [6, 9]}), 'blob.aseprite': sprite});
    const {json} = compileMonster(await loadSource(dir));
    const vis = json.visualizations[0];

    assert.equal(json.logicType, 'pet');
    assert.equal(json.visualizationType, 'pet_animated');
    assert.deepEqual(vis.postures.postures, [{id: 'std', animationId: 0}, {id: 'mv', animationId: 1}, {id: 'ded', animationId: 0}]);
    assert.deepEqual(vis.gestures, []);
    assert.deepEqual(Object.keys(vis.directions), ['0', '1', '2', '3', '4', '5', '6', '7']);

    for(let d = 0; d < 8; d++) for(const id of [0, 1, 100, 101]) assert.ok(json.assets[`blob_64_a_${d}_${id}`], `blob_64_a_${d}_${id}`);

    assert.deepEqual(json.assets.blob_64_a_2_0, {x: 3, y: 3}, 'the anchor lands on the reference point');
    assert.deepEqual(json.assets.blob_64_a_4_0, {source: 'blob_64_a_2_0', x: 3, y: 3, flipH: true});
    assert.equal(json.assets.blob_64_a_3_0.flipH, undefined);
    assert.ok(json.assets.blob_64_sd_0_0 && json.assets.blob_64_sd_7_0.source === 'blob_64_sd_0_0');
    assert.equal(vis.animations[0].layers[0].frameRepeat, 3);
    assert.equal(vis.animations[0].layers[0].loopCount, 0);

    // Every asset without a source has its image in the spritesheet.
    for(const [name, asset] of Object.entries(json.assets)) if(!asset.source) assert.ok(json.spritesheet.frames[`blob_${name}`], name);
});

test('a PNG grid with all five animations gives the atk/hit gestures and the ded posture, played once', async () =>
{
    const rows = 5, sheet = Buffer.alloc(W * 2 * H * rows * 4);

    for(let row = 0; row < rows; row++)
    {
        for(let f = 0; f < 2; f++)
        {
            const cell = block(4 + f * 2, 3 + row);

            for(let y = 0; y < H; y++) cell.copy(sheet, ((row * H + y) * W * 2 + f * W) * 4, y * W * 4, (y + 1) * W * 4);
        }
    }

    const png = await sharp(sheet, {raw: {width: W * 2, height: H * rows, channels: 4}}).png().toBuffer();
    const animations = Object.fromEntries(['idle', 'walk', 'attack', 'hit', 'death'].map((name, row) => [name, {row, frames: 2, ms: 82}]));
    const dir = folder({'monster.json': JSON.stringify({id: 'grid', sheet: 'grid.png', cell: [W, H], anchor: [6, 9], animations}), 'grid.png': png});
    const {id, nitro} = await buildMonster(dir);
    const files = readNitro(nitro);
    const json = JSON.parse(files['grid.json']);
    const vis = json.visualizations[0];

    assert.equal(id, 'grid');
    assert.ok(files['grid.png'].subarray(1, 4).toString() === 'PNG');
    assert.deepEqual(vis.gestures, [{id: 'atk', animationId: 2}, {id: 'hit', animationId: 3}]);
    assert.deepEqual(vis.postures.postures.map(p => p.id), ['std', 'mv', 'ded']);

    for(const index of [2, 3, 4]) assert.equal(vis.animations[index].layers[0].loopCount, 1);
});

test('a broken source is refused: missing walk, empty frame, bad direction', async () =>
{
    const one = {duration: 100, data: block(4, 4)};
    const noWalk = folder({
        'monster.json': JSON.stringify({id: 'nowalk', aseprite: 'a.aseprite', anchor: [6, 9]}),
        'a.aseprite': writeAseprite({width: W, height: H, frames: [one], tags: [{name: 'idle', from: 0, to: 0}]})
    });

    await assert.rejects(loadSource(noWalk), /"walk" is required/);

    const empty = folder({
        'monster.json': JSON.stringify({id: 'empty', aseprite: 'a.aseprite', anchor: [6, 9]}),
        'a.aseprite': writeAseprite({width: W, height: H, frames: [one, {duration: 100, data: Buffer.alloc(W * H * 4)}], tags: [{name: 'idle', from: 0, to: 0}, {name: 'walk', from: 1, to: 1}]})
    });

    const loaded = await loadSource(empty);

    assert.throws(() => compileMonster(loaded), /is empty/);

    const badDirection = folder({'monster.json': JSON.stringify({id: 'bad', aseprite: 'a.aseprite', anchor: [6, 9], directions: [9]})});

    await assert.rejects(loadSource(badDirection), /"directions"/);
});
