#!/usr/bin/env node
// Builds the client's window-layout and window-skin assets straight from the AS3 asset
// library, named exactly as AS3 names them.
//
// Replaces compile-window-layouts.mjs + compile-window-skins.mjs + import-crypted-layouts.mjs
// + import-crypted-skins.mjs + build-asset-name-manifest.mjs, which between them compiled the
// XML into JSON, re-derived names three different ways, and filled each other's gaps.
//
// NAMING. Every *Com.as declares `public static var <fieldName>:Class = <ref>;` where
// <fieldName> is the exact string AS3 passes to assets.getAssetByName(...) - see
// com/sulake/habbo/window/HabboWindowManagerComponent.as::init asking for
// "habbo_element_description_xml". Nothing else in the tree is authoritative: the XML's own
// <layout name="..."> is a Flash-authoring label AS3 never reads.
//
// JOINING declarations to files. Both a <ref> and a dump filename resolve to an embed's raw
// linkage name ("bubble_xml$44e3d739...", hash included), directly when clean or via the
// obfuscator's `@identifier _SafeCls_N = "..."` footers otherwise. That raw name is the join
// key. It must be used WHOLE: lib/cryptedManifest.mjs's stripTypeSuffix() reduces both
// "avatar_image_xml$fb2b1e72..." (HabboFriendBar) and "avatar_image_xml$a162559f..."
// (HabboWindowManager) to "avatar_image", collapsing two genuinely different layouts into
// one - which is how the old pipeline came to ship only one of them.
//
// COLLISIONS. AS3 asset libraries are per-component, so two components may declare the same
// fieldName for different embeds; those are qualified by component here. Where they resolve
// to the same embed they are one shared asset and keep the bare name.
//
// FORMAT. The source XML is emitted verbatim. The engine's WindowParser folds <params>
// children into the param bitfield and URL-decodes name/tags/caption at runtime, exactly as
// AS3 does, so there is nothing to pre-bake - and App.ts hands the XML string straight to
// windowManager.registerWidgetLayout(), which has always wanted XML.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import zlib from 'node:zlib';
import {buildObfuscatedNameMap, findAsFiles, findComFiles} from './lib/cryptedManifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');

const DEFAULT_SOURCE = path.resolve(repoRoot, 'sources', 'WIN63-202607011411-782849652');
const DEFAULT_LAYOUTS_OUT = path.resolve(__dirname, '../src/assets/window-layouts');
const DEFAULT_SKINS_OUT = path.resolve(__dirname, '../src/assets/window-skins');

// SECOND SOURCE. AIR-1.0.31 is a later client than the primary dump and carries assets for
// features WIN63 does not have at all - raid protection is the first. It is a supplement, never a
// replacement: an asset present in both keeps the PRIMARY copy, because the port is written
// against WIN63's behaviour and silently swapping ~200 shared assets to a newer build is not a
// thing to do as a side effect of adding one window.
const DEFAULT_AIR_SOURCE = path.resolve(repoRoot, 'sources', 'AIR-1.0.31');

// The exceptions to that rule, each one a deliberate, checked decision.
//
// `iro_room_details_framed_xml`: the AIR copy differs from WIN63's by exactly one line, the
// `raid_protection_settings_button` in `buttons_cont` (plus a staff_pick/floor_plan sibling swap
// that changes nothing - both sit at 0,0 and RoomInfoViewCtrl re-stacks the container through
// Util.moveChildrenToColumn). Without it RoomInfoViewCtrl has no button to show and the raid
// protection window is reachable only through its link. Re-check the delta with:
//   diff sources/AIR-1.0.31/src/binaryData/3128__SafeCls_1100.bin \
//        packages/vortex-client/src/assets/window-layouts/iro_room_details_framed_xml.xml
// If it has grown past that button, decide again rather than widening this set by reflex.
const AIR_PREFERRED = new Set(['iro_room_details_framed_xml']);

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/HabboWindowManagerComponent.as::init()
// The element description shares the <skin> root element but is not a drawable skin - it is
// the type/style -> renderer+asset table, loaded through its own manager entry point.
const ELEMENT_DESCRIPTION_ASSET = 'habbo_element_description_xml';

