import type {IWindow} from '../IWindow';
import type {WindowEvent} from '../events/WindowEvent';
import {effect, onCleanup} from '@ambreia/common/reactive/Effect';

// No `AS3:` traces in this file: nothing here was ported. Window adapter of the
// TS-only reactive layer (docs/REACTIVE-UI.md §6).

/**
 * Binds one window property to a calculation: an effect that writes the
 * property when the calculated value changes.
 *
 * Equality-guarded (`Object.is`) so an unchanged value never touches the
 * setter; the controller setters self-guard and invalidate too, this just
 * avoids requeuing. A disposed target is left alone. The `getChildByName`
 * lookup belongs at scope setup, once — not inside `calc`.
 *
 * @param target - The window (or controller) owning the property
 * @param property - The property to keep in sync
 * @param calc - Recomputed whenever a signal it read changes
 * @returns A disposer for this binding alone
 */
// TS-only: the property-binding primitive over the parsed XML tree.
export function bind<T extends {readonly disposed: boolean}, K extends keyof T>(
    target: T,
    property: K,
    calc: () => T[K]
): () => void
{
    return effect(() =>
    {
        const value = calc();

        if(target.disposed)
        {
            return;
        }

        if(!Object.is(target[property], value))
        {
            target[property] = value;
        }
    });
}

/**
 * Subscribes to a window event with teardown owned by the ambient scope or
 * computation.
 *
 * Contract: handlers run synchronously inside the dispatch, like every
 * listener today, and **must not retain the event object** — window events are
 * pooled and recycled after dispatch. Copy the fields needed into signals.
 *
 * @param window - The window to listen on
 * @param type - The event type (`WindowEvent`/`WindowMouseEvent` constants)
 * @param listener - The handler; may write signals (effects run at the flush)
 */
// TS-only: scoped event subscription; removal is automatic.
export function on(window: IWindow, type: string, listener: (event: WindowEvent) => void): void
{
    window.addEventListener(type, listener);

    onCleanup(() =>
    {
        if(!window.disposed)
        {
            window.removeEventListener(type, listener);
        }
    });
}
