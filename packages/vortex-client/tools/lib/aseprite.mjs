// Reads and writes .aseprite files: what the monster tools need, no more
// (https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md). Image layers only (no
// tilemaps, no blend modes: "normal"); chunks it does not know are skipped, so files saved by Aseprite
// read. readAsepriteLayers keeps the layers apart; readAseprite flattens the visible ones.
import {deflateSync, inflateSync} from 'node:zlib';

const CHUNK_LAYER = 0x2004, CHUNK_CEL = 0x2005, CHUNK_TAGS = 0x2018, CHUNK_PALETTE = 0x2019;

function parse(buffer)
{
    if(buffer.readUInt16LE(4) !== 0xA5E0) throw new Error('not an .aseprite file (bad magic)');

    const frameCount = buffer.readUInt16LE(6), width = buffer.readUInt16LE(8), height = buffer.readUInt16LE(10);
    const depth = buffer.readUInt16LE(12), transparentIndex = buffer.readUInt8(28);

    if(depth !== 32 && depth !== 16 && depth !== 8) throw new Error(`unsupported colour depth ${depth}`);

    const layers = [], tags = [], frames = [], palette = [];
    // Visibility of the current layer's ancestors, by child level: a layer shows only if they all do.
    const shown = [];
    const string = at => [buffer.toString('utf8', at + 2, at + 2 + buffer.readUInt16LE(at)), at + 2 + buffer.readUInt16LE(at)];
    let offset = 128;

    for(let f = 0; f < frameCount; f++)
    {
        const frameBytes = buffer.readUInt32LE(offset);
        const oldChunks = buffer.readUInt16LE(offset + 6), duration = buffer.readUInt16LE(offset + 8);
        const chunkCount = buffer.readUInt32LE(offset + 12) || oldChunks;
        const cels = [];
        let at = offset + 16;

        for(let c = 0; c < chunkCount; c++)
        {
            const size = buffer.readUInt32LE(at), type = buffer.readUInt16LE(at + 4), body = at + 6;

            if(type === CHUNK_LAYER)
            {
                const flags = buffer.readUInt16LE(body), layerType = buffer.readUInt16LE(body + 2), level = buffer.readUInt16LE(body + 4);

                // Flag 64: a reference layer (an image traced over), never part of the art.
                shown[level] = (flags & 1) !== 0 && (flags & 64) === 0;
                shown.length = level + 1;
                layers.push({name: string(body + 16)[0], visible: shown.every(Boolean), image: layerType === 0, opacity: buffer.readUInt8(body + 12)});
            }
            else if(type === CHUNK_CEL)
            {
                const layer = buffer.readUInt16LE(body), x = buffer.readInt16LE(body + 2), y = buffer.readInt16LE(body + 4);
                const opacity = buffer.readUInt8(body + 6), celType = buffer.readUInt16LE(body + 7), data = body + 16;

                if(celType === 0 || celType === 2)
                {
                    const w = buffer.readUInt16LE(data), h = buffer.readUInt16LE(data + 2), raw = buffer.subarray(data + 4, at + size);

                    cels.push({layer, x, y, opacity, w, h, pixels: celType === 2 ? inflateSync(raw) : raw});
                }
                else if(celType === 1)
                {
                    const linked = frames[buffer.readUInt16LE(data)]?.cels.find(cel => cel.layer === layer);

                    if(linked) cels.push({...linked, x, y, opacity});
                }
            }
            else if(type === CHUNK_TAGS)
            {
                let tag = body + 10;

                for(let t = buffer.readUInt16LE(body); t > 0; t--)
                {
                    const [name, next] = string(tag + 17);

                    tags.push({name, from: buffer.readUInt16LE(tag), to: buffer.readUInt16LE(tag + 2)});
                    tag = next;
                }
            }
            else if(type === CHUNK_PALETTE)
            {
                let entry = body + 20;

                for(let i = buffer.readUInt32LE(body + 4); i <= buffer.readUInt32LE(body + 8); i++)
                {
                    const hasName = buffer.readUInt16LE(entry) & 1;

                    palette[i] = [buffer[entry + 2], buffer[entry + 3], buffer[entry + 4], buffer[entry + 5]];
                    entry += 6;
                    if(hasName) entry = string(entry)[1];
                }
            }

            at += size;
        }

        frames.push({duration, cels});
        offset += frameBytes;
    }

    const colourOf = (cel, i) =>
    {
        if(depth === 32) return [cel.pixels[i * 4], cel.pixels[i * 4 + 1], cel.pixels[i * 4 + 2], cel.pixels[i * 4 + 3]];
        if(depth === 16) return [cel.pixels[i * 2], cel.pixels[i * 2], cel.pixels[i * 2], cel.pixels[i * 2 + 1]];

        const index = cel.pixels[i];

        return index === transparentIndex ? [0, 0, 0, 0] : (palette[index] ?? [0, 0, 0, 0]);
    };

    return {width, height, layers, frames, tags, colourOf};
}

/** A cel spread over the whole canvas, RGBA straight alpha. */
function celCanvas(file, cel)
{
    const out = Buffer.alloc(file.width * file.height * 4);

    for(let cy = 0; cy < cel.h; cy++)
    {
        for(let cx = 0; cx < cel.w; cx++)
        {
            const px = cel.x + cx, py = cel.y + cy;

            if(px >= 0 && py >= 0 && px < file.width && py < file.height) out.set(file.colourOf(cel, cy * cel.w + cx), (py * file.width + px) * 4);
        }
    }

    return out;
}

