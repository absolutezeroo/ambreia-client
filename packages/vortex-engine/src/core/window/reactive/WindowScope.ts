import type {IWindow} from '../IWindow';
import {WindowEvent} from '../events/WindowEvent';
import {Scope, getCurrentScope} from '@ambreia/common/reactive/Effect';

// No `AS3:` traces in this file: nothing here was ported. Window adapter of the
// TS-only reactive layer (docs/REACTIVE-UI.md §6).

/**
 * Creates a scope whose lifetime is the window's: it disposes itself when the
 * window dispatches `WE_DESTROYED` (the same hook `GestureAgentService` uses),
 * or earlier if disposed manually.
 *
 * Everything created inside `scope.run(...)` — bindings, listeners, child
 * scopes — is torn down with it.
 */
// TS-only: ties reactive ownership to the window lifecycle.
export function createWindowScope(window: IWindow): Scope
{
    const scope = new Scope(getCurrentScope());
    const onDestroyed = (): void => scope.dispose();

    window.addEventListener(WindowEvent.WE_DESTROYED, onDestroyed);

    scope.addCleanup(() =>
    {
        if(!window.disposed)
        {
            window.removeEventListener(WindowEvent.WE_DESTROYED, onDestroyed);
        }
    });

    return scope;
}
