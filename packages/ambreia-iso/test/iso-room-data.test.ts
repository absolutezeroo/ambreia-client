import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRoomData} from '../src/IIsoRoomData';
import type {IIsoRoomData} from '../src/IIsoRoomData';

// The map editor hands iso its zones as they are authored; a bad one must be refused with the
// field named, before anything is built (plan D5, review focus 5).
function room(): IIsoRoomData
{
    const tile = {height: 0, walkable: true, hole: false};

    return {
        floor: {width: 3, length: 3, tiles: Array.from({length: 9}, () => ({...tile})), door: {x: 0, y: 1}, doorDirection: 2},
        decor: [{id: 'throne_1', definition: 1, class: 'throne', x: 1, y: 1, z: 0, rotation: 2, state: '0'}],
        wallDecor: [{id: 7, definition: 4001, class: 'poster', side: 'Left', x: 0, y: 1, offsetX: 8, offsetY: 30, state: '0'}]
    };
}

test('a valid room passes', () =>
{
    assert.equal(validateRoomData(room()), null);
});

test('a room longer than 64 tiles is refused', () =>
{
    const data = room();

    data.floor.length = 65;
    data.floor.tiles = Array.from({length: 3 * 65}, () => ({height: 0, walkable: true, hole: false}));
    assert.equal(validateRoomData(data), 'floor.length > 64');
});

test('a tile list that does not match width × length is refused', () =>
{
    const data = room();

    data.floor.tiles.pop();
    assert.equal(validateRoomData(data), 'floor.tiles has 8 tiles, width × length is 9');
});

test('a rotation outside 0/2/4/6 is refused', () =>
{
    const data = room();

    data.decor[0].rotation = 3;
    assert.equal(validateRoomData(data), 'decor[0].rotation 3 is not 0, 2, 4 or 6');
});

test('a wall side other than Left or Right is refused', () =>
{
    const data = room();

    (data.wallDecor[0] as {side: string}).side = 'Up';
    assert.equal(validateRoomData(data), 'wallDecor[0].side "Up" is not Left or Right');
});

test('a door outside the grid is refused', () =>
{
    const data = room();

    data.floor.door = {x: 3, y: 0};
    assert.equal(validateRoomData(data), 'floor.door (3, 0) is outside the 3 × 3 floor');
});

test('two items with the same id are refused', () =>
{
    const data = room();

    data.decor.push({...data.decor[0]});
    assert.equal(validateRoomData(data), 'decor[1].id "throne_1" is used twice');
});
