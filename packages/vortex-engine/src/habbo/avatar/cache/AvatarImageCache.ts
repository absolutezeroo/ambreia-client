import {Texture} from 'pixi.js';
import {
    AVATAR_COUNTER_CACHED,
    AVATAR_COUNTER_COMPOSE,
    AVATAR_COUNTER_LOOKUP,
    AVATAR_COUNTER_NULL,
    AVATAR_COUNTER_UNCACHEABLE,
    FRAME_CHANNEL_AVATAR_COMPOSE,
    FrameTimings
} from '@core/utils/FrameTimings';
import type {AvatarStructure} from '../AvatarStructure';
import type {AssetAliasCollection} from '../alias/AssetAliasCollection';
import type {IAvatarImage} from '../IAvatarImage';
import type {IActiveActionData} from '../actions/IActiveActionData';
import type {AvatarImagePartContainer} from '../AvatarImagePartContainer';
import type {AvatarCanvas} from '../structure/AvatarCanvas';
import type {IAvatarPartSprite} from '../AvatarPartSprite';
import {AvatarRenderMode} from '../AvatarRenderMode';
import {AvatarDirectionAngle} from '../enum/AvatarDirectionAngle';
import {AvatarScaleType} from '../enum/AvatarScaleType';
import {AvatarImageBodyPartCache} from './AvatarImageBodyPartCache';
import {AvatarImageActionCache} from './AvatarImageActionCache';
import {AvatarImageDirectionCache} from './AvatarImageDirectionCache';
import {AvatarImageBodyPartContainer} from '../AvatarImageBodyPartContainer';
import type {IColorTransformData} from './ImageData';
import {ImageData} from './ImageData';
import {RoomObjectSpriteData} from '@room/data/RoomObjectSpriteData';

/**
 * Main cache manager for avatar image rendering.
 * Manages a hierarchical cache: bodyPart -> action -> direction -> frame.
 *
 * The rendering pipeline composites individual part sprites into body-part
 * containers, using direction-aware flipping and color transforms.
 *
 * @see sources/win63_version/habbo/avatar/cache/AvatarImageCache.as
 */
export class AvatarImageCache
{
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::DEFAULT_MAX_CACHE_STORAGE_TIME_MS
    public static readonly DEFAULT_MAX_CACHE_STORAGE_TIME_MS: number = 60000;

    private static readonly UNDERSCORE: string = '_';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::DEF_SEPARATOR
    private static readonly DEF_SEPARATOR: string = '.';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::BASE_ACTION
    private static readonly BASE_ACTION: string = 'std';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::LAY_BASE_ACTION
    private static readonly LAY_BASE_ACTION: string = 'lay';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::PART_FACE
    private static readonly PART_FACE: string = 'fc';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::PART_EYES
    private static readonly PART_EYES: string = 'ey';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::PART_RIGHT_ITEM
    private static readonly PART_RIGHT_ITEM: string = 'ri';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::ACTION_WAVE
    private static readonly ACTION_WAVE: string = 'wav';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::ACTION_DRINK
    private static readonly ACTION_DRINK: string = 'drk';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::ACTION_BLOW
    private static readonly ACTION_BLOW: string = 'blw';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::ACTION_SIGN
    private static readonly ACTION_SIGN: string = 'sig';
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::ACTION_RESPECT
    private static readonly ACTION_RESPECT: string = 'respect';

    private _structure: AvatarStructure;
    private _avatar: IAvatarImage;
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::_assets
    private _assets: AssetAliasCollection;
    private _scale: string;
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::_cache
    private _cache: Map<string, AvatarImageBodyPartCache>;
    private _canvas: AvatarCanvas | null;
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::_disposed
    private _disposed: boolean;

    /**
     * Shared scratch surface for colour-transformed part draws. See `acquireScratch()`.
     *
     * Static rather than per-instance: every avatar in the room composes through this same code
     * path, one part at a time on one thread, so a per-instance surface would be sixty idle
     * canvases where one is enough.
     */
    // TS-only: see `acquireScratch()`.
    private static readonly SCRATCH: Map<string, { canvas: OffscreenCanvas; context: OffscreenCanvasRenderingContext2D }> = new Map();

    /** Colour-transformed frames, per source bitmap. See `getTransformMemo()`. */
    // TS-only: see `getTransformMemo()`.
    private static readonly TRANSFORM_MEMO: WeakMap<CanvasImageSource, Map<string, OffscreenCanvas>> = new WeakMap();

    /** The no-op colour transform, so a flipped part with no tint can still use the memo path. */
    // TS-only: see `getTransformMemo()`.
    private static readonly IDENTITY_COLOR_TRANSFORM: IColorTransformData = {
        redMultiplier: 1,
        greenMultiplier: 1,
        blueMultiplier: 1,
        alphaMultiplier: 1
    };

    /** Entries kept per source bitmap before the memo for that source is dropped wholesale. */
    // TS-only: see `getTransformMemo()`.
    private static readonly TRANSFORM_MEMO_LIMIT: number = 512;
    private _geometryType: string;
    private _defaultActionAssetPartDefinition: string;
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::_unionImages
    private _unionImages: ImageData[];
    /** The rendering mode this cache's containers were built under. */
    // TS-only: see `AvatarRenderMode.generation`.
    private _renderGeneration: number = AvatarRenderMode.generation;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::_serverRenderData
    private _serverRenderData: RoomObjectSpriteData[];
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::_largeScaledSmall
    private _largeScaledSmall: boolean;

    constructor(
        structure: AvatarStructure,
        avatar: IAvatarImage,
        assets: AssetAliasCollection,
        scale: string,
        largeScaledSmall: boolean = false
    )
    {
        this._structure = structure;
        this._avatar = avatar;
        this._assets = assets;
        this._scale = scale;
        this._largeScaledSmall = largeScaledSmall;
        this._cache = new Map();
        this._canvas = null;
        this._disposed = false;
        this._geometryType = '';
        this._defaultActionAssetPartDefinition = AvatarImageCache.BASE_ACTION;
        this._unionImages = [];
        this._serverRenderData = [];
    }

