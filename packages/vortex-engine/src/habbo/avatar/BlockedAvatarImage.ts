import type {Texture} from 'pixi.js';
import type {AvatarStructure} from './AvatarStructure';
import type {AssetAliasCollection} from './alias/AssetAliasCollection';
import type {AvatarFigureContainer} from './AvatarFigureContainer';
import {AvatarImage} from './AvatarImage';
import {AvatarAction} from './enum/AvatarAction';

/**
 * The silhouette shown in place of a user this client is blocking.
 *
 * `AvatarRenderManager.createBlockedAvatarImage()` builds it over the fixed figure
 * `hd-99999-99999`, and `AvatarVisualization` tints the sprite grey (0x666666) once
 * `isBlocked()` comes back true, so the avatar reads as a body outline and nothing else.
 *
 * Byte-for-byte the same class as `PlaceholderAvatarImage` in AS3 — same static full-image
 * cache, same reduced action set, same dispose — differing only in which of
 * `isPlaceholder()` / `isBlocked()` it overrides. The cache is deliberately *not* shared
 * between the two: both render `hd-99999-99999` at the same keys, and one cache would hand a
 * blocked avatar the placeholder's texture.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as
export class BlockedAvatarImage extends AvatarImage
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as::_fullImageCache
    private static _fullImageCache: Map<string, Texture> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as::BlockedAvatarImage()
    constructor(
        structure: AvatarStructure,
        aliasCollection: AssetAliasCollection,
        figure: AvatarFigureContainer,
        scale: string,
        effectManager: any | null = null
    )
    {
        super(structure, aliasCollection, figure, scale, effectManager, null);
    }

    /**
	 * Always true — this is the blocked-user silhouette, not a real avatar.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as::isBlocked()
    public override isBlocked(): boolean
    {
        return true;
    }

    /**
	 * Appends an action, but only the postures and actions a silhouette can express.
	 * Posture is restricted to: lay, mv, std, swim, float, sit.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as::appendAction()
    public override appendAction(actionType: string, ...args: any[]): boolean
    {
        let param: string | null = null;

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
                    case AvatarAction.POSTURE_WALK:
                    case AvatarAction.POSTURE_STAND:
                    case AvatarAction.POSTURE_SWIM:
                    case AvatarAction.POSTURE_FLOAT:
                    case AvatarAction.POSTURE_SIT:
                        return super.appendAction(actionType, ...args);
                    default:
                        // Unsupported posture for a blocked avatar
                        break;
                }
                break;

            case AvatarAction.EFFECT:
            case AvatarAction.EXPRESSION_JUMP:
            case AvatarAction.EXPRESSION_WAVE:
            case AvatarAction.SIGN:
            case AvatarAction.CARRY_OBJECT:
            case AvatarAction.USE_OBJECT:
            case AvatarAction.EXPRESSION_BLOW_A_KISS:
            case AvatarAction.EXPRESSION_67:
                this.addActionData(actionType, (args.length > 0) ? String(args[0]) : '');
                break;

            default:
                // Unsupported action for a blocked avatar
                break;
        }

        return true;
    }

    /**
	 * Gets a cached full image from the shared static cache.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as::getFullImage()
    protected override getFullImage(key: string): Texture | null
    {
        return BlockedAvatarImage._fullImageCache.get(key) || null;
    }

    /**
	 * Stores a full image in the shared static cache, disposing any previously cached
	 * image for the same key.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as::cacheFullImage()
    protected override cacheFullImage(key: string, image: Texture): void
    {
        const existing = BlockedAvatarImage._fullImageCache.get(key);

        if(existing)
        {
            existing.destroy();
            BlockedAvatarImage._fullImageCache.delete(key);
        }

        BlockedAvatarImage._fullImageCache.set(key, image);
    }

    /**
	 * Disposes this silhouette. Does NOT dispose the shared static cache, which every
	 * other blocked avatar is still reading.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/BlockedAvatarImage.as::dispose()
    public override dispose(): void
    {
        if(this._disposed) return;

        if(this._cache)
        {
            this._cache.dispose();
            this._cache = null;
        }

        this._structure = null!;
        this._assets = null!;
        this._mainAction = null;
        this._figure = null!;
        this._avatarDataContainer = null;
        this._actions = null!;

        if(!this._fullImageFromCache && this._image)
        {
            this._image.destroy();
        }

        this._image = null;
        this._canvasOffsets = [];
        this._disposed = true;
    }
}