const FIELD_RE = /public\s+static\s+(?:var|const)\s+(\w+)\s*:\s*Class\s*=\s*([\w$]+)\s*;/g;

// A Flex embed's linkage name is "<name>_<type>$<hash>". The type is read generically rather
// than matched against a fixed list: the library carries xml, png, gif, jpg, swf, mp3, ttf and
// txt embeds, and a missing entry would silently misfile an asset rather than fail.
const EMBED_LINKAGE_RE = /_([a-z0-9]+)\$/i;

function parseArgs()
{
    const argv = process.argv.slice(2);
    const args =
    {
        source: DEFAULT_SOURCE,
        airSource: DEFAULT_AIR_SOURCE,
        layoutsOut: DEFAULT_LAYOUTS_OUT,
        skinsOut: DEFAULT_SKINS_OUT,
        dryRun: false
    };

    for (let i = 0; i < argv.length; i += 1)
    {
        if (argv[i] === '--source') { args.source = path.resolve(argv[i + 1]); i += 1; }
        else if (argv[i] === '--air-source') { args.airSource = path.resolve(argv[i + 1]); i += 1; }
        else if (argv[i] === '--no-air') { args.airSource = null; }
        else if (argv[i] === '--layouts-out') { args.layoutsOut = path.resolve(argv[i + 1]); i += 1; }
        else if (argv[i] === '--skins-out') { args.skinsOut = path.resolve(argv[i + 1]); i += 1; }
        else if (argv[i] === '--dry-run') { args.dryRun = true; }
    }

    return args;
}

/**
 * Locates the three things a source tree is read for, whatever shape it has.
 *
 * The two dumps are laid out differently, and one of the differences is a trap: both have a
 * `binaryData/` directory and it means the opposite thing in each.
 *
 *   WIN63  <root>/binaryData/*Com.as       the component manifests
 *          <root>/layouts/, <root>/_assets/ the embedded files
 *
 *   AIR    <root>/*Com.as                  the component manifests, at the root
 *          <root>/binaryData/*.bin         the embedded files
 *
 * DETECTED BY WHERE THE MANIFESTS ARE, never by the directory's name. An earlier version keyed on
 * the root being called `src` or `scripts`, and renaming AIR's `scripts/` to `src/` — which makes
 * it match the other dumps and is an entirely reasonable thing to do — silently turned the AIR
 * source into zero assets: it matched the WIN63 branch, looked for manifests among the .bin blobs,
 * found none, and reported success. Nothing downstream cares what the directory is called, so
 * nothing here should either.
 *
 * Everything after this point is identical for both: the same `<fieldName>:Class = <ref>`
 * declarations joined to the same `<seq>_<identifier>` filenames through the same `@identifier`
 * footers.
 */
function resolveTree(sourceRoot)
{
    const hasComFiles = (dir) => fs.existsSync(dir)
        && fs.readdirSync(dir).some((name) => /Com\.as$/.test(name));

    for (const root of [path.join(sourceRoot, 'src'), path.join(sourceRoot, 'scripts'), sourceRoot])
    {
        if (!fs.existsSync(root)) continue;

        const binaryData = path.join(root, 'binaryData');

        if (hasComFiles(binaryData))
        {
            return {srcDir: root, comDir: binaryData, assetDirs: [path.join(root, 'layouts'), path.join(root, '_assets')]};
        }

        if (hasComFiles(root))
        {
            return {srcDir: root, comDir: root, assetDirs: [binaryData]};
        }
    }

    return null;
}

/**
 * Resolves an identifier to an embed's raw linkage name, hash included.
 *
 * Clean identifiers are already it; obfuscated `_SafeCls_N` ones are recovered from the
 * decompiler's `@identifier` footers.
 */
function toRawLinkageName(identifier, obfuscatedNameMap)
{
    if (EMBED_LINKAGE_RE.test(identifier))
    {
        return identifier;
    }

    return obfuscatedNameMap.get(identifier) ?? null;
}

