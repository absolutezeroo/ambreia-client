/**
 * AddonCodes — the server wired-addon type ids returned by each concrete addon's `code` getter. Addons
 * modify how a trigger/action runs (physics, timing, placeholders, filters, evaluation).
 *
 * AS3 declares these as mutable `public static var`; they are never reassigned, so the port makes them
 * `readonly`. Codes 3 and 4 are unused (gaps). Four are obfuscated with no readable counterpart:
 * ACTION_PICKER (1, skip/pick actions), ADDON_CODE_2 (2, no recoverable identity), EXECUTION_LIMITER
 * (5, N executions per time window) and MOVE_PHYSICS (7, the movephysics.* options) — named from their
 * form behavior.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonCodes.as
 */
export class AddonCodes
{
    // AS3: AddonCodes.as::CONDITION_EVALUATION
    public static readonly CONDITION_EVALUATION: number = 0;

    // Name derived: AS3 obfuscated `_SafeStr_10414` (value 1); a skip-actions / pick-amount selector.
    // AS3: AddonCodes.as::ACTION_PICKER
    public static readonly ACTION_PICKER: number = 1;

    // Name derived: AS3 obfuscated `_SafeStr_10415` (value 2); a parameterless addon with no recoverable identity.
    // AS3: AddonCodes.as::ADDON_CODE_2
    public static readonly ADDON_CODE_2: number = 2;

    // Name derived: AS3 obfuscated `_SafeStr_10397` (value 5); an executions-per-time-window limiter.
    // AS3: AddonCodes.as::EXECUTION_LIMITER
    public static readonly EXECUTION_LIMITER: number = 5;

    // AS3: AddonCodes.as::NO_MOVE_ANIMATION
    public static readonly NO_MOVE_ANIMATION: number = 6;

    // Name derived: AS3 obfuscated `_SafeStr_10348` (value 7); the movephysics.* option checkboxes.
    // AS3: AddonCodes.as::MOVE_PHYSICS
    public static readonly MOVE_PHYSICS: number = 7;

    // AS3: AddonCodes.as::CARRY_USERS
    public static readonly CARRY_USERS: number = 8;

    // AS3: AddonCodes.as::ANIMATION_TIME
    public static readonly ANIMATION_TIME: number = 9;

    // AS3: AddonCodes.as::FURNI_SELECTOR_FILTER
    public static readonly FURNI_SELECTOR_FILTER: number = 10;

    // AS3: AddonCodes.as::USER_SELECTOR_FILTER
    public static readonly USER_SELECTOR_FILTER: number = 11;

    // AS3: AddonCodes.as::FURNI_VARIABLE_FILTER
    public static readonly FURNI_VARIABLE_FILTER: number = 12;

    // AS3: AddonCodes.as::USER_VARIABLE_FILTER
    public static readonly USER_VARIABLE_FILTER: number = 13;

    // AS3: AddonCodes.as::USERNAME_PLACEHOLDER
    public static readonly USERNAME_PLACEHOLDER: number = 14;

    // AS3: AddonCodes.as::VARIABLE_PLACEHOLDER
    public static readonly VARIABLE_PLACEHOLDER: number = 15;

    // AS3: AddonCodes.as::VARIABLE_CAPTURER
    public static readonly VARIABLE_CAPTURER: number = 16;

    // AS3: AddonCodes.as::EXECUTE_IN_ORDER
    public static readonly EXECUTE_IN_ORDER: number = 17;

    // AS3: AddonCodes.as::CHEST_ITEM_TYPE_SCANNER
    public static readonly CHEST_ITEM_TYPE_SCANNER: number = 18;

    // AS3: AddonCodes.as::FURNI_NAME_PLACEHOLDER
    public static readonly FURNI_NAME_PLACEHOLDER: number = 19;

    // AS3: AddonCodes.as::CUSTOM_CONTRACT
    public static readonly CUSTOM_CONTRACT: number = 20;

    // AS3: AddonCodes.as::PROJECTILE
    public static readonly PROJECTILE: number = 21;

    // AS3: AddonCodes.as::JUMP_STRENGTH
    public static readonly JUMP_STRENGTH: number = 22;

    // AS3: AddonCodes.as::VARIABLE_TEXT_CONVERTER
    public static readonly VARIABLE_TEXT_CONVERTER: number = 1000;

    // AS3: AddonCodes.as::VARIABLE_LEVEL_UP
    public static readonly VARIABLE_LEVEL_UP: number = 1001;

    // AS3: AddonCodes.as::VARIABLE_TIME_UTIL
    public static readonly VARIABLE_TIME_UTIL: number = 1002;

    // AS3: AddonCodes.as::GLOBAL_PLACEHOLDER
    public static readonly GLOBAL_PLACEHOLDER: number = 2000;

    // AS3: AddonCodes.as::ACHIEVEMENT_ENABLER
    public static readonly ACHIEVEMENT_ENABLER: number = 2001;

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonCodes.as::VARIABLE_FX_HEALTH_POINTS
    public static readonly VARIABLE_FX_HEALTH_POINTS: number = 1200;

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonCodes.as::VARIABLE_FX_PROGRESS_BAR
    public static readonly VARIABLE_FX_PROGRESS_BAR: number = 1201;

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonCodes.as::VARIABLE_FX_LEVELLING_PROGRESS
    public static readonly VARIABLE_FX_LEVELLING_PROGRESS: number = 1202;

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonCodes.as::VARIABLE_FX_STATUS_BAR
    public static readonly VARIABLE_FX_STATUS_BAR: number = 1203;

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonCodes.as::VARIABLE_FX_BOSS_BAR
    public static readonly VARIABLE_FX_BOSS_BAR: number = 1204;

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonCodes.as::VARIABLE_FX_NUMBER_DISPLAY
    public static readonly VARIABLE_FX_NUMBER_DISPLAY: number = 1205;

    // The add-on itself is not ported yet; the code is here because `AddonTypes` is what reports an
    // unported one, and a code with no entry reads exactly like a bug in the dialog.
    // TODO(AS3): port `VariablesWebApiAddon` — sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/VariablesWebApiAddon.as
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonCodes.as::VARIABLES_WEB_API
    public static readonly VARIABLES_WEB_API: number = 2002;
}
