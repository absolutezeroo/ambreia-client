/**
 * WebApiLoginProvider
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/login/WebApiLoginProvider.as
 *
 * Drives the login half of the web API and translates its answers into `ILoginViewer` calls. It
 * does not speak HTTP itself — `IHabboWebApiSession` does, and this class is the state machine
 * around it: which endpoint was asked, what its answer means, and where the flow goes next.
 *
 * Two pieces of that state matter and are easy to mistake for noise:
 * - `_pocketSessionMode` starts at LOGIN_AND_REGISTER and flips to SSO once a token has been
 *   issued. After the flip, `/api/user/avatars` and `/api/user/avatars/select` answers are ignored,
 *   which is what stops a second avatar fetch from restarting a login that already succeeded.
 * - `_autoLogin` is false in this build and never set true, so the branches that depend on it are
 *   unreachable here. They are ported because they are what the source says, and because the flag
 *   is the only thing separating "ask the user which avatar" from "reuse the stored one".
 */
import {EventEmitter} from 'eventemitter3';
import {Logger} from '@ambreia/common/utils/Logger';
import {CommunicationUtils} from '../../utils/CommunicationUtils';
import type {IHabboCommunicationManager} from '../IHabboCommunicationManager';
import type {IHabboWebApiListener} from '../IHabboWebApiListener';
import type {IHabboWebApiSession} from '../IHabboWebApiSession';
import {AvatarData} from './AvatarData';
import type {ICaptchaHandler} from './ICaptchaHandler';
import type {ICaptchaView} from './ICaptchaView';
import type {ILoginProvider} from './ILoginProvider';
import type {ILoginViewer} from './ILoginViewer';

const log = Logger.getLogger('habbo.communication.login.WebApiLoginProvider');

export class WebApiLoginProvider extends EventEmitter implements ILoginProvider, IHabboWebApiListener, ICaptchaHandler
{
    // AS3: POCKET_MODE_LOGIN_AND_REGISTER
    private static readonly POCKET_MODE_LOGIN_AND_REGISTER = 1;

    // AS3: POCKET_MODE_SSO — obfuscated as _SafeStr_11598 in the 701 tree; named from its use.
    private static readonly POCKET_MODE_SSO = 2;

    // AS3: ERROR_TYPE_IO_ERROR
    public static readonly ERROR_TYPE_IO_ERROR: string = 'ioError';

    // AS3: ERROR_CODE_MAINTENANCE
    public static readonly ERROR_CODE_MAINTENANCE: string = 'maintenance';

    // AS3: SsoTokenAvailableEvent.SSO_TOKEN_AVAILABLE
    public static readonly SSO_TOKEN_AVAILABLE: string = 'SSO_TOKEN_AVAILABLE';

    // AS3: AUTO_RECONNECT — declared and unused in the 701 source.
    private static readonly AUTO_RECONNECT: boolean = false;

    // AS3: _communication
    private _communication: IHabboCommunicationManager | null = null;

    // AS3: _viewer
    private _viewer: ILoginViewer;

    // AS3: _pendingLoginError
    private _pendingLoginError: unknown = null;

    // AS3: _autoLogin
    private _autoLogin: boolean = false;

    // AS3: _pocketSessionMode
    private _pocketSessionMode: number = WebApiLoginProvider.POCKET_MODE_LOGIN_AND_REGISTER;

    // AS3: _name
    private _name: string = '';

    // AS3: _password
    private _password: string = '';

    // AS3: _loginMode
    private _loginMode: number = 0;

    // AS3: _selectedUniqueId
    private _selectedUniqueId: string = '';

    // AS3: _ssoToken
    private _ssoToken: string | null = null;

    // AS3: _session
    private _session: IHabboWebApiSession | null = null;

    // AS3: _captchaView
    private _captchaView: ICaptchaView | null = null;

    // TS-only: the port disposes explicitly; the session skips disposed listeners.
    private _disposed: boolean = false;