/** Dump filenames are "<seq>_<identifier>.<ext>", <seq> being an extractor ordinal. */
function fileToRawLinkageName(fileName, obfuscatedNameMap)
{
    const match = /^\d+_(.+)\.\w+$/.exec(fileName);

    return match ? toRawLinkageName(match[1], obfuscatedNameMap) : null;
}

/** Reads an extracted asset as XML, inflating the zlib-compressed .bin payloads. */
function readAsXml(file)
{
    const buffer = fs.readFileSync(file);
    const utf8 = buffer.toString('utf8').trim();

    if (utf8.startsWith('<'))
    {
        return utf8;
    }

    for (const decode of [zlib.inflateSync, zlib.inflateRawSync])
    {
        try
        {
            const inflated = decode(buffer).toString('utf8').trim();

            if (inflated.startsWith('<'))
            {
                return inflated;
            }
        }
        catch
        {
            // Not this encoding - try the next.
        }
    }

    return null;
}

/** Returns the document element's tag name, ignoring the prolog and any leading comments. */
function rootTag(xml)
{
    const stripped = xml.replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/g, '');
    const match = /<([A-Za-z_][\w:-]*)/.exec(stripped);

    return match ? match[1] : null;
}

/** Indexes every extracted file by its embed's raw linkage name. */
function indexFilesByLinkage(dirs, obfuscatedNameMap)
{
    const index = new Map();

    for (const dir of dirs)
    {
        if (!fs.existsSync(dir))
        {
            continue;
        }

        for (const name of fs.readdirSync(dir))
        {
            if (!/\.(xml|bin)$/i.test(name))
            {
                continue;
            }

            const raw = fileToRawLinkageName(name, obfuscatedNameMap);

            // src/layouts is the decoded-XML view and is indexed first, so it wins over the
            // raw .bin of the same embed in src/_assets.
            if (raw && !index.has(raw))
            {
                index.set(raw, path.join(dir, name));
            }
        }
    }

    return index;
}

// A handful of layouts are embedded on the class that uses them rather than declared in a
// component manifest, and are instantiated directly - `new floor_plan_editor_layout() as
// ByteArray` - instead of being fetched from the asset library. They therefore have no
// getAssetByName() name at all, which is why the *Com.as-only scan never saw them and the
// floor plan editor's two layouts were missing from the shipped set.
//
// They are named by their EMBED LINKAGE instead, minus the $hash: `floor_plan_editor_bc_xml`.
// That is the only name the dump gives them, it keeps the `_xml` suffix the layout registry
// expects (a bare name resolves through HabboHelp.resolveLayoutName()'s fallback), and it
// cannot collide with a field name because assignNames() keys on the same string either way.
const DIRECT_EMBED_SOURCES = [
    'com/sulake/habbo/window/utils/floorplaneditor/BCFloorPlanEditor.as',
    // Same shape: `habbopedia_window_layout`/`habbopedia_edit_layout` are static Class fields on
    // the viewer, instantiated as ByteArray and parsed, never fetched by name. They ship as
    // `habbopedia_xml` and `habbopedia_edit_xml`.
    'com/sulake/habbo/window/utils/habbopedia/HabboPagesViewer.as',
];

/** Reads every `<fieldName>:Class = <ref>` declaration across the component manifests. */
function readDeclarations(comDir, srcDir, obfuscatedNameMap)
{
    const declarations = [];

    for (const relative of DIRECT_EMBED_SOURCES)
    {
        const file = path.join(srcDir, relative);

        if (!fs.existsSync(file))
        {
            console.warn(`  direct-embed source missing: ${relative}`);
            continue;
        }

        const component = path.basename(file, '.as');
        const content = fs.readFileSync(file, 'utf8');
        let match;

        FIELD_RE.lastIndex = 0;

        while ((match = FIELD_RE.exec(content)) !== null)
        {
            const raw = toRawLinkageName(match[2], obfuscatedNameMap);

            // No linkage means no name to ship it under; leave it to the unresolved report.
            declarations.push({component, fieldName: raw ? raw.split('$')[0] : match[1], ref: match[2]});
        }
    }

    for (const comFile of findComFiles(comDir))
    {
        const component = path.basename(comFile).replace(/Com\.as$/, '');
        const content = fs.readFileSync(comFile, 'utf8');
        let match;

        FIELD_RE.lastIndex = 0;

        while ((match = FIELD_RE.exec(content)) !== null)
        {
            declarations.push({component, fieldName: match[1], ref: match[2]});
        }
    }

    return declarations;
}

