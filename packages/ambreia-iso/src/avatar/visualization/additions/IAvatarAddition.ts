/**
 * IAvatarAddition
 *
 * Interface for avatar visual additions (floating icons, bubbles, effects).
 * Additions are overlays rendered on top of the avatar sprite such as
 * typing bubbles, muted icons, idle Z animations, etc.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/IAvatarAddition.as
 */
import type {IRoomObjectSprite} from '../../../object/visualization/IRoomObjectSprite';

export interface IAvatarAddition {
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/IAvatarAddition.as::get id()
    readonly id: number;
    readonly disposed: boolean;

    /**
     * Updates the addition sprite position and asset for the current scale.
     *
     * @param sprite - The sprite to update
     * @param scale - The current visualization scale
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/IAvatarAddition.as::update()
    update(sprite: IRoomObjectSprite | null, scale: number): void;

    /**
     * Animates the addition each frame.
     *
     * @param sprite - The sprite to animate
     * @returns True if the animation caused a visual change
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/avatar/additions/IAvatarAddition.as::animate()
    animate(sprite: IRoomObjectSprite | null): boolean;

    /**
     * Disposes of this addition and releases resources.
     */
    dispose(): void;
}
