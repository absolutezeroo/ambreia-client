/**
 * textstyles-to-css — turns the client's Habbo text styles into plain CSS.
 *
 * The companion to skins-to-css.mjs: that one gives an HTML app the Habbo
 * chrome, this one gives it the Habbo typography. Together they are the whole
 * look, with no canvas involved.
 *
 * The source is already almost CSS. `TextStyleManager.HABBO_TEXT_STYLES_CSS` is a
 * CSS-shaped block the window system parses at boot — 106 named styles over 12
 * properties. Most map straight across; three do not, and one is more interesting
 * than it looks:
 *
 *   kerning: true                     ->  font-kerning: normal
 *   font-size: 11                     ->  font-size: 11px
 *   etching-color + etching-position  ->  text-shadow
 *
 * Etching is Flash's 1px offset copy of the glyphs behind the text — the thing
 * that makes Habbo labels look pressed into the panel. `#b2ffffff` is ARGB, so
 * alpha b2 is 0.70, and `bottom` puts it one pixel down: exactly a text-shadow.
 * Dropping it would lose the single most recognisable thing about Habbo text.
 *
 * `anti-alias-type: advanced` is Flash's greyscale antialiasing and maps to
 * `-webkit-font-smoothing: antialiased`. `sharpness` and `thickness` are
 * rasteriser knobs with no CSS counterpart; they are reported, not silently
 * ignored, so nobody later wonders whether they were considered.
 *
 * Fonts are emitted as @font-face from the TTFs already in the asset tree. They are
 * REFERENCED by default, not inlined: base64 TTFs do not compress, and inlining all
 * eight faces took the sheet from 9 KB to 1.3 MB (404 KB gzipped) — most of it fonts
 * a given page never uses. `--inline-fonts` is there for a single-file demo, and
 * `--font-url` sets the path the @font-face rules point at.
 *
 * USAGE
 *   node tools/textstyles-to-css.mjs
 *   node tools/textstyles-to-css.mjs --prefix habbo- --out ../../dist/habbo-text.css
 *   node tools/textstyles-to-css.mjs --no-fonts        # skip the @font-face block
 *   node tools/textstyles-to-css.mjs --inline-fonts    # one self-contained file (heavy)
 *   node tools/textstyles-to-css.mjs --font-url /fonts/
 */

import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const STYLE_SOURCE = join(HERE, '../../vortex-engine/src/core/window/utils/TextStyleManager.ts');
const FONT_DIR = join(HERE, '../src/assets/webfonts');

/**
 * The faces the styles reference, mapped to the files on disk.
 *
 * `Volter Bold` and `UbuntuCondensed` are separate families in the Flash styles
 * rather than weights of one family, so they stay separate here — a style asking
 * for "Volter Bold" must not be answered with Volter at weight 700, which is a
 * synthesised bold and looks wrong on a pixel face.
 */
const FONT_FILES = [
    {family: 'Ubuntu', file: 'Ubuntu.ttf', weight: '400', style: 'normal'},
    {family: 'Ubuntu', file: 'Ubuntu-b.ttf', weight: '700', style: 'normal'},
    {family: 'Ubuntu', file: 'Ubuntu-i.ttf', weight: '400', style: 'italic'},
    {family: 'Ubuntu', file: 'Ubuntu-ib.ttf', weight: '700', style: 'italic'},
    {family: 'Ubuntu', file: 'Ubuntu-m.ttf', weight: '500', style: 'normal'},
    {family: 'UbuntuCondensed', file: 'Ubuntu-C.ttf', weight: '400', style: 'normal'},
    {family: 'Volter', file: 'Volter.ttf', weight: '400', style: 'normal'},
    {family: 'Volter Bold', file: 'Volter Bold.ttf', weight: '400', style: 'normal'}
];

/** Fallbacks for when a face fails to load. */
const FALLBACKS = {
    'Ubuntu': 'Ubuntu, system-ui, sans-serif',
    'UbuntuCondensed': "UbuntuCondensed, 'Ubuntu Condensed', system-ui, sans-serif",
    'Volter': 'Volter, monospace',
    'Volter Bold': "'Volter Bold', Volter, monospace"
};

