/**
 * skins-to-css — turns the shipped Habbo window skins into a plain CSS stylesheet.
 *
 * WHY
 * ---
 * The skins are the only thing that makes the client look like Habbo, and they are
 * pure data: `src/assets/window-skins/*.xml` says which rectangle of which atlas
 * PNG each piece comes from and how it scales. Nothing about that needs a canvas
 * renderer. Emitting it as CSS lets an ordinary HTML app (the emulator's Svelte
 * dashboard) wear the same skin without adopting the window system — and without
 * inheriting its costs: no auto-sizing buttons, no manual relayout, no
 * virtualisation, and text stays selectable.
 *
 * THE MAPPING
 * -----------
 * A skin file has two halves that must not be confused:
 *
 *   <templates>  where each named piece lives IN THE ATLAS (the source rect)
 *   <layouts>    where it is drawn IN THE WINDOW at design size, plus how it
 *                scales: `fixed` (pinned to the near edge), `move` (pinned to the
 *                far edge) or `strech` (fills the space between).
 *
 * `border-image` is NOT a general answer. It takes four slice numbers, so it can
 * only express a regular 3x3 grid, and plenty of skins are not one:
 * illumina_light_skin_border_raised has 4px rounded corners but 1px straight
 * edges, and stacks TWO 9-slices (an outer `border_` and an inner, recolourable
 * `background_`). So each piece is cut out of the atlas at build time and emitted
 * as its own background layer, which reproduces fixed/move/strech exactly:
 *
 *   fixed  x fixed   ->  no-repeat at that corner, natural size
 *   strech x fixed   ->  no-repeat at (left offset, edge), size calc(100% - L - R)
 *   strech x strech  ->  the centre, stretched both ways
 *
 * Pieces are inlined as data: URIs, so the output is one self-contained file with
 * no assets to deploy. They are a few dozen bytes each.
 *
 * `colorize="true"` pieces are tinted by the window's colour at runtime. Those
 * become `mask-image` layers over a `background-color`, so a CSS variable drives
 * the tint the same way.
 *
 * USAGE
 *   node tools/skins-to-css.mjs                      # every skin
 *   node tools/skins-to-css.mjs --skin illumina_light_skin_border_raised
 *   node tools/skins-to-css.mjs --out ../../dist/habbo-skin.css
 */

import {readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKIN_DIR = join(HERE, '../src/assets/window-skins');
const LAYOUT_DIR = join(HERE, '../src/assets/window-layouts');
const ELEMENT_DESCRIPTION = join(HERE, '../src/assets/window-skins/habbo_element_description_xml.xml');
const IMAGE_DIR = join(HERE, '../src/assets/images');

/** The three scale modes a layout entity can declare. */
/**
 * Section headers, as REGEX LITERALS.
 *
 * Built from a string these lose a level of escaping the moment the file is
 * edited through any tooling that touches backslashes: `'\\s+'` silently
 * became `s+`, the pattern matched nothing, and every template in a file came
 * back empty — which surfaced as "piece has no source rect" on widgets whose
 * art was perfectly present. Literals cannot be mangled that way.
 */
/**
 * Self-check for the patterns above.
 *
 * A regex that loses or gains a level of escaping still parses — it just stops
 * matching, silently. That has happened three times in this file (`\s` becoming
 * `s`, then `\s`), each time surfacing as "missing pieces" or a rule landing on
 * the wrong element. Cheaper to assert it than to debug it again.
 */
function assertPatterns()
{
    const cases = [
        [SECTION_TEMPLATE, '<template name="a" asset="$asset">', true],
        [SECTION_LAYOUT, '<layout name="a" transparent="false" />', true]
    ];

    for(const [re, sample, expected] of cases)
    {
        re.lastIndex = 0;

        if(re.test(sample) !== expected)
        {
            throw new Error(`Pattern /${re.source}/ no longer matches its own sample — escaping was mangled.`);
        }
    }
}

const SECTION_TEMPLATE = /<template\s+name\s*=\s*"([^"]+)"([^>]*?)(\/)?>/g;
const SECTION_LAYOUT = /<layout\s+name\s*=\s*"([^"]+)"([^>]*?)(\/)?>/g;

const FIXED = 'fixed';
const MOVE = 'move';
const CENTER = 'center';
const TILED = 'tiled';

/**
 * The format's own spelling is the typo `strech`, used 601 times — but two
 * entities spell it `stretch`. Both must be accepted: treating the correct
 * spelling as an unknown mode silently fell through to `fixed`, which pins a
 * piece that was meant to fill.
 */
const STRETCH = new Set(['strech', 'stretch']);
const isStretch = (mode) => STRETCH.has(mode);

/**
 * Skin state -> the selectors that should carry it, and the order they are
 * emitted in (later wins ties in the cascade).
 *
 * A state changes only which atlas region each piece is cut from — every state of
 * a skin shares one layout — so the geometry is identical and CSS pseudo-classes
 * map onto them directly.
 *
 * `active` is the trap. In the window system it means the focused window, not
 * CSS's `:active`, which is the pressed state. Mapping it to `:active` would swap
 * two states that both exist on the same skins.
 *
 * Each state also keeps an explicit `--state` class, for the cases where a state
 * has to be forced rather than driven by the user's pointer.
 */