export function readAsepriteLayers(buffer)
{
    const file = parse(buffer);

    return {
        width: file.width,
        height: file.height,
        layers: file.layers.map(({name, visible, image}) => ({name, visible, image})),
        tags: file.tags,
        frames: file.frames.map(frame =>
        {
            const cels = file.layers.map(() => null);

            for(const cel of frame.cels) if(file.layers[cel.layer]?.image) cels[cel.layer] = celCanvas(file, cel);

            return {duration: frame.duration, cels};
        })
    };
}

/** Visible image layers flattened with "normal" blending, bottom layer first. */
export function readAseprite(buffer)
{
    const file = parse(buffer), n = file.width * file.height;

    return {
        width: file.width,
        height: file.height,
        tags: file.tags,
        frames: file.frames.map(frame =>
        {
            const data = Buffer.alloc(n * 4);

            for(const cel of [...frame.cels].sort((a, b) => a.layer - b.layer))
            {
                const layer = file.layers[cel.layer];

                if(!layer || !layer.visible || !layer.image) continue;

                const src = celCanvas(file, cel), alpha = (cel.opacity / 255) * (layer.opacity / 255);

                for(let i = 0; i < n; i++)
                {
                    const o = i * 4, sa = (src[o + 3] / 255) * alpha;

                    if(sa <= 0) continue;

                    const da = data[o + 3] / 255, oa = sa + da * (1 - sa);

                    for(let c = 0; c < 3; c++) data[o + c] = Math.round((src[o + c] * sa + data[o + c] * da * (1 - sa)) / oa);
                    data[o + 3] = Math.round(oa * 255);
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

/** A cel chunk of the opaque part of a full-canvas RGBA buffer, or null when nothing is opaque. */
function celChunk(layerIndex, data, width, height)
{
    let minX = width, minY = height, maxX = -1, maxY = -1;

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            if(data[(y * width + x) * 4 + 3] === 0) continue;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }
    if(maxX < 0) return null;

    const w = maxX - minX + 1, h = maxY - minY + 1, pixels = Buffer.alloc(w * h * 4);

    for(let y = 0; y < h; y++) data.copy(pixels, y * w * 4, ((minY + y) * width + minX) * 4, ((minY + y) * width + maxX + 1) * 4);

    const head = Buffer.alloc(20);

    head.writeUInt16LE(layerIndex, 0);
    head.writeInt16LE(minX, 2);
    head.writeInt16LE(minY, 4);
    head.writeUInt8(255, 6);
    head.writeUInt16LE(2, 7);
    head.writeUInt16LE(w, 16);
    head.writeUInt16LE(h, 18);

    return chunk(CHUNK_CEL, Buffer.concat([head, deflateSync(pixels)]));
}

/**
 * Writes RGBA frames as an .aseprite. One layer: `frames[i].data` (named `layer`). Several:
 * `layers` [{name, visible, group?, level?, reference?}] and `frames[i].cels`, one full-canvas buffer
 * (or null) per layer.
 */
export function writeAseprite({width, height, frames, tags = [], layer = 'Layer 1', layers})
{
    const layerList = layers ?? [{name: layer, visible: true}];
    const frameCels = layers ? frames.map(f => f.cels) : frames.map(f => [f.data]);
    const frameBuffers = frames.map(({duration}, index) =>
    {
        const chunks = [];

        if(index === 0)
        {
            const palette = Buffer.alloc(20 + 6);

            palette.writeUInt32LE(1, 0);
            palette.writeUInt8(255, 20 + 5);
            chunks.push(chunk(CHUNK_PALETTE, palette));
            for(const {name, visible, group, level, reference} of layerList)
            {
                const head = Buffer.alloc(16);

                // Flags: 1 visible, 2 editable, 64 reference. Type 1 is a group; children follow it one level deeper.
                head.writeUInt16LE((visible === false ? 0 : 1) | 2 | (reference ? 64 : 0), 0);
                head.writeUInt16LE(group ? 1 : 0, 2);
                head.writeUInt16LE(level ?? 0, 4);
                head.writeUInt8(255, 12);
                chunks.push(chunk(CHUNK_LAYER, Buffer.concat([head, aseString(name)])));
            }
            if(tags.length)
            {
                const parts = [Buffer.alloc(10)];

                parts[0].writeUInt16LE(tags.length, 0);
                for(const tag of tags)
                {
                    const head = Buffer.alloc(17);

                    head.writeUInt16LE(tag.from, 0);
                    head.writeUInt16LE(tag.to, 2);
                    head.writeUInt8(0x40, 13);
                    head.writeUInt8(0xA0, 14);
                    head.writeUInt8(0xFF, 15);
                    parts.push(head, aseString(tag.name));
                }
                chunks.push(chunk(CHUNK_TAGS, Buffer.concat(parts)));
            }
        }
        frameCels[index].forEach((data, layerIndex) =>
        {
            const cel = data ? celChunk(layerIndex, data, width, height) : null;

            if(cel) chunks.push(cel);
        });

        const body = Buffer.concat(chunks), header = Buffer.alloc(16);

        header.writeUInt32LE(16 + body.length, 0);
        header.writeUInt16LE(0xF1FA, 4);
        header.writeUInt16LE(Math.min(chunks.length, 0xFFFF), 6);
        header.writeUInt16LE(duration, 8);
        header.writeUInt32LE(chunks.length, 12);

        return Buffer.concat([header, body]);
    });

    const header = Buffer.alloc(128);

    header.writeUInt32LE(128 + frameBuffers.reduce((sum, b) => sum + b.length, 0), 0);
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
