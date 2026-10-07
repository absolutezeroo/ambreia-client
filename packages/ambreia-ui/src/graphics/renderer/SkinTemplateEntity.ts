/**
 * Template entity for skin rendering.
 *
 * Defines the source region within the spritesheet atlas for a single
 * bitmap piece. The type is typically "bitmap" for image regions.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/graphics/renderer/SkinTemplateEntity.as
 */
export class SkinTemplateEntity 
{
    // AS3: .../src/com/sulake/core/window/graphics/renderer/SkinTemplateEntity.as::get id()
    public readonly id: number;
    // AS3: .../src/com/sulake/core/window/graphics/renderer/SkinTemplateEntity.as::get name()
    public readonly name: string;
    // AS3: .../src/com/sulake/core/window/graphics/renderer/SkinTemplateEntity.as::get type()
    public readonly type: string;
    // AS3: .../src/com/sulake/core/window/graphics/renderer/SkinTemplateEntity.as::get region()
    public readonly region: { x: number; y: number; width: number; height: number };

    constructor(
        id: number,
        name: string,
        type: string,
        region: { x: number; y: number; width: number; height: number }
    ) 
    {
        this.id = id;
        this.name = name;
        this.type = type;
        this.region = {...region};
    }
}