    // AS3: WebApiLoginProvider(_arg_1:ILoginViewer)
    constructor(viewer: ILoginViewer)
    {
        super();

        this._viewer = viewer;
    }

    /**
     * AS3: get disposed():Boolean
     *
     * AS3 answers a hard `false` — the provider outlives every request. The port has a real
     * lifecycle (`dispose()` is called when the login flow is torn down), and the session uses this
     * to skip dead listeners, so it reports the truth.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/WebApiLoginProvider.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // TS-only: the token this provider obtained, for callers that keep it.
    public get ssoToken(): string | null
    {
        return this._ssoToken;
    }

    /**
     * AS3: init(_arg_1:IHabboCommunicationManager)
     *
     * AS3 creates the session twice — once inline against `web.api`, once through
     * `createHabboWebApiSession()`, which disposes the first. Only the second survives, so the port
     * keeps the surviving call and drops the discarded one.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/WebApiLoginProvider.as::init()
    public init(communication: IHabboCommunicationManager | null): void
    {
        this._communication = communication;

        const webApi = this.getProperty('web.api');

        log.debug(`Init with: ${webApi}`);

        this._session = this.createHabboWebApiSession();
        this.initHabboWebApiSession();
    }

    /**
     * AS3: loginWithCredentials(_arg_1:String, _arg_2:String, _arg_3:int=0)
     *
     * `code` is the TS-only second factor (see `IHabboWebApiSession.login()`). It is deliberately
     * NOT kept in a field the way `_name`/`_password` are: the two survive so the unreachable
     * `_autoLogin` re-login can replay them, and a TOTP code is single-use and expires, so replaying
     * one would fail the very attempt it was meant to rescue.
     */
    public loginWithCredentials(email: string, password: string, loginMode: number = 0, code?: string): void
    {
        this._name = email;
        this._password = password;
        this._loginMode = loginMode;

        if(this._session)
        {
            this._session.login(email, password, code);

            return;
        }

        log.warn('Login not available');
    }

    // AS3: loginWithCredentialsWeb(_arg_1:String)
    public loginWithCredentialsWeb(uniqueId: string): void
    {
        this._selectedUniqueId = uniqueId;

        if(this._session)
        {
            this._session.selectAvatar(uniqueId);

            return;
        }

        log.warn('Login not available');
    }

    // AS3: selectAvatar(_arg_1:int) — empty in the 701 source.
    public selectAvatar(_id: number): void
    {
        // AS3 leaves this empty.
    }

    // AS3: selectAvatarUniqueid(_arg_1:String)
    public selectAvatarUniqueid(uniqueId: string): void
    {
        if(this._session == null) return;

        this._session.selectAvatar(uniqueId);
    }

