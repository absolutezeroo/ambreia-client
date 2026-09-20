/**
 * AvatarVisualization
 *
 * Main visualization class for avatar room objects. Extends
 * RoomObjectSpriteVisualization to render avatars using IAvatarImage
 * instances from the avatar render manager.
 *
 * Manages the full avatar rendering lifecycle including:
 * - Figure/gender/direction tracking from the room object model
 * - Avatar image creation and caching per scale and effect
 * - Action state management (posture, gesture, dance, carry, etc.)
 * - Shadow sprite rendering
 * - Visual additions (typing bubble, muted icon, idle Z, expressions, etc.)
 * - Animation frame updates
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as
 */
import {Texture} from 'pixi.js';

import type {IAsset} from '@core/assets/IAsset';
import type {IRoomGeometry} from '@room/utils/IRoomGeometry';
import type {IRoomObjectModel} from '@room/object/IRoomObjectModel';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IRoomObjectVisualizationData} from '@room/object/visualization/IRoomObjectVisualizationData';
import type {IAvatarImage} from '@habbo/avatar/IAvatarImage';
import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import type {IAvatarEffectListener} from '@habbo/avatar/IAvatarEffectListener';
import type {IAvatarPartSpriteSet} from '@habbo/avatar/AvatarPartSprite';
import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import {RoomObjectSpriteData} from '@room/data/RoomObjectSpriteData';
import {AvatarRenderMode} from '@habbo/avatar/AvatarRenderMode';
import type {IAvatarAddition} from './additions/IAvatarAddition';
import {RoomObjectSpriteVisualization} from '@room/object/visualization/RoomObjectSpriteVisualization';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {RoomObjectSpriteType} from '@room/object/enum/RoomObjectSpriteType';
import {AlphaTolerance} from '@room/object/enum/AlphaTolerance';
import {AvatarSetType} from '@habbo/avatar/enum/AvatarSetType';
import {AvatarAction} from '@habbo/avatar/enum/AvatarAction';
import {AvatarGuideStatus} from '@habbo/avatar/enum/AvatarGuideStatus';
import type {AvatarVisualizationData} from './AvatarVisualizationData';
import {FloatingIdleZ} from './additions/FloatingIdleZ';
import {MutedBubble} from './additions/MutedBubble';
import {TypingBubble} from './additions/TypingBubble';
import {GuideStatusBubble} from './additions/GuideStatusBubble';
import {GameClickTarget} from './additions/GameClickTarget';
import {NumberBubble} from './additions/NumberBubble';
import {HabbiconBubble} from './additions/HabbiconBubble';
import {StackedAdditions} from './additions/StackedAdditions';
import {VariableFxStackReconciler} from '../variablefx/VariableFxStackReconciler';
import {VariableFxStatusModelData} from '../../variablefx/VariableFxStatusModelData';
import type {IVariableFxVisualizationRoomData} from '../IVariableFxVisualizationRoomData';
import {ExpressionAdditionFactory} from './additions/ExpressionAdditionFactory';

export class AvatarVisualization extends RoomObjectSpriteVisualization implements IAvatarImageListener, IAvatarEffectListener 
{
    /** String tag for the main avatar sprite data container. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::AVATAR
    private static readonly AVATAR: string = 'avatar';

    /** Default depth offset for avatar sprites. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::AVATAR_SPRITE_DEFAULT_DEPTH
    private static readonly AVATAR_SPRITE_DEFAULT_DEPTH: number = -0.01;

    /** Additional depth adjustment for the player's own avatar. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::AVATAR_OWN_DEPTH_ADJUST
    private static readonly AVATAR_OWN_DEPTH_ADJUST: number = 0.001;

    /** Depth offset when the avatar is laying down. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::AVATAR_SPRITE_LAYING_DEPTH
    private static readonly AVATAR_SPRITE_LAYING_DEPTH: number = -0.409;

    /**
    * Depth between two consecutive parts of one avatar.
    *
    * Large enough to beat the renderer's own `3.7e-11` index tiebreak by orders of magnitude, small
    * enough that a whole avatar spans far less than the `0.01` separating it from anything else in the
    * room — so parts order among themselves and never reorder against furniture.
    */
    // TS-only: no AS3 counterpart; see `updatePartSprites()`.
    private static readonly PART_DEPTH_STEP: number = 1e-6;

    /** AS3 base Y scale used for figure_vertical_offset. */
    private static readonly BASE_Y_SCALE: number = 1000;

    /**
     * The scale the camera payload is measured in, hard-coded by AS3 rather than taken from the
     * geometry — the renderer on the other side has no geometry to ask.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::getSpriteList()
    private static readonly SERVER_RENDER_SCALE: number = 64;

    /** Maximum number of avatars with effect cached by the visualization. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::MAX_AVATARS_WITH_EFFECT
    private static readonly MAX_AVATARS_WITH_EFFECT: number = 3;

    /** AS3 animation frame update interval. */
    private static readonly ANIMATION_FRAME_UPDATE_INTERVAL: number = 2;

    /** Snowboarding effect id; hides the regular shadow. */
    private static readonly SNOWBOARDING_EFFECT: number = 97;

    /** Freeze effect id; hides the regular shadow. */
    private static readonly FREEZE_EFFECT: number = 218;

    /** Sprite index for the main avatar composite image. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::SPRITE_INDEX_AVATAR
    private static readonly SPRITE_INDEX_AVATAR: number = 0;

    /** Default canvas offsets when none are provided. */
    private static readonly DEFAULT_CANVAS_OFFSETS: number[] = [0, 0, 0];

    /** Sprite index for the shadow. */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::SPRITE_INDEX_SHADOW
    private static readonly SPRITE_INDEX_SHADOW: number = 1;

    /** Initial number of reserved sprites (avatar image + shadow). */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::INITIAL_RESERVED_SPRITES
    private static readonly INITIAL_RESERVED_SPRITES: number = 2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_IDLE_BUBBLE (and siblings, l.65-79)
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_IDLE_BUBBLE
    private static readonly ADDITION_ID_IDLE_BUBBLE: number = 1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_TYPING_BUBBLE
    private static readonly ADDITION_ID_TYPING_BUBBLE: number = 2;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_EXPRESSION
    private static readonly ADDITION_ID_EXPRESSION: number = 3;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_NUMBER_BUBBLE
    private static readonly ADDITION_ID_NUMBER_BUBBLE: number = 4;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_GAME_CLICK_TARGET
    private static readonly ADDITION_ID_GAME_CLICK_TARGET: number = 5;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_MUTED_BUBBLE
    private static readonly ADDITION_ID_MUTED_BUBBLE: number = 6;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_GUIDE_STATUS_BUBBLE
    private static readonly ADDITION_ID_GUIDE_STATUS_BUBBLE: number = 7;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_HABBICON_BUBBLE
    private static readonly ADDITION_ID_HABBICON_BUBBLE: number = 8;

    /** The stack itself — one addition carrying the habbicon and every Variable FX effect. */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::ADDITION_ID_STACKED_ADDITIONS
    private static readonly ADDITION_ID_STACKED_ADDITIONS: number = 9;

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_variableFxReconciler (name derived)
    private _variableFxReconciler: VariableFxStackReconciler = new VariableFxStackReconciler();

    /**
     * The room's Variable FX services, injected by the visualization factory.
     *
     * TS-only: AS3 reaches them through `_visualizationData`, which this port's avatar
     *   visualization does not carry a Variable FX-aware version of. Injected instead, by the same
     *   route `assets` and `avatarRenderManager` already take.
     */
    private _variableFxRoomData: IVariableFxVisualizationRoomData | null = null;

    /** Set by the factory when the visualization is created for a room. */
    // TS-only: see `_variableFxRoomData`.
    set variableFxRoomData(value: IVariableFxVisualizationRoomData | null)
    {
        this._variableFxRoomData = value;
    }

    /**
     * How far the avatar is turned by a spinning Habbicon, in degrees, applied to both the body and
     * the head angle. `AvatarLogic` computes it; this only carries it into the angles.
     *
     * The AS3 field is obfuscated (`_SafeStr_7233`) and recovered in no tree, so the name is
     * DERIVED — it happens to match the one `AvatarLogic` uses for the same quantity, which is a
     * coincidence of the value, not a shared field.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_SafeStr_7233
    private _habbiconSpinOffset: number = 0;

    /** Minimum time between geometry updates in milliseconds. */
    private static readonly GEOMETRY_UPDATE_INTERVAL_MS: number = 41;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_lastAnimationUpdateTime
    private _lastAnimationUpdateTime: number = -1000;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_visualizationData
    private _visualizationData: AvatarVisualizationData | null = null;
    private _avatarImages: Map<string, IAvatarImage> = new Map();
    private _avatarImagesWithEffect: Map<string, IAvatarImage> = new Map();
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_updatesUntilFrameUpdate
    private _updatesUntilFrameUpdate: number = 0;
    private _isAnimating: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_figure
    private _figure: string = '';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_gender
    private _gender: string = '';
    /** True while this client is blocking the user, so a silhouette renders in their place. */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_blocked
    private _blocked: boolean = false;

