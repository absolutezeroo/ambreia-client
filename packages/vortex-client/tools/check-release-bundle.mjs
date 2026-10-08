#!/usr/bin/env node
// Runs after `vite build`: the production bundle must hold no message name and no source map, or the
// release revision's random ids can be read back in seconds (spec 2026-10-08-random-header-revisions §4.4).
import {readdirSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseRelease} from '../../vortex-engine/tools/lib/headers.mjs';
import {findReleaseFile} from './vite-plugin-release.mjs';

export function findLeaks(files, names)
{
    const leaks = [];

    for(const {name: file, text} of files)
    {
        if(file.endsWith('.map'))
        {
            leaks.push({file, name: '(source map)'});
            continue;
        }

        for(const name of names)
        {
            if(new RegExp(`(?<![\\w$])${name}(?![\\w$])`).test(text)) leaks.push({file, name});
        }
    }

    return leaks;
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const client = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const dist = join(client, 'dist', 'assets');
    const release = parseRelease(readFileSync(findReleaseFile({env: process.env, repoRoot: resolve(client, '..', '..')}), 'utf8'));
    const names = [...release.incoming.keys(), ...release.outgoing.keys()];
    const files = readdirSync(dist).filter(file => file.endsWith('.js') || file.endsWith('.map'))
        .map(file => ({name: file, text: file.endsWith('.map') ? '' : readFileSync(join(dist, file), 'utf8')}));
    const leaks = findLeaks(files, names);

    if(leaks.length > 0)
    {
        for(const leak of leaks) console.error(`check-release-bundle: ${leak.file} leaks ${leak.name}`);
        process.exit(1);
    }

    console.log(`check-release-bundle: ${files.length} scripts, no message name (${release.revision}).`);
}
