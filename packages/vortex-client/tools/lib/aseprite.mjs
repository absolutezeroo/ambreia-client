// Reads an .aseprite file into flattened RGBA frames and its tags: what build-monsters needs, no
// more (https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md). Visible normal
// layers only, composited with "normal" blending; tilemap cels and blend modes are not supported.
// writeAseprite() writes the same shape back (one RGBA layer), for test fixtures and drawn sources.
import {deflateSync, inflateSync} from 'node:zlib';

const CHUNK_LAYER = 0x2004, CHUNK_CEL = 0x2005, CHUNK_TAGS = 0x2018, CHUNK_PALETTE = 0x2019;

/**
 * @returns {{width: number, height: number, frames: {duration: number, data: Buffer}[], tags: {name: string, from: number, to: number}[]}}
 *   `data` is width × height RGBA (straight alpha).
 */
export function readAseprite(buffer)
{
    if(buffer.readUInt16LE(4) !== 0xA5E0) throw new Error('not an .aseprite file (bad magic)');

    const frameCount = buffer.readUInt16LE(6), width = buffer.readUInt16LE(8), height = buffer.readUInt16LE(10);
    const depth = buffer.readUInt16LE(12), transparentIndex = buffer.readUInt8(28);

    if(depth !== 32 && depth !== 16 && depth !== 8) throw new Error(`unsupported colour depth ${depth}`);

    const layers = [], tags = [], frames = [];
    const palette = [];
    // Cels per frame, kept to resolve linked cels (type 1) and composited once the frame is read.
    const cels = [];
    let offset = 128;

    const string = at => [buffer.toString('utf8', at + 2, at + 2 + buffer.readUInt16LE(at)), at + 2 + buffer.readUInt16LE(at)];

    for(let f = 0; f < frameCount; f++)
    {
        const frameBytes = buffer.readUInt32LE(offset);
        const oldChunks = buffer.readUInt16LE(offset + 6), duration = buffer.readUInt16LE(offset + 8);
        const newChunks = buffer.readUInt32LE(offset + 12);
        const chunkCount = newChunks || oldChunks;
        const frameCels = [];
        let at = offset + 16;

        for(let c = 0; c < chunkCount; c++)
        {
            const size = buffer.readUInt32LE(at), type = buffer.readUInt16LE(at + 4), body = at + 6;

            if(type === CHUNK_LAYER)
            {
                const flags = buffer.readUInt16LE(body), layerType = buffer.readUInt16LE(body + 2);
                const blend = buffer.readUInt16LE(body + 10), opacity = buffer.readUInt8(body + 12);
                const [name] = string(body + 16);

                layers.push({name, visible: (flags & 1) !== 0, image: layerType === 0, blend, opacity});
            }
            else if(type === CHUNK_CEL)
            {
                const layer = buffer.readUInt16LE(body), x = buffer.readInt16LE(body + 2), y = buffer.readInt16LE(body + 4);
                const opacity = buffer.readUInt8(body + 6), celType = buffer.readUInt16LE(body + 7);
                const data = body + 16;

                if(celType === 0 || celType === 2)
                {
                    const w = buffer.readUInt16LE(data), h = buffer.readUInt16LE(data + 2);
                    const raw = buffer.subarray(data + 4, at + size);

                    frameCels.push({layer, x, y, opacity, w, h, pixels: celType === 2 ? inflateSync(raw) : raw});
                }
                else if(celType === 1)
                {
                    const linked = cels[buffer.readUInt16LE(data)]?.find(cel => cel.layer === layer);

                    if(linked) frameCels.push({...linked, x, y, opacity});
                }
            }
            else if(type === CHUNK_TAGS)
            {
                let tag = body + 10;

                for(let t = buffer.readUInt16LE(body); t > 0; t--)
                {
                    const from = buffer.readUInt16LE(tag), to = buffer.readUInt16LE(tag + 2);
                    const [name, next] = string(tag + 17);

                    tags.push({name, from, to});
                    tag = next;
                }
            }
            else if(type === CHUNK_PALETTE)
            {
                const first = buffer.readUInt32LE(body + 4), last = buffer.readUInt32LE(body + 8);
                let entry = body + 20;

                for(let i = first; i <= last; i++)
                {
                    const hasName = buffer.readUInt16LE(entry) & 1;

                    palette[i] = [buffer[entry + 2], buffer[entry + 3], buffer[entry + 4], buffer[entry + 5]];
                    entry += 6;
                    if(hasName) entry = string(entry)[1];
                }
            }

            at += size;
        }

        cels.push(frameCels);
        frames.push({duration, cels: frameCels});
        offset += frameBytes;
    }

    const pixel = (cel, i) =>
    {
        if(depth === 32) return [cel.pixels[i * 4], cel.pixels[i * 4 + 1], cel.pixels[i * 4 + 2], cel.pixels[i * 4 + 3]];
        if(depth === 16) return [cel.pixels[i * 2], cel.pixels[i * 2], cel.pixels[i * 2], cel.pixels[i * 2 + 1]];

        const index = cel.pixels[i];

        return index === transparentIndex ? [0, 0, 0, 0] : (palette[index] ?? [0, 0, 0, 0]);
    };

    return {
        width, height, tags,
        frames: frames.map(frame =>
        {
            const data = Buffer.alloc(width * height * 4);

            // Chunk order is not layer order: draw bottom layer first.
            for(const cel of [...frame.cels].sort((a, b) => a.layer - b.layer))
            {
                const layer = layers[cel.layer];

                if(!layer || !layer.visible || !layer.image) continue;

                const alpha = (cel.opacity / 255) * (layer.opacity / 255);

                for(let cy = 0; cy < cel.h; cy++)
                {
                    for(let cx = 0; cx < cel.w; cx++)
                    {
                        const px = cel.x + cx, py = cel.y + cy;

                        if(px < 0 || py < 0 || px >= width || py >= height) continue;

                        const [r, g, b, a] = pixel(cel, cy * cel.w + cx);
                        const sa = (a / 255) * alpha;

                        if(sa <= 0) continue;

                        const o = (py * width + px) * 4, da = data[o + 3] / 255, oa = sa + da * (1 - sa);

                        data[o] = Math.round((r * sa + data[o] * da * (1 - sa)) / oa);
                        data[o + 1] = Math.round((g * sa + data[o + 1] * da * (1 - sa)) / oa);
                        data[o + 2] = Math.round((b * sa + data[o + 2] * da * (1 - sa)) / oa);
                        data[o + 3] = Math.round(oa * 255);
                    }
                }
            }

            return {duration: frame.duration, data};
        })
    };
}