    /**
     * AS3: habboWebApiError(_arg_1:String, _arg_2:int, _arg_3:String, _arg_4:Object, _arg_5:Boolean=false)
     *
     * The 701 switch lists `/api/ssotoken` twice. Only the first arm can ever run, and it falls
     * through into the hello arm — so an SSO-token failure shows the login screen. The second arm
     * (which would have called `showInvalidLoginError`) is unreachable; ported as written rather
     * than "corrected", since the reachable behaviour is what the client actually does.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/WebApiLoginProvider.as::habboWebApiError()
    public habboWebApiError(
        uri: string,
        _status: number,
        errorType: string,
        data: Record<string, unknown> | null,
        isCaptcha: boolean = false
    ): void
    {
        log.debug(`Api Error: id: ${uri} type: ${errorType} captcha: ${isCaptcha}`);

        let keepAutoLogin = false;

        if(errorType === WebApiLoginProvider.ERROR_TYPE_IO_ERROR)
        {
            keepAutoLogin = true;
        }

        const session = this._communication?.getHabboWebApiSession() ?? null;

        switch(uri)
        {
            case '/api/ssotoken':
                if(this._autoLogin)
                {
                    keepAutoLogin = true;
                    session?.login(this._name, this._password);
                }

            // falls through — see the method comment.
            case '/api/public/info/hello':
                this._viewer.showLoginScreen();
                break;

            case '/api/public/registration/new':
                this._viewer.showRegistrationError(data);
                break;

            case '/api/user/avatars':
                log.debug('There was an error getting the Avatars');
                this._viewer.showInvalidLoginError(data);
                break;

            case '/api/newuser/name/check':
            case '/api/newuser/name/select':
                log.debug('There was an error checking name');
                this._viewer.nameCheckResponse(data, uri === '/api/newuser/name/check');
                break;

            case '/api/public/authentication/login':
            case '/api/public/authentication/facebook':
            case '/api/force/tos-accept':
            {
                log.debug('There was an error authorizing connection...');

                const payload = data as {message?: unknown; error?: unknown; errors?: unknown; captcha?: unknown} | null;

                if(payload != null && (payload.message != null || payload.error != null || payload.errors != null))
                {
                    if(isCaptcha)
                    {
                        const captchaOnly = payload.captcha === true && payload.message === 'invalid-captcha';

                        if(!captchaOnly)
                        {
                            this._pendingLoginError = data;
                        }

                        this.showCaptchaView();
                        break;
                    }

                    this._viewer.showInvalidLoginError(data);
                    break;
                }

                if(isCaptcha)
                {
                    this.showCaptchaView();
                    break;
                }

                this._viewer.showInvalidLoginError(null);
                break;
            }

            case '/api/user/avatars/select':
                log.debug('There was an error selecting avatar');

                if(session)
                {
                    this._viewer.showAccountError(data);
                    this._viewer.showLoadingScreen();
                    session.avatars();
                    break;
                }

                this._viewer.showInvalidLoginError(data);
                break;

            case '/api/newuser/room/select':
                log.debug('There was an error selecting home room.');
                break;

            case '/api/user/look/save':
                this._viewer.saveLooksError(data);
                break;

            default:
                log.debug(`Did not process Habbo API message: ${uri}`);
                break;
        }

        if(!keepAutoLogin)
        {
            this._autoLogin = false;
        }
    }

    /**
     * AS3: habboWebApiResponse(_arg_1:String, _arg_2:Object)
     */
    // AS3: .../src/com/sulake/habbo/communication/login/WebApiLoginProvider.as::habboWebApiResponse()
    public habboWebApiResponse(uri: string, data: Record<string, unknown>): void
    {
        log.debug(`Got Habbo Web Api Response: ${uri}`, data);

        const session = this._communication?.getHabboWebApiSession() ?? null;

        if(session == null) return;

        if(data != null && data.force != null && Array.isArray(data.force))
        {
            const forced = data.force as string[];

            if(forced.indexOf('TOS') > -1)
            {
                this._viewer.showTOS();

                return;
            }

            if(forced.indexOf('EMAIL') > -1 || forced.indexOf('PASSWORD') > -1)
            {
                this._viewer.showInvalidLoginError({errors: ['account_issue']});

                return;
            }
        }

        switch(uri)
        {
            case '/api/public/info/hello':
                if(this._autoLogin)
                {
                    session.ssoToken();
                    break;
                }

                this._viewer.environmentReady();
                break;

            case '/api/user/avatars/select':
                if(this._pocketSessionMode !== WebApiLoginProvider.POCKET_MODE_SSO)
                {
                    session.ssoToken();
                }

                break;

            case '/api/public/authentication/login':
            case '/api/public/authentication/facebook':
            case '/api/force/tos-accept':
            {
                const method = uri === '/api/public/authentication/login'
                    ? CommunicationUtils.LOGIN_METHOD_HABBO
                    : CommunicationUtils.LOGIN_METHOD_FACEBOOK;

                CommunicationUtils.writeProperty(CommunicationUtils.SOL_PROPERTY_LOGIN_METHOD, method);
                this.fetchAvatars();
                break;
            }

            case '/api/user/avatars':
            {
                if(this._pocketSessionMode === WebApiLoginProvider.POCKET_MODE_SSO) break;

                const avatars: AvatarData[] = [];

                for(const entry of WebApiLoginProvider.toAvatarArray(data))
                {
                    avatars.push(new AvatarData(entry));
                }

                // DELIBERATE DIVERGENCE: AS3 selects a lone avatar outright and never shows the
                // picker for it (`if(_loc7_.length == 1) { ...; selectAvatar(...); break; }`). That
                // shortcut costs nothing on habbo.com, where avatars are managed on the website —
                // but this project has no CMS, and the picker is the only screen from which an
                // account can gain a second avatar. Keeping the shortcut makes that screen
                // unreachable for precisely the accounts that need it: the ones with one avatar.
                //
                // To restore the AS3 behaviour, put the block back — nothing else depends on this.
                // `_autoLogin` is false in this build and never set true, so dropping it here cannot
                // strand the auto-login path either: `populateCharacterList()` below always runs.
                if(avatars.length === 1)
                {
                    CommunicationUtils.writeProperty(
                        CommunicationUtils.SOL_PROPERTY_CHARACTER_UNIQUE_ID,
                        avatars[0].uniqueId
                    );
                }

                if(!this._autoLogin)
                {
                    this._viewer.populateCharacterList(avatars);
                }

                break;
            }

            case '/api/ssotoken':
                this._ssoToken = data['ssoToken'] as string;
                this._pocketSessionMode = WebApiLoginProvider.POCKET_MODE_SSO;
                this.emit(WebApiLoginProvider.SSO_TOKEN_AVAILABLE, this._ssoToken);
                break;

            case '/api/public/registration/new':
                if(data != null)
                {
                    const id = parseInt(String(data.id), 10);

                    CommunicationUtils.writeProperty(CommunicationUtils.SOL_PROPERTY_CHARACTER_ID, id.toString());
                }

                this._viewer.showSelectAvatar(data);
                break;

            case '/api/public/lists/hotlooks':
                this._viewer.showPromoHabbos(data);
                break;

            case '/api/newuser/name/select':
            case '/api/newuser/name/check':
                this._viewer.nameCheckResponse(data, uri === '/api/newuser/name/check');
                break;

            case '/api/user/look/save':
                this._viewer.showSelectRoom();
                break;

            case '/api/newuser/room/select':
                CommunicationUtils.writeProperty(
                    CommunicationUtils.SOL_PROPERTY_LOGIN_METHOD,
                    CommunicationUtils.LOGIN_METHOD_HABBO
                );
                this.fetchAvatars();
                break;
        }
    }