    /**
	 * Sets the direction for all body parts in the given set type.
	 *
	 * @param setType - The body part set identifier (e.g. 'full', 'head')
	 * @param direction - The avatar direction (0-7)
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::setDirection()
    public setDirection(setType: string, direction: number): void
    {
        const bodyPartIds = this._structure.getBodyPartsUnordered(setType);

        for(const bodyPartId of bodyPartIds)
        {
            const cache = this.getBodyPartCache(bodyPartId);

            if(cache) cache.setDirection(direction);
        }
    }

    /**
	 * Sets the action for all active body parts of the given action.
	 *
	 * @param action - The active action data
	 * @param frameCount - The current frame count
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::setAction()
    public setAction(action: IActiveActionData, frameCount: number): void
    {
        const bodyPartIds = this._structure.getActiveBodyPartIds(action, this._avatar);

        for(const bodyPartId of bodyPartIds)
        {
            const cache = this.getBodyPartCache(bodyPartId);

            if(cache) cache.setAction(action, frameCount);
        }
    }

    /**
	 * Sets the geometry type (vertical, sitting, lay, etc.).
	 * Clears caches only when the transition requires it.
	 *
	 * @param geometryType - The geometry type string
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::setGeometryType()
    public setGeometryType(geometryType: string): void
    {
        if(this._geometryType === geometryType) return;

        if((this._geometryType === 'sitting' && geometryType === 'vertical') ||
			(this._geometryType === 'vertical' && geometryType === 'sitting') ||
			(this._geometryType === 'swhorizontal' || geometryType === 'swhorizontal'))
        {
            this._geometryType = geometryType;
            this._defaultActionAssetPartDefinition = this.getDefaultActionFromGeometryType(this._geometryType);
            this._canvas = null;

            return;
        }

        this.disposeInactiveActions(0);
        this._geometryType = geometryType;
        this._defaultActionAssetPartDefinition = this.getDefaultActionFromGeometryType(this._geometryType);
        this._canvas = null;
    }

    /**
	 * Disposes action caches that have been idle longer than the threshold.
	 *
	 * @param maxIdleTime - Maximum idle time in ms before eviction
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::disposeInactiveActions()
    public disposeInactiveActions(maxIdleTime: number = AvatarImageCache.DEFAULT_MAX_CACHE_STORAGE_TIME_MS): void
    {
        const now = Date.now();

        for(const cache of this._cache.values())
        {
            if(cache) cache.disposeActions(maxIdleTime, now);
        }
    }

    /**
	 * Resets all body part caches to the given action.
	 *
	 * @param action - The action to reset to
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::resetBodyPartCache()
    public resetBodyPartCache(action: IActiveActionData): void
    {
        for(const cache of this._cache.values())
        {
            if(cache) cache.setAction(action, 0);
        }
    }

    /**
	 * Core method: gets or creates a cached body part image container.
	 *
	 * Handles animation layer data overrides for direction, frame index,
	 * and action, then delegates to the hierarchical cache or renders if needed.
	 *
	 * @param bodyPartId - The body part identifier
	 * @param frameIndex - The current animation frame index
	 * @param forceUpdate - If true, bypasses cache and forces re-render
	 * @returns The body part container, or null if rendering fails
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::getImageContainer()
    public getImageContainer(
        bodyPartId: string,
        frameIndex: number,
        forceUpdate: boolean = false,
        wantImage: boolean = false
    ): AvatarImageBodyPartContainer | null
    {
        // Containers built under the other rendering mode hold the half this one does not read; see
        // `AvatarRenderMode.generation`. Checking here rather than on a reset call means an avatar
        // heals itself the first time it is looked at, whether or not anything knew it existed.
        if(this._renderGeneration !== AvatarRenderMode.generation)
        {
            this._renderGeneration = AvatarRenderMode.generation;

            for(const cache of this._cache.values())
            {
                if(cache) cache.dispose();
            }

            this._cache.clear();
        }

        let bodyPartCache = this.getBodyPartCache(bodyPartId);

        if(!bodyPartCache)
        {
            bodyPartCache = new AvatarImageBodyPartCache();
            this._cache.set(bodyPartId, bodyPartCache);
        }

        let direction = bodyPartCache.getDirection();
        let adjustedFrameIndex = frameIndex;

        const action = bodyPartCache.getAction();

        if(!action) return null;

        if(action.definition.startFromFrameZero)
        {
            adjustedFrameIndex -= action.startFrame;
        }

        let cacheAction: IActiveActionData = action;
        let renderAction: IActiveActionData = action;
        const removeData: string[] = [];
        let effectParts: Map<string, string> = new Map();
        const animationOffset = {x: 0, y: 0};

        if(action && action.definition)
        {
            if(action.definition.isAnimation)
            {
                let animDirection: number;
                const animation = this._structure.getAnimation(
                    action.definition.state + AvatarImageCache.DEF_SEPARATOR + action.actionParameter
                );
                const animFrameIndex = frameIndex - action.startFrame;

                if(animation)
                {
                    const layerData = animation.getLayerData(animFrameIndex, bodyPartId, action.overridingAction);

                    if(layerData)
                    {
                        animDirection = direction + layerData.directionOffset;

                        if(layerData.directionOffset < 0)
                        {
                            if(animDirection < 0)
                            {
                                animDirection = 8 + animDirection;
                            }
                            else if(animDirection > 7)
                            {
                                animDirection = 8 - animDirection;
                            }
                        }
                        else
                        {
                            if(animDirection < 0)
                            {
                                animDirection += 8;
                            }
                            else if(animDirection > 7)
                            {
                                animDirection -= 8;
                            }
                        }

                        if(this._scale === AvatarScaleType.LARGE)
                        {
                            animationOffset.x = layerData.dx;
                            animationOffset.y = layerData.dy;
                        }
                        else
                        {
                            animationOffset.x = layerData.dx / 2;
                            animationOffset.y = layerData.dy / 2;
                        }

                        adjustedFrameIndex = layerData.animationFrame;

                        if(layerData.action)
                        {
                            renderAction = layerData.action;
                        }

                        if(layerData.type === 'bodypart')
                        {
                            if(layerData.action)
                            {
                                cacheAction = layerData.action;
                            }

                            direction = animDirection;
                        }
                        else if(layerData.type === 'fx')
                        {
                            direction = animDirection;
                        }

                        effectParts = layerData.items;
                    }

                    const animRemoveData = animation.removeData;

                    if(animRemoveData)
                    {
                        for(const item of animRemoveData)
                        {
                            removeData.push(item);
                        }
                    }
                }
            }
        }

        let actionCache = bodyPartCache.getActionCache(cacheAction);

        if(!actionCache || forceUpdate)
        {
            actionCache = new AvatarImageActionCache();
            bodyPartCache.updateActionCache(cacheAction, actionCache);
        }

        let directionCache = actionCache.getDirectionCache(direction);

        if(!directionCache || forceUpdate)
        {
            const partList = this._structure.getParts(
                bodyPartId,
                this._avatar.getFigure(),
                cacheAction,
                this._geometryType,
                direction,
                removeData,
                this._avatar,
                effectParts
            );

            if(!partList) return null;

            directionCache = new AvatarImageDirectionCache(partList);
            actionCache.updateDirectionCache(direction, directionCache);
        }

        let container = directionCache.getImageContainer(adjustedFrameIndex);

        // Instrumentation for the `:stresstest` frame budget. `room.obj` — the room loop's
        // visualization pass — was measured climbing from 22ms to 247ms over a 30s run with 60
        // walking avatars, with the sprite count flat throughout, which puts the growth inside a
        // visualization update rather than in there being more to draw. This is the composition
        // that update reaches. The tally and the duration are both needed and answer different
        // questions: a rising `avatar.compose` count means the cache is being missed more often,
        // a flat count beside a rising `avatar.compose.ms` means each composition itself is
        // getting slower.
        FrameTimings.count(AVATAR_COUNTER_LOOKUP);

        // A container describing parts cannot answer a caller that needs a composed texture, and it
        // has no way to say so — the caller reads `image`, finds null and silently draws nothing.
        // That is how every avatar outside the room went blank when the sprite path became the
        // default: the toolbar, the profile, the hotel view and the club all compose, and the flag is
        // global. Treat the wrong kind as a miss and build the one that was asked for.
        const wrongKind = wantImage && container !== null && container.image === null && container.parts !== null;

        if(!container || forceUpdate || wrongKind)
        {
            FrameTimings.count(AVATAR_COUNTER_COMPOSE);
            FrameTimings.begin(FRAME_CHANNEL_AVATAR_COMPOSE);

            const partList = directionCache.getPartList();

            container = this.renderBodyPart(direction, partList, adjustedFrameIndex, renderAction, forceUpdate, wantImage);

            FrameTimings.end(FRAME_CHANNEL_AVATAR_COMPOSE);

            if(!container || forceUpdate)
            {
                // A composition that produced nothing to cache. Counted separately from the
                // uncacheable case below because they look identical from the outside — both leave
                // the cache empty so the next frame recomposes — but one means the parts failed to
                // resolve and the other means they resolved and were rejected.
                if(!container) FrameTimings.count(AVATAR_COUNTER_NULL);

                return null;
            }

            // `!wrongKind` so a one-off image request does not evict the parts the room is using.
            // Both kinds cannot be cached at once, and the room asks every frame while a profile or a
            // toolbar icon asks once, so the rare caller pays its own composition rather than pushing
            // that avatar onto the slow path for good. A consumer that only ever composes never takes
            // this branch: nothing cached parts for it in the first place.
            if(container.isCacheable && !wrongKind)
            {
                FrameTimings.count(AVATAR_COUNTER_CACHED);
                directionCache.updateImageContainer(container, adjustedFrameIndex);
            }
            else
            {
                // A part that reports itself uncacheable is recomposed on every single frame, for
                // every avatar showing it — the one shape that would produce exactly the unbounded
                // climb observed, if what makes it uncacheable also grows.
                FrameTimings.count(AVATAR_COUNTER_UNCACHEABLE);
            }
        }

        const bodyPartOffset = this._structure.getFrameBodyPartOffset(cacheAction, direction, adjustedFrameIndex, bodyPartId);

        container.offset = {
            x: animationOffset.x + bodyPartOffset.x,
            y: animationOffset.y + bodyPartOffset.y
        };

        return container;
    }

    /**
	 * Returns and clears the accumulated server render data.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::getServerRenderData()
    public getServerRenderData(): RoomObjectSpriteData[]
    {
        const data = this._serverRenderData;

        this._serverRenderData = [];

        return data;
    }

    /**
	 * Gets or creates a body part cache for the given ID.
	 *
	 * @param bodyPartId - The body part identifier
	 * @returns The body part cache
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::getBodyPartCache()
    public getBodyPartCache(bodyPartId: string): AvatarImageBodyPartCache
    {
        let cache = this._cache.get(bodyPartId) || null;

        if(!cache)
        {
            cache = new AvatarImageBodyPartCache();
            this._cache.set(bodyPartId, cache);
        }

        return cache;
    }

    /**
	 * Disposes all caches and clears references.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._structure = null!;
        this._avatar = null!;
        this._assets = null!;

        if(this._cache)
        {
            for(const cache of this._cache.values())
            {
                if(cache) cache.dispose();
            }

            this._cache.clear();
        }

        this._canvas = null;
        this._unionImages = [];
        this._serverRenderData = [];
        this._disposed = true;
    }

    /**
	 * Disposes every per-direction body-part cache and clears the canvas/default-action
	 * state, without disposing this AvatarImageCache itself - unlike dispose(), the cache
	 * stays usable afterward (called on a structure/figuredata reload).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::reset()
    public reset(): void
    {
        if(this._cache)
        {
            for(const cache of this._cache.values())
            {
                if(cache) cache.dispose();
            }

            this._cache.clear();
        }

        this._canvas = null;
        this._defaultActionAssetPartDefinition = AvatarImageCache.BASE_ACTION;
    }

    /**
	 * Renders a body part by compositing all its individual part sprites
	 * into a single container, handling direction flipping, color transforms,
	 * and animation frames.
	 *
	 * @param direction - The avatar direction (0-7)
	 * @param partList - The list of part containers to render
	 * @param frameIndex - The animation frame index
	 * @param action - The active action data for asset name resolution
	 * @param forceUpdate - Whether this is a forced re-render
	 * @returns The composited body part container, or null if no parts render
	 */
    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::renderBodyPart()
    private renderBodyPart(
        direction: number,
        partList: AvatarImagePartContainer[],
        frameIndex: number,
        action: IActiveActionData,
        forceUpdate: boolean = false,
        wantImage: boolean = false
    ): AvatarImageBodyPartContainer | null
    {
        if(!partList || partList.length === 0) return null;

        if(!this._canvas)
        {
            this._canvas = this._structure.getCanvas(this._scale, this._geometryType);

            if(!this._canvas) return null;
        }

        let assetDirection: number;
        const isFlippedDirection = AvatarDirectionAngle.DIRECTION_IS_FLIPPED[direction] || false;
        let assetPartDefinition = action.definition.assetPartDefinition;
        let isCacheable = true;
        const partCount = partList.length;
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageCache.as:607-609
        // Remembers the face part's own (pre-union) offset, passed through as the resulting
        // container's faceOffset - consumed by AvatarImage.getFaceOffset() for chat-bubble placement.
        let faceOffset: {x: number; y: number} | null = null;

        for(let i = partCount - 1; i >= 0; i--)
        {
            const partContainer = partList[i];

            if(direction === 7 && (partContainer.partType === AvatarImageCache.PART_FACE || partContainer.partType === AvatarImageCache.PART_EYES))
            {
                continue;
            }

            if(partContainer.partType === AvatarImageCache.PART_RIGHT_ITEM && !partContainer.partId)
            {
                continue;
            }

            const partType = partContainer.partType;
            const partId = partContainer.partId;
            let currentPartType = partType;

            const animFrame = partContainer.getFrameDefinition(frameIndex);
            let frameNumber: number;

            if(animFrame)
            {
                frameNumber = animFrame.number;

                if(animFrame.assetPartDefinition && animFrame.assetPartDefinition.length > 0)
                {
                    assetPartDefinition = animFrame.assetPartDefinition;
                }
            }
            else
            {
                frameNumber = partContainer.getFrameIndex(frameIndex);
            }

            assetDirection = direction;
            let isPartFlipped = false;

            if(isFlippedDirection)
            {
                if(assetPartDefinition === AvatarImageCache.ACTION_WAVE &&
					(currentPartType === 'lh' || currentPartType === 'ls' || currentPartType === 'lc' || currentPartType === 'mcl'))
                {
                    // AS3 AvatarImageCache.as:474 — the carried "misc" part mcl flips with
                    // the left hand when waving. Without it mcl fell through to the else,
                    // remapping the direction and swapping to mcr instead of mirroring.
                    isPartFlipped = true;
                }
                else if(assetPartDefinition === AvatarImageCache.ACTION_DRINK &&
					(currentPartType === 'rh' || currentPartType === 'rs' || currentPartType === 'rc' || currentPartType === 'mcr'))
                {
                    // AS3 AvatarImageCache.as:478 — mcr flips with the right hand when drinking.
                    isPartFlipped = true;
                }
                else if(assetPartDefinition === AvatarImageCache.ACTION_BLOW && currentPartType === 'rh')
                {
                    isPartFlipped = true;
                }
                else if(assetPartDefinition === AvatarImageCache.ACTION_SIGN && currentPartType === 'lh')
                {
                    isPartFlipped = true;
                }
                else if(assetPartDefinition === AvatarImageCache.ACTION_RESPECT && currentPartType === 'lh')
                {
                    isPartFlipped = true;
                }
                else if(currentPartType === 'ri')
                {
                    isPartFlipped = true;
                }
                else if(currentPartType === 'li')
                {
                    isPartFlipped = true;
                }
                else if(currentPartType === 'cp')
                {
                    isPartFlipped = true;
                }
                else
                {
                    if(direction === 4)
                    {
                        assetDirection = 2;
                    }
                    else if(direction === 5)
                    {
                        assetDirection = 1;
                    }
                    else if(direction === 6)
                    {
                        assetDirection = 0;
                    }

                    if(partContainer.flippedPartType !== currentPartType)
                    {
                        currentPartType = partContainer.flippedPartType;
                    }
                }
            }

            const resolvedAsset = this.tryResolveAsset(assetPartDefinition, currentPartType, partId, assetDirection, frameNumber);
            const graphicAsset = resolvedAsset?.asset ?? null;

            if(graphicAsset && graphicAsset.texture)
            {
                // Build color transform (AS3 lines 536-556)
                let hasColorTransform = false;
                const colorMult = {redMultiplier: 1, greenMultiplier: 1, blueMultiplier: 1, alphaMultiplier: 1};

                if(partContainer.isColorable && partContainer.color)
                {
                    const ct = partContainer.color.colorTransform;

                    colorMult.redMultiplier = ct.redMultiplier;
                    colorMult.greenMultiplier = ct.greenMultiplier;
                    colorMult.blueMultiplier = ct.blueMultiplier;
                    hasColorTransform = true;
                }

                if(partContainer.isBlendable)
                {
                    const blend = partContainer.blendTransform;

                    colorMult.redMultiplier *= blend.redMultiplier;
                    colorMult.greenMultiplier *= blend.greenMultiplier;
                    colorMult.blueMultiplier *= blend.blueMultiplier;
                    colorMult.alphaMultiplier *= blend.alphaMultiplier;
                    hasColorTransform = true;
                }

                // Compute offset point (AS3 lines 558-562)
                const offset = {x: -graphicAsset.offsetX, y: -graphicAsset.offsetY};

                if(isPartFlipped)
                {
                    offset.x += this._scale === AvatarScaleType.LARGE ? 65 : 31;
                }

                if(currentPartType === AvatarImageCache.PART_FACE)
                {
                    faceOffset = offset;
                }

                const colorTransform: IColorTransformData | null = hasColorTransform ? colorMult : null;

                // Combine asset-level flip with alias flip for draw-time flipping
                // In AS3, BitmapData is pre-flipped; we flip at draw time instead
                const aliasFlipH = this._assets.getAliasFlipH(resolvedAsset!.assetName);
                const totalAssetFlipH = aliasFlipH !== graphicAsset.flipH;
                const effectiveFlipH = isPartFlipped !== totalAssetFlipH;

                // The camera's half of this method. `forceUpdate` is AS3's `param5`, set only by
                // `AvatarImage.getAvatarPartsForCamera()`, and it is what makes an avatar appear in
                // a room photo at all: the server redraws the figure from these part names, and the
                // drawn room sprite carries no name it could use (`RoomObject.getAvatarLibraryAssetName()`
                // answers `avatar_<id>`, which only keys the merge in `SpriteDataCollector`).
                //
                // `offset` is AS3's `_loc19_` — the asset's own offset, which this port stores
                // already negated — so the arithmetic below is AS3's verbatim. The name goes through
                // the alias collection because the resolved part name may be an alias of the asset
                // that actually holds the pixels, and it is the latter the server has.
                if(forceUpdate)
                {
                    const data = new RoomObjectSpriteData();
                    let flipH = isPartFlipped;

                    data.name = this._assets.getAssetName(resolvedAsset!.assetName);
                    data.x = -offset.x - 33;
                    data.y = -offset.y;
                    data.z = this._serverRenderData.length * -0.0001;
                    data.width = graphicAsset.width;
                    data.height = graphicAsset.height;

                    if(assetPartDefinition === AvatarImageCache.LAY_BASE_ACTION) data.x += 53;

                    // The direction's own mirror, on top of the part's. AS3 re-mirrors the record
                    // rather than the pixels, because the receiving renderer flips at draw time.
                    if(isFlippedDirection)
                    {
                        flipH = !flipH;

                        if(flipH) data.x = -data.x - graphicAsset.width;
                        else data.x += 65;
                    }

                    // DEVIATION: AS3 sends this flip alone. It can, because its asset library bakes
                    //   an alias' `fliph` into the bitmap the alias names, so the name in the
                    //   payload and the pixels on its own screen are already mirrored the same way.
                    //   This port reads a Nitro bundle, which does not bake — that is what the
                    //   `aliasFlipH` line above exists for — so a part drawn mirrored through an
                    //   alias would be sent unmirrored and come back with the limb on the wrong
                    //   side. The mirror is folded into the flag instead of the position, because an
                    //   asset-level flip mirrors the part inside its own box and leaves x alone.
                    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::renderBodyPart()
                    data.flipH = flipH !== totalAssetFlipH;

                    if(partContainer.isColorable && colorTransform !== null)
                    {
                        data.color = '0x'
                            + AvatarImageCache.convertColorToHex(colorTransform.redMultiplier)
                            + AvatarImageCache.convertColorToHex(colorTransform.greenMultiplier)
                            + AvatarImageCache.convertColorToHex(colorTransform.blueMultiplier);
                    }

                    this._serverRenderData.push(data);
                }

                this._unionImages.push(new ImageData(
                    graphicAsset.texture,
                    {x: 0, y: 0, width: graphicAsset.width, height: graphicAsset.height},
                    offset,
                    effectiveFlipH,
                    colorTransform
                ));
            }
            else if(resolvedAsset !== null)
            {
                // Uncacheable only when the asset resolved but carries no bitmap — AS3's
                // `if(_loc31_) { if(_loc31_.content == null) _loc13_ = false; }`. That is the
                // transient case: the asset exists and its pixels have not arrived yet, so the
                // composition must not be frozen.
                //
                // An asset that does not resolve at all is a different thing, and AS3 leaves the
                // flag alone for it: a part with nothing to draw is a permanent property of the
                // figure, not a state that will change. The port folded both into one `else`, and
                // since nearly every avatar has some part with no asset — the same family as the
                // 68% of lookups that compose to nothing — nearly every composition was marked
                // uncacheable for life.
                //
                // Measured before this: 23971 uncacheable against 3152 cached, so 88% of the real
                // work was thrown away and redone every frame, and the cache served 4% of lookups.
                isCacheable = false;
            }
        }

        if(this._unionImages.length === 0) return null;

        // `!wantImage`: the mode says how the *room* draws, and the caller says what it can use. A
        // consumer that needs a texture gets one whatever the mode is.
        if(AvatarRenderMode.spriteParts && !wantImage)
        {
            return this.describeBodyPart(
                isFlippedDirection,
                assetPartDefinition,
                isCacheable,
                faceOffset,
                this._scale === AvatarScaleType.LARGE ? this._canvas.height - 16 : this._canvas.height - 8
            );
        }

        // A real composition measured ~5ms, and a body part is only some six thousand pixels — far
        // too few for the pixel loop or the readback to account for it. So the time is in the
        // surrounding machinery, and this splits it: `createUnionImage()` allocates a fresh
        // OffscreenCanvas and builds a PixiJS Texture over it, either of which can cost
        // milliseconds, while the part resolution above it is string building and map lookups.

        const unionImage = this.createUnionImage(this._unionImages, isFlippedDirection);

        const canvasOffset = this._scale === AvatarScaleType.LARGE
            ? this._canvas.height - 16
            : this._canvas.height - 8;

        const regPoint = unionImage.regPoint;

        const containerRegPoint = {
            x: -regPoint.x,
            y: canvasOffset - regPoint.y
        };

        if(isFlippedDirection && assetPartDefinition !== 'lay')
        {
            containerRegPoint.x += this._scale === AvatarScaleType.LARGE ? 67 : 31;
        }

        // Dispose union images
        for(let i = this._unionImages.length - 1; i >= 0; i--)
        {
            const img = this._unionImages.pop();

            if(img) img.dispose();
        }

        return new AvatarImageBodyPartContainer(unionImage.texture, containerRegPoint, isCacheable, faceOffset);
    }

    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::tryResolveAsset()
    private tryResolveAsset(
        assetPartDefinition: string,
        partType: string,
        partId: string,
        direction: number,
        frame: number
    ): { asset: any; assetName: string } | null
    {
        const candidates: [string, number][] = [
            [assetPartDefinition, frame],
            [assetPartDefinition, 0],
            [this._defaultActionAssetPartDefinition, frame],
            [this._defaultActionAssetPartDefinition, 0]
        ];

        for(const candidate of candidates)
        {
            const assetName = this.buildAssetName(candidate[0], partType, partId, direction, candidate[1]);
            const asset = this._assets.getAsset(assetName);

            if(asset)
            {
                return {asset, assetName};
            }
        }

        return null;
    }

