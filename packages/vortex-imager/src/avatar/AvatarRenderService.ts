/**
 * Boots the client's avatar pipeline headlessly and renders single frames out of it.
 *
 * There is no second renderer here. `AvatarRenderManager`, `AvatarStructure`, `AvatarImage`
 * and their 120-odd collaborators are the engine's own classes, running unmodified — the only
 * things replaced are the browser APIs underneath them (see `shim/`). That is the whole point:
 * an imager that reimplements the compositing rules drifts from the client the first time
 * either side is touched, and the drift shows up as avatars that look subtly wrong in the
 * profile but right in the room.
 *
 * The boot mirrors `VortexMain.prepareCore()`, minus everything that is not avatars: an asset
 * library, the real configuration manager (pointed at the hotel's own `external_variables`),
 * and the render manager. No socket, no window system, no ticker.
 */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {Core} from '@ambreia/kernel/Core';
import type {CoreComponentContext} from '@ambreia/kernel/runtime/CoreComponentContext';
import {AssetLibrary} from '@ambreia/game/core/assets/index';
import {Logger} from '@ambreia/common/utils/Logger';
import {ContentUnavailableError} from '../room/FurnitureRequest';
import {openAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';
import type {IAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';
import {IID_Core} from '@ambreia/kernel/iid/IIDCore';
import {IID_AssetLibrary} from '@ambreia/kernel/iid/IIDAssetLibrary';
import {IID_HabboConfigurationManager} from '@ambreia/game/iid/IIDHabboConfigurationManager';
import {IID_AvatarRenderManager} from '@ambreia/game/iid/IIDAvatarRenderManager';
import {HabboConfigurationManager} from '@ambreia/game/configuration/HabboConfigurationManager';
import {LEGACY_DEFAULTS} from '@ambreia/game/configuration/legacyDefaults';
import {AvatarRenderManager} from '@ambreia/avatar/AvatarRenderManager';
import {readAvatarData, type IAvatarData} from '@ambreia/avatar/AvatarData';
import {AvatarRenderEvent} from '@ambreia/avatar/enum/AvatarRenderEvent';
import {AvatarSetType} from '@ambreia/avatar/enum/AvatarSetType';
import {AvatarAction} from '@ambreia/avatar/enum/AvatarAction';
import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IAvatarEffectListener} from '@ambreia/avatar/IAvatarEffectListener';
import type {IImagerConfig} from '../config';
import type {IAvatarRequest} from './AvatarRequest';
import {AvatarRequestError} from './AvatarRequest';
import type {Texture as ShimTexture} from '../shim/pixi';

/**
 * The one member of `AvatarImageCache` that {@link AvatarRenderService} needs, and the shape of
 * what it returns. Declared here rather than imported because the cache is `protected` on
 * `AvatarImage` with no public equivalent, so it is reached through a cast either way — see
 * `renderHandItem()`.
 */
interface IBodyPartCache
{
    getImageContainer(
        bodyPartId: string,
        frameIndex: number,
        forceUpdate?: boolean,
        wantImage?: boolean
    ): { image: { frame: { width: number; height: number } } | null } | null;
}

import {canvasToPng, textureToPng} from '../render/encode';
import {composeAvatarWithSprites} from '../render/composeAvatar';

const log = Logger.getLogger('imager.avatar.AvatarRenderService');

/** How long boot waits for the mandatory libraries and the figure map. */
const READY_TIMEOUT_MS = 120_000;

/** How long a single request waits for its figure's part libraries to download. */
const FIGURE_TIMEOUT_MS = 30_000;

/** How long a single request waits for an effect library. */
const EFFECT_TIMEOUT_MS = 15_000;

export class AvatarRenderService
{
    private _config: IImagerConfig;
    private _renderManager: AvatarRenderManager | null = null;
    private _configuration: HabboConfigurationManager | null = null;
    private _context: CoreComponentContext | null = null;
    private _assets: AssetLibrary | null = null;
    private _assetDirectories: IAssetDirectories | null = null;

    /** Effect ids whose library has arrived, or whose download has already been waited out. */
    private _settledEffects: Set<number> = new Set();

    private constructor(config: IImagerConfig)
    {
        this._config = config;
    }

    static async boot(config: IImagerConfig): Promise<AvatarRenderService>
    {
        const service = new AvatarRenderService(config);

        await service.initialize();

        return service;
    }

    /**
	 * Renders one avatar frame to a PNG.
	 *
	 * The sequence is the client's: get the figure's libraries down, build the image, point it,
	 * apply the actions, then ask for the composite. Actions must be bracketed by
	 * `initActionAppends()` / `endActionAppends()` — that pair is what re-resolves the action
	 * set and picks the winning posture by precedence.
	 */
    async render(request: IAvatarRequest): Promise<Buffer>
    {
        const renderManager = this.requireRenderManager();

        await this.ensureFigureReady(request.figure);

        let effectResolve: (() => void) | null = null;
        const effectReady = new Promise<void>((resolve) =>
        {
            effectResolve = resolve;
        });

        const effectListener: IAvatarEffectListener = {
            disposed: false,
            avatarEffectReady: (): void => effectResolve?.()
        };

        const avatarImage = renderManager.createAvatarImage(
            request.figure,
            request.scale,
            request.gender,
            null,
            effectListener
        );

        if(avatarImage === null)
        {
            throw new Error('Avatar render manager is not ready');
        }

        try
        {
            this.applyRequest(avatarImage, request);

            // An effect's own library is only requested when `endActionAppends()` sees the
            // action, so the first composite would come back without it. `forceActionUpdate()`
            // re-resolves the action set once the library is in.
            if(request.effectId > 0 && !this.isEffectSettled(request.effectId))
            {
                // Not rendered without it: the image would be cached, in memory and on disk, under
                // the key of the image *with* the effect, and served as it for the rest of time.
                // A 503 with Retry-After says "not yet" and nothing is stored.
                await withTimeout(effectReady, EFFECT_TIMEOUT_MS).catch(() =>
                {
                    throw new ContentUnavailableError(`Effect ${request.effectId} did not load within ${EFFECT_TIMEOUT_MS} ms`);
                });

                this._settledEffects.add(request.effectId);

                avatarImage.forceActionUpdate();

                if(request.frame > 0) avatarImage.updateAnimationByFrames(request.frame);
            }

            const setType = request.headOnly ? AvatarSetType.HEAD : AvatarSetType.FULL;

            // Compositing stays at 1x — see `render/encode.ts` for why the zoom is applied there.
            const texture = request.cropped
                ? avatarImage.getCroppedImage(setType)
                : avatarImage.getImage(setType, false);

            if(!texture)
            {
                throw new Error(`Nothing rendered for figure "${request.figure}"`);
            }

            // A figure naming a part this hotel does not have draws nothing, and nothing is a
            // 200 with a transparent image — the silent failure the `/clothing/` route exists to
            // avoid, since a caller walking figuredata hits it constantly. `getCroppedImage()`
            // falls back to `{x: 0, y: 0, width: 1, height: 1}` when no part ever set its bounds,
            // so a 1x1 crop *is* the engine saying it drew nothing. Only meaningful when cropped:
            // uncropped, an empty avatar is a full-size empty canvas and indistinguishable here.
            if(request.part === 'clothing' && request.cropped && texture.frame.width <= 1 && texture.frame.height <= 1)
            {
                throw new AvatarRequestError(`Nothing to draw for "${request.figure}" — no such part, or no art at this direction`);
            }

            // After the full composite, never before: each body part's cache only holds an action
            // once the avatar has been rendered once, and `getImageContainer()` returns null
            // without one. Compositing the whole figure to throw it away is the price of getting
            // one part out of it.
            if(request.part === 'hand') return await this.renderHandItem(avatarImage, request);

            // Effect sprites only make sense around a whole avatar; a head crop has nothing to
            // hang them on, so those requests keep the body composite untouched.
            const composite = request.headOnly || request.cropped
                ? null
                : composeAvatarWithSprites(avatarImage, texture, request.part !== 'effect');

            if(request.part === 'effect' && composite === null)
            {
                // Not a failure to render — a statement about the effect. Most effects are an
                // animation the avatar performs and add no sprites of their own, so there is
                // genuinely nothing to show without the figure.
                throw new AvatarRequestError(
                    `Effect ${request.effectId} has no sprites of its own — it only animates the avatar`
                );
            }

            return composite === null
                ? await textureToPng(texture as unknown as ShimTexture, request.zoom)
                : await canvasToPng(composite, request.zoom);
        }
        finally
        {
            effectListener.disposed = true;
            avatarImage.dispose();
        }
    }

    /**
	 * Renders the object in the avatar's hand, without the avatar.
	 *
	 * A handitem is not a sprite hung off the figure the way an effect's are — it is a *body
	 * part* of it, `rightitem` or `leftitem`, composited with the rest by `AvatarImageCache`.
	 * There is no avatar set that contains only it (the geometry defines exactly three: `full`,
	 * `head`, `body`), so `getImage()` cannot be asked for it and the part cache has to be read
	 * directly.
	 *
	 * Resolved by asset name through the public `getAsset()`, the same way `composeAvatar.ts`
	 * reaches for it through a cast. The alternative would be an engine change to expose a
	 * member the client itself never needs, which is a worse trade than one narrow cast in the
	 * service that does need it.
	 */
    private async renderHandItem(avatarImage: IAvatarImage, request: IAvatarRequest): Promise<Buffer>
    {
        const id = request.actions
            .filter((action) => action.type === AvatarAction.CARRY_OBJECT || action.type === AvatarAction.USE_OBJECT)
            .map((action) => action.param)
            .find((param) => param !== null && param !== '0') ?? null;

        if(id === null)
        {
            throw new AvatarRequestError('No hand item requested — pass `crr=<id>` or `drk=<id>`');
        }

        // Through the part cache, not by building the asset name by hand. Both are reachable,
        // and the shortcut is wrong: the carry animation's layer data remaps the item's
        // direction and frame, so `h_crr_ri_<id>_<direction>_0` resolves to a real sprite that
        // is simply not the one the avatar is holding — id 2 at direction 2 came back an orange
        // torch where the figure shows a blue can. `getImageContainer()` applies that remapping,
        // which is the whole reason it exists.
        //
        // `forceUpdate` must stay false: true resets the direction cache and the container comes
        // back null.
        const cache = (avatarImage as unknown as { _cache: IBodyPartCache | null })._cache;
        const texture = cache?.getImageContainer('rightitem', request.frame, false, true)?.image ?? null;

        if(texture === null || texture.frame.width < 1 || texture.frame.height < 1)
        {
            throw new AvatarRequestError(`No art for hand item ${id} at direction ${request.direction}`);
        }

        return textureToPng(texture as unknown as ShimTexture, request.zoom);
    }

    /**
	 * Reads a resolved hotel property. The badge renderer needs
	 * `image.library.badgepart.url` from the same properties the avatars come from,
	 * so it goes through the configuration manager this service already owns rather than
	 * getting its own copy of the hotel config.
	 */
    getProperty(key: string): string
    {
        return this._configuration?.getProperty(key) ?? '';
    }

    /**
	 * The booted core, for a second pipeline to hang off.
	 *
	 * `RoomStack` takes these three rather than building its own: the DI container, the asset
	 * library and the configuration manager are the same ones, and a second
	 * `HabboConfigurationManager` would mean two copies of the properties free to disagree. Null until {@link boot}
	 * resolves.
	 */
    get context(): CoreComponentContext | null
    {
        return this._context;
    }

    get assetLibrary(): AssetLibrary | null
    {
        return this._assets;
    }

    get configuration(): HabboConfigurationManager | null
    {
        return this._configuration;
    }

    /** The families' .ambreia directories, opened at boot from the client's config.json; null before. */
    get assetDirectories(): IAssetDirectories | null
    {
        return this._assetDirectories;
    }

    async dispose(): Promise<void>
    {
        this._renderManager?.dispose();
        this._renderManager = null;

        Core.dispose();
    }

    /**
	 * Applies direction, posture, gestures and effects to a freshly built image.
	 *
	 * The order is not arbitrary. The body direction goes first because
	 * `appendAction(POSTURE, 'lay')` turns the avatar itself — a lying avatar only exists at
	 * directions 2 and 4 — and it reads `_mainDirection` to decide which. Head direction goes
	 * last because `setDirection(FULL, …)` turns the head with the body, so a distinct
	 * `head_direction` only survives if it is applied afterwards.
	 */
    private applyRequest(avatarImage: IAvatarImage, request: IAvatarRequest): void
    {
        avatarImage.setDirection(AvatarSetType.FULL, request.direction);

        avatarImage.initActionAppends();
        avatarImage.appendAction(AvatarAction.POSTURE, request.posture);

        for(const action of request.actions)
        {
            if(action.param === null) avatarImage.appendAction(action.type);
            else avatarImage.appendAction(action.type, action.param);
        }

        avatarImage.endActionAppends();

        avatarImage.setDirection(AvatarSetType.HEAD, request.headDirection);

        if(request.frame > 0) avatarImage.updateAnimationByFrames(request.frame);
    }

    /**
	 * Whether rendering can proceed without waiting for effect `effectId`.
	 *
	 * There is no readiness check to call: `AvatarRenderManager` exposes `isFigureReady()` but
	 * has no effect equivalent (neither does AS3's `_SafeCls_582`), and `effectMap` lists every
	 * effect the hotel *declares*, not the ones downloaded — reading it as readiness is what
	 * made effects render as a plain standing avatar. So readiness is tracked here instead:
	 * an id is settled once its library has arrived, or once waiting for it has already timed
	 * out, or if the hotel never declared it at all.
	 */
    private isEffectSettled(effectId: number): boolean
    {
        if(this._settledEffects.has(effectId)) return true;

        return !this.requireRenderManager().effectMap.has(String(effectId));
    }

    /**
	 * Blocks until every part library the figure needs is downloaded.
	 *
	 * In the client this is fire-and-forget — a placeholder avatar shows while the parts
	 * arrive, then `avatarImageReady()` redraws. A single HTTP response has nowhere to put a
	 * placeholder, so the request waits instead.
	 */
    private async ensureFigureReady(figure: string): Promise<void>
    {
        const renderManager = this.requireRenderManager();
        const container = renderManager.createFigureContainer(figure);

        if(renderManager.isFigureReady(container)) return;

        await withTimeout(new Promise<void>((resolve) =>
        {
            const listener: IAvatarImageListener = {
                disposed: false,
                avatarImageReady: (): void =>
                {
                    listener.disposed = true;
                    resolve();
                }
            };

            renderManager.downloadFigure(container, listener);
        }), FIGURE_TIMEOUT_MS).catch(() =>
        {
            // Transient like a furniture library that is not in yet: 503 + Retry-After, not a 500.
            throw new ContentUnavailableError(`The figure's libraries did not load within ${FIGURE_TIMEOUT_MS} ms`);
        });
    }

    private requireRenderManager(): AvatarRenderManager
    {
        if(this._renderManager === null)
        {
            throw new Error('AvatarRenderService has not finished booting');
        }

        return this._renderManager;
    }

    private async initialize(): Promise<void>
    {
        const context = Core.instantiate() as CoreComponentContext;

        context.registerInterface(IID_Core, context);

        const assets = new AssetLibrary();

        this._context = context;
        this._assets = assets;

        context.attachInstance(IID_AssetLibrary, assets);

        context.initialize();

        const configuration = this.createConfiguration(context);

        this._configuration = configuration;

        // `${url.prefix}` is the asset host here (createConfiguration), as in the client.
        const directories = openAssetDirectories(this._config.assetPacks, text => configuration.interpolate(text));

        this._assetDirectories = directories;
        log.debug(`Avatar libraries: ${directories.clothing.url}, effects: ${directories.effects.url}`);

        const renderManager = new AvatarRenderManager({
            assets,
            data: this.readAvatarData(),
            clothing: directories.clothing,
            effects: directories.effects
        });

        context.attachInstance(IID_AvatarRenderManager, renderManager);

        const ready = new Promise<void>((resolve) =>
        {
            if(renderManager.isReady)
            {
                resolve();

                return;
            }

            renderManager.events.once(AvatarRenderEvent.AVATAR_RENDER_READY, () => resolve());
        });

        // An unreachable asset host (DNS, connection refused) used to be a 120 s wait: the directory
        // reader forgets a failed fetch so the next read tries again, and nothing in the ready wait
        // ever learns of it. Reading a piece that cannot exist settles the question at once: null
        // (the directory is fine, the piece is not there) or the network error, with the URL.
        const probe = directories.clothing.read('__ambreia_probe__').then(
            () => new Promise<never>(() => undefined),
            (error: unknown) =>
            {
                throw new Error(`${directories.clothing.url} cannot be read: ${String((error as Error | null)?.message ?? error)}`);
            }
        );

        await withTimeout(Promise.race([ready, probe]), READY_TIMEOUT_MS);

        this._renderManager = renderManager;

        log.info('Avatar pipeline ready');
    }

    /**
	 * The client's own starting properties (legacy.defaults.json), with `url.prefix` at the asset
	 * host: the imager is told where to read, and every `${url.prefix}` resolves through it.
	 */
    private createConfiguration(context: CoreComponentContext): HabboConfigurationManager
    {
        const configuration = new HabboConfigurationManager(context);

        context.attachComponent(configuration, [IID_HabboConfigurationManager]);
        configuration.load({...LEGACY_DEFAULTS, 'url.prefix': this._config.assetsBaseUrl});

        return configuration;
    }

    /** The client's Ambreia*.xml files, read from the same folder as the client bundles them. */
    private readAvatarData(): IAvatarData
    {
        return readAvatarData(file =>
        {
            try
            {
                return readFileSync(join(this._config.avatarConfigDir, file), 'utf8');
            }
            catch
            {
                return null;
            }
        });
    }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>
{
    return new Promise<T>((resolve, reject) =>
    {
        const timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);

        promise.then(
            (value) =>
            {
                clearTimeout(timer);
                resolve(value);
            },
            (error) =>
            {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}
