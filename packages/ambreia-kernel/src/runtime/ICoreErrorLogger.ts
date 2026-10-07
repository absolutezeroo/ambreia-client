/**
 * Core Error Logger Interface
 *
 * Receives error and crash messages for external logging (e.g., analytics, server).
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/runtime/ICoreErrorLogger.as
 */
export interface ICoreErrorLogger
{
    /**
	 * Log a fatal crash
	 */
    logCrash(message: string): void;

    /**
	 * Log a non-fatal error
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/runtime/ICoreErrorLogger.as::logError()
    logError(message: string): void;
}