    private buildAssetName(
        assetPartDefinition: string,
        partType: string,
        partId: string,
        direction: number,
        frame: number
    ): string
    {
        // AS3 AvatarImageCache.as:527 — in largeScaledSmall mode the asset name uses the
        // large scale "h" (downsampled at render) rather than the raw scale ("sh").
        return (this._largeScaledSmall ? 'h' : this._scale)
			+ AvatarImageCache.UNDERSCORE + assetPartDefinition
			+ AvatarImageCache.UNDERSCORE + partType
			+ AvatarImageCache.UNDERSCORE + partId
			+ AvatarImageCache.UNDERSCORE + direction
			+ AvatarImageCache.UNDERSCORE + frame;
    }

    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::getDefaultActionFromGeometryType()
    private getDefaultActionFromGeometryType(geometryType: string): string
    {
        return geometryType === 'horizontal' ? AvatarImageCache.LAY_BASE_ACTION : AvatarImageCache.BASE_ACTION;
    }

    /**
	 * Composites multiple ImageData objects into a single union image
	 * by computing the bounding rectangle union and drawing each part.
	 *
	 * @param imageDataList - The list of image data to composite
	 * @param isFlipped - Whether the composite should be flipped
	 * @returns The composited image data, or null if empty
	 */
    /**
     * Describes the body part the way `createUnionImage()` would have drawn it, without drawing it.
     *
     * Every number here is the one the composed path computes for the same part — the union box, the
     * per-part `drawX`/`drawY`, the mirror, the container's registration point. The only thing that
     * does not happen is the rasterising: no canvas is allocated, no pixels are read or written, and
     * no texture is uploaded. That is the entire saving, and it is also why there is no cache to warm
     * on this path, since the expensive artefact it exists to keep is never produced.
     *
     * Keeping the arithmetic literally identical rather than simplified is deliberate. It does
     * collapse — in an unflipped direction the union box cancels out and a part sits at `-regPoint` —
     * but writing the collapsed form would mean the two paths agree only as long as someone keeps
     * proving they do.
     */
    // TS-only: no AS3 counterpart; the composition it replaces is `createUnionImage()`.
    private describeBodyPart(
        isFlipped: boolean,
        assetPartDefinition: string,
        isCacheable: boolean,
        faceOffset: { x: number; y: number } | null,
        canvasOffset: number
    ): AvatarImageBodyPartContainer
    {
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        for(const imageData of this._unionImages)
        {
            const offsetRect = imageData.offsetRect;

            minX = Math.min(minX, offsetRect.x);
            minY = Math.min(minY, offsetRect.y);
            maxX = Math.max(maxX, offsetRect.x + offsetRect.width);
            maxY = Math.max(maxY, offsetRect.y + offsetRect.height);
        }

        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        const regPoint = {x: -minX, y: -minY};
        const parts: IAvatarPartSprite[] = [];

        for(const imageData of this._unionImages)
        {
            const texture = imageData.texture;

            if(!texture) continue;

            let drawX = regPoint.x - imageData.regPoint.x;
            const drawY = regPoint.y - imageData.regPoint.y;

            if(isFlipped)
            {
                drawX = width - (drawX + imageData.rect.width);
            }

            const transform = imageData.colorTransform;

            parts.push({
                texture,
                x: drawX,
                y: drawY,
                flipH: (isFlipped && !imageData.flipH) || (!isFlipped && imageData.flipH),
                color: transform !== null
                    ? (AvatarImageCache.toChannel(transform.redMultiplier) << 16)
                    | (AvatarImageCache.toChannel(transform.greenMultiplier) << 8)
                    | AvatarImageCache.toChannel(transform.blueMultiplier)
                    : 0xffffff,
                alpha: transform !== null ? transform.alphaMultiplier : 1
            });
        }

        // Not `regPoint` directly, which is the trap this path fell into once.
        //
        // The composed path reads its registration point off the `ImageData` that `createUnionImage()`
        // returns — and that constructor mirrors `regPoint.x` into `-regPoint.x + rect.width` whenever
        // its `flipH` is set, which for the union image is the direction's own flip. So the value
        // `renderBodyPart()` negates is already mirrored, and taking the raw one here put every body
        // part of a flipped direction out by `2·minX + width`, horizontally only. Copying the
        // arithmetic was not enough: the transform was hidden in a constructor rather than written at
        // the call site.
        const unionRegPoint = isFlipped
            ? {x: -regPoint.x + width, y: regPoint.y}
            : regPoint;

        const containerRegPoint = {
            x: -unionRegPoint.x,
            y: canvasOffset - unionRegPoint.y
        };

        if(isFlipped && assetPartDefinition !== 'lay')
        {
            containerRegPoint.x += this._scale === AvatarScaleType.LARGE ? 67 : 31;
        }

        for(let i = this._unionImages.length - 1; i >= 0; i--)
        {
            const img = this._unionImages.pop();

            if(img) img.dispose();
        }

        const container = new AvatarImageBodyPartContainer(null, containerRegPoint, isCacheable, faceOffset);

        container.parts = parts;
        container.size = {width, height};

        return container;
    }

