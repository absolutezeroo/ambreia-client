/**
 * The identity of a VariableFx status the server is retracting.
 *
 * Where the update message splits its key into two parts, this one packs all four into the single
 * string the wire carries: `"<configId>|<variableId>|<u|f>|<entityId>"`. The variable id is taken
 * as everything *between* the first separator and the second-to-last — it may itself contain a
 * `|`, which is why the AS3 scans from both ends instead of splitting, and why this port does too.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/variablefx/VariableFxStatusRemoveData.as
 */
export class VariableFxStatusRemoveData
{
    // AS3: .../variablefx/VariableFxStatusRemoveData.as::fullKey
    fullKey: string;

    // AS3: .../variablefx/VariableFxStatusRemoveData.as::configId
    configId: number;

    // AS3: .../variablefx/VariableFxStatusRemoveData.as::variableId
    variableId: string;

    // AS3: .../variablefx/VariableFxStatusRemoveData.as::isUserEntity
    isUserEntity: boolean;

    // AS3: .../variablefx/VariableFxStatusRemoveData.as::entityId
    entityId: number;

    // AS3: .../variablefx/VariableFxStatusRemoveData.as::VariableFxStatusRemoveData()
    constructor(fullKey: string)
    {
        const first = fullKey.indexOf('|');
        const last = fullKey.lastIndexOf('|');
        const secondToLast = fullKey.lastIndexOf('|', last - 1);

        this.fullKey = fullKey;
        this.configId = parseInt(fullKey.substring(0, first), 10) || 0;
        this.variableId = fullKey.substring(first + 1, secondToLast);
        this.isUserEntity = fullKey.substring(secondToLast + 1, last) === 'u';
        this.entityId = parseInt(fullKey.substring(last + 1), 10) || 0;
    }
}
