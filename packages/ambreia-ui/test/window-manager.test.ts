import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setPlatform} from '@ambreia/common/platform/Platform';
import {parseHTML} from 'linkedom';
import {createCanvas} from '@napi-rs/canvas';
import {nodePlatform} from '../../ambreia-avatar/tools/node-platform.mjs';
import {WindowManager} from '../src/kit/WindowManager';
import type {IWindowUpdateReceiver} from '../src/IWindowUpdateReceiver';

// The window system without the engine: no Component, no DI, only the host's options (spec §11).
// It stays browser-side (plan D4): the cursor, the XML walk and the drawing read `document`,
// `Element` and `OffscreenCanvas`, given here by linkedom and @napi-rs/canvas.
setPlatform(nodePlatform());
const dom = parseHTML('<html><body></body></html>');
Object.assign(globalThis, {
    document: dom.document,
    Document: dom.Document,
    Element: dom.Element,
    OffscreenCanvas: function OffscreenCanvas(width: number, height: number) { return createCanvas(Math.max(1, width), Math.max(1, height)); }
});

const host = {width: 800, height: 600, addEventListener: (): void => undefined, removeEventListener: (): void => undefined};

function manager(): WindowManager
{
    const wm = new WindowManager({interpolate: (text: string) => text, resizeHost: host});

    wm.initialize();

    return wm;
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
