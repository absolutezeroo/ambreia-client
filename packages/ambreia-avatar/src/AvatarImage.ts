import type {Texture} from 'pixi.js';
import {createOffscreenCanvas} from '@ambreia/common/platform/Platform';
import {textureFromCanvas} from '@ambreia/common/graphics/textureFromCanvas';
import type {AvatarStructure} from './AvatarStructure';
import type {AssetAliasCollection} from './alias/AssetAliasCollection';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import type {RoomObjectSpriteData} from '@ambreia/common/graphics/RoomObjectSpriteData';
import {AvatarFigureContainer} from './AvatarFigureContainer';
import type {IAvatarImage} from './IAvatarImage';
import type {IAvatarFigureContainer} from './IAvatarFigureContainer';
import type {IAvatarEffectListener} from './IAvatarEffectListener';
import type {IAvatarPartSprite, IAvatarPartSpriteSet} from './AvatarPartSprite';
import type {IActiveActionData} from './actions/IActiveActionData';
import type {ISpriteDataContainer} from './animation/ISpriteDataContainer';
import type {IAvatarDataContainer} from './animation/IAvatarDataContainer';
import type {IAnimationLayerData} from './animation/IAnimationLayerData';
import type {Animation} from './animation/Animation';
import type {IPartColor} from './structure/figure/IPartColor';
import type {ActionDefinition} from './actions/ActionDefinition';
import {AvatarImageCache} from './cache/AvatarImageCache';
import {ActiveActionData} from './actions/ActiveActionData';
import {AvatarAction} from './enum/AvatarAction';
import {AvatarScaleType} from './enum/AvatarScaleType';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.avatar.AvatarImage');

/**
 * Main avatar image rendering class. Manages actions, directions,
 * animations, body part compositing, and full-image caching.
 *
 * Implements IAvatarImage and IAvatarEffectListener. The AS3 class also
 * implements IDisposable, which is handled via the dispose() method.
 *
 * @see sources/win63_version/habbo/avatar/AvatarImage.as
 */
export class AvatarImage implements IAvatarImage, IAvatarEffectListener
{
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::DEFAULT_ACTION
    private static readonly DEFAULT_ACTION: string = 'Default';
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::DEFAULT_DIR
    private static readonly DEFAULT_DIR: number = 2;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::DEFAULT_AVATAR_SET
    private static readonly DEFAULT_AVATAR_SET: string = 'full';

    protected _structure: AvatarStructure;
    protected _scale: string;
    protected _mainDirection: number = 0;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::_headDirection
    protected _headDirection: number = 0;
    protected _canvasOffsets: number[] = [];
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::_assets
    protected _assets: AssetAliasCollection;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::_cache
    protected _cache: AvatarImageCache | null = null;
    protected _figure: AvatarFigureContainer;
    protected _avatarDataContainer: IAvatarDataContainer | null = null;
    protected _actions: IActiveActionData[] = [];
    protected _image: Texture | null = null;
    protected _fullImageFromCache: boolean = false;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::_defaultAction
    private _defaultAction: IActiveActionData;
    private _frameCounter: number = 0;
    // AS3: sources/win63_version/habbo/avatar/AvatarImage.as::_directionOffset
    private _directionOffset: number = 0;
    private _needsUpdate: boolean = true;
    private _animationSpriteData: ISpriteDataContainer[] = [];
    private _isAnimating: boolean = false;
    private _sortedActions: IActiveActionData[] | null = null;
    private _lastActionsString: string = '';
    private _currentActionsString: string = '';
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::_fullImageCache
    private _fullImageCache: Map<string, Texture>;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::_useFullImageCache
    private _useFullImageCache: boolean = false;
    private _effectId: number = -1;
    private _animFrameCount: number = 0;
    private _actionsSorted: boolean = false;
    private _effectManager: IEffectAssetDownloadManager | null;
    private _effectListener: IAvatarEffectListener | null;
    private _cachedBodyPartsDirection: number = -1;
    private _cachedBodyPartsGeometry: string | null = null;
    private _cachedBodyPartsSetType: string | null = null;
    private _cachedBodyParts: string[] = [];

    constructor(
        structure: AvatarStructure,
        aliasCollection: AssetAliasCollection,
        figure: AvatarFigureContainer,
        scale: string,
        effectManager: IEffectAssetDownloadManager | null = null,
        effectListener: IAvatarEffectListener | null = null
    )
    {
        this._canvasOffsets = [];
        this._actions = [];
        this._structure = structure;
        this._assets = aliasCollection;
        this._scale = scale;
        this._effectManager = effectManager;
        this._effectListener = effectListener;
        this._needsUpdate = true;
        this._fullImageCache = new Map();

        // AS3 (AvatarImage.as:133-142): the "h_50" scale means "render at large scale,
        // downsample to small" — the cache keeps the flag and looks up large ("h") assets.
        // The port mapped h_50 -> sh but dropped the flag, so it fetched raw sh_* assets.
        let largeScaledSmall = false;

        if(this._scale == null)
        {
            this._scale = AvatarScaleType.LARGE;
        }
        else if(this._scale === AvatarScaleType.LARGE_TO_SMALL)
        {
            largeScaledSmall = true;
            this._scale = AvatarScaleType.SMALL;
        }

        // AS3 (AvatarImage.as:143-147) creates a default figure when none is given,
        // rather than leaving _figure null — getFigure()/getParts() would otherwise
        // dereference null.
        if(figure == null)
        {
            figure = new AvatarFigureContainer('hr-893-45.hd-180-2.ch-210-66.lg-270-82.sh-300-91.wa-2007-.ri-1-');
            log.debug('Using default avatar figure');
        }

        this._figure = figure;

        this._cache = new AvatarImageCache(this._structure, this, this._assets, this._scale, largeScaledSmall);

        this.setDirection(AvatarImage.DEFAULT_AVATAR_SET, AvatarImage.DEFAULT_DIR);

        this._actions = [];
        this._defaultAction = new ActiveActionData(AvatarAction.POSTURE_STAND);
        this._defaultAction.definition = this._structure.getActionDefinition(AvatarImage.DEFAULT_ACTION)!;

        this.resetActions();
        this._fullImageCache = new Map();
    }