const STATE_SELECTORS = [
    ['default', []],
    ['active', ['.is-active', ':focus-within']],
    ['selected', ['.is-selected', '[aria-selected="true"]', ':checked']],
    ['hovering', [':hover']],
    ['pressed', [':active']],
    ['disabled', [':disabled', '[disabled]', '.is-disabled']]
];

const STATE_ORDER = new Map(STATE_SELECTORS.map(([name], i) => [name, i]));

/** Every selector a state should answer to, for one skin class. */
function selectorsFor(name, state, options = {})
{
    const {scope = '', map = null} = options;

    // When a map is supplied the skin answers to the HOST's selectors instead of
    // its own generated class — `.panel` rather than
    // `.illumina_light_skin_border_raised` — so an existing app needs no markup
    // change at all.
    const bases = map && map[name] ? map[name] : [`.${name}`];
    const entry = STATE_SELECTORS.find(([s]) => s === state);
    const extras = state === 'default' ? [] : (entry ? entry[1] : []);

    const withState = state === 'default'
        ? bases
        : bases.flatMap((base) => extras.map((sel) => `${base}${sel}`))
            .concat(map && map[name] ? [] : [`.${name}--${state}`]);

    return withState.map((sel) => (scope ? `${scope} ${sel}` : sel));
}

/**
 * Window shadows live in the LAYOUTS, not the skins.
 *
 * 225 layout files declare a `<filters><DropShadowFilter …/></filters>`, and that
 * is where a Habbo window gets the soft shadow that lifts it off the page — the
 * skins carry none. Converting only the skins therefore produced flat panels that
 * looked close but never right.
 *
 * Flash -> CSS: the offset is polar (distance + angle, angle defaulting to 45),
 * the colour is `0xRRGGBB` with a separate alpha, and `blurX` is roughly twice
 * the Gaussian deviation CSS wants. `drop-shadow` rather than `box-shadow`
 * because these shapes have rounded, transparent corners and a box shadow would
 * square them off.
 */
