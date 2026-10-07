import type {IChildEntity} from '../../utils/IChildEntity';

/**
 * One named region of a skin template atlas.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinTemplateEntity.as
 */
export interface ISkinTemplateEntity extends IChildEntity
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinTemplateEntity.as::get type()
    readonly type: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinTemplateEntity.as::get region()
    readonly region: { x: number; y: number; width: number; height: number };
}
