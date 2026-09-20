#!/usr/bin/env node
// Extracts the freeflowchat chat-style catalog (chatstyles_xml + 89 styles' regpoints/
// bitmap assets, declared in sources/WIN63-202607011411-782849652/src/binaryData/
// HabboFreeFlowChatCom.as) into packages/vortex-client/src/assets, so
// ChatStyleLibrary.ts (which already reads these exact asset names - see its own
// TODO(AS3) header comment) has real data to load instead of an empty catalog.
//
// Why this can't reuse import-crypted-images.mjs's resolveRawFileName()/
// buildEmbedToFieldNames(): those strip the "$<hash>" suffix off every embed name before
// mapping, so all ~89 different "style_<id>_chat_bubble_base" embeds (one raw PNG per
// style, all sharing the stripped short name "chat_bubble_base") collapse onto a single
// map key - fine for window-layouts/skins (each stripped name is normally unique), wrong
// here. This tool resolves by the FULL hash-bearing value instead, so distinct styles
// never alias onto the same file.
//
// Run with --dry-run (default) to preview, --write to actually copy files.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadCryptedManifest} from './lib/cryptedManifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');

const DEFAULT_CRYPTED_ROOT = path.resolve(repoRoot, 'sources', 'WIN63-202607011411-782849652');
const DEFAULT_CONFIG_OUT = path.resolve(__dirname, '../src/assets/configurations');
const DEFAULT_IMAGES_OUT = path.resolve(__dirname, '../src/assets/images');

const MANIFEST_RELATIVE_PATH = path.join('src', 'binaryData', 'HabboFreeFlowChatCom.as');
const FIELD_RE = /public\s+static\s+var\s+(\w+)\s*:\s*Class\s*=\s*([\w$]+)\s*;/g;
// `txt` belongs here: every style's regpoints embed is declared as
// `_regPoints_txt$<hash>`, and leaving the extension out made all 46 of them fall through
// to the obfuscated-name map (which only keys `_SafeCls_N`), resolve to null, and be
// skipped. Six of the six regpoints files that then never shipped are the notification_*
// styles, whose ChatStyle therefore came up with a zeroed 9-slice grid and zeroed text
// margins - a bubble that cannot stretch, with the text drawn outside it.
const RAW_EMBED_RE = /_(png|gif|jpg|swf|mp3|ttf|txt|xml)\$/;

// Longest-suffix-first so "chat_bubble_emblem_multiline" isn't mis-split as
// "chat_bubble_emblem" with a stray "_multiline" left in the style id.
const IMAGE_SUFFIXES = [
    'chat_bubble_emblem_multiline',
    'chat_bubble_pointer',
    'chat_bubble_color',
    'chat_bubble_emblem',
    'chat_bubble_base',
    'selector_preview',
    'icon'
];
const TEXT_SUFFIX = 'regpoints';
const STYLE_SUFFIXES = [...IMAGE_SUFFIXES, TEXT_SUFFIX];

const SUFFIX_TO_MANIFEST_FLAG =
{
    'chat_bubble_base': 'hasBase',
    'chat_bubble_pointer': 'hasPointer',
    'chat_bubble_emblem': 'hasEmblem',
    'chat_bubble_emblem_multiline': 'hasEmblemMultiline',
    'chat_bubble_color': 'hasColor',
    'icon': 'hasIcon',
    'selector_preview': 'hasSelectorPreview',
    'regpoints': 'hasRegpoints'
};

function parseArgs()
{
    const argv = process.argv.slice(2);
    const args =
    {
        write: argv.includes('--write'),
        cryptedRoot: DEFAULT_CRYPTED_ROOT,
        configOut: DEFAULT_CONFIG_OUT,
        imagesOut: DEFAULT_IMAGES_OUT
    };

    for(let i = 0; i < argv.length; i += 1)
    {
        if(argv[i] === '--crypted-root') { args.cryptedRoot = path.resolve(argv[i + 1]); i += 1; }
        else if(argv[i] === '--config-out') { args.configOut = path.resolve(argv[i + 1]); i += 1; }
        else if(argv[i] === '--images-out') { args.imagesOut = path.resolve(argv[i + 1]); i += 1; }
    }

    return args;
}

// "style_bats_chat_bubble_base" -> {id: "bats", suffix: "chat_bubble_base"}. Style ids
// themselves can contain underscores (e.g. "bot_frank_large"), so this must match against
// the known suffix list rather than splitting on the last/first underscore.
function splitStyleField(fieldName)
{
    if(!fieldName.startsWith('style_')) return null;

    for(const suffix of STYLE_SUFFIXES)
    {
        if(fieldName.endsWith(`_${suffix}`))
        {
            const id = fieldName.slice('style_'.length, -(suffix.length + 1));

            return {id, suffix};
        }
    }

    return null;
}

// A *Com.as refClass is either already a direct hash-bearing embed identifier
// ("chat_bubble_base_png$<hash>") or an obfuscated "_SafeCls_N" needing the shared
// @identifier map to recover the real (still hash-bearing) value.
function resolveFieldRawValue(refClass, obfuscatedNameMap)
{
    if(RAW_EMBED_RE.test(refClass)) return refClass;

    return obfuscatedNameMap.get(refClass) ?? null;
}

