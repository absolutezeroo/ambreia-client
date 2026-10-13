// The target frame's close button asks the server to clear the target; any other HUD update must not.
// Live, the model's own target event refreshed the target-of-target frame first, and that update
// (target still null in the HUD) cleared every target the server had just confirmed.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HudTargetClose} from '../src/features/interaction/HudTargetClose';

const frame = {name: 'Loup des bois'};

test('an update while the HUD has no target yet clears nothing', () =>
{
    const sent: number[] = [];
    const close = new HudTargetClose(id => sent.push(id));

    close.changed(null);
    close.changed(null);

    assert.deepEqual(sent, []);
});

test('the frame going from a target to none clears the target once', () =>
{
    const sent: number[] = [];
    const close = new HudTargetClose(id => sent.push(id));

    close.changed(frame);
    close.changed(frame);
    close.changed(null);
    close.changed(null);

    assert.deepEqual(sent, [0]);
});
