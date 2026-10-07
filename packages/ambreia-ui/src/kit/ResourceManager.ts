import {Logger} from '@ambreia/common/utils/Logger';
import type {AssetUrlSource, IResourceManager} from '../IResourceManager';
import type {IAssetReceiver} from '../IAssetReceiver';
import type {IWindowManager} from './IWindowManager';

const log = Logger.getLogger('habbo.window.ResourceManager');

/**
 * Manages asset retrieval for the window system.
 *
 * Supports two registration modes:
 * 1. `registerAsset(name, bitmap)` — immediate: stores a decoded ImageBitmap
 * 2. `registerAssetUrl(name, url)` — lazy: stores a URL, decodes on first request
 *
 * When `retrieveAsset()` is called:
 * - If bitmap is cached → delivers immediately
 * - If a URL is registered → fetches, decodes, caches, then delivers
 * - Otherwise → queues the receiver for later delivery
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as
 */
export class ResourceManager implements IResourceManager 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::_windowManager
    private _windowManager: IWindowManager;
    /**
     * The decoded bitmaps, by resolved name.
     *
     * TS-only: AS3 keeps no such cache — it asks `_windowManager.assets` (the component's
     * `IAssetLibrary`) on every `retrieveAsset()`. This port has no per-component asset
     * library for images, so the cache lives here instead.
     */
    // TS-only: no AS3 counterpart; stands in for `_windowManager.assets` on the AS3 side.
    private _assets: Map<string, ImageBitmap> = new Map();

    // TS-only: no AS3 counterpart; AS3 hands the URL straight to
    // `assets.loadAssetFromFile()`, where this port defers the fetch to first request.
    private _assetUrls: Map<string, AssetUrlSource> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::_assetReceivers
    private _pendingReceivers: Map<string, IAssetReceiver[]> = new Map();

    // TS-only: no AS3 counterpart; AS3's in-flight state is the `AssetLoaderStruct` the
    // asset library hands back, which this port has no equivalent of.
    private _loading: Set<string> = new Set();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::ResourceManager()
    constructor(windowManager: IWindowManager) 
    {
        this._windowManager = windowManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::get disposed()
    public get disposed(): boolean 
    {
        return this._disposed;
    }

    // TS-only: no AS3 counterpart; the other half of `_assets` standing in for the
    // component asset library — AS3's equivalent is `assets.setAsset()`, reached through
    // `createAsset()` rather than exposed on the resource manager.
    public registerAsset(name: string, bitmap: ImageBitmap): void 
    {
        const resolvedName = this.resolveAssetName(name);

        this._assets.set(resolvedName, bitmap);
        this._assetUrls.delete(resolvedName);

        this.deliverToReceivers(resolvedName, bitmap);
    }

    // TS-only: no AS3 counterpart; registers a URL to be fetched on first request. AS3
    // never defers — `retrieveAsset()` calls `assets.loadAssetFromFile()` on the spot.
    public registerAssetUrl(name: string, url: AssetUrlSource): void
    {
        const resolvedName = this.resolveAssetName(name);

        if(this._assets.has(resolvedName)) return;

        this._assetUrls.set(resolvedName, url);

        if(this._pendingReceivers.has(resolvedName) && !this._loading.has(resolvedName)) 
        {
            this._loading.add(resolvedName);
            this.loadFromUrl(resolvedName, url);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::retrieveAsset()
    public retrieveAsset(uri: string, receiver: IAssetReceiver | null): void 
    {
        if(!uri) return;

        const resolvedName = this.resolveAssetName(uri);

        if(!resolvedName) return;

        const cached = this._assets.get(resolvedName);

        if(cached) 
        {
            receiver?.receiveAsset(cached, resolvedName);

            return;
        }

        let receivers = this._pendingReceivers.get(resolvedName);
        const isFirstRequest = !receivers;

        if(!receivers) 
        {
            receivers = [];
            this._pendingReceivers.set(resolvedName, receivers);
        }

        // A null receiver is a prefetch: AS3 guards only the *notification* on
        // `param2 != null` (ResourceManager.as l.71, l.87) and starts the load either way.
        // This port used to reject the whole call, which made every prefetch a silent
        // no-op - `TwinkleImages` warms its six frames exactly this way.
        if(receiver !== null)
        {
            receivers.push(receiver);
        }

        const url = this._assetUrls.get(resolvedName);

        if(url && !this._loading.has(resolvedName)) 
        {
            this._loading.add(resolvedName);
            this.loadFromUrl(resolvedName, url);

            return;
        }

        // AS3 ResourceManager.retrieveAsset (l.57-61): when the asset is not a
        // known bundle asset and the resolved name is itself a fetchable URL
        // (http/https), load it directly from that URL. Without this, URL-based
        // assetUri (e.g. room thumbnails) stay queued forever and never render.
        if(!url && this.isFetchableUrl(resolvedName)) 
        {
            if(!this._loading.has(resolvedName)) 
            {
                this._loading.add(resolvedName);
                this.loadFromUrl(resolvedName, resolvedName);
            }

            return;
        }

        // TS-only diagnostic: nothing above can ever resolve this name (no cached
        // bitmap, no registered asset URL, not itself a fetchable URL) - the receiver
        // stays queued forever and the image silently never renders, unlike
        // HabboWindowManager's "Widget layout not found" warning for a missing layout.
        // Warn once per name (guarded by isFirstRequest) so a missing image is just as
        // visible in the console as a missing layout already is.
        if(!url && isFirstRequest) 
        {
            log.warn(`Asset not found: ${resolvedName}`);
        }
    }

    // TS-only: probe whether a name can ever resolve, without requesting it.
    //
    // Stands in for AS3's `assets.getAssetByName(name) != null` pre-check on the window
    // manager's asset library: the port has no such library for images, they live here as
    // a decoded bitmap or a registered URL. Same intent - answer "is this asset known"
    // without queueing a receiver or logging a miss.
    public hasAsset(name: string): boolean
    {
        const resolvedName = this.resolveAssetName(name);

        return this._assets.has(resolvedName) || this._assetUrls.has(resolvedName);
    }

    // TS-only: see `IResourceManager.getAsset()` for why a synchronous read exists alongside the
    // receiver-based `retrieveAsset()`.
    public getAsset(name: string): ImageBitmap | null
    {
        return this._assets.get(name) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::isSameAsset()
    public isSameAsset(uri1: string, uri2: string): boolean 
    {
        return this.resolveAssetName(uri1) === this.resolveAssetName(uri2);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::createAsset()
    public createAsset(name: string, _assetClass: new (...args: unknown[]) => unknown, content: unknown): void 
    {
        if(content instanceof ImageBitmap) 
        {
            this.registerAsset(name, content);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::removeAsset()
    public removeAsset(name: string): void 
    {
        const resolvedName = this.resolveAssetName(name);

        this._assets.delete(resolvedName);
        this._assetUrls.delete(resolvedName);
        this._pendingReceivers.delete(resolvedName);
        this._loading.delete(resolvedName);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;
        this._assets.clear();
        this._assetUrls.clear();
        this._pendingReceivers.clear();
        this._loading.clear();
    }

    /**
     * AS3 writes this test inline in `retrieveAsset()` and accepts only `http://` and
     * `https://`. The leading-slash arm is this port's own: its assets are served from the
     * same origin by root-relative path, which Flash never had to express.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::retrieveAsset() inline URL test
    private isFetchableUrl(name: string): boolean 
    {
        return name.startsWith('http://') || name.startsWith('https://') || (name.length > 1 && name.startsWith('/'));
    }

    /**
     * 🐛 The `_png` fallback is not AS3's, and it is here because AS3 does not need it. Flash asks
     * for `<name>_png` because that is the *field name* in the component's `*Com.as`; this port
     * registers images under the bare file basename, so every `assetUri = '..._png'` call site was
     * asking for a name nothing had registered — `WiredErrorInfoView`'s type icon, `Projectile`'s
     * directional-system image and the wired notification icons all resolved to the missing-image
     * placeholder, each with one console warning nobody was reading.
     *
     * Fixed here rather than at the call sites because this is the one place every `assetUri` and
     * every `retrieveAsset()` routes through. The as-given name is still tried **first**, so the
     * assets that really did ship with `_png` in their basename
     * (`icon_wired_variable_context_large_png.png` is one) keep resolving; only a name that would
     * otherwise miss falls back.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::resolveAssetName()
    private resolveAssetName(uri: string): string
    {
        const interpolatingManager = this._windowManager as unknown as {
            interpolate?: (value: string) => string
        };
        const interpolated = interpolatingManager.interpolate?.(uri) ?? uri;

        if(this._assets.has(interpolated) || this._assetUrls.has(interpolated)) return interpolated;

        if(interpolated.endsWith('_png'))
        {
            const stripped = interpolated.slice(0, -4);

            if(this._assets.has(stripped) || this._assetUrls.has(stripped)) return stripped;
        }

        return interpolated;
    }

    /**
     * AS3 splits this across two members: `retrieveAsset()` starts the load through
     * `assets.loadAssetFromFile()` and subscribes `passAssetToCallback` to
     * `AssetLoaderEventComplete`. `fetch()` returns a promise rather than an event target,
     * so the start and the completion arm live together here.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::passAssetToCallback()
    private loadFromUrl(name: string, url: AssetUrlSource): void
    {
        // A thunk that yields nothing means the name was registered but its source cannot
        // produce a URL after all; take the same arm as a failed fetch below, which clears
        // `_loading` and hands receivers the missing-image placeholder.
        const resolved = typeof url === 'function' ? url() : url;

        (resolved ? fetch(resolved) : Promise.reject(new Error(`No URL for asset "${name}"`)))
            .then(response => response.blob())
            .then(blob => createImageBitmap(blob))
            .then(bitmap => 
            {
                if(this._disposed) return;

                this._loading.delete(name);
                this._assetUrls.delete(name);
                this._assets.set(name, bitmap);

                this.deliverToReceivers(name, bitmap);
            })
            .catch(() => 
            {
                this._loading.delete(name);

                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as
                // ::retrieveAsset() catch block - on a failed load, deliver the
                // "missing_image_icon" placeholder instead of leaving receivers queued
                // forever with nothing ever shown.
                const missing = this._assets.get('missing_image_icon');

                if(missing) 
                {
                    this.deliverToReceivers(name, missing);
                }
                else 
                {
                    log.warn(`Failed to load asset "${name}" and no "missing_image_icon" fallback is registered`);
                }
            });
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/ResourceManager.as::passAssetToCallback() delivery loop
    private deliverToReceivers(name: string, bitmap: ImageBitmap): void 
    {
        const receivers = this._pendingReceivers.get(name);

        if(!receivers) return;

        this._pendingReceivers.delete(name);

        for(const receiver of receivers) 
        {
            if(!receiver.disposed) 
            {
                try 
                {
                    receiver.receiveAsset(bitmap, name);
                }
                catch (e: unknown) 
                {
                    log.warn(`Error delivering asset "${name}" to receiver:`, e);
                }
            }
        }
    }
}
