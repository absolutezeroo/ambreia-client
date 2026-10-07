import {SkinRenderer} from './SkinRenderer';

/**
 * No-op skin renderer. Does nothing.
 *
 * Used for invisible or non-rendered window types where no drawing
 * is needed (renderer type "null" in element descriptions).
 *
 * @see sources/win63_version/core/window/graphics/renderer/NullSkinRenderer.as
 */
export class NullSkinRenderer extends SkinRenderer
{
    constructor(name: string)
    {
        super(name);
    }
}
