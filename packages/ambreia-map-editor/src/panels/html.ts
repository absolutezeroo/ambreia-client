const ESCAPES: Record<string, string> = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'};

/** Text safe inside HTML and attribute values. */
export const esc = (value: unknown): string => String(value).replace(/[&<>"']/g, c => ESCAPES[c]);

/** The element under root matching selector; throws when the template lost it. */
export function $<T extends HTMLElement>(root: ParentNode, selector: string): T
{
    const el = root.querySelector<T>(selector);

    if(!el) throw new Error(`missing ${selector}`);

    return el;
}

/** A message the user must notice: why a request failed, in their words. */
export function describe(error: unknown): string
{
    const e = error as {status?: number; code?: string; message?: string};

    if(e?.status === 401) return 'Session expirée ou identifiants refusés.';
    if(e?.status === 403) return 'Ce compte n\'a pas le droit d\'éditer les zones (world.zone.edit).';
    if(e?.status === 404) return 'Introuvable.';
    if(e?.code) return `${e.status} ${e.code}`;
    if(e instanceof TypeError) return 'Serveur injoignable : l\'émulateur tourne-t-il (port 8080) ?';

    return e?.message ?? String(error);
}