function parseArgs(argv)
{
    const args = {out: join(HERE, '../../../dist/habbo-text.css'), prefix: '', fonts: true, inline: false, fontUrl: './webfonts/', familyPrefix: ''};

    for(let i = 0; i < argv.length; i++)
    {
        if(argv[i] === '--out') args.out = resolve(argv[++i]);
        else if(argv[i] === '--prefix') args.prefix = argv[++i];
        else if(argv[i] === '--no-fonts') args.fonts = false;
        else if(argv[i] === '--inline-fonts') args.inline = true;
        else if(argv[i] === '--font-url') args.fontUrl = argv[++i];
        // Renames the emitted families. A host that already ships a font of the
        // same name — the dashboard pulls @fontsource/ubuntu — would otherwise end
        // up with two different cuts of "Ubuntu" in one family and no way to say
        // which it means. The hotel's TTF is not the Google web font.
        else if(argv[i] === '--family-prefix') args.familyPrefix = argv[++i];
    }

    // Git Bash rewrites an argument that starts with `/` into a Windows path, so
    // `--font-url /fonts/` silently arrives as `C:/Program Files/Git/fonts/` and
    // every @font-face points at a file the browser refuses to load. Prefix the
    // command with MSYS_NO_PATHCONV=1.
    if(/^[A-Za-z]:[/]/.test(args.fontUrl))
    {
        console.warn(`  WARNING: --font-url looks like a Windows path (${args.fontUrl}).`);
        console.warn('  Git Bash converted it. Re-run with MSYS_NO_PATHCONV=1.');
    }

    return args;
}

/** Pulls the CSS-shaped block out of the TypeScript file it is embedded in. */
function readStyleSheet()
{
    const source = readFileSync(STYLE_SOURCE, 'utf8');
    const start = source.indexOf('HABBO_TEXT_STYLES_CSS = `');

    if(start < 0) throw new Error('HABBO_TEXT_STYLES_CSS not found in TextStyleManager.ts');

    const from = source.indexOf('`', start) + 1;
    const to = source.indexOf('`', from);

    return source.slice(from, to);
}

function parseStyles(sheet)
{
    const styles = [];

    for(const match of sheet.matchAll(/([a-zA-Z_][\w-]*)\s*\{([^}]*)\}/g))
    {
        const declarations = {};

        for(const line of match[2].split(';'))
        {
            const colon = line.indexOf(':');

            if(colon < 0) continue;

            const key = line.slice(0, colon).trim();
            const value = line.slice(colon + 1).trim();

            if(key) declarations[key] = value;
        }

        styles.push({name: match[1], declarations});
    }

    return styles;
}

/** `#aarrggbb` (Flash ARGB) or `#rrggbb` -> a CSS colour. */
function toCssColor(value)
{
    const hex = value.replace('#', '');

    if(hex.length === 8)
    {
        const a = parseInt(hex.slice(0, 2), 16) / 255;
        const r = parseInt(hex.slice(2, 4), 16);
        const g = parseInt(hex.slice(4, 6), 16);
        const b = parseInt(hex.slice(6, 8), 16);

        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    }

    return `#${hex}`;
}

