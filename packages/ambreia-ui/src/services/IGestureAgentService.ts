import type {IWindow} from '../IWindow';

/**
 * Called on every decay tick with the gesture's current velocity.
 *
 * AS3 types this simply as `Function`, so the shape is read off the one call
 * site — `_callback(velocityX, velocityY)` in `GestureAgentService.operate()`.
 */
// TS-only: AS3 declares the parameter as an untyped `Function`.
export type GestureAgentCallback = (velocityX: number, velocityY: number) => void;

/**
 * Momentum agent for flick gestures — see {@link GestureAgentService}.
 *
 * Obfuscated as `services/_SafeCls_4071.as` in the primary tree; the name is
 * recovered from the unobfuscated 2016 tree.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/services/IGestureAgentService.as
 */
export interface IGestureAgentService
{
    readonly disposed: boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/services/IGestureAgentService.as::dispose()
    dispose(): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/services/IGestureAgentService.as::begin()
    begin(
        window: IWindow | null,
        callback: GestureAgentCallback | null,
        gestureId: number,
        velocityX: number,
        velocityY: number
    ): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/services/IGestureAgentService.as::end()
    end(window: IWindow | null): IWindow | null;
}