// Builds rawValue (full, hash-bearing) -> absolute raw-dump file path for one directory.
// Deliberately keeps the full value (unlike lib/cryptedManifest.mjs's own
// resolveRawFileName(), which strips it) so distinct same-kind embeds never collide.
function buildFullValueIndex(dir, obfuscatedNameMap)
{
    const index = new Map();

    if(!fs.existsSync(dir)) return index;

    for(const fileName of fs.readdirSync(dir))
    {
        const match = /^\d+_(.+)\.\w+$/i.exec(fileName);

        if(!match) continue;

        const stem = match[1];
        const rawValue = RAW_EMBED_RE.test(stem) ? stem : (obfuscatedNameMap.get(stem) ?? null);

        if(!rawValue) continue;
        if(!index.has(rawValue)) index.set(rawValue, path.join(dir, fileName));
    }

    return index;
}

function copyIfMissing(sourcePath, targetPath, write)
{
    if(fs.existsSync(targetPath)) return 'exists';

    if(write)
    {
        fs.mkdirSync(path.dirname(targetPath), {recursive: true});
        fs.copyFileSync(sourcePath, targetPath);
    }

    return write ? 'copied' : 'would-copy';
}

function main()
{
    const args = parseArgs();
    const manifestPath = path.join(args.cryptedRoot, MANIFEST_RELATIVE_PATH);

    if(!fs.existsSync(manifestPath))
    {
        console.error(`HabboFreeFlowChatCom.as not found at ${manifestPath} - skipping.`);
        process.exit(0);
    }

    console.log('Loading crypted-tree name manifest...');
    const {obfuscatedNameMap} = loadCryptedManifest(args.cryptedRoot);

    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const fields = new Map();
    let match;

    while((match = FIELD_RE.exec(manifestContent)) !== null) fields.set(match[1], match[2]);

    console.log(`Parsed ${fields.size} fields from HabboFreeFlowChatCom.as.`);

    const imagesIndex = buildFullValueIndex(path.join(args.cryptedRoot, 'src', 'images'), obfuscatedNameMap);
    const layoutsIndex = buildFullValueIndex(path.join(args.cryptedRoot, 'src', 'layouts'), obfuscatedNameMap);

    console.log(`Indexed ${imagesIndex.size} raw images, ${layoutsIndex.size} raw layout-tree (xml/regpoints) files.`);

    let copied = 0;
    let alreadyPresent = 0;
    let unresolved = 0;

    // chatstyles_xml itself - the <style id=".." assetId=".."/> catalog document.
    const catalogRefClass = fields.get('chatstyles_xml');
    const catalogRawValue = catalogRefClass ? resolveFieldRawValue(catalogRefClass, obfuscatedNameMap) : null;
    const catalogSourcePath = catalogRawValue ? layoutsIndex.get(catalogRawValue) : null;

    if(catalogSourcePath)
    {
        const targetPath = path.join(args.configOut, 'chatstyles_xml.xml');
        const result = copyIfMissing(catalogSourcePath, targetPath, args.write);

        if(result === 'exists') alreadyPresent++;
        else copied++;

        console.log(`${result === 'would-copy' ? '[dry-run] would copy' : result === 'copied' ? 'Copied' : 'Already present:'} chatstyles_xml -> ${path.relative(repoRoot, targetPath)}`);
    }
    else
    {
        unresolved++;
        console.warn('chatstyles_xml: could not resolve to a raw file - catalog will be missing.');
    }

    // Per-style regpoints/bitmap assets.
    const manifestIndex = {};

    for(const [fieldName, refClass] of fields)
    {
        const parsed = splitStyleField(fieldName);

        if(!parsed) continue;

        const {id, suffix} = parsed;

        if(!manifestIndex[id])
        {
            manifestIndex[id] = {hasPointer: false, hasEmblem: false, hasEmblemMultiline: false, hasIcon: false, hasColor: false, hasBase: false, hasSelectorPreview: false, hasRegpoints: false};
        }

        const rawValue = resolveFieldRawValue(refClass, obfuscatedNameMap);
        const isText = suffix === TEXT_SUFFIX;
        const sourceIndex = isText ? layoutsIndex : imagesIndex;
        const sourcePath = rawValue ? sourceIndex.get(rawValue) : null;

        if(!sourcePath)
        {
            unresolved++;
            console.warn(`style_${id}_${suffix}: could not resolve to a raw file - skipped.`);
            continue;
        }

        const targetPath = isText
            ? path.join(args.configOut, `style_${id}_${suffix}.txt`)
            : path.join(args.imagesOut, `style_${id}_${suffix}.png`);

        const result = copyIfMissing(sourcePath, targetPath, args.write);

        if(result === 'exists') alreadyPresent++;
        else copied++;

        const flagKey = SUFFIX_TO_MANIFEST_FLAG[suffix];

        if(flagKey) manifestIndex[id][flagKey] = true;
    }

    const styleCount = Object.keys(manifestIndex).length;
    const completeStyles = Object.values(manifestIndex).filter((s) => s.hasRegpoints && s.hasBase && s.hasSelectorPreview).length;

    console.log(`\n${styleCount} style(s) found, ${completeStyles} with a complete regpoints+base+selector_preview set.`);
    console.log(`${copied} file(s) ${args.write ? 'copied' : 'would be copied'}, ${alreadyPresent} already present, ${unresolved} unresolved.`);

    const manifestOutPath = path.join(args.configOut, 'chatstyles-manifest.json');

    if(args.write)
    {
        fs.mkdirSync(args.configOut, {recursive: true});
        fs.writeFileSync(manifestOutPath, JSON.stringify(manifestIndex, null, 2), 'utf8');
        console.log(`Wrote ${path.relative(repoRoot, manifestOutPath)}`);
    }
    else
    {
        console.log(`[dry-run] would write ${path.relative(repoRoot, manifestOutPath)}`);
    }
}

main();