    /**
     * Scales every alpha this visualization writes. Defaults to 1, and AS3 restores that default
     * whenever the model has no `figure_alpha_multiplier` — `getNumber()` returns NaN there, not 0.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_alphaMultiplier
    private _alphaMultiplier: number = 1;
    private _pendingFrameUpdates: number = 0;
    private _shadowAssetName: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_currentHeadAngleDeg
    private _currentHeadAngleDeg: number = -1;
    private _currentHeadAngle: number = -1;
    private _extraSpritesStartIndex: number = 2;

    /** First index of the part block, valid while `_partSpriteCount` is above zero. */
    // TS-only: see `updatePartSprites()`.
    private _partSpritesStartIndex: number = 0;

    /** How many sprites the part block holds; zero on the composed path. */
    // TS-only: see `updatePartSprites()`.
    private _partSpriteCount: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_additions
    private _additions: Map<number, IAvatarAddition> | null = null;

    /**
     * Addition artwork, wrapped once and shared by every avatar in the room.
     *
     * Static because the pictures are: `user_idle_left_1` is the same image over every sleeping
     * avatar, and the library hands out the same `ImageBitmap` for it. Bounded by the number of
     * addition assets that ship — about thirty — so it needs no eviction.
     */
    // TS-only: AS3 hands the sprite an asset and lets Flash blit it; this port needs a Texture.
    private static readonly ADDITION_TEXTURES: Map<string, Texture> = new Map();
    private _geometryUpdateCounter: number = -1;
    private _postureParameter: string = '';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_isTalking
    private _isTalking: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_isSleeping
    private _isSleeping: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_isBlinking
    private _isBlinking: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_expressionType
    private _expressionType: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_gesture
    private _gesture: number = 0;
    private _danceStyle: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_mouseHighlight
    private _mouseHighlight: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_mouseHighlightEnabled
    private _mouseHighlightEnabled: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_signType
    private _signType: number = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_effectType
    private _effectType: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_carryObjectType
    private _carryObjectType: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_useObjectType
    private _useObjectType: number = 0;
    private _sitOffset: number = 0;

    // TS-only: AS3 needs no field for this — sprite 0 always holds the composed image, and every
    // consumer reads the dimensions straight off it (`_loc22_.asset = getImage("full", …)` then
    // `_loc22_.asset.width`/`.height`, AvatarVisualization.as l.1120-1125). The field exists only
    // because `AvatarRenderMode.spriteParts` — itself TS-only, Flash had no GPU to batch for —
    // leaves sprite 0 textureless, so the rectangle it stands for has nowhere else to live. Null on
    // the composed path, where sprite 0 carries the texture exactly as AS3's does.
    private _anchorRectangle: { x: number; y: number; width: number; height: number } | null = null;

    // TS-only: AS3 returns a fresh `flash.geom.Rectangle` from `boundingRectangle` and the callers
    // mutate it in place (`_loc5_.offset(...)` in RoomEngine.getRoomObjectBoundingRectangle()); this
    // port's callers copy instead, so the getter can reuse one object and allocate nothing — it
    // runs once per bubble per frame.
    private readonly _unionBounds: { x: number; y: number; width: number; height: number } =
        {x: 0, y: 0, width: 0, height: 0};

    private _verticalOffset: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_effectJustApplied
    private _effectJustApplied: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_isSittingManual
    private _isSittingManual: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_isLaying
    private _isLaying: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_activeAvatarImage
    private _activeAvatarImage: IAvatarImage | null = null;
    private _isOwnAvatar: boolean = false;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_forceUpdate
    private _forceUpdate: boolean = false;

    constructor() 
    {
        super();
    }

    /**
     * Frames left before this avatar drops the action images it is no longer playing.
     *
     * Seeded at random between 200 and 400 so that a room full of avatars does not sweep on the
     * same frame, then 500 between sweeps.
     */
    // Name derived: the field is `_SafeStr_6882` in the primary tree, `var_2194` in win63_version
    //   and `_SafeStr_6785` in AIR — obfuscated in all three, and absent from the 2016 build.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::cacheDisposeCountdown
    private _cacheDisposeCountdown: number = Math.random() * 200 + 200;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_angle
    private _angle: number = -1;

    /**
     * The body direction angle in degrees.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::get angle()
    get angle(): number 
    {
        return this._angle;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_posture
    private _posture: string = '';

    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::normalizeDirectionAngle()
    private static normalizeDirectionAngle(angle: number): number
    {
        return ((angle % 360) + 360) % 360;
    }

    /**
     * The current avatar posture string (std, sit, lay, mv, etc.).
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::get posture()
    get posture(): string 
    {
        return this._posture;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::_disposed
    private _disposed: boolean = false;

    /**
     * Whether this visualization has been disposed.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::get disposed()
    get disposed(): boolean 
    {
        return this._disposed;
    }

    /**
     * Gets the number of active additions. Unused within this class in AS3 itself (declared,
     * never read anywhere in the primary tree) — kept because it is a 1:1 port of a real getter.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::get numAdditions()
    protected get additionCount(): number
    {
        return (this._additions) ? this._additions.size : 0;
    }

    /**
     * The asset an addition draws with, out of the avatar render manager's library.
     *
     * AS3 is `_visualizationData.getAvatarRendererAsset(k)`, which ends at
     * `_avatarRenderer.assets.getAssetByName(k)`. This **returned the name back to the caller** —
     * a stub with the right signature and no lookup — which is one of the three reasons no addition
     * has ever drawn: the Zzz over a sleeping avatar, the muted bubble, the typing bubble and the
     * blown kiss all resolve their artwork through here.
     *
     * The name is normalised on the way past. AS3 asks for `user_idle_left_1_png`, because in Flash
     * the embed's class name carried the extension; this port keys images by their shipped filename
     * with no suffix (`user_idle_left_1`). Asking with the suffix returns null and says nothing —
     * the trap `.claude/rules` records for image versus layout keys. Both spellings are tried so
     * the additions can keep AS3's own names.
     */
    /**
     * Gives an addition's sprite the picture its `assetName` asks for.
     *
     * **A restored line, not a deviation.** AS3 assigns the picture as well as the name —
     * `_loc6_.asset = …content as BitmapData` — and this port assigned only the name. `assetName`
     * is read by nothing here: in Flash it is the cache key for the coloured and flipped variants
     * (`getBitmapData(asset, assetName, …)` takes the BitmapData separately), never a lookup. So
     * every addition set a name and drew whatever texture its pooled slot last held, which for the
     * idle Zzz, the muted bubble, the typing bubble, the blown kiss and the number bubble meant
     * nothing at all. The same line was missing on the effect-sprite path in `updateExtraSprites()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as:910
    private applyAdditionTexture(sprite: IRoomObjectSprite | null): void
    {
        if(sprite === null) return;

        if(!sprite.visible)
        {
            sprite.texture = null;

            return;
        }

        // An addition that composes its own pixels has no asset name to look up — `HabbiconBubble`
        // is the only one, because it is the only addition whose picture is not a shipped asset.
        // AS3 has no equivalent of this method at all (it assigns `asset` straight from the
        // library), so the "no name means nothing to draw" rule below is the port's own, and it was
        // silently wiping the texture such an addition had just set, every frame.
        if(!sprite.assetName) return;

        // Cached by name: this runs once per addition per frame, and `.claude/rules/room.md` is
        // explicit that the render path allocates nothing per frame and caches textures by content
        // key. An addition alternates between two or three names for its whole life.
        let texture = AvatarVisualization.ADDITION_TEXTURES.get(sprite.assetName) ?? null;

        if(texture === null)
        {
            const asset = this.getAvatarRendererAsset(sprite.assetName);
            const content = (asset?.content ?? null) as ImageBitmap | null;

            if(content !== null)
            {
                texture = Texture.from(content);
                AvatarVisualization.ADDITION_TEXTURES.set(sprite.assetName, texture);
            }
        }

        // Hidden rather than left holding the last texture: a name the library cannot answer is a
        // missing asset, and drawing the previous addition's picture in its place is worse than
        // drawing none.
        sprite.texture = texture;
        sprite.visible = texture !== null;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::getAvatarRendererAsset()
    getAvatarRendererAsset(name: string): IAsset | null
    {
        const renderer = this._visualizationData?.avatarRenderManager ?? null;

        if(renderer === null) return null;

        // Stripped FIRST, not as a fallback: `AssetLibrary.getAssetByName()` warns on every miss,
        // and asking with the suffix would log one per addition per frame for an asset that is
        // there under the other spelling.
        if(name.endsWith('_png'))
        {
            const stripped = renderer.getAssetByName(name.slice(0, -4));

            if(stripped !== null) return stripped;
        }

        return renderer.getAssetByName(name);
    }

    /**
     * Initializes the visualization with avatar visualization data.
     *
     * @param data - The IRoomObjectVisualizationData (must be AvatarVisualizationData)
     * @returns True if initialization succeeded
     */
    override initialize(data: IRoomObjectVisualizationData): boolean 
    {
        this._visualizationData = data as unknown as AvatarVisualizationData;
        this.createSprites(AvatarVisualization.INITIAL_RESERVED_SPRITES);

        return true;
    }

