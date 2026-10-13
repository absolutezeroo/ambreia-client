// The bottom bar's parts (features/hud/actionbar/): the cooldown ticker.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CooldownTicker} from '../src/features/hud/actionbar/CooldownTicker';

test('the ticker runs while a cooldown runs, once, and stops when the last one ends', () =>
{
    let started = 0;
    let stopped = 0;
    let tick: (() => void) | null = null;
    let running = true;
    const ticker = new CooldownTicker(() => running, {
        every: run => { started++; tick = run; return started; },
        stop: () => { stopped++; tick = null; }
    });

    ticker.sync(true);
    ticker.sync(true);
    assert.equal(started, 1);

    tick!();
    assert.equal(stopped, 0);

    running = false;
    tick!();
    assert.equal(stopped, 1);
    assert.equal(tick, null);

    ticker.sync(true);
    ticker.sync(false);
    assert.deepEqual([started, stopped], [2, 2]);
});
