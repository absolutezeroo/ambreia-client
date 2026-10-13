import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// The dependency layer of a Dockerfile copies every workspace manifest before `pnpm install
// --frozen-lockfile`. With a subset, pnpm exits 0 and leaves dangling workspace links: the missing
// importers' own dependencies (zod, pako) are never installed and the build fails later, out of the
// cached layer. This test keeps both Dockerfiles equal to what the lockfile knows.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * The workspace projects the lockfile was generated from: the keys of its `importers:` section.
 *
 * pnpm 12 writes two YAML documents: a leading one whose `importers:` only holds the root's
 * package-manager dependencies, then the workspace one. Every `importers:` section is read.
 */
export function lockfileImporters(lock)
{
    const importers = new Set();
    let inImporters = false;

    for(const line of lock.split(/\r?\n/))
    {
        if(line === 'importers:')
        {
            inImporters = true;
            continue;
        }

        if(inImporters && /^\S/.test(line)) inImporters = false;

        const match = inImporters ? /^ {2}(packages\/[^:\s]+):\s*$/.exec(line) : null;

        if(match) importers.add(match[1]);
    }

    return [...importers].sort();
}

/** The package manifests a Dockerfile copies before installing. */
export function copiedManifests(dockerfile)
{
    return [...dockerfile.matchAll(/^COPY (packages\/[^/\s]+)\/package\.json /gm)].map(match => match[1]).sort();
}

test('lockfile importers are read from the importers section only', () =>
{
    const lock = 'lockfileVersion: 9\nimporters:\n  .:\n    dependencies: {}\n  packages/a:\n    x: 1\n  packages/b:\n    y: 2\npackages:\n  packages/not-an-importer:\n';

    assert.deepEqual(lockfileImporters(lock), ['packages/a', 'packages/b']);
});

test('copied manifests are read off the COPY lines', () =>
{
    assert.deepEqual(copiedManifests('COPY a b\nCOPY packages/z/package.json packages/z/\nCOPY packages/a/package.json packages/a/\nCOPY . .'), ['packages/a', 'packages/z']);
});

for(const name of ['Dockerfile', 'Dockerfile.imager'])
{
    test(`${name} copies every workspace manifest the lockfile knows`, () =>
    {
        const importers = lockfileImporters(readFileSync(resolve(root, 'pnpm-lock.yaml'), 'utf8'));
        const copied = copiedManifests(readFileSync(resolve(root, name), 'utf8'));

        assert.ok(importers.length >= 10, `expected a workspace lockfile, found ${importers.length} importers`);
        assert.deepEqual(copied, importers);
    });
}
