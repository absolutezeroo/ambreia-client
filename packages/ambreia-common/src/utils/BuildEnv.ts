/**
 * What kind of bundle this is. Vite inlines `import.meta.env` in a build and injects it in dev;
 * under Node (tests, tools) there is no `env`, which counts as "not production", like the dev server.
 */
export function isProductionBuild(): boolean
{
    return (import.meta as unknown as {env?: {PROD?: boolean}}).env?.PROD === true;
}

/**
 * Publishes a console hook as `globalThis.__ambreia.<name>`, outside production builds only: a
 * player's console gets no handle on the sessions and no demo data. Returns whether it was published.
 */
export function devHook(name: string, value: unknown, production: boolean = isProductionBuild()): boolean
{
    if(production || typeof globalThis === 'undefined') return false;

    const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

    root.__ambreia = {...(root.__ambreia ?? {}), [name]: value};

    return true;
}
