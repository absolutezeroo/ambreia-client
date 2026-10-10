import {test} from 'node:test';
import assert from 'node:assert/strict';
import {devHook, isProductionBuild} from '../src/utils/BuildEnv';

const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

test('Node is not a production build, so a dev hook is published and merged with the others', () =>
{
    assert.equal(isProductionBuild(), false);

    assert.equal(devHook('probe_a', 1), true);
    assert.equal(devHook('probe_b', 2), true);
    assert.equal(root.__ambreia?.probe_a, 1);
    assert.equal(root.__ambreia?.probe_b, 2);
});

test('a production build publishes nothing', () =>
{
    delete root.__ambreia;

    assert.equal(devHook('probe_c', 3, true), false);
    assert.equal(root.__ambreia, undefined);
});