    /**
     * Main update loop called each render frame. Reads model changes,
     * updates the avatar image, manages additions, and copies sprite data.
     *
     * @param geometry - The room geometry for direction calculations
     * @param time - The current timestamp in milliseconds
     * @param update - Whether a full update is requested
     * @param skipUpdate - Whether to skip the update
     */
    override update(geometry: IRoomGeometry, time: number, update: boolean, _skipUpdate: boolean): void 
    {
        const roomObject = this.object;

        if(roomObject == null) return;
        if(geometry == null) return;
        if(this._visualizationData == null) return;

        // AS3 runs this right after the three null guards, before anything else in update().
        // `AvatarImage.disposeInactiveActionCache()` was ported and had no caller, so an avatar
        // kept every action image it had ever rendered for as long as it stayed in the room.
        if(--this._cacheDisposeCountdown <= 0 && this._activeAvatarImage !== null)
        {
            this._activeAvatarImage.disposeInactiveActionCache();
            this._cacheDisposeCountdown = 500;
        }

        const animationFrameDue = time >= (this._lastAnimationUpdateTime + AvatarVisualization.GEOMETRY_UPDATE_INTERVAL_MS);

        if(animationFrameDue) 
        {
            this._lastAnimationUpdateTime = this._lastAnimationUpdateTime + AvatarVisualization.GEOMETRY_UPDATE_INTERVAL_MS;

            if((this._lastAnimationUpdateTime + AvatarVisualization.GEOMETRY_UPDATE_INTERVAL_MS) < time) 
            {
                this._lastAnimationUpdateTime = time - AvatarVisualization.GEOMETRY_UPDATE_INTERVAL_MS;
            }
        }

        const model = roomObject.getModel();
        const scale = geometry.scale;
        let needsNewImage = false;
        let scaleChanged = false;
        let objectUpdated: boolean;
        const previousEffectType = this._effectType;
        let effectChanged = false;
        const modelChanged = this.updateModel(model, scale, update);

        if(this._forceUpdate) 
        {
            this.resetImages();
            this._forceUpdate = false;
        }

        if(modelChanged || scale !== this._scale || this._activeAvatarImage == null) 
        {
            if(scale !== this._scale) 
            {
                scaleChanged = true;
                this.validateActions(scale);
            }

            if(previousEffectType !== this._effectType) 
            {
                effectChanged = true;
            }

            if(scaleChanged || this._activeAvatarImage == null || effectChanged) 
            {
                this._activeAvatarImage = this.getAvatarImageForScale(scale, this._effectType);

                if(this._activeAvatarImage == null) 
                {
                    return;
                }

                needsNewImage = true;

                const avatarSprite = this.getSprite(0);

                if(avatarSprite && this._activeAvatarImage
                    && (this._activeAvatarImage.isPlaceholder() || this._activeAvatarImage.isBlocked()))
                {
                    avatarSprite.alpha = 150 * this._alphaMultiplier;
                    // The blocked silhouette is greyed out; the placeholder keeps its own colours.
                    avatarSprite.color = this._activeAvatarImage.isBlocked() ? 0x666666 : 0xFFFFFF;
                }
                else if(avatarSprite)
                {
                    avatarSprite.alpha = 255;
                    avatarSprite.color = 0xFFFFFF;
                }
            }

            if(this._activeAvatarImage == null) 
            {
                return;
            }

            if(effectChanged && this._activeAvatarImage.animationHasResetOnToggle) 
            {
                this._activeAvatarImage.resetAnimationFrameCounter();
            }

            this.updateShadow(scale);
            objectUpdated = this.updateObject(roomObject, geometry, update, true);
            this.updateActions(this._activeAvatarImage);

            if(this._additions) 
            {
                let spriteIndex = this._extraSpritesStartIndex;

                for(const addition of this._additions.values()) 
                {
                    addition.update(this.getSprite(spriteIndex++), scale);
                }
            }

            this._scale = scale;
        }
        else 
        {
            objectUpdated = this.updateObject(roomObject, geometry, update);
        }

        if(this._additions) 
        {
            let spriteIndex = this._extraSpritesStartIndex;

            for(const addition of this._additions.values())
            {
                const sprite = this.getSprite(spriteIndex++);

                if(addition.animate(sprite))
                {
                    this.increaseUpdateId();
                }

                this.applyAdditionTexture(sprite);
            }
        }

        const needsSpriteUpdate = objectUpdated || modelChanged || scaleChanged;
        const shouldAnimate = (this._isAnimating || this._pendingFrameUpdates > 0) && update && animationFrameDue;

        if(needsSpriteUpdate || needsNewImage) 
        {
            this._pendingFrameUpdates = AvatarVisualization.ANIMATION_FRAME_UPDATE_INTERVAL;
        }

        if(needsSpriteUpdate || shouldAnimate || needsNewImage) 
        {
            this.increaseUpdateId();

            if(animationFrameDue) 
            {
                this._pendingFrameUpdates--;
                this._updatesUntilFrameUpdate--;
            }

            if(!(this._updatesUntilFrameUpdate <= 0 || scaleChanged || modelChanged || needsNewImage)) 
            {
                return;
            }

            this._activeAvatarImage.updateAnimationByFrames(1);
            this._updatesUntilFrameUpdate = AvatarVisualization.ANIMATION_FRAME_UPDATE_INTERVAL;

            const canvasOffsets = this._activeAvatarImage.getCanvasOffsets();
            const offsets = (canvasOffsets == null || canvasOffsets.length < 3) ? AvatarVisualization.DEFAULT_CANVAS_OFFSETS : canvasOffsets;

            this.updateMainSprite(model, geometry, offsets, needsSpriteUpdate);
            this.updateExtraSprites(offsets);

            this._isAnimating = this._activeAvatarImage.isAnimating();
        }
    }

    /**
     * Called when the avatar image has finished loading.
     *
     * @param figureString - The figure string that is ready
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::avatarImageReady()
    avatarImageReady(_figureString: string): void 
    {
        this._forceUpdate = true;
    }

    /**
     * Called when an avatar effect has finished loading.
     *
     * @param effectId - The effect ID that is ready
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::avatarEffectReady()
    avatarEffectReady(_effectId: number): void 
    {
        this._forceUpdate = true;
    }

    /**
     * Adds a new addition to the additions map.
     *
     * @param addition - The addition to add
     * @returns The added addition
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::addAddition()
    addAddition(addition: IAvatarAddition): IAvatarAddition 
    {
        if(!this._additions) 
        {
            this._additions = new Map();
        }

        if(this._additions.has(addition.id)) 
        {
            throw new Error(`Avatar addition with index ${addition.id} already exists!`);
        }

        this._additions.set(addition.id, addition);

        return addition;
    }

    /**
     * Gets an addition by its map key.
     *
     * @param id - The addition key
     * @returns The addition, or null if not found
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::getAddition()
    getAddition(id: number): IAvatarAddition | null
    {
        return (this._additions) ? (this._additions.get(id) ?? null) : null;
    }

    /**
     * The stack, created on demand.
     *
     * `createIfMissing` is what keeps an avatar with nothing to show from paying for a stack at
     * all — which is every avatar in a room with no wired effects and no habbicon, i.e. almost all
     * of them.
     */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::getStackedAdditions()
    private getStackedAdditions(createIfMissing: boolean): StackedAdditions | null
    {
        const existing = this.getAddition(AvatarVisualization.ADDITION_ID_STACKED_ADDITIONS);

        if(existing instanceof StackedAdditions) return existing;

        if(!createIfMissing) return null;

        const created = this.addAddition(
            new StackedAdditions(AvatarVisualization.ADDITION_ID_STACKED_ADDITIONS, this)
        );

        return created instanceof StackedAdditions ? created : null;
    }

    /**
     * Brings the stack in line with the room's Variable FX status model.
     *
     * The stack is created only when there is something to put in it — an empty model on an avatar
     * that has none must not conjure one, which is what the first condition is for.
     */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::reconcileVariableFxStatuses()
    private reconcileVariableFxStatuses(model: unknown): boolean
    {
        const statuses = model instanceof VariableFxStatusModelData ? model : null;
        const roomData = this._variableFxRoomData;
        const hasStatuses = statuses !== null
            && (statuses.statusesByConfig?.length ?? 0) > 0
            && roomData !== null
            && roomData.variableFxVisualizationManager !== null;

        const stackedAdditions = this.getStackedAdditions(hasStatuses);

        if(stackedAdditions === null) return false;

        return this._variableFxReconciler.reconcile(
            statuses,
            roomData === null ? null : roomData.variableFxVisualizationManager,
            roomData === null ? null : roomData.variableFxAssetProvider,
            roomData === null ? null : roomData.variableFxRendererRegistry,
            stackedAdditions.stack,
            StackedAdditions.LAYER_VARIABLE_FX,
            performance.now()
        );
    }

    /**
     * Removes and disposes an addition by its map key.
     *
     * @param id - The addition key to remove
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::removeAddition()
    removeAddition(id: number): void 
    {
        const addition = this.getAddition(id);

        if(!addition) 
        {
            return;
        }

        this._additions!.delete(id);
        addition.dispose();
    }

    /**
     * Disposes of this visualization, cleaning up all cached images,
     * additions, and sprite data.
     */
    override dispose(): void 
    {
        if(this._avatarImages != null) 
        {
            this.resetImages();
        }

        this._visualizationData = null;
        this._shadowAssetName = null;

        if(this._additions) 
        {
            for(const addition of this._additions.values()) 
            {
                addition.dispose();
            }

            this._additions = null;
        }

        super.dispose();
        this._disposed = true;
    }

