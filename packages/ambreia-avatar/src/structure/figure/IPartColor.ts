/**
 * Interface for a color entry in an avatar figure palette.
 *
 * @see sources/win63_version/habbo/avatar/structure/figure/IPartColor.as
 */
export interface IPartColor
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get colorTransform()
    readonly colorTransform: { redMultiplier: number; greenMultiplier: number; blueMultiplier: number };
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get redMultiplier()
    readonly redMultiplier: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get greenMultiplier()
    readonly greenMultiplier: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get blueMultiplier()
    readonly blueMultiplier: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get rgb()
    readonly rgb: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get r()
    readonly r: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get g()
    readonly g: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get b()
    readonly b: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get id()
    readonly id: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get index()
    readonly index: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get clubLevel()
    readonly clubLevel: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/structure/figure/IPartColor.as::get isSelectable()
    readonly isSelectable: boolean;
}
