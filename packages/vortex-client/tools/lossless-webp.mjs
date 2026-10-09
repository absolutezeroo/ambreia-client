import sharp from 'sharp';

/**
 * Lossless WebP checked pixel by pixel, shared by build-ambreia.ts (.ambreia pieces) and
 * bundle-assets.mjs (.ambreia bundles).
 */

/** sRGB, 8 bits, RGBA whatever the source (greyscale, 16 bits): the comparison reads 4 bytes a pixel. */
async function pixels(image)
{
    const {data, info} = await sharp(image, {limitInputPixels: false}).toColourspace('srgb').ensureAlpha().raw({depth: 'uchar'}).toBuffer({resolveWithObject: true});

    if(info.channels !== 4) throw new Error(`${info.channels} channels after conversion`);

    return {data, width: info.width, height: info.height};
}

/**
 * Lossless WebP of `png`, or the PNG itself when the WebP would not show the same pixels (the RGB
 * of a fully transparent pixel does not count). `quality` is libwebp's effort/size trade-off in
 * lossless mode: 100 is ~3 % smaller and ~30x slower than 80.
 * @param {Buffer} png
 * @param {number} [quality]
 * @returns {Promise<{bytes: Buffer; format: 'webp' | 'png'}>}
 */
export async function optimise(png, quality = 80)
{
    try
    {
        const webp = await sharp(png, {limitInputPixels: false}).webp({lossless: true, effort: 6, quality}).toBuffer();
        const [a, b] = await Promise.all([pixels(png), pixels(webp)]);

        if(a.width !== b.width || a.height !== b.height) return {bytes: png, format: 'png'};

        for(let i = 0; i < a.data.length; i += 4)
        {
            if(a.data[i + 3] !== b.data[i + 3]) return {bytes: png, format: 'png'};
            if(a.data[i + 3] !== 0 && (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2])) return {bytes: png, format: 'png'};
        }

        return {bytes: webp, format: 'webp'};
    }
    catch
    {
        return {bytes: png, format: 'png'};
    }
}
