import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { changedTypeScript, fingerprint, guardReason } from './lib.mjs';

const REPO = resolve('/work/vortex-rpg-client');

test('edits under sources/ are refused: the AS3 dumps are read-only', () =>
{
    assert.match(guardReason(join(REPO, 'sources', 'WIN63-x', 'src', 'A.as'), REPO), /read-only/);
});

test('generated headers are refused and the regeneration command is named', () =>
{
    const file = join(REPO, 'packages', 'vortex-engine', 'src', 'habbo', 'communication', 'Headers.generated.ts');

    assert.match(guardReason(file, REPO), /pnpm gen:headers/);
});

test('built window layouts and skins are refused and their builder is named', () =>
{
    const layout = join(REPO, 'packages', 'vortex-client', 'src', 'assets', 'window-layouts', 'x.xml');
    const skin = join(REPO, 'packages', 'vortex-client', 'src', 'assets', 'window-skins', 'y.xml');

    assert.match(guardReason(layout, REPO), /build-window-assets\.mjs/);
    assert.match(guardReason(skin, REPO), /build-window-assets\.mjs/);
});

test('the dev bundle output is refused', () =>
{
    assert.match(guardReason(join(REPO, 'packages', 'vortex-client', '.vortex-dev', 'core', 'a.js'), REPO), /generated/);
});

test('ordinary sources, vortex layouts and files outside the repo are allowed', () =>
{
    assert.equal(guardReason(join(REPO, 'packages', 'vortex-engine', 'src', 'room', 'RoomEngine.ts'), REPO), null);
    assert.equal(guardReason(join(REPO, 'packages', 'vortex-client', 'src', 'vortex-layouts', 'vortex_hud_xml.xml'), REPO), null);
    assert.equal(guardReason(resolve('/elsewhere/sources/notes.md'), REPO), null);
});

test('changedTypeScript keeps modified, added, renamed and untracked .ts, never deleted ones', () =>
{
    const porcelain = [
        ' M packages/a/src/One.ts',
        'A  packages/a/src/Two.ts',
        'R  packages/a/src/Old.ts -> packages/a/src/Three.ts',
        '?? packages/a/src/Four.ts',
        ' D packages/a/src/Gone.ts',
        ' M docs/notes.md',
        'MM packages/a/tools/x.mjs'
    ].join('\n');

    assert.deepEqual(changedTypeScript(porcelain), [
        'packages/a/src/One.ts',
        'packages/a/src/Two.ts',
        'packages/a/src/Three.ts',
        'packages/a/src/Four.ts'
    ]);
});

test('fingerprint changes when a file or its mtime changes, not when the order does', () =>
{
    const a = fingerprint([['x.ts', 1], ['y.ts', 2]]);

    assert.equal(a, fingerprint([['y.ts', 2], ['x.ts', 1]]));
    assert.notEqual(a, fingerprint([['x.ts', 1], ['y.ts', 3]]));
    assert.notEqual(a, fingerprint([['x.ts', 1]]));
});
