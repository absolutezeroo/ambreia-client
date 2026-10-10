import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IRoomObject} from '../src/object/IRoomObject';
import {RoomRenderingCanvas} from '../src/scene/renderer/RoomRenderingCanvas';

/** A room object of this type, with these number variables in its model. */
const object = (type: string, numbers: Record<string, number> = {}): IRoomObject =>
    ({getType: () => type, getModel: () => ({hasNumber: (key: string) => key in numbers})}) as unknown as IRoomObject;
const isFurni = (o: IRoomObject): boolean => RoomRenderingCanvas['isFurni'](o);

// Only a furni fades when it hides the player and hides an avatar into an x-ray (updateOcclusion()).
test('a pet or monster is no furni, though its object is typed by its content type', () =>
{
    assert.equal(isFurni(object('monster_grove_guardian', {pet_type: 40})), false);
    assert.equal(isFurni(object('dog', {pet_type: 0})), false);
    assert.equal(isFurni(object('user')), false);
    assert.equal(isFurni(object('room')), false);
    assert.equal(isFurni(object('rare_dragonlamp')), true);
});
