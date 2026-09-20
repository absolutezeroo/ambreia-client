import type {Texture} from 'pixi.js';
import type {AvatarStructure} from './AvatarStructure';
import type {AssetAliasCollection} from './alias/AssetAliasCollection';
import type {AvatarFigureContainer} from './AvatarFigureContainer';
import {AvatarImage} from './AvatarImage';
import {AvatarAction} from './enum/AvatarAction';

/**
 * Placeholder avatar image with a reduced action set and a shared static
 * full-image cache. Used for avatars that have not yet fully loaded their
 * figure assets, providing a quick stand-in rendering.
 *
 * Extends AvatarImage and overrides appendAction() to filter out
 * unsupported actions, and uses a static cache so that identical
 * placeholder figures share rendered images across instances.
 *
 * @see sources/win63_version/habbo/avatar/PlaceholderAvatarImage.as
 */
export class PlaceholderAvatarImage extends AvatarImage
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/PlaceholderAvatarImage.as::_fullImageCache
    private static _fullImageCache: Map<string, Texture> = new Map();

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
	 * Indicates that this is a placeholder avatar image.
	 *
	 * @returns True
	 */
    public override isPlaceholder(): boolean
    {
        return true;
    }

    /**
	 * Appends an action, but only allows a limited subset of postures and actions.
	 * Posture is restricted to: lay, mv, std, swim, float, sit.
	 * Other allowed actions: fx, dance, wave, sign, cri, usei, blow.
	 *
	 * @param actionType - The action type identifier
	 * @param args - Additional arguments (typically the action parameter)
	 * @returns True if the action was accepted
	 */
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
                        // Unsupported posture for placeholder
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
                // Unsupported action for placeholder
                break;
        }

        return true;
    }

    /**
	 * Disposes this placeholder. Does NOT dispose the shared static cache,
	 * as it is shared across all placeholder instances.
	 */
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

    /**
	 * Gets a cached full image from the shared static cache.
	 *
	 * @param key - The cache key
	 * @returns The cached texture, or null
	 */
    protected override getFullImage(key: string): Texture | null
    {
        return PlaceholderAvatarImage._fullImageCache.get(key) || null;
    }

    /**
	 * Stores a full image in the shared static cache, disposing any
	 * previously cached image for the same key.
	 *
	 * @param key - The cache key
	 * @param image - The texture to cache
	 */
    protected override cacheFullImage(key: string, image: Texture): void
    {
        const existing = PlaceholderAvatarImage._fullImageCache.get(key);

        if(existing)
        {
            existing.destroy();
            PlaceholderAvatarImage._fullImageCache.delete(key);
        }

        PlaceholderAvatarImage._fullImageCache.set(key, image);
    }
}
