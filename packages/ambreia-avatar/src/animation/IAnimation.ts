import type {ISpriteDataContainer} from './ISpriteDataContainer';

/**
 * Interface for an avatar animation containing sprite, remove, and add data.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/animation/IAnimation.as (IAnimation)
 */
export interface IAnimation
{
    readonly id: string;
    readonly spriteData: ISpriteDataContainer[];
    readonly removeData: string[];
    readonly addData: { id: string; align: string; base: string; ink: string; blend: number }[];
    readonly resetOnToggle: boolean;

    hasAvatarData(): boolean;

    hasDirectionData(): boolean;

    hasAddData(): boolean;
}
