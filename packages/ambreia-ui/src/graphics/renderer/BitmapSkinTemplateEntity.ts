import {SkinTemplateEntity} from './SkinTemplateEntity';

/**
 * One region of a {@link BitmapSkinTemplate}'s atlas.
 *
 * As with its template, AS3 adds nothing to the base — the constructor
 * forwards straight to `super`. Parameter *order* differs from AS3, which
 * takes `(name, type, id, region)`; this port's `SkinTemplateEntity` takes
 * `(id, name, type, region)` and the subclass follows the base it actually
 * extends rather than reordering just here.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapSkinTemplateEntity.as
 */
export class BitmapSkinTemplateEntity extends SkinTemplateEntity
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/BitmapSkinTemplateEntity.as::BitmapSkinTemplateEntity()
    constructor(
        id: number,
        name: string,
        type: string,
        region: { x: number; y: number; width: number; height: number }
    )
    {
        super(id, name, type, region);
    }
}
