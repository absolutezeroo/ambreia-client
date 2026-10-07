/**
 * Interface for a single figure part in an avatar's figure set.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePart.as (IFigurePart)
 */
export interface IFigurePart
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePart.as::get id()
    readonly id: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePart.as::get type()
    readonly type: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePart.as::get breed()
    readonly breed: number;
    readonly colorLayerIndex: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePart.as::get index()
    readonly index: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/structure/figure/IFigurePart.as::get paletteMap()
    readonly paletteMap: number;
}
