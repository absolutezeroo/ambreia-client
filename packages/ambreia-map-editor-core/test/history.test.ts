// Map editor spec §2: undo and redo restore snapshots; a no-op is not history.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorHistory} from '../src/history/EditorHistory';
import {placeDecor} from '../src/commands/placeDecor';
import {moveDecor} from '../src/commands/moveDecor';
import {blankZone} from '../src/zone/blankZone';

const throne = {definition: 230, class: 'throne', x: 1, y: 1};

test('undo and redo walk back and forth through the documents', () =>
{
    const start = blankZone('village', 'Village');
    const h = new EditorHistory(start);

    h.execute(placeDecor(throne));
    const placed = h.current;
    h.execute(moveDecor(['throne_1'], 2, 0));

    assert.deepEqual(h.done, ['Poser throne', 'Déplacer throne_1']);
    assert.equal(h.current.decor![0].x, 3);

    h.undo();
    assert.equal(h.current, placed);
    h.undo();
    assert.equal(h.current, start);
    assert.equal(h.canUndo, false);
    assert.deepEqual(h.undone, ['Poser throne', 'Déplacer throne_1']);

    h.redo();
    h.redo();
    assert.equal(h.current.decor![0].x, 3);
});

test('a new command after an undo drops the redo branch', () =>
{
    const h = new EditorHistory(blankZone('village', 'Village'));

    h.execute(placeDecor(throne));
    h.undo();
    h.execute(placeDecor({...throne, class: 'sofa'}));

    assert.equal(h.canRedo, false);
    assert.deepEqual(h.done, ['Poser sofa']);
});

test('a command that changes nothing is not recorded', () =>
{
    const h = new EditorHistory(blankZone('village', 'Village'));

    assert.equal(h.execute(moveDecor(['nobody'], 1, 0)), false);
    assert.equal(h.canUndo, false);
});

test('dirty until saved, and dirty again after an undo past the save', () =>
{
    const h = new EditorHistory(blankZone('village', 'Village'));

    h.execute(placeDecor(throne));
    assert.equal(h.isDirty, true);
    h.markSaved();
    assert.equal(h.isDirty, false);
    h.undo();
    assert.equal(h.isDirty, true);
});
