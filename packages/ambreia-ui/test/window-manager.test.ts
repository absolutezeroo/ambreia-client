import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodeWindowManager} from './node-window-host';
import type {WindowManager} from '../src/kit/WindowManager';
import type {IWindowUpdateReceiver} from '../src/IWindowUpdateReceiver';

function manager(): WindowManager
{
    return nodeWindowManager();
}

function receiver(): IWindowUpdateReceiver & { calls: number }
{
    return {calls: 0, disposed: false, update(): void { this.calls++; }, dispose(): void { this.disposed = true; }};
}

test('initialize builds the four layers', () =>
{
    const wm = manager();

    for(let layer = 0; layer < 4; layer++) assert.ok(wm.getWindowContext(layer), `layer ${layer}`);

    wm.dispose();
});

test('a registered receiver is updated once per update and dropped once disposed', () =>
{
    const wm = manager();
    const r = receiver();

    wm.registerUpdateReceiver(r, 0);
    wm.registerUpdateReceiver(r, 0);
    wm.update(16);
    wm.update(16);
    assert.equal(r.calls, 2);

    r.dispose();
    wm.update(16);
    assert.equal(r.calls, 2);

    wm.dispose();
});

test('a registered layout builds into a window of that name', () =>
{
    const wm = manager();

    wm.registerWidgetLayout('probe_xml', '<layout><window><container name="probe" x="0" y="0" width="40" height="20"/></window></layout>');

    const window = wm.buildWidgetLayout('probe_xml');

    assert.equal(window?.name, 'probe');

    wm.dispose();
});

test('a receiver that throws does not stop the others or the frame', () =>
{
    const wm = manager();
    const broken = {disposed: false, update(): void { throw new Error('boom'); }, dispose(): void { this.disposed = true; }};
    const r = receiver();

    wm.registerUpdateReceiver(broken, 0);
    wm.registerUpdateReceiver(r, 0);

    assert.doesNotThrow(() => wm.update(16));
    assert.equal(r.calls, 1);

    wm.dispose();
});

test('a receiver that removes itself during update does not make the next one skip a frame', () =>
{
    const wm = manager();
    const first = {disposed: false, update(): void { wm.removeUpdateReceiver(first); }, dispose(): void { this.disposed = true; }};
    const r = receiver();

    wm.registerUpdateReceiver(first, 0);
    wm.registerUpdateReceiver(r, 0);
    wm.update(16);

    assert.equal(r.calls, 1);

    wm.dispose();
});
