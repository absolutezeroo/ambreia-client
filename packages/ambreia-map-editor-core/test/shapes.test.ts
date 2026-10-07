// Pointing at world elements in the view: which cells an element covers, moving it, giving it a
// drawn shape (rectangle or polygon).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {elementCells} from '../src/zone/elementCells';
import {elementAt} from '../src/zone/elementAt';
import {translateElement} from '../src/zone/translateElement';
import {withShape} from '../src/zone/withShape';
import {cellsInPolygon} from '../src/zone/cellsInPolygon';
import {blankZone} from '../src/zone/blankZone';
import {newElement} from '../src/zone/newElement';
import {addElement} from '../src/commands/addElement';

test('a polygon covers the cells whose centre is inside it, edges included', () =>
{
    const square = [{x: 1, y: 1}, {x: 3, y: 1}, {x: 3, y: 3}, {x: 1, y: 3}];

    assert.equal(cellsInPolygon(square, 10, 10).length, 9);
    assert.deepEqual(cellsInPolygon([{x: 0, y: 0}, {x: 2, y: 0}, {x: 0, y: 2}], 10, 10).map(c => `${c.x},${c.y}`).sort(),
        ['0,0', '0,1', '0,2', '1,0', '1,1', '2,0']);
});

test('elements know their cells and are found from one of them', () =>
{
    let doc = blankZone('v', 'V', 10, 10);

    doc = addElement('npcs', newElement('npcs', doc, {x: 4, y: 4})).apply(doc);
    doc = addElement('zones', newElement('zones', doc, {x: 1, y: 1})).apply(doc);

    assert.deepEqual(elementCells(doc.npcs![0], doc), [{x: 4, y: 4}]);
    assert.equal(elementCells(doc.zones![0], doc).length, 9);
    assert.equal(elementAt(doc, 'npcs', 4, 4)?.id, 'npc_1');
    assert.equal(elementAt(doc, 'zones', 2, 3)?.id, 'area_1');
    assert.equal(elementAt(doc, 'zones', 7, 7), null);
});

test('moving an element shifts every point it has, and stays on the floor', () =>
{
    const doc = blankZone('v', 'V', 10, 10);
    const area = newElement('zones', doc, {x: 1, y: 1});
    const moved = translateElement(area, 2, 1, doc.floor);

    assert.deepEqual(moved.polygon, [{x: 3, y: 2}, {x: 5, y: 2}, {x: 5, y: 4}, {x: 3, y: 4}]);
    assert.equal(translateElement(area, 20, 0, doc.floor), area);
});

test('a drawn rectangle becomes an area polygon, or the cell list of a spawn', () =>
{
    const doc = blankZone('v', 'V', 10, 10);
    const rect = [{x: 2, y: 2}, {x: 4, y: 2}, {x: 4, y: 3}, {x: 2, y: 3}];

    assert.deepEqual(withShape('zones', newElement('zones', doc, {x: 0, y: 0}), rect, doc.floor).polygon, rect);
    assert.equal(withShape('spawns', newElement('spawns', doc, {x: 0, y: 0}), rect, doc.floor).area.length, 6);
});
