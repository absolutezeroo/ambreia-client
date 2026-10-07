/**
 * Interface for avatar data container with color transform information.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAvatarDataContainer.as (IAvatarDataContainer)
 */
export interface IAvatarDataContainer
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAvatarDataContainer.as::get ink()
    readonly ink: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAvatarDataContainer.as::get colorTransform()
    readonly colorTransform: {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number
    };
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAvatarDataContainer.as::get paletteIsGrayscale()
    readonly paletteIsGrayscale: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAvatarDataContainer.as::get reds()
    readonly reds: number[];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAvatarDataContainer.as::get greens()
    readonly greens: number[];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAvatarDataContainer.as::get blues()
    readonly blues: number[];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAvatarDataContainer.as::get alphas()
    readonly alphas: number[];
}
