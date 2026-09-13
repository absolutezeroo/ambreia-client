/**
 * The bar width names the server can ask for.
 *
 * `not_applicable` is a real value, not a null: a number display or a heart stack has no width to
 * configure, and the server says so rather than omitting the field.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxWidth.as
 */
export const VariableFxWidth = {
    // AS3: .../variablefx/VariableFxWidth.as::NOT_APPLICABLE
    NOT_APPLICABLE: 'not_applicable',

    // AS3: .../variablefx/VariableFxWidth.as::EXTRA_SMALL (name derived)
    //   The AS3 constant is `_SafeStr_11094`, value "extra_small".
    EXTRA_SMALL: 'extra_small',

    // AS3: .../variablefx/VariableFxWidth.as::SMALL
    SMALL: 'small',

    // AS3: .../variablefx/VariableFxWidth.as::MEDIUM
    MEDIUM: 'medium',

    // AS3: .../variablefx/VariableFxWidth.as::LARGE
    LARGE: 'large',

    // AS3: .../variablefx/VariableFxWidth.as::EXTRA_LARGE
    EXTRA_LARGE: 'extra_large',

    /** Declared and mapped to id 100, but no renderer sizes anything by it. */
    // AS3: .../variablefx/VariableFxWidth.as::BIG_MAHOOSIVE_CHONKY
    BIG_MAHOOSIVE_CHONKY: 'big_mahoosive_chonky'
} as const;
