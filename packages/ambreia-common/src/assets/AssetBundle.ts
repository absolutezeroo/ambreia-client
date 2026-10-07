/**
 * Runtime loader for the packed asset bundle.
 *
 * Fetches a single `.bundle` file containing packed binary/text assets,
 * parses the manifest header, and provides methods to extract individual
 * assets as blob URLs, ImageBitmaps, or raw text.
 *
 * Bundle format (binary manifest):
 *   [4 bytes: version (uint32 big-endian)]
 *   [4 bytes: entry count (uint32 big-endian)]
 *   repeated N times:
 *     [2 bytes: key length (uint16 big-endian)]
 *     [K bytes: key UTF-8]
 *     [4 bytes: data offset (uint32 big-endian)]
 *     [4 bytes: data size (uint32 big-endian)]
 *   [remaining: concatenated file data]
 *
 * @see tools/bundle-assets.mjs
 */

/** A single entry in the bundle manifest. */
interface IBundleEntry
{
    /** Byte offset within the data section. */
    offset: number;

    /** Byte size of the entry. */
    size: number;
}

/** The manifest stored at the beginning of the bundle. */
interface IBundleManifest
{
    version: number;
    entries: Record<string, IBundleEntry>;
}

/**
 * Runtime asset bundle loader.
 *
 * Usage:
 * ```typescript
 * const bundle = await AssetBundle.load(`${import.meta.env.BASE_URL}assets-images.bundle`, ratio => { ... });
 * const bitmap = await bundle.getImageBitmap('images/habbo_blue_skin.png');
 * const xml = bundle.getText('window-layouts/main_window.xml');
 * const url = bundle.getUrl('images/icon_name.png');
 * bundle.dispose();
 * ```
 */
export class AssetBundle
{
    /**
     * Shared UTF-8 decoder. `getText()`/`parse()` run hundreds of times during
     * boot (once per layout + per skin), so reuse one instance instead of
     * allocating a fresh TextDecoder per call.
     */
    private static readonly _decoder = new TextDecoder();

    private _manifest: IBundleManifest;
    private _data: ArrayBuffer;
    private _dataOffset: number;
    private _urlCache: Map<string, string> = new Map();

    private constructor(manifest: IBundleManifest, data: ArrayBuffer, dataOffset: number)
    {
        this._manifest = manifest;
        this._data = data;
        this._dataOffset = dataOffset;
    }