    /**
     * The figure as the camera's payload describes it: one record per body part, plus one per
     * effect sprite, plus the shadow.
     *
     * Not what the room draws. A drawn avatar is one composed bitmap (or, in sprite-parts mode, a
     * pool of textures) and carries no asset names the far end could resolve — `getAvatarLibraryAssetName()`
     * answers `avatar_<id>`, which exists only so `SpriteDataCollector` can find the drawn sprite's
     * depth. The names the server redraws the figure from (`h_std_bd_1_2_0`) are produced here,
     * by re-rendering every body part through `AvatarImageCache` with its camera flag set — that is
     * what `getServerRenderData()` collects and clears.
     *
     * The scale is AS3's hard-coded 64 and not the geometry's: these offsets are read by a renderer
     * that has no geometry, so the payload is always in large-scale space.
     *
     * The shadow record is kept as AS3 writes it, `name` included — and `assetName` is a field
     * `updateShadow()` never assigns (it sets `libraryAssetName`), so that record reaches
     * `getFurniData()` with an empty name and is dropped by its own `name.length > 0` filter. The
     * bug is AS3's; it is kept because the photo has to match what Flash produced.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::getSpriteList()
    override getSpriteList(): RoomObjectSpriteData[] | null
    {
        if(this._activeAvatarImage === null) return null;

        const shadowSprite = this.getSprite(AvatarVisualization.SPRITE_INDEX_SHADOW);
        let shadowData: RoomObjectSpriteData | null = null;

        if(shadowSprite)
        {
            shadowData = new RoomObjectSpriteData();

            shadowData.alpha = shadowSprite.alpha;
            shadowData.x = shadowSprite.offsetX;
            shadowData.y = shadowSprite.offsetY;
            shadowData.name = shadowSprite.assetName;
            shadowData.width = shadowSprite.width;
            shadowData.height = shadowSprite.height;
        }

        const result = this._activeAvatarImage.getServerRenderData();
        const scale = AvatarVisualization.SERVER_RENDER_SCALE;

        for(const spriteData of this._activeAvatarImage.getSprites())
        {
            const data = new RoomObjectSpriteData();
            const layerData = this._activeAvatarImage.getLayerData(spriteData);
            const direction = this._activeAvatarImage.getDirection();

            let animFrame = 0;
            let dx = spriteData.getDirectionOffsetX(direction);
            let dy = spriteData.getDirectionOffsetY(direction);
            const dz = spriteData.getDirectionOffsetZ(direction);
            let dd = 0;

            if(spriteData.hasDirections) dd = direction;

            if(layerData != null)
            {
                animFrame = layerData.animationFrame;
                dx = dx + layerData.dx;
                dy = dy + layerData.dy;
                dd = dd + layerData.dd;
            }

            if(dd < 0) dd = dd + 8;
            else if(dd > 7) dd = dd - 8;

            const assetName = `${this._activeAvatarImage.getScale()}_${spriteData.member}_${dd}_${animFrame}`;
            const asset = this._activeAvatarImage.getAsset(assetName);

            if(asset === null) continue;

            // Same sign as the in-room path above: AS3 negates the Flash library's `<offset>`, and
            // this port's assets arrive with that negation already applied.
            data.x = asset.offsetX - scale / 2 + dx;
            data.y = asset.offsetY + dy;

            if(spriteData.hasStaticY)
            {
                data.y = data.y + (this._verticalOffset * scale) / (2 * AvatarVisualization.BASE_Y_SCALE);
            }

            if(spriteData.ink === 33) data.blendMode = 'add';

            data.name = assetName;
            data.z = this._isSittingManual
                ? AvatarVisualization.AVATAR_SPRITE_LAYING_DEPTH - 0.001 * this.spriteCount * dz
                : -(0.001 * this.spriteCount * dz);

            // AS3 falls back to 60x60 for an asset with no rectangle; a `GraphicAsset` always has
            // its frame, so that branch has no counterpart here.
            data.width = asset.width;
            data.height = asset.height;

            result.push(data);
        }

        // A greyscale palette (the "ghost" transform) is applied to the figure but not to its
        // effects or its shadow, which keep their own colours.
        const avatarData = this._activeAvatarImage.avatarSpriteData;

        if(avatarData != null && avatarData.paletteIsGrayscale)
        {
            const red = avatarData.reds[0].toString();

            for(const data of result)
            {
                if(data.name.indexOf('h_std_fx') === -1 && data.name.indexOf('h_std_sd') === -1)
                {
                    data.color = red;
                }
            }
        }

        if(shadowData) result.push(shadowData);

        return result;
    }

    /**
     * Reads all avatar-related properties from the room object model and
     * detects changes for incremental updates.
     *
     * @param model - The room object model
     * @param scale - The current visualization scale
     * @param isFullUpdate - Whether a full update was requested
     * @returns True if any model properties changed
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::updateModel()
    private updateModel(model: IRoomObjectModel, scale: number, isFullUpdate: boolean): boolean 
    {
        let changed = false;
        let boolValue: boolean;
        // AS3 reads every one of these through a single `int` local (`_loc9_`), so a key the model
        // was never given comes back `undefined`, becomes NaN, and is coerced to 0 on assignment.
        // TypeScript has no such coercion: the NaN survives, and `NaN !== anything` makes the
        // comparison below it fire on every update. That is what pinned a guide bubble over every
        // avatar in the room — `figure_guide_status` is only ever written by
        // RoomObjectAvatarGuideStatusUpdateMessage, so for everyone else it read NaN, and NaN is
        // not AvatarGuideStatus.NONE. Hence the `| 0` on each read: `int(NaN) === 0`.
        // getNumber() itself must keep returning NaN — FurnitureFloorHoleLogic tests for it,
        // exactly as its AS3 does — so the coercion belongs here, where AS3 puts it.
        let numValue: number;
        let strValue: string;

        if(model.getUpdateID() !== this._updateModelCounter) 
        {
            // Talking
            boolValue = (model.getNumber(RoomObjectVariableEnum.AVATAR_TALK) > 0) && isFullUpdate;

            if(boolValue !== this._isTalking) 
            {
                this._isTalking = boolValue;
                changed = true;
            }

            // Expression
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_EXPRESSION) | 0;

            if(numValue !== this._expressionType) 
            {
                this._expressionType = numValue;
                changed = true;
            }

            // Sleeping
            boolValue = model.getNumber(RoomObjectVariableEnum.AVATAR_SLEEP) > 0;

            if(boolValue !== this._isSleeping) 
            {
                this._isSleeping = boolValue;
                changed = true;
            }

            // Blinking
            boolValue = (model.getNumber(RoomObjectVariableEnum.AVATAR_BLINK) > 0) && isFullUpdate;

            if(boolValue !== this._isBlinking) 
            {
                this._isBlinking = boolValue;
                changed = true;
            }

            // Gesture
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_GESTURE) | 0;

            if(numValue !== this._gesture) 
            {
                this._gesture = numValue;
                changed = true;
            }

            // Posture
            strValue = model.getString(RoomObjectVariableEnum.AVATAR_POSTURE);

            if(strValue !== this._posture) 
            {
                this._posture = strValue;
                changed = true;
            }

            // Posture parameter
            strValue = model.getString(RoomObjectVariableEnum.AVATAR_POSTURE_PARAMETER);

            if(strValue !== this._postureParameter) 
            {
                this._postureParameter = strValue;
                changed = true;
            }

            // Can stand up (effect just applied)
            boolValue = model.getNumber(RoomObjectVariableEnum.AVATAR_CAN_STAND_UP) > 0;

            if(boolValue !== this._effectJustApplied) 
            {
                this._effectJustApplied = boolValue;
                changed = true;
            }

            // Vertical offset
            numValue = (model.getNumber(RoomObjectVariableEnum.AVATAR_VERTICAL_OFFSET) * AvatarVisualization.BASE_Y_SCALE) | 0;

            if(numValue !== this._verticalOffset) 
            {
                this._verticalOffset = numValue;
                changed = true;
            }

            // Dance
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_DANCE) | 0;

            if(numValue !== this._danceStyle) 
            {
                this._danceStyle = numValue;
                changed = true;
            }

            // Effect
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_EFFECT) | 0;

            if(numValue !== this._effectType) 
            {
                this._effectType = numValue;
                changed = true;
            }

            // Carry object
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_CARRY_OBJECT) | 0;

            if(numValue !== this._carryObjectType) 
            {
                this._carryObjectType = numValue;
                changed = true;
            }

            // Use object
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_USE_OBJECT) | 0;

            if(numValue !== this._useObjectType) 
            {
                this._useObjectType = numValue;
                changed = true;
            }

            // Head direction
            numValue = model.getNumber(RoomObjectVariableEnum.HEAD_DIRECTION) | 0;

            if(numValue !== this._currentHeadAngleDeg) 
            {
                this._currentHeadAngleDeg = numValue;
                changed = true;
            }

            // Alpha multiplier
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_ALPHA_MULTIPLIER);

            if(isNaN(numValue)) numValue = 1;

            if(numValue !== this._alphaMultiplier)
            {
                this._alphaMultiplier = numValue;
                changed = true;
            }

            // Use object synchronization with carry object
            if(this._carryObjectType > 0 && model.getNumber(RoomObjectVariableEnum.AVATAR_USE_OBJECT) > 0)
            {
                if(this._useObjectType !== this._carryObjectType) 
                {
                    this._useObjectType = this._carryObjectType;
                    changed = true;
                }
            }
            else 
            {
                if(this._useObjectType !== 0) 
                {
                    this._useObjectType = 0;
                    changed = true;
                }
            }

            // Sleeping idle Z addition
            const idleAddition = this.getAddition(AvatarVisualization.ADDITION_ID_IDLE_BUBBLE) as FloatingIdleZ | null;

            if(this._isSleeping) 
            {
                if(!idleAddition) 
                {
                    this.addAddition(new FloatingIdleZ(AvatarVisualization.ADDITION_ID_IDLE_BUBBLE, this));
                }

                changed = true;
            }
            else 
            {
                if(idleAddition) 
                {
                    this.removeAddition(AvatarVisualization.ADDITION_ID_IDLE_BUBBLE);
                }
            }

            // Muted bubble addition
            boolValue = model.getNumber(RoomObjectVariableEnum.AVATAR_IS_MUTED) > 0;
            const mutedAddition = this.getAddition(AvatarVisualization.ADDITION_ID_MUTED_BUBBLE) as MutedBubble | null;

            if(boolValue) 
            {
                if(!mutedAddition) 
                {
                    this.addAddition(new MutedBubble(AvatarVisualization.ADDITION_ID_MUTED_BUBBLE, this));
                }

                this.removeAddition(AvatarVisualization.ADDITION_ID_TYPING_BUBBLE);
                changed = true;
            }
            else 
            {
                if(mutedAddition) 
                {
                    this.removeAddition(AvatarVisualization.ADDITION_ID_MUTED_BUBBLE);
                    changed = true;
                }

                // Typing bubble addition (only if not muted)
                boolValue = model.getNumber(RoomObjectVariableEnum.AVATAR_IS_TYPING) > 0;
                const typingAddition = this.getAddition(AvatarVisualization.ADDITION_ID_TYPING_BUBBLE) as TypingBubble | null;

                if(boolValue) 
                {
                    if(!typingAddition) 
                    {
                        this.addAddition(new TypingBubble(AvatarVisualization.ADDITION_ID_TYPING_BUBBLE, this));
                    }

                    changed = true;
                }
                else 
                {
                    if(typingAddition) 
                    {
                        this.removeAddition(AvatarVisualization.ADDITION_ID_TYPING_BUBBLE);
                    }
                }
            }

            // Guide status bubble addition
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_GUIDE_STATUS) | 0;

            if(numValue !== AvatarGuideStatus.NONE) 
            {
                this.removeAddition(AvatarVisualization.ADDITION_ID_GUIDE_STATUS_BUBBLE);
                this.addAddition(new GuideStatusBubble(AvatarVisualization.ADDITION_ID_GUIDE_STATUS_BUBBLE, this, numValue));
                changed = true;
            }
            else 
            {
                if(this.getAddition(AvatarVisualization.ADDITION_ID_GUIDE_STATUS_BUBBLE) as GuideStatusBubble | null) 
                {
                    this.removeAddition(AvatarVisualization.ADDITION_ID_GUIDE_STATUS_BUBBLE);
                    changed = true;
                }
            }

            // Game click target addition
            boolValue = model.getNumber(RoomObjectVariableEnum.AVATAR_IS_PLAYING_GAME) > 0;
            const gameAddition = this.getAddition(AvatarVisualization.ADDITION_ID_GAME_CLICK_TARGET) as GameClickTarget | null;

            if(boolValue) 
            {
                if(!gameAddition) 
                {
                    this.addAddition(new GameClickTarget(AvatarVisualization.ADDITION_ID_GAME_CLICK_TARGET));
                }

                changed = true;
            }
            else 
            {
                if(gameAddition) 
                {
                    this.removeAddition(AvatarVisualization.ADDITION_ID_GAME_CLICK_TARGET);
                }
            }

            // Number bubble addition
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_NUMBER_VALUE) | 0;
            const numberAddition = this.getAddition(AvatarVisualization.ADDITION_ID_NUMBER_BUBBLE) as NumberBubble | null;

            if(numValue > 0) 
            {
                if(!numberAddition) 
                {
                    this.addAddition(new NumberBubble(AvatarVisualization.ADDITION_ID_NUMBER_BUBBLE, numValue, this));
                }

                changed = true;
            }
            else 
            {
                if(numberAddition) 
                {
                    this.removeAddition(AvatarVisualization.ADDITION_ID_NUMBER_BUBBLE);
                }
            }

            // Habbicon bubble addition
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_HABBICON) | 0;

            const habbiconTriggerSequence = model.getNumber(RoomObjectVariableEnum.AVATAR_HABBICON_TRIGGER_SEQUENCE) | 0;

            // The bubble now lives INSIDE the stack rather than holding a sprite of its own, so it
            // is reached through the stack's owner and not through `getAddition()`.
            const stackedAdditions = this.getStackedAdditions(numValue > 0);
            const habbiconAddition = stackedAdditions === null ? null : stackedAdditions.habbicon;

            if(numValue > 0 && stackedAdditions !== null)
            {
                // The trigger sequence is in the test, not just the id: triggering the *same*
                // Habbicon twice must replay it, and without this the second trigger would find a
                // matching bubble already up and do nothing.
                if(!habbiconAddition
                    || habbiconAddition.habbiconId !== numValue
                    || habbiconAddition.triggerSequence !== habbiconTriggerSequence)
                {
                    stackedAdditions.setHabbicon(new HabbiconBubble(
                        AvatarVisualization.ADDITION_ID_HABBICON_BUBBLE, numValue, habbiconTriggerSequence, this
                    ));
                }

                changed = true;
            }
            else if(habbiconAddition && stackedAdditions !== null)
            {
                stackedAdditions.clearHabbicon();

                // The stack only exists to carry things; with nothing left in it, it goes too.
                if(stackedAdditions.isEmpty) this.removeAddition(AvatarVisualization.ADDITION_ID_STACKED_ADDITIONS);

                changed = true;
            }

            if(this.reconcileVariableFxStatuses(model.getObject(RoomObjectVariableEnum.VARIABLE_FX_STATUSES))) changed = true;

            // Habbicon spin. It turns the avatar, not the bubble, so it only has to be noticed
            // here; the angles are recomputed further down from the value stored now.
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_HABBICON_SPIN_OFFSET) | 0;

            if(numValue !== this._habbiconSpinOffset)
            {
                this._habbiconSpinOffset = numValue;
                changed = true;
            }

            // Expression addition
            numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_EXPRESSION) | 0;
            const expressionAddition = this.getAddition(AvatarVisualization.ADDITION_ID_EXPRESSION);

            if(numValue > 0) 
            {
                if(!expressionAddition) 
                {
                    const newExpression = ExpressionAdditionFactory.make(AvatarVisualization.ADDITION_ID_EXPRESSION, numValue, this);

                    if(newExpression) 
                    {
                        this.addAddition(newExpression);
                    }
                }
            }
            else 
            {
                if(expressionAddition) 
                {
                    this.removeAddition(AvatarVisualization.ADDITION_ID_EXPRESSION);
                }
            }

            this.validateActions(scale);

            // Gender
            strValue = model.getString(RoomObjectVariableEnum.AVATAR_GENDER);

            if(strValue !== this._gender) 
            {
                this._gender = strValue;
                changed = true;
            }

            // Figure
            const figureStr = model.getString(RoomObjectVariableEnum.AVATAR_FIGURE);

            if(this.updateFigure(figureStr)) 
            {
                changed = true;
            }

            // Sign
            if(model.hasNumber(RoomObjectVariableEnum.AVATAR_SIGN)) 
            {
                numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_SIGN) | 0;

                if(numValue !== this._signType) 
                {
                    changed = true;
                    this._signType = numValue;
                }
            }

            // Blocked
            if(model.hasNumber(RoomObjectVariableEnum.AVATAR_BLOCKED))
            {
                if(this.updateBlocked(model.getNumber(RoomObjectVariableEnum.AVATAR_BLOCKED) > 0))
                {
                    changed = true;
                }
            }

            // Highlight enable
            boolValue = model.getNumber(RoomObjectVariableEnum.AVATAR_HIGHLIGHT_ENABLE) > 0;

            if(boolValue !== this._mouseHighlightEnabled) 
            {
                this._mouseHighlightEnabled = boolValue;
                changed = true;
            }

            // Highlight value
            if(this._mouseHighlightEnabled) 
            {
                numValue = model.getNumber(RoomObjectVariableEnum.AVATAR_MOUSE_HIGHLIGHT) | 0;

                if(numValue !== this._mouseHighlight) 
                {
                    this._mouseHighlight = numValue;
                    changed = true;
                }
            }

            // Own user
            boolValue = model.getNumber(RoomObjectVariableEnum.AVATAR_OWN_USER) > 0;

            if(boolValue !== this._isOwnAvatar) 
            {
                this._isOwnAvatar = boolValue;
                changed = true;
            }

            this._updateModelCounter = model.getUpdateID();

            return changed;
        }

        return false;
    }

    /**
     * Checks if the figure string changed and resets images if so.
     *
     * @param figure - The new figure string
     * @returns True if the figure changed
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::updateFigure()
    private updateFigure(figure: string): boolean 
    {
        if(this._figure !== figure) 
        {
            this._figure = figure;
            this.resetImages();

            return true;
        }

        return false;
    }

    /**
     * Which way the habbicon bubble should face: 1 (right), -1 (left) or 0 (neither).
     *
     * The eight avatar directions collapse to three, because the bubble's sprites only exist
     * facing left and right. `HabbiconBubble` is the caller, and it asks exactly once per bubble:
     * an avatar that turns while its Habbicon is up must not flip the icon mid-animation.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::get habbiconFacingDirection()
    public get habbiconFacingDirection(): number
    {
        if(this._activeAvatarImage === null) return 0;

        return AvatarVisualization.resolveHabbiconFacingDirection(this._activeAvatarImage.getDirection());
    }

    /**
     * Folds one of the eight avatar directions onto the habbicon bubble's three.
     *
     * The modulo is doubled because AS3's `%` keeps the sign of a negative direction, exactly as
     * TypeScript's does — `(d % 8 + 8) % 8` is what makes -1 read as 7.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::resolveHabbiconFacingDirection()
    private static resolveHabbiconFacingDirection(direction: number): number
    {
        const normalized = (direction % 8 + 8) % 8;

        if(normalized <= 2) return 1;

        if(normalized >= 4 && normalized <= 6) return -1;

        return 0;
    }

    /**
     * Switches between the real avatar and the blocked silhouette.
     *
     * The cached images have to go: they were built by whichever branch was in force, and the
     * two are different classes — keeping them would leave the user's real figure on screen
     * after a block, and the silhouette on screen after an unblock.
     *
     * @returns True when the flag actually changed, so the caller re-renders.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::updateBlocked()
    private updateBlocked(blocked: boolean): boolean
    {
        if(this._blocked !== blocked)
        {
            this._blocked = blocked;
            this.resetImages();

            return true;
        }

        return false;
    }

    /**
     * Disposes all cached avatar images and resets the active image.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::resetImages()
    private resetImages(): void 
    {
        for(const image of this._avatarImages.values()) 
        {
            if(image) 
            {
                image.dispose();
            }
        }

        for(const image of this._avatarImagesWithEffect.values()) 
        {
            if(image) 
            {
                image.dispose();
            }
        }

        this._avatarImages.clear();
        this._avatarImagesWithEffect.clear();
        this._activeAvatarImage = null;

        const mainSprite = this.getSprite(AvatarVisualization.SPRITE_INDEX_AVATAR);

        if(mainSprite != null) 
        {
            mainSprite.texture = null;
            mainSprite.alpha = 255;
        }
    }

    /**
     * Validates and adjusts action-related properties based on scale and posture.
     *
     * @param scale - The current visualization scale
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::validateActions()
    private validateActions(scale: number): void 
    {
        if(scale < 48) 
        {
            this._isBlinking = false;
        }

        if(this._posture === 'sit' || this._posture === 'lay') 
        {
            this._sitOffset = scale / 2;
        }
        else 
        {
            this._sitOffset = 0;
        }

        this._isLaying = false;
        this._isSittingManual = false;

        if(this._posture === 'lay') 
        {
            this._isSittingManual = true;
            const param = parseInt(this._postureParameter, 10);

            if(param < 0) 
            {
                this._isLaying = true;
            }
        }
    }

    /**
     * Gets or creates an avatar image for the given scale and effect type.
     * Caches images by scale key. Images with effects are cached separately
     * with a limited cache size.
     *
     * @param scale - The rendering scale
     * @param effectType - The avatar effect type (0 for none)
     * @returns The avatar image, or null if creation failed
     */
    private getAvatarImageForScale(scale: number, effectType: number): IAvatarImage | null 
    {
        let key = `avatarImage${scale}`;
        let image: IAvatarImage | null;

        if(effectType === 0) 
        {
            image = this._avatarImages.get(key) ?? null;
        }
        else 
        {
            key = `${key}-${effectType}`;
            image = this._avatarImagesWithEffect.get(key) ?? null;

            if(image) 
            {
                image.resetAnimationFrameCounter();
            }
        }

        if(image == null) 
        {
            image = this._visualizationData!.createAvatarImage(
                this._figure, scale, this._gender, this, this, this._blocked
            );

            if(image != null) 
            {
                if(effectType === 0) 
                {
                    this._avatarImages.set(key, image);
                }
                else 
                {
                    if(this._avatarImagesWithEffect.size >= AvatarVisualization.MAX_AVATARS_WITH_EFFECT) 
                    {
                        const firstKey = this._avatarImagesWithEffect.keys().next().value;

                        if(firstKey !== undefined) 
                        {
                            const oldImage = this._avatarImagesWithEffect.get(firstKey);
                            this._avatarImagesWithEffect.delete(firstKey);

                            if(oldImage) 
                            {
                                oldImage.dispose();
                            }
                        }
                    }

                    this._avatarImagesWithEffect.set(key, image);
                }
            }
        }

        return image;
    }

