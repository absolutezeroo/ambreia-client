import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planMoves } from './move-modules.mjs';

function project(files)
{
    const root = mkdtempSync(join(tmpdir(), 'move-'));
    for(const [path, text] of Object.entries(files))
    {
        mkdirSync(join(root, path, '..'), { recursive: true });
        writeFileSync(join(root, path), text);
    }
    return root;
}

const ALIASES = { '@core': 'eng/src/core' };
const MOVES = [{ from: 'eng/src/core/utils', to: 'common/src/utils', specifier: '@c/utils', except: ['eng/src/core/utils/Stay.ts'] }];
const plan = files => planMoves({ root: project(files), scan: ['eng/src', 'common/src'], aliases: ALIASES, moves: MOVES });
const next = (p, file) => (p.rewrites.get(file) ?? []).map(r => `${r.spec} -> ${r.next}`);

test('an alias import of a moved file becomes the package specifier', () =>
{
    const p = plan({
        'eng/src/a.ts': "import {Logger} from '@core/utils/Logger';\n",
        'eng/src/core/utils/Logger.ts': 'export class Logger {}\n'
    });

    assert.deepEqual(next(p, 'eng/src/a.ts'), ['@core/utils/Logger -> @c/utils/Logger']);
});

test('a relative import from a staying file is rewritten, type and re-export forms included', () =>
{
    const p = plan({
        'eng/src/core/window/W.ts': "import type {L} from '../utils/Logger';\nexport * from '../utils/Logger';\nvoid import('../utils/Logger');\n",
        'eng/src/core/utils/Logger.ts': 'export class L {}\n'
    });

    assert.deepEqual(next(p, 'eng/src/core/window/W.ts'), [
        '../utils/Logger -> @c/utils/Logger', '../utils/Logger -> @c/utils/Logger', '../utils/Logger -> @c/utils/Logger'
    ]);
});

test('relative imports inside the moved folder are left alone; an alias one becomes relative', () =>
{
    const p = plan({
        'eng/src/core/utils/A.ts': "import {B} from './B';\nimport {C} from '@core/utils/sub/C';\n",
        'eng/src/core/utils/B.ts': 'export class B {}\n',
        'eng/src/core/utils/sub/C.ts': 'export class C {}\n'
    });

    assert.deepEqual(next(p, 'eng/src/core/utils/A.ts'), ['@core/utils/sub/C -> ./sub/C']);
});

test('a barrel keeps its explicit /index so the package exports pattern resolves it', () =>
{
    const p = plan({
        'eng/src/core/index.ts': "export * from './utils';\n",
        'eng/src/core/utils/index.ts': "export * from './B';\n",
        'eng/src/core/utils/B.ts': 'export class B {}\n'
    });

    assert.deepEqual(next(p, 'eng/src/core/index.ts'), ['./utils -> @c/utils/index']);
});

test('a moved file that imports a staying file is a violation, and except keeps a file home', () =>
{
    const p = plan({
        'eng/src/core/utils/A.ts': "import {S} from './Stay';\nimport {R} from '../runtime/R';\n",
        'eng/src/core/utils/Stay.ts': 'export class S {}\n',
        'eng/src/core/runtime/R.ts': 'export class R {}\n'
    });

    assert.deepEqual(p.violations.map(v => v.spec), ['./Stay', '../runtime/R']);
    assert.ok(!p.moved.some(([from]) => from.endsWith('Stay.ts')));
});

test('a single-file move maps to its full specifier', () =>
{
    const p = planMoves({
        root: project({
            'eng/src/core/runtime/IDisposable.ts': 'export interface IDisposable {}\n',
            'eng/src/core/runtime/index.ts': "export type {IDisposable} from './IDisposable';\n"
        }),
        scan: ['eng/src'],
        aliases: ALIASES,
        moves: [{ from: 'eng/src/core/runtime/IDisposable.ts', to: 'common/src/IDisposable.ts', specifier: '@c/IDisposable' }]
    });

    assert.deepEqual(next(p, 'eng/src/core/runtime/index.ts'), ['./IDisposable -> @c/IDisposable']);
    assert.deepEqual(p.moved, [['eng/src/core/runtime/IDisposable.ts', 'common/src/IDisposable.ts']]);
});

test('a source folder named assets is moved like any other', () =>
{
    const p = planMoves({
        root: project({
            'eng/src/core/assets/IAsset.ts': 'export interface IAsset {}\n',
            'eng/src/a.ts': "import type {IAsset} from '@core/assets/IAsset';\n"
        }),
        scan: ['eng/src'],
        aliases: ALIASES,
        moves: [{ from: 'eng/src/core/assets', to: 'common/src/assets', specifier: '@c/assets' }]
    });

    assert.deepEqual(p.moved, [['eng/src/core/assets/IAsset.ts', 'common/src/assets/IAsset.ts']]);
    assert.deepEqual(next(p, 'eng/src/a.ts'), ['@core/assets/IAsset -> @c/assets/IAsset']);
});

test('a moved file reaches a file of another move in the same run by a relative path', () =>
{
    const p = planMoves({
        root: project({
            'eng/src/core/assets/A.ts': "import {Logger} from '../utils/Logger';\n",
            'eng/src/core/utils/Logger.ts': 'export class Logger {}\n'
        }),
        scan: ['eng/src'],
        aliases: ALIASES,
        moves: [
            { from: 'eng/src/core/utils', to: 'common/src/utils', specifier: '@c/common/utils' },
            { from: 'eng/src/core/assets', to: 'common/src/assets', specifier: '@c/common/assets' }
        ]
    });

    assert.deepEqual(p.rewrites.get('eng/src/core/assets/A.ts') ?? [], []);
});

test('moves into two different packages in one run reach each other by package name', () =>
{
    const p = planMoves({
        root: project({
            'eng/src/room/R.ts': "import {A} from '../avatar/A';\n",
            'eng/src/avatar/A.ts': 'export class A {}\n'
        }),
        scan: ['eng/src'],
        aliases: ALIASES,
        moves: [
            { from: 'eng/src/room', to: 'iso/src', specifier: '@x/iso' },
            { from: 'eng/src/avatar', to: 'avatar/src', specifier: '@x/avatar' }
        ]
    });

    assert.deepEqual(next(p, 'eng/src/room/R.ts'), ['../avatar/A -> @x/avatar/A']);
});

test('a moved file that imported its destination package by name now reaches it relatively', () =>
{
    const p = planMoves({
        root: project({
            'eng/src/room/G.ts': "import type {D} from '@x/common/D';\n",
            'common/src/D.ts': 'export interface D {}\n'
        }),
        scan: ['eng/src', 'common/src'],
        aliases: ALIASES,
        moves: [{ from: 'eng/src/room/G.ts', to: 'common/src/graphics/G.ts', specifier: '@x/common/graphics/G' }]
    });

    assert.deepEqual(next(p, 'eng/src/room/G.ts'), ['@x/common/D -> ../D']);
});
