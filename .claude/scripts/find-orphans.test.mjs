import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findOrphans } from './find-orphans.mjs';

function project(files)
{
    const root = mkdtempSync(join(tmpdir(), 'orphans-'));
    for(const [path, text] of Object.entries(files))
    {
        mkdirSync(join(root, path, '..'), { recursive: true });
        writeFileSync(join(root, path), text);
    }
    return root;
}

test('a barrel does not keep its whole folder alive', () =>
{
    const root = project({
        'src/main.ts': "import {A} from './lib';\nexport const x = A;\n",
        'src/lib/index.ts': "export * from './a';\nexport * from './b';\n",
        'src/lib/a.ts': 'export class A {}\n',
        'src/lib/b.ts': 'export class B {}\n'
    });

    assert.deepEqual(findOrphans({ root, entries: ['src/main.ts'], scan: ['src'], aliases: {} }), ['src/lib/b.ts']);
});

test('aliases, type imports, re-exported names and dynamic imports are followed', () =>
{
    const root = project({
        'src/main.ts': "import type {T} from '@x/t';\nexport {R} from './r';\nvoid import('./lazy');\n",
        'src/x/t.ts': 'export interface T {}\n',
        'src/r.ts': "import {Dep} from './dep';\nexport const R = Dep;\n",
        'src/dep.ts': 'export const Dep = 1;\n',
        'src/lazy.ts': 'export const L = 1;\n',
        'src/dead.ts': 'export const D = 1;\n'
    });

    assert.deepEqual(findOrphans({ root, entries: ['src/main.ts'], scan: ['src'], aliases: { '@x': 'src/x' } }), ['src/dead.ts']);
});

test('multi-line import lists and a barrel reached by a namespace import keep everything they name', () =>
{
    const root = project({
        'src/main.ts': "import {\n    A,\n    B,\n} from './lib';\nimport * as all from './ns';\nexport {A, B, all};\n",
        'src/lib/index.ts': "export * from './a';\nexport * from './b';\nexport * from './c';\n",
        'src/lib/a.ts': 'export class A {}\n',
        'src/lib/b.ts': 'export class B {}\n',
        'src/lib/c.ts': 'export class C {}\n',
        'src/ns/index.ts': "export * from './x';\n",
        'src/ns/x.ts': 'export const X = 1;\n'
    });

    assert.deepEqual(findOrphans({ root, entries: ['src/main.ts'], scan: ['src'], aliases: {} }), ['src/lib/c.ts']);
});

test('a generated file is never reported: tools and hooks read it, not imports', () =>
{
    const root = project({
        'src/main.ts': 'export const x = 1;\n',
        'src/Headers.generated.ts': 'export const Incoming = {};\n'
    });

    assert.deepEqual(findOrphans({ root, entries: ['src/main.ts'], scan: ['src'], aliases: {} }), []);
});
