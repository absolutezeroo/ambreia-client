#!/usr/bin/env node
// Imports the images AIR-1.0.31 has and the primary dump does not, under their real asset names.
//
// WHY A SEPARATE TOOL. import-crypted-images.mjs reads the WIN63 dump's own src/images/ and joins
// through stripTypeSuffix(), which deliberately collapses "name_png$hash" to "name". Neither
// applies here: the AIR dump ships no images at all (its scripts/binaryData/ holds XML and text
// only), and the join has to be on the WHOLE linkage name for the same reason
// build-window-assets.mjs insists on it - two embeds can share a short name.
//
// WHERE THE FILES COME FROM. The AIR client the launcher downloaded, cut open with JPEXS:
//
//   ffdec-cli -export image <dir> "%APPDATA%/Habbo Launcher/downloads/air/<build>/HabboAir.swf"
//
// which writes "<charId>_<class>.<ext>", <class> being either the embed's linkage name
// ("background_png$8183b286...") or its obfuscated "_SafeCls_N". Pass that directory as --images.
// It is not a default: it is outside the repo and machine-specific.
//
// THE JOIN. Every `<fieldName>:Class = <ref>` in AIR's *Com.as AND *Lib.as manifests, with <ref>
// resolved to a linkage name through the decompiler's `@identifier` footers. The field name is the
// string AS3 passes to assets.getAssetByName(), so it is the name to ship under - except that
// image fields often carry a redundant "_png" suffix the runtime does not use: `user_typing_png`
// IS the already-shipped `user_typing.png`. Stripping it is what keeps this tool from "finding"
// 474 new images that are not new.
//
// WHAT IT WRITES. Only names src/assets/images/ does not already have - additive, never
// overwrites, same rule as build-window-assets.mjs's AIR merge. Today that is 142 files: the 121
// variablefx_* the room-object renderers read through AssetLibraryVariableFxAssetProvider, plus 21
// others AIR added.
//
// AND THE TRAP AFTER THIS ONE. Shipping the file is half the job. App.ts registers only a SCOPED
// subset of images/ into the asset library (see readImageAssets there), so a bitmap fetched by
// assets.getAssetByName() whose prefix is not in that scope renders nothing, silently. A new
// prefix here needs a line there too.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildObfuscatedNameMap, findAsFiles} from './lib/cryptedManifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');

const DEFAULT_SOURCE = path.resolve(repoRoot, 'sources', 'AIR-1.0.31');
const DEFAULT_OUT = path.resolve(__dirname, '../src/assets/images');

const FIELD_RE = /public\s+static\s+(?:var|const)\s+(\w+)\s*:\s*Class\s*=\s*([\w$]+)\s*;/g;
const IMAGE_EXT_RE = /\.(png|gif|jpg|jpeg)$/i;

function parseArgs()
{
    const argv = process.argv.slice(2);
    // AIR_IMAGE_EXPORT is how install.mjs reaches it: the export lives outside the repo, so there
    // is no default worth hard-coding and the variable is what says "I have one".
    const args = {
        source: DEFAULT_SOURCE,
        images: process.env.AIR_IMAGE_EXPORT ? path.resolve(process.env.AIR_IMAGE_EXPORT) : null,
        out: DEFAULT_OUT,
        dryRun: false
    };

    for (let i = 0; i < argv.length; i += 1)
    {
        if (argv[i] === '--source') { args.source = path.resolve(argv[i + 1]); i += 1; }
        else if (argv[i] === '--images') { args.images = path.resolve(argv[i + 1]); i += 1; }
        else if (argv[i] === '--out') { args.out = path.resolve(argv[i + 1]); i += 1; }
        else if (argv[i] === '--dry-run') { args.dryRun = true; }
    }

    return args;
}

/**
 * Indexes an ffdec image export by every name a manifest could refer to it as - the embed's
 * linkage name and, when the export fell back to it, the obfuscated class.
 *
 * Both are needed: of the 123 variablefx assets, 49 export under their linkage and 72 under
 * `_SafeCls_N`. Indexing one of the two silently loses the other half.
 */
