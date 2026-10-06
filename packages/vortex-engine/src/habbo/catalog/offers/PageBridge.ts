/**
 * The browser stand-in for `flash.external.ExternalInterface`, for the two ad providers.
 *
 * Flash reached the surrounding page two ways: `call(name, …)` invoked a page function, and
 * `addCallback(name, fn)` published one for the page to invoke back. Both become plain `window`
 * properties under the *same dotted names*, because the contract is the page's — a page written
 * for the Flash client keeps working, and one that defines nothing leaves every call inert.
 *
 * Shared here because `SupersonicProvider` and `SponsorPayProvider` publish eleven callbacks
 * between them.
 *
 * TS-only: no AS3 counterpart — AS3 has ExternalInterface.
 */
export const PageBridge = {
    /** AS3's `ExternalInterface.available`: is there a page to talk to at all. */
    get available(): boolean
    {
        return typeof window !== 'undefined';
    },

    /** Walks a dotted path on `window` and calls it. Returns false when it does not resolve. */
    call(path: string, ...args: unknown[]): boolean
    {
        if(!PageBridge.available) return false;

        let scope: Record<string, unknown> = window as unknown as Record<string, unknown>;
        let target: unknown = scope;

        for(const segment of path.split('.'))
        {
            if(target == null || typeof target !== 'object') return false;

            scope = target as Record<string, unknown>;
            target = scope[segment];
        }

        if(typeof target !== 'function') return false;

        (target as (this: unknown, ...rest: unknown[]) => void).apply(scope, args);

        return true;
    },

    /**
     * Publishes a callback for the page to invoke, or removes it when `fn` is null — which is what
     * AS3's `addCallback(name, null)` means and what both providers do on dispose.
     */
    addCallback(name: string, fn: ((...args: never[]) => void) | null): void
    {
        if(!PageBridge.available) return;

        const target = window as unknown as Record<string, unknown>;

        if(fn === null) delete target[name];
        else target[name] = fn;
    },
};