    protected _mainAction: IActiveActionData | null = null;

    /**
	 * The main action type string, or empty if no main action.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::get mainAction()
    public get mainAction(): string
    {
        if(this._mainAction)
        {
            return this._mainAction.actionType;
        }

        return '';
    }

    protected _disposed: boolean = false;

    /**
	 * Whether the avatar image has been disposed.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _animationHasResetOnToggle: boolean = false;

    /**
	 * Whether the current animation resets when toggled.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::get animationHasResetOnToggle()
    public get animationHasResetOnToggle(): boolean
    {
        return this._animationHasResetOnToggle;
    }

    /**
	 * The avatar data container with color transforms for effects.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::get avatarSpriteData()
    public get avatarSpriteData(): IAvatarDataContainer | null
    {
        return this._avatarDataContainer;
    }

    /**
	 * Collects server-side render data by pre-rendering all body parts.
	 *
	 * @returns An array of render data entries
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getServerRenderData()
    public getServerRenderData(): RoomObjectSpriteData[]
    {
        this.getAvatarPartsForCamera(AvatarImage.DEFAULT_AVATAR_SET);

        if(this._cache)
        {
            return this._cache.getServerRenderData();
        }

        return [];
    }

    /**
	 * Gets the avatar figure container.
	 *
	 * @returns The figure container
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getFigure()
    public getFigure(): IAvatarFigureContainer
    {
        return this._figure;
    }

    /**
	 * Gets the current rendering scale identifier.
	 *
	 * @returns The scale string
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getScale()
    public getScale(): string
    {
        return this._scale;
    }

    /**
	 * Gets the part color for a given part type from the figure data.
	 *
	 * @param partType - The part type identifier
	 * @returns The part color, or null if not found
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getPartColor()
    public getPartColor(partType: string): IPartColor | null
    {
        return this._structure.getPartColor(this._figure, partType);
    }

    /**
	 * Sets the direction for a given avatar set, applying the direction offset.
	 * Handles head direction independently when the set is "head" or "full".
	 *
	 * @param setType - The avatar set type (e.g. "full", "head")
	 * @param direction - The direction index (0-7)
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::setDirection()
    public setDirection(setType: string, direction: number): void
    {
        direction += this._directionOffset;

        if(direction < 0)
        {
            direction = 7 + (direction + 1);
        }

        if(direction > 7)
        {
            direction -= 7 + 1;
        }

        if(this._structure.isMainAvatarSet(setType))
        {
            this._mainDirection = direction;
        }

        if(setType === 'head' || setType === 'full')
        {
            if(setType === 'head' && this.isHeadTurnPreventedByAction())
            {
                direction = this._mainDirection;
            }

            this._headDirection = direction;
        }

        if(this._cache)
        {
            this._cache.setDirection(setType, direction);
        }

        this._needsUpdate = true;
    }

    /**
	 * Sets the direction from an angle by converting degrees to a direction index.
	 *
	 * @param setType - The avatar set type
	 * @param angle - The angle in degrees
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::setDirectionAngle()
    public setDirectionAngle(setType: string, angle: number): void
    {
        const direction = Math.trunc(angle / 45);
        this.setDirection(setType, direction);
    }

    /**
	 * Gets the current animation sprite data containers.
	 *
	 * @returns The sprite data containers array
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getSprites()
    public getSprites(): ISpriteDataContainer[]
    {
        return this._animationSpriteData;
    }

    /**
	 * Gets the current canvas offsets for this avatar's actions.
	 *
	 * @returns The canvas offset array
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getCanvasOffsets()
    public getCanvasOffsets(): number[]
    {
        return this._canvasOffsets;
    }

    /**
	 * Gets animation layer data for a given sprite data container.
	 *
	 * @param sprite - The sprite data container to look up
	 * @returns The animation layer data, or null if not found
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getLayerData()
    public getLayerData(sprite: ISpriteDataContainer): IAnimationLayerData | null
    {
        return this._structure.getBodyPartData(sprite.animation.id, this._frameCounter, sprite.id);
    }

    /**
	 * Advances the frame counter by the given number of frames.
	 *
	 * @param frames - The number of frames to advance (defaults to 1)
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::updateAnimationByFrames()
    public updateAnimationByFrames(frames: number = 1): void
    {
        this._frameCounter += frames;
        this._needsUpdate = true;
    }

    /**
	 * Resets the animation frame counter to zero.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::resetAnimationFrameCounter()
    public resetAnimationFrameCounter(): void
    {
        this._frameCounter = 0;
        this._needsUpdate = true;
    }

    /**
	 * Looks up an asset by name from the alias collection.
	 *
	 * @param name - The asset name to look up
	 * @returns The asset, or null if not found
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getAsset()
    // AS3 returns the resolved BitmapDataAsset (getAssetByName). The port returned
    // getAssetName() — a *string* — which typechecked only because IAvatarImage.getAsset
    // was `any`; AvatarVisualization then read `.offset` off a string (undefined) and lost
    // every avatar sprite's per-asset offset. AssetAliasCollection.getAsset resolves the
    // alias and fetches the asset.
    public getAsset(name: string): IGraphicAsset | null
    {
        return this._assets.getAsset(name);
    }

    /**
	 * Gets the current main body direction index.
	 *
	 * @returns The direction index (0-7)
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getDirection()
    public getDirection(): number
    {
        return this._mainDirection;
    }

    /**
	 * Begins a batch of action appends. Clears pending actions and resets state.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::initActionAppends()
    public initActionAppends(): void
    {
        this._actions = [];
        this._actionsSorted = false;
        this._currentActionsString = '';
        this._useFullImageCache = false;
    }

    /**
	 * Finalizes the current batch of appended actions. Sorts them, resolves effects,
	 * resets internal state, and applies actions to body parts.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::endActionAppends()
    public endActionAppends(): void
    {
        if(this.sortActions())
        {
            if(this._sortedActions)
            {
                for(const action of this._sortedActions)
                {
                    if(action.actionType === AvatarAction.EFFECT)
                    {
                        if(this._effectManager && !this._effectManager.isReady(parseInt(action.actionParameter)))
                        {
                            this._effectManager.loadEffectData(parseInt(action.actionParameter), this);
                        }
                    }
                }
            }

            this.resetActions();
            this.setActionsToParts();
        }
    }

    /**
	 * Appends an action to the pending queue. Handles posture, gesture, effect,
	 * dance, talk, carry/use objects, and expression actions.
	 *
	 * @param actionType - The action type identifier
	 * @param args - Additional arguments (typically the action parameter)
	 * @returns True if the action was accepted
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::appendAction()
    public appendAction(actionType: string, ...args: any[]): boolean
    {
        let param: string | null = null;

        this._actionsSorted = false;

        if(args != null && args.length > 0)
        {
            param = String(args[0]);
        }

        switch(actionType)
        {
            case AvatarAction.POSTURE:
                switch(param)
                {
                    case AvatarAction.POSTURE_LAY:
                        if(this._mainDirection === 0)
                        {
                            this.setDirection('full', 4);
                        }
                        else
                        {
                            this.setDirection('full', 2);
                        }
                        // fall through
                    case AvatarAction.POSTURE_WALK:
                    case AvatarAction.POSTURE_STAND:
                    case AvatarAction.POSTURE_SIT:
                        this._useFullImageCache = true;
                        this.addActionData(param!);
                        break;

                    case AvatarAction.POSTURE_SWIM:
                    case AvatarAction.POSTURE_FLOAT:
                    case AvatarAction.POSTURE_SNOWWAR_RUN:
                    case AvatarAction.POSTURE_SNOWWAR_DIE_FRONT:
                    case AvatarAction.POSTURE_SNOWWAR_DIE_BACK:
                    case AvatarAction.POSTURE_SNOWWAR_PICK:
                    case AvatarAction.POSTURE_SNOWWAR_THROW:
                        this._useFullImageCache = false;
                        this.addActionData(param!);
                        break;
                    default:
                        // Unknown posture type
                        break;
                }
                break;

            case AvatarAction.GESTURE:
                switch(param)
                {
                    case AvatarAction.GESTURE_AGGRAVATED:
                    case AvatarAction.GESTURE_SAD:
                    case AvatarAction.GESTURE_SMILE:
                    case AvatarAction.GESTURE_SURPRISED:
                        this.addActionData(param!);
                        break;
                    default:
                        // Unknown gesture type
                        break;
                }
                break;

            case AvatarAction.EFFECT:
                if(param === '33' || param === '34' || param === '35' || param === '36' || param === '38' || param === '39')
                {
                    this._useFullImageCache = true;
                }
                // fall through
            case AvatarAction.EXPRESSION_JUMP:
            case AvatarAction.TALK:
            case AvatarAction.EXPRESSION_WAVE:
            case AvatarAction.SLEEP:
            case AvatarAction.SIGN:
            case AvatarAction.EXPRESSION_RESPECT:
            case AvatarAction.EXPRESSION_BLOW_A_KISS:
            case AvatarAction.EXPRESSION_67:
            case AvatarAction.EXPRESSION_LAUGH:
            case AvatarAction.EXPRESSION_CRY:
            case AvatarAction.EXPRESSION_IDLE:
            case AvatarAction.EXPRESSION_SNOWBOARD_OLLIE:
            case AvatarAction.EXPRESSION_SNOWBORD_360:
            case AvatarAction.EXPRESSION_RIDE_JUMP:
                this.addActionData(actionType, param || '');
                break;

            case AvatarAction.CARRY_OBJECT:
            case AvatarAction.USE_OBJECT:
            {
                const actionDef = this._structure.getActionDefinitionWithState(actionType) as ActionDefinition | null;

                if(actionDef != null && param)
                {
                    param = actionDef.getParameterValue(param);
                }

                this.addActionData(actionType, param || '');
                break;
            }

            default:
                // Unknown action type
                break;
        }

        return true;
    }

    /**
	 * Whether the avatar is currently animating.
	 *
	 * @returns True if animating or if multiple frames exist
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::isAnimating()
    public isAnimating(): boolean
    {
        return this._isAnimating || this._animFrameCount > 1;
    }

    /**
	 * Whether this is a placeholder avatar image.
	 *
	 * @returns False for regular avatar images
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::isPlaceholder()
    public isPlaceholder(): boolean
    {
        return false;
    }

    /**
	 * Always false in AS3 (AvatarImage.as::isBlocked()) - kept for interface parity.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::isBlocked()
    public isBlocked(): boolean
    {
        return false;
    }

    /**
	 * The head part's registration point, for chat-bubble/name placement above the head.
	 * `scale` is unused, matching AS3 (which reads it too, but never consumes it here).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getHeadRegPoints()
    public getHeadRegPoints(_scale: string): { x: number; y: number }
    {
        const container = this._cache?.getImageContainer('head', this._frameCounter) ?? null;

        if(!container) return {x: 0, y: 0};

        return {x: container.regPoint.x, y: container.regPoint.y};
    }

    /**
	 * The face part's own offset within the head container, for chat-bubble face
	 * placement (ChatBubble/PooledChatBubble consume this).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getFaceOffset()
    public getFaceOffset(_scale: string): { x: number; y: number }
    {
        const container = this._cache?.getImageContainer('head', this._frameCounter) ?? null;

        if(!container || !container.faceOffset) return {x: 0, y: 0};

        return {x: container.faceOffset.x, y: container.faceOffset.y};
    }

    /**
	 * Forces the action state to be recalculated on the next render.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::forceActionUpdate()
    public forceActionUpdate(): void
    {
        this._lastActionsString = '';
    }

    /**
	 * Disposes inactive action caches to free memory.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::disposeInactiveActionCache()
    public disposeInactiveActionCache(): void
    {
        if(this._cache)
        {
            this._cache.disposeInactiveActions();
        }
    }

    /**
	 * Called when an avatar effect finishes loading. Resets actions and
	 * reapplies them if the effect matches the currently active one.
	 *
	 * @param effectId - The effect identifier that is now ready
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::avatarEffectReady()
    public avatarEffectReady(effectId: number): void
    {
        if(effectId === this._effectId)
        {
            this.resetActions();
            this.setActionsToParts();
            this._animationHasResetOnToggle = true;
            this._needsUpdate = true;

            if(this._effectListener)
            {
                this._effectListener.avatarEffectReady(effectId);
            }
        }
    }

    /**
	 * Pre-renders all body parts for the given avatar set, used by the camera system.
	 *
	 * @param setType - The avatar set type (e.g. "full")
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getAvatarPartsForCamera()
    public getAvatarPartsForCamera(setType: string): void
    {
        if(this._mainAction == null) return;

        const canvas = this._structure.getCanvas(this._scale, this._mainAction.definition.geometryType);

        if(canvas == null) return;

        const bodyParts = this.getBodyParts(setType, this._mainAction.definition.geometryType, this._mainDirection);

        for(let i = bodyParts.length - 1; i >= 0; i--)
        {
            const partId = bodyParts[i];

            if(this._cache)
            {
                this._cache.getImageContainer(partId, this._frameCounter, true);
            }
        }
    }

    /**
	 * Renders and returns the full avatar image for the given set type.
	 * Composites body parts from the cache into a final bitmap.
	 *
	 * @param setType - The avatar set type (e.g. "full")
	 * @param makeCopy - Whether to return a copy of the cached image
	 * @param scale - Optional scale factor (1 = no scaling)
	 * @returns The rendered texture, or null if rendering failed
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getImage()
    public getImage(setType: string, makeCopy: boolean = false, scale: number = 1): Texture | null
    {
        if(!this._needsUpdate)
        {
            return this._image;
        }

        if(this._mainAction == null)
        {
            log.warn('getImage: mainAction is null');

            return null;
        }

        if(!this._actionsSorted)
        {
            this.endActionAppends();
        }

        const cacheKey = this.getFullImageCacheKey();

        if(cacheKey != null)
        {
            const cached = this.getFullImage(cacheKey);

            if(cached)
            {
                this._needsUpdate = false;

                if(makeCopy)
                {
                    return cached;
                }

                this._image = cached;
                this._fullImageFromCache = true;

                return this._image;
            }
        }

        const geometryType = this._mainAction.definition.geometryType;
        const canvas = this._structure.getCanvas(this._scale, geometryType);

        if(canvas == null)
        {
            log.warn(`getImage: canvas is null for scale="${this._scale}" geometry="${geometryType}"`);

            return null;
        }

        const bodyParts = this.getBodyParts(setType, geometryType, this._mainDirection);

        // Create OffscreenCanvas for compositing (equivalent to AS3 BitmapData)
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const offscreen = createOffscreenCanvas(canvasWidth, canvasHeight);
        const ctx = offscreen.getContext('2d')!;

        let isCacheable = true;

        for(let i = bodyParts.length - 1; i >= 0; i--)
        {
            const partId = bodyParts[i];

            if(this._cache)
            {
                const container = this._cache.getImageContainer(partId, this._frameCounter, false, true);

                if(container)
                {
                    isCacheable = isCacheable && container.isCacheable;

                    if(container.image)
                    {
                        // AS3: copyPixels at offset = regPoint + canvas.offset + canvas.regPoint
                        const regPoint = container.regPoint;
                        const destX = regPoint.x + canvas.offset.x + canvas.regPoint.x;
                        const destY = regPoint.y + canvas.offset.y + canvas.regPoint.y;

                        const source = container.image.source?.resource;

                        if(source)
                        {
                            const frame = container.image.frame;

                            ctx.drawImage(
                                source as CanvasImageSource,
                                frame.x, frame.y, frame.width, frame.height,
                                destX, destY, frame.width, frame.height
                            );
                        }
                        else
                        {
                            log.debug(`getImage: part "${partId}" has image but no drawable source`);
                        }
                    }
                    else
                    {
                        log.debug(`getImage: part "${partId}" container has no image`);
                    }
                }
            }
        }

        // AS3 (AvatarImage.as:429-443): after compositing, an active palette effect
        // recolours the whole image. Grayscale palette -> luminance-map each pixel
        // (0.33 R/G/B, like AS3's ColorMatrixFilter) and look the grayscale value up in
        // the effect's `reds` gradient, keeping the source alpha (AS3 passes a null alpha
        // array to paletteMap). ink 37 (non-grayscale) copies green into alpha
        // (AS3 copyChannel(2, 8)). Without this, palette effects (ghost, etc.) rendered
        // in normal colours.
        const dataContainer = this._avatarDataContainer;

        if(dataContainer !== null)
        {
            const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
            const px = imageData.data;

            if(dataContainer.paletteIsGrayscale)
            {
                const reds = dataContainer.reds;

                for(let i = 0; i < px.length; i += 4)
                {
                    const gray = Math.round(0.33 * px[i] + 0.33 * px[i + 1] + 0.33 * px[i + 2]) & 0xFF;
                    const mapped = reds[gray];

                    px[i] = (mapped >> 16) & 0xFF;
                    px[i + 1] = (mapped >> 8) & 0xFF;
                    px[i + 2] = mapped & 0xFF;
                }
            }
            else
            {
                for(let i = 0; i < px.length; i += 4)
                {
                    px[i + 3] = px[i + 1];
                }
            }

            ctx.putImageData(imageData, 0, 0);
        }

        // Convert to PixiJS Texture
        if(!this._fullImageFromCache && this._image)
        {
            this._image.destroy();
        }

        const unscaledTexture = textureFromCanvas(offscreen, 'premultiply-alpha-on-upload');

        // Cache the unscaled result if eligible - AS3 caches the full-size bitmap
        // *before* resampling the return value (see resampleCanvas()'s header
        // comment below), so a later call always recomputes at whatever scale
        // it asks for rather than reusing a scaled copy.
        if(cacheKey != null && isCacheable)
        {
            this.cacheFullImage(cacheKey, unscaledTexture);
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getImage() -
        // `if(param3 != 1) var_48 = class_2495.resampleBitmapData(var_48,param3);`
        this._image = scale !== 1
            ? textureFromCanvas(AvatarImage.resampleCanvas(offscreen, scale), 'premultiply-alpha-on-upload')
            : unscaledTexture;
        this._fullImageFromCache = false;
        this._needsUpdate = false;

        return this._image;
    }

    /**
     * The avatar as a list of parts, in the same space `getImage()` composes into — the sprite path.
     *
     * The loop below is `getImage()`'s, with the `drawImage()` removed: same body parts, same reverse
     * order, same `regPoint + canvas.offset + canvas.regPoint`. What it produces is what that call
     * would have drawn, described instead of rasterised.
     *
     * Returns null when the avatar cannot be expressed as independent sprites, and the room then uses
     * the composed path for it:
     *
     * - **A palette effect is active.** `getImage()` finishes by luminance-mapping every pixel
     *   through the effect's gradient, or by copying green into alpha. Neither is a per-sprite tint,
     *   and approximating one would ship wrong colours for ghosts and similar effects rather than a
     *   slower frame.
     * - **A part came back composed.** A container built before the mode was switched still holds a
     *   texture and no parts; mixing the two would drop it silently.
     */
    // TS-only: no AS3 counterpart; the composition it replaces is `getImage()`.
    public getPartSprites(setType: string): IAvatarPartSpriteSet | null
    {
        if(this._mainAction == null) return null;

        // The whole-image pixel pass at the end of `getImage()`; see the note above.
        if(this._avatarDataContainer !== null) return null;

        if(!this._actionsSorted)
        {
            this.endActionAppends();
        }

        const geometryType = this._mainAction.definition.geometryType;
        const canvas = this._structure.getCanvas(this._scale, geometryType);

        if(canvas == null) return null;

        if(this._cache == null) return null;

        const bodyParts = this.getBodyParts(setType, geometryType, this._mainDirection);
        const parts: IAvatarPartSprite[] = [];

        for(let i = bodyParts.length - 1; i >= 0; i--)
        {
            const container = this._cache.getImageContainer(bodyParts[i], this._frameCounter);

            if(container == null) continue;

            const containerParts = container.parts;

            // A composed leftover. Skipping it would drop that body part and render a maimed avatar,
            // so the whole avatar goes back to the composed path instead.
            if(containerParts === null) return null;

            const regPoint = container.regPoint;
            const destX = regPoint.x + canvas.offset.x + canvas.regPoint.x;
            const destY = regPoint.y + canvas.offset.y + canvas.regPoint.y;

            for(const part of containerParts)
            {
                parts.push({
                    texture: part.texture,
                    x: destX + part.x,
                    y: destY + part.y,
                    flipH: part.flipH,
                    color: part.color,
                    alpha: part.alpha
                });
            }
        }

        this._needsUpdate = false;

        return {width: canvas.width, height: canvas.height, parts};
    }