    /**
     * A 0..1 colour multiplier as the payload's two hex digits.
     *
     * No rounding, as AS3: a multiplier that is not an exact 1/255 step prints its fraction here in
     * both languages, and the two-digit pad is skipped for the same reason in both (the check is on
     * the string's length, and `"0.8"` is already longer than two).
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::convertColorToHex()
    private static convertColorToHex(multiplier: number): string
    {
        const hex = (multiplier * 255).toString(16);

        return hex.length < 2 ? `0${hex}` : hex;
    }

    /** A 0..1 colour multiplier as an 8-bit tint channel. */
    // TS-only: see `describeBodyPart()`.
    private static toChannel(multiplier: number): number
    {
        return Math.max(0, Math.min(255, Math.round(multiplier * 255)));
    }

    // AS3: .../src/com/sulake/habbo/avatar/cache/AvatarImageCache.as::createUnionImage()
    private createUnionImage(imageDataList: ImageData[], isFlipped: boolean): ImageData
    {
        // Compute the union bounding rect from all offset rects
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        for(const imageData of imageDataList)
        {
            const offsetRect = imageData.offsetRect;

            minX = Math.min(minX, offsetRect.x);
            minY = Math.min(minY, offsetRect.y);
            maxX = Math.max(maxX, offsetRect.x + offsetRect.width);
            maxY = Math.max(maxY, offsetRect.y + offsetRect.height);
        }

        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        const regPoint = {x: -minX, y: -minY};

        // A fresh canvas per composition, handed straight to `Texture.from()`.
        //
        // This was briefly pooled instead, with `transferToImageBitmap()` breaking the tie between
        // the surface and the texture so one canvas could serve every composition — on the theory
        // that the `getContext` here was worth removing, since a DevTools trace put native
        // `getContext` at 3.7% of a run. The self-profiler then measured the replacement:
        // `transferToImageBitmap` came out at **22.2%**. The trade cost about six times what it
        // saved, so it is reverted. Allocating is the cheap option here.
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d')!;

        for(const imageData of imageDataList)
        {
            const texture = imageData.texture;

            if(!texture) continue;

            const source = texture.source?.resource;
            const frame = texture.frame;

            if(!source) continue;

            // Compute draw position: union regPoint - imageData regPoint (AS3 line 632)
            let drawX = regPoint.x - imageData.regPoint.x;
            const drawY = regPoint.y - imageData.regPoint.y;

            // If global direction is flipped, mirror the x position (AS3 line 636)
            if(isFlipped)
            {
                drawX = width - (drawX + imageData.rect.width);
            }

            // Determine if we need draw-time flip (AS3 line 638: XOR of global + per-part)
            const needsFlip = (isFlipped && !imageData.flipH) || (!isFlipped && imageData.flipH);

            // `save()`/`restore()` only around the branch that actually changes the transform.
            //
            // They used to wrap all three. A DevTools profile of a 100-avatar run — the first one
            // readable, once `willReadFrequently` stopped the renderer blocking on the GPU — put
            // native `save` at **36.7% of all sampled time**, the largest single entry by a wide
            // margin, ahead of `drawImage` at 18%. The two unflipped branches below never touch
            // context state: they call `drawImage`, and `drawWithColorTransform()` only calls
            // `drawImage` too. For them the pair was pure overhead, once per part per composition.
            if(needsFlip)
            {
                // Both cases go through `drawWithColorTransform()`, which mirrors into its memo and
                // hands back a bitmap already the right way round. A part with no colour transform
                // borrows the identity one purely to reach that path — the multipliers change
                // nothing, and the flip is what is being cached.
                this.drawWithColorTransform(
                    ctx,
                    source as CanvasImageSource,
                    frame,
                    drawX,
                    drawY,
                    imageData.rect.width,
                    imageData.rect.height,
                    imageData.colorTransform ?? AvatarImageCache.IDENTITY_COLOR_TRANSFORM,
                    true
                );
            }
            else if(imageData.colorTransform)
            {
                // Draw with color transform (AS3 lines 651-658)
                this.drawWithColorTransform(ctx, source as CanvasImageSource, frame, drawX, drawY, imageData.rect.width, imageData.rect.height, imageData.colorTransform);
            }
            else
            {
                // Fast path: direct copy (AS3 copyPixels, line 661)
                ctx.drawImage(
                    source as CanvasImageSource,
                    frame.x, frame.y, frame.width, frame.height,
                    drawX, drawY, imageData.rect.width, imageData.rect.height
                );
            }
        }

        const resultTexture = Texture.from({resource: canvas, alphaMode: 'premultiply-alpha-on-upload'});

        return new ImageData(
            resultTexture,
            {x: 0, y: 0, width, height},
            regPoint,
            isFlipped,
            null
        );
    }

