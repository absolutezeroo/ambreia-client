import {SkinTemplate} from './SkinTemplate';

/**
 * The skin template produced from a bitmap atlas.
 *
 * AS3 adds nothing to `SkinTemplate` — the constructor forwards straight to
 * `super`. The subclass exists so the skin parser's local, and its
 * `parseTemplateEntityList()` parameter, name the bitmap case specifically;
 * keeping it means the port's parser can be typed the same way instead of
 * collapsing both onto the base.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapSkinTemplate.as
 */
export class BitmapSkinTemplate extends SkinTemplate
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapSkinTemplate.as::BitmapSkinTemplate()
    constructor(name: string, atlas: ImageBitmap | null)
    {
        super(name, atlas);
    }
}
