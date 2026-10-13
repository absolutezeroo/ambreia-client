/**
 * AvatarFurnitureVisualizationData
 *
 * The visualization data for furniture that draws an avatar into its own sprite list — the
 * mannequin, and nothing else in this build. It is a plain `FurnitureVisualizationData` (so the
 * furni's own layers, offsets and directions still parse normally) that additionally owns an
 * `AvatarVisualizationData` and forwards avatar creation to it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/AvatarFurnitureVisualizationData.as
 */
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';
import type {IAvatarImageListener} from '@ambreia/avatar/IAvatarImageListener';
import type {IAvatarAnimationListener} from '@ambreia/avatar/IAvatarAnimationListener';
import {AvatarVisualizationData} from '../../avatar/visualization/AvatarVisualizationData';
import {FurnitureVisualizationData} from './FurnitureVisualizationData';

export class AvatarFurnitureVisualizationData extends FurnitureVisualizationData
{
    // Name derived — this field is obfuscated in every tree and no build recovers it:
    //   `_SafeStr_6514` in the primary, `var_1837` in win63_version, and `_Str_12148` in
    //   PRODUCTION (where the class is still called FurnitureMannequinVisualizationData). Named
    //   here from its type and its single use, forwarding getAvatar().
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/AvatarFurnitureVisualizationData.as::_avatarData
    private _avatarData: AvatarVisualizationData | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/AvatarFurnitureVisualizationData.as::AvatarFurnitureVisualizationData()
    constructor()
    {
        super();

        this._avatarData = new AvatarVisualizationData();
    }

    // The port's AvatarVisualizationData calls this `avatarRenderManager`, where AS3 calls it
    //   `avatarRenderer` and types it as the manager all the same; the name here follows the
    //   property it forwards to, which is what the factory already assigns everywhere else.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/AvatarFurnitureVisualizationData.as::set avatarRenderer()
    set avatarRenderManager(value: IAvatarRenderManager | null)
    {
        if(this._avatarData !== null) this._avatarData.avatarRenderManager = value;
    }

    /**
     * Creates the avatar image this furniture displays.
     *
     * @param figure - The figure string to render
     * @param scale - The rendering scale, which picks the avatar scale type
     * @param gender - The figure's gender, or null
     * @param listener - Notified when a placeholder figure finishes downloading its real assets
     * @param effectListener - Notified when an effect finishes downloading
     * @returns The avatar image, or null when no render manager has been handed over yet
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/AvatarFurnitureVisualizationData.as::getAvatar()
    getAvatar(
        figure: string,
        scale: number,
        gender: string | null = null,
        listener: IAvatarImageListener | null = null,
        effectListener: IAvatarAnimationListener | null = null
    ): IAvatarImage | null
    {
        if(this._avatarData === null) return null;

        return this._avatarData.createAvatarImage(figure, scale, gender, listener, effectListener);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/AvatarFurnitureVisualizationData.as::dispose()
    override dispose(): void
    {
        super.dispose();

        if(this._avatarData !== null)
        {
            this._avatarData.dispose();
            this._avatarData = null;
        }
    }
}
