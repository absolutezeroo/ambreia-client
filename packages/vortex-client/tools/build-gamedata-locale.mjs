#!/usr/bin/env node
// Converts the two raw Habbo gamedata text bundles
//
//   sources/external_flash_texts.txt   (51,769 keys, 3.4 MB - localization)
//   sources/external_variables.txt     ( 2,088 keys, 171 KB - client configuration)
//
// into the flat `{ "key": "value" }` JSON both runtime parsers already accept
// (CoreLocalizationManager.parseJsonLocalizationData / HabboConfigurationManager
// .parseJsonConfiguration - each sniffs a leading `{` and takes that branch), and
// optionally prunes the entries this client can never ask for.
//
// ## What the conversion has to preserve
//
// The key=value branch is not a plain split, so a naive dump changes behaviour:
//   - `\n` in a value is a *literal backslash-n* in the .txt and the kv parser rewrites
//     it to a real newline (46,636 of the 51,769 text lines contain one). The JSON
//     branch does no such rewrite, so the conversion has to do it here or every
//     multi-paragraph string ships with visible "\n" in it.
//   - empty values are dropped by the kv parser (1,695 of them) and kept by the JSON
//     one - `typeof value === 'string'` is true for "". Dropped here to match.
//   - keys and values are trimmed; `#` lines are comments; the first `=` splits and any
//     further `=` stay in the value; a repeated key wins last (53 in the texts file).
//
// ## What pruning can and cannot decide
//
// Only ~3.7% of the text keys appear as a literal anywhere in the AS3 trees. That is not
// dead weight - it is how the file works: the client builds most keys at runtime from
// server data (`"badge_name_" + code`, `"quests." + campaign + ".name"`,
// `landing.view.<campaign>.header`). A usage filter that keeps only what static analysis
// proves reachable would delete the entire badge/quest/campaign content and silently
// blank out text everywhere - localization misses return '' (getLocalization's default),
// they never throw.
//
// So the rules below drop by *provenance*, never by "no literal found":
//
//   code      keys named literally in AS3/TS/XML, plus the prefix of any concatenated
//             localization/config call site (`getLocalization("pet.type." + ...)` keeps
//             `pet.type.*`), plus the transitive `${...}` closure of everything kept.
//             Always kept.
//   landing   `landing.view.<campaign>.*` is only reachable if <campaign> is scheduled in
//             a `landing.view.dynamic.slot.N.conf` variable (`<date>,<campaign>;...`,
//             read by WidgetContainerLayout) - the rest is expired promo content.
//   badges    `badge_name_/badge_desc_/badge_instruction_<code>` is keyed by a badge code
//             the server hands out. vortex-sql seeds none today, so they are all
//             unreachable; pass --badges <file> (one code per line) when it does.
//   quests    `quests.<campaign>.*` is keyed by a quest campaign from the server; same
//             situation, same escape hatch via --quests <file>.
//   promos    `featured.*` / `targeted.*` are catalog/promo offer content, keyed by offer
//             ids the server sends.
//
// Anything a rule does not name is KEPT. The point is to never lose a UI string to a
// heuristic - the dropped keys are written to a report so each rule stays auditable.
//
// ## Overrides
//
// `--overrides=<file>[,<file>]` layers extra key=value files on top of the texts before pruning.
// Later files win, and an override always wins over the raw texts file. Two things need it:
//
//   - Keys the client only has as an *embedded* asset (strings in `HabboLocalizationCom`'s
//     `default_localizations` embed, not in the texts file, so English-only and unreachable from
//     the server). Routing them through an override makes them editable without touching the
//     gitignored asset bundle. (The RPG fork dropped the wired ones, `wired.en.txt`, with wired.)
//   - Hotel-specific rewording of keys that DO exist upstream, kept in the repo instead of as an
//     untracked edit to `sources/external_flash_texts.txt` (which is gitignored).
//
// Override keys are force-kept: a prune rule can never drop one, since declaring it is proof
// enough that it is wanted.
//
// ## Merging into an already-deployed gamedata file
//
// `--merge-into=<file.json>` applies the `--overrides` to an existing JSON *in place* and writes
// nothing else. This exists because a deployed gamedata file stops being reproducible from
// `sources/`: the served copy is pruned and hand-edited (host URLs, `imager.prefix`, reworded
// strings), so a full regenerate would silently drop those. Measured on the live host, a
// regenerate would have lost 1 variable outright and reverted 9 hand-edited values. Merge when
// the target is deployed; regenerate only when rebuilding a gamedata tree from scratch.
//
// Usage:
//   node build-gamedata-locale.mjs                     # convert only, dry run
//   node build-gamedata-locale.mjs --write             # convert only, write JSON
//   node build-gamedata-locale.mjs --prune --write     # convert + prune
//   node build-gamedata-locale.mjs --prune --rules=landing,promos
//   node build-gamedata-locale.mjs --prune --badges=badges.txt --quests=quests.txt
//   node build-gamedata-locale.mjs --overrides=locale-overrides/fishing.en.txt --write
//   node build-gamedata-locale.mjs --overrides=locale-overrides/fishing.en.txt \
//        --merge-into=C:/Laragon/www/vortex-assets/gamedata/external_flash_texts.json --write
//   node build-gamedata-locale.mjs --pretty            # indented output (bigger)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');

