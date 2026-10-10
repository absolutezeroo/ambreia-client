// A frame's header close button is one event, not a button name every feature matches: WE_CLOSE
// (cancelable), the frame hides, WE_CLOSED. A feature that wants something else prevents it.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodeWindowManager} from './node-window-host';
import {WindowEvent} from '../src/events/WindowEvent';
import {WindowMouseEvent} from '../src/events/WindowMouseEvent';
import type {WindowController} from '../src/WindowController';
import type {IFrameWindow} from '../src/components/IFrameWindow';

const FRAME_XML = '<layout><window><frame name="probe_frame" x="0" y="0" width="120" height="80">'
    + '<children><closebutton name="header_button_close" x="100" y="4" width="15" height="16"/></children>'
    + '</frame></window></layout>';

function frame(): {frame: IFrameWindow; click(): void; dispose(): void}
{
    const wm = nodeWindowManager();

    wm.registerWidgetLayout('probe_frame_xml', FRAME_XML);

    const window = wm.buildWidgetLayout('probe_frame_xml') as unknown as IFrameWindow;
    const button = window.findChildByName('header_button_close') as unknown as WindowController;

    assert.ok(button, 'the layout has its close button');

    return {
        frame: window,
        click(): void
        {
            const event = WindowMouseEvent.allocateMouse(WindowMouseEvent.CLICK, button, null);

            button.update(button, event);
            event.recycle();
        },
        dispose: () => wm.dispose()
    };
}

test('the close button raises WE_CLOSE, hides the frame and raises WE_CLOSED', () =>
{
    const t = frame();
    const seen: string[] = [];

    t.frame.addEventListener(WindowEvent.WE_CLOSE, (event: WindowEvent) => seen.push(event.type));
    t.frame.addEventListener(WindowEvent.WE_CLOSED, (event: WindowEvent) => seen.push(event.type));

    t.click();

    assert.equal(t.frame.visible, false);
    assert.deepEqual(seen, [WindowEvent.WE_CLOSE, WindowEvent.WE_CLOSED]);

    t.dispose();
});

test('a WE_CLOSE listener that prevents the default keeps the frame open', () =>
{
    const t = frame();
    let closed = 0;

    t.frame.addEventListener(WindowEvent.WE_CLOSE, (event: WindowEvent) => event.preventDefault());
    t.frame.addEventListener(WindowEvent.WE_CLOSED, () => closed++);

    t.click();

    assert.equal(t.frame.visible, true);
    assert.equal(closed, 0);
    assert.equal(t.frame.close(), false);

    t.dispose();
});

test('a feature procedure on the button still runs, and a destroyed frame closes quietly', () =>
{
    const t = frame();
    const button = t.frame.findChildByName('header_button_close')!;
    let clicks = 0;

    button.procedure = (event: WindowEvent) => { if(event.type === WindowMouseEvent.CLICK) clicks++; };
    t.frame.addEventListener(WindowEvent.WE_CLOSE, () => t.frame.destroy());

    t.click();

    assert.equal(clicks, 1);
    assert.equal(t.frame.disposed, true);

    t.dispose();
});
