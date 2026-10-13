import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ToastQueue} from '../src/features/hud/ToastQueue';
import type {IToast} from '../src/features/hud/IToast';

const toast = (title: string, ms = 1000): IToast => ({kind: 'info', title, text: '', ms});

test('three toasts at most, the rest wait their turn', () =>
{
    const queue = new ToastQueue(3);

    for(let i = 0; i < 5; i++) queue.push(toast(String(i), 1000 + i), 0);
    assert.deepEqual(queue.visible.map(t => t.title), ['0', '1', '2']);

    assert.equal(queue.tick(1000), true);
    assert.deepEqual(queue.visible.map(t => t.title), ['1', '2', '3']);
});

test('a waiting toast\'s time starts when it shows, not when it was pushed', () =>
{
    const queue = new ToastQueue(1);

    queue.push(toast('a', 1000), 0);
    queue.push(toast('b', 1000), 0);
    queue.tick(1000);
    queue.tick(1500);
    assert.deepEqual(queue.visible.map(t => t.title), ['b']);
    assert.equal(queue.tick(1999), false);
    queue.tick(2000);
    assert.deepEqual(queue.visible, []);
});

test('the same toast again restarts the shown one instead of stacking', () =>
{
    const queue = new ToastQueue(3);

    queue.push(toast('refused'), 0);
    assert.equal(queue.push(toast('refused'), 800), false);
    assert.equal(queue.visible.length, 1);
    queue.tick(1500);
    assert.deepEqual(queue.visible.map(t => t.title), ['refused']);
});
