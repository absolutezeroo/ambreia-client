/**
 * IApiListener
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_1761.as
 *
 * Internal callback interface for ApiRequest → caller communication.
 * Called when an HTTP request completes (success or error).
 */
export interface IApiListener
{
    /**
	 * Called when the API returns a successful JSON response.
	 *
	 * @param uri - The request URI path
	 * @param data - Parsed JSON response data
	 */
    apiResponse(uri: string, data: Record<string, unknown>): void;

    /**
	 * Called when the API returns a successful non-JSON response.
	 *
	 * @param uri - The request URI path
	 * @param data - Raw response data
	 */
    apiRawResponse(uri: string, data: unknown): void;

    /**
	 * Called when the API returns an error.
	 *
	 * @param uri - The request URI path
	 * @param status - HTTP status code (-1 for security error, -2 for IO error)
	 * @param error - Error type string
	 * @param data - Parsed error response data
	 * @param isCaptcha - Whether this error requires captcha verification
	 */
    apiError(uri: string, status: number, error: string, data: Record<string, unknown> | null, isCaptcha?: boolean): void;
}
