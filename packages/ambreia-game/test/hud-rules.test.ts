import {test} from 'node:test';
import assert from 'node:assert/strict';
import {expiring, lowHp, placeTip, unavailable} from '../src/ui/kit/hudRules';

test('a party member is in danger under a quarter of their health, never when dead or unknown', () =>
{
    assert.equal(lowHp(320, 1650), true);
    assert.equal(lowHp(413, 1650), false, 'a quarter exactly is not low');
    assert.equal(lowHp(0, 1650), false, 'dead is its own state');
    assert.equal(lowHp(null, 1650), false);
    assert.equal(lowHp(10, 0), false);
});

test('an effect expires under five seconds; one without end never does', () =>
{
    assert.equal(expiring(4_999), true);
    assert.equal(expiring(5_000), false);
    assert.equal(expiring(null), false);
});

test('a slot is unavailable when its mana cost is known and above the mana', () =>
{
    assert.equal(unavailable(20, 15), true);
    assert.equal(unavailable(20, 20), false);
    assert.equal(unavailable(null, 0), false, 'no cost known: nothing to refuse');
    assert.equal(unavailable(20, null), false, 'no mana known yet');
});

test('a tooltip sits below-right of the pointer and flips to stay on the desktop', () =>
{
    assert.deepEqual(placeTip(100, 100, 240, 80, 1280, 800), {x: 114, y: 114});
    assert.deepEqual(placeTip(1200, 100, 240, 80, 1280, 800), {x: 946, y: 114}, 'flipped left of the pointer');
    assert.deepEqual(placeTip(100, 780, 240, 80, 1280, 800), {x: 114, y: 686}, 'flipped above the pointer');
    assert.deepEqual(placeTip(5, 5, 240, 80, 200, 50), {x: 0, y: 0}, 'a desktop too small clamps to its corner');
});
