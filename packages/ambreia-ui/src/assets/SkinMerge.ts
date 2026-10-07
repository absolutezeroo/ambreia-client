import type {ISkinData} from '../graphics/renderer/BitmapSkinParser';
import type {IElementDescriptionData} from '../kit/IElementDescriptor';

// Skins and element descriptions authored on top of the dump's (the client's src/vortex-skins/),
// merged by key so a file carries only what it adds. Moved out of the client's App.ts so every host
// of the window system (the client, the ui sandbox) merges them the same way.

/**
 * Merges an authored skin over the dump's skin of the same id: templates, layouts and states
 * with a name the dump already has replace it, the rest are appended, and everything the
 * authored file is silent about is kept.
 *
 * With no dump skin of that id — a brand-new Vortex skin — the authored one is the whole of it.
 *
 * @param base - the dump's skin, or null when this id is new
 * @param authored - the authored overlay (the client's src/vortex-skins/)
 * @returns the skin to register under this id
 */
export function mergeSkin(base: ISkinData | null, authored: ISkinData): ISkinData
{
    if(!base) return authored;

    // The dump's `name`/`source` are kept: they identify where the bulk of the skin came from,
    // and an authored fragment carrying only two templates is not a better answer to that.
    return {
        id: base.id,
        name: base.name,
        source: base.source,
        variables: {...base.variables, ...authored.variables},
        templates: mergeByKey(base.templates, authored.templates, (entry) => entry.name),
        layouts: mergeByKey(base.layouts, authored.layouts, (entry) => entry.name),
        states: mergeByKey(base.states, authored.states, (entry) => entry.name)
    };
}

/**
 * Merges an authored element description over the dump's, keyed by (typeId, style) — the pair
 * ElementDescriptorRegistry itself looks a descriptor up by, so two entries agreeing on it are
 * the same entry and the authored one wins.
 *
 * @param base - the dump's element description, or null if it failed to load
 * @param authored - the authored overlay (the client's src/vortex-skins/)
 * @returns the element description to hand the window manager
 */
export function mergeElementDescription(base: IElementDescriptionData | null, authored: IElementDescriptionData): IElementDescriptionData
{
    if(!base) return authored;

    return {
        id: base.id,
        source: base.source,
        elements: mergeByKey(base.elements, authored.elements, (entry) => `${entry.typeId}/${entry.style}`)
    };
}

/**
 * Base list with `authored` applied over it: an authored entry whose key already exists
 * replaces that entry **in place**, so the dump's ordering is preserved, and any remaining
 * authored entry is appended in the order it was written.
 *
 * Order matters here: both the skin renderer and the descriptor registry keep the first entry
 * for a key they meet, so appending a replacement instead of substituting it would leave the
 * dump's version winning and the authored one dead — visible as nothing at all.
 */
function mergeByKey<T>(base: T[], authored: T[], key: (entry: T) => string): T[]
{
    const byKey = new Map(authored.map((entry) => [key(entry), entry]));
    const used = new Set<string>();

    const merged = base.map((entry) =>
    {
        const k = key(entry);
        const replacement = byKey.get(k);

        if(!replacement) return entry;

        used.add(k);

        return replacement;
    });

    for(const entry of authored)
    {
        if(!used.has(key(entry))) merged.push(entry);
    }

    return merged;
}
