// size=icon renders a furni at scale 1, where its visualization draws the `_icon_` assets.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseFurnitureRequest} from '../src/room/FurnitureRequest';

const resolve = (): {type: string; category: number; colorIndex: number} => ({type: 'sofa_silo', category: 10, colorIndex: 2});

test('size=icon builds the request at scale 1, not zoomed', () =>
{
    const request = parseFurnitureRequest({class: 'sofa_silo*2', size: 'icon'}, resolve);

    assert.equal(request.scale, 1);
    assert.equal(request.zoom, 1);
    assert.equal(request.colorIndex, 2);
});

test('an unknown size still falls back to m', () =>
{
    assert.equal(parseFurnitureRequest({class: 'sofa_silo', size: 'huge'}, resolve).scale, 64);
});
