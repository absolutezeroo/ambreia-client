// Map editor spec §2: local checks use the server's codes.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateLocally} from '../src/validation/validateLocally';
import {blankZone} from '../src/zone/blankZone';
import {editTiles} from '../src/commands/editTiles';
import {placeDecor} from '../src/commands/placeDecor';
import type {IFootprint} from '../src/zone/IFootprint';

const sizes = new Map<number, IFootprint>([[230, {width: 1, length: 1}], [28, {width: 2, length: 1}]]);
const codes = (doc: Parameters<typeof validateLocally>[0]) => validateLocally(doc, d => sizes.get(d) ?? null).map(f => f.code);

test('a blank zone is valid', () => assert.deepEqual(codes(blankZone('v', 'V')), []));

test('a door on a hole is refused', () =>
{
    const doc = blankZone('v', 'V', 6, 6);

    assert.deepEqual(codes(editTiles('Trou', [doc.floor.door], t => ({...t, hole: true})).apply(doc)), ['DoorNotWalkable']);
});

test('a two-wide sofa turned at the far edge leaves the floor', () =>
{
    const sofa = {definition: 28, class: 'sofa', x: 5, y: 4};
    const doc = blankZone('v', 'V', 6, 6);

    assert.deepEqual(codes(placeDecor(sofa).apply(doc)), ['OutOfFloor']);
    assert.deepEqual(codes(placeDecor({...sofa, rotation: 2}).apply(doc)), []);
});

test('an unknown furniture and a duplicate id are reported', () =>
{
    const doc = placeDecor({definition: 999, class: 'x', x: 0, y: 0}).apply(blankZone('v', 'V'));
    const twice = {...doc, decor: [...doc.decor!, {...doc.decor![0], definition: 230}]};

    assert.deepEqual(codes(twice).sort(), ['DuplicateId', 'UnknownFurniture']);
});
