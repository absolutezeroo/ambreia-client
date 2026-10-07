// Pure logic behind the Claude Code hooks in .claude/settings.json. The hook scripts beside this
// file only read stdin, call these, and print the decision.
import { createHash } from 'node:crypto';
import { relative, sep } from 'node:path';

// Files an agent must never edit by hand, with what to do instead. Matched on the path relative to
// the repo root, with forward slashes.
const READ_ONLY = [
    {
        test: rel => rel.startsWith('sources/'),
        reason: 'sources/ holds the decompiled AS3 dumps, read-only reference material. Read them; never edit them.'
    },
    {
        test: rel => rel.endsWith('.generated.ts'),
        reason: 'This file is generated (Headers.generated.ts comes from the emulator\'s Headers.cs). Run `pnpm gen:headers` instead of editing it.'
    },
    {
        test: rel => /^packages\/vortex-client\/src\/assets\/window-(layouts|skins)\//.test(rel),
        reason: 'Built window layouts/skins are written by packages/vortex-client/tools/build-window-assets.mjs from the dump. New layouts go in packages/vortex-client/src/vortex-layouts/; fix the builder for anything else.'
    },
    {
        test: rel => rel.includes('/.vortex-dev/'),
        reason: 'This is the dev server\'s generated engine bundle (vite-plugin-engine-bundle.mjs). Edit the engine source instead.'
    }
];

export function guardReason(filePath, repoRoot)
{
    const rel = relative(repoRoot, filePath).split(sep).join('/');

    if(rel.startsWith('..') || rel === '')
    {
        return null;
    }

    return READ_ONLY.find(rule => rule.test(rel))?.reason ?? null;
}

// Paths of .ts files that `git status --porcelain` reports as present and changed (modified, added,
// renamed or untracked); deleted files have nothing to typecheck.
export function changedTypeScript(porcelain)
{
    const files = [];

    for(const line of porcelain.split(/\r?\n/))
    {
        if(line.length < 4)
        {
            continue;
        }

        const status = line.slice(0, 2);
        const path = line.slice(3).split(' -> ').pop();

        if(status.includes('D') || !path.endsWith('.ts'))
        {
            continue;
        }

        files.push(path);
    }

    return files;
}

// Order-independent identity of a set of [path, mtimeMs] pairs: the Stop hook skips the check when
// the files are exactly those it last saw pass.
export function fingerprint(entries)
{
    const canonical = [...entries].map(([path, mtime]) => `${path}\t${mtime}`).sort().join('\n');

    return createHash('sha1').update(canonical).digest('hex');
}
