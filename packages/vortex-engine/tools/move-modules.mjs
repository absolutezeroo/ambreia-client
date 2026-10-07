#!/usr/bin/env node
// Moves source files to another package and rewrites every import that reaches them, so an
// extraction milestone (spec §9) is one reviewed command instead of a thousand hand edits.
// Usage, from the repo root: node packages/vortex-engine/tools/move-modules.mjs <moves.json> [--apply]
// Without --apply it only reports. A violation (a moved file importing one that stays) blocks --apply.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const posix = p => p.split(path.sep).join('/');
const stripTs = p => p.replace(/\.ts$/, '');
// `import … from`, `export … from`, `import('…')` and the bare side-effect `import '…'`.
const SPEC_RE = /(\b(?:import|export)\b[^'";]*?\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"]+)\2/g;

function resolveSpec(root, fromFile, spec, aliases)
{
    let base = null;
    const alias = Object.keys(aliases).find(a => spec === a || spec.startsWith(a + '/'));

    if(alias) base = path.join(root, aliases[alias] + spec.slice(alias.length));
    else if(spec.startsWith('.')) base = path.resolve(path.dirname(path.join(root, fromFile)), spec);

    if(!base) return null;

    for(const candidate of [base + '.ts', path.join(base, 'index.ts')])
    {
        if(fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return posix(path.relative(root, candidate));
    }

    return null;
}

function listFiles(root, dir)
{
    const out = [];
    const abs = path.join(root, dir);

    if(!fs.existsSync(abs)) return out;

    for(const e of fs.readdirSync(abs, { withFileTypes: true }))
    {
        const rel = posix(path.join(dir, e.name));

        if(e.isDirectory())
        {
            // Only the client's asset tree is skipped (thousands of XML/PNG files, no source): a source
            // folder may be called assets too (core/assets).
            if(!['node_modules', '.vortex-dev'].includes(e.name) && !rel.endsWith('vortex-client/src/assets')) out.push(...listFiles(root, rel));
        }
        else if(rel.endsWith('.ts') && !rel.endsWith('.d.ts')) out.push(rel);
    }

    return out;
}

export function planMoves({ root, scan, aliases, moves })
{
    const groupOf = file => moves.findIndex(m =>
        (file === m.from || file.startsWith(m.from + '/')) && !(m.except ?? []).includes(file));
    const newPath = file =>
    {
        const g = groupOf(file);
        return g < 0 ? file : moves[g].to + file.slice(moves[g].from.length);
    };
    const specifierFor = target =>
    {
        const m = moves[groupOf(target)];
        return m.specifier + stripTs(newPath(target)).slice(stripTs(m.to).length);
    };
    const relativeTo = (file, target) =>
    {
        const rel = posix(path.relative(path.dirname(newPath(file)), stripTs(newPath(target))));
        return rel.startsWith('.') ? rel : './' + rel;
    };

    const rewrites = new Map();
    const violations = [];
    const files = [...new Set(scan.flatMap(dir => listFiles(root, dir)))];

    for(const file of files)
    {
        const text = fs.readFileSync(path.join(root, file), 'utf8');
        const gFile = groupOf(file);

        for(const m of text.matchAll(SPEC_RE))
        {
            const spec = m[3];
            const target = resolveSpec(root, file, spec, aliases);

            if(target === null) continue;

            const gTarget = groupOf(target);
            let next;

            if(gTarget < 0)
            {
                if(gFile >= 0) violations.push({ file, spec, target });
                continue;
            }

            // Moved files reach each other relatively: one run moves into one package, and a
            // package importing itself by name needs a rootDir tsc cannot infer.
            if(gFile >= 0) next = gFile === gTarget && spec.startsWith('.') ? null : relativeTo(file, target);
            else next = specifierFor(target);

            if(next !== null && next !== spec)
            {
                if(!rewrites.has(file)) rewrites.set(file, []);
                rewrites.get(file).push({ spec, next });
            }
        }
    }

    const moved = files.filter(f => groupOf(f) >= 0).map(f => [f, newPath(f)]);

    return { rewrites, violations, moved };
}

export function applyMoves(root, plan)
{
    for(const [file, list] of plan.rewrites)
    {
        const abs = path.join(root, file);
        const queue = [...list];
        const text = fs.readFileSync(abs, 'utf8').replace(SPEC_RE, (whole, head, quote, spec) =>
        {
            const i = queue.findIndex(r => r.spec === spec);
            if(i < 0) return whole;
            const [r] = queue.splice(i, 1);
            return `${head}${quote}${r.next}${quote}`;
        });

        fs.writeFileSync(abs, text);
    }

    for(const [from, to] of plan.moved)
    {
        fs.mkdirSync(path.dirname(path.join(root, to)), { recursive: true });
        execFileSync('git', ['mv', from, to], { cwd: root });
    }
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const root = process.cwd();
    const E = 'packages/vortex-engine/src';
    const C = 'packages/vortex-client/src';
    const moves = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const plan = planMoves({
        root,
        moves,
        scan: [E, 'packages/vortex-engine/test', C, 'packages/vortex-glaze/src', 'packages/vortex-imager/src', 'packages/ambreia-common/src', 'packages/ambreia-net/src'],
        aliases: { '@core': `${E}/core`, '@habbo': `${E}/habbo`, '@room': `${E}/room`, '@iid': `${E}/iid`, '@ui': C, '@': C, '@client': C }
    });
    const count = [...plan.rewrites.values()].reduce((n, l) => n + l.length, 0);

    for(const v of plan.violations) console.log(`VIOLATION ${v.file}: '${v.spec}' -> ${v.target} stays behind`);
    console.log(`${count} import(s) to rewrite in ${plan.rewrites.size} file(s); ${plan.moved.length} file(s) to move; ${plan.violations.length} violation(s)`);

    if(process.argv.includes('--apply'))
    {
        if(plan.violations.length > 0) process.exit(1);
        applyMoves(root, plan);
        console.log('applied');
    }
}
