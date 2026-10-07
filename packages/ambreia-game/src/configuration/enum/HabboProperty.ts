/**
 * Configuration property key constants
 *
 * Based on AS3: com.sulake.habbo.configuration.enum.HabboProperty
 *
 * Provides type-safe access to configuration values,
 * preventing typos when accessing getProperty/setProperty.
 *
 * Usage:
 * ```typescript
 * const host = config.getProperty(HabboProperty.CONNECTION_HOST);
 * ```
 */
export const HabboProperty = {
    // Environment
    ENVIRONMENT_ID: 'environment.id',
    LIVE_ENVIRONMENTS: 'live.environment.list',

    // Authentication
    SSO_TOKEN: 'sso.token',
    USE_SSO: 'use.sso',

    // Connection
    CONNECTION_HOST: 'connection.info.host',
    CONNECTION_PORT: 'connection.info.port',
    DISABLE_CRYPTO: 'disable.crypto',

    // URLs
    URL_PREFIX: 'url.prefix',
    SITE_URL: 'site.url',
    CLIENT_URL: 'flash.client.url',
    CLIENT_ORIGIN: 'flash.client.origin',
    LOGOUT_URL: 'logout.url',
    LOGOUT_DISCONNECT_URL: 'logout.disconnect.url',

    // Dynamic download
    DYNAMIC_DOWNLOAD_URL: 'flash.dynamic.download.url',
    DYNAMIC_DOWNLOAD_NAME_TEMPLATE: 'flash.dynamic.download.name.template',
    DYNAMIC_AVATAR_DOWNLOAD_CONFIGURATION: 'flash.dynamic.avatar.download.configuration',
    DYNAMIC_AVATAR_DOWNLOAD_URL: 'flash.dynamic.avatar.download.url',

    // External APIs
    POCKET_API: 'pocket.api',
    WEB_API: 'web.api',
    FACEBOOK_APPLICATION_ID: 'facebook.application.id',

    // External files
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/configuration/enum/HabboProperty.as::EXTERNAL_VARIABLES
    EXTERNAL_VARIABLES: 'external.variables.txt',
    GAMEDATA_HASHES_URL: 'gamedata.hashes.url',

    // Client state
    CLIENT_STARTING: 'client.starting',
    CLIENT_STARTING_LOADING: 'client.starting.revolving',

    // Logging
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::PROCESSLOG_ENABLED_KEY
    PROCESSLOG_ENABLED_KEY: 'processlog.enabled',

    // New user flow
    NEW_USER_FLOW_ENABLED: 'new.user.flow.enabled',
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::NEW_USER_ONBOARDING_PAGE_TO_SHOW
    NEW_USER_ONBOARDING_PAGE_TO_SHOW: 'new.user.flow.page',
    NEW_USER_ONBOARDING_HC_FLOW_ENABLED: 'new.user.onboarding.hc.flow.enabled',
    NEW_USER_ONBOARDING_SHOW_HC_ITEMS: 'new.user.onboarding.show.hc.items',

    // Legal
    TERMS_OF_SERVICE_URL: 'web.terms_of_service.link',

    // Connection — where the client opens its socket, read by HabboCommunicationManager.
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::CONNECTION_INFO_HOST
    CONNECTION_INFO_HOST: 'connection.info.host',
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::CONNECTION_INFO_PORT
    CONNECTION_INFO_PORT: 'connection.info.port',

    // Error handling — how the core reacts to a critical error, read by CoreComponentContext.
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::CRASH_ON_CRIT_ERROR
    CRASH_ON_CRIT_ERROR: 'error_handling.crash_on_critical_error',
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::SHOW_ERROR_WARNING
    SHOW_ERROR_WARNING: 'error_handling.show_error',
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::SHOW_ERROR_WARNING_INCLUDE_NONCRITICAL
    SHOW_ERROR_WARNING_INCLUDE_NONCRITICAL: 'error_handling.show_error.include_non_critical',
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::SHOW_ERROR_STACKTRACE
    SHOW_ERROR_STACKTRACE: 'error_handling.show_stacktrace',
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::EXCLUDE_CRASHING_FOR_CATEGORIES
    EXCLUDE_CRASHING_FOR_CATEGORIES: 'error_handling.exclude_crashing',
    // AS3: .../src/com/sulake/habbo/configuration/enum/HabboProperty.as::EXCLUDE_WARNINGS_FOR_CATEGORIES
    EXCLUDE_WARNINGS_FOR_CATEGORIES: 'error_handling.exclude_warnings',
} as const;

export type HabboPropertyType = typeof HabboProperty;
export type HabboPropertyKey = (typeof HabboProperty)[keyof typeof HabboProperty];