const ALL_RULES = ['landing', 'badges', 'quests', 'promos'];

function parseArgs()
{
    const args = {
        textsIn: path.resolve(repoRoot, 'sources', 'external_flash_texts.txt'),
        varsIn: path.resolve(repoRoot, 'sources', 'external_variables.txt'),
        outDir: path.resolve(repoRoot, 'sources', 'gamedata'),
        reportDir: path.resolve(repoRoot, 'sources', 'gamedata'),
        write: false,
        prune: false,
        pretty: false,
        rules: ALL_RULES,
        badgesFile: null,
        questsFile: null,
        overrideFiles: [],
        mergeInto: null,
    };

    for(const arg of process.argv.slice(2))
    {
        if(arg === '--write') args.write = true;
        else if(arg === '--prune') args.prune = true;
        else if(arg === '--pretty') args.pretty = true;
        else if(arg === '--dry-run') args.write = false;
        else if(arg.startsWith('--rules=')) args.rules = arg.slice(8).split(',').filter(Boolean);
        else if(arg.startsWith('--badges=')) args.badgesFile = path.resolve(arg.slice(9));
        else if(arg.startsWith('--quests=')) args.questsFile = path.resolve(arg.slice(9));
        else if(arg.startsWith('--texts=')) args.textsIn = path.resolve(arg.slice(8));
        else if(arg.startsWith('--vars=')) args.varsIn = path.resolve(arg.slice(7));
        else if(arg.startsWith('--overrides='))
        {
            args.overrideFiles.push(...arg.slice(12).split(',').filter(Boolean).map((f) => path.resolve(f)));
        }
        else if(arg.startsWith('--merge-into=')) args.mergeInto = path.resolve(arg.slice(13));
        else if(arg.startsWith('--out='))
        {
            args.outDir = path.resolve(arg.slice(6));
            args.reportDir = args.outDir;
        }
        else
        {
            console.error(`Unknown argument: ${arg}`);
            process.exit(1);
        }
    }

    const unknown = args.rules.filter((r) => !ALL_RULES.includes(r));

    if(unknown.length)
    {
        console.error(`Unknown rule(s): ${unknown.join(', ')} (known: ${ALL_RULES.join(', ')})`);
        process.exit(1);
    }

    // A typo'd override path would otherwise be a silent no-op - the run succeeds and the keys
    // just are not there, which is exactly the failure mode this file's overrides exist to fix.
    for(const file of args.overrideFiles)
    {
        if(!fs.existsSync(file))
        {
            console.error(`Override file not found: ${file}`);
            process.exit(1);
        }
    }

    if(args.mergeInto)
    {
        if(!args.overrideFiles.length)
        {
            console.error('--merge-into needs at least one --overrides=<file>: it applies those and nothing else.');
            process.exit(1);
        }

        if(!fs.existsSync(args.mergeInto))
        {
            console.error(`Merge target not found: ${args.mergeInto}`);
            process.exit(1);
        }
    }

    return args;
}

