import {OrderedMap} from '@core/utils/OrderedMap';

/**
 * The value a renderer draws, and the bounds it is drawn against when the server overrode them.
 *
 * The `effective*` accessors are the point of the class: an override that is present but not a
 * finite number is treated as absent, so the config's default applies rather than a NaN reaching
 * the progress calculation and blanking the effect.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxStatusData.as
 */
export class VariableFxStatusData
{
    // AS3: .../variablefx/VariableFxStatusData.as::value
    value: number;

    // AS3: .../variablefx/VariableFxStatusData.as::overrideMinValue
    overrideMinValue: number | null;

    // AS3: .../variablefx/VariableFxStatusData.as::overrideMaxValue
    overrideMaxValue: number | null;

    // AS3: .../variablefx/VariableFxStatusData.as::extra
    extra: OrderedMap;

    // AS3: .../variablefx/VariableFxStatusData.as::isInitialize
    isInitialize: boolean;

    // AS3: .../variablefx/VariableFxStatusData.as::VariableFxStatusData()
    constructor(
        value: number,
        overrideMinValue: number | null = null,
        overrideMaxValue: number | null = null,
        extra: OrderedMap | null = null,
        isInitialize: boolean = false
    )
    {
        this.value = value;
        this.overrideMinValue = overrideMinValue;
        this.overrideMaxValue = overrideMaxValue;
        this.extra = extra ?? new OrderedMap();
        this.isInitialize = isInitialize;
    }

    // AS3: .../variablefx/VariableFxStatusData.as::get effectiveOverrideMinValue()
    get effectiveOverrideMinValue(): number | null
    {
        return this.overrideMinValue !== null && Number.isFinite(this.overrideMinValue)
            ? this.overrideMinValue
            : null;
    }

    // AS3: .../variablefx/VariableFxStatusData.as::get effectiveOverrideMaxValue()
    get effectiveOverrideMaxValue(): number | null
    {
        return this.overrideMaxValue !== null && Number.isFinite(this.overrideMaxValue)
            ? this.overrideMaxValue
            : null;
    }
}