const chunk = (type, body) =>
{
    const head = Buffer.alloc(6);

    head.writeUInt32LE(6 + body.length, 0);
    head.writeUInt16LE(type, 4);

    return Buffer.concat([head, body]);
};

const aseString = text =>
{
    const bytes = Buffer.from(text, 'utf8'), out = Buffer.alloc(2 + bytes.length);

    out.writeUInt16LE(bytes.length, 0);
    bytes.copy(out, 2);

    return out;
};

/**
 * Writes RGBA frames as a one-layer .aseprite, each cel cropped to its opaque pixels.
 * @param {{width: number, height: number, frames: {duration: number, data: Buffer}[], tags?: {name: string, from: number, to: number}[], layer?: string}} sprite
 */
export function writeAseprite({width, height, frames, tags = [], layer = 'Layer 1'})
{
    const frameBuffers = frames.map(({duration, data}, index) =>
    {
        const chunks = [];

        if(index === 0)
        {
            const palette = Buffer.alloc(20 + 6);

            palette.writeUInt32LE(1, 0);
            palette.writeUInt32LE(0, 4);
            palette.writeUInt32LE(0, 8);
            palette.writeUInt8(255, 20 + 5);
            chunks.push(chunk(CHUNK_PALETTE, palette));

            const head = Buffer.alloc(16);

            head.writeUInt16LE(3, 0);
            head.writeUInt8(255, 12);
            chunks.push(chunk(CHUNK_LAYER, Buffer.concat([head, aseString(layer)])));

            if(tags.length)
            {
                const parts = [Buffer.alloc(10)];

                parts[0].writeUInt16LE(tags.length, 0);

                for(const tag of tags)
                {
                    const head = Buffer.alloc(17);

                    head.writeUInt16LE(tag.from, 0);
                    head.writeUInt16LE(tag.to, 2);
                    head.writeUInt16LE(0, 5);
                    head.writeUInt8(0x40, 13);
                    head.writeUInt8(0xA0, 14);
                    head.writeUInt8(0xFF, 15);
                    parts.push(head, aseString(tag.name));
                }

                chunks.push(chunk(CHUNK_TAGS, Buffer.concat(parts)));
            }
        }

        let minX = width, minY = height, maxX = -1, maxY = -1;

        for(let y = 0; y < height; y++)
        {
            for(let x = 0; x < width; x++)
            {
                if(data[(y * width + x) * 4 + 3] === 0) continue;
                if(x < minX) minX = x;
                if(x > maxX) maxX = x;
                if(y < minY) minY = y;
                if(y > maxY) maxY = y;
            }
        }

        if(maxX >= 0)
        {
            const w = maxX - minX + 1, h = maxY - minY + 1, pixels = Buffer.alloc(w * h * 4);

            for(let y = 0; y < h; y++) data.copy(pixels, y * w * 4, ((minY + y) * width + minX) * 4, ((minY + y) * width + maxX + 1) * 4);

            const head = Buffer.alloc(20);

            head.writeInt16LE(minX, 2);
            head.writeInt16LE(minY, 4);
            head.writeUInt8(255, 6);
            head.writeUInt16LE(2, 7);
            head.writeUInt16LE(w, 16);
            head.writeUInt16LE(h, 18);
            chunks.push(chunk(CHUNK_CEL, Buffer.concat([head, deflateSync(pixels)])));
        }

        const body = Buffer.concat(chunks), header = Buffer.alloc(16);

        header.writeUInt32LE(16 + body.length, 0);
        header.writeUInt16LE(0xF1FA, 4);
        header.writeUInt16LE(Math.min(chunks.length, 0xFFFF), 6);
        header.writeUInt16LE(duration, 8);
        header.writeUInt32LE(chunks.length, 12);

        return Buffer.concat([header, body]);
    });

    const header = Buffer.alloc(128);
    const size = 128 + frameBuffers.reduce((sum, buffer) => sum + buffer.length, 0);

    header.writeUInt32LE(size, 0);
    header.writeUInt16LE(0xA5E0, 4);
    header.writeUInt16LE(frames.length, 6);
    header.writeUInt16LE(width, 8);
    header.writeUInt16LE(height, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(1, 14);
    header.writeUInt16LE(100, 18);
    header.writeUInt16LE(1, 32);
    header.writeUInt8(1, 34);
    header.writeUInt8(1, 35);
    header.writeUInt16LE(16, 40);
    header.writeUInt16LE(16, 42);

    return Buffer.concat([header, ...frameBuffers]);
}
