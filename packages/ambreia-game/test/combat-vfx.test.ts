import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sheetFrames, sheetMs, vfxSheet} from '../src/features/combat/vfxSheets';

test('a sheet is cut left to right, then down, as PixelLab exports it', () =>
{
    // energy-orb.json: 8 frames of 48 px, 3 per row.
    const orb = vfxSheet('mage/energy-orb');

    assert.ok(orb);
    assert.equal(orb.asset, 'rpg/vfx/mage/energy-orb');
    assert.deepEqual(sheetFrames(orb), [
        {x: 0, y: 0}, {x: 48, y: 0}, {x: 96, y: 0},
        {x: 0, y: 48}, {x: 48, y: 48}, {x: 96, y: 48},
        {x: 0, y: 96}, {x: 48, y: 96}
    ]);
    assert.equal(sheetMs(orb), 8 * 83);
});

test('a sheet the client does not ship is null, so the content can name art to come', () =>
{
    assert.equal(vfxSheet('mage/nothing'), null);
    assert.equal(vfxSheet(''), null);
});