    // AS3: habboWebApiRawResponse(_arg_1:String, _arg_2:Object) — empty in the 701 source.
    public habboWebApiRawResponse(_uri: string, _data: unknown): void
    {
        // AS3 leaves this empty.
    }

    /**
     * AS3: onUserList(_arg_1:Vector.<AvatarData>)
     *
     * Not reached from the session in this build — the avatar list arrives through
     * `habboWebApiResponse()`. Ported because it is part of the class and is what an auto-login
     * would go through.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/WebApiLoginProvider.as::onUserList()
    public onUserList(avatars: AvatarData[]): void
    {
        if(this._autoLogin)
        {
            const storedId = CommunicationUtils.readProperty(CommunicationUtils.SOL_PROPERTY_CHARACTER_UNIQUE_ID) ?? '';

            if(!WebApiLoginProvider.userExists(avatars, storedId))
            {
                this._viewer.populateCharacterList(avatars);
            }

            return;
        }

        this._viewer.populateCharacterList(avatars);
    }

    // AS3: closeCaptcha()
    public closeCaptcha(): void
    {
        this.removeCaptchaView();
    }

    // AS3: handleCaptchaError()
    public handleCaptchaError(): void
    {
        this.removeCaptchaView();
        this._viewer.showCaptchaError();
    }

    /**
     * AS3: handleCaptchaResult(_arg_1:String)
     *
     * The pending error is shown BEFORE the token is applied: it is the failure that triggered the
     * captcha in the first place, and the user has to see why they were challenged.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/WebApiLoginProvider.as::handleCaptchaResult()
    public handleCaptchaResult(token: string): void
    {
        this.removeCaptchaView();
        this._viewer.captchaReady();

        if(this._pendingLoginError)
        {
            this._viewer.showInvalidLoginError(this._pendingLoginError);
            this._pendingLoginError = null;
        }

        if(token == null || this._session == null)
        {
            this._viewer.showCaptchaError();

            return;
        }

        this._session.setCaptchaToken(token);
    }

    // AS3: getProperty(_arg_1:String, _arg_2:Dictionary=null):String
    public getProperty(key: string): string | null
    {
        return this._viewer.getProperty(key);
    }

    /**
     * AS3: createHabboWebApiSession():IHabboWebApiSession
     *
     * An existing session is disposed first, so a hotel switch does not keep talking to the old
     * host. The `url.prefix` fallback is forced to https — the API refuses plaintext.
     */
    // AS3: .../src/com/sulake/habbo/communication/login/WebApiLoginProvider.as::createHabboWebApiSession()
    private createHabboWebApiSession(): IHabboWebApiSession | null
    {
        if(!this._communication) return null;

        const existing = this._communication.getHabboWebApiSession();

        if(existing != null)
        {
            existing.dispose();
        }

        let url = this.getProperty('web.api') ?? '';

        if(url === '')
        {
            url = (this.getProperty('url.prefix') ?? '').replace('http:', 'https:');
        }

        return this._communication.createHabboWebApiSession(this, url);
    }

