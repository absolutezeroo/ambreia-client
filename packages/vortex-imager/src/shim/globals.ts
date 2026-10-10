/**
 * Browser globals the engine's avatar pipeline reaches for, provided for Node.
 *
 * These must be installed *before* the first engine import runs, so `src/index.ts` calls
 * `installGlobals()` and then dynamically imports everything else. Nothing here changes the
 * engine's behaviour — each global is the Node equivalent of the browser API it replaces.
 *
 * - `OffscreenCanvas` / `createImageBitmap` — the compositing surface and PNG decoder.
 * - `DOMParser` / `Document` / `Element` — figuredata, geometry, part sets, actions and
 *   animations are all XML, and `AvatarXmlUtils` narrows with `instanceof`.
 * - `fetch` — optionally short-circuited to the filesystem, see {@link installGlobals}.
 */
import {createCanvas, loadImage} from '@napi-rs/canvas';
import {DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {isAbsolute, join, normalize, relative as relativeTo} from 'node:path';

export interface IGlobalsOptions
{
    /**
	 * When set together with {@link assetsBaseUrl}, requests under that URL are served
	 * straight off the disk instead of going over HTTP. This is what lets the imager run
	 * without the assets vhost being up, and it skips a loopback round-trip per library —
	 * an avatar pulls dozens of them.
	 */
    assetsRoot: string | null;

    /** The URL prefix {@link assetsRoot} stands in for, e.g. `http://vortex-assets.local`. */
    assetsBaseUrl: string;
}

let installed = false;

export function installGlobals(options: IGlobalsOptions): void
{
    if(installed) return;

    installed = true;

    installCanvas();
    installXml();
    installDocument();
    installStorage();

    if(options.assetsRoot !== null) installFileBackedFetch(options.assetsRoot, options.assetsBaseUrl);
}

/**
 * `@napi-rs/canvas`'s `Canvas` already implements the 2D context surface the engine uses, so
 * `OffscreenCanvas` is a constructor that hands one back rather than a wrapper around one —
 * a wrapper would have to re-expose every method the compositor calls.
 */
function installCanvas(): void
{
    const globals = globalThis as Record<string, unknown>;

    if(typeof globals.OffscreenCanvas === 'undefined')
    {
        globals.OffscreenCanvas = class
        {
            constructor(width: number, height: number)
            {
                return createCanvas(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
            }
        };
    }

    if(typeof globals.createImageBitmap === 'undefined')
    {
        globals.createImageBitmap = async (source: Blob | Buffer): Promise<unknown> =>
        {
            const buffer = Buffer.isBuffer(source)
                ? source
                : Buffer.from(await (source as Blob).arrayBuffer());

            return loadImage(buffer);
        };
    }
}

/**
 * A `document` whose only real job is `createElement('canvas')`.
 *
 * The room pipeline allocates its working surfaces that way rather than through
 * `OffscreenCanvas` — eighteen call sites across the plane rasterizers
 * (`PlaneMaterialCell`, `PlaneVisualizationLayer`, `FloorRasterizer`, …), plus
 * `GraphicAssetCollection.colorizePalette()`, which is what gives a furni its colour variant.
 * Without this every one of them throws `document is not defined` and the room renders empty.
 *
 * Anything that is not a canvas is delegated to linkedom, so a stray `createElement('div')`
 * gets a real element instead of `undefined`. Nothing on the imager's path asks for one, but
 * the failure mode if something did — a property set on `undefined` — is far harder to read
 * than an inert element.
 */
function installDocument(): void
{
    const globals = globalThis as Record<string, unknown>;

    if(typeof globals.document !== 'undefined') return;

    const host = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');

    globals.document = {
        createElement(tagName: string): unknown
        {
            if(tagName.toLowerCase() === 'canvas') return createCanvas(1, 1);

            // linkedom types the options bag as required, where the DOM makes it optional.
            return host.createElement(tagName, undefined);
        },
        body: host.body,
        documentElement: host.documentElement
    };
}

/**
 * An in-memory `localStorage`.
 *
 * `HabboConfigurationManager.initEmbeddedConfigurations()` reads the browser's stored hotel
 * choice (`vortex_environment`) before falling back to the first entry of
 * `live.environment.list`. There is no stored choice on a server, and the imager sets its
 * environment explicitly anyway, so an empty store is exactly the right answer — it just has
 * to exist, because the read is unguarded.
 */
function installStorage(): void
{
    const globals = globalThis as Record<string, unknown>;

    if(typeof globals.localStorage !== 'undefined') return;

    const store = new Map<string, string>();

    globals.localStorage = {
        get length(): number
        {
            return store.size;
        },
        getItem: (key: string): string | null => store.get(key) ?? null,
        setItem: (key: string, value: string): void => void store.set(key, String(value)),
        removeItem: (key: string): void => void store.delete(key),
        clear: (): void => store.clear(),
        key: (index: number): string | null => [...store.keys()][index] ?? null
    };
}

/**
 * `Document` and `Element` are installed from a probe parse rather than from linkedom's
 * exports: `AvatarXmlUtils.isXmlDocument()` narrows with `instanceof`, so the globals have to
 * be the exact constructors linkedom produces, whatever it happens to name them.
 */
function installXml(): void
{
    const globals = globalThis as Record<string, unknown>;

    if(typeof globals.DOMParser === 'undefined') globals.DOMParser = DOMParser;

    const probe = new DOMParser().parseFromString('<root><child/></root>', 'text/xml');

    if(typeof globals.Document === 'undefined') globals.Document = probe.constructor;

    if(typeof globals.Element === 'undefined')
    {
        const documentElement = probe.documentElement;

        if(documentElement) globals.Element = documentElement.constructor;
    }
}

/**
 * Serves `fetch` calls under `baseUrl` from `root`, and delegates everything else to the real
 * `fetch`. Paths are normalised and confined to `root` so a `..` in a URL cannot escape it.
 */
function installFileBackedFetch(root: string, baseUrl: string): void
{
    const realFetch = globalThis.fetch;
    const prefix = baseUrl.replace(/\/+$/, '');
    const normalisedRoot = normalize(root);

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
    {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        if(!url.startsWith(prefix)) return realFetch(input, init);

        const relative = decodeURIComponent(url.slice(prefix.length).split('?')[0]).replace(/^\/+/, '');
        const target = normalize(join(normalisedRoot, relative));

        // `relative()` rather than a string prefix: `/assets-private/x` starts with `/assets`.
        const escape = relativeTo(normalisedRoot, target);

        if(escape.startsWith('..') || isAbsolute(escape))
        {
            return new Response(null, {status: 403, statusText: 'Forbidden'});
        }

        try
        {
            const data = await readFile(target);

            return new Response(new Uint8Array(data), {status: 200, statusText: 'OK'});
        }
        catch
        {
            return new Response(null, {status: 404, statusText: 'Not Found'});
        }
    }) as typeof fetch;
}