// Mirrors CoreLocalizationManager.parseKeyValueLocalizationData /
// HabboConfigurationManager.parseKeyValueConfiguration - see this file's header for the
// four behaviours that differ from a naive `split('=')` dump.
function parseKeyValue(file, {unescapeNewlines})
{
    const map = new Map();
    const raw = fs.readFileSync(file, 'utf8');
    let dropped = 0;
    let duplicates = 0;

    for(const line of raw.split(/\r\n|\n|\r/))
    {
        if(line.charAt(0) === '#') continue;

        const split = line.indexOf('=');

        if(split <= 0) continue;

        const key = line.slice(0, split).trim();
        let value = line.slice(split + 1).trim();

        if(unescapeNewlines) value = value.replace(/\\n/g, '\n');

        if(value.length === 0)
        {
            dropped++;
            continue;
        }

        if(map.has(key)) duplicates++;

        map.set(key, value);
    }

    return {map, dropped, duplicates};
}

function walk(dir, extensions, out = [])
{
    let entries;

    try
    {
        entries = fs.readdirSync(dir, {withFileTypes: true});
    }
    catch
    {
        return out;
    }

    for(const entry of entries)
    {
        if(entry.name === 'node_modules' || entry.name === '.git') continue;

        const full = path.join(dir, entry.name);

        if(entry.isDirectory()) walk(full, extensions, out);
        else if(extensions.includes(path.extname(entry.name))) out.push(full);
    }

    return out;
}

// Every accessor that takes a localization key or a configuration property name, in the
// AS3 trees and in this port. Members keep their real names even in the obfuscated dumps
// (only the classes are renamed), so matching on the member is reliable there too.
const KEY_ACCESSORS = [
    'getLocalization', 'getLocalizationWithParams', 'getKey', 'hasKey', 'hasLocalization',
    'registerParameter', 'localizeText', 'getText', 'setText',
    'getProperty', 'getInterpolatedProperty', 'getBoolean', 'getInteger',
];

