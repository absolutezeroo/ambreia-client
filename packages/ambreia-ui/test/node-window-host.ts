import {setPlatform} from '@ambreia/common/platform/Platform';
import {parseHTML} from 'linkedom';
import {createCanvas} from '@napi-rs/canvas';
import {nodePlatform} from '../../ambreia-avatar/tools/node-platform.mjs';
import {WindowManager} from '../src/kit/WindowManager';

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

/** A window manager in Node, with its four layers built. `before` runs ahead of initialize(). */
export function nodeWindowManager(before?: (manager: WindowManager) => void): WindowManager
{
    const manager = new WindowManager({interpolate: (text: string) => text, resizeHost: host});

    before?.(manager);
    manager.initialize();

    return manager;
}