function shadowPresets()
{
    const seen = new Map();

    for(const file of readdirSync(LAYOUT_DIR).filter((f) => f.endsWith('.xml')))
    {
        const xml = readFileSync(join(LAYOUT_DIR, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '');

        for(const block of xml.matchAll(/<DropShadowFilter([^>]*)>/g))
        {
            const attrs = block[1];
            const num = (key, fallback) =>
            {
                const m = attrs.match(new RegExp(key + '\\s*=\\s*"([^"]*)"'));

                return m && m[1] !== '' ? Number(m[1]) : fallback;
            };

            const distance = num('distance', 4);
            const angle = num('angle', 45);
            const alpha = num('alpha', 1);
            const blur = num('blurX', num('blurY', 4));
            const colour = num('color', 0);
            const r = (colour >> 16) & 0xff;
            const g = (colour >> 8) & 0xff;
            const b = colour & 0xff;
            const x = (distance * Math.cos((angle * Math.PI) / 180)).toFixed(1);
            const y = (distance * Math.sin((angle * Math.PI) / 180)).toFixed(1);
            const value = `drop-shadow(${x}px ${y}px ${(blur / 2).toFixed(1)}px rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)}))`;

            seen.set(value, (seen.get(value) ?? 0) + 1);
        }
    }

    // Named by how widely each is used: the window shadow is the one on frames.
    const ranked = [...seen.entries()].sort((a, b) => b[1] - a[1]);
    const names = ['habbo-shadow-drop', 'habbo-shadow-window', 'habbo-shadow-modal'];

    return ranked.slice(0, names.length).map(([value], i) =>
        `.${names[i]}
{
  filter: ${value};
}`);
}

/**
 * The colour the element description carries per (type, style).
 *
 * This is NOT the same thing as a skin's `colorize` pieces. A skin says which of
 * its pieces are recolourable; the element description says what colour the
 * WINDOW is, and the canvas multiplies that over the whole skin render. It is
 * where `habbo_skin_frame` gets its blue (0xff418db0), and why the same frame art
 * serves the blue, black and yellow window styles.
 *
 * Ignoring it was why the hotel's classic title bar converted to a grey hatched
 * strip: the art really is grey, and every bit of its colour comes from here.
 *
 * A skin can appear under several styles with different colours; the lowest style
 * wins as the default, and `--skin-tint` lets a consumer pick another.
 */
/**
 * Every (type, style) colour the element description declares, as CSS variables.
 *
 * A consumer sometimes needs a hotel colour where it has no corresponding window
 * to skin — the dashboard's `.panel-head` is one: the hotel's title bar takes its
 * blue from the FRAME behind it, and an app with no frame element has nowhere to
 * get it from. Emitting `--habbo-color-frame-3` and friends means such a case is
 * still reading the assets rather than having a sampled hex typed into a theme.
 */
function colourVariables()
{
    const xml = existsSync(ELEMENT_DESCRIPTION)
        ? readFileSync(ELEMENT_DESCRIPTION, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
        : '';

    const seen = new Map();

    for(const line of xml.matchAll(/<window\s+([^>]*)>/g))
    {
        const attrs = line[1];
        const type = attrs.match(/type\s*=\s*"([^"]+)"/);
        const style = attrs.match(/style\s*=\s*"(\d+)"/);
        const colour = attrs.match(/color\s*=\s*"(0x[0-9a-fA-F]+)"/);

        if(!type || !style || !colour) continue;

        seen.set(`--habbo-color-${type[1].replace(/_/g, '-')}-${style[1]}`, tintToCss(colour[1]));
    }

    if(seen.size === 0) return [];

    return [
        ':root',
        '{',
        ...[...seen].map(([name, value]) => `  ${name}: ${value};`),
        '}'
    ].join(String.fromCharCode(10));
}

/**
 * The background colours the shipped LAYOUTS declare, ranked by how often.
 *
 * A window's chrome is skin art, but its surfaces — the content ground, the
 * selected row, the panel fills — are `color="0x…"` on the window elements in
 * the layout XML. They are the last thing a consumer would otherwise have to
 * sample off a screenshot and type in by hand, so they are emitted as variables
 * too, named by their own hex and annotated with the count.
 *
 * `0xff` is ARGB; alpha is dropped because these are opaque fills.
 */
function layoutBackgroundVariables()
{
    const counts = new Map();

    for(const file of readdirSync(LAYOUT_DIR).filter((f) => f.endsWith('.xml')))
    {
        const xml = readFileSync(join(LAYOUT_DIR, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '');

        // ANY `color` on a window element, not only where background="true".
        // The hotel carries a window colour on the element itself and the canvas
        // multiplies it over the skin — catalog_ubuntu_with_tabs writes
        // color="0xff418db0" straight on its <frame>, with no background flag in
        // sight. Requiring the flag missed exactly the colours worth having.
        for(const tag of xml.matchAll(/<[a-z_]+\s+([^>]*)>/g))
        {
            const colour = tag[1].match(/(?:^|\s)color\s*=\s*"(0x[0-9a-fA-F]{6,8})"/);

            if(!colour) continue;

            const hex = colour[1].replace(/^0x/i, '').padStart(8, 'f').slice(-6).toLowerCase();

            counts.set(hex, (counts.get(hex) ?? 0) + 1);
        }
    }

    // Every distinct colour, not a top-N. Ranking by frequency is the wrong filter
    // for this: the palette a consumer actually models itself on comes from ONE
    // reference window, and those colours are used by a handful of layouts each —
    // the catalog's own #eceae0 and #63c5e9 fell outside a top-24 while generic
    // white and grey filled it.
    const ranked = [...counts].sort((a, b) => b[1] - a[1]);

    if(ranked.length === 0) return '';

    return [
        '/* Background colours declared by the shipped layouts, most-used first. */',
        ':root',
        '{',
        ...ranked.map(([hex, n]) => `  --habbo-bg-${hex}: #${hex};   /* ${n} layout(s) */`),
        '}'
    ].join(String.fromCharCode(10));
}

function elementDescriptionTints()
{
    if(!existsSync(ELEMENT_DESCRIPTION)) return new Map();

    const xml = readFileSync(ELEMENT_DESCRIPTION, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const tints = new Map();

    for(const line of xml.matchAll(/<window\s+([^>]*)>/g))
    {
        const attrs = line[1];
        const asset = attrs.match(/asset\s*=\s*"([^"]+)"/);
        const colour = attrs.match(/color\s*=\s*"(0x[0-9a-fA-F]+)"/);
        const style = attrs.match(/style\s*=\s*"(\d+)"/);

        if(!asset || !colour) continue;

        const key = asset[1].replace(/_xml$/, '');
        const at = style ? Number(style[1]) : 0;
        const previous = tints.get(key);

        if(!previous || at < previous.style) tints.set(key, {style: at, colour: colour[1]});
    }

    return tints;
}

/** `0xaarrggbb` or `0xrrggbb` -> a CSS colour, alpha dropped (it is a tint). */
function tintToCss(value)
{
    const hex = value.replace(/^0x/i, '').padStart(6, '0');
    const rgb = hex.length === 8 ? hex.slice(2) : hex;

    return `#${rgb}`;
}

function parseArgs(argv)
{
    const args = {skin: null, out: join(HERE, '../../../dist/habbo-skin.css'), scope: '', map: null};

    for(let i = 0; i < argv.length; i++)
    {
        if(argv[i] === '--skin') args.skin = argv[++i];
        else if(argv[i] === '--out') args.out = resolve(argv[++i]);
        // `--scope` prefixes every rule, `--map` re-points skins at an app's own
        // selectors. Together they let a host app wear a skin without touching a
        // single line of its markup: the rules land on the classes it already has,
        // behind a theme attribute it can switch off.
        else if(argv[i] === '--scope') args.scope = argv[++i];
        else if(argv[i] === '--map') args.map = JSON.parse(readFileSync(resolve(argv[++i]), 'utf8'));
    }

    return args;
}

/**
 * A deliberately small XML reader.
 *
 * The skin files are flat `<entity>` elements with one `<Rectangle>` and one
 * optional `<scale>`, so a regex pass reads them exactly and keeps this tool
 * dependency-free apart from sharp. If the format ever grows nesting, swap this
 * for a real parser rather than escalating the regexes.
 *
 * They are NOT machine-uniform, though: the XML is hand-formatted and writes
 * `y= "10"` with a space after the equals in places. Every attribute match
 * therefore allows whitespace around `=`. Requiring `y="` made whole templates
 * parse as zero entities, and the tool then reported every piece of those widgets
 * as having no source rect — which read like missing assets rather than a parser
 * that had quietly skipped them.
 */
function readSkin(rawXml)
{
    // Commented-out states are real in these files — border_4/5/6/7/12/13 all park
    // a `pressed`/`selected` pair pointing at `border_outline` inside <!-- -->, and
    // that layout exists in no file at all. Parsing through comments reported 43
    // missing layouts that nothing had ever asked for.
    let xml = rawXml.replace(/<!--[\s\S]*?-->/g, '');

    // A rect attribute can reference a skin variable — the illumina scrollbars
    // write width="$width" against <variable key="width" value="9"/>. Expanded
    // here so the rect parser only ever sees numbers.
    const variables = new Map(
        [...xml.matchAll(/<variable\s+key\s*=\s*"([^"]+)"\s+value\s*=\s*"([^"]*)"/g)]
            .map((m) => [m[1], m[2]])
    );

    for(const [key, value] of variables)
    {
        if(/^-?\d+$/.test(value)) xml = xml.split('"$' + key + '"').join('"' + value + '"');
    }

    const assetMatch = xml.match(/<variable\s+key\s*=\s*"asset"\s+value\s*=\s*"([^"]+)"/);
    const asset = assetMatch ? assetMatch[1].replace(/_png$/, '') : null;

    const states = [...xml.matchAll(/<state\s+name\s*=\s*"([^"]+)"\s+layout\s*=\s*"([^"]+)"(?:\s+template\s*=\s*"([^"]+)")?/g)]
        .map((m) => ({name: m[1], layout: m[2], template: m[3] ?? null}));

    /**
     * Sections, self-closing forms included.
     *
     * `<layout name="x" transparent="false" />` is a legal empty section, and a
     * naive `<tag …>(.*?)</tag>` match starts at that tag and runs to the NEXT
     * closing tag — swallowing the layout that follows it. That is why both
     * illumina scrollbars reported their track layouts as missing: the empty
     * container declared just above had eaten them.
     */
    const sections = (tag) =>
    {
        const found = [];
        const re = tag === 'template' ? SECTION_TEMPLATE : SECTION_LAYOUT;

        re.lastIndex = 0;
        let match;

        while((match = re.exec(xml)) !== null)
        {
            if(match[3])
            {
                found.push(['', match[1], '']);
                continue;
            }

            const close = xml.indexOf('</' + tag + '>', re.lastIndex);

            found.push(['', match[1], close < 0 ? '' : xml.slice(re.lastIndex, close)]);
        }

        return found;
    };

    // The open tag is captured whole and then probed, rather than trying to make
    // one regex match optional attributes in place: a lazy `[^>]*?` in front of an
    // optional group simply lets `[^>]*` swallow the attribute, so `colorize` was
    // silently never detected and every recolourable piece was emitted as an
    // opaque background instead of a tint mask.
    // Numeric rect attributes are sometimes EMPTY in the shipped XML —
    // habbo_skin_bubble writes `<Rectangle x="0" y="" width="1" height="1"/>` for
    // its 1x1 spacer. Requiring digits made the whole entity fail to parse, so the
    // piece looked absent from its template rather than simply being at y=0.
    const toInt = (value) => (value === '' || value === undefined ? 0 : Number(value));

    // `[\s\S]*?` before <region>, not `\s*`: an entity can carry child elements
    // ahead of its region — habbo_skin_header_leaderboard writes <blend>0</blend>
    // there. Requiring whitespace only made that whole skin parse as empty.
    // <blend> itself is a Flash blend mode with no general CSS equivalent.
    const entitiesOf = (body) => [...body.matchAll(
        /<entity\s+([^>]*?)>[\s\S]*?<region>\s*<Rectangle\s+x\s*=\s*"(-?\d*)"\s+y\s*=\s*"(-?\d*)"\s+width\s*=\s*"(\d*)"\s+height\s*=\s*"(\d*)"\s*\/>\s*<\/region>\s*(?:<scale\s+horizontal\s*=\s*"(\w+)"\s+vertical\s*=\s*"(\w+)"\s*\/>)?/g
    )].map((m) => {
        const attrs = m[1];
        const nameMatch = attrs.match(/name\s*=\s*"([^"]+)"/);

        return {
            name: nameMatch ? nameMatch[1] : '',
            // `type="null"` marks a non-drawing placeholder — the bubble skins use a
            // 1x1 `spacer` for it, one of them with an empty `y=""`. It has no art.
            drawable: !/type\s*=\s*"null"/.test(attrs),
            colorize: /colorize\s*=\s*"true"/.test(attrs),
            x: toInt(m[2]),
            y: toInt(m[3]),
            width: toInt(m[4]),
            height: toInt(m[5]),
            scaleH: m[6] ?? FIXED,
            scaleV: m[7] ?? FIXED
        };
    });

    // The atlas is declared PER TEMPLATE, not per skin: `asset="$asset"` merely
    // refers to the skin-level variable. The two illumina scrollbars name a
    // different PNG per template (vertical vs horizontal), so cutting every piece
    // from one skin-level atlas silently took them from the wrong sheet.
    const templates = new Map();
    const templateAssets = new Map();

    // Bodies come from `sections`, which understands the self-closing form; the
    // per-template asset is scanned separately. Using a naive
    // `<template …>(.*?)</template>` here re-introduced exactly the bug `sections`
    // exists to avoid: `<template name="null" />` swallowed the template after it,
    // and every scrollbar lost its lift and track pieces.
    const templateAssetByName = new Map(
        [...xml.matchAll(/<template\s+name\s*=\s*"([^"]+)"([^>]*?)\/?>/g)]
            .map((m) => {
                const own = m[2].match(/asset\s*=\s*"([^"]+)"/);

                return [m[1], own && own[1] !== '$asset' ? own[1].replace(/_png$/, '') : null];
            })
    );

    for(const [, name, body] of sections('template'))
    {
        templates.set(name, entitiesOf(body));
        templateAssets.set(name, templateAssetByName.get(name) ?? null);
    }

    const layouts = new Map();

    for(const [, name, body] of sections('layout'))
    {
        layouts.set(name, entitiesOf(body));
    }

    return {asset, states, templates, templateAssets, layouts};
}

