/**
 * A compact, exactly reversible form of a .nitro manifest (the bundle's JSON) for .ambreia packs.
 *
 * Most of a manifest repeats itself: a frame's `spriteSourceSize` and `sourceSize` restate its
 * `frame`, its `pivot` is always the centre, its key is the bundle name plus the asset key, and an
 * asset is an offset. Those become tuples; anything else stays verbatim. decodeManifest() rebuilds
 * the same JSON text, key order included — the pack build checks it on every manifest.
 */
type Json = Record<string, unknown>;

interface IFrame
{
    frame: {x: number; y: number; w: number; h: number};
}

/** Encoded manifest: `o` key order, `a` assets, `s` spritesheet, `x` the other keys verbatim. */
export interface IEncodedManifest
{
    o: string[];
    a?: unknown[];
    s?: {f: unknown[]; r: Json; o: string[]};
    x?: Array<[string, unknown]>;
}

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The frame a packer writes when nothing is trimmed or rotated. */
function plainFrame(frame: IFrame['frame']): Json
{
    return {
        frame,
        rotated: false,
        trimmed: false,
        spriteSourceSize: {x: 0, y: 0, w: frame.w, h: frame.h},
        sourceSize: {w: frame.w, h: frame.h},
        pivot: {x: 0.5, y: 0.5}
    };
}

function encodeAsset(key: string, asset: unknown): unknown[]
{
    if(isObject(asset))
    {
        const keys = Object.keys(asset);

        if(keys.length === 2 && keys[0] === 'x' && keys[1] === 'y' && Number.isInteger(asset.x) && Number.isInteger(asset.y)) return [key, asset.x, asset.y];
    }

    return [key, asset];
}

function encodeFrame(key: string, frame: unknown, name: string | null): unknown[]
{
    const short = name !== null && key.startsWith(`${name}_`) ? key.slice(name.length + 1) : `!${key}`;

    if(isObject(frame) && isObject(frame.frame))
    {
        const {x, y, w, h} = frame.frame as IFrame['frame'];
        const rect = {x, y, w, h};

        // Same keys in the same order, and the rest exactly the plain shape: the tuple loses nothing.
        if(JSON.stringify(rect) === JSON.stringify(frame.frame) && JSON.stringify(plainFrame(rect)) === JSON.stringify(frame)) return [short, x, y, w, h];
    }

    return [short, frame];
}

export function encodeManifest(manifest: Json): IEncodedManifest
{
    const name = typeof manifest.name === 'string' ? manifest.name : null;
    const encoded: IEncodedManifest = {o: Object.keys(manifest)};

    for(const [key, value] of Object.entries(manifest))
    {
        if(key === 'assets' && isObject(value))
        {
            encoded.a = Object.entries(value).map(([assetKey, asset]) => encodeAsset(assetKey, asset));
        }
        else if(key === 'spritesheet' && isObject(value) && isObject(value.frames))
        {
            const rest: Json = {...value};

            delete rest.frames;
            encoded.s = {f: Object.entries(value.frames).map(([frameKey, frame]) => encodeFrame(frameKey, frame, name)), r: rest, o: Object.keys(value)};
        }
        else
        {
            (encoded.x ??= []).push([key, value]);
        }
    }

    return encoded;
}

export function decodeManifest(encoded: IEncodedManifest): Json
{
    const verbatim = new Map(encoded.x ?? []);
    const name = verbatim.get('name');
    const manifest: Json = {};

    for(const key of encoded.o)
    {
        if(key === 'assets' && encoded.a)
        {
            manifest.assets = Object.fromEntries(encoded.a.map(entry =>
            {
                const tuple = entry as unknown[];

                return tuple.length === 3 ? [tuple[0], {x: tuple[1], y: tuple[2]}] : [tuple[0], tuple[1]];
            }));
        }
        else if(key === 'spritesheet' && encoded.s)
        {
            const sheet = encoded.s;
            const frames = Object.fromEntries(sheet.f.map(entry =>
            {
                const tuple = entry as unknown[];
                const short = tuple[0] as string;
                const frameKey = short.startsWith('!') ? short.slice(1) : `${name as string}_${short}`;

                return tuple.length === 5
                    ? [frameKey, plainFrame({x: tuple[1] as number, y: tuple[2] as number, w: tuple[3] as number, h: tuple[4] as number})]
                    : [frameKey, tuple[1]];
            }));
            const out: Json = {};

            for(const sheetKey of sheet.o) out[sheetKey] = sheetKey === 'frames' ? frames : sheet.r[sheetKey];

            manifest.spritesheet = out;
        }
        else
        {
            manifest[key] = verbatim.get(key);
        }
    }

    return manifest;
}
