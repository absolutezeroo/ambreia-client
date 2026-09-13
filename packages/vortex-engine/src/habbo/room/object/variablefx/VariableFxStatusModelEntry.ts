import type {OrderedMap} from '@core/utils/OrderedMap';

/**
 * One status as the *visualization* keeps it, once the logic side has stamped it with when it
 * arrived and which update it belongs to.
 *
 * Distinct from `VariableFxStatusUpdateData`, which is the wire form: this one carries
 * `createdAt`, `updateId` and `invisible`, none of which the server sends.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/room/object/variablefx/VariableFxStatusModelEntry.as
 */
export class VariableFxStatusModelEntry
{
    // AS3: .../variablefx/VariableFxStatusModelEntry.as::configId
    configId: number;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::variableId
    variableId: string;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::createdAt
    createdAt: number;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::updateId
    updateId: number;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::value
    value: number;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::overrideMinValue
    overrideMinValue: number | null;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::overrideMaxValue
    overrideMaxValue: number | null;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::extra
    extra: OrderedMap | null;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::isInitialize
    isInitialize: boolean;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::invisible
    invisible: boolean;

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::VariableFxStatusModelEntry()
    constructor(
        configId: number,
        variableId: string,
        createdAt: number,
        updateId: number,
        value: number,
        overrideMinValue: number | null,
        overrideMaxValue: number | null,
        extra: OrderedMap | null,
        isInitialize: boolean,
        invisible: boolean = false
    )
    {
        this.configId = configId;
        this.variableId = variableId;
        this.createdAt = createdAt;
        this.updateId = updateId;
        this.value = value;
        this.overrideMinValue = overrideMinValue;
        this.overrideMaxValue = overrideMaxValue;
        this.extra = extra;
        this.isInitialize = isInitialize;
        this.invisible = invisible;
    }

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::clone()
    clone(): VariableFxStatusModelEntry
    {
        return new VariableFxStatusModelEntry(
            this.configId,
            this.variableId,
            this.createdAt,
            this.updateId,
            this.value,
            this.overrideMinValue,
            this.overrideMaxValue,
            // AS3 calls `extra.clone()` unguarded; the constructor allows null, so the port guards
            // rather than throwing where AS3 would have.
            this.extra ? this.extra.clone() : null,
            this.isInitialize,
            this.invisible
        );
    }

    // AS3: .../variablefx/VariableFxStatusModelEntry.as::dispose()
    dispose(): void
    {
        if(this.extra !== null)
        {
            this.extra.dispose();
            this.extra = null;
        }
    }
}
