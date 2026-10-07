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

test('core: the IVortex/IVortexMain interfaces are refused too (they import habbo)', async () =>
{
    const vortex = await wallHits("import type {IVortex} from '../IVortex';\nexport type {IVortex};\n",
        'packages/vortex-engine/src/core/Probe.ts');
    const main = await wallHits("import type {IVortexMain} from '../../IVortexMain';\nexport type {IVortexMain};\n",
        'packages/vortex-engine/src/core/runtime/Probe.ts');

    assert.equal(vortex.length, 1);
    assert.equal(main.length, 1);
});

test('engine: a relative path into the client is refused', async () =>
{
    const hits = await wallHits("import {App} from '../../../../vortex-client/src/App';\nexport {App};\n",
        'packages/vortex-engine/src/habbo/room/Probe.ts');

    assert.equal(hits.length, 1);
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

test('common: the engine and every other Vortex package are refused', async () =>
{
    const core = await wallHits("import {Component} from '@core/runtime/Component';\nexport {Component};\n",
        'packages/ambreia-common/src/utils/Probe.ts');
    const net = await wallHits("import {ByteArray} from '@ambreia/net/util/ByteArray';\nexport {ByteArray};\n",
        'packages/ambreia-common/src/utils/Probe.ts');
    const relative = await wallHits("import {Vortex} from '../../../vortex-engine/src/Vortex';\nexport {Vortex};\n",
        'packages/ambreia-common/src/utils/Probe.ts');

    assert.equal(core.length, 1);
    assert.equal(net.length, 1);
    assert.equal(relative.length, 1);
});

test('net: common is allowed, the engine is refused', async () =>
{
    const common = await wallHits("import {Logger} from '@ambreia/common/utils/Logger';\nexport {Logger};\n",
        'packages/ambreia-net/src/connection/Probe.ts');
    const core = await wallHits("import {Component} from '@core/runtime/Component';\nexport {Component};\n",
        'packages/ambreia-net/src/connection/Probe.ts');

    assert.equal(common.length, 0);
    assert.equal(core.length, 1);
});

test('a package never reaches another package by a relative path into its sources', async () =>
{
    const net = await wallHits("import {Logger} from '../../../ambreia-common/src/utils/Logger';\nexport {Logger};\n",
        'packages/ambreia-net/src/connection/Probe.ts');
    const common = await wallHits("import {ByteArray} from '../../ambreia-net/src/util/ByteArray';\nexport {ByteArray};\n",
        'packages/ambreia-common/src/utils/Probe.ts');

    assert.equal(net.length, 1);
    assert.equal(common.length, 1);
});

test('avatar: common is allowed, the engine and room are refused', async () =>
{
    const common = await wallHits("import {Logger} from '@ambreia/common/utils/Logger';\nexport {Logger};\n",
        'packages/ambreia-avatar/src/Probe.ts');
    const room = await wallHits("import {RoomEngine} from '@habbo/room/RoomEngine';\nexport {RoomEngine};\n",
        'packages/ambreia-avatar/src/Probe.ts');
    const net = await wallHits("import {ByteArray} from '@ambreia/net/util/ByteArray';\nexport {ByteArray};\n",
        'packages/ambreia-avatar/src/Probe.ts');

    assert.equal(common.length, 0);
    assert.equal(room.length, 1);
    assert.equal(net.length, 1);
});

test('ui: common is allowed, the engine and the other packages are refused', async () =>
{
    const common = await wallHits("import {Logger} from '@ambreia/common/utils/Logger';\nexport {Logger};\n",
        'packages/ambreia-ui/src/Probe.ts');
    const engine = await wallHits("import {RoomEngine} from '@habbo/room/RoomEngine';\nexport {RoomEngine};\n",
        'packages/ambreia-ui/src/Probe.ts');
    const avatar = await wallHits("import {AvatarImage} from '@ambreia/avatar/AvatarImage';\nexport {AvatarImage};\n",
        'packages/ambreia-ui/src/Probe.ts');

    assert.equal(common.length, 0);
    assert.equal(engine.length, 1);
    assert.equal(avatar.length, 1);
});
