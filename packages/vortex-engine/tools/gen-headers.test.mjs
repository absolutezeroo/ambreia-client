import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = join(dirname(fileURLToPath(import.meta.url)), 'gen-headers.mjs');

function run(args, emulatorDir)
{
    return spawnSync(process.execPath, [CLI, ...args], {
        encoding: 'utf8',
        env: { ...process.env, VORTEX_EMULATOR_DIR: emulatorDir }
    });
}

test('cli: missing emulator skips the check', () =>
{
    const result = run(['--check'], mkdtempSync(join(tmpdir(), 'no-emulator-')));

    assert.equal(result.status, 0);
    assert.match(result.stdout, /check skipped/);
});

test('cli: missing emulator fails generation', () =>
{
    const result = run([], mkdtempSync(join(tmpdir(), 'no-emulator-')));

    assert.equal(result.status, 1);
    assert.match(result.stderr, /not found/);
});

test('cli: stale target fails the check and says how to fix it', () =>
{
    const emulator = mkdtempSync(join(tmpdir(), 'fake-emulator-'));
    const revision = join(emulator, 'Vortex.Revisions', 'Revision20260701');

    mkdirSync(revision, { recursive: true });
    writeFileSync(join(revision, 'Headers.cs'),
        'internal static class MessageComposer\n{\n    public const int OnlyInThisFixture = 1;\n}\n');

    const result = run(['--check'], emulator);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /pnpm gen:headers/);
    assert.match(result.stderr, /Headers\.cs/);
});
