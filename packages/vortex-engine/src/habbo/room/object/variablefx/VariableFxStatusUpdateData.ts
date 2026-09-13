import {OrderedMap} from '@core/utils/OrderedMap';

/**
 * One live VariableFx *status* — a value for one variable, on one entity, under one config.
 *
 * The wire carries a single packed key rather than the parts: `"<configId>|<variableId>"`, split
 * here exactly as the AS3 splits it. `entityId` and `isUserEntity` come from the packet as their
 * own fields, which is why this key is only two parts where the remove message's is four.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/room/object/variablefx/VariableFxStatusUpdateData.as
 */
export class VariableFxStatusUpdateData
{
    // AS3: .../variablefx/VariableFxStatusUpdateData.as::statusKey
    statusKey: string;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::configId
    configId: number;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::variableId
    variableId: string;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::isInitialize
    isInitialize: boolean;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::isUserEntity
    isUserEntity: boolean;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::entityId
    entityId: number;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::value
    value: number;

    /**
     * Null when the server sends no override and the config's default applies. `Object` in AS3 for
     * exactly that reason — a nullable Number — so the port keeps it nullable rather than
     * collapsing it to 0, which is a legitimate bound.
     */
    // AS3: .../variablefx/VariableFxStatusUpdateData.as::overrideMinValue
    overrideMinValue: number | null;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::overrideMaxValue
    overrideMaxValue: number | null;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::extra
    extra: OrderedMap;

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::VariableFxStatusUpdateData()
    constructor(
        statusKey: string,
        isInitialize: boolean,
        isUserEntity: boolean,
        entityId: number,
        value: number,
        overrideMinValue: number | null,
        overrideMaxValue: number | null,
        extra: OrderedMap | null
    )
    {
        this.statusKey = statusKey;
        this.configId = VariableFxStatusUpdateData.parseConfigId(statusKey);
        this.variableId = VariableFxStatusUpdateData.parseVariableId(statusKey);
        this.isInitialize = isInitialize;
        this.isUserEntity = isUserEntity;
        this.entityId = entityId;
        this.value = value;
        this.overrideMinValue = overrideMinValue;
        this.overrideMaxValue = overrideMaxValue;
        this.extra = extra ?? new OrderedMap();
    }

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::parseConfigId()
    private static parseConfigId(statusKey: string): number
    {
        return parseInt(statusKey.split('|')[0] ?? '', 10) || 0;
    }

    // AS3: .../variablefx/VariableFxStatusUpdateData.as::parseVariableId()
    private static parseVariableId(statusKey: string): string
    {
        const separator = statusKey.indexOf('|');

        return separator < 0 ? '' : statusKey.substring(separator + 1);
    }
}