    // AS3: initHabboWebApiSession()
    private initHabboWebApiSession(): void
    {
        if(this._session)
        {
            this._session.hello();

            return;
        }

        throw new Error('Tried to init null IHabboWebApiSession');
    }

    // AS3: showCaptchaView()
    private showCaptchaView(): void
    {
        this._captchaView = this._viewer.createCaptchaView();

        if(this._captchaView == null)
        {
            this._viewer.showCaptchaError();
        }
    }

    // AS3: removeCaptchaView()
    private removeCaptchaView(): void
    {
        if(this._captchaView != null)
        {
            this._captchaView.dispose();
            this._captchaView = null;
        }
    }

    /**
     * AS3: fetchAvatars()
     */
    // AS3: .../src/com/sulake/habbo/communication/login/WebApiLoginProvider.as::fetchAvatars()
    private fetchAvatars(): void
    {
        if(this._session == null) return;

        if(this._autoLogin)
        {
            const storedId = CommunicationUtils.readProperty(CommunicationUtils.SOL_PROPERTY_CHARACTER_UNIQUE_ID);

            if(storedId)
            {
                this._session.selectAvatar(storedId);
            }
            else
            {
                this._session.avatars();
            }

            return;
        }

        if(this._pocketSessionMode === WebApiLoginProvider.POCKET_MODE_LOGIN_AND_REGISTER)
        {
            this._session.avatars();
        }
    }

    // AS3: userExists(_arg_1:Vector.<AvatarData>, _arg_2:String):Boolean
    private static userExists(avatars: AvatarData[], uniqueId: string): boolean
    {
        for(const avatar of avatars)
        {
            if(avatar.uniqueId === uniqueId) return true;
        }

        return false;
    }

    /**
     * TS-only: AS3 iterates the decoded response with `for each`, which walks a JSON array and a
     * JSON object's values alike. `fetch()` hands back one shape or the other depending on the
     * server, so the array is picked out explicitly here.
     */
    private static toAvatarArray(data: unknown): Record<string, unknown>[]
    {
        if(Array.isArray(data)) return data as Record<string, unknown>[];

        if(data && typeof data === 'object')
        {
            const record = data as Record<string, unknown>;

            if(Array.isArray(record.avatars)) return record.avatars as Record<string, unknown>[];

            if(Array.isArray(record.data)) return record.data as Record<string, unknown>[];
        }

        return [];
    }

    // TS-only: the login flow disposes the provider when it tears down; AS3 relies on collection.
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.removeCaptchaView();
        this._session = null;
        this._communication = null;
        this.removeAllListeners();
    }
}