/** Groups a layout's entities into stacked 9-slice layers by their name prefix. */
function groupLayers(entities)
{
    const layers = new Map();

    for(const entity of entities)
    {
        // `border_top_left` -> layer `border`, cell `top_left`.
        const match = entity.name.match(/^(.*?)_(top|center|bottom)_(left|center|right)$/);
        const layer = match ? match[1] : entity.name;
        const cell = match ? `${match[2]}_${match[3]}` : 'single';

        if(!layers.has(layer)) layers.set(layer, []);

        layers.get(layer).push({...entity, cell});
    }

    return layers;
}

/**
 * The CSS background-position/size for one piece, from its scale modes.
 *
 * Both axes ALWAYS emit an edge keyword plus an offset. Mixing the two syntaxes —
 * `right 0px 7px` — is invalid CSS, and one invalid layer drops the whole
 * `background` shorthand, so every border piece silently vanished and panels
 * rendered as plain white rectangles. Four tokens, every time.
 */
function placement(entity, design)
{
    // A stretched piece fills the gap between whatever is pinned before it and
    // whatever is pinned after it, so both come from the piece's OWN layout rect:
    // it starts at its own x, and the space it cannot cover is everything the
    // design box has beyond its own width — `design - width`, whatever the layer.
    //
    // Deriving those offsets from the layer's corner pieces instead is wrong for
    // any layer that does not start at the design origin. It cost 1px on
    // illumina_light_border_raised (invisible) and 11px on
    // illumina_light_skin_button, whose body sits inside a 19px glow — the button
    // rendered as a flat grey band with no corners at all.
    //
    // `center` cannot be written in the four-value position syntax, which only
    // takes an edge keyword plus a length, so it becomes an offset from the near
    // edge instead.
    const axis = (mode, near, far, start, size, extent) =>
    {
        if(mode === MOVE) return `${far} ${extent - (start + size)}px`;
        if(mode === CENTER) return `${near} calc(50% - ${size / 2}px)`;

        return `${near} ${start}px`;
    };

    const x = axis(entity.scaleH, 'left', 'right', entity.x, entity.width, design.width);
    const y = axis(entity.scaleV, 'top', 'bottom', entity.y, entity.height, design.height);

    const sizeX = isStretch(entity.scaleH)
        ? `calc(100% - ${design.width - entity.width}px)`
        : `${entity.width}px`;
    const sizeY = isStretch(entity.scaleV)
        ? `calc(100% - ${design.height - entity.height}px)`
        : `${entity.height}px`;

    // `tiled` is the one mode that repeats rather than scales.
    const tileX = entity.scaleH === TILED;
    const tileY = entity.scaleV === TILED;
    const repeat = tileX && tileY ? 'repeat' : tileX ? 'repeat-x' : tileY ? 'repeat-y' : 'no-repeat';

    return {position: `${x} ${y}`, size: `${sizeX} ${sizeY}`, repeat};
}