    /**
     * Updates the body and head direction of the avatar based on the
     * room object direction and room geometry.
     *
     * @param roomObject - The room object
     * @param geometry - The room geometry
     * @param isFullUpdate - Whether a full update was requested
     * @param forceUpdate - Whether to force direction recalculation
     * @returns True if the direction changed
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::updateObject()
    private updateObject(roomObject: IRoomObject, geometry: IRoomGeometry, isFullUpdate: boolean, forceUpdate: boolean = false): boolean 
    {
        if(forceUpdate || roomObject.getUpdateID() !== this._direction || this._geometryUpdateCounter !== geometry.updateId) 
        {
            let updated = isFullUpdate;

            let bodyAngle = roomObject.getDirection().x - geometry.direction.x;
            bodyAngle = ((bodyAngle % 360) + 360) % 360;

            if(this._posture === 'sit' && this._effectJustApplied) 
            {
                bodyAngle = bodyAngle - ((bodyAngle % 90) - 45);
            }

            let headAngle = this._currentHeadAngleDeg;

            if(this._posture === 'float') 
            {
                headAngle = bodyAngle;
            }
            else 
            {
                headAngle = headAngle - geometry.direction.x;
            }

            headAngle = ((headAngle % 360) + 360) % 360;

            if(this._posture === 'sit' && this._effectJustApplied)
            {
                headAngle = headAngle - ((headAngle % 90) - 45);
            }

            // A spinning Habbicon turns the whole avatar, body and head together, on top of
            // whatever direction it already had — which is why this lands here, after the posture
            // snapping and before the two angles are compared against what is on screen.
            if(this._habbiconSpinOffset !== 0)
            {
                bodyAngle = AvatarVisualization.normalizeDirectionAngle(bodyAngle + this._habbiconSpinOffset);
                headAngle = AvatarVisualization.normalizeDirectionAngle(headAngle + this._habbiconSpinOffset);
            }

            if(bodyAngle !== this._angle || forceUpdate)
            {
                updated = true;
                this._angle = bodyAngle;

                let dirAngle = bodyAngle - (135 - 22.5);
                dirAngle = (dirAngle + 360) % 360;

                this._activeAvatarImage!.setDirectionAngle(AvatarSetType.FULL, dirAngle);
            }

            if(headAngle !== this._currentHeadAngle || forceUpdate) 
            {
                updated = true;
                this._currentHeadAngle = headAngle;

                if(this._currentHeadAngle !== this._angle) 
                {
                    let dirAngle = headAngle - (135 - 22.5);
                    dirAngle = (dirAngle + 360) % 360;

                    this._activeAvatarImage!.setDirectionAngle(AvatarSetType.HEAD, dirAngle);
                }
            }

            this._direction = roomObject.getUpdateID();
            this._geometryUpdateCounter = geometry.updateId;

            return updated;
        }

        return false;
    }

    /**
     * Updates the shadow sprite based on the current posture and scale.
     *
     * @param scale - The current visualization scale
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::updateShadow()
    private updateShadow(scale: number): void 
    {
        const shadowSprite = this.getSprite(AvatarVisualization.SPRITE_INDEX_SHADOW);

        this._shadowAssetName = null;

        const showShadow = (
            this._posture === 'mv' ||
            this._posture === 'std' ||
            (this._posture === 'sit' && this._effectJustApplied)
        );

        if(this._effectType === AvatarVisualization.SNOWBOARDING_EFFECT || this._effectType === AvatarVisualization.FREEZE_EFFECT) 
        {
            // Don't show shadow for specific effect type
            shadowSprite!.visible = false;
            return;
        }

        if(showShadow && shadowSprite) 
        {
            shadowSprite.visible = true;

            let offsetX: number;
            let offsetY: number;

            if(scale < 48) 
            {
                shadowSprite.libraryAssetName = 'sh_std_sd_1_0_0';
                this._shadowAssetName = shadowSprite.libraryAssetName;
                offsetX = -8;
                offsetY = this._effectJustApplied ? 6 : -3;
            }
            else 
            {
                shadowSprite.libraryAssetName = 'h_std_sd_1_0_0';
                this._shadowAssetName = shadowSprite.libraryAssetName;
                offsetX = -17;
                offsetY = this._effectJustApplied ? 10 : -7;
            }

            if(this._shadowAssetName != null) 
            {
                shadowSprite.offsetX = offsetX;
                shadowSprite.offsetY = offsetY;
                shadowSprite.alpha = 50;
                shadowSprite.relativeDepth = 1;
            }
            else 
            {
                shadowSprite.visible = false;
            }
        }
        else if(shadowSprite) 
        {
            this._shadowAssetName = null;
            shadowSprite.visible = false;
        }
    }

    /**
     * Applies all current action states (posture, gesture, dance, carry, etc.)
     * to the active avatar image and recalculates sprite counts.
     *
     * @param avatarImage - The avatar image to apply actions to
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::updateActions()
    private updateActions(avatarImage: IAvatarImage): void 
    {
        if(avatarImage == null) 
        {
            return;
        }

        avatarImage.initActionAppends();
        avatarImage.appendAction(AvatarAction.POSTURE, this._posture, this._postureParameter);

        if(this._gesture > 0) 
        {
            avatarImage.appendAction(AvatarAction.GESTURE, AvatarAction.getGesture(this._gesture));
        }

        if(this._danceStyle > 0) 
        {
            avatarImage.appendAction(AvatarAction.EXPRESSION_JUMP, this._danceStyle);
        }

        if(this._signType > -1) 
        {
            avatarImage.appendAction(AvatarAction.SIGN, this._signType);
        }

        if(this._carryObjectType > 0) 
        {
            avatarImage.appendAction(AvatarAction.CARRY_OBJECT, this._carryObjectType);
        }

        if(this._useObjectType > 0) 
        {
            avatarImage.appendAction(AvatarAction.USE_OBJECT, this._useObjectType);
        }

        if(this._isTalking) 
        {
            avatarImage.appendAction(AvatarAction.TALK);
        }

        if(this._isSleeping || this._isBlinking) 
        {
            avatarImage.appendAction(AvatarAction.SLEEP);
        }

        if(this._expressionType > 0) 
        {
            const expression = AvatarAction.getExpression(this._expressionType);

            if(expression !== '') 
            {
                switch(expression) 
                {
                    case AvatarAction.EXPRESSION_JUMP:
                        avatarImage.appendAction(AvatarAction.EXPRESSION_JUMP, 2);
                        break;
                    default:
                        avatarImage.appendAction(expression);
                }
            }
        }

        if(this._effectType > 0) 
        {
            avatarImage.appendAction(AvatarAction.EFFECT, this._effectType);
        }

        avatarImage.endActionAppends();

        this._isAnimating = avatarImage.isAnimating();

        // Count needed sprites for extra animation layers
        let spriteCount = AvatarVisualization.INITIAL_RESERVED_SPRITES;

        for(const spriteData of this._activeAvatarImage!.getSprites()) 
        {
            if(spriteData.id !== AvatarVisualization.AVATAR) 
            {
                spriteCount++;
            }
        }

        if(spriteCount !== this.spriteCount) 
        {
            this.createSprites(spriteCount);
        }

        this._extraSpritesStartIndex = spriteCount;

        // Add sprites for additions
        if(this._additions)
        {
            for(const _addition of this._additions.values())
            {
                this.addSprite();
            }
        }

        // The part block sits past the additions, and the count above was rebuilt without it, so it
        // has to be re-reserved here or every pass would dispose and recreate it — the churn this
        // whole path exists to remove.
        if(this._partSpriteCount > 0)
        {
            this._partSpritesStartIndex = this.spriteCount;
            this.createSprites(this.spriteCount + this._partSpriteCount);
        }
    }

    /**
	 * The avatar's bounding box, with the canvas rectangle sprite 0 stands for put back in.
	 *
	 * `RoomObjectSpriteVisualization.boundingRectangle` counts a sprite only when it has an asset —
	 * AS3's own test, and correct there, because AS3 has exactly one avatar sprite and it always
	 * carries the composed 90x130 canvas image. `AvatarRenderMode.spriteParts` (TS-only: Flash had
	 * no GPU to batch for) replaces that image with one room sprite per body part and leaves sprite
	 * 0 as a textureless anchor, so the base class drops it and the box collapses to a tight union
	 * of the drawn parts.
	 *
	 * The canvas is deliberately taller than the figure — `HabboAvatarGeometry.xml` gives the `h`
	 * scale 90x130 so lay and swim fit — and consumers are calibrated against that slack.
	 * `AvatarContextInfoView.getOffset()` adds a flat `+25` for a user, which is the AS3 way of
	 * sinking the name bubble into the empty headroom; against a tight box that 25px lands on the
	 * avatar's hair instead. `rect.height` also decides that method's `> 50` branch and
	 * `getMaximumVerticalLead()`'s 5% clamp.
	 *
	 * So the override is not a correction to AS3 — it restores what AS3 measures, on a rendering
	 * path AS3 does not have.
	 */
    // DEVIATION: the base method is a faithful port and stays untouched; this compensates the
    //   TS-only sprite-parts path, which is the only reason sprite 0 can lack a texture. Null
    //   `_anchorRectangle` (the composed path) makes this a straight pass-through.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/RoomObjectSpriteVisualization.as::get boundingRectangle()
    public override get boundingRectangle(): { x: number; y: number; width: number; height: number }
    {
        const bounds = super.boundingRectangle;
        const anchor = this._anchorRectangle;

        if(anchor === null) return bounds;

        const left = Math.min(bounds.x, anchor.x);
        const top = Math.min(bounds.y, anchor.y);
        const right = Math.max(bounds.x + bounds.width, anchor.x + anchor.width);
        const bottom = Math.max(bounds.y + bounds.height, anchor.y + anchor.height);

        this._unionBounds.x = left;
        this._unionBounds.y = top;
        this._unionBounds.width = right - left;
        this._unionBounds.height = bottom - top;

        return this._unionBounds;
    }