/**
 * Assigns each asset its output name, qualifying same-name declarations that resolve to
 * different embeds with their component.
 */
function assignNames(assets)
{
    const byField = new Map();

    for (const asset of assets)
    {
        if (!byField.has(asset.fieldName))
        {
            byField.set(asset.fieldName, []);
        }

        byField.get(asset.fieldName).push(asset);
    }

    const named = [];
    const collisions = [];

    for (const [fieldName, group] of byField)
    {
        const distinctEmbeds = new Set(group.map((asset) => asset.raw));

        if (distinctEmbeds.size === 1)
        {
            named.push({...group[0], name: fieldName});
            continue;
        }

        collisions.push({fieldName, components: group.map((asset) => asset.component)});

        for (const asset of group)
        {
            named.push({...asset, name: `${asset.component}_${fieldName}`});
        }
    }

    return {named, collisions};
}

function writeAssets(assets, outDir, dryRun)
{
    if (dryRun)
    {
        return;
    }

    // Rebuild from scratch: a name dropped upstream must not survive as a stale file.
    fs.rmSync(outDir, {recursive: true, force: true});
    fs.mkdirSync(outDir, {recursive: true});

    for (const asset of assets)
    {
        fs.writeFileSync(path.join(outDir, `${asset.name}.xml`), asset.xml, 'utf8');
    }
}

/** Reads one source tree into its named layouts and skins. */
function collectAssets(tree, label)
{
    const {srcDir, comDir, assetDirs} = tree;
    const obfuscatedNameMap = buildObfuscatedNameMap(findAsFiles(srcDir));
    const filesByLinkage = indexFilesByLinkage(assetDirs, obfuscatedNameMap);

    const declarations = readDeclarations(comDir, srcDir, obfuscatedNameMap);
    const xmlCache = new Map();
    const layouts = [];
    const skins = [];
    let otherMedia = 0;
    let unresolved = 0;

    for (const declaration of declarations)
    {
        const raw = toRawLinkageName(declaration.ref, obfuscatedNameMap);

        // Images, fonts, sounds and text blobs are declared alongside layouts and belong to
        // other pipelines (import-crypted-images.mjs, import-chatstyles.mjs).
        if (raw && EMBED_LINKAGE_RE.exec(raw)?.[1].toLowerCase() !== 'xml')
        {
            otherMedia += 1;
            continue;
        }

        const file = raw ? filesByLinkage.get(raw) : null;

        if (!file)
        {
            unresolved += 1;
            console.warn(`  unresolved [${label}]: ${declaration.component}Com.as::${declaration.fieldName} (${declaration.ref})`);
            continue;
        }

        if (!xmlCache.has(file))
        {
            xmlCache.set(file, readAsXml(file));
        }

        const xml = xmlCache.get(file);

        if (!xml)
        {
            continue;
        }

        const tag = rootTag(xml);

        if (tag !== 'layout' && tag !== 'skin' && tag !== 'variables')
        {
            continue;
        }

        // A <variables> document is a configuration, not a drawable: the one in the dump is
        // habbo_notifications_config_xml, the per-type notification style/timing table that
        // SingularNotificationController reads through XMLVariableParser. It rides along with
        // the layouts because that is the channel already registering XML into the asset
        // library under its *Com.as field name, which is the name AS3 asks for. App.ts's
        // layout pass finds no <window> in it and yields nothing, silently and by design.
        (tag === 'skin' ? skins : layouts).push({...declaration, raw, file, xml});
    }

    return {
        layouts: assignNames(layouts),
        skins: assignNames(skins),
        stats: {declarations: declarations.length, otherMedia, unresolved}
    };
}