const atlasSizes = new Map();

async function atlasSize(atlasPath)
{
    if(!atlasSizes.has(atlasPath))
    {
        const {width, height} = await sharp(atlasPath).metadata();

        atlasSizes.set(atlasPath, {width: width ?? 0, height: height ?? 0});
    }

    return atlasSizes.get(atlasPath);
}

/**
 * Cuts one source rect out of its atlas, as a data: URI.
 *
 * Some shipped skins declare rects that run past their atlas — the assets and the
 * XML come from different dump passes and do not always agree. sharp throws
 * ("bad extract area") on those, which would kill a 133-file batch on one bad
 * row, so the rect is clamped and reported instead. A clamped piece still renders;
 * a crashed run produces nothing.
 */
async function cutPiece(atlasPath, rect, cache, warnings, owner)
{
    const {width: aw, height: ah} = await atlasSize(atlasPath);
    const left = Math.max(0, Math.min(rect.x, aw - 1));
    const top = Math.max(0, Math.min(rect.y, ah - 1));
    const width = Math.max(1, Math.min(rect.width, aw - left));
    const height = Math.max(1, Math.min(rect.height, ah - top));

    if(left !== rect.x || top !== rect.y || width !== rect.width || height !== rect.height)
    {
        warnings.push(
            `${owner}: rect ${rect.x},${rect.y} ${rect.width}x${rect.height} exceeds `
            + `${aw}x${ah} atlas — clamped to ${left},${top} ${width}x${height}`
        );
    }

    const key = `${atlasPath}|${left},${top},${width},${height}`;

    if(cache.has(key)) return cache.get(key);

    const buffer = await sharp(atlasPath)
        .extract({left, top, width, height})
        .png({compressionLevel: 9})
        .toBuffer();

    const uri = `url("data:image/png;base64,${buffer.toString('base64')}")`;

    cache.set(key, uri);

    return uri;
}