function indexExportedImages(dir)
{
    const index = new Map();

    for (const name of fs.readdirSync(dir))
    {
        if (!IMAGE_EXT_RE.test(name)) continue;

        const identifier = /^\d+_(.+)\.\w+$/.exec(name)?.[1];

        if (identifier && !index.has(identifier)) index.set(identifier, path.join(dir, name));
    }

    return index;
}

/** The name AS3 asks the asset library for - the field name, minus the redundant `_png`. */
function assetName(fieldName)
{
    return fieldName.replace(/_png$/, '');
}

function main()
{
    const args = parseArgs();

    // Not an error: most runs of the asset pipeline have no SWF export to hand, and the images
    // they need are already in vortex-client-assets.zip. Saying so and stopping is the honest
    // outcome; failing the build would make a normal `node install.mjs` red for nothing.
    if (!args.images)
    {
        console.log('No AIR image export given - nothing to import.');
        console.log('Set AIR_IMAGE_EXPORT, or pass --images <dir>, pointing at an');
        console.log('`ffdec-cli -export image` of HabboAir.swf. See this file\'s header.');
        process.exit(0);
    }

    // Located by where the manifests are, not by the directory's name - the dump's root has been
    // called both `scripts/` and `src/`, and hard-coding either turns a rename into a silent
    // "imported 0 images".
    const scripts = [path.join(args.source, 'src'), path.join(args.source, 'scripts'), args.source]
        .find((dir) => fs.existsSync(dir) && fs.readdirSync(dir).some((name) => /Com\.as$/.test(name)));

    if (!scripts)
    {
        console.error(`No *Com.as manifests under ${args.source} (looked in src/, scripts/ and the root)`);
        process.exit(1);
    }

    const obfuscatedNameMap = buildObfuscatedNameMap(findAsFiles(scripts));
    const exported = indexExportedImages(args.images);
    const shipped = new Set(fs.readdirSync(args.out).map((f) => f.replace(IMAGE_EXT_RE, '')));

    const manifests = fs.readdirSync(scripts).filter((f) => /(Com|Lib)\.as$/.test(f));
    const planned = new Map();
    let declarations = 0;
    let notAnImage = 0;
    let alreadyShipped = 0;

    for (const manifest of manifests)
    {
        const content = fs.readFileSync(path.join(scripts, manifest), 'utf8');

        FIELD_RE.lastIndex = 0;

        let match;

        while ((match = FIELD_RE.exec(content)) !== null)
        {
            const [, fieldName, ref] = match;

            declarations += 1;

            const linkage = obfuscatedNameMap.get(ref) ?? ref;
            const file = exported.get(linkage) ?? exported.get(ref) ?? null;

            // Layouts, sounds, fonts and text blobs are declared in the same manifests and belong
            // to other pipelines; they simply are not in an image export.
            if (!file)
            {
                notAnImage += 1;
                continue;
            }

            const name = assetName(fieldName);

            if (shipped.has(name))
            {
                alreadyShipped += 1;
                continue;
            }

            if (!planned.has(name)) planned.set(name, {file, manifest, fieldName});
        }
    }

    if (!args.dryRun)
    {
        for (const [name, {file}] of planned)
        {
            fs.copyFileSync(file, path.join(args.out, `${name}${path.extname(file)}`));
        }
    }

    const variableFx = [...planned.keys()].filter((n) => n.startsWith('variablefx')).length;

    console.log(`Manifests read:       ${manifests.length} (*Com.as + *Lib.as)`);
    console.log(`Declarations:         ${declarations}`);
    console.log(`Not in the export:    ${notAnImage} (layouts, sounds, fonts, text)`);
    console.log(`Already shipped:      ${alreadyShipped}`);
    console.log(`Written:              ${planned.size} -> ${path.relative(repoRoot, args.out)}`);
    console.log(`  of which variablefx_*: ${variableFx}`);

    for (const name of [...planned.keys()].filter((n) => !n.startsWith('variablefx')).sort())
    {
        console.log(`  + ${name}`);
    }

    if (args.dryRun) console.log('\n(dry run - nothing written)');
}

main();
