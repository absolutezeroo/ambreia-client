/**
 * ApiRequest
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/ApiRequest.as
 *
 * HTTP request executor using the Fetch API.
 * Replaces AS3's URLLoader/URLRequest-based implementation.
 */
import type {IApiListener} from './IApiListener';

export class ApiRequest
{
    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::ERROR_TYPE_INVALID_CAPTCHA
    public static readonly ERROR_TYPE_INVALID_CAPTCHA = 'invalid-captcha';

    private _listener: IApiListener | null = null;
    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::_uri
    private _uri: string;
    private _requestMethod: string;
    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::_currentStatus
    private _currentStatus: number = 0;
    private _abortController: AbortController | null = null;

    /**
	 * AS3: ApiRequest(requestMethod, uri)
	 */
    constructor(requestMethod: string, uri: string)
    {
        this._requestMethod = requestMethod;
        this._uri = uri;
    }

    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::get uri()
    get uri(): string
    {
        return this._uri;
    }

    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::get requestMethod()
    get requestMethod(): string
    {
        return this._requestMethod;
    }

    /**
	 * AS3: makeRequest(listener, urlRequest)
	 * Executes the HTTP request using fetch().
	 *
	 * @param listener - Callback for success/error
	 * @param url - Full request URL
	 * @param headers - Request headers
	 * @param body - Request body (for POST/PUT)
	 */
    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::makeRequest()
    public makeRequest(
        listener: IApiListener,
        url: string,
        headers: Record<string, string>,
        body?: string | null
    ): void
    {
        this._listener = listener;
        this._abortController = new AbortController();

        const options: RequestInit = {
            method: this._requestMethod,
            headers,
            credentials: 'include',
            signal: this._abortController.signal,
        };

        if(body && this._requestMethod !== 'GET')
        {
            options.body = body;
        }

        this.executeRequest(url, options);
    }

    /**
	 * Executes the fetch request and routes the response.
	 */
    private async executeRequest(url: string, options: RequestInit): Promise<void>
    {
        try
        {
            const response = await fetch(url, options);

            // AS3: httpStatusHandler — store status
            this._currentStatus = response.status;

            if(response.ok)
            {
                // AS3: completeHandler — parse response
                await this.completeHandler(response);
            }
            else
            {
                // AS3: ioErrorHandler — HTTP error
                await this.ioErrorHandler(response);
            }
        }
        catch (error)
        {
            if(error instanceof DOMException && error.name === 'AbortError')
            {
                return;
            }

            // AS3: securityErrorHandler — network/CORS error
            this.securityErrorHandler();
        }
    }

    /**
	 * AS3: completeHandler(event)
	 * Parses the response and calls the appropriate listener callback.
	 */
    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::completeHandler()
    private async completeHandler(response: Response): Promise<void>
    {
        if(!this._listener) return;

        try
        {
            const text = await response.text();

            let data: Record<string, unknown>;

            try
            {
                data = JSON.parse(text) as Record<string, unknown>;
            }
            catch
            {
                // Non-JSON response — raw response
                this._listener.apiRawResponse(this._uri, text);

                return;
            }

            // AS3: Check for error in response object
            if(this._currentStatus >= 400 || (data && typeof data.error === 'string'))
            {
                this._listener.apiError(this._uri, this._currentStatus, (data.error as string) ?? 'unknown', data);
            }
            else
            {
                this._listener.apiResponse(this._uri, data);
            }
        }
        catch
        {
            this._listener.apiRawResponse(this._uri, null);
        }
    }

    /**
	 * AS3: ioErrorHandler(event)
	 * Handles HTTP error responses.
	 */
    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::ioErrorHandler()
    private async ioErrorHandler(response: Response): Promise<void>
    {
        if(!this._listener) return;

        let data: Record<string, unknown> | null = null;
        let isCaptcha = false;

        try
        {
            const text = await response.text();

            data = JSON.parse(text) as Record<string, unknown>;

            // AS3: Check captcha flag
            if(data && data.captcha === true)
            {
                isCaptcha = true;
            }
        }
        catch
        {
            // Could not parse error body
        }

        // Extract error string
        let error = 'ioError';

        if(data)
        {
            if(typeof data.error === 'string')
            {
                error = data.error;
            }
            else if(Array.isArray(data.errors) && (data.errors as string[]).length > 0)
            {
                error = (data.errors as string[])[0];
            }
            else if(typeof data.message === 'string')
            {
                error = data.message;
            }
        }

        this._listener.apiError(this._uri, response.status, error, data, isCaptcha);
    }

    /**
	 * AS3: securityErrorHandler(event)
	 * Handles network/CORS errors.
	 */
    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::securityErrorHandler()
    private securityErrorHandler(): void
    {
        if(!this._listener) return;

        this._listener.apiError(this._uri, -1, 'securityError', null);
    }

    /**
	 * AS3: dispose()
	 */
    // AS3: .../src/com/sulake/habbo/communication/ApiRequest.as::dispose()
    public dispose(): void
    {
        if(this._abortController)
        {
            this._abortController.abort();
            this._abortController = null;
        }

        this._listener = null;
    }
}
