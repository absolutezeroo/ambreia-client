import type {ZoneDecorObject, ZoneDocument} from '../zone/Zone.generated';

/** Applies change to the listed decor objects; the same document when none of them changed. */
export function updateDecor(
    doc: ZoneDocument,
    ids: ReadonlySet<string>,
    change: (o: ZoneDecorObject) => ZoneDecorObject
): ZoneDocument
{
    let changed = false;
    const decor = (doc.decor ?? []).map(o =>
    {
        if(!ids.has(o.id) || o.locked) return o;

        const next = change(o);

        changed ||= next !== o;

        return next;
    });

    return changed ? {...doc, decor} : doc;
}