    /**
	 * Draws a sprite to the canvas context with a color transform applied.
	 * Uses a temporary canvas for per-pixel color multiplication.
	 *
	 * Equivalent to AS3's BitmapData.draw() with ColorTransform parameter.
	 */
    private drawWithColorTransform(
        ctx: OffscreenCanvasRenderingContext2D,
        source: CanvasImageSource,
        frame: { x: number; y: number; width: number; height: number },
        destX: number,
        destY: number,
        width: number,
        height: number,
        colorTransform: IColorTransformData,
        flip: boolean = false
    ): void
    {
        if(width <= 0 || height <= 0) return;

        // An all-ones transform is the identity, and the pixel loop below would spend a full
        // readback and write-back arriving back at the source bitmap. Measured on a 60-avatar run,
        // body-part composition was 95% of the frame, so a whole class of calls that can be a plain
        // blit is worth recognising.
        if(!flip
            && colorTransform.redMultiplier === 1
            && colorTransform.greenMultiplier === 1
            && colorTransform.blueMultiplier === 1
            && colorTransform.alphaMultiplier === 1)
        {
            ctx.drawImage(source, frame.x, frame.y, frame.width, frame.height, destX, destY, width, height);

            return;
        }

        const memoKey = `${frame.x},${frame.y},${frame.width},${frame.height},${width},${height},`
            + `${colorTransform.redMultiplier},${colorTransform.greenMultiplier},`
            + `${colorTransform.blueMultiplier},${colorTransform.alphaMultiplier},${flip ? 'f' : 'n'}`;
        const memo = AvatarImageCache.getTransformMemo(source, memoKey);

        if(memo !== null)
        {
            ctx.drawImage(memo, 0, 0, width, height, destX, destY, width, height);

            return;
        }

        // A CPU-backed canvas and a GPU-backed one do not resample identically, so the fast surface
        // is only safe when this draw does not scale. Measured on a deliberately high-frequency
        // pattern the scaled difference reached a delta of 49; at 1:1 there is no resampling at all
        // and the two are byte-identical, which the equivalence test asserts both ways.
        const scaled = frame.width !== width || frame.height !== height;
        const scratch = AvatarImageCache.acquireScratch(width, height, !scaled);

        if(scratch === null)
        {
            // No scratch surface means no colour transform is possible; an untransformed part is a
            // better failure than a missing one.
            ctx.drawImage(source, frame.x, frame.y, frame.width, frame.height, destX, destY, width, height);

            return;
        }

        const tempCtx = scratch.context;

        // The scratch canvas is shared and larger than this call needs, so whatever the previous
        // caller left in this rectangle has to go before drawing a bitmap with transparent areas —
        // otherwise the last part's pixels show through this one's holes.
        tempCtx.clearRect(0, 0, width, height);

        // Mirrored parts are mirrored *here*, once per distinct part, and the memo keeps the
        // flipped bitmap. `createUnionImage()` then blits it with no transform at all.
        //
        // The transform used to live in that loop, once per part per composition, and it was
        // measured twice: `save <- createUnionImage` at 22.1% of a run, then — after replacing the
        // pair with `setTransform` — 21.9% again. Any context state write costs about the same,
        // and making it lazy barely helped because parts alternate more than assumed. Doing it
        // once per cached bitmap instead of once per draw removes the whole line.
        if(flip)
        {
            tempCtx.setTransform(-1, 0, 0, 1, width, 0);
        }

        tempCtx.drawImage(
            source,
            frame.x, frame.y, frame.width, frame.height,
            0, 0, width, height
        );

        if(flip) tempCtx.setTransform(1, 0, 0, 1, 0, 0);

        const pixelData = tempCtx.getImageData(0, 0, width, height);
        const data = pixelData.data;

        for(let i = 0; i < data.length; i += 4)
        {
            data[i] = Math.min(255, (data[i] * colorTransform.redMultiplier) | 0);
            data[i + 1] = Math.min(255, (data[i + 1] * colorTransform.greenMultiplier) | 0);
            data[i + 2] = Math.min(255, (data[i + 2] * colorTransform.blueMultiplier) | 0);
            data[i + 3] = Math.min(255, (data[i + 3] * colorTransform.alphaMultiplier) | 0);
        }

        tempCtx.putImageData(pixelData, 0, 0);

        // Only the sub-rectangle just written — the scratch surface may be bigger than this part.
        ctx.drawImage(scratch.canvas, 0, 0, width, height, destX, destY, width, height);

        AvatarImageCache.storeTransformMemo(source, memoKey, scratch.canvas, width, height);
    }

