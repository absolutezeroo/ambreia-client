import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auraDiff} from '../src/features/combat/views/auraDiff';
import {AuraLayer} from '../src/features/combat/views/AuraLayer';
import type {IVfxPhase} from '../src/features/combat/IVfx';

const FOCUS: IVfxPhase = {sheet: 'mage/power-aura', attach: 'feet', delayMs: 0};
const aura = (id: string): IVfxPhase | null => id === 'status.focused' ? FOCUS : null;
const status = (statusId: string) => ({statusId, endsAt: null, stacks: 1});

test('an aura starts when its status appears and stops when it goes', () =>
{
    assert.deepEqual(auraDiff(new Set(), [status('status.focused')], aura), {start: ['status.focused'], stop: []});
    assert.deepEqual(auraDiff(new Set(['status.focused']), [], aura), {start: [], stop: ['status.focused']});
    assert.deepEqual(auraDiff(new Set(), [status('status.burn')], aura), {start: [], stop: []});
    assert.deepEqual(auraDiff(new Set(['status.focused']), [status('status.focused')], aura), {start: [], stop: []});
});

test('the layer loops one aura per status and object, and stops them on forget and clear', () =>
{
    const playing = new Set<string>();
    const layer = new AuraLayer((phase, objectId) =>
    {
        const key = `${objectId}:${phase.sheet}`;

        playing.add(key);

        return () => playing.delete(key);
    }, aura);

    layer.update(7, [status('status.focused')]);
    layer.update(7, [status('status.focused')]);
    layer.update(9, [status('status.focused')]);
    assert.deepEqual([...playing], ['7:mage/power-aura', '9:mage/power-aura']);

    layer.forget(7);
    assert.deepEqual([...playing], ['9:mage/power-aura']);

    layer.clear();
    assert.equal(playing.size, 0);
});
