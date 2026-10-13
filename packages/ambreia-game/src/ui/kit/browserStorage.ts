/** The browser's storage, or null where there is none or it refuses access. */
export function browserStorage(): Storage | null
{
    try
    {
        return globalThis.localStorage ?? null;
    }
    catch
    {
        return null;
    }
}