function styleToCss(style, prefix, unmapped, familyPrefix)
{
    const d = style.declarations;
    const out = [];

    if(d['font-family'])
    {
        const stack = FALLBACKS[d['font-family']] ?? `'${d['font-family']}', sans-serif`;

        out.push(`  font-family: ${familyPrefix ? `'${familyPrefix}${d['font-family']}', ${stack}` : stack};`);
    }

    if(d['font-size']) out.push(`  font-size: ${d['font-size']}px;`);
    if(d['color']) out.push(`  color: ${toCssColor(d['color'])};`);
    if(d['font-weight']) out.push(`  font-weight: ${d['font-weight']};`);
    if(d['font-style']) out.push(`  font-style: ${d['font-style']};`);
    if(d['text-decoration']) out.push(`  text-decoration: ${d['text-decoration']};`);
    if(d['kerning'] === 'true') out.push('  font-kerning: normal;');

    // The pressed-into-the-panel look: a 1px offset copy of the glyphs behind them.
    if(d['etching-color'])
    {
        const offset = d['etching-position'] === 'top' ? '-1px' : '1px';

        out.push(`  text-shadow: 0 ${offset} 0 ${toCssColor(d['etching-color'])};`);
    }

    // `anti-alias-type: advanced` DOES have a CSS equivalent, contrary to the
    // first pass of this tool: it is Flash's greyscale (FreeType) antialiasing,
    // and `-webkit-font-smoothing: antialiased` is the same thing. Without it the
    // browser uses subpixel rendering and every glyph picks up orange/blue
    // fringing the canvas never has — the single visible difference left between
    // the two renders once the skins matched.
    if(d['anti-alias-type'] === 'advanced')
    {
        out.push('  -webkit-font-smoothing: antialiased;');
        out.push('  -moz-osx-font-smoothing: grayscale;');
    }

    // These two remain genuinely unmapped: Flash rasteriser knobs for stroke
    // weight and edge hardness, with no CSS counterpart.
    for(const key of ['sharpness', 'thickness'])
    {
        if(d[key]) unmapped.add(key);
    }

    if(out.length === 0) return '';

    return `.${prefix}${style.name.replace(/_/g, '-')}\n{\n${out.join('\n')}\n}`;
}

function fontFaceBlock(inline, fontUrl, familyPrefix)
{
    const faces = [];

    for(const font of FONT_FILES)
    {
        const path = join(FONT_DIR, font.file);

        if(!existsSync(path))
        {
            console.warn(`  missing font file: ${font.file}`);
            continue;
        }

        const src = inline
            ? `url("data:font/ttf;base64,${readFileSync(path).toString('base64')}") format("truetype")`
            : `url("${fontUrl}${encodeURIComponent(font.file)}") format("truetype")`;

        faces.push([
            '@font-face',
            '{',
            `  font-family: '${familyPrefix}${font.family}';`,
            `  font-style: ${font.style};`,
            `  font-weight: ${font.weight};`,
            '  font-display: swap;',
            `  src: ${src};`,
            '}'
        ].join('\n'));
    }

    return faces.join('\n\n');
}

function main()
{
    const args = parseArgs(process.argv.slice(2));
    const styles = parseStyles(readStyleSheet());
    const unmapped = new Set();

    const out = [
        '/* Generated by packages/vortex-client/tools/textstyles-to-css.mjs — do not edit.',
        ' * The Habbo text styles from TextStyleManager, as CSS classes.',
        ' * Flash etching becomes text-shadow; the rasteriser knobs have no CSS',
        ' * counterpart and are dropped (see the tool header). */',
        ''
    ];

    if(args.fonts)
    {
        out.push(
            args.inline
                ? '/* Faces inlined so this file stands alone. */'
                : `/* Faces referenced from ${args.fontUrl} — copy src/assets/webfonts there. */`,
            fontFaceBlock(args.inline, args.fontUrl, args.familyPrefix),
            ''
        );
    }

    let emitted = 0;

    for(const style of styles)
    {
        const css = styleToCss(style, args.prefix, unmapped, args.familyPrefix);

        if(css)
        {
            out.push(css, '');
            emitted++;
        }
    }

    mkdirSync(dirname(args.out), {recursive: true});
    writeFileSync(args.out, out.join('\n'), 'utf8');

    const bytes = Buffer.byteLength(out.join('\n'));

    console.log(`${emitted}/${styles.length} text styles -> ${args.out} (${(bytes / 1024).toFixed(1)} KB)`);
    console.log(`Flash-only properties with no CSS equivalent, dropped: ${[...unmapped].join(', ')}`);
}

main();