/**
 * `template="null"` is the format's way of saying "no template" — the layout rects
 * double as the source. It is a literal string, not an absent attribute, and there
 * is even an empty `<template name="null" />` to match, so looking it up as a real
 * template finds nothing and reports every piece of the widget as missing. That
 * alone accounted for every scrollbar.
 */
const NO_TEMPLATE = 'null';

async function skinToCss(name, skin, cache, warnings, index, options, tints)
{
    // No skin-level atlas is fine as long as the templates name their own; only a
    // skin with neither has nothing to draw. habbo_skin_text and
    // habbo_skin_tab_context are in that group legitimately — the first is a text
    // style (colour/blend/font, no bitmap), the second a bare layout container.
    const hasTemplateAsset = [...skin.templateAssets.values()].some((a) => a !== null);

    if(!skin.asset && !hasTemplateAsset)
    {
        warnings.push(`${name}: not a bitmap skin (no atlas at skin or template level)`);

        return '';
    }

    const blocks = [];

    const ordered = [...skin.states].sort(
        (a, b) => (STATE_ORDER.get(a.name) ?? 99) - (STATE_ORDER.get(b.name) ?? 99)
    );

    for(const state of ordered)
    {
        // Layouts and templates resolve across ALL skin files, not just this one:
        // the window system loads them into a single registry, and 60-odd states
        // reference a layout defined elsewhere (every currency icon points at
        // `icon16` in habbo_skin_icon_set, the black buttons at `button_black`).
        // File-local lookup dropped all of them.
        const layoutEntities = skin.layouts.get(state.layout) ?? index.layouts.get(state.layout) ?? null;
        const templateName = state.template && state.template !== NO_TEMPLATE ? state.template : null;
        const templateEntities = templateName
            ? (skin.templates.get(templateName) ?? index.templates.get(templateName) ?? null)
            : null;

        if(!layoutEntities)
        {
            warnings.push(`${name}: state "${state.name}" references missing layout "${state.layout}"`);
            continue;
        }

        // `<layout name="…" transparent="false" />` — self-closing and empty. It is a
        // pure container the window system fills with sub-widgets (the scrollbars
        // declare one per orientation), so there is nothing to paint and nothing
        // worth warning about.
        if(layoutEntities.length === 0) continue;

        // The template holds the SOURCE rect; the layout holds the destination.
        // Without a template the layout rect doubles as both, which is how the
        // single-bitmap skins are written.
        // Resolve the atlas for THIS state's template, falling back to the skin's.
        const ownAsset = templateName
            ? (skin.templateAssets.get(templateName) ?? index.templateAssets.get(templateName) ?? null)
            : null;
        const assetName = ownAsset ?? skin.asset;

        if(!assetName)
        {
            warnings.push(`${name}: state "${state.name}" has no atlas`);
            continue;
        }

        const atlasPath = join(IMAGE_DIR, `${assetName}.png`);

        if(!existsSync(atlasPath))
        {
            warnings.push(`${name}: atlas ${assetName}.png not found`);
            continue;
        }

        // An empty <entities> block means the state simply has no art — the
        // scrollbars ship `lift_*_disabled` templates declared and deliberately
        // blank. There is nothing to paint and nothing to report; falling through
        // would announce every piece of the widget as missing.
        if(templateEntities && templateEntities.length === 0) continue;

        const source = new Map((templateEntities ?? layoutEntities).map((e) => [e.name, e]));
        const layers = groupLayers(layoutEntities);
        const design = {
            width: Math.max(...layoutEntities.map((e) => e.x + e.width)),
            height: Math.max(...layoutEntities.map((e) => e.y + e.height))
        };

        const backgrounds = [];
        const masks = [];

        for(const [, pieces] of layers)
        {
            for(const piece of pieces)
            {
                if(!piece.drawable) continue;

                const src = source.get(piece.name);

                if(!src)
                {
                    warnings.push(
                        `${name}: layout "${state.layout}" piece "${piece.name}" not in `
                        + `${templateName ? `template "${templateName}"` : 'its own layout rects'} `
                        + `(has: ${[...source.keys()].join(', ') || 'nothing'})`
                    );
                    continue;
                }

                const uri = await cutPiece(atlasPath, src, cache, warnings, `${name}/${piece.name}`);
                const {position, size, repeat} = placement(piece, design);
                const layer = `${uri} ${position} / ${size} ${repeat}`;

                // Recolourable pieces are tinted by the window colour at runtime;
                // as a mask over a background-color, a CSS variable does the same.
                if(piece.colorize) masks.push(layer);
                else backgrounds.push(layer);
            }
        }

        // A window colour from the element description multiplies over the WHOLE
        // skin, not only its `colorize` pieces — that is what the canvas does with
        // `window.color`. So when one exists, every piece moves to the tinted
        // surface and the colour becomes the default --skin-tint.
        const windowTint = tints.get(name) ?? tints.get(state.layout) ?? null;

        if(windowTint)
        {
            masks.push(...backgrounds);
            backgrounds.length = 0;
        }

        // Later background layers paint UNDER earlier ones in CSS, which is the
        // opposite of the skin's paint order, so the list is reversed.
        backgrounds.reverse();
        masks.reverse();

        // A skin file can declare SEVERAL widgets — habbo_skin_scrollbar has ten,
        // each with its own layout and its own `default` state. Keying the class by
        // file name collapsed them onto one another. The layout name is what
        // actually identifies a widget, and it is also what the element description
        // references, so that is the class. The file name stays as an alias when a
        // skin declares exactly one layout, so existing selectors keep working.
        const layoutClass = state.layout;
        const mapped = options.map && (options.map[layoutClass] || options.map[name]);
        const aliases = mapped ? [] : (skin.layouts.size === 1 && layoutClass !== name ? [name] : []);
        // `input`, `textarea` and `select` are replaced elements: they render no
        // ::before at all. Putting the recolourable layers there would silently drop
        // them, so for those selectors the tint is folded onto the element itself —
        // multiply against background-color, no mask. The alpha clipping is lost,
        // which does not matter for a field that is opaque anyway.
        const REPLACED = /(^|[\s>+~])(input|textarea|select)\b/;
        const NEWLINE = String.fromCharCode(10);
        const selectorList = mapped
            ? selectorsFor(options.map[layoutClass] ? layoutClass : name, state.name, options)
            : [
                ...selectorsFor(layoutClass, state.name, options),
                ...aliases.flatMap((alias) => selectorsFor(alias, state.name, options))
            ];
        // Note for whoever emits a ::before rule from selectorList: in a comma list ::before binds
        // to the last selector only, so it has to be appended to EVERY selector or the tint would
        // apply to `.skin:hover` and to nothing else. (Two unused joins stood here; nothing read them.)

        // Recolourable pieces are MULTIPLIED by the tint, not filled with it.
        //
        // Flash's colorize is a colour transform: result RGB = art x tint, alpha =
        // the art's own. Reproducing it as a mask over a flat background-color keeps
        // the alpha but throws the art away — and the raised border's interior is a
        // subtle top-to-bottom gradient, so panels came out flat white where the
        // canvas has shading. A pixel diff put 100% of the remaining difference on
        // exactly those pixels.
        //
        // So the same layers are used twice on the ::before: as `background` with
        // `background-blend-mode: multiply` over the tint colour (the RGB), and as
        // `mask` (the alpha). White tint then reproduces the art unchanged, which is
        // the default, and a coloured tint multiplies it as Flash does.
        //
        // Two paint surfaces, not one. A CSS `mask` masks EVERYTHING the element
        // paints, so putting the recolourable pieces' mask on the same box as the
        // opaque border pieces erased the border with it — panels rendered as plain
        // white rectangles with no outline at all. The element paints the opaque
        // layers; a ::before painted over it carries the tint and its own mask.
        // The pair z-index:0 on the box and z-index:-1 on ::before is what keeps the
        // tint above the element's background and BELOW its text. Without that
        // stacking context a positioned ::before paints over in-flow content, and
        // every label inside a skinned panel vanished.
        // ::before sits above the element's own background by default, which is also
        // the skin's paint order (border first, recolourable fill second).
        if(backgrounds.length === 0 && masks.length === 0) continue;

        const rules = [];

        // Split by selector, not by group: one skin can be mapped onto both a div
        // (which can carry a ::before) and an <input> (which cannot), and deciding
        // for the whole group meant the div's rule silently governed the input too.
        const replacedSelectors = selectorList.filter((sel) => REPLACED.test(sel));
        const normalSelectors = selectorList.filter((sel) => !REPLACED.test(sel));
        const joinSel = (list) => list.join(',' + NEWLINE);

        if(replacedSelectors.length > 0 && masks.length > 0)
        {
            rules.push([
                joinSel(replacedSelectors),
                '{',
                // ORDER MATTERS: the `background` shorthand resets background-color to
                // transparent, so the colour has to come AFTER it. Declared before, the
                // multiply had nothing to blend against — invisible while the tint was
                // white (art x white = art) and silently dead for every real colour,
                // which is why the hotel's blue title bar stayed grey.
                `  background: ${[...masks, ...backgrounds].join(',' + NEWLINE + '              ')};`,
                `  background-color: var(--skin-tint, ${windowTint ? tintToCss(windowTint.colour) : '#ffffff'});`,
                '  background-blend-mode: multiply;',
                '}'
            ].join(NEWLINE));
        }
        else if(replacedSelectors.length > 0 && backgrounds.length > 0)
        {
            rules.push(joinSel(replacedSelectors) + NEWLINE + '{' + NEWLINE
                + `  background: ${backgrounds.join(',' + NEWLINE + '              ')};` + NEWLINE + '}');
        }

        if(normalSelectors.length === 0)
        {
            blocks.push(rules.join(NEWLINE + NEWLINE));
            continue;
        }

        const normalSelector = joinSel(normalSelectors);
        const normalBefore = joinSel(normalSelectors.map((sel) => sel + '::before'));

        // The ::before needs its parent to be a stacking context. When a window tint
        // moved EVERY piece to the tinted surface there were no opaque layers left,
        // the base rule was skipped, and the tinted pseudo-element then painted
        // behind the panel instead of inside its header.
        if(backgrounds.length === 0 && masks.length > 0)
        {
            rules.push(`${normalSelector}
{
  position: relative;
  z-index: 0;
}`);
        }

        if(backgrounds.length > 0)
        {
            rules.push(`${normalSelector}\n{\n  position: relative;\n  z-index: 0;\n  background: ${backgrounds.join(',\n              ')};\n}`);
        }

        if(masks.length > 0)
        {
            rules.push([
                normalBefore,
                '{',
                "  content: '';",
                '  position: absolute;',
                '  inset: 0;',
                '  z-index: -1;',
                '  pointer-events: none;',
                // ORDER MATTERS: the `background` shorthand resets background-color to
                // transparent, so the colour has to come AFTER it. Declared before, the
                // multiply had nothing to blend against — invisible while the tint was
                // white (art x white = art) and silently dead for every real colour,
                // which is why the hotel's blue title bar stayed grey.
                `  background: ${masks.join(',' + NEWLINE + '               ')};`,
                `  background-color: var(--skin-tint, ${windowTint ? tintToCss(windowTint.colour) : '#ffffff'});`,
                '  background-blend-mode: multiply;',
                `  -webkit-mask: ${masks.join(',\n                ')};`,
                `  mask: ${masks.join(',\n        ')};`,
                '}'
            ].join('\n'));
        }

        blocks.push(rules.join('\n\n'));
    }

    return blocks.join('\n\n');
}