    /**
     * A previously transformed copy of this exact frame under this exact colour transform.
     *
     * Measured: the draw loop this serves is 98% of a body-part composition, which is in turn
     * essentially the whole frame in a busy room — and the expense is not the arithmetic but the
     * `getImageData` inside it, a synchronous GPU-to-CPU stall paid once per part per composition.
     * The inputs repeat relentlessly: sixty avatars share a handful of figures, each figure's parts
     * are drawn in every direction and animation frame, and the same shirt in the same colour is
     * re-derived from the same source pixels every time. Nothing about that result depends on the
     * avatar, so it is computed once.
     *
     * Keyed by source bitmap through a `WeakMap`, so an asset library that goes away takes its
     * memo with it rather than pinning atlases alive.
     */
    // TS-only: AS3 had no equivalent because `BitmapData.draw(..., ColorTransform)` was native and
    // cheap enough to repeat; here the same call is the dominant cost of a frame.
    private static getTransformMemo(source: CanvasImageSource, key: string): OffscreenCanvas | null
    {
        return AvatarImageCache.TRANSFORM_MEMO.get(source)?.get(key) ?? null;
    }

    // TS-only: see `getTransformMemo()`.
    private static storeTransformMemo(
        source: CanvasImageSource,
        key: string,
        scratch: OffscreenCanvas,
        width: number,
        height: number
    ): void
    {
        if(typeof OffscreenCanvas === 'undefined') return;

        let bySource = AvatarImageCache.TRANSFORM_MEMO.get(source);

        if(bySource === undefined)
        {
            bySource = new Map();
            AvatarImageCache.TRANSFORM_MEMO.set(source, bySource);
        }

        // A hard ceiling per source. The key space is (frame x transform) and is bounded in
        // practice by a hotel's clothing set, but "bounded in practice" is how an unbounded cache
        // is always described — and this one holds bitmaps, so overshooting costs memory rather
        // than a slow lookup. Clearing wholesale rather than evicting one entry keeps the policy
        // to something that cannot itself become a cost.
        if(bySource.size >= AvatarImageCache.TRANSFORM_MEMO_LIMIT)
        {
            bySource.clear();
        }

        // Copied out of the shared scratch surface, which the next call overwrites.
        const copy = new OffscreenCanvas(width, height);
        const copyCtx = copy.getContext('2d');

        if(copyCtx === null) return;

        copyCtx.imageSmoothingEnabled = false;
        copyCtx.drawImage(scratch, 0, 0, width, height, 0, 0, width, height);

        bySource.set(key, copy);
    }