    /**
     * Updates the main avatar composite sprite (index 0) with the rendered
     * avatar image, position offsets, and depth.
     *
     * @param model - The room object model for highlight checking
     * @param geometry - The room geometry
     * @param offsets - The canvas offset array [x, y, z]
     * @param fullUpdate - Whether this is a full sprite update
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::update()
    private updateMainSprite(model: IRoomObjectModel, geometry: IRoomGeometry, offsets: number[], _fullUpdate: boolean): void
    {
        const mainSprite = this.getSprite(0);

        if(mainSprite == null) return;

        const scale = geometry.scale;
        const isHighlighted = (
            model.getNumber(RoomObjectVariableEnum.AVATAR_HIGHLIGHT_ENABLE) === 1 &&
            model.getNumber(RoomObjectVariableEnum.AVATAR_MOUSE_HIGHLIGHT) === 1
        );

        // The sprite path asks for parts rather than an image; it declines — returning null — for an
        // avatar it cannot express, such as one wearing a palette effect, and that avatar composes.
        const partSet = AvatarRenderMode.spriteParts
            ? this._activeAvatarImage!.getPartSprites(AvatarSetType.FULL)
            : null;

        if(partSet !== null)
        {
            // Nothing composed, so nothing to draw here: this sprite becomes the parts' anchor, and
            // they inherit its offsets and depth. The dimensions the offsets need are the avatar
            // canvas's, which is exactly what the composed texture would have measured.
            mainSprite.texture = null;
            mainSprite.offsetX = (((-1 * scale) / 2) + offsets[0]) - ((partSet.width - scale) / 2);
            mainSprite.offsetY = ((-partSet.height + (scale / 4)) + offsets[1]) + this._sitOffset;

            // Remember the rectangle the composed texture would have occupied — see
            // `boundingRectangle` below for why a textureless anchor is not enough.
            this._anchorRectangle = {
                x: mainSprite.offsetX,
                y: mainSprite.offsetY,
                width: partSet.width,
                height: partSet.height,
            };
        }
        else
        {
            this._anchorRectangle = null;

            const image = this._activeAvatarImage!.getImage(AvatarSetType.FULL, isHighlighted);

            if(image != null)
            {
                mainSprite.texture = image;
            }

            if(mainSprite.texture)
            {
                mainSprite.offsetX = (((-1 * scale) / 2) + offsets[0]) - ((mainSprite.width - scale) / 2);
                mainSprite.offsetY = ((-mainSprite.height + (scale / 4)) + offsets[1]) + this._sitOffset;
            }
        }

        if(this._isSittingManual) 
        {
            if(this._isLaying) 
            {
                mainSprite.relativeDepth = -0.5;
            }
            else 
            {
                mainSprite.relativeDepth = AvatarVisualization.AVATAR_SPRITE_LAYING_DEPTH + offsets[2];
            }
        }
        else 
        {
            mainSprite.relativeDepth = AvatarVisualization.AVATAR_SPRITE_DEFAULT_DEPTH + offsets[2];
        }

        if(this._isOwnAvatar) 
        {
            mainSprite.relativeDepth = mainSprite.relativeDepth - AvatarVisualization.AVATAR_OWN_DEPTH_ADJUST;
            mainSprite.spriteType = RoomObjectSpriteType.AVATAR_OWN;
        }
        else 
        {
            mainSprite.spriteType = RoomObjectSpriteType.AVATAR;
        }

        // Placed after the depth block on purpose: the parts take their depth, sprite type and alpha
        // from the sprite above, so sitting, laying, the own-avatar adjustment and the placeholder
        // fade all reach them without any of that logic being restated here.
        if(partSet !== null)
        {
            this.updatePartSprites(partSet, mainSprite);
        }
        else if(this._partSpriteCount > 0)
        {
            this.createSprites(this._partSpritesStartIndex);
            this._partSpriteCount = 0;
        }

        // Update typing bubble depth
        const typingAddition = this.getAddition(AvatarVisualization.ADDITION_ID_TYPING_BUBBLE) as TypingBubble | null;

        if(typingAddition) 
        {
            if(!this._isSittingManual) 
            {
                typingAddition.relativeDepth = (AvatarVisualization.AVATAR_SPRITE_DEFAULT_DEPTH - 0.01) + offsets[2];
            }
            else 
            {
                typingAddition.relativeDepth = (AvatarVisualization.AVATAR_SPRITE_LAYING_DEPTH - 0.01) + offsets[2];
            }
        }
    }

    /**
     * Lays the avatar's parts out as ordinary room sprites, in a block of their own past the
     * additions.
     *
     * A block rather than a rewrite of the indices: sprite 0 stays the avatar and 1 the shadow, the
     * additions keep `_extraSpritesStartIndex`, and nothing that reads a fixed index has to learn
     * that an avatar can now occupy several. Only `updateActions()`, which owns the sprite count,
     * has to know the block exists so it stops truncating it.
     *
     * Depth steps down by a hair per part instead of leaning on the renderer's index tiebreak, which
     * runs the other way — it sorts descending by z, so a *lower* index draws in front. Being
     * explicit costs nothing and does not depend on that staying true.
     */
    // TS-only: no AS3 counterpart; see `AvatarRenderMode`.
    private updatePartSprites(set: IAvatarPartSpriteSet, mainSprite: IRoomObjectSprite): void
    {
        const count = set.parts.length;
        const start = this._partSpriteCount > 0 ? this._partSpritesStartIndex : this.spriteCount;

        if(count !== this._partSpriteCount)
        {
            this._partSpritesStartIndex = start;
            this._partSpriteCount = count;
            this.createSprites(start + count);
        }

        for(let i = 0; i < count; i++)
        {
            const sprite = this.getSprite(start + i);

            if(sprite == null) continue;

            const part = set.parts[i];

            sprite.texture = part.texture;
            sprite.offsetX = mainSprite.offsetX + part.x;
            sprite.offsetY = mainSprite.offsetY + part.y;
            sprite.flipH = part.flipH;
            sprite.color = part.color;
            // Alpha is 0..255 here, and the anchor already carries the placeholder fade.
            sprite.alpha = Math.round(mainSprite.alpha * part.alpha);
            sprite.spriteType = mainSprite.spriteType;
            sprite.relativeDepth = mainSprite.relativeDepth - (i * AvatarVisualization.PART_DEPTH_STEP);
        }
    }

