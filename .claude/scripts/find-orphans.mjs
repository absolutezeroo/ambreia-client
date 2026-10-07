#!/usr/bin/env node
// Lists source files that no entry point reaches. Named imports are followed through `export *`
// barrels to the file that declares the name, so a barrel does not keep its whole folder alive.
// Usage, from the repo root: node .claude/scripts/find-orphans.mjs
// It only lists: a deletion goes through a reviewed path list and `git rm --pathspec-from-file`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const posix = p => p.split(path.sep).join('/');

function resolveSpec(root, fromFile, spec, aliases)
{
    let base = null;
    const alias = Object.keys(aliases).find(a => spec === a || spec.startsWith(a + '/'));

    if(alias) base = path.join(root, aliases[alias] + spec.slice(alias.length));
    else if(spec.startsWith('.')) base = path.resolve(path.dirname(path.join(root, fromFile)), spec);

    if(!base) return null;

    for(const candidate of [base + '.ts', path.join(base, 'index.ts'), base])
    {
        if(fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return posix(path.relative(root, candidate));
    }

    return null;
}

function parse(text)
{
    const imports = [];
    const reexports = [];
    const names = list => list.split(',').map(n => n.trim().replace(/^type\s+/, '')).filter(Boolean).map(n => n.split(/\s+as\s+/)[0]);

    for(const m of text.matchAll(/import\s+(?:type\s+)?(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:\*\s+as\s+\w+\s*)?from\s+['"]([^'"]+)['"]/g))
    {
        const star = /import\s+(?:type\s+)?\*\s+as/.test(m[0]);
        imports.push({ spec: m[3], names: star ? '*' : [...(m[1] ? ['default'] : []), ...(m[2] ? names(m[2]) : [])] });
    }

    for(const m of text.matchAll(/import\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) imports.push({ spec: m[1] ?? m[2], names: '*' });
    for(const m of text.matchAll(/export\s+\*\s+(?:as\s+\w+\s+)?from\s+['"]([^'"]+)['"]/g)) reexports.push({ spec: m[1], names: '*' });
    for(const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from\s+['"]([^'"]+)['"]/g)) reexports.push({ spec: m[2], names: names(m[1]) });

    const declares = new Set([...text.matchAll(/export\s+(?:declare\s+)?(?:abstract\s+)?(?:class|interface|type|const|let|var|function|enum)\s+(\w+)/g)].map(m => m[1]));

    for(const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g))
    {
        for(const n of m[1].split(',')) declares.add(n.trim().split(/\s+as\s+/).pop());
    }

    if(/export\s+default/.test(text)) declares.add('default');

    return { imports, reexports, declares };
}

export function findOrphans({ root, entries, scan, aliases })
{
    const cache = new Map();
    const info = file =>
    {
        if(!cache.has(file)) cache.set(file, parse(fs.readFileSync(path.join(root, file), 'utf8')));
        return cache.get(file);
    };
    const provides = (file, name, seen = new Set()) =>
    {
        if(seen.has(file)) return false;
        seen.add(file);

        const { declares, reexports } = info(file);

        if(declares.has(name)) return true;

        return reexports.some(r =>
        {
            if(r.names !== '*' && !r.names.includes(name)) return false;
            const target = resolveSpec(root, file, r.spec, aliases);
            return target !== null && provides(target, name, seen);
        });
    };
    const reached = new Set();
    const visited = new Set();
    const queue = entries.map(file => [file, '*']);

    while(queue.length)
    {
        const [file, wanted] = queue.pop();
        const key = `${file}|${wanted === '*' ? '*' : wanted.join(',')}`;

        if(visited.has(key)) continue;

        visited.add(key);
        reached.add(file);

        const { imports, reexports } = info(file);

        for(const imp of imports)
        {
            const target = resolveSpec(root, file, imp.spec, aliases);
            if(target) queue.push([target, imp.names]);
        }

        for(const r of reexports)
        {
            const target = resolveSpec(root, file, r.spec, aliases);

            if(!target) continue;

            if(wanted === '*') queue.push([target, r.names]);
            else
            {
                const needed = wanted.filter(n => (r.names === '*' || r.names.includes(n)) && provides(target, n));
                if(needed.length) queue.push([target, needed]);
            }
        }
    }

    const all = [];
    const walk = dir =>
    {
        for(const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true }))
        {
            const rel = posix(path.join(dir, e.name));

            if(e.isDirectory())
            {
                if(e.name !== 'node_modules' && e.name !== 'assets') walk(rel);
            }
            // A generated file is read by tools and hooks, never imported, so it always looks orphaned.
            else if(rel.endsWith('.ts') && !rel.endsWith('.d.ts') && !rel.endsWith('.generated.ts')) all.push(rel);
        }
    };

    scan.forEach(walk);

    return all.filter(f => !reached.has(f)).sort();
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const root = process.cwd();
    const E = 'packages/vortex-engine/src';
    const C = 'packages/vortex-client/src';
    const orphans = findOrphans({
        root,
        entries: [`${E}/index.ts`, `${C}/index.ts`, 'packages/vortex-glaze/src/main.ts', 'packages/vortex-imager/src/index.ts'],
        scan: [E, C],
        aliases: { '@core': `${E}/core`, '@habbo': `${E}/habbo`, '@room': `${E}/room`, '@iid': `${E}/iid`, '@ui': C, '@': C, '@client': C }
    });

    for(const f of orphans) console.log(f);
    console.error(`${orphans.length} orphan file(s)`);
}
