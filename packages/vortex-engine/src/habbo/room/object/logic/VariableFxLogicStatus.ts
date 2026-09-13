import {OrderedMap} from '@core/utils/OrderedMap';

/**
 * One live VariableFx value as the *object's logic* holds it, between the wire and the
 * visualization.
 *
 * It carries three stamps the server never sends. `createdAt` survives an update — an existing
 * status keeps the moment it first appeared — while `updatedAt` moves, and `showUntil` is the end
 * of the visibility window a change opened.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/logic/VariableFxLogicStatus.as
 */
export class VariableFxLogicStatus
{
    // AS3: .../room/object/logic/VariableFxLogicStatus.as::configId
    configId: number;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::variableId
    variableId: string;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::value
    value: number;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::overrideMinValue
    overrideMinValue: number | null;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::overrideMaxValue
    overrideMaxValue: number | null;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::extra
    extra: OrderedMap | null;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::isInitialize
    isInitialize: boolean;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::createdAt
    createdAt: number;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::updatedAt
    updatedAt: number;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::updateId
    updateId: number;

    /**
     * The timestamp this status stops being shown, for a config in windowed mode. Zero means no
     * window is open. Set by `updateVariableFxVisibilityWindow()` and read by
     * `isVariableFxStatusVisible()`; nothing else touches it.
     */
    // AS3: .../room/object/logic/VariableFxLogicStatus.as::showUntil
    //   Name derived: the AS3 field is `_SafeStr_6424`, obfuscated. Named from its only two uses —
    //   assigned `now + config.showDuration`, and tested `> now`.
    showUntil: number;

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::VariableFxLogicStatus()
    constructor(
        configId: number,
        variableId: string,
        value: number,
        overrideMinValue: number | null,
        overrideMaxValue: number | null,
        extra: OrderedMap | null,
        isInitialize: boolean,
        createdAt: number
    )
    {
        this.configId = configId;
        this.variableId = variableId;
        this.value = value;
        this.overrideMinValue = overrideMinValue;
        this.overrideMaxValue = overrideMaxValue;
        this.extra = extra ?? new OrderedMap();
        this.isInitialize = isInitialize;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
        this.updateId = 0;
        this.showUntil = 0;
    }

    // AS3: .../room/object/logic/VariableFxLogicStatus.as::dispose()
    dispose(): void
    {
        if(this.extra !== null)
        {
            this.extra.dispose();
            this.extra = null;
        }
    }
}
