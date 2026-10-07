import type {ICoreErrorReporter} from './ICoreErrorReporter';
import type {ICoreErrorLogger} from './ICoreErrorLogger';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('core.runtime.DefaultErrorReporter');

/**
 * Default error reporter implementation.
 *
 * Logs errors via the Logger system.
 *
 * DEVIATION: AS3 has no reporter layer. `CoreComponentContext` holds an `ICoreErrorLogger`
 * directly and calls `logError()` on it; `ConsoleCoreErrorReporter` is the only implementation and
 * it forwards to `Logger.log`. This port inserted `ICoreErrorReporter` between the two so the
 * context can be handed a reporter that owns its own logger. Same behaviour, one more indirection
 * — the class this stands in for is the one traced below.
 *
 * AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/runtime/ConsoleCoreErrorReporter.as
 */
export class DefaultErrorReporter implements ICoreErrorReporter
{
    private _errorLogger: ICoreErrorLogger | null = null;

    get errorLogger(): ICoreErrorLogger | null
    {
        return this._errorLogger;
    }

    set errorLogger(value: ICoreErrorLogger | null)
    {
        this._errorLogger = value;
    }

    logError(message: string, critical: boolean, _category: number = -1, error: Error | null = null): void
    {
        log.error(message, error?.stack ?? '');

        if(this._errorLogger)
        {
            if(critical)
            {
                this._errorLogger.logCrash(message);
            }
            else
            {
                this._errorLogger.logError(message);
            }
        }
    }
}
