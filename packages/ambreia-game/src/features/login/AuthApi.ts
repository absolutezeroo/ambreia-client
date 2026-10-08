/** A refusal of the web API: its error code (`pocket.auth.login_failed`…), or `network` / `http_<status>`. */
export class AuthApiError extends Error
{
    constructor(readonly code: string)
    {
        super(`auth: ${code}`);
    }
}

/**
 * The emulator's web API routes the login screen uses (F3a §4): sign in or register, which opens
 * a web session (an HttpOnly cookie), then the account ticket the game socket logs in with.
 * The origin routes `/webapi` to the emulator (Caddy in production, Vite's proxy in dev), so the
 * cookie stays first-party.
 */
export class AuthApi
{
    constructor(private readonly _base = '/webapi', private readonly _fetch: typeof fetch = (...args) => fetch(...args)) {}

    async login(email: string, password: string): Promise<void>
    {
        await this.call('POST', '/api/public/authentication/login', {email, password});
    }

    /** Registering also signs in: the server opens the web session on success. */
    async register(email: string, password: string, passwordRepeated: string): Promise<void>
    {
        await this.call('POST', '/api/public/registration/new', {email, password, passwordRepeated});
    }

    /** No avatar is selected, so the ticket names the account (F3a §5.1): characters come next. */
    async accountTicket(): Promise<string>
    {
        const body = await this.call('GET', '/api/ssotoken') as {ssoToken?: unknown};

        if(typeof body.ssoToken !== 'string' || body.ssoToken.length === 0) throw new AuthApiError('invalid_response');

        return body.ssoToken;
    }

    private async call(method: string, path: string, body?: unknown): Promise<unknown>
    {
        let response: Response;

        try
        {
            response = await this._fetch(this._base + path, {
                method,
                credentials: 'same-origin',
                headers: body === undefined ? undefined : {'Content-Type': 'application/json'},
                body: body === undefined ? undefined : JSON.stringify(body)
            });
        }
        catch
        {
            throw new AuthApiError('network');
        }

        // A rate limiter or a proxy answers without the API's JSON: fall back to the status.
        const json = await response.json().catch(() => null) as {error?: unknown} | null;

        if(!response.ok) throw new AuthApiError(typeof json?.error === 'string' ? json.error : response.status === 429 ? 'rate_limited' : `http_${response.status}`);

        return json ?? {};
    }
}
