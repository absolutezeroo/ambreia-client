/**
 * AvatarVisualizationData
 *
 * Stores shared visualization data for avatar rendering, including
 * a reference to the avatar render manager. Implements
 * IRoomObjectVisualizationData for integration with the room object system.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualizationData.as
 */
import type {IRoomObjectVisualizationData} from '../../object/visualization/IRoomObjectVisualizationData';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IAvatarAnimationListener} from '@ambreia/avatar/IAvatarAnimationListener';
import {AvatarScaleType} from '@ambreia/avatar/enum/AvatarScaleType';

export class AvatarVisualizationData implements IRoomObjectVisualizationData 
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualizationData.as::_avatarRenderer
    private _avatarRenderer: IAvatarRenderManager | null = null;
    private _disposed: boolean = false;

    public get disposed(): boolean 
    {
        return this._disposed;
    }

    get avatarRenderManager(): IAvatarRenderManager | null 
    {
        return this._avatarRenderer;
    }

    set avatarRenderManager(value: IAvatarRenderManager | null) 
    {
        this._avatarRenderer = value;
    }

    /**
     * Initializes the visualization data. For avatar visualization,
     * no XML data processing is needed.
     *
     * @param data - The initialization data (unused for avatars)
     * @returns Always true
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualizationData.as::initialize()
    initialize(_data: unknown): boolean
    {
        return true;
    }

    /**
     * Creates an avatar image at the appropriate scale for rendering.
     *
     * @param figure - The avatar figure string
     * @param scale - The rendering scale
     * @param gender - The avatar gender
     * @param listener - Optional image load listener
     * @param effectListener - Optional effect load listener
     * @param blocked - True when this client is blocking the user, in which case the real
     *   figure is never rendered and a silhouette is returned instead
     * @returns The created avatar image, or null if the renderer is unavailable
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualizationData.as::getAvatar()
    createAvatarImage(
        figure: string,
        scale: number,
        gender: string | null = null,
        listener: IAvatarImageListener | null = null,
        effectListener: IAvatarAnimationListener | null = null,
        blocked: boolean = false
    ): IAvatarImage | null
    {
        if(this._avatarRenderer != null)
        {
            const scaleType = (scale > 48) ? AvatarScaleType.LARGE : AvatarScaleType.SMALL;

            if(blocked)
            {
                return this._avatarRenderer.createBlockedAvatarImage(figure, scaleType);
            }

            return this._avatarRenderer.createAvatarImage(
                figure, scaleType, gender ?? '', listener, effectListener
            );
        }

        return null;
    }

    /**
     * Gets the layer count for the given scale. Always returns 0 for avatars
     * since layers are managed by the avatar image.
     *
     * @param scale - The scale identifier
     * @returns Always 0
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualizationData.as::getLayerCount()
    getLayerCount(_scale: string): number
    {
        return 0;
    }

    /**
     * Disposes of this visualization data and releases references.
     */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualizationData.as::dispose()
    dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;
        this._avatarRenderer = null;
    }
}
