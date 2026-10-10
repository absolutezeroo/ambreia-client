// Map editor spec §2: each action is a pure document → document function.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {placeDecor} from '../src/commands/placeDecor';
import {rotateDecor} from '../src/commands/rotateDecor';
import {moveDecor} from '../src/commands/moveDecor';
import {removeDecor} from '../src/commands/removeDecor';
import {editTiles} from '../src/commands/editTiles';
import {resizeFloor} from '../src/commands/resizeFloor';
import {moveDoor} from '../src/commands/moveDoor';
import {setFloorThickness} from '../src/commands/setFloorThickness';
import {blankZone} from '../src/zone/blankZone';
import {tileAt} from '../src/zone/zoneGeometry';

const throne = {definition: 230, class: 'throne', x: 1, y: 1};

test('placed objects get the first free id of their class', () =>
{
    let doc = blankZone('v', 'V');

    doc = placeDecor(throne).apply(doc);
    doc = placeDecor(throne).apply(doc);

    assert.deepEqual(doc.decor!.map(o => o.id), ['throne_1', 'throne_2']);
});

test('rotation cycles 0, 2, 4, 6', () =>
{
    let doc = placeDecor(throne).apply(blankZone('v', 'V'));
    const seen: number[] = [];

    for (let i = 0; i < 4; i++)
    {
        doc = rotateDecor(['throne_1']).apply(doc);
        seen.push(doc.decor![0].rotation!);
    }

    assert.deepEqual(seen, [2, 4, 6, 0]);
});

test('a locked object neither moves nor goes away', () =>
{
    const doc = placeDecor({...throne, locked: true}).apply(blankZone('v', 'V'));

    assert.equal(moveDecor(['throne_1'], 1, 1).apply(doc), doc);
    assert.equal(removeDecor(['throne_1']).apply(doc), doc);
});

test('a floor stroke clamps heights to 0..32 and leaves the input untouched', () =>
{
    const doc = blankZone('v', 'V', 4, 4);
    const raised = editTiles('Monter', [{x: 1, y: 1}, {x: 9, y: 9}], t => ({...t, height: (t.height ?? 0) + 40})).apply(doc);

    assert.equal(tileAt(raised.floor, 1, 1)!.height, 32);
    assert.equal(tileAt(doc.floor, 1, 1)!.height, undefined);
    assert.equal(editTiles('Rien', [{x: 1, y: 1}], t => t).apply(doc), doc);
});

test('a tile added past the far edges grows the floor, the rest of the new band a hole', () =>
{
    const doc = blankZone('v', 'V', 4, 4);
    const grown = editTiles('Ajouter', [{x: 5, y: 1}], t => ({...t, hole: false, height: 2})).apply(doc);

    assert.deepEqual([grown.floor.width, grown.floor.length], [6, 4]);
    assert.equal(tileAt(grown.floor, 5, 1)!.height, 2);
    assert.equal(tileAt(grown.floor, 5, 1)!.hole, false);
    assert.equal(tileAt(grown.floor, 4, 1)!.hole, true);
    // Digging or raising the void adds no floor.
    assert.equal(editTiles('Monter', [{x: 5, y: 1}], t => ({...t, height: 3})).apply(doc), doc);
    assert.equal(editTiles('Ajouter', [{x: -1, y: 0}, {x: 64, y: 0}], t => ({...t, hole: false})).apply(doc), doc);
});

test('resizing keeps the tiles that remain', () =>
{
    const doc = editTiles('Trou', [{x: 1, y: 2}], t => ({...t, hole: true})).apply(blankZone('v', 'V', 4, 4));
    const bigger = resizeFloor(6, 5).apply(doc);

    assert.equal(bigger.floor.tiles.length, 30);
    assert.equal(tileAt(bigger.floor, 1, 2)!.hole, true);
    assert.equal(tileAt(bigger.floor, 5, 4)!.hole, undefined);
    assert.equal(resizeFloor(99, 0).apply(doc).floor.width, 64);
});

test('the door stays on the floor', () =>
{
    const doc = blankZone('v', 'V', 4, 4);

    assert.equal(moveDoor(7, 0).apply(doc), doc);
    assert.deepEqual(moveDoor(3, 0).apply(doc).floor.door, {x: 3, y: 0});
});

test('the floor thickness changes the floor alone, and the same value is no history', () =>
{
    const doc = blankZone('v', 'V');
    const thin = setFloorThickness(-2).apply(doc);

    assert.equal(thin.floor.thickness, -2);
    assert.equal(thin.floor.tiles, doc.floor.tiles);
    assert.equal(setFloorThickness(0).apply(doc), doc);
    assert.equal(setFloorThickness(-2).apply(thin), thin);
});
