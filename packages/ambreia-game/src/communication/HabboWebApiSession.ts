/**
 * HabboWebApiSession
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/HabboWebApiSession.as
 *
 * Main HTTP session for the Habbo Web API.
 * Implements IHabboWebApiSession and IApiListener.
 *
 * In AS3, uses URLLoader for HTTP requests and describeType() to read
 * [HabboWebApiRoute] metadata annotations for route mapping.
 * In TypeScript, uses the Fetch API and a static WEB_API_ROUTES map.
 */
import {Logger} from '@ambreia/common/utils/Logger';
import type {IApiListener} from './IApiListener';
import type {IHabboWebApiListener} from './IHabboWebApiListener';
import type {IHabboWebApiSession} from './IHabboWebApiSession';
import {WEB_API_ROUTES} from './IHabboWebApiSession';
import {WebApiRequest} from './WebApiRequest';

const logger = Logger.getLogger('habbo.communication.HabboWebApiSession');

export class HabboWebApiSession implements IHabboWebApiSession, IApiListener 
{
    /**
     * AS3: SHARED_SECRET — used for device ID HMAC.
     * Not needed in browser (no machine ID), but kept for reference.
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::SHARED_SECRET
    private static readonly SHARED_SECRET = 'CnurvLf7UP';

    private _routes: Map<string, WebApiRequest> = new Map();
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::_server
    private _server: string;
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::_listeners
    private _listeners: IHabboWebApiListener[] = [];
    private _deviceId: string;
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::_deviceToken
    private _deviceToken: string = '';
    private _lastRequest: WebApiRequest | null = null;
    private _lastRequestVars: Record<string, unknown> | null = null;
    private _lastRequestPathParams: (string | number)[] | null = null;
    private _captchaRequiredUri: string | null = null;

    /**
     * AS3: HabboWebApiSession(server)
     * Initializes the session, generates device ID, builds route dictionary.
     *
     * @param server - Base server URL (e.g., 'https://www.habbo.com')
     */
    constructor(server: string) 
    {
        this._server = server;
        this._deviceId = this.generateDeviceId();

        // AS3: describeType(IHabboWebApiSession) → walk methods with [HabboWebApiRoute]
        // In TypeScript, we use the static WEB_API_ROUTES map.
        for(const [methodName, route] of Object.entries(WEB_API_ROUTES)) 
        {
            this._routes.set(
                methodName,
                new WebApiRequest(route.uri, route.method, route.requiresSession !== false)
            );
        }
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::_captchaToken
    private _captchaToken: string | null = null;

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::get captchaToken()
    get captchaToken(): string | null 
    {
        return this._captchaToken;
    }

    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::get disposed()
    get disposed(): boolean 
    {
        return this._disposed;
    }

    /**
     * AS3: addListener(listener)
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::addListener()
    public addListener(listener: IHabboWebApiListener): boolean 
    {
        if(this._listeners.indexOf(listener) === -1) 
        {
            this._listeners.push(listener);

            return true;
        }

        return false;
    }

    /**
     * AS3: removeListener(listener)
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::removeListener()
    public removeListener(listener: IHabboWebApiListener): void 
    {
        const index = this._listeners.indexOf(listener);

        if(index !== -1) 
        {
            this._listeners.splice(index, 1);
        }
    }

    /**
     * AS3: setCaptchaToken(token)
     * Sets the captcha token and re-executes the last failed request if applicable.
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::setCaptchaToken()
    public setCaptchaToken(token: string): boolean 
    {
        this._captchaToken = token;

        if(this._captchaRequiredUri && this._lastRequest && this._lastRequest.uri === this._captchaRequiredUri) 
        {
            this._captchaRequiredUri = null;

            this.reExecuteLastRequest();

            return true;
        }

        return false;
    }

    /**
     * AS3: apiResponse(uri, data)
     * Dispatches successful response to all listeners.
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::apiResponse()
    public apiResponse(uri: string, data: Record<string, unknown>): void 
    {
        for(const listener of this._listeners) 
        {
            if(!listener.disposed) 
            {
                listener.habboWebApiResponse(uri, data);
            }
        }
    }

    /**
     * AS3: apiRawResponse(uri, data)
     * Dispatches raw response to all listeners.
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::apiRawResponse()
    public apiRawResponse(uri: string, data: unknown): void 
    {
        for(const listener of this._listeners) 
        {
            if(!listener.disposed) 
            {
                listener.habboWebApiRawResponse(uri, data);
            }
        }
    }

    /**
     * AS3: apiError(uri, status, error, data, isCaptcha)
     * Normalizes the error and dispatches to all listeners.
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::apiError()
    public apiError(uri: string, status: number, error: string, data: Record<string, unknown> | null, isCaptcha: boolean = false): void 
    {
        // AS3: Normalize error from data
        let normalizedError = error;

        if(data) 
        {
            if(typeof data.error === 'string') 
            {
                normalizedError = data.error;
            }
            else if(Array.isArray(data.errors) && (data.errors as string[]).length > 0) 
            {
                normalizedError = (data.errors as string[])[0];
            }
            else if(typeof data.message === 'string') 
            {
                normalizedError = data.message;
            }
        }

        // AS3: If captcha-related, store URI for re-execution
        if(isCaptcha || normalizedError === 'invalid-captcha') 
        {
            this._captchaRequiredUri = uri;
        }

        for(const listener of this._listeners) 
        {
            if(!listener.disposed) 
            {
                listener.habboWebApiError(uri, status, normalizedError, data, isCaptcha);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::emailChange()
    public emailChange(newEmail: string): void 
    {
        this.executeRequest('emailChange', {newEmail});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::passwordChange()
    public passwordChange(newPassword: string): void 
    {
        this.executeRequest('passwordChange', {newPassword});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::tosAccept()
    public tosAccept(): void 
    {
        this.executeRequest('tosAccept');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::captcha()
    public captcha(): void 
    {
        this.executeRequest('captcha');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::achievements()
    public achievements(): void 
    {
        this.executeRequest('achievements');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::achievementsForId()
    public achievementsForId(id: number): void 
    {
        this.executeRequest('achievementsForId', null, [id]);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::time()
    public time(): void 
    {
        this.executeRequest('time');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::activate()
    public activate(token: string): void 
    {
        this.executeRequest('activate', {token});
    }

    /**
     * AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::login()
     *
     * `code` is TS-only — see `IHabboWebApiSession.login()`. It is omitted from the body rather than
     * sent empty: the emulator's `LoginRequest.Code` is nullable and a first attempt is meant to
     * carry nothing, which is what makes the server answer `mfa_required` instead of `invalid_code`.
     */
    public login(email: string, password: string, code?: string): void
    {
        this.executeRequest('login', code ? {email, password, code} : {email, password});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::facebook()
    public facebook(accessToken: string): void 
    {
        this.executeRequest('facebook', {accessToken});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::rpx()
    public rpx(token: string): void 
    {
        this.executeRequest('rpx', {token});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::logout()
    public logout(): void 
    {
        this.executeRequest('logout');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::authenticateUser()
    public authenticateUser(): void 
    {
        this.executeRequest('authenticateUser');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::forgotPassword()
    public forgotPassword(email: string): void 
    {
        this.executeRequest('forgotPassword', {email});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::changePassword()
    public changePassword(token: string, password: string, answer1: string, answer2: string): void 
    {
        this.executeRequest('changePassword', {token, password, answer1, answer2});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::groups()
    public groups(id: number): void 
    {
        this.executeRequest('groups', null, [id]);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::members()
    public members(id: number): void 
    {
        this.executeRequest('members', null, [id]);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::hello()
    public hello(): void 
    {
        this.executeRequest('hello');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::register()
    public register(email: string, password: string, day: number, month: number, year: number, tos: boolean, captchaToken: string): void 
    {
        this._captchaToken = captchaToken;

        this.executeRequest('register', {
            email,
            password,
            birthdate: {day, month, year},
            tos,
            captchaToken,
        });
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::popularRooms()
    public popularRooms(): void 
    {
        this.executeRequest('popularRooms');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::room()
    public room(id: number): void 
    {
        this.executeRequest('room', null, [id]);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::hotlooks()
    public hotlooks(): void 
    {
        this.executeRequest('hotlooks');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::logCrash()
    public logCrash(message: string): void 
    {
        this.executeRequest('logCrash', {message});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::logError()
    public logError(message: string): void 
    {
        this.executeRequest('logError', {message});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::logLoginStep()
    public logLoginStep(step: string, extra: string): void 
    {
        this.executeRequest('logLoginStep', {step, extra});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::clientUrl()
    public clientUrl(): void 
    {
        this.executeRequest('clientUrl');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::nameCheck()
    public nameCheck(name: string): void 
    {
        this.executeRequest('nameCheck', {name});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::selectUser()
    public selectUser(name: string): void 
    {
        this.executeRequest('selectUser', {name});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::selectRoom()
    public selectRoom(roomIndex: number): void 
    {
        this.executeRequest('selectRoom', {roomIndex});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::safetyLockStatus()
    public safetyLockStatus(): void 
    {
        this.executeRequest('safetyLockStatus');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::safetyLockDisable()
    public safetyLockDisable(): void 
    {
        this.executeRequest('safetyLockDisable');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::resetTrustedLogins()
    public resetTrustedLogins(): void 
    {
        this.executeRequest('resetTrustedLogins');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::safetyLockSave()
    public safetyLockSave(password: string, q1Id: number, a1: string, q2Id: number, a2: string): void 
    {
        this.executeRequest('safetyLockSave', {
            password,
            questionId1: q1Id,
            answer1: a1,
            questionId2: q2Id,
            answer2: a2
        });
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::safetyLockQuestions()
    public safetyLockQuestions(): void 
    {
        this.executeRequest('safetyLockQuestions');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::safetyLockUnlock()
    public safetyLockUnlock(answer1: string, answer2: string, trustDevice: boolean): void 
    {
        this.executeRequest('safetyLockUnlock', {answer1, answer2, trustDevice});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::commonFriends()
    public commonFriends(id: number): void 
    {
        this.executeRequest('commonFriends', null, [id]);
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::preferences()
    public preferences(): void 
    {
        this.executeRequest('preferences');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::self()
    public self(): void 
    {
        this.executeRequest('self');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::ping()
    public ping(): void 
    {
        this.executeRequest('ping');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::saveUser()
    public saveUser(): void 
    {
        this.executeRequest('saveUser');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::saveVisibility()
    public saveVisibility(visible: boolean): void 
    {
        this.executeRequest('saveVisibility', {visible});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::campaignMessages()
    public campaignMessages(): void 
    {
        this.executeRequest('campaignMessages');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::campaignMessagesAll()
    public campaignMessagesAll(): void 
    {
        this.executeRequest('campaignMessagesAll');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::campaignMessagesSeen()
    public campaignMessagesSeen(): void 
    {
        this.executeRequest('campaignMessagesSeen');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::discussions()
    public discussions(): void 
    {
        this.executeRequest('discussions');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::creditBalance()
    public creditBalance(): void 
    {
        this.executeRequest('creditBalance');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::friendRequestsSent()
    public friendRequestsSent(): void 
    {
        this.executeRequest('friendRequestsSent');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::friendRequestsReceived()
    public friendRequestsReceived(): void 
    {
        this.executeRequest('friendRequestsReceived');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::saveLooks()
    public saveLooks(figure: string, gender: string): void 
    {
        this.executeRequest('saveLooks', {figure, gender});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::avatars()
    public avatars(): void 
    {
        this.executeRequest('avatars');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::selectAvatar()
    public selectAvatar(uniqueId: string): void 
    {
        this.executeRequest('selectAvatar', {uniqueId});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::changeEmail()
    public changeEmail(newEmail: string, currentPassword: string): void 
    {
        this.executeRequest('changeEmail', {newEmail, currentPassword});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::createAvatar()
    public createAvatar(name: string): void 
    {
        this.executeRequest('createAvatar', {name});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::profile()
    public profile(): void 
    {
        this.executeRequest('profile');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::ssoToken()
    public ssoToken(): void 
    {
        this.executeRequest('ssoToken');
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::validateItunesIAP()
    public validateItunesIAP(transactionId: string, receipt: string, centPrice: number, priceLocale: string): void 
    {
        this.executeRequest('validateItunesIAP', {transactionId, receipt, centPrice, priceLocale});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::validatePlaystoreIAP()
    public validatePlaystoreIAP(transactionId: string, receipt: string, centPrice: number, priceLocale: string, signature: string): void 
    {
        this.executeRequest('validatePlaystoreIAP', {transactionId, receipt, centPrice, priceLocale, signature});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::setDeviceToken()
    public setDeviceToken(token: string): void 
    {
        this._deviceToken = token;
        this.executeRequest('setDeviceToken', {token});
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::getDeviceToken()
    public getDeviceToken(): string 
    {
        return this._deviceToken;
    }

    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

        // Dispose all requests
        for(const request of this._routes.values()) 
        {
            request.dispose();
        }

        this._routes.clear();
        this._listeners.length = 0;
        this._lastRequest = null;
        this._lastRequestVars = null;
        this._lastRequestPathParams = null;
    }

    /**
     * AS3: executeRequest(methodName, vars, pathParams)
     * Looks up the route for a method and executes the HTTP request.
     *
     * @param methodName - The name of the API method (matches WEB_API_ROUTES key)
     * @param vars - Request body variables (for POST) or query params (for GET)
     * @param pathParams - Path parameter substitutions (e.g., :id → value)
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::executeRequest()
    private executeRequest(
        methodName: string,
        vars: Record<string, unknown> | null = null,
        pathParams: (string | number)[] | null = null
    ): void 
    {
        const request = this._routes.get(methodName);

        if(!request) 
        {
            logger.warn(`Unknown API method: ${methodName}`);

            return;
        }

        this._lastRequest = request;
        this._lastRequestVars = vars;
        this._lastRequestPathParams = pathParams;

        // Resolve path parameters (:id, :roomId, etc.)
        let resolvedUri = request.uri;

        if(pathParams && pathParams.length > 0) 
        {
            let paramIndex = 0;

            resolvedUri = resolvedUri.replace(/:(\w+)/g, () => 
            {
                if(paramIndex < pathParams.length) 
                {
                    return String(pathParams[paramIndex++]);
                }

                return '';
            });
        }

        // Build URL
        let url = this.getURL(resolvedUri);

        // Build headers
        const headers: Record<string, string> = {};

        this.addHeaders(headers);

        // Build body
        let body: string | null = null;

        if(request.requestMethod === 'GET') 
        {
            // Append query string for GET requests
            if(vars && Object.keys(vars).length > 0) 
            {
                const params = new URLSearchParams();

                for(const [key, value] of Object.entries(vars)) 
                {
                    params.set(key, String(value));
                }

                url += '?' + params.toString();
            }
        }
        else 
        {
            // JSON body for non-GET requests
            headers['Content-Type'] = 'application/json';

            // Append captcha token if present
            if(this._captchaToken) 
            {
                if(!vars) vars = {};

                vars['captchaToken'] = this._captchaToken;
            }

            body = vars ? JSON.stringify(vars) : '{}';
        }

        request.makeRequest(this, url, headers, body);
    }

    /**
     * Re-executes the last request (after captcha token is set).
     */
    private reExecuteLastRequest(): void 
    {
        if(!this._lastRequest) return;

        // Find the method name for this request
        for(const [name, req] of this._routes.entries()) 
        {
            if(req.uri === this._lastRequest.uri) 
            {
                this.executeRequest(name, this._lastRequestVars, this._lastRequestPathParams);

                return;
            }
        }
    }

    /**
     * AS3: getURL(path)
     */
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::getURL()
    private getURL(path: string): string 
    {
        return this._server + path;
    }

    /**
     * Adds device ID and type headers to the request.
     */
    // DEVIATION: AS3 sends these three as `X-Habbo-Device-ID`, `x-habbo-api-deviceid` and
    //   `X-Habbo-Device-Type` (HabboWebApiSession.as:200-202). Renamed: this hotel is Vortex, and
    //   the only thing on the other end is `Vortex.WebApi`, which reads none of the three — so the
    //   old names were a former hotel's branding travelling to our own API and answering to
    //   nobody. The duplicate spelling is AS3's own and is kept: it sends the id twice, once
    //   title-cased and once lower-cased, because the two were read by different services.
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::addHeaders()
    private addHeaders(headers: Record<string, string>): void
    {
        headers['X-Vortex-Device-ID'] = this._deviceId;
        headers['x-vortex-api-deviceid'] = this._deviceId;
        headers['X-Vortex-Device-Type'] = 'web';
    }

    /**
     * Generates a device ID.
     */
    // DEVIATION: AS3 returns `machineId + ":" + SHA1(SHARED_SECRET + machineId)` — an id a server
    //   can RECOMPUTE, and one that is stable for a given machine. This returns a fresh random
    //   UUID per page load: no machine id to hash (Flash read one off `Capabilities`; a browser
    //   has no equivalent that is not fingerprinting), and no hash, because `crypto.subtle` is
    //   async and this is called from a constructor. Two consequences worth knowing before
    //   relying on it: the value identifies nothing across reloads, and it has neither the `:`
    //   nor the digest, so a server that validates the shape rejects it outright. Nothing does
    //   today — it goes out on the `*-Device-ID` headers above and `Vortex.WebApi` reads none of
    //   them — which is the only reason this is a note and not a defect.
    // AS3: .../src/com/sulake/habbo/communication/HabboWebApiSession.as::generateDeviceId()
    private generateDeviceId(): string
    {
        if(typeof crypto !== 'undefined' && crypto.randomUUID) 
        {
            return crypto.randomUUID();
        }

        // Fallback: random hex string
        return Array.from({length: 32}, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }
}