    /**
	 * Loads a bundle from a URL with optional download progress tracking.
	 *
	 * Uses ReadableStream to track download progress byte-by-byte,
	 * providing real-time feedback for the loading screen.
	 *
	 * @param url - URL to the .bundle file
	 * @param onProgress - Optional callback receiving a ratio from 0.0 to 1.0
	 * @returns The loaded AssetBundle
	 */
    public static async load(url: string, onProgress?: (ratio: number) => void): Promise<AssetBundle>
    {
        const response = await fetch(url);

        if(!response.ok)
        {
            throw new Error(`[AssetBundle] Failed to load: ${response.status} ${response.statusText}`);
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        let buffer: ArrayBuffer;

        if(contentLength > 0 && response.body && onProgress)
        {
            // Stream download with progress tracking
            buffer = await AssetBundle.readWithProgress(response.body, contentLength, onProgress);
        }
        else
        {
            // Fallback: no progress tracking
            buffer = await response.arrayBuffer();
        }

        return AssetBundle.parse(buffer);
    }

    /**
	 * Reads a ReadableStream into an ArrayBuffer while tracking progress.
	 *
	 * @param body - The response body stream
	 * @param contentLength - Expected total size in bytes
	 * @param onProgress - Progress callback (0.0 to 1.0)
	 * @returns The complete ArrayBuffer
	 */
    private static async readWithProgress(
        body: ReadableStream<Uint8Array>,
        contentLength: number,
        onProgress: (ratio: number) => void
    ): Promise<ArrayBuffer>
    {
        const reader = body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        for(; ;)
        {
            const {done, value} = await reader.read();

            if(done) break;

            chunks.push(value);
            received += value.length;
            onProgress(Math.min(received / contentLength, 1.0));
        }

        // Merge chunks into a single ArrayBuffer
        const result = new Uint8Array(received);
        let offset = 0;

        for(const chunk of chunks)
        {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result.buffer;
    }

    /**
	 * Parses a raw ArrayBuffer into an AssetBundle.
	 *
	 * @param buffer - The raw bundle data
	 * @returns The parsed AssetBundle
	 */
    private static parse(buffer: ArrayBuffer): AssetBundle
    {
        const view = new DataView(buffer);
        const decoder = AssetBundle._decoder;
        let cursor = 0;

        if(view.byteLength < 8)
        {
            throw new Error('[AssetBundle] Invalid bundle: header is too short');
        }

        const version = view.getUint32(cursor, false);
        cursor += 4;

        if(version !== 1)
        {
            throw new Error(`[AssetBundle] Unsupported bundle version: ${version}`);
        }

        const entryCount = view.getUint32(cursor, false);
        cursor += 4;
        const entries: Record<string, IBundleEntry> = {};

        for(let i = 0; i < entryCount; i++)
        {
            if((cursor + 2) > view.byteLength)
            {
                throw new Error('[AssetBundle] Invalid bundle: truncated key length');
            }

            const keyLength = view.getUint16(cursor, false);
            cursor += 2;

            if((cursor + keyLength + 8) > view.byteLength)
            {
                throw new Error('[AssetBundle] Invalid bundle: truncated entry data');
            }

            const keyBytes = new Uint8Array(buffer, cursor, keyLength);
            const key = decoder.decode(keyBytes);
            cursor += keyLength;
            const offset = view.getUint32(cursor, false);
            cursor += 4;
            const size = view.getUint32(cursor, false);
            cursor += 4;

            entries[key] = {offset, size};
        }

        const manifest: IBundleManifest =
            {
                version,
                entries
            };
        const dataOffset = cursor;

        return new AssetBundle(manifest, buffer, dataOffset);
    }

    /**
	 * Gets the raw bytes for a bundle entry.
	 *
	 * @param key - Entry key (e.g., "images/icon_name.png")
	 * @returns The entry's raw bytes, or null if not found
	 */
    public getBytes(key: string): Uint8Array | null
    {
        const entry = this._manifest.entries[key];

        if(!entry) return null;

        return new Uint8Array(this._data, this._dataOffset + entry.offset, entry.size);
    }

    /**
	 * Gets a Blob for a bundle entry.
	 *
	 * @param key - Entry key (e.g., "images/icon_name.png")
	 * @returns The Blob, or null if not found
	 */
    public getBlob(key: string): Blob | null
    {
        const entry = this._manifest.entries[key];

        if(!entry) return null;

        const type = this.getMimeType(key);

        // Pass a Uint8Array view (no copy) rather than ArrayBuffer.slice() (a copy):
        // the Blob constructor copies the bytes into its own storage anyway, so the
        // extra slice() was a redundant second copy of every bundled asset.
        const bytes = new Uint8Array(this._data, this._dataOffset + entry.offset, entry.size);

        return new Blob([bytes], {type});
    }

    /**
	 * Gets a blob URL for a bundle entry (cached).
	 *
	 * The URL is created via URL.createObjectURL and cached for reuse.
	 * Call dispose() to revoke all created URLs.
	 *
	 * @param key - Entry key (e.g., "images/icon_name.png")
	 * @returns The blob URL string, or null if not found
	 */
    public getUrl(key: string): string | null
    {
        const cached = this._urlCache.get(key);

        if(cached) return cached;

        const blob = this.getBlob(key);

        if(!blob) return null;

        const url = URL.createObjectURL(blob);

        this._urlCache.set(key, url);

        return url;
    }

    /**
	 * Creates an ImageBitmap from a bundle image entry.
	 *
	 * @param key - Entry key (e.g., "images/habbo_blue_skin.png")
	 * @returns The decoded ImageBitmap, or null if not found
	 */
    public async getImageBitmap(key: string): Promise<ImageBitmap | null>
    {
        const blob = this.getBlob(key);

        if(!blob) return null;

        return createImageBitmap(blob);
    }

    /**
	 * Reads a text entry from the bundle.
	 *
	 * @param key - Entry key (e.g., "window-layouts/main_window.xml")
	 * @returns The decoded UTF-8 text, or null if not found
	 */
    public getText(key: string): string | null
    {
        const bytes = this.getBytes(key);

        if(!bytes) return null;

        return AssetBundle._decoder.decode(bytes);
    }

    /**
	 * Lists all entry keys that start with the given prefix.
	 *
	 * @param prefix - Key prefix to filter by (e.g., "images/", "window-skins/habbo_skin_")
	 * @returns Array of matching keys
	 */
    public listKeys(prefix?: string): string[]
    {
        const keys = Object.keys(this._manifest.entries);

        if(!prefix) return keys;

        return keys.filter(k => k.startsWith(prefix));
    }

    /**
	 * Infers a MIME type from the file extension.
	 */
    private getMimeType(key: string): string
    {
        if(key.endsWith('.png')) return 'image/png';
        if(key.endsWith('.json')) return 'application/json';
        if(key.endsWith('.xml')) return 'text/xml';
        if(key.endsWith('.txt')) return 'text/plain';
        if(key.endsWith('.ttf')) return 'font/ttf';
        if(key.endsWith('.otf')) return 'font/otf';
        if(key.endsWith('.woff')) return 'font/woff';
        if(key.endsWith('.woff2')) return 'font/woff2';

        return 'application/octet-stream';
    }

    /**
	 * Revokes all created blob URLs. The bundle buffer itself is left to the GC — every
	 * caller drops its `AssetBundle` reference right after disposing it.
	 */
    public dispose(): void
    {
        for(const url of this._urlCache.values())
        {
            URL.revokeObjectURL(url);
        }

        this._urlCache.clear();
    }
}
