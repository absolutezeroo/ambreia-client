// habbo.com's own translations, one file per language, from
//
//     https://images.habbo.com/habbo-web-l10n/<lang>.json
//
// which is what its index shell loads. A template names its key in `translate="…"`, so a label is
// never a guess in ANY language — the same key answers in all of them.
//
//   node tools/fetch-l10n.mjs            # refresh the languages already in src/locales/
//   node tools/fetch-l10n.mjs en de      # add these
//   VITE_HOTEL_NAME=Foo node tools/…     # …under another hotel's name
//
// writes src/locales/<lang>.json. `src/lib/i18n.ts` discovers them by globbing that directory, so
// a language is added by dropping a file in it and nothing in the code names one.
//
// Reachable today: fr, en, de, es, it, nl, fi, br, tr. `pt` is 404 — Brazil's code here is `br`.
//
// THE HOTEL'S NAME IS SUBSTITUTED ON THE WAY IN, and that is not cosmetic: 283 of French's 1,692
// strings say "Habbo", from "Rejoins Habbo!" to every ban notice. It used to be done by hand, in
// `fr.json` only, which is why it was silently undone the first time that file was refreshed and
// why the other eight languages would have welcomed players to the wrong hotel.
//
// The rule is `\bHabbo`, case-sensitive, with NO closing word boundary, and the case is what makes
// it safe:
//
//   HABBO           left alone — the SMS keywords ("send HABBO to 27226") and the Sulake trademark
//                   line, which are legally and operationally not the hotel's name
//   habboClubDays   left alone — an interpolation name the site passes by that spelling
//   www.habbo.fr    left alone — a hostname, lowercase; `/playing-habbo/…` likewise
//
// so no URL and no placeholder needs protecting.
//
// The missing closing boundary is deliberate and is the previous maintainer's decision, kept: the
// name is INFLECTED in several of these languages — French pluralises it ("les autres Habbos"),
// Finnish declines it ("suomenkieliseen Habboon") — and a mechanical rename has no way to inflect
// the new one correctly. Stopping at `\bHabbo\b` would leave those strings naming the wrong hotel,
// which is worse than "Vortexs"; a language that cares can override the string in
// `src/locales/site/<lang>.json`, which this tool never touches. `HabboFR` in the social URLs is
// caught by the same missing boundary, which is what the hand-edited file did too.
//
// Strings the port ADDS rather than renames do not belong here at all — same overlay.
const HOTEL = process.env.VITE_HOTEL_NAME || 'Vortex';

function rename(value)
{
    return typeof value === 'string' ? value.replace(/\bHabbo/g, HOTEL) : value;
}
import {writeFileSync, mkdirSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const BASE = 'https://images.habbo.com/habbo-web-l10n';
const TARGET = join(ROOT, 'src', 'locales');

// No default list in here either: with no argument it refreshes what the hotel already ships, so
// this tool cannot quietly decide which languages the site has.
const asked = process.argv.slice(2);
const languages = asked.length
    ? asked
    : existsSync(TARGET)
        ? readdirSync(TARGET).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''))
        : [];

if(!languages.length)
{
    process.stderr.write('nothing to fetch: src/locales/ is empty and no language was named.\n');
    process.exit(1);
}

mkdirSync(TARGET, {recursive: true});

for(const lang of languages)
{
    const response = await fetch(`${BASE}/${lang}.json`);

    if(!response.ok)
    {
        // Named and skipped rather than fatal: one unreachable language must not throw away the
        // ones already downloaded in the same run.
        process.stderr.write(`${lang}: ${response.status}, skipped\n`);
        continue;
    }

    const keys = await response.json();
    let renamed = 0;

    for(const [key, value] of Object.entries(keys))
    {
        keys[key] = rename(value);

        if(keys[key] !== value)
        {
            renamed += 1;
        }
    }

    writeFileSync(join(TARGET, `${lang}.json`), `${JSON.stringify(keys, null, 0)}\n`, 'utf8');
    process.stdout.write(`${lang}: ${Object.keys(keys).length} keys, ${renamed} renamed to ${HOTEL}\n`);
}
