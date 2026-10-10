#!/usr/bin/env node
// Compares the field order of every new-style message (@ambreia/protocol parser/ and serializer/)
// with its counterpart in the emulator: the client file names it ("in the order of the server's
// X"), the emulator's Revision20260701 has X.cs. Incoming: the client's read types against the
// server's write types. Outgoing: the client's values (name and declared type) against the
// server's Pop calls and the properties they fill. Also lists the emulator's RPG serializers and
// parsers that no client file names.
// Usage, from the repo root: node .claude/scripts/wire-diff.mjs   (exit 1 on a DIFF or MISSING)
// A DIFF is a lead, not a verdict: a branch (`if`) on one side only also shows as one. Read both files.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emulatorCandidates } from '../../packages/vortex-engine/tools/lib/headers.mjs';

const TYPES = { int: 'int', integer: 'int', string: 'string', boolean: 'bool', short: 'short', byte: 'byte', long: 'long', float: 'float', double: 'double', number: 'int' };
const type = name => TYPES[name.toLowerCase()] ?? name;

/** The types a client parser reads, in order; `helper(name)` gives the source of a `name(wrapper)` reader. */
export function clientReads(source, helper = () => null)
{
    const out = [];

    for(const match of source.matchAll(/wrapper\.read(\w+)\(|\b(\w+)\(wrapper\)/g))
    {
        if(match[1]) out.push(type(match[1]));
        else
        {
            const body = helper(match[2]);

            out.push(...(body === null ? [`?${match[2]}`] : clientReads(body, helper)));
        }
    }

    return out;
}

/** The types a server serializer writes, in order; `helper(name)` gives the source of a `Name.Write(packet…)` writer. */
export function serverWrites(source, helper = () => null)
{
    const out = [];

    for(const match of source.matchAll(/\.Write(Integer|String|Boolean|Short|Byte|Long|Float|Double)\(|\b(\w+)\.Write\(packet/g))
    {
        if(match[1]) out.push(type(match[1]));
        else
        {
            const body = helper(match[2]);

            out.push(...(body === null ? [`?${match[2]}`] : serverWrites(body, helper)));
        }
    }

    return out;
}

/** `name:type` of what a client serializer returns, the types from the message class's `readonly name: type`. */
export function clientValues(serializer, messageClass)
{
    const declared = new Map([...messageClass.matchAll(/readonly (\w+)\??: (\w+)/g)].map(m => [m[1], type(m[2])]));
    const returned = serializer.match(/return \[([^\]]*)\]/)?.[1] ?? '';

    return [...returned.matchAll(/message\.(\w+)/g)].map(m => `${m[1].toLowerCase()}:${declared.get(m[1]) ?? '?'}`);
}

/** `name:type` of what a server parser pops, in order. */
export function serverValues(parser)
{
    return [...parser.matchAll(/(\w+) = packet\.Pop(\w+)\(/g)].map(m => `${m[1].toLowerCase()}:${type(m[2])}`);
}

function walk(dir, out = [])
{
    if(!existsSync(dir)) return out;

    for(const name of readdirSync(dir))
    {
        const path = join(dir, name);

        if(statSync(path).isDirectory()) walk(path, out);
        else out.push(path);
    }

    return out;
}

/** The source of `name` in `dir`: `name.ts`/`.cs`, or the file of `dir` exporting a function `name`. */
function sibling(dir, name, ext)
{
    const direct = join(dir, name + ext);

    if(existsSync(direct)) return readFileSync(direct, 'utf8');

    for(const file of readdirSync(dir).filter(f => f.endsWith(ext)))
    {
        const text = readFileSync(join(dir, file), 'utf8');

        if(new RegExp(`function ${name}\\b`).test(text)) return text;
    }

    return null;
}

export function wireDiff(repo, emulator)
{
    const protocol = join(repo, 'packages', 'ambreia-protocol', 'src');
    const revision = join(emulator, 'Vortex.Revisions', 'Revision20260701');
    const serverFiles = new Map(walk(revision).filter(f => f.endsWith('.cs')).map(f => [basename(f, '.cs'), f]));
    const named = new Set();
    const rows = [];

    for(const file of [...walk(join(protocol, 'parser')), ...walk(join(protocol, 'serializer'))].filter(f => f.endsWith('.ts')))
    {
        const source = readFileSync(file, 'utf8');
        const server = source.match(/in the order of the server's (\w+)/)?.[1];

        if(!server) continue;

        named.add(server);

        const client = basename(file, '.ts');
        const serverFile = serverFiles.get(server);

        if(!serverFile)
        {
            rows.push({ status: 'MISSING', client, server, detail: 'no such file in the emulator' });
            continue;
        }

        const serverSource = readFileSync(serverFile, 'utf8');
        let ours;
        let theirs;

        if(file.includes(`${join(protocol, 'parser')}`))
        {
            ours = clientReads(source, name => sibling(dirname(file), name, '.ts'));
            theirs = serverWrites(serverSource, name => sibling(dirname(serverFile), name, '.cs'));
        }
        else
        {
            const messageImport = source.match(/from '(\.\.\/[^']*outgoing[^']*)'/)?.[1];
            const messagePath = messageImport ? resolve(dirname(file), messageImport + '.ts') : null;

            ours = clientValues(source, messagePath && existsSync(messagePath) ? readFileSync(messagePath, 'utf8') : '');
            theirs = serverValues(serverSource);
        }

        const same = ours.join(',') === theirs.join(',');

        rows.push({ status: same ? 'OK' : 'DIFF', client, server, detail: same ? (ours.join(',') || '(empty)') : `client ${ours.join(',') || '(empty)'}\n        server ${theirs.join(',') || '(empty)'}` });
    }

    for(const [name, path] of serverFiles)
    {
        const rpg = /[\\/](Serializers|Parsers)[\\/]Rpg[\\/]/.test(path) && /(Serializer|Parser)$/.test(name);

        if(!rpg || named.has(name)) continue;

        // What the new message carries, for the parser or serializer still to write.
        const source = readFileSync(path, 'utf8');
        const fields = name.endsWith('Serializer') ? serverWrites(source, helper => sibling(dirname(path), helper, '.cs')) : serverValues(source);

        rows.push({ status: 'UNPAIRED', client: '-', server: name, detail: `server ${fields.join(',') || '(empty)'}` });
    }

    return rows;
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const dotGit = join(repo, '.git');
    const candidates = process.env.VORTEX_EMULATOR_DIR
        ? [process.env.VORTEX_EMULATOR_DIR]
        : emulatorCandidates(repo, existsSync(dotGit) && !statSync(dotGit).isDirectory() ? readFileSync(dotGit, 'utf8') : null);
    const emulator = candidates.find(dir => existsSync(join(dir, 'Vortex.Revisions')));

    if(!emulator)
    {
        console.error(`wire-diff: no emulator in ${candidates.join(', ')}. Set VORTEX_EMULATOR_DIR.`);
        process.exit(2);
    }

    const rows = wireDiff(repo, emulator);

    for(const row of rows) console.log(`${row.status.padEnd(8)} ${row.client} <-> ${row.server}  ${row.detail}`);

    const bad = rows.filter(row => row.status === 'DIFF' || row.status === 'MISSING').length;

    console.log(`\n${rows.length} rows: ${bad} DIFF/MISSING, ${rows.filter(row => row.status === 'UNPAIRED').length} UNPAIRED.`);
    process.exit(bad > 0 ? 1 : 0);
}
