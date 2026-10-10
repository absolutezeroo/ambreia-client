// packages/vortex-client/tools/lib/aseprite.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readAseprite, readAsepriteLayers, writeAseprite} from './aseprite.mjs';

const W = 4, H = 3;
const pixel = (x, y, colour) =>
{
    const b = Buffer.alloc(W * H * 4);

    b.writeUInt32BE(colour, (y * W + x) * 4);
    return b;
};

test('several layers round-trip, hidden ones too; the flattened image shows the visible ones in order', () =>
{
    const buffer = writeAseprite({
        width: W, height: H,
        layers: [{name: 'forme', visible: false}, {name: 'peinture', visible: true}, {name: 'retouche', visible: true}],
        frames: [{duration: 120, cels: [pixel(0, 0, 0xff0000ff), pixel(1, 1, 0x00ff00ff), pixel(1, 1, 0x0000ffff)]}, {duration: 80, cels: [null, pixel(2, 2, 0x00ff00ff), null]}],
        tags: [{name: 'idle_0', from: 0, to: 1}]
    });
    const layered = readAsepriteLayers(buffer);

    assert.deepEqual(layered.layers.map(l => [l.name, l.visible]), [['forme', false], ['peinture', true], ['retouche', true]]);
    assert.equal(layered.frames[0].cels[0].readUInt32BE(0), 0xff0000ff);
    assert.equal(layered.frames[1].cels[2], null);
    assert.deepEqual(layered.tags, [{name: 'idle_0', from: 0, to: 1}]);

    const flat = readAseprite(buffer);

    assert.equal(flat.frames[0].data.readUInt32BE(0), 0, 'the hidden layer is not flattened');
    assert.equal(flat.frames[0].data.readUInt32BE((1 * W + 1) * 4), 0x0000ffff, 'the upper layer wins');
    assert.equal(flat.frames[1].duration, 80);
});

test('a file with chunks the reader does not know (as Aseprite writes them) still reads', () =>
{
    const original = writeAseprite({width: W, height: H, frames: [{duration: 100, data: pixel(3, 0, 0x123456ff)}]});
    // A colour profile chunk (0x2007) inserted at the start of frame 0.
    const chunk = Buffer.alloc(6 + 16);

    chunk.writeUInt32LE(chunk.length, 0);
    chunk.writeUInt16LE(0x2007, 4);

    const frameHeader = Buffer.from(original.subarray(128, 144));

    frameHeader.writeUInt32LE(frameHeader.readUInt32LE(0) + chunk.length, 0);
    frameHeader.writeUInt16LE(frameHeader.readUInt16LE(6) + 1, 6);
    frameHeader.writeUInt32LE(frameHeader.readUInt32LE(12) + 1, 12);

    const patched = Buffer.concat([original.subarray(0, 128), frameHeader, chunk, original.subarray(144)]);

    patched.writeUInt32LE(patched.length, 0);
    assert.equal(readAseprite(patched).frames[0].data.readUInt32BE(3 * 4), 0x123456ff);
});

test('a layer inside a hidden group, and a reference layer, are not flattened', () =>
{
    const buffer = writeAseprite({
        width: W, height: H,
        layers: [
            {name: 'art', visible: true},
            {name: 'old retouches', visible: false, group: true},
            {name: 'parked', visible: true, level: 1},
            {name: 'reference', visible: true, reference: true}
        ],
        frames: [{duration: 100, cels: [pixel(0, 0, 0x112233ff), null, pixel(1, 0, 0xff0000ff), pixel(2, 0, 0x00ff00ff)]}]
    });
    const flat = readAseprite(buffer).frames[0].data;

    assert.equal(flat.readUInt32BE(0), 0x112233ff);
    assert.equal(flat.readUInt32BE(4), 0, 'the hidden group hides its child');
    assert.equal(flat.readUInt32BE(8), 0, 'a reference layer is not art');
    assert.deepEqual(readAsepriteLayers(buffer).layers.map(l => l.visible), [true, false, false, false]);
});
