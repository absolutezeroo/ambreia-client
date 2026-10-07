import type {ICoreErrorLogger} from './ICoreErrorLogger';

/**
 * Core Error Reporter Interface
 *
 * Reports errors from the core runtime to an optional external logger.
 *
 * TS-only: no AS3 counterpart in any tree. AS3's `CoreComponentContext` holds an `ICoreErrorLogger`
 * directly — see `DefaultErrorReporter`'s own DEVIATION note for why this interface exists.
 */
export interface ICoreErrorReporter
{
    /**
	 * Set the external error logger
	 */
    errorLogger: ICoreErrorLogger | null;

    /**
	 * Log an error
	 *
	 * @param message - Error message
	 * @param critical - Whether this error is fatal
	 * @param category - Error category code (see Core error constants)
	 * @param error - The underlying Error object, if any
	 */
    logError(message: string, critical: boolean, category?: number, error?: Error | null): void;
}
