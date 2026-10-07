/**
 * IHabboWebApiListener
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_83.as
 *
 * External listener interface for HabboWebApiSession responses.
 * Implemented by WebApiLoginProvider and other components that need
 * to receive Web API responses.
 */
export interface IHabboWebApiListener
{
    /**
	 * Whether this listener has been disposed.
	 */
    readonly disposed: boolean;

    /**
	 * Called when a Web API request returns a successful JSON response.
	 *
	 * @param uri - The request URI path
	 * @param data - Parsed JSON response data
	 */
    habboWebApiResponse(uri: string, data: Record<string, unknown>): void;

    /**
	 * Called when a Web API request returns a successful non-JSON response.
	 *
	 * @param uri - The request URI path
	 * @param data - Raw response data
	 */
    habboWebApiRawResponse(uri: string, data: unknown): void;

    /**
	 * Called when a Web API request returns an error.
	 *
	 * @param uri - The request URI path
	 * @param status - HTTP status code
	 * @param error - Error type string
	 * @param data - Parsed error response data
	 * @param isCaptcha - Whether this error requires captcha verification
	 */
    habboWebApiError(uri: string, status: number, error: string, data: Record<string, unknown> | null, isCaptcha?: boolean): void;
}
