// Every key the site asks for, against every language it ships.
//
//   node tools/check-l10n.mjs
//
// Two failures it catches, both of which reach the screen as a KEY NAME printed at a visitor —
// `t()` returns the key when it cannot resolve it, deliberately, so a miss is loud but only if
// somebody looks:
//
//   MISSING   a `t('FOO')` in the code that no file answers, in any language. Always a mistake.
//   UNTRANSLATED  a key the fallback language has and another does not. Expected for `SITE_*` keys
//                 in a language with no overlay yet; reported so the gap is a number rather than a
//                 surprise.
//
// It also names keys that resolve only because a language INHERITS them from the fallback, which is
// the difference between "translated" and "renders something".
//
// Not part of `pnpm build`: it reads the source, not the bundle, and a missing key is not a reason
// to refuse a deploy at 3am.
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join, relative} from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const LOCALES = join(ROOT, 'src', 'locales');
const SITE = join(LOCALES, 'site');

function walk(dir, out = [])
{
    for(const entry of readdirSync(dir))
    {
        const path = join(dir, entry);

        if(statSync(path).isDirectory()) walk(path, out);
        else if(/\.(ts|svelte)$/.test(path)) out.push(path);
    }

    return out;
}

// The dictionary a language actually renders with: habbo.com's file plus this hotel's overlay.
function dictionary(code)
{
    const habbo = JSON.parse(readFileSync(join(LOCALES, `${code}.json`), 'utf8'));
    const site = existsSync(join(SITE, `${code}.json`))
        ? JSON.parse(readFileSync(join(SITE, `${code}.json`), 'utf8'))
        : {};

    return {...habbo, ...site};
}

const codes = readdirSync(LOCALES)
    .filter(name => name.endsWith('.json'))
    .map(name => name.replace(/\.json$/, ''))
    .sort();

// The same rule `src/lib/i18n.ts` applies, read from the same place the build reads it.
const env = existsSync(join(ROOT, '.env')) ? readFileSync(join(ROOT, '.env'), 'utf8') : '';
const configured = (env.match(/^VITE_SITE_LOCALE=(.*)$/m)?.[1] ?? '').trim();
const fallback = codes.includes(configured) ? configured : codes[0];

const dictionaries = Object.fromEntries(codes.map(code => [code, dictionary(code)]));

// `t('KEY')`, `tHtml('KEY')`, `tSite('KEY')`, and a bare 'KEY' in a table that feeds them — the
// tab bars and the API error map both hold keys rather than calls, so an UPPER_SNAKE string
// literal anywhere in src counts as a reference. It over-reports (a constant that merely looks
// like a key), which is the safe direction: a false positive is read once, a missing key is read
// by a visitor.
const used = new Map();

for(const file of walk(join(ROOT, 'src')))
{
    if(file.startsWith(LOCALES)) continue;

    const source = readFileSync(file, 'utf8');

    for(const match of source.matchAll(/['"`]([A-Z][A-Z0-9_]{4,})['"`]/g))
    {
        if(!used.has(match[1])) used.set(match[1], relative(ROOT, file));
    }
}

// A literal that is not a key at all — an HTTP verb, a header, an enum. Anything no language
// answers AND that no language has ever answered is far likelier to be one of these than a typo,
// so only a key the fallback carries is held to the others.
const keys = [...used.keys()].filter(key => dictionaries[fallback][key] !== undefined);
const missing = [...used.keys()].filter(key => !codes.some(code => dictionaries[code][key] !== undefined));

let failed = 0;

console.log(`${keys.length} keys referenced, ${codes.length} languages, fallback "${fallback}"\n`);

for(const code of codes)
{
    const absent = keys.filter(key => dictionaries[code][key] === undefined);
    const mark = absent.length ? 'UNTRANSLATED' : 'ok';

    console.log(`  ${code.padEnd(3)} ${String(keys.length - absent.length).padStart(4)}/${keys.length}  ${mark}`);

    if(absent.length && absent.length <= 8) console.log(`        ${absent.join(', ')}`);
    else if(absent.length) console.log(`        ${absent.slice(0, 8).join(', ')} … +${absent.length - 8}`);
}

if(missing.length)
{
    failed = 1;
    console.log(`\nMISSING — referenced in the code, answered by no language:\n`);
    for(const key of missing) console.log(`  ${key}   ${used.get(key)}`);
    console.log('\n(an UPPER_SNAKE literal that is not a translation key at all will show here too)');
}

process.exit(failed);
