import type {ICore} from '@core/runtime/ICore';
import type {ICoreErrorReporter} from '@core/runtime/ICoreErrorReporter';
import {CoreComponentContext, CoreSetup} from '@core/runtime/CoreComponentContext';
import {DefaultErrorReporter} from '@core/runtime/DefaultErrorReporter';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('core.Core');

/**
 * Core — Static singleton facade for the core runtime.
 *
 * Equivalent to AS3 class_79 (com.sulake.core.Core).
 *
 * Provides static convenience methods for error/warning/debug logging
 * and holds the singleton ICore instance (CoreComponentContext).
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as
 */
export class Core
{
    static readonly VERSION = '0.0.3';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_DOWNLOAD_CONFIGURATION
    static readonly ERROR_CATEGORY_DOWNLOAD_CONFIGURATION = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_DOWNLOAD_LIBRARY
    static readonly ERROR_CATEGORY_DOWNLOAD_LIBRARY = 2;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_DOWNLOAD_CRITICAL_ASSET
    static readonly ERROR_CATEGORY_DOWNLOAD_CRITICAL_ASSET = 3;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_PREPARE_COMPONENT
    static readonly ERROR_CATEGORY_PREPARE_COMPONENT = 4;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_COMPONENT_RESOURCE_LOAD_ERROR
    static readonly ERROR_CATEGORY_COMPONENT_RESOURCE_LOAD_ERROR = 5;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_INTERFACE_AVAILABILITY
    static readonly ERROR_CATEGORY_INTERFACE_AVAILABILITY = 6;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_PRODUCT_DATA
    static readonly ERROR_CATEGORY_PRODUCT_DATA = 7;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_DOWNLOAD_LOCALIZATION
    static readonly ERROR_CATEGORY_DOWNLOAD_LOCALIZATION = 8;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_FINALIZE_PRELOADING
    static readonly ERROR_CATEGORY_FINALIZE_PRELOADING = 9;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_INITIALIZE_CORE
    static readonly ERROR_CATEGORY_INITIALIZE_CORE = 10;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_DOWNLOAD_FONT
    static readonly ERROR_CATEGORY_DOWNLOAD_FONT = 11;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_FURNIDATA_DOWNLOAD
    static readonly ERROR_CATEGORY_FURNIDATA_DOWNLOAD = 12;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_DOWNLOAD_EXTERNAL_VARIABLES
    static readonly ERROR_CATEGORY_DOWNLOAD_EXTERNAL_VARIABLES = 20;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_DOWNLOAD_EXTERNAL_VARIABLES_OVERRIDE
    static readonly ERROR_CATEGORY_DOWNLOAD_EXTERNAL_VARIABLES_OVERRIDE = 21;
    static readonly ERROR_CATEGORY_COMMUNICATION_INIT = 29;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_CONNECT_TO_PROXY
    static readonly ERROR_CATEGORY_CONNECT_TO_PROXY = 30;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_UNCAUGHT_ERROR
    static readonly ERROR_UNCAUGHT_ERROR = 40;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::ERROR_CATEGORY_INTENTIONAL_DEBUG_CRASH
    static readonly ERROR_CATEGORY_INTENTIONAL_DEBUG_CRASH = 99;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::CORE_SETUP_FRAME_UPDATE_SIMPLE
    static readonly CORE_SETUP_FRAME_UPDATE_SIMPLE = CoreSetup.FRAME_UPDATE_SIMPLE;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::CORE_SETUP_FRAME_UPDATE_COMPLEX
    static readonly CORE_SETUP_FRAME_UPDATE_COMPLEX = CoreSetup.FRAME_UPDATE_COMPLEX;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::CORE_SETUP_FRAME_UPDATE_PROFILER
    static readonly CORE_SETUP_FRAME_UPDATE_PROFILER = CoreSetup.FRAME_UPDATE_PROFILER;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::CORE_SETUP_FRAME_UPDATE_EXPERIMENT
    static readonly CORE_SETUP_FRAME_UPDATE_EXPERIMENT = CoreSetup.FRAME_UPDATE_EXPERIMENT;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::CORE_SETUP_FRAME_UPDATE_MASK
    static readonly CORE_SETUP_FRAME_UPDATE_MASK = CoreSetup.FRAME_UPDATE_MASK;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::CORE_SETUP_DEBUG
    static readonly CORE_SETUP_DEBUG = CoreSetup.DEBUG;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::_instance
    private static _instance: ICore | null = null;

    /**
	 * Get the core instance.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::get instance()
    static get instance(): ICore | null
    {
        return Core._instance;
    }

    /**
	 * Create and return the core singleton.
	 *
	 * @param setupFlags - Core setup flags (default: simple frame update)
	 * @param errorReporter - Error reporter (default: DefaultErrorReporter)
	 * @param args - Core arguments
	 * @returns The ICore instance
	 *
	 * @see class_79.as lines 81-88
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::instantiate()
    static instantiate(
        setupFlags: number = CoreSetup.FRAME_UPDATE_SIMPLE,
        errorReporter?: ICoreErrorReporter,
        args?: Map<string, unknown>
    ): ICore
    {
        if(Core._instance === null)
        {
            Core._instance = new CoreComponentContext(
                errorReporter ?? new DefaultErrorReporter(),
                setupFlags,
                args
            );
        }

        return Core._instance;
    }

    /**
	 * Log an error via the core.
	 *
	 * @see class_79.as lines 90-96
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::error()
    static error(message: string, critical: boolean, category: number = -1, error: Error | null = null): void
    {
        if(Core._instance)
        {
            Core._instance.error(message, critical, category, error ?? undefined);
        }
    }

    /**
	 * Log a warning via the core.
	 *
	 * @see class_79.as lines 98-108
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::warning()
    static warning(message: string): void
    {
        if(Core._instance)
        {
            Core._instance.warning(message);
        }

        log.warn(message);
    }

    /**
	 * Log a debug message via the core.
	 *
	 * @see class_79.as lines 110-120
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::debug()
    static debug(message: string): void
    {
        if(Core._instance)
        {
            Core._instance.debug(message);
        }

        log.debug(message);
    }

    /**
	 * Log a fatal crash via the core.
	 *
	 * @see class_79.as lines 122-128
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::crash()
    static crash(message: string, code: number, error: Error | null = null): void
    {
        if(Core._instance)
        {
            Core._instance.error(message, true, code, error ?? undefined);
        }
    }

    /**
	 * Purge all components.
	 *
	 * @see class_79.as lines 130-136
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::purge()
    static purge(): void
    {
        if(Core._instance)
        {
            Core._instance.purge();
        }
    }

    /**
	 * Dispose the core.
	 *
	 * @see class_79.as lines 138-145
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/Core.as::dispose()
    static dispose(): void
    {
        if(Core._instance !== null)
        {
            Core._instance.dispose();
            Core._instance = null;
        }
    }
}
