import type {IZoneFinding} from '../validation/IZoneFinding';
import type {ZoneDocument} from '../zone/Zone.generated';
import {EditorApiError} from './EditorApiError';
import type {IFurniturePaletteEntry} from './IFurniturePaletteEntry';
import type {IZoneSaveResult} from './IZoneSaveResult';
import type {IZoneSummary} from './IZoneSummary';

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * The server's /api/editor routes. The session is the web cookie, so requests carry credentials;
 * fetch is injected and tests run without a network.
 */
export class EditorApiClient
{
    constructor(private readonly _base = '', private readonly _fetch: Fetch = (i, o) => fetch(i, o))
    {
    }

    async login(email: string, password: string): Promise<void>
    {
        await this.json('POST', '/api/public/authentication/login', {email, password});
    }

    listZones(): Promise<IZoneSummary[]>
    {
        return this.json('GET', '/api/editor/zones');
    }

    createZone(key: string, name: string, fromTemplate?: string): Promise<IZoneSummary>
    {
        return this.json('POST', '/api/editor/zones', {key, name, fromTemplate: fromTemplate ?? null});
    }

    /** The newest version, draft or published; null for a zone never saved. */
    async latestDocument(key: string): Promise<ZoneDocument | null>
    {
        const res = await this.send('GET', `/api/editor/zones/${enc(key)}/document?version=latest`);

        if(res.status === 404) return null;

        return (await this.ok(res)).json();
    }

    /** 200 saved, 400 refused with findings, 409 another save took the version: all come back as a result. */
    async save(key: string, doc: ZoneDocument, comment = ''): Promise<IZoneSaveResult>
    {
        const res = await this.send(
            'POST',
            `/api/editor/zones/${enc(key)}/versions?comment=${enc(comment)}`,
            JSON.stringify(doc)
        );

        return this.result(res);
    }

    async publish(key: string, version: number): Promise<IZoneSaveResult>
    {
        return this.result(await this.send('POST', `/api/editor/zones/${enc(key)}/publish/${version}`));
    }

    validate(key: string, doc: ZoneDocument): Promise<IZoneFinding[]>
    {
        return this.json('POST', `/api/editor/zones/${enc(key)}/validate`, doc);
    }

    /** False when someone else holds the lock. */
    async lock(key: string, force = false): Promise<boolean>
    {
        const res = await this.send('POST', `/api/editor/zones/${enc(key)}/lock${force ? '?force=true' : ''}`);

        if(res.status === 409) return false;

        await this.ok(res);

        return true;
    }

    async unlock(key: string): Promise<void>
    {
        await this.ok(await this.send('DELETE', `/api/editor/zones/${enc(key)}/lock`));
    }

    palette(): Promise<IFurniturePaletteEntry[]>
    {
        return this.json('GET', '/api/editor/furniture');
    }

    private async json<T>(method: string, path: string, body?: unknown): Promise<T>
    {
        const res = await this.ok(await this.send(method, path, body === undefined ? undefined : JSON.stringify(body)));
        const text = await res.text();

        return (text ? JSON.parse(text) : undefined) as T;
    }

    private async result(res: Response): Promise<IZoneSaveResult>
    {
        if(res.status === 200 || res.status === 400 || res.status === 409)
        {
            const body = await res.json() as Partial<IZoneSaveResult>;

            if(Array.isArray(body.findings)) return body as IZoneSaveResult;
        }

        throw await error(res);
    }

    private send(method: string, path: string, body?: string): Promise<Response>
    {
        return this._fetch(this._base + path, {
            method,
            credentials: 'include',
            headers: body === undefined ? undefined : {'content-type': 'application/json'},
            body
        });
    }

    private async ok(res: Response): Promise<Response>
    {
        if(!res.ok) throw await error(res);

        return res;
    }
}

const enc = encodeURIComponent;

async function error(res: Response): Promise<EditorApiError>
{
    let code = res.statusText || 'error';

    try
    {
        const body = await res.clone().json() as {error?: string};

        if(body?.error) code = body.error;
    }
    catch
    {
        // Not JSON: the status text stands.
    }

    return new EditorApiError(res.status, code);
}
