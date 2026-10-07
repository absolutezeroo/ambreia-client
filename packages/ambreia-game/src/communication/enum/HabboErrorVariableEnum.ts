/**
 * Constants for error variable names used in error reporting.
 *
 * These keys are used with ErrorReportStorage to store contextual
 * information about the client state when an error occurs.
 *
 * @see source_as_win63/habbo/tracking/HabboErrorVariableEnum.as
 */
export const HabboErrorVariableEnum = {
    ERROR_VARIABLE_HOST: 'host',
    ERROR_VARIABLE_PORT: 'port',
    ERROR_VARIABLE_IS_FATAL: 'is_fatal',
    ERROR_VARIABLE_SENT_MESSAGE_TIME: 'sent_msg_time',
    ERROR_VARIABLE_SENT_MESSAGE_DATA: 'sent_msg_data',
    ERROR_VARIABLE_RECEIVED_MESSAGE_TIME: 'rece_msg_time',
    ERROR_VARIABLE_RECEIVED_MESSAGE_DATA: 'rece_msg_data',
    ERROR_VARIABLE_CLIENT_START_TIME: 'start_time',
    ERROR_VARIABLE_CLIENT_CRASH_TIME: 'crash_time',
    ERROR_VARIABLE_USER_AGENT: 'agent',
    ERROR_VARIABLE_CAPABILITIES: 'system',
    ERROR_VARIABLE_CONTEXT: 'error_ctx',
    ERROR_VARIABLE_LAST_VISITED_ROOM: 'last_room',
    ERROR_VARIABLE_IS_IN_ROOM: 'in_room',
    ERROR_VARIABLE_FLASH_VERSION: 'flash_version',
    ERROR_VARIABLE_AVERAGE_UPDATE_INTERVAL: 'avg_update',
    ERROR_VARIABLE_MOUSE_UP_TIME: 'mouse_up_time',
    ERROR_VARIABLE_MOUSE_UP_TARGET: 'mouse_up_target',
    ERROR_VARIABLE_MOUSE_CLICK_TIME: 'click_time',
    ERROR_VARIABLE_MOUSE_CLICK_TARGET: 'click_target',
    ERROR_VARIABLE_DEBUG: 'debug',
    ERROR_PARAM_KEY_DATA: 'error_data',
    ERROR_PARAM_KEY_CATEGORY: 'error_cat',
    ERROR_PARAM_KEY_DESCRIPTION: 'error_desc',
} as const;

export type HabboErrorVariable = typeof HabboErrorVariableEnum[keyof typeof HabboErrorVariableEnum];
