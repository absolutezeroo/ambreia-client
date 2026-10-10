import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sheetEntry, render, isUpToDate} from './build-vfx-sheets.mjs';

const pixellab = (w, h, count, imageW, anchor, ms = 83) => ({
    frames: Array.from({length: count}, (_, i) => ({frame: {x: (i % 3) * w, y: Math.floor(i / 3) * h, w, h}, duration: ms})),
    meta: {size: {w: imageW, h: 0}, anchor: {kind: 'origin', ...anchor}}
});

test('a sheet entry reads the grid and the anchor', () =>
{
    // energy-orb: 8 frames of 48 px, 3 per row, centred.
    assert.deepEqual(sheetEntry('mage/energy-orb', pixellab(48, 48, 8, 144, {x: 24, y: 24})),
        {width: 48, height: 48, columns: 3, frames: 8, ms: 83, anchorX: 24, anchorY: 24});
    // power-aura: taller than wide, anchored near its bottom.
    assert.deepEqual(sheetEntry('mage/power-aura', pixellab(66, 107, 8, 198, {x: 33, y: 89})),
        {width: 66, height: 107, columns: 3, frames: 8, ms: 83, anchorX: 33, anchorY: 89});
});

test('the generated module is sorted and typed as const', () =>
{
    const out = render(new Map([['mage/z', sheetEntry('mage/z', pixellab(8, 8, 1, 8, {x: 4, y: 4}))], ['mage/a', sheetEntry('mage/a', pixellab(8, 8, 1, 8, {x: 4, y: 4}))]]));

    assert.ok(out.indexOf("'mage/a'") < out.indexOf("'mage/z'"));
    assert.match(out, /export const VFX_SHEETS = \{[\s\S]*\} as const;/);
});

test('--check compares the committed module with what the sheets render to', () =>
{
    const sheets = new Map([['mage/a', sheetEntry('mage/a', pixellab(8, 8, 1, 8, {x: 4, y: 4}))]]);
    const dir = mkdtempSync(join(tmpdir(), 'vfx-check-'));
    const out = join(dir, 'vfxSheets.generated.ts');

    assert.equal(isUpToDate(sheets, out), false, 'a missing file is stale');

    writeFileSync(out, render(sheets));
    assert.equal(isUpToDate(sheets, out), true);

    writeFileSync(out, render(sheets) + '\n// edited by hand');
    assert.equal(isUpToDate(sheets, out), false, 'a hand edit is stale');

    rmSync(dir, {recursive: true, force: true});
});
