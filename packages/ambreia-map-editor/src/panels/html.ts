/** A message the user must notice: why a request failed, in their words. */
export function describe(error: unknown): string
{
    const e = error as {status?: number; code?: string; message?: string};

    if(e?.status === 401) return 'Session expirée ou identifiants refusés.';
    if(e?.status === 403) return 'Ce compte n\'a pas le droit d\'éditer les zones (world.zone.edit).';
    if(e?.status === 404) return 'Introuvable.';
    // Vite's proxy answers 502/500 without the API's error code when the emulator is down.
    if((e?.status ?? 0) >= 500 && !e?.code?.includes('.')) return 'Serveur injoignable (émulateur, port 8080).';
    if(e?.code) return `${e.status} ${e.code}`;
    if(e instanceof TypeError) return 'Serveur injoignable (émulateur, port 8080).';

    return e?.message ?? String(error);
}