    /**
     * A shared scratch surface at least `width` x `height`, for one colour-transformed part draw.
     *
     * This used to be a `new OffscreenCanvas` plus a `getContext('2d')` on every call — and the
     * call happens once per colour-transformed part, inside a loop over every part, inside a
     * composition that a 60-avatar room performs over a hundred times a second. Allocating a canvas
     * and acquiring a 2D context are both far from free, and neither result was ever reused.
     *
     * Grown monotonically and never shrunk: body parts sit in a narrow size range, so it settles at
     * the largest one almost immediately, and a surface that shrinks would reallocate whenever a
     * large part follows a small one — reintroducing exactly what this removes.
     */
    // TS-only: AS3 drew through `BitmapData.draw(source, matrix, colorTransform)`, a native player
    // operation with no intermediate surface to manage.
    private static acquireScratch(
        width: number,
        height: number,
        readFrequently: boolean
    ): { canvas: OffscreenCanvas; context: OffscreenCanvasRenderingContext2D } | null
    {
        if(typeof OffscreenCanvas === 'undefined') return null;

        const slot = readFrequently ? 'cpu' : 'gpu';
        const current = AvatarImageCache.SCRATCH.get(slot) ?? null;

        if(current !== null && current.canvas.width >= width && current.canvas.height >= height)
        {
            return current;
        }

        const canvas = new OffscreenCanvas(
            Math.max(width, current?.canvas.width ?? 0),
            Math.max(height, current?.canvas.height ?? 0)
        );
        // `willReadFrequently` is the whole point of this surface. A DevTools trace of a 100-avatar
        // run put `CrGpuMain` at 93% busy over 16 seconds against 12% for `CrRendererMain` — the
        // bottleneck was never JavaScript, it was the GPU process, and the JS timings that said
        // otherwise were measuring a thread blocked waiting on it. `getImageData()` against a
        // GPU-backed canvas is a synchronous readback: the renderer stalls until the GPU process
        // hands the pixels back, once per colour-transformed part per composition. This flag asks
        // Chrome to keep the canvas in CPU memory instead, which turns that round trip into a
        // memcpy — the documented remedy for a draw-then-read surface, which is exactly what this is.
        const context = canvas.getContext('2d', {willReadFrequently: readFrequently});

        if(context === null) return null;

        // `imageSmoothingEnabled` is deliberately left at its default of true. The code this
        // replaces used a freshly created canvas per call and never touched the flag, so it drew
        // smoothed; turning it off here changed the output of every part whose destination size
        // differs from its source frame — invisible at 1:1, which is why only the two scaling cases
        // in the equivalence test caught it. Making this a performance change and nothing else
        // means matching that default, whatever one thinks of it for pixel art.
        const surface = {canvas, context};

        AvatarImageCache.SCRATCH.set(slot, surface);

        return surface;
    }
}