    /**
     * Updates extra animation layer sprites from the avatar image's
     * sprite data containers (effect animations, etc.).
     *
     * @param offsets - The canvas offset array [x, y, z]
     */
    private updateExtraSprites(_offsets: number[]): void 
    {
        if(!this._activeAvatarImage) return;

        const scale = this._scale;
        let spriteIndex = AvatarVisualization.INITIAL_RESERVED_SPRITES;
        const direction = this._activeAvatarImage.getDirection();

        for(const spriteData of this._activeAvatarImage.getSprites()) 
        {
            if(spriteData.id === AvatarVisualization.AVATAR) 
            {
                // Avatar container offsets applied to main sprite
                const mainSprite = this.getSprite(0);
                const layerData = this._activeAvatarImage.getLayerData(spriteData);

                let dx = spriteData.getDirectionOffsetX(direction);
                let dy = spriteData.getDirectionOffsetY(direction);

                if(layerData != null) 
                {
                    dx = dx + layerData.dx;
                    dy = dy + layerData.dy;
                }

                if(scale < 48) 
                {
                    dx = Math.floor(dx / 2);
                    dy = Math.floor(dy / 2);
                }

                if(!this._effectJustApplied && mainSprite) 
                {
                    mainSprite.offsetX = mainSprite.offsetX + dx;
                    mainSprite.offsetY = mainSprite.offsetY + dy;
                }
            }
            else 
            {
                const sprite = this.getSprite(spriteIndex);

                if(sprite != null) 
                {
                    sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;
                    sprite.visible = true;

                    const layerData = this._activeAvatarImage.getLayerData(spriteData);

                    let animFrame = 0;
                    let dx = spriteData.getDirectionOffsetX(direction);
                    let dy = spriteData.getDirectionOffsetY(direction);
                    const dz = spriteData.getDirectionOffsetZ(direction);
                    let dd = 0;

                    if(spriteData.hasDirections) 
                    {
                        dd = direction;
                    }

                    if(layerData != null) 
                    {
                        animFrame = layerData.animationFrame;
                        dx = dx + layerData.dx;
                        dy = dy + layerData.dy;
                        dd = dd + layerData.dd;
                    }

                    if(scale < 48) 
                    {
                        dx = Math.floor(dx / 2);
                        dy = Math.floor(dy / 2);
                    }

                    if(dd < 0) 
                    {
                        dd = dd + 8;
                    }
                    else if(dd > 7) 
                    {
                        dd = dd - 8;
                    }

                    const assetName = `${this._activeAvatarImage.getScale()}_${spriteData.member}_${dd}_${animFrame}`;
                    const asset = this._activeAvatarImage.getAsset(assetName);

                    if(asset == null)
                    {
                        // DEVIATION: AS3 `continue`s here and leaves the sprite shown, holding its
                        //   previous BitmapData — the same staleness this port has, and the same
                        //   bug; Flash simply never had a frame missing from a library it embedded.
                        //   A sprite whose asset the library cannot answer is hidden instead, so a
                        //   missing frame draws nothing rather than the last thing that slot held.
                        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as:1245
                        sprite.visible = false;
                        spriteIndex++;

                        continue;
                    }

                    sprite.assetName = assetName;

                    // A restored line, not a deviation: AS3 assigns BOTH, the name and the picture —
                    // `_loc22_.asset = _loc6_.content as BitmapData` — and this port assigned only
                    // the name. `assetName` is read by nothing here; in Flash it is the cache key
                    // for the coloured and flipped variants, never a lookup. So the sprite kept
                    // whatever texture its pool slot last held, and the pool is shared with the
                    // body-part block: what the fishing rod's line and float drew in-room was a
                    // stale slice of an avatar's own leg standing on the water.
                    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as:1250
                    sprite.texture = asset.texture;

                    // DEVIATION: AS3 writes `-_loc2_.offset.x - _loc8_ / 2 + _loc13_` and this
                    //   copied that sign. It cannot be copied, because the offset no longer comes
                    //   from the same place: AS3 read a Flash asset library's `<offset>`, and this
                    //   port reads a Nitro bundle, where `GraphicAssetCollection.createFromSpritesheet`
                    //   already stores `offsetX = -assetDef.x`. Negating again lands an effect sprite
                    //   mirrored about the object's origin.
                    //
                    //   The body path settles which sign is right, because both have to end up in
                    //   the same space: `AvatarImageCache` takes `-graphicAsset.offsetX` as a part's
                    //   regPoint and `setContainerOffset` negates that in turn, so a body part draws
                    //   at `+asset.offsetX`. An effect sprite has to do the same.
                    //
                    //   Rendered, not reasoned: `vortex-imager` composites effects with `+offsetX`
                    //   and puts Hoverboard's board under the feet and Torch's flame in the hand;
                    //   the AS3 sign put the board some 60px below the avatar with clear air between
                    //   them. Nothing in the room had shown it because effect libraries were not in
                    //   the alias collection until recently, so `getAsset()` returned null here and
                    //   no effect sprite was ever drawn.
                    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualization.as::update()
                    sprite.offsetX = (asset.offsetX - (scale / 2)) + dx;
                    sprite.offsetY = asset.offsetY + dy;

                    if(spriteData.hasStaticY) 
                    {
                        sprite.offsetY = sprite.offsetY + ((this._verticalOffset * scale) / (2 * AvatarVisualization.BASE_Y_SCALE));
                    }
                    else 
                    {
                        sprite.offsetY = sprite.offsetY + this._sitOffset;
                    }

                    if(this._isSittingManual) 
                    {
                        sprite.relativeDepth = AvatarVisualization.AVATAR_SPRITE_LAYING_DEPTH - ((0.001 * this.spriteCount) * dz);
                    }
                    else 
                    {
                        sprite.relativeDepth = AvatarVisualization.AVATAR_SPRITE_DEFAULT_DEPTH - ((0.001 * this.spriteCount) * dz);
                    }

                    if(spriteData.ink === 33) 
                    {
                        sprite.blendMode = 'add';
                    }
                    else 
                    {
                        sprite.blendMode = 'normal';
                    }
                }

                spriteIndex++;
            }
        }
    }
}