/**
 * Folds a supplementary source into the primary's named assets.
 *
 * Adds what the primary does not have; keeps the primary's copy of everything else, except the
 * names in AIR_PREFERRED. Merging happens AFTER assignNames() on purpose: the primary's own
 * collision qualification then stays byte-identical to a single-source run, where merging the raw
 * declarations first would let a same-name asset from the other tree qualify both by component.
 */
function mergeSource(primary, extra, preferred)
{
    const byName = new Map(primary.map((asset) => [asset.name, asset]));
    const added = [];
    const overridden = [];

    for (const asset of extra)
    {
        if (!byName.has(asset.name))
        {
            byName.set(asset.name, asset);
            added.push(asset.name);
        }
        else if (preferred.has(asset.name))
        {
            byName.set(asset.name, asset);
            overridden.push(asset.name);
        }
    }

    return {merged: [...byName.values()], added, overridden};
}

function main()
{
    const args = parseArgs();
    const tree = resolveTree(args.source);

    if (!tree)
    {
        console.error(`No src/binaryData or scripts/binaryData under ${args.source}`);
        process.exit(1);
    }

    const primary = collectAssets(tree, 'primary');
    let layouts = primary.layouts.named;
    let skins = primary.skins.named;
    const collisions = [...primary.layouts.collisions, ...primary.skins.collisions];
    let airReport = null;

    const airTree = args.airSource ? resolveTree(args.airSource) : null;

    if (args.airSource && !airTree)
    {
        console.warn(`AIR source has no readable tree, skipping: ${args.airSource}`);
    }
    else if (airTree)
    {
        const air = collectAssets(airTree, 'air');
        const mergedLayouts = mergeSource(layouts, air.layouts.named, AIR_PREFERRED);
        const mergedSkins = mergeSource(skins, air.skins.named, AIR_PREFERRED);

        layouts = mergedLayouts.merged;
        skins = mergedSkins.merged;
        airReport = {
            addedLayouts: mergedLayouts.added,
            addedSkins: mergedSkins.added,
            overridden: [...mergedLayouts.overridden, ...mergedSkins.overridden]
        };
    }

    writeAssets(layouts, args.layoutsOut, args.dryRun);
    writeAssets(skins, args.skinsOut, args.dryRun);

    const hasElementDescription = skins.some((skin) => skin.name === ELEMENT_DESCRIPTION_ASSET);

    console.log(`Declarations:         ${primary.stats.declarations}`);
    console.log(`Non-XML (other pipe): ${primary.stats.otherMedia}`);
    console.log(`Unresolved XML refs:  ${primary.stats.unresolved}`);
    console.log(`Layouts written:      ${layouts.length} -> ${path.relative(repoRoot, args.layoutsOut)}`);
    console.log(`Skins written:        ${skins.length} -> ${path.relative(repoRoot, args.skinsOut)}`);
    console.log(`Element description:  ${hasElementDescription ? ELEMENT_DESCRIPTION_ASSET : 'MISSING'}`);

    if (airReport)
    {
        console.log(`\nFrom ${path.relative(repoRoot, args.airSource)}:`);
        console.log(`  added layouts:      ${airReport.addedLayouts.length}`);
        console.log(`  added skins:        ${airReport.addedSkins.length}`);
        console.log(`  overridden:         ${airReport.overridden.length ? airReport.overridden.join(', ') : 'none'}`);

        for (const name of [...airReport.addedLayouts, ...airReport.addedSkins].sort())
        {
            console.log(`    + ${name}`);
        }
    }

    for (const collision of collisions)
    {
        console.log(`Collision: "${collision.fieldName}" -> different embeds in ${collision.components.join(', ')}; qualified by component.`);
    }

    if (args.dryRun)
    {
        console.log('\n(dry run - nothing written)');
    }
}

main();
