// Lot A of the mock-ups: copy/paste, locking, furni properties, room settings, templates, fill,
// player spawns.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blankZone} from '../src/zone/blankZone';
import {placeDecor} from '../src/commands/placeDecor';
import {pasteDecor} from '../src/commands/pasteDecor';
import {setDecorLocked} from '../src/commands/setDecorLocked';
import {patchDecor} from '../src/commands/patchDecor';
import {updateSettings} from '../src/commands/updateSettings';
import {replaceFloor} from '../src/commands/replaceFloor';
import {toggleSpawn} from '../src/commands/toggleSpawn';
import {moveDecor} from '../src/commands/moveDecor';
import {editTiles} from '../src/commands/editTiles';
import {fillCells} from '../src/zone/fillCells';
import {FLOOR_TEMPLATES} from '../src/zone/FLOOR_TEMPLATES';
import {tileAt} from '../src/zone/zoneGeometry';

const throne = {definition: 230, class: 'throne', x: 1, y: 1};

test('pasted objects get fresh ids and keep their spacing', () =>
{
    let doc = placeDecor(throne).apply(blankZone('v', 'V'));
    doc = placeDecor({...throne, x: 2}).apply(doc);

    const copied = doc.decor!;
    doc = pasteDecor(copied, 3, 3).apply(doc);

    assert.deepEqual(doc.decor!.map(o => [o.id, o.x, o.y]), [
        ['throne_1', 1, 1], ['throne_2', 2, 1], ['throne_3', 4, 4], ['throne_4', 5, 4]
    ]);
});

test('a pasted object is never locked, even when its source was', () =>
{
    const doc = placeDecor({...throne, locked: true}).apply(blankZone('v', 'V'));

    assert.equal(pasteDecor(doc.decor!, 1, 0).apply(doc).decor![1].locked, false);
});

test('locking pins the position until it is unlocked', () =>
{
    let doc = setDecorLocked(['throne_1'], true).apply(placeDecor(throne).apply(blankZone('v', 'V')));

    assert.equal(moveDecor(['throne_1'], 1, 0).apply(doc), doc);
    doc = setDecorLocked(['throne_1'], false).apply(doc);
    assert.equal(moveDecor(['throne_1'], 1, 0).apply(doc).decor![0].x, 2);
});

test('furni properties change through one labelled command', () =>
{
    const doc = placeDecor(throne).apply(blankZone('v', 'V'));
    const command = patchDecor('throne_1', {tag: 'royal', interaction: 'sit', collision: {walkable: false, seat: true}});
    const o = command.apply(doc).decor![0];

    assert.equal(command.label, 'Propriétés de throne_1');
    assert.deepEqual([o.tag, o.interaction, o.collision], ['royal', 'sit', {walkable: false, seat: true}]);
    assert.equal(patchDecor('throne_1', {tag: undefined}).apply(doc), doc);
});

test('room settings merge, and an unchanged value is no history', () =>
{
    const doc = blankZone('v', 'V');
    const next = updateSettings({capacity: 50, pvpAllowed: true}).apply(doc);

    assert.deepEqual([next.settings.capacity, next.settings.pvpAllowed, next.settings.id], [50, true, 'v']);
    assert.equal(updateSettings({name: 'V'}).apply(doc), doc);
});

test('a template replaces the floor and keeps the door on a walkable tile', () =>
{
    for(const template of FLOOR_TEMPLATES)
    {
        const doc = replaceFloor(template.label, template.build()).apply(blankZone('v', 'V'));
        const {x = 0, y = 0} = doc.floor.door;
        const door = tileAt(doc.floor, x, y)!;

        assert.equal(doc.floor.tiles.length, doc.floor.width * doc.floor.length, template.label);
        assert.ok(!door.hole && door.walkable !== false, `${template.label}: door on (${x},${y})`);
    }
});

test('fill takes the connected cells of the same kind, not the ones behind a wall', () =>
{
    let doc = blankZone('v', 'V', 5, 5);
    doc = editTiles('Mur', [0, 1, 2, 3, 4].map(y => ({x: 2, y})), t => ({...t, height: 3})).apply(doc);

    const cells = fillCells(doc.floor, 0, 0);

    assert.equal(cells.length, 10);
    assert.ok(cells.every(c => c.x < 2));
});

test('a player spawn toggles on a cell', () =>
{
    let doc = toggleSpawn(3, 4).apply(blankZone('v', 'V'));

    assert.deepEqual(doc.entries!.map(e => [e.kind, e.cell]), [['arrival', {x: 3, y: 4}]]);
    doc = toggleSpawn(3, 4).apply(doc);
    assert.deepEqual(doc.entries, []);
});
