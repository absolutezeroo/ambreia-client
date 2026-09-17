/**
 * build-vortexcoin-icon.mjs
 *
 * Draws the VortexCoin currency icon - the violet "vortex swirl" coin - at every size the project
 * needs, and writes it where each consumer reads it from:
 *
 *   src/assets/images/icon_currency_vortex_mid.png    24x24  in-client, big  (purse, catalog price)
 *   src/assets/images/icon_currency_vortex_tiny.png   13x13  in-client, small
 *   ../vortex-web/public/vortexcoin-256.png          256x256 the MetaMask / token-list image
 *
 * This file exists because the art is not a port and has no dump to come back from: `*.png` is
 * gitignored repo-wide, so the two client icons reach anyone else only through
 * `vortex-client-assets.zip` (`node install.mjs --pack`), and a fresh clone that has never been
 * packed would otherwise have no way to produce them. Re-run it to change the art.
 *
 * Every size is drawn natively rather than resampled: downscaling the 24px coin to 13 turns the
 * swirl into a blob, which is the same reason the shipped silver/emerald icons ship a separately
 * drawn `_tiny`. The 256 is the 32px drawing scaled x8 with nearest neighbour, so it stays pixel
 * art rather than becoming a blurry circle.
 *
 * Wiring the icon into the client is a separate job and needs no change here - see
 * ActivityPointTypeEnum.getIconStyleFor(), which resolves an unknown currency type through the
 * `currencyiconstyle.big.<type>` / `.small.<type>` external variables.
 */
import {createRequire} from 'node:module';
import {existsSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const HERE = dirname(fileURLToPath(import.meta.url));
const CLIENT = join(HERE, '..');
const IMAGES = join(CLIENT, 'src', 'assets', 'images');
const WEB_PUBLIC = join(CLIENT, '..', 'vortex-web', 'public');

/**
 * Violet is the one currency family no shipped icon occupies: gold, cream, magenta, cyan,
 * blue-grey and green are already credits, nuggets, duckets, diamonds, silver and emerald.
 */
const PALETTE = {
    hi: [240, 224, 255],
    light: [198, 145, 247],
    mid: [151, 74, 222],
    dark: [46, 10, 86]
};

/** Swirl shape. Tuned by rendering the 4x3 parameter sweep and reading it at both sizes. */
const ANGULAR = 1.6;
const RADIAL = 1.0;

function draw(size, {shadow = true, margin = 0} = {})
{
    // A radius that lands exactly on the bounding box leaves a 1px nub at each cardinal - (0,R) is
    // inside the disc while (1,R) is not. Pulling it in by 0.05 gives a several-pixel top row.
    const radius = size / 2 - 0.05 - margin;
    const centre = (size - 1) / 2;
    const outline = Math.max(1, size / 21);
    const rim = size >= 20 ? size / 11 : 1.3;
    const pixels = Buffer.alloc(size * size * 4, 0);

    const put = (x, y, [r, g, b], a = 255) =>
    {
        const i = (y * size + x) * 4;

        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
        pixels[i + 3] = a;
    };

    for(let y = 0; y < size; y++)
    {
        for(let x = 0; x < size; x++)
        {
            const dx = x - centre;
            const dy = y - centre;
            const d = Math.hypot(dx, dy);

            if(d > radius)
            {
                // 1px drop shadow to the bottom-right, as on credits_currency_icon.
                if(shadow && Math.hypot(dx - 1, dy - 1) <= radius && d <= radius + 1.1) put(x, y, [0, 0, 0], 70);
                continue;
            }

            if(d > radius - outline)
            {
                put(x, y, [0, 0, 0]);
                continue;
            }

            // Struck-coin edge: the darker ring inside the outline. The shipped silver icon is a
            // swirl too, but a flat badge with no rim - this ring is most of what keeps the two
            // apart at a glance, the violet doing the rest.
            if(d > radius - outline - rim)
            {
                put(x, y, (dx + dy) < -radius * 0.35 ? PALETTE.mid : PALETTE.dark);
                continue;
            }

            const t = 0.5 + (dx + dy) / (3.2 * radius);
            const lit = t < 0.18 ? PALETTE.hi : PALETTE.light;
            const band = (Math.atan2(dy, dx) * ANGULAR + d * (RADIAL * 24 / size)) / Math.PI;

            put(x, y, (Math.floor(band) & 1) ? PALETTE.dark : lit);
        }
    }

    return sharp(pixels, {raw: {width: size, height: size, channels: 4}});
}

async function main()
{
    for(const dir of [IMAGES, WEB_PUBLIC]) if(!existsSync(dir)) mkdirSync(dir, {recursive: true});

    const written = [];

    await draw(24).png().toFile(join(IMAGES, 'icon_currency_vortex_mid.png'));
    written.push('icon_currency_vortex_mid.png        24x24');

    await draw(13).png().toFile(join(IMAGES, 'icon_currency_vortex_tiny.png'));
    written.push('icon_currency_vortex_tiny.png       13x13');

    // The window skin system cannot draw either of those two on its own: a skin template resolves
    // its bitmap with `atlases.get(name)` over a map built only from App.ts's ATLAS_NAMES, and a
    // standalone image is not in it - the lookup misses and the icon renders as nothing, silently.
    // So the same art is also laid into Vortex's own atlas, whose regions src/vortex-skins/
    // habbo_skin_icon_set_xml.xml cuts back out. Append new icons to the right; the regions are
    // absolute, so growing the sheet never moves an existing one.
    await sharp({create: {width: 37, height: 24, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 0}}})
        .composite([
            {input: await draw(24).png().toBuffer(), left: 0, top: 0},
            {input: await draw(13).png().toBuffer(), left: 24, top: 0}
        ])
        .png()
        .toFile(join(IMAGES, 'vortex_icons.png'));
    written.push('vortex_icons.png                     37x24  (coin 0,0,24,24 | tiny 24,0,13,13)');

    // MetaMask crops a token image to a circle, so the drop shadow goes - it clips into a crescent
    // - and a 2px margin at the 32px drawing keeps the black outline clear of the crop edge.
    await draw(32, {shadow: false, margin: 2})
        .resize({width: 256, height: 256, kernel: 'nearest'})
        .png()
        .toFile(join(WEB_PUBLIC, 'vortexcoin-256.png'));
    written.push('vortexcoin-256.png                256x256');

    console.log('\nVortexCoin icon\n');
    for(const line of written) console.log(`  ${line}`);
    console.log('\n  `node install.mjs --pack` to ship the two client icons in vortex-client-assets.zip.\n');
}

main().catch((error) =>
{
    console.error(error);
    process.exitCode = 1;
});
