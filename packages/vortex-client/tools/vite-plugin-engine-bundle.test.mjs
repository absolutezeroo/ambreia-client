import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ENGINE_ALIAS_RE, workspaceAliases } from './vite-plugin-engine-bundle.mjs';

test('every packages/ambreia-* with a src folder joins the engine graph, nothing else does', () =>
{
    const root = mkdtempSync(join(tmpdir(), 'packages-'));

    for(const dir of ['ambreia-common/src', 'ambreia-avatar/src', 'ambreia-empty', 'vortex-client/src']) mkdirSync(join(root, dir), { recursive: true });

    const aliases = workspaceAliases(root);

    assert.deepEqual(Object.keys(aliases).sort(), ['@ambreia/avatar', '@ambreia/common']);
    assert.ok(aliases['@ambreia/avatar'].endsWith('/ambreia-avatar/src'));
});

test('a new package needs no regex edit to be routed to the bundle', () =>
{
    assert.ok(ENGINE_ALIAS_RE.test('@ambreia/avatar/AvatarImage'));
    // The engine aliases went with J6: the game is @ambreia/game.
    assert.ok(!ENGINE_ALIAS_RE.test('@core/runtime/Component'));
    assert.ok(!ENGINE_ALIAS_RE.test('@ambreiax/thing'));
});
