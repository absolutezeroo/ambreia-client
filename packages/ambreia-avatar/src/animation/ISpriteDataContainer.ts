import type {IAnimation} from './IAnimation';

/**
 * Interface for sprite data used in avatar animations.
 *
 * @see sources/win63_version/habbo/avatar/animation/ISpriteDataContainer.as
 */
export interface ISpriteDataContainer
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::get animation()
    readonly animation: IAnimation;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::get id()
    readonly id: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::get ink()
    readonly ink: number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::get member()
    readonly member: string;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::get hasDirections()
    readonly hasDirections: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::get hasStaticY()
    readonly hasStaticY: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::getDirectionOffsetX()
    getDirectionOffsetX(direction: number): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::getDirectionOffsetY()
    getDirectionOffsetY(direction: number): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/animation/ISpriteDataContainer.as::getDirectionOffsetZ()
    getDirectionOffsetZ(direction: number): number;
}