async function main()
{
    assertPatterns();

    const args = parseArgs(process.argv.slice(2));
    const files = readdirSync(SKIN_DIR)
        .filter((f) => f.endsWith('.xml'))
        // Not a skin: the type/style -> asset+layout registry the window system
        // reads to decide WHICH skin a widget wears. It declares no atlas and its
        // 84 "missing layout" warnings were pure noise.
        .filter((f) => !f.startsWith('habbo_element_description'))
        .filter((f) => !args.skin || f === `${args.skin}_xml.xml` || f === `${args.skin}.xml`)
        .filter((f) =>
        {
            if(!args.map) return true;

            // With a map, emit only what the host actually asked for.
            const base = f.replace(/\.xml$/, '').replace(/_xml$/, '');
            const xml = readFileSync(join(SKIN_DIR, f), 'utf8');
            const layouts = [...xml.matchAll(/<layout\s+name\s*=\s*"([^"]+)"/g)].map((m) => m[1]);

            return Boolean(args.map[base]) || layouts.some((l) => args.map[l]);
        });

    if(files.length === 0)
    {
        console.error(args.skin ? `No skin matched "${args.skin}".` : 'No skin XML found.');
        process.exit(1);
    }

    // Two passes: index every layout and template in the whole set, then convert.
    // Resolution is global in the window system and has to be here too.
    const index = {layouts: new Map(), templates: new Map(), templateAssets: new Map()};

    for(const file of readdirSync(SKIN_DIR).filter((f) => f.endsWith('.xml')))
    {
        const parsed = readSkin(readFileSync(join(SKIN_DIR, file), 'utf8'));

        for(const [key, value] of parsed.layouts) if(!index.layouts.has(key)) index.layouts.set(key, value);
        for(const [key, value] of parsed.templates) if(!index.templates.has(key)) index.templates.set(key, value);
        for(const [key, value] of parsed.templateAssets) if(!index.templateAssets.has(key)) index.templateAssets.set(key, value);
    }

    // The per-(type, style) window colour the canvas multiplies over a skin.
    const tints = elementDescriptionTints();
    const cache = new Map();
    const warnings = [];
    const out = [
        '/* Generated by packages/vortex-client/tools/skins-to-css.mjs — do not edit.',
        ' * Each rule reproduces one shipped Habbo window skin as stacked background',
        ' * layers, with every piece cut out of its atlas and inlined as a data: URI.',
        ' * Recolourable skins expose --skin-tint. */',
        ''
    ];

    out.push('/* Window shadows, from the DropShadowFilter declarations in the layouts. */', ...shadowPresets(), '');
    out.push('/* Every (type, style) colour the element description declares. */', colourVariables(), '');
    out.push(layoutBackgroundVariables(), '');

    let emitted = 0;

    for(const file of files)
    {
        const name = file.replace(/\.xml$/, '').replace(/_xml$/, '');
        const css = await skinToCss(name, readSkin(readFileSync(join(SKIN_DIR, file), 'utf8')), cache, warnings, index, args, tints);

        if(css)
        {
            out.push(css, '');
            emitted++;
        }
    }

    mkdirSync(dirname(args.out), {recursive: true});
    writeFileSync(args.out, out.join('\n'), 'utf8');

    const bytes = Buffer.byteLength(out.join('\n'));

    console.log(`${emitted}/${files.length} skins -> ${args.out} (${(bytes / 1024).toFixed(1)} KB, ${cache.size} unique pieces)`);

    if(warnings.length > 0)
    {
        console.log(`\n${warnings.length} warning(s):`);
        warnings.slice(0, 20).forEach((w) => console.log(`  ${w}`));

        if(warnings.length > 20) console.log(`  ... and ${warnings.length - 20} more`);
    }
}

await main();
