/// <reference types="vite/client" />

/**
 * Build-time flags this client reads. They are substituted as literals by Vite, so a flag that is
 * unset removes the branch behind it from the bundle entirely — declaring them here is what stops
 * a typo from silently reading `undefined` and disabling a feature nobody notices is gone.
 */
interface ImportMetaEnv
{
    /** `'1'` builds the in-client window debugger in. See the ARG in the repo-root Dockerfile. */
    readonly VITE_WINDOW_DEBUGGER?: string;
}

interface ImportMeta
{
    readonly env: ImportMetaEnv;
}