    // AS3: sources/win63_version/habbo/utils/class_2495.as::resizeBitmapData()
    private static resizeCanvas(source: OffscreenCanvas, scale: number): OffscreenCanvas
    {
        const width = Math.max(1, Math.round(source.width * scale));
        const height = Math.max(1, Math.round(source.height * scale));
        const target = createOffscreenCanvas(width, height);
        const ctx = target.getContext('2d')!;

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, width, height);

        return target;
    }

    /**
	 * AS3: sources/win63_version/habbo/utils/class_2495.as::resampleBitmapData()
     *
     * Real containing-class name unrecoverable from any of the three source
     * trees (obfuscated `_SafeCls_2871` in the primary tree, generic
     * decompiler-assigned `class_2495` in the secondary tree, absent from the
     * tertiary tree) - the method's own name is real/legible, only the class
     * wrapping it isn't. Progressively halves for downscales below 0.5x
     * (better quality than one big downscale) instead of a single resize,
     * matching the real algorithm exactly - this is what makes getImage()'s
     * `scale` parameter (e.g. HabboFaceFocuser's 0.5x "zoomed" head-icon crop)
     * actually shrink the composited canvas instead of being silently ignored.
	 */
    private static resampleCanvas(source: OffscreenCanvas, scale: number): OffscreenCanvas
    {
        if(scale >= 1) return AvatarImage.resizeCanvas(source, scale);

        let current = source;
        let currentScale = 1;

        do
        {
            if(scale < 0.5 * currentScale)
            {
                current = AvatarImage.resizeCanvas(current, 0.5);
                currentScale = 0.5 * currentScale;
            }
            else
            {
                current = AvatarImage.resizeCanvas(current, scale / currentScale);
                currentScale = scale;
            }
        }
        while(currentScale !== scale);

        return current;
    }

    /**
	 * Returns a cropped version of the avatar image.
	 *
	 * @param setType - The avatar set type
	 * @param scale - Optional scale factor
	 * @returns The cropped texture, or null if rendering failed
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getCroppedImage()
    public getCroppedImage(setType: string, scale: number = 1): Texture | null
    {
        if(this._mainAction == null)
        {
            return null;
        }

        if(!this._actionsSorted)
        {
            this.endActionAppends();
        }

        const canvas = this._structure.getCanvas(this._scale, this._mainAction.definition.geometryType);

        if(canvas == null)
        {
            return null;
        }

        const bodyParts = this._structure.getBodyParts(setType, this._mainAction.definition.geometryType, this._mainDirection);

        // Composite body parts then crop to content bounds
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const offscreen = createOffscreenCanvas(canvasWidth, canvasHeight);
        const ctx = offscreen.getContext('2d')!;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getCroppedImage()
        // tracks the union of each drawn part's rect as it goes, then crops the
        // final bitmap down to that bounding box — this is what makes the
        // result "cropped" rather than the full (mostly empty) render canvas.
        let bounds: {x: number; y: number; width: number; height: number} | null = null;

        for(let i = bodyParts.length - 1; i >= 0; i--)
        {
            const partId = bodyParts[i];

            if(this._cache)
            {
                const container = this._cache.getImageContainer(partId, this._frameCounter, false, true);

                if(container && container.image)
                {
                    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getCroppedImage()
                    // Uses the part's regPoint alone here - unlike getImage(), which additionally
                    // combines the canvas's own offset/regPoint (that combined form belongs to a
                    // different method, not this one).
                    const regPoint = container.regPoint;
                    const destX = regPoint.x;
                    const destY = regPoint.y;

                    const source = container.image.source?.resource;

                    if(source)
                    {
                        const frame = container.image.frame;

                        ctx.drawImage(
                            source as CanvasImageSource,
                            frame.x, frame.y, frame.width, frame.height,
                            destX, destY, frame.width, frame.height
                        );

                        const partRect = {x: destX, y: destY, width: frame.width, height: frame.height};

                        bounds = bounds ? AvatarImage.unionRect(bounds, partRect) : partRect;
                    }
                }
            }
        }

        if(!bounds)
        {
            bounds = {x: 0, y: 0, width: 1, height: 1};
        }

        const cropWidth = Math.max(1, Math.round(bounds.width));
        const cropHeight = Math.max(1, Math.round(bounds.height));
        const cropped = createOffscreenCanvas(cropWidth, cropHeight);
        const croppedCtx = cropped.getContext('2d')!;

        croppedCtx.drawImage(
            offscreen,
            Math.round(bounds.x), Math.round(bounds.y), cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getCroppedImage() -
        // `if(param2 != 1) _loc12_ = class_2495.resampleBitmapData(_loc12_,param2);`
        const resource = scale !== 1 ? AvatarImage.resampleCanvas(cropped, scale) : cropped;

        return textureFromCanvas(resource, 'premultiply-alpha-on-upload');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getCroppedImage() — Rectangle.union()
    private static unionRect(
        a: {x: number; y: number; width: number; height: number},
        b: {x: number; y: number; width: number; height: number}
    ): {x: number; y: number; width: number; height: number}
    {
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const right = Math.max(a.x + a.width, b.x + b.width);
        const bottom = Math.max(a.y + a.height, b.y + b.height);

        return {x, y, width: right - x, height: bottom - y};
    }

    /**
	 * Purges every cached sprite/texture and cached body-part/action state, without
	 * disposing this AvatarImage itself - called on a structure/figuredata reload
	 * (AS3: AvatarRenderManager.resetAllCaches(), not yet wired in this port - see that
	 * class's own TODO).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::resetCache()
    public resetCache(): void
    {
        this._cache?.reset();

        if(this._fullImageCache)
        {
            for(const texture of this._fullImageCache.values())
            {
                texture.destroy();
            }

            this._fullImageCache.clear();
        }

        this._actions = [];
        this._cachedBodyPartsDirection = -1;
        this._cachedBodyPartsGeometry = null;
        this._cachedBodyPartsSetType = null;
        this._lastActionsString = '';
        this._actionsSorted = false;
        this._needsUpdate = true;
        this._useFullImageCache = false;
        this._frameCounter = 0;
    }

    /**
	 * Disposes all resources: cache, textures, and clears collections.
	 * Always the last method of the class.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._structure = null!;
        this._assets = null!;
        this._mainAction = null;
        this._figure = null!;
        this._avatarDataContainer = null;
        this._actions = null!;

        if(this._image && !this._fullImageFromCache)
        {
            this._image.destroy();
        }

        if(this._cache)
        {
            this._cache.dispose();
            this._cache = null;
        }

        if(this._fullImageCache)
        {
            for(const texture of this._fullImageCache.values())
            {
                if(texture) texture.destroy();
            }

            this._fullImageCache.clear();
        }

        this._image = null;
        this._canvasOffsets = [];
        this._disposed = true;
    }

    /**
	 * Gets a cached full image by key.
	 *
	 * @param key - The cache key
	 * @returns The cached texture, or null
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getFullImage()
    protected getFullImage(key: string): Texture | null
    {
        return this._fullImageCache.get(key) || null;
    }

    /**
	 * Stores a full image in the cache, disposing any previously cached image for the same key.
	 *
	 * @param key - The cache key
	 * @param image - The texture to cache
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::cacheFullImage()
    protected cacheFullImage(key: string, image: Texture): void
    {
        const existing = this._fullImageCache.get(key);

        if(existing)
        {
            if(existing === image) return;

            existing.destroy();
            this._fullImageCache.delete(key);
        }

        this._fullImageCache.set(key, image);
    }

    /**
	 * Adds an action data entry to the pending queue, avoiding duplicates.
	 *
	 * @param param1 - The action state or type
	 * @param param2 - The action parameter
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::addActionData()
    protected addActionData(param1: string, param2: string = ''): void
    {
        if(this._actions == null)
        {
            this._actions = [];
        }

        for(let i = 0; i < this._actions.length; i++)
        {
            const existing = this._actions[i];

            if(existing.actionType === param1 && existing.actionParameter === param2)
            {
                return;
            }
        }

        this._actions.push(new ActiveActionData(param1, param2, this._frameCounter));
    }

    /**
	 * Resets internal state: clears sprite data, avatar data, direction offset,
	 * removes dynamic items, and resets the main action to default.
	 *
	 * @returns True
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::resetActions()
    private resetActions(): boolean
    {
        this._animationHasResetOnToggle = false;
        this._isAnimating = false;
        this._animationSpriteData = [];
        this._avatarDataContainer = null;
        this._directionOffset = 0;

        this._structure.removeDynamicItems(this);

        this._mainAction = this._defaultAction;
        this._mainAction.definition = this._defaultAction.definition;

        this.resetBodyPartCache(this._defaultAction);

        return true;
    }

    /**
	 * Checks whether head turning is blocked by any of the current sorted actions.
	 *
	 * @returns True if head turning is prevented
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::isHeadTurnPreventedByAction()
    private isHeadTurnPreventedByAction(): boolean
    {
        if(this._sortedActions == null)
        {
            return false;
        }

        for(const action of this._sortedActions)
        {
            const def = this._structure.getActionDefinitionWithState(action.actionType);

            if(action.actionType === AvatarAction.SLEEP && this._mainAction && this._mainAction.actionType !== AvatarAction.POSTURE_LAY)
            {
                continue;
            }

            if(def != null && def.getPreventHeadTurn(action.actionParameter))
            {
                return true;
            }
        }

        return false;
    }

    /**
	 * Sorts the pending actions by precedence, builds the actions string,
	 * tracks the active effect, and computes canvas offsets.
	 *
	 * @returns True if actions changed since last sort
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::sortActions()
    private sortActions(): boolean
    {
        let effectChanged = false;
        let hasEffect = false;
        let actionsChanged = false;

        this._currentActionsString = '';
        this._sortedActions = this._structure.sortActions(this._actions);
        this._animFrameCount = this._structure.maxFrames(this._sortedActions);

        if(this._sortedActions == null)
        {
            this._canvasOffsets = [0, 0, 0];

            if(this._lastActionsString !== '')
            {
                actionsChanged = true;
                this._lastActionsString = '';
            }
        }
        else
        {
            this._canvasOffsets = this._structure.getCanvasOffsets(this._sortedActions, this._scale, this._mainDirection) || [0, 0, 0];

            const actionParts: string[] = [];

            for(const action of this._sortedActions)
            {
                actionParts.push(action.actionType, action.actionParameter);

                if(action.actionType === AvatarAction.EFFECT)
                {
                    const newEffectId = parseInt(action.actionParameter);

                    if(this._effectId !== newEffectId)
                    {
                        effectChanged = true;
                    }

                    this._effectId = newEffectId;
                    hasEffect = true;
                }
            }

            if(!hasEffect)
            {
                if(this._effectId > -1)
                {
                    effectChanged = true;
                }

                this._effectId = -1;
            }

            if(effectChanged && this._cache)
            {
                this._cache.disposeInactiveActions(0);
            }

            this._currentActionsString = actionParts.join('');

            if(this._lastActionsString !== this._currentActionsString)
            {
                actionsChanged = true;
                this._lastActionsString = this._currentActionsString;
            }
        }

        this._actionsSorted = true;

        return actionsChanged;
    }

    /**
	 * Applies the sorted actions to body parts via the cache. Resolves
	 * overriding actions, loads animation sprite data, direction offsets,
	 * and avatar data containers.
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::setActionsToParts()
    private setActionsToParts(): void
    {
        if(this._sortedActions == null)
        {
            return;
        }

        const actionTypes: string[] = [];

        for(const action of this._sortedActions)
        {
            actionTypes.push(action.actionType);
        }

        for(const action of this._sortedActions)
        {
            if(action && action.definition && action.definition.isAnimation)
            {
                const animation = this._structure.getAnimation(action.definition.state + '.' + action.actionParameter);

                if(animation && animation.hasOverriddenActions())
                {
                    const overriddenNames = (animation as Animation).overriddenActionNames();

                    if(overriddenNames)
                    {
                        for(const name of overriddenNames)
                        {
                            if(actionTypes.indexOf(name) >= 0)
                            {
                                action.overridingAction = (animation as Animation).overridingAction(name) || '';
                            }
                        }
                    }
                }

                if(animation && animation.resetOnToggle)
                {
                    this._animationHasResetOnToggle = true;
                }
            }
        }

        for(const action of this._sortedActions)
        {
            if(!action || !action.definition)
            {
                continue;
            }

            if(action.definition.isAnimation && action.actionParameter === '')
            {
                action.actionParameter = '1';
            }

            this.setActionToParts(action, this._frameCounter);

            if(action.definition.isAnimation)
            {
                this._isAnimating = action.definition.isAnimated(action.actionParameter);

                const animation = this._structure.getAnimation(action.definition.state + '.' + action.actionParameter);

                if(animation != null)
                {
                    const spriteData = animation.spriteData;

                    if(spriteData)
                    {
                        this._animationSpriteData.push(...spriteData);
                    }

                    if(animation.hasDirectionData())
                    {
                        const dirData = (animation as Animation).directionData;

                        if(dirData)
                        {
                            this._directionOffset = dirData.offset;
                        }
                    }

                    if(animation.hasAvatarData())
                    {
                        this._avatarDataContainer = (animation as Animation).avatarData;
                    }
                }
            }
        }
    }

    /**
	 * Applies a single action to body parts. Sets the main action and geometry type
	 * on the cache if the action definition is main.
	 *
	 * @param action - The action data to apply
	 * @param frameCount - The current frame counter
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::setActionToParts()
    private setActionToParts(action: IActiveActionData, frameCount: number): void
    {
        if(action == null || action.definition == null)
        {
            return;
        }

        if(action.definition.assetPartDefinition === '')
        {
            return;
        }

        if(action.definition.isMain)
        {
            this._mainAction = action;

            if(this._cache)
            {
                this._cache.setGeometryType(action.definition.geometryType);
            }
        }

        if(this._cache)
        {
            this._cache.setAction(action, frameCount);
        }

        this._needsUpdate = true;
    }

    /**
	 * Resets body part cache for a given action. If the action is main,
	 * updates the geometry type on the cache.
	 *
	 * @param action - The action to reset cache for
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::resetBodyPartCache()
    private resetBodyPartCache(action: IActiveActionData): void
    {
        if(action == null || !action.definition)
        {
            return;
        }

        if(action.definition.assetPartDefinition === '')
        {
            return;
        }

        if(action.definition.isMain)
        {
            this._mainAction = action;

            if(this._cache)
            {
                this._cache.setGeometryType(action.definition.geometryType);
            }
        }

        if(this._cache)
        {
            this._cache.resetBodyPartCache(action);
        }

        this._needsUpdate = true;
    }

    /**
	 * Builds a cache key for the full composite image based on direction,
	 * actions string, and frame counter.
	 *
	 * @returns The cache key string, or null if caching is disabled
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getFullImageCacheKey()
    private getFullImageCacheKey(): string | null
    {
        if(!this._useFullImageCache)
        {
            return null;
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarImage.as::getFullImageCacheKey()
        // AS3 only caches the single-action case when mainDirection === headDirection - there is
        // no composite-key fallback for the mismatched-direction case here (that shape only exists
        // in the 2-action fx branch below). A mismatch falls through to the length===2 check, which
        // also fails (length is 1), ending in the final `return null`.
        if(this._sortedActions && this._sortedActions.length === 1 && this._mainDirection === this._headDirection)
        {
            const frame = (this._currentActionsString === AvatarAction.POSTURE_STAND ||
				this._currentActionsString === AvatarAction.POSTURE_LAY ||
				this._currentActionsString === AvatarAction.POSTURE_SIT)
                ? this._frameCounter % 8
                : this._frameCounter % 4;

            return this._mainDirection + this._currentActionsString + frame;
        }

        if(this._sortedActions && this._sortedActions.length === 2)
        {
            for(const action of this._sortedActions)
            {
                if(action.actionType === AvatarAction.EFFECT)
                {
                    const p = action.actionParameter;

                    if(p === '33' || p === '34' || p === '35' || p === '36')
                    {
                        return this._mainDirection + this._currentActionsString + 0;
                    }

                    if(p === '38' || p === '39')
                    {
                        const frame = this._frameCounter % 11;
                        return this._mainDirection + '_' + this._headDirection + this._currentActionsString + frame;
                    }
                }
            }
        }

        return null;
    }

    /**
	 * Gets the ordered body parts for a given set type, geometry, and direction.
	 * Results are cached until parameters change.
	 *
	 * @param setType - The avatar set type
	 * @param geometryType - The geometry type
	 * @param direction - The direction index
	 * @returns An array of body part identifiers
	 */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarImage.as::getBodyParts()
    private getBodyParts(setType: string, geometryType: string, direction: number): string[]
    {
        if(direction !== this._cachedBodyPartsDirection || geometryType !== this._cachedBodyPartsGeometry || setType !== this._cachedBodyPartsSetType)
        {
            this._cachedBodyPartsDirection = direction;
            this._cachedBodyPartsGeometry = geometryType;
            this._cachedBodyPartsSetType = setType;
            this._cachedBodyParts = this._structure.getBodyParts(setType, geometryType, direction);
        }

        return this._cachedBodyParts;
    }
}

/**
 * Temporary type placeholder for IEffectAssetDownloadManager until it is implemented.
 */
interface IEffectAssetDownloadManager
{
    isReady(effectId: number): boolean;

    loadEffectData(effectId: number, listener: IAvatarEffectListener): void;
}
