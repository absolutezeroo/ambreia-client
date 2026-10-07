// The layer walls of docs/superpowers/specs/2026-10-07-client-architecture-design.md §3, as enforced
// by eslint.config.mjs. Each probe lints a one-line file at a path that does not exist on disk.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const eslint = new ESLint({ cwd: REPO });

async function wallHits(code, relativePath)
{
    const [result] = await eslint.lintText(code, { filePath: join(REPO, relativePath) });

    return result.messages.filter(m => m.ruleId === 'no-restricted-imports');
}

test('core: alias import of habbo is refused', async () =>
{
    const hits = await wallHits("import {RoomEngine} from '@habbo/room/RoomEngine';\nexport {RoomEngine};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(hits.length, 1);
});

test('core: relative import of habbo is refused', async () =>
{
    const hits = await wallHits("import {RoomEngine} from '../../habbo/room/RoomEngine';\nexport {RoomEngine};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(hits.length, 1);
});

test('core: type-only import of habbo is refused', async () =>
{
    const hits = await wallHits("import type {IRoomEngine} from '@habbo/room/IRoomEngine';\nexport type {IRoomEngine};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(hits.length, 1);
});

test('core: room/ and the Vortex entry points are refused', async () =>
{
    const room = await wallHits("import {Vector3d} from '@room/utils/Vector3d';\nexport {Vector3d};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');
    const entry = await wallHits("import {Vortex} from '../Vortex';\nexport {Vortex};\n",
        'packages/vortex-engine/src/core/Probe.ts');

    assert.equal(room.length, 1);
    assert.equal(entry.length, 1);
});

test('core: the client wall still holds inside core', async () =>
{
    const hits = await wallHits("import {X} from '@ui/window/X';\nexport {X};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(hits.length, 1);
});

test('room: habbo is refused', async () =>
{
    const hits = await wallHits("import {RoomEngine} from '@habbo/room/RoomEngine';\nexport {RoomEngine};\n",
        'packages/vortex-engine/src/room/object/Probe.ts');

    assert.equal(hits.length, 1);
});

test('habbo: the client is refused', async () =>
{
    const hits = await wallHits("import {App} from '@/App';\nexport {App};\n",
        'packages/vortex-engine/src/habbo/room/Probe.ts');

    assert.equal(hits.length, 1);
});

test('habbo: core and room are allowed', async () =>
{
    const hits = await wallHits("import {Logger} from '@core/utils/Logger';\nimport {Vector3d} from '@room/utils/Vector3d';\nexport {Logger, Vector3d};\n",
        'packages/vortex-engine/src/habbo/room/Probe.ts');

    assert.equal(hits.length, 0);
});