function scanCodeUsage()
{
    const sources = [
        ...walk(path.resolve(repoRoot, 'sources', 'WIN63-202607011411-782849652'), ['.as']),
        ...walk(path.resolve(repoRoot, 'sources', 'win63_version'), ['.as']),
        ...walk(path.resolve(repoRoot, 'sources', 'PRODUCTION-201601012205-226667486'), ['.as']),
        ...walk(path.resolve(repoRoot, 'packages'), ['.ts']),
        ...walk(path.resolve(repoRoot, 'packages', 'vortex-client', 'src'), ['.xml']),
        ...walk(path.resolve(repoRoot, 'packages', 'vortex-glaze', 'src'), ['.xml']),
    ];

    // `.getLocalization("foo")` -> exact key; `.getLocalization("foo." + x)` -> family.
    const callRe = new RegExp(
        `\\.(?:${KEY_ACCESSORS.join('|')})\\s*\\(\\s*(["'])((?:[^"'\\\\\\n]|\\\\.)*)\\1\\s*(\\+?)`, 'g');
    // `${key}` in a layout XML, an embedded configuration or another value.
    const interpolationRe = /\$\{([^}\s"']+)\}/g;
    // `private static const FOO:String = "some.key";` - keys held in a constant and passed
    // to an accessor through a variable, which the call-site regex alone cannot see.
    const constantRe = /(?:const|readonly|var|let)\s+\w+\s*(?::\s*\w+)?\s*=\s*["']([A-Za-z0-9][A-Za-z0-9._-]{3,80})["']/g;

    const exact = new Set();
    const prefixes = new Set();

    for(const file of sources)
    {
        let src;

        try
        {
            src = fs.readFileSync(file, 'utf8');
        }
        catch
        {
            continue;
        }

        let match;

        callRe.lastIndex = 0;

        while((match = callRe.exec(src)) !== null)
        {
            const literal = match[2];

            if(!literal) continue;

            if(match[3] === '+') prefixes.add(literal);
            else exact.add(literal);
        }

        interpolationRe.lastIndex = 0;

        while((match = interpolationRe.exec(src)) !== null) exact.add(match[1]);

        constantRe.lastIndex = 0;

        while((match = constantRe.exec(src)) !== null) exact.add(match[1]);
    }

    // A 1- or 2-character prefix would match most of the file; anything that short is a
    // separator fragment, not a key family.
    return {exact, prefixes: [...prefixes].filter((p) => p.length >= 3).sort()};
}

// The campaigns HabboLandingView can actually show: `landing.view.dynamic.slot.N.conf`
// holds `<date> <time>,<campaign>;<date> <time>,<campaign>` schedules, and the widget ids
// in `landing.view.dynamic.slot.N.widget` name a layout each.
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/layout/WidgetContainerLayout.as
function scheduledLandingCampaigns(vars)
{
    const campaigns = new Set();

    for(const [key, value] of vars)
    {
        if(/^landing\.view\.dynamic\.slot\.\d+\.conf$/.test(key))
        {
            for(const slot of value.split(';'))
            {
                const campaign = slot.split(',')[1]?.trim();

                if(campaign) campaigns.add(campaign);
            }
        }
        else if(/^landing\.view\.dynamic\.slot\.\d+\.widget$/.test(key))
        {
            if(value.trim()) campaigns.add(value.trim());
        }
    }

    return campaigns;
}

function readListFile(file)
{
    if(!file) return null;

    return new Set(fs.readFileSync(file, 'utf8')
        .split(/\r\n|\n|\r/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#')));
}

function buildClassifier(args, usage, vars)
{
    const active = new Set(args.rules);
    const campaigns = scheduledLandingCampaigns(vars);
    const badges = readListFile(args.badgesFile);
    const quests = readListFile(args.questsFile);

    // Returns null to keep, or a reason string to drop.
    //
    // Order matters. An exact literal is proof and always wins. The data rules come
    // next, *before* the concatenation families: a call site like
    // `getLocalization("quests." + campaign + ".name")` proves some key under `quests.*`
    // is built at runtime, not that all 8,607 of them are - the emulator's campaign list
    // is the precise answer and the prefix is the coarse one.
    // Within a rule's family, a concatenation prefix still rescues a key - but only one
    // *more specific* than the family root itself. `landing.view.` proves nothing about
    // an individual campaign; `landing.view.bonus.rare.` names a fixed widget's strings.
    const rescued = (key, root) => usage.prefixes.some((p) => p.length > root.length && key.startsWith(p));

    return function classify(key)
    {
        if(usage.exact.has(key)) return null;

        if(active.has('badges'))
        {
            const badge = /^badge_(name|desc|instruction)_(.+)$/.exec(key);

            if(badge)
            {
                if(badges?.has(badge[2]) || rescued(key, `badge_${badge[1]}_`)) return null;

                return 'badges';
            }
        }

        if(active.has('quests'))
        {
            const quest = /^quests\.([^.]+)\./.exec(key);

            // quests.nextquesttimer.* is the timer widget's own UI, not a campaign.
            if(quest && quest[1] !== 'nextquesttimer')
            {
                if(quests?.has(quest[1]) || rescued(key, 'quests.')) return null;

                return 'quests';
            }
        }

        if(active.has('landing'))
        {
            const landing = /^landing\.view\.([^.]+)\./.exec(key);

            if(landing && landing[1] !== 'dynamic' && landing[1] !== 'common')
            {
                if(campaigns.has(landing[1]) || rescued(key, 'landing.view.')) return null;

                return 'landing';
            }
        }

        if(active.has('promos'))
        {
            const promo = /^(featured|targeted)\./.exec(key);

            if(promo) return rescued(key, `${promo[1]}.`) ? null : 'promos';
        }

        return null;
    };
}

// A kept value can reference another key - `${url.prefix}/profile`, or
// `activitypoint.name.101=${seasonalcurrency.id.101}.currency.name`. Both files resolve
// against both dictionaries at runtime (CoreLocalizationManager.interpolate falls through
// to the configuration's own interpolate), so the closure has to span the pair.
function expandInterpolations(kept, texts, vars)
{
    const queue = [...kept];

    while(queue.length)
    {
        const key = queue.pop();
        const value = texts.get(key) ?? vars.get(key);

        if(!value) continue;

        const re = /\$\{([^}\s]+)\}/g;
        let match;

        while((match = re.exec(value)) !== null)
        {
            const ref = match[1];

            if(kept.has(ref)) continue;

            if(texts.has(ref) || vars.has(ref))
            {
                kept.add(ref);
                queue.push(ref);
            }
        }
    }
}

function familyOf(key)
{
    for(const prefix of ['badge_name_', 'badge_desc_', 'badge_instruction_'])
    {
        if(key.startsWith(prefix)) return `${prefix}*`;
    }

    const dot = key.split('.');

    return dot.length > 1 ? `${dot[0]}.*` : key;
}

function byteSize(map)
{
    let bytes = 0;

    for(const [key, value] of map) bytes += Buffer.byteLength(key) + Buffer.byteLength(value) + 2;

    return bytes;
}

function formatKb(bytes)
{
    return `${(bytes / 1024).toFixed(0)} KB`;
}

// The asset host as it is written in the dump. `vortex-assets.local` is `127.0.0.1` in this
// machine's hosts file, so a value carrying it resolves to whoever is READING it - on a phone or
// through a tunnel, the visitor's own loopback, where nothing is listening. Over HTTPS it is also
// blocked outright as mixed content.
//
// The two malformed shapes are not typos on this side: the dump really contains
// `https:http://vortex-assets.local/...` and `/http://vortex-assets.local/...`, left by a
// find/replace over the original `https://images.habbo.com`. Both leading forms are absorbed, and
// the stray `/` in particular has to be - `badge.image.path` would otherwise keep a slash the
// placeholder already supplies.
const ASSET_HOST = /\/?(?:https?:)?https?:\/\/vortex-assets\.local/g;

// Replaces that host with `${url.prefix}`, which is what the rest of the configuration already
// uses and what every consumer resolves for itself: the browser client fills it with the origin
// it was served from (App.ts::fillOriginPrefixes, so /client, a bare root and a tunnel each get
// the right one), and vortex-imager sets it to its own `assetsBaseUrl` before downloading
// (AvatarRenderService::bootConfiguration). This is what `flash.client.url` and
// `dynamic.download.url` need to be reachable off this machine at all - with the absolute host
// the client stops at "Failed to download required client libraries".
//
// A bare path would only serve the browser: `fetch('/c_images/…')` has no base in Node and throws,
// which is exactly how the imager reads `image.library.badgepart.url`.
//
// Only the variables are rewritten. The texts bundle is prose, and a URL inside a sentence is
// content, not a fetch this client performs.
function relativiseAssetHost(vars)
{
    let count = 0;

    for(const [key, value] of vars)
    {
        if(typeof value !== 'string') continue;

        const rewritten = value.replace(ASSET_HOST, '${url.prefix}');

        if(rewritten === value) continue;

        vars.set(key, rewritten);
        count++;
    }

    return count;
}

// Applies the override files to an existing gamedata JSON and leaves every other key untouched.
// A backup is written next to the target the first time, so a bad merge is always undoable.
function mergeIntoJson(args)
{
    const before = JSON.parse(fs.readFileSync(args.mergeInto, 'utf8'));
    const merged = {...before};
    const added = [];
    const replaced = [];

    for(const file of args.overrideFiles)
    {
        const override = parseKeyValue(file, {unescapeNewlines: true});

        for(const [key, value] of override.map)
        {
            if(!(key in merged)) added.push(key);
            else if(merged[key] !== value) replaced.push(key);

            merged[key] = value;
        }

        console.log(`override ${path.relative(repoRoot, file)}: ${override.map.size} keys`);
    }

    console.log(`\nmerge target: ${args.mergeInto}`);
    console.log(`  ${Object.keys(before).length} keys before, ${Object.keys(merged).length} after`);
    console.log(`  ${added.length} added, ${replaced.length} replaced, ${Object.keys(before).length - replaced.length} untouched`);

    if(replaced.length) console.log(`  replaced: ${replaced.slice(0, 10).join(', ')}${replaced.length > 10 ? ', ...' : ''}`);

    if(!args.write)
    {
        console.log('\nDry run - re-run with --write.');

        return;
    }

    const backup = `${args.mergeInto}.bak`;

    if(!fs.existsSync(backup))
    {
        fs.copyFileSync(args.mergeInto, backup);
        console.log(`\nWrote backup ${backup}`);
    }

    fs.writeFileSync(args.mergeInto, JSON.stringify(merged, null, args.pretty ? 2 : 0), 'utf8');

    console.log(`Wrote ${args.mergeInto}`);
}

function main()
{
    const args = parseArgs();

    if(args.mergeInto)
    {
        mergeIntoJson(args);

        return;
    }

    const texts = parseKeyValue(args.textsIn, {unescapeNewlines: true});
    const vars = parseKeyValue(args.varsIn, {unescapeNewlines: false});

    console.log(`texts: ${texts.map.size} keys (${formatKb(byteSize(texts.map))}), ${texts.dropped} empty values skipped, ${texts.duplicates} duplicate keys`);
    console.log(`vars : ${vars.map.size} keys (${formatKb(byteSize(vars.map))}), ${vars.dropped} empty values skipped, ${vars.duplicates} duplicate keys`);

    // Layered on top of the texts, in the order given: later files win. Applied before pruning so
    // that an override's `${...}` references get pulled in by the interpolation closure too.
    const overridden = new Set();

    for(const file of args.overrideFiles)
    {
        const override = parseKeyValue(file, {unescapeNewlines: true});
        let added = 0;
        let replaced = 0;

        for(const [key, value] of override.map)
        {
            if(texts.map.has(key)) replaced++;
            else added++;

            texts.map.set(key, value);
            overridden.add(key);
        }

        console.log(`override ${path.relative(repoRoot, file)}: ${override.map.size} keys (${added} new, ${replaced} replacing an upstream value)`);
    }

    let keptTexts = texts.map;
    let keptVars = vars.map;
    const report = [];

    if(args.prune)
    {
        const usage = scanCodeUsage();

        console.log(`\ncode scan: ${usage.exact.size} literal keys, ${usage.prefixes.length} key families from concatenated call sites`);

        const classify = buildClassifier(args, usage, vars.map);
        const dropped = new Map();
        const keep = new Set();

        for(const map of [texts.map, vars.map])
        {
            for(const key of map.keys())
            {
                // Declaring a key in an override file is proof it is wanted, so it outranks every
                // drop rule - otherwise a hotel-specific `landing.view.*` reword would be pruned.
                const reason = overridden.has(key) ? null : classify(key);

                if(reason === null) keep.add(key);
                else
                {
                    const family = `${reason}/${familyOf(key)}`;

                    if(!dropped.has(family)) dropped.set(family, []);

                    dropped.get(family).push(key);
                }
            }
        }

        expandInterpolations(keep, texts.map, vars.map);

        // A key rescued by the ${} closure is no longer dropped.
        for(const [family, keys] of dropped) dropped.set(family, keys.filter((k) => !keep.has(k)));

        keptTexts = new Map([...texts.map].filter(([k]) => keep.has(k)));
        keptVars = new Map([...vars.map].filter(([k]) => keep.has(k)));

        console.log('\ndropped by rule:');

        const byRule = new Map();

        for(const [family, keys] of dropped)
        {
            if(!keys.length) continue;

            const rule = family.split('/')[0];

            byRule.set(rule, (byRule.get(rule) ?? 0) + keys.length);
            report.push(`## ${family} (${keys.length} keys)`, ...keys.map((k) => `  ${k}`), '');
        }

        for(const [rule, count] of [...byRule].sort((a, b) => b[1] - a[1]))
        {
            console.log(`  ${rule.padEnd(10)} ${String(count).padStart(6)} keys`);
        }
    }

    const relativised = relativiseAssetHost(keptVars);

    const textsJson = JSON.stringify(Object.fromEntries(keptTexts), null, args.pretty ? 2 : 0);
    const varsJson = JSON.stringify(Object.fromEntries(keptVars), null, args.pretty ? 2 : 0);

    console.log(`\nasset host made relative in ${relativised} value(s)`);

    console.log(`\ntexts out: ${keptTexts.size} keys, ${formatKb(Buffer.byteLength(textsJson))}`);
    console.log(`vars  out: ${keptVars.size} keys, ${formatKb(Buffer.byteLength(varsJson))}`);

    const textsOut = path.join(args.outDir, 'external_flash_texts.json');
    const varsOut = path.join(args.outDir, 'external_variables.json');
    const reportOut = path.join(args.reportDir, 'locale-pruned-keys.txt');

    if(!args.write)
    {
        console.log(`\nDry run - would write:\n  ${textsOut}\n  ${varsOut}${report.length ? `\n  ${reportOut}` : ''}\nRe-run with --write.`);

        return;
    }

    fs.mkdirSync(args.outDir, {recursive: true});
    fs.writeFileSync(textsOut, textsJson, 'utf8');
    fs.writeFileSync(varsOut, varsJson, 'utf8');

    console.log(`\nWrote ${textsOut}\nWrote ${varsOut}`);

    if(report.length)
    {
        fs.writeFileSync(reportOut, report.join('\n'), 'utf8');

        console.log(`Wrote ${reportOut} (every dropped key, grouped by rule - review this before shipping)`);
    }
}

main();
